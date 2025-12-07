const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockFTSO", function () {
  let ftso, token;

  beforeEach(async () => {
    const MockFTSO = await ethers.getContractFactory("MockFTSO");
    ftso = await MockFTSO.deploy();
    await ftso.deployed();

    token = "0x1111111111111111111111111111111111111111";
  });

  it("sets & returns price", async () => {
    await ftso.setPrice(token, ethers.utils.parseUnits("1.23", 18));

    const [price, ts] = await ftso.getLatestPrice(token);

    expect(price.toString()).to.equal(ethers.utils.parseUnits("1.23", 18).toString());
    expect(ts).to.be.gt(0);
  });
});
