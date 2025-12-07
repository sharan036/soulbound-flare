// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("LendingPool", function () {
//   let stable, collateral, ftso, oracle, pool;
//   let owner, user;

//   beforeEach(async () => {
//     [owner, user] = await ethers.getSigners();

//     const MockERC20 = await ethers.getContractFactory("MockERC20");
//     stable = await MockERC20.deploy("MockUSD", "mUSD", ethers.utils.parseUnits("1000000", 18));
//     collateral = await MockERC20.deploy("MockFA", "mFA", ethers.utils.parseUnits("1000000", 18));
//     await stable.deployed();
//     await collateral.deployed();

//     const MockFTSO = await ethers.getContractFactory("MockFTSO");
//     ftso = await MockFTSO.deploy();
//     await ftso.deployed();

//     await ftso.setPrice(collateral.address, ethers.utils.parseUnits("1", 18));

//     const Oracle = await ethers.getContractFactory("ScoreOracle");
//     oracle = await Oracle.deploy();
//     await oracle.deployed();

//     await oracle.postScore(user.address, 700); // Mid risk score

//     const Pool = await ethers.getContractFactory("LendingPool");
//     pool = await Pool.deploy(stable.address, collateral.address, oracle.address, ftso.address);
//     await pool.deployed();
//   });

//   it("allows deposit of collateral", async () => {
//     await collateral.mintTo(user.address, ethers.utils.parseUnits("10", 18));
//     await collateral.connect(user).approve(pool.address, ethers.utils.parseUnits("10", 18));

//     await pool.connect(user).addCollateral(ethers.utils.parseUnits("10", 18));

//     const bal = await pool.collateralBalance(user.address);
//     expect(bal.toString()).to.equal(ethers.utils.parseUnits("10", 18).toString());
//   });

//   it("allows borrowing within limit", async () => {
//     await collateral.mintTo(user.address, ethers.utils.parseUnits("10", 18));
//     await collateral.connect(user).approve(pool.address, ethers.utils.parseUnits("10", 18));
//     await pool.connect(user).addCollateral(ethers.utils.parseUnits("10", 18));

//     const limit = await pool.getBorrowLimit(user.address);

//     await pool.connect(user).borrow(limit.div(2));

//     expect(await pool.debt(user.address)).to.equal(limit.div(2));
//   });

//   it("reverts when borrowing exceeds limit", async () => {
//     await collateral.mintTo(user.address, ethers.utils.parseUnits("10", 18));
//     await collateral.connect(user).approve(pool.address, ethers.utils.parseUnits("10", 18));
//     await pool.connect(user).addCollateral(ethers.utils.parseUnits("10", 18));

//     const limit = await pool.getBorrowLimit(user.address);

//     await expect(
//       pool.connect(user).borrow(limit.add(1))
//     ).to.be.revertedWith("exceeds limit");
//   });

//   it("repays debt", async () => {
//     await collateral.mintTo(user.address, ethers.utils.parseUnits("10", 18));
//     await collateral.connect(user
