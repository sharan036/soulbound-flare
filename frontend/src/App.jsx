import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import LendingPoolABI from "../../contracts_abi/LendingPool.json";
import SoulBoundABI from "../../contracts_abi/SoulBound.json";
import "./styles.css";
import NeonToast from "./components/NeonToast";
import NeonDropdown from "./NeonDropdown";
import GuideTour from "./components/GuideTour";

const TOUR_STEPS = [
  { id: "network", title: "Choose Network", text: "Switch between Local, Flare, and Mainnet. Contracts + relayer change automatically.", target: ".network-dropdown" },
  { id: "connect", title: "Connect Wallet", text: "Click here to connect your MetaMask wallet.", target: ".btn-connect-wallet" },
  { id: "sbt", title: "Mint SoulBound Token", text: "Mint your identity-bound SBT that allows score and borrowing.", target: ".btn-mint-sbt" },
  { id: "score", title: "Trigger Score", text: "Generate a mock AI score and store it on backend or chain.", target: ".btn-trigger-score" },
  { id: "borrow", title: "Borrow or Repay", text: "Deposit collateral → Borrow mUSD → Repay using gasless relayer.", target: ".form-row" }
];

const NETWORKS = {
  local: {
    key: "local",
    label: "Local Testnet",
    chainId: 31337,
    chainIdHex: "0x7A69",
    rpcUrl: import.meta.env.VITE_RPC_LOCAL || "http://localhost:8545",
    relayerUrl: import.meta.env.VITE_RELAYER_LOCAL || "http://localhost:3001",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_LOCAL || import.meta.env.VITE_LENDING_POOL || "",
      soulbound: import.meta.env.VITE_SOULBOUND_LOCAL || import.meta.env.VITE_SOULBOUND || "",
      collateral: import.meta.env.VITE_COLLATERAL_LOCAL || import.meta.env.VITE_COLLATERAL || "",
      stable: import.meta.env.VITE_STABLE_LOCAL || import.meta.env.VITE_STABLE || "",
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_LOCAL || import.meta.env.VITE_SCORE_ORACLE || ""
    }
  },

  flare: {
    key: "flare",
    label: "Flare",
    chainId: Number(import.meta.env.VITE_CHAINID_FLARE || 14),
    chainIdHex: import.meta.env.VITE_CHAINID_FLARE_HEX || "0x0E", // 14 hex
    rpcUrl: import.meta.env.VITE_RPC_FLARE || "https://flare-api.flare.network/ext/bc/C/rpc",
    relayerUrl: import.meta.env.VITE_RELAYER_FLARE || "",
    nativeCurrency: { name: "FLR", symbol: "FLR", decimals: 18 },
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_FLARE || "",
      soulbound: import.meta.env.VITE_SOULBOUND_FLARE || "",
      collateral: import.meta.env.VITE_COLLATERAL_FLARE || "",
      stable: import.meta.env.VITE_STABLE_FLARE || "",
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_FLARE || ""
    }
  },

  mainnet: {
    key: "mainnet",
    label: "Mainnet",
    chainId: Number(import.meta.env.VITE_CHAINID_MAINNET || 1),
    chainIdHex: import.meta.env.VITE_CHAINID_MAINNET_HEX || "0x1",
    rpcUrl: import.meta.env.VITE_RPC_MAINNET || "",
    relayerUrl: import.meta.env.VITE_RELAYER_MAINNET || "",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_MAINNET || "",
      soulbound: import.meta.env.VITE_SOULBOUND_MAINNET || "",
      collateral: import.meta.env.VITE_COLLATERAL_MAINNET || "",
      stable: import.meta.env.VITE_STABLE_MAINNET || "",
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_MAINNET || ""
    }
  }
};

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [connectedChainId, setConnectedChainId] = useState(null);

  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");

  const [amount, setAmount] = useState("0.1");
  const [balance, setBalance] = useState("0.0");
  const [borrowLimit, setBorrowLimit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => !localStorage.getItem("tour_done"));
  const [activeNetKey, setActiveNetKey] = useState(() => {
    return localStorage.getItem("active_net") || "local";
  });
  const activeNet = useMemo(() => NETWORKS[activeNetKey], [activeNetKey]);

  /** TOASTS */
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((msg, type = "success", ttl = 4200) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, msg, type }]);
    if (ttl > 0) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  /** DERIVED CONTRACTS (dynamic by network) */
  const CONTRACTS = useMemo(() => ({
    lendingPool: activeNet.contracts.lendingPool || "",
    soulbound: activeNet.contracts.soulbound || "",
    scoreOracle: activeNet.contracts.scoreOracle || "",
    collateral: activeNet.contracts.collateral || "",
    stable: activeNet.contracts.stable || ""
  }), [activeNet]);

  /** UTILS: write network selection to localStorage */
  useEffect(() => {
    localStorage.setItem("active_net", activeNetKey);
  }, [activeNetKey]);

  /** PROVIDER & METAMASK HANDLERS */
  async function connect() {
    if (!window.ethereum) {
      pushToast("MetaMask not found — install it", "error");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const p = new ethers.providers.Web3Provider(window.ethereum, "any");
      const s = p.getSigner();

      setProvider(p);
      setSigner(s);

      const addr = await s.getAddress();
      setAddress(addr);

      // get chain id
      const net = await p.getNetwork();
      setConnectedChainId(net.chainId);

      // attach listeners once
      attachEthereumListeners();

      // warn if MetaMask chain differs from activeNet
      if (net.chainId !== activeNet.chainId) {
        pushToast(`MetaMask is on chain ${net.chainId}. UI set to ${activeNet.label}`, "warning", 6000);
      } else {
        pushToast("Wallet connected", "success");
      }
    } catch (err) {
      console.error("connect err", err);
      pushToast("Wallet connection failed", "error");
    }
  }

  // Attach metamask events (change accounts / chain)
  function attachEthereumListeners() {
    if (!window.ethereum || window.ethereum._neon_listeners_attached) return;
    window.ethereum.on("accountsChanged", (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAddress("");
        setSigner(null);
        setProvider(null);
        pushToast("Disconnected", "error");
      } else {
        setAddress(accounts[0]);
        // provider remains same; refresh signer
        const p = new ethers.providers.Web3Provider(window.ethereum, "any");
        setProvider(p);
        setSigner(p.getSigner());
        pushToast("Account switched", "info");
      }
    });

    window.ethereum.on("chainChanged", (chainIdHex) => {
      const cid = Number(chainIdHex);
      setConnectedChainId(cid);
      // if chain changed and doesn't match selected network, warn
      if (cid !== activeNet.chainId) {
        pushToast(`Wallet switched to chain ${cid}. UI uses ${activeNet.label}`, "warning", 6000);
      } else {
        pushToast(`Wallet switched to ${activeNet.label}`, "success", 3000);
      }
    });

    window.ethereum._neon_listeners_attached = true;
  }

  // Ensure MetaMask is on the activeNet; attempt to switch (and add chain if necessary)
  async function ensureCorrectNetwork() {
    if (!window.ethereum) throw new Error("No wallet detected");

    const desiredChainId = activeNet.chainId;
    // If provider is set we can check connectedChainId, else ask provider
    try {
      const hex = activeNet.chainIdHex || `0x${desiredChainId.toString(16)}`;
      // request switch
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }]
      });
      // set provider state refresh after switch
      if (provider) {
        const net = await provider.getNetwork();
        setConnectedChainId(net.chainId);
      } else {
        const p = new ethers.providers.Web3Provider(window.ethereum, "any");
        setProvider(p);
        setSigner(p.getSigner());
        const net = await p.getNetwork();
        setConnectedChainId(net.chainId);
      }
      return true;
    } catch (switchErr) {
      // 4902 error = chain not added to wallet -> try to add
      const errorCode = switchErr?.code;
      if (errorCode === 4902 || (switchErr && /Unrecognized chain ID/i.test(String(switchErr.message || "")))) {
        // attempt to add chain
        try {
          const chainParams = {
            chainId: activeNet.chainIdHex || `0x${activeNet.chainId.toString(16)}`,
            chainName: activeNet.label,
            nativeCurrency: activeNet.nativeCurrency || { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [activeNet.rpcUrl],
            blockExplorerUrls: []
          };
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [chainParams] });
          // after adding, switch again
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainParams.chainId }] });
          pushToast(`Added and switched to ${activeNet.label}`, "success");
          return true;
        } catch (addErr) {
          console.error("wallet_addEthereumChain failed", addErr);
          pushToast("Wallet cannot add this chain automatically. Please add it manually in MetaMask.", "error");
          throw addErr;
        }
      }
      // user rejected or other — bubble up
      console.error("ensureCorrectNetwork switch error", switchErr);
      throw switchErr;
    }
  }

  /** READS: balance, history, borrowLimit */
  async function fetchBalance() {
    if (!provider || !address) return;
    try {
      const bal = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error("balance err", err);
    }
  }

  async function fetchHistoryAndLimit() {
    if (!address) return;

    // fetch history from relayer for active net
    try {
      const relayerUrl = activeNet.relayerUrl || "http://localhost:3001";
      const res = await fetch(`${relayerUrl.replace(/\/$/, "")}/score-history/${address}`);
      const j = await res.json();
      setHistory(j.history || []);
      if (j.history?.length) setScore(j.history[j.history.length - 1].score);
    } catch (err) {
      console.error("history fetch err", err);
    }

    // borrow limit: read from the network rpc (non-signing)
    try {
      const rpc = activeNet.rpcUrl || "http://localhost:8545";
      const readProvider = new ethers.providers.JsonRpcProvider(rpc);
      if (!CONTRACTS.lendingPool) {
        setBorrowLimit(null);
        return;
      }
      const pool = new ethers.Contract(CONTRACTS.lendingPool, LendingPoolABI, readProvider);
      const limit = await pool.getBorrowLimit(address);
      setBorrowLimit(ethers.utils.formatUnits(limit, 18));
    } catch (err) {
      setBorrowLimit(null);
    }
  }

  // Run periodic refreshes when address or network changes
  useEffect(() => {
    let t;
    if (address) {
      fetchHistoryAndLimit();
      fetchBalance();
      t = setInterval(() => {
        fetchHistoryAndLimit();
        fetchBalance();
      }, 6000);
    }
    return () => clearInterval(t);
    // disabled exhaustive deps to avoid loops
    // eslint-disable-next-line
  }, [address, activeNetKey]);

  /** SAFE TRANSACTIONS / helper wrapper
   * Use ensureCorrectNetwork() before any on-chain user action that opens MetaMask
   */
  async function safeTxWrapper(fn /* async function that performs action */) {
    if (!window.ethereum) {
      pushToast("MetaMask not found", "error");
      throw new Error("no wallet");
    }

    try {
      await ensureCorrectNetwork();
    } catch (err) {
      // user refused to switch or wallet cannot do it
      pushToast("Please switch your wallet network to " + activeNet.label, "error");
      throw err;
    }

    // Refresh provider & signer to reflect the (possibly) switched chain
    const p = new ethers.providers.Web3Provider(window.ethereum, "any");
    setProvider(p);
    setSigner(p.getSigner());

    try {
      return await fn(p, p.getSigner());
    } catch (err) {
      console.error("safeTxWrapper action error", err);
      throw err;
    }
  }

  /** ACTIONS: mintSBT, triggerScore, deposit, borrow, repay, relayer calls */

  async function mintSBT() {
    if (!address) return pushToast("Connect wallet", "error");
    try {
      setLoading(true);
      await safeTxWrapper(async (p, s) => {
        if (!CONTRACTS.soulbound) throw new Error("SoulBound contract address not set for this network.");
        const sbt = new ethers.Contract(CONTRACTS.soulbound, SoulBoundABI, s);
        const tx = await sbt.mint(address);
        await tx.wait();
        pushToast("SBT minted", "success");
        await fetchHistoryAndLimit();
      });
    } catch (err) {
      console.error("mint err", err);
      if (err && err.code === 4001) pushToast("User rejected transaction", "error");
      else pushToast("Mint failed: " + (err.message || "unknown"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function triggerScore() {
    if (!address) return pushToast("Connect wallet", "error");
    try {
      setLoading(true);
      // no wallet action needed here, backend handles
      const relayerUrl = activeNet.relayerUrl || "http://localhost:3001";
      const res = await fetch(`${relayerUrl.replace(/\/$/, "")}/trigger-score`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: address })
      });
      const j = await res.json();
      setScore(j?.score || null);
      if (j?.score) pushToast("Score posted: " + j.score, "success");
      else pushToast("Score failed", "error");
      fetchHistoryAndLimit();
    } catch (err) {
      console.error("trigger score err", err);
      pushToast("Score trigger failed", "error");
    } finally {
      setLoading(false);
    }
  }

  // EIP-712 relayer: show preview and sign typed data
  async function safeSendRelayedTx(to, data, value) {
    if (!address) return pushToast("Connect wallet", "error");

    try {
      await safeTxWrapper(async (p, s) => {
        // get relayer URL & nonce
        const relayerUrl = activeNet.relayerUrl || "http://localhost:3001";
        const nonceRes = await fetch(`${relayerUrl.replace(/\/$/, "")}/nonce/${address}`);
        const nonceJson = await nonceRes.json();
        const nonce = nonceJson.nonce || 0;

        // Build typed data domain (use activeNet.chainId)
        const domain = {
          name: "MODRAN Relayer",
          version: "1",
          chainId: activeNet.chainId,
          verifyingContract: to
        };

        const types = {
          RelayRequest: [
            { name: "to", type: "address" },
            { name: "data", type: "bytes" },
            { name: "value", type: "uint256" },
            { name: "user", type: "address" },
            { name: "nonce", type: "uint256" }
          ]
        };

        const request = { to, data, value: value || 0, user: address, nonce };

        // human-friendly preview
        let humanAction = data.slice(0, 80) + "...";
        try {
          const iface = new ethers.utils.Interface(LendingPoolABI);
          const parsed = iface.parseTransaction({ data });
          humanAction = `${parsed.name}(${Array.from(parsed.args).map(a => String(a)).join(", ")})`;
        } catch (_) { /* ignore parsing error */ }

        const preview = `Network: ${activeNet.label}\nAction: ${humanAction}\nContract: ${to}\nValue: ${value || 0}\nNonce: ${nonce}\n\nApprove to sign this relayer request?`;
        if (!window.confirm(preview)) {
          pushToast("User cancelled", "error");
          return;
        }

        pushToast("Signing relayer request...", "success", 1200);
        const signature = await s._signTypedData(domain, types, request);

        // post to relayer
        const res = await fetch(`${relayerUrl.replace(/\/$/, "")}/relayTyped`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...request, signature, domain })
        });
        const j = await res.json();
        if (!j.ok) {
          console.error("relay failed response", j);
          pushToast("Relay failed: " + (j.error || j.detail || "unknown"), "error");
          return;
        }
        pushToast("Relayed tx: " + j.txHash, "success");
        setStatus("Last TX: " + j.txHash);
      });
    } catch (err) {
      console.error("safeSendRelayedTx err", err);
      if (err && err.code === 4001) pushToast("User rejected signature", "error");
      else pushToast("Relay error", "error");
      throw err;
    }
  }

  /** Collateral / Borrow / Repay flows (use relayer) */
  async function depositCollateral() {
    if (!address) return pushToast("Connect wallet", "error");
    try {
      setLoading(true);
      await safeTxWrapper(async (p, s) => {
        if (!CONTRACTS.collateral) throw new Error("Collateral not set for this network");
        const token = new ethers.Contract(CONTRACTS.collateral, [
          { inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "mintTo", outputs: [], stateMutability: "nonpayable", type: "function" },
          { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }
        ], s);

        const amt = ethers.utils.parseUnits(amount, 18);
        await (await token.mintTo(address, amt)).wait();
        await (await token.approve(CONTRACTS.lendingPool, amt)).wait();

        const iface = new ethers.utils.Interface(LendingPoolABI);
        const data = iface.encodeFunctionData("addCollateral", [amt]);
        await safeSendRelayedTx(CONTRACTS.lendingPool, data, 0);
        pushToast("Collateral deposited", "success");
        fetchHistoryAndLimit();
      });
    } catch (err) {
      console.error("deposit err", err);
      pushToast("Deposit failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function borrow() {
    if (!address) return pushToast("Connect wallet", "error");
    try {
      setLoading(true);
      const amt = ethers.utils.parseUnits(amount, 18);
      const iface = new ethers.utils.Interface(LendingPoolABI);
      const data = iface.encodeFunctionData("borrow", [amt]);
      await safeSendRelayedTx(CONTRACTS.lendingPool, data, 0);
      pushToast("Borrow requested", "success");
      fetchHistoryAndLimit();
    } catch (err) {
      console.error("borrow err", err);
      pushToast("Borrow failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function repay() {
    if (!address) return pushToast("Connect wallet", "error");
    try {
      setLoading(true);
      if (!CONTRACTS.stable) throw new Error("Stable contract not set for this network");
      const stable = new ethers.Contract(CONTRACTS.stable, [
        { inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "mintTo", outputs: [], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }
      ], signer);

      const amt = ethers.utils.parseUnits(amount, 18);
      await (await stable.mintTo(address, amt)).wait();
      await (await stable.approve(CONTRACTS.lendingPool, amt)).wait();

      const iface = new ethers.utils.Interface(LendingPoolABI);
      const data = iface.encodeFunctionData("repay", [amt]);
      await safeSendRelayedTx(CONTRACTS.lendingPool, data, 0);
      pushToast("Repay relayed", "success");
      fetchHistoryAndLimit();
    } catch (err) {
      console.error("repay err", err);
      pushToast("Repay failed", "error");
    } finally {
      setLoading(false);
    }
  }

  /** UI small helpers */
  function ScoreBars({ items }) {
    const last = (items || []).slice(-8);
    const max = 1000;
    return (
      <div className="bars">
        {last.length === 0 && <div className="muted">No score history</div>}
        {last.map((h, i) => (
          <div key={i} className="bar-wrap">
            <div className="bar" style={{ height: Math.max(6, (h.score / max) * 100) + "%" }} title={String(h.score)} />
          </div>
        ))}
      </div>
    );
  }

  /** Render */
  return (
    <div className="app-bg premium-bg">
      <div className="toast-wrapper" role="status" aria-live="polite">
        {toasts.map((t) => (
          <NeonToast key={t.id} type={t.type} onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))}>
            {t.msg}
          </NeonToast>
        ))}
      </div>

      <div className="container premium">
        <header className="topbar">
          <div className="brand">
            <div className="logo-glow">S</div>
            <div>
              <div className="brand-title">MODRAN</div>
              <div className="brand-sub">SoulBound Lending • Flare</div>
            </div>
          </div>

          <div className="top-actions" style={{ gap: 12 }}>
            <NeonDropdown
              activeNetKey={activeNetKey}
              setActiveNetKey={(k) => {
                setActiveNetKey(k);
                pushToast(`Switched to ${NETWORKS[k].label}`, "success");
              }}
              networks={NETWORKS}
            />

            {!address ? (
              <button className="btn neon btn-connect-wallet" onClick={connect}>Connect Wallet</button>
            ) : (
              <>
                <div className="addr" title={address}>
                  <div className="dot" />
                  <div>{address.slice(0, 6)}...{address.slice(-4)}</div>
                </div>
                <div className="small muted">ETH: {balance}</div>
              </>
            )}
          </div>
        </header>

        <main className="grid">
          <aside className="sidecard">
            <div className="card glass">
              <h4>Wallet</h4>
              {!address ? <div className="muted">Not connected</div> : (
                <>
                  <div className="addr-large small-wrap">{address}</div>
                  <div className="muted">Balance: {balance} {activeNet.label === "Flare" ? "FLR/ETH" : "ETH"}</div>
                </>
              )}

              <div style={{ marginTop: 12 }}>
                <button className="btn outline btn-mint-sbt" onClick={mintSBT} disabled={loading}>Mint SBT</button>
                <button className="btn btn-trigger-score" onClick={triggerScore} disabled={loading} style={{ marginLeft: 8 }}>Trigger Score</button>
              </div>
            </div>

            <div className="card glass mt">
              <h4>Score</h4>
              <div className="score-row">
                <div className="score-value">{score ?? "—"}</div>
                <div className="score-pill">{borrowLimit ? `${parseFloat(borrowLimit).toFixed(2)} mUSD` : "Limit: —"}</div>
              </div>

              <ScoreBars items={history} />

              <div className="muted small" style={{ marginTop: 8 }}>Recent updates shown above</div>
            </div>

            <div className="card glass mt">
              <h4>Relayer</h4>
              <div className="muted">Relayer: {activeNet.relayerUrl || "local default"}</div>
              <div className="mt small">Network: <span className="green">{activeNet.label}</span></div>
            </div>
          </aside>

          <section className="main">
            <div className="card glass hero premium-hero">
              <div className="hero-left">
                <h3>Collateral & Borrow</h3>
                <p className="muted small">Deposit FAssets → Borrow mUSD → Repay via relayer</p>

                <div className="form-row" style={{ alignItems: "center" }}>
                  <input className="input big" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <div className="form-actions">
                    <button className="btn" onClick={depositCollateral} disabled={loading}>Deposit</button>
                    <button className="btn neon" onClick={borrow} disabled={loading}>Borrow</button>
                    <button className="btn outline" onClick={repay} disabled={loading}>Repay</button>
                  </div>
                </div>

                <div className="muted" style={{ marginTop: 10 }}>Tip: switch network using the dropdown above.</div>
              </div>

              <div className="hero-right">
                <div className="card small glass mini">
                  <div className="muted">Borrow Limit</div>
                  <div className="big-number">{borrowLimit ? `${parseFloat(borrowLimit).toFixed(4)} mUSD` : "—"}</div>
                </div>

                <div className="card small glass mini mt">
                  <div className="muted">Last Tx</div>
                  <div className="muted small">{status || "None"}</div>
                </div>
              </div>
            </div>

            <div className="card glass mt">
              <h3>Score History</h3>
              <div className="history">
                {history.length === 0 && <div className="muted">No score history — trigger score to simulate</div>}
                {history.map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-left">
                      <div className="time">{new Date(h.timestamp).toLocaleTimeString()}</div>
                      <div className="reporter muted small">{h.reporter}</div>
                    </div>
                    <div className="history-right">
                      <div className="history-score">{h.score}</div>
                      <div className="history-bar"><div style={{ width: (h.score / 10) + "%" }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass mt">
              <h3>Activity Steps</h3>
              <ol className="muted small">
                <li>Switch network via dropdown (Local / Flare / Mainnet)</li>
                <li>Connect Wallet</li>
                <li>Mint SBT (identity)</li>
                <li>Trigger score (AI mock)</li>
                <li>Deposit collateral → Borrow → Repay using relayer</li>
              </ol>
            </div>
          </section>
        </main>

        <footer className="foot">
          <div>MODRAN • SoulBound Lending • Flare Hackathon</div>
          <div className="muted">Built with ♥ — DIL</div>
        </footer>
      </div>

      <GuideTour
        steps={TOUR_STEPS}
        open={tourOpen}
        onClose={() => { localStorage.setItem("tour_done", "1"); setTourOpen(false); }}
      />
    </div>
  );
}
