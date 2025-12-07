require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
task("sync-abi", "Copies ABIs to frontend")
.setAction(async () => {
  const fs = require("fs");
  const path = require("path");

  const sources = ["LendingPool", "ScoreOracle", "SoulBound"];
  const abiFolder = path.join(__dirname, "frontend/contracts_abi");

  if (!fs.existsSync(abiFolder)) {
    fs.mkdirSync(abiFolder, { recursive: true });
  }

  for (const name of sources) {
    const src = path.join(__dirname, `artifacts/contracts/${name}.sol/${name}.json`);
    const dst = path.join(abiFolder, `${name}.json`);

    if (!fs.existsSync(src)) {
      console.log(`ABI not found for ${name}. Run "npx hardhat compile" first.`);
      continue;
    }

    fs.copyFileSync(src, dst);
    console.log(`Synced ABI: ${name}.json`);
  }

  console.log("✨ ABI sync complete.");
});

module.exports = {
  solidity: "0.8.19",
  networks: {
    coston2: {
      url: "https://coston2-api.flare.network/ext/bc/C/rpc",
      chainId: 114,
      accounts: [process.env.PRIVATE_KEY]
    },
    flare: {
      url: "https://flare-api.flare.network/ext/bc/C/rpc",
      chainId: 14,
      accounts: []
    }
  }
};
