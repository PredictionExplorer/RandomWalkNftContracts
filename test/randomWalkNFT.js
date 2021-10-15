const { expect } = require("chai");


describe("RandomWalkNFT contract", function () {

  let RandomWalkNFT;
  let hardhatRandomWalkNFT;

  let RandomWalkNF2;
  let hardhatRandomWalkNF2;

  let Marketplace;
  let hardhatMarketplace;

  let owner;
  let addr1;
  let addr2;
  let addrs;


  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    RandomWalkNFT = await ethers.getContractFactory("RandomWalkNFT");
    hardhatRandomWalkNFT = await RandomWalkNFT.deploy(0, 0);

    RandomWalkNFT2 = await ethers.getContractFactory("RandomWalkNFT");
    hardhatRandomWalkNFT2 = await RandomWalkNFT.deploy(0, 0);

    Marketplace = await ethers.getContractFactory("Marketplace");
    hardhatMarketplace = await Marketplace.deploy(hardhatRandomWalkNFT.address);
  });

  it("Initial supply should be zero", async function () {
    expect(await hardhatRandomWalkNFT.totalSupply()).to.equal(0);
  });

  it("Initial number of offers should be zero", async function () {
    expect(await hardhatMarketplace.numOffers()).to.equal(0);
  });

  it("Minting should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice() - 0;
    await hardhatRandomWalkNFT.mint({value: mintPrice});

    mintPrice = await hardhatRandomWalkNFT.getMintPrice() - 1;
    await expect(hardhatRandomWalkNFT.mint({value: mintPrice})).to.be.revertedWith('The value submitted with this transaction is too low.');

    mintPrice = await hardhatRandomWalkNFT.getMintPrice() - 0;
    await hardhatRandomWalkNFT.connect(addr1).mint({value: mintPrice});

    mintPrice = await hardhatRandomWalkNFT.getMintPrice() - 0;
    await hardhatRandomWalkNFT.connect(addr1).mint({value: mintPrice});

    expect(await hardhatRandomWalkNFT.totalSupply()).to.equal(3);
    expect(await hardhatRandomWalkNFT.balanceOf(owner.address)).to.equal(1);
    expect(await hardhatRandomWalkNFT.balanceOf(addr1.address)).to.equal(2);
    expect(await hardhatRandomWalkNFT.balanceOf(addr2.address)).to.equal(0);
  });

  it("Should refund if sent too much", async function () {
    init_bal1 = await addr1.getBalance();
    init_bal2 = await addr2.getBalance();

    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    console.log(mintPrice);

    await hardhatRandomWalkNFT.connect(addr1).mint({value: mintPrice});
    await hardhatRandomWalkNFT2.connect(addr2).mint({value: mintPrice.mul(10000)});

    bal_diff_1 = init_bal1 - (await addr1.getBalance());
    bal_diff_2 = init_bal2 - (await addr2.getBalance());

    expect(bal_diff_2 < 2 * bal_diff_1);
    expect(bal_diff_1 < 2 * bal_diff_2);
  });

});
