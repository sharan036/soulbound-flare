const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with", deployer.address);

    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const stable = await MockERC20.deploy("MockUSD", "mUSD", hre.ethers.utils.parseUnits("1000000", 18));
    await stable.deployed();

    const collateral = await MockERC20.deploy("MockFAsset", "mFA", hre.ethers.utils.parseUnits("1000000", 18));
    await collateral.deployed();

    const MockFTSO = await hre.ethers.getContractFactory("MockFTSO");
    const ftso = await MockFTSO.deploy();
    await ftso.deployed();

    const SoulBound = await hre.ethers.getContractFactory("SoulBound");
    const sbt = await SoulBound.deploy();
    await sbt.deployed();

    const ScoreOracle = await hre.ethers.getContractFactory("ScoreOracle");
    const oracle = await ScoreOracle.deploy();
    await oracle.deployed();

    const LendingPool = await hre.ethers.getContractFactory("LendingPool");
    const pool = await LendingPool.deploy(stable.address, collateral.address, oracle.address, ftso.address);
    await pool.deployed();

    console.log("Mock stable:", stable.address);
    console.log("Collateral token:", collateral.address);
    console.log("MockFTSO:", ftso.address);
    console.log("SoulBound:", sbt.address);
    console.log("ScoreOracle:", oracle.address);
    console.log("LendingPool:", pool.address);

    // Write env files for frontend and backend
    const frontendEnv = `VITE_LENDING_POOL=${pool.address}\nVITE_SOULBOUND=${sbt.address}\nVITE_SCORE_ORACLE=${oracle.address}\nVITE_COLLATERAL=${collateral.address}\nVITE_STABLE=${stable.address}\n`;
    fs.writeFileSync(path.join(__dirname, "..", "frontend", ".env"), frontendEnv);

    // Use the deployer as the relayer key for local demo (NEVER do this in production)
    const privateKey = hre.network.config.accounts && hre.network.config.accounts[0] ? hre.network.config.accounts[0] : '0x'.padEnd(66,'0');
    const backendEnv = `RPC_URL=http://localhost:8545\nSCORE_ORACLE_ADDRESS=${oracle.address}\nRELAYER_PRIVATE_KEY=${privateKey}\n`;
    fs.writeFileSync(path.join(__dirname, "..", "backend", ".env"), backendEnv);

    console.log('Wrote frontend/.env and backend/.env for local demo');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
