const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ScoreOracle & LendingPool', function(){
  let stable, collateral, ftso, sbt, oracle, pool;
  let owner, lender, borrower;

  beforeEach(async function(){
    [owner,lender,borrower] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    stable = await MockERC20.deploy('MockUSD','mUSD', ethers.utils.parseUnits('1000000',18));
    await stable.deployed();
    collateral = await MockERC20.deploy('MockFA','mFA', ethers.utils.parseUnits('1000000',18));
    await collateral.deployed();

    const MockFTSO = await ethers.getContractFactory('MockFTSO');
    ftso = await MockFTSO.deploy();
    await ftso.deployed();
    await ftso.setPrice(collateral.address, ethers.utils.parseUnits('20000', 18)); // collateral price = 20k

    const SoulBound = await ethers.getContractFactory('SoulBound');
    sbt = await SoulBound.deploy();
    await sbt.deployed();

    const ScoreOracle = await ethers.getContractFactory('ScoreOracle');
    oracle = await ScoreOracle.deploy();
    await oracle.deployed();

    const LendingPool = await ethers.getContractFactory('LendingPool');
    pool = await LendingPool.deploy(stable.address, collateral.address, oracle.address, ftso.address);
    await pool.deployed();
  });

  it('allows deposit, collateral and borrowing within limit', async function(){
    // lender deposits stable
    await stable.approve(pool.address, ethers.utils.parseUnits('10000',18));
    await pool.deposit(ethers.utils.parseUnits('10000',18));
    // borrower adds collateral
    await collateral.mintTo(borrower.address, ethers.utils.parseUnits('1',18));
    await collateral.connect(borrower).approve(pool.address, ethers.utils.parseUnits('1',18));
    await pool.connect(borrower).addCollateral(ethers.utils.parseUnits('1',18));
    // post score via oracle (admin / deployer)
    await oracle.postScore(borrower.address, 800); // high score
    const limit = await pool.getBorrowLimit(borrower.address);
    // limit should be > 0
    expect(limit.gt(0)).to.be.true;
    // borrow a small amount within limit
    const borrowAmt = limit.div(ethers.BigNumber.from('100')).mul(1); // 1% of limit
    await pool.connect(borrower).borrow(borrowAmt);
    expect((await pool.borrows(borrower.address)).gt(0)).to.be.true;
  });
});
