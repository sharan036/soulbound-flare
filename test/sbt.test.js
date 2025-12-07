const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SoulBound", function () {
  it("mints and is non-transferable", async function () {
    const [owner, user] = await ethers.getSigners();

    const SBT = await ethers.getContractFactory("SoulBound");
    const sbt = await SBT.deploy();
    await sbt.deployed();

    await sbt.mint(user.address);
    expect(await sbt.ownerOf(1)).to.equal(user.address);

    // Waffle matcher (works with your environment)
    await expect(
      sbt.connect(user).transferFrom(user.address, owner.address, 1)
    ).to.be.revertedWith("SBT: non-transferable");
  });
});
