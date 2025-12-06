const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const RPC = process.env.RPC_URL || "http://localhost:8545";
const provider = new ethers.providers.JsonRpcProvider(RPC);

const scoreOracleAddr = process.env.SCORE_ORACLE_ADDRESS || "";
const scoreOracleAbi = [
  "function postScore(address user, uint256 score)",
  "function getScore(address)",
];

const relayerKey = process.env.RELAYER_PRIVATE_KEY || "";
if (!relayerKey) {
  console.warn(
    "RELAYER_PRIVATE_KEY not set in .env - relay endpoints will be disabled"
  );
}
const relayer = relayerKey ? new ethers.Wallet(relayerKey, provider) : null;
const scoreOracle =
  scoreOracleAddr && relayer
    ? new ethers.Contract(scoreOracleAddr, scoreOracleAbi, relayer)
    : null;

const scoreHistory = {};
const nonces = {};

function computeScoreMock(user) {
  const v = ethers.BigNumber.from(user).mod(1000).toNumber();
  const score = 400 + (v % 600);
  return score;
}

app.post("/trigger-score", async (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "user required" });

  const score = computeScoreMock(user);

  if (!scoreOracle) {
    if (!scoreHistory[user]) scoreHistory[user] = [];
    scoreHistory[user].push({ score, timestamp: Date.now(), reporter: "local" });
    return res.json({ ok: true, score });
  }

  const tx = await scoreOracle.postScore(user, score);
  await tx.wait();

  if (!scoreHistory[user]) scoreHistory[user] = [];
  scoreHistory[user].push({ score, timestamp: Date.now(), reporter: relayer.address });

  res.json({ ok: true, score });
});

app.get("/score-history/:user", async (req, res) => {
  const user = req.params.user;
  res.json({ history: scoreHistory[user] || [] });
});

app.get("/nonce/:user", (req, res) => {
  const user = req.params.user;
  if (!nonces[user]) nonces[user] = 0;
  res.json({ nonce: nonces[user] });
});

app.post("/relay", async (req, res) => {
  if (!relayer) return res.status(500).json({ error: "relayer not configured" });
  const { to, data, value, user, nonce, signature } = req.body;
  if (!to || !data || !user || nonce === undefined || !signature) {
    return res.status(400).json({ error: "to,data,user,nonce,signature required" });
  }

  const hash = ethers.utils.solidityKeccak256(
    ["address", "bytes", "uint256", "address", "uint256"],
    [to, data, value || 0, user, nonce]
  );

  let recovered;
  try {
    recovered = ethers.utils.verifyMessage(ethers.utils.arrayify(hash), signature);
  } catch (e) {
    console.error("verifyMessage error:", e);
    return res.status(400).json({ error: "invalid signature format" });
  }

  if (recovered.toLowerCase() !== user.toLowerCase()) {
    return res.status(403).json({ error: "signature does not match user" });
  }

  if (!nonces[user]) nonces[user] = 0;
  if (nonce !== nonces[user]) {
    return res.status(400).json({ error: "invalid nonce", expected: nonces[user] });
  }
  nonces[user]++;

  try {
    const tx = await relayer.sendTransaction({ to, data, value: value || 0 });
    await tx.wait();
    res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error("relay send error", err);
    res.status(500).json({ error: "relay failed", detail: err.message });
  }
});

app.post("/relayTyped", async (req, res) => {
  if (!relayer) return res.status(500).json({ error: "relayer not configured" });

  const { to, data, value, user, nonce, signature, domain: domainOverride } = req.body;
  if (!to || !data || !user || nonce === undefined || !signature) {
    return res.status(400).json({ error: "to,data,user,nonce,signature required" });
  }

  try {
    if (!nonces[user]) nonces[user] = 0;
    if (nonce !== nonces[user]) {
      return res.status(400).json({ error: "invalid nonce", expected: nonces[user] });
    }

    const network = await provider.getNetwork();
    const chainId = network.chainId || 1;

    const domain = domainOverride || {
      name: "MODRAN Relayer",
      version: "1",
      chainId: chainId,
    };

    const types = {
      RelayRequest: [
        { name: "to", type: "address" },
        { name: "data", type: "bytes" },
        { name: "value", type: "uint256" },
        { name: "user", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const valueObj = {
      to,
      data,
      value: value || 0,
      user,
      nonce,
    };

    let recovered;
    try {
      recovered = ethers.utils.verifyTypedData(domain, types, valueObj, signature);
    } catch (e) {
      console.error("verifyTypedData error:", e);
      return res.status(400).json({ error: "invalid typed signature or domain mismatch", detail: e.message });
    }

    if (recovered.toLowerCase() !== user.toLowerCase()) {
      return res.status(403).json({ error: "signature does not match user" });
    }

    nonces[user]++;

    try {
      const tx = await relayer.sendTransaction({
        to,
        data,
        value: value || 0,
      });
      await tx.wait();
      return res.json({ ok: true, txHash: tx.hash });
    } catch (err) {
      console.error("relay send error", err);
      return res.status(500).json({ error: "relay failed", detail: err.message });
    }
  } catch (err) {
    console.error("relayTyped unexpected error:", err);
    return res.status(500).json({ error: "internal error", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Backend scorer running on", PORT));
