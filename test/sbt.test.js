const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SoulBound', function(){
  it('mints and is non-transferable', async function(){
    const [owner, user] = await ethers.getSigners();
    const SBT = await ethers.getContractFactory('SoulBound');
    const sbt = await SBT.deploy();
    await sbt.deployed();

    await sbt.mint(user.address);
    const tokenId = 1;
    expect(await sbt.ownerOf(tokenId)).to.equal(user.address);

    // attempt transfer should revert
    await expect(sbt.connect(user).transferFrom(user.address, owner.address, tokenId)).to.be.reverted;
  });
});
