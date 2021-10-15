const { expect } = require("chai");

function valuesClose(x, y) {
  r = x.sub(y).abs()
  comp = ethers.utils.parseEther('0.0001');
  return r.lt(comp);
}

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
    hardhatRandomWalkNFT2 = await RandomWalkNFT.deploy(0, 0);

    Marketplace = await ethers.getContractFactory("Marketplace");
    hardhatMarketplace = await Marketplace.deploy(hardhatRandomWalkNFT.address);
  });

  it("Sale should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    await expect(hardhatMarketplace.makeSellOffer(0, ethers.utils.parseEther('0.123'))).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');;
    await hardhatRandomWalkNFT.setApprovalForAll(hardhatMarketplace.address, true);
    let price = ethers.utils.parseEther('0.123');
    await hardhatMarketplace.makeSellOffer(0, price);
    initial_balance = await ethers.provider.getBalance(owner.address);
    await expect(hardhatMarketplace.connect(addr1).acceptBuyOffer(0)).to.be.revertedWith("Must be a buy offer");
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price.sub(1)})).to.be.revertedWith("Incorrect value sent.");
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price.add(1)})).to.be.revertedWith("Incorrect value sent.");
    await hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price});
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price})).to.be.revertedWith("Offer must be active");
    expect(initial_balance.add(price).eq(await ethers.provider.getBalance(owner.address))).to.equal(true);
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.equal(addr1.address);
  });

  it("Can't mint before sale is open", async function () {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const targetTimestamp = blockBefore.timestamp + 7 * 24 * 3600;
    hardhatRandomWalkNFTweek = await RandomWalkNFT.deploy("", targetTimestamp);

    mintPrice = await hardhatRandomWalkNFTweek.getMintPrice();
    await expect(hardhatRandomWalkNFTweek.mint({value: mintPrice})).to.be.revertedWith('The sale is not open yet.');

    await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 - 15]);
    await ethers.provider.send("evm_mine");

    await expect(hardhatRandomWalkNFTweek.mint({value: mintPrice})).to.be.revertedWith('The sale is not open yet.');
    expect(await hardhatRandomWalkNFTweek.totalSupply()).to.equal(0);

    await ethers.provider.send("evm_increaseTime", [60]);
    await ethers.provider.send("evm_mine");

    await hardhatRandomWalkNFTweek.mint({value: mintPrice});
    expect(await hardhatRandomWalkNFTweek.totalSupply()).to.equal(1);
  });

  it("The minter withdraws and gets the money", async function () {
    totalSpent = ethers.BigNumber.from("0");
    for(i = 0; i < 100; i++) {
      mintPrice = await hardhatRandomWalkNFT.getMintPrice();
      totalSpent = totalSpent.add(mintPrice);
      await hardhatRandomWalkNFT.mint({value: mintPrice});
    }
    expect(await hardhatRandomWalkNFT.lastMinter()).to.equal(owner.address);

    refund = await ethers.provider.getBalance(hardhatRandomWalkNFT.address) / 2;
    initial_balance = await ethers.provider.getBalance(owner.address);

    await expect(hardhatRandomWalkNFT.withdraw()).to.be.revertedWith('Not enough time has elapsed.');

    await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600 - 15]);
    await ethers.provider.send("evm_mine");

    await expect(hardhatRandomWalkNFT.withdraw()).to.be.revertedWith('Not enough time has elapsed.');

    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine");

    await expect(hardhatRandomWalkNFT.connect(addr1).withdraw()).to.be.revertedWith('Only last minter can withdraw.');

    init_user_balance = await ethers.provider.getBalance(owner.address);
    init_contract_balance = await ethers.provider.getBalance(hardhatRandomWalkNFT.address);

    await hardhatRandomWalkNFT.withdraw();

    final_user_balance = await ethers.provider.getBalance(owner.address);
    final_contract_balance = await ethers.provider.getBalance(hardhatRandomWalkNFT.address);

    expect(valuesClose(final_contract_balance, totalSpent.div(2))).to.equal(true);
    expect(valuesClose(final_contract_balance.mul(2), init_contract_balance)).to.equal(true);
    expect(valuesClose(init_user_balance.add(final_contract_balance), final_user_balance)).to.equal(true);

    expect(await hardhatRandomWalkNFT.lastMinter()).to.equal("0x0000000000000000000000000000000000000000");

    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.connect(addr1).mint({value: mintPrice});
    expect(await hardhatRandomWalkNFT.lastMinter()).to.equal(addr1.address);
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

    await hardhatRandomWalkNFT.connect(addr1).mint({value: mintPrice});
    await hardhatRandomWalkNFT2.connect(addr2).mint({value: mintPrice.mul(10000)});

    bal_diff_1 = init_bal1 - (await addr1.getBalance());
    bal_diff_2 = init_bal2 - (await addr2.getBalance());

    expect(bal_diff_2 < 2 * bal_diff_1);
    expect(bal_diff_1 < 2 * bal_diff_2);
  });

});
