async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RandomWalkNFT = await ethers.getContractFactory("RandomWalkNFT");
  const hardhatRandomWalkNFT = await RandomWalkNFT.deploy();
  console.log("hardhatRandomWalkNFT address:", hardhatRandomWalkNFT.address);

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const hardhatMarketplace = await Marketplace.deploy();
  console.log("hardhatMarketplace address:", hardhatMarketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
