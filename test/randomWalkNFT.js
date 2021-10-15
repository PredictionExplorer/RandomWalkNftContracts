const { expect } = require("chai");

describe("RandomWalkNFT contract", function () {
  it("Initial supply should be zero", async function () {
    const [owner] = await ethers.getSigners();

    const RandomWalkNFT = await ethers.getContractFactory("RandomWalkNFT");

    const hardhatRandomWalkNFT = await RandomWalkNFT.deploy(0, 0);

    console.log("Taras 123");
    console.log(RandomWalkNFT.address);

    expect(await hardhatRandomWalkNFT.totalSupply()).to.equal(0);
  });
});
