async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RandomWalkNFT = await ethers.getContractFactory("RandomWalkNFT");
  const hardhatRandomWalkNFT = await RandomWalkNFT.deploy(0, 0);

  console.log("hardhatRandomWalkNFT address:", hardhatRandomWalkNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
