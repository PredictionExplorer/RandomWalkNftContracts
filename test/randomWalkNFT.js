const { expect } = require("chai");

function valuesClose(x, y) {
  r = x.sub(y).abs()
  comp = ethers.utils.parseEther('0.001');
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
    hardhatRandomWalkNFT = await RandomWalkNFT.deploy();
    await hardhatRandomWalkNFT.setSaleTime(0);
    hardhatRandomWalkNFT2 = await RandomWalkNFT.deploy();
    await hardhatRandomWalkNFT2.setSaleTime(0);
    Marketplace = await ethers.getContractFactory("Marketplace");
    hardhatMarketplace = await Marketplace.deploy();
  });

  it("Cancel Buy offer should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    let price = ethers.utils.parseEther('2.123');
    await hardhatMarketplace.connect(addr1).makeBuyOffer(hardhatRandomWalkNFT.address, 0, {value: price});
    await hardhatRandomWalkNFT.setApprovalForAll(hardhatMarketplace.address, true);
    await expect(hardhatMarketplace.connect(addr1).cancelSellOffer(0)).to.be.revertedWith("Must be a sell offer");
    initial_balance = await ethers.provider.getBalance(addr1.address);
    await hardhatMarketplace.connect(addr1).cancelBuyOffer(0);
    expect(valuesClose(initial_balance.add(price), await ethers.provider.getBalance(addr1.address))).to.equal(true);
  });

  it("Cancel Sell offer should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    await hardhatRandomWalkNFT.setApprovalForAll(hardhatMarketplace.address, true);
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.equal(owner.address);
    let price = ethers.utils.parseEther('2.123');
    await hardhatMarketplace.makeSellOffer(hardhatRandomWalkNFT.address, 0, price);
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.not.equal(owner.address);
    await expect(hardhatMarketplace.cancelBuyOffer(0)).to.be.revertedWith("Must be a buy offer");
    await hardhatMarketplace.cancelSellOffer(0);
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price})).to.be.revertedWith("Offer must be active");
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.equal(owner.address);
  });

  it("Token burn should be impossible", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    await expect(hardhatRandomWalkNFT["safeTransferFrom(address,address,uint256)"](owner.address, "0x0000000000000000000000000000000000000000", 0)).to.be.revertedWith("ERC721: transfer to the zero address");
  });

  it("Buy offer should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    let price = ethers.utils.parseEther('2.123');
    await hardhatMarketplace.connect(addr1).makeBuyOffer(hardhatRandomWalkNFT.address, 0, {value: price});
    await expect(hardhatMarketplace.acceptBuyOffer(0)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
    await hardhatRandomWalkNFT.setApprovalForAll(hardhatMarketplace.address, true);
    initial_balance = await ethers.provider.getBalance(owner.address);
    await hardhatMarketplace.acceptBuyOffer(0);
    expect(valuesClose(initial_balance.add(price), await ethers.provider.getBalance(owner.address))).to.equal(true);
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.equal(addr1.address);
  });

  it("Can't make buy offer for non-existent token", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    let price = ethers.utils.parseEther('2.123');
    await expect(hardhatMarketplace.connect(addr1).makeBuyOffer(hardhatRandomWalkNFT.address, 1, {value: price})).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("Sale offer should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    await expect(hardhatMarketplace.makeSellOffer(hardhatRandomWalkNFT.address, 0, ethers.utils.parseEther('0.123'))).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');;
    await hardhatRandomWalkNFT.setApprovalForAll(hardhatMarketplace.address, true);
    let price = ethers.utils.parseEther('3.123');
    await hardhatMarketplace.makeSellOffer(hardhatRandomWalkNFT.address, 0, price);
    initial_balance = await ethers.provider.getBalance(owner.address);
    await expect(hardhatMarketplace.connect(addr1).acceptBuyOffer(0)).to.be.revertedWith("Must be a buy offer");
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price.sub(1)})).to.be.revertedWith("Incorrect value sent.");
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price.add(1)})).to.be.revertedWith("Incorrect value sent.");
    await hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price});
    await expect(hardhatMarketplace.connect(addr1).acceptSellOffer(0, {value: price})).to.be.revertedWith("Offer must be active");
    expect(initial_balance.add(price).eq(await ethers.provider.getBalance(owner.address))).to.equal(true);
    expect(await hardhatRandomWalkNFT.ownerOf(0)).to.equal(addr1.address);
  });

  it("Name setting should work", async function () {
    mintPrice = await hardhatRandomWalkNFT.getMintPrice();
    await hardhatRandomWalkNFT.mint({value: mintPrice});
    await hardhatRandomWalkNFT.setTokenName(0, "hello");
    expect(await hardhatRandomWalkNFT.tokenNames(0)).to.equal("hello");
    await hardhatRandomWalkNFT.setTokenName(0, "a".repeat(32));
    expect(await hardhatRandomWalkNFT.tokenNames(0)).to.equal("a".repeat(32));
    await expect(hardhatRandomWalkNFT.setTokenName(0, "a".repeat(33))).to.be.revertedWith("Token name is too long.");
  });

  it("Can't mint before sale is open", async function () {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const targetTimestamp = blockBefore.timestamp + 7 * 24 * 3600;
    hardhatRandomWalkNFTweek = await RandomWalkNFT.deploy();
    await hardhatRandomWalkNFTweek.setSaleTime(targetTimestamp);

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

    expect(await hardhatRandomWalkNFT.withdrawalNums(99)).to.equal(1);
    expect(await hardhatRandomWalkNFT.withdrawalAmounts(99)).to.equal(totalSpent.div(2));

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
