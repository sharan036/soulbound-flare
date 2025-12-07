const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScoreOracle", function () {
  let oracle, owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Oracle = await ethers.getContractFactory("ScoreOracle");
    oracle = await Oracle.deploy();
    await oracle.deployed();
  });

  it("posts score", async () => {
    await oracle.postScore(user.address, 650);
    const score = await oracle.getScore(user.address);
    expect(score).to.equal(650);
  });

  it("overwrites previous score", async () => {
    await oracle.postScore(user.address, 500);
    await oracle.postScore(user.address, 900);
    expect(await oracle.getScore(user.address)).to.equal(900);
  });

  it("emits ScorePosted event", async () => {
    await expect(oracle.postScore(user.address, 777))
      .to.emit(oracle, "ScorePosted")
      .withArgs(user.address, 777);
  });
});
