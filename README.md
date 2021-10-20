## Deploying on Rinkeby
npx hardhat run scripts/deploy.js --network rinkeby

Verify NFT:
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_nft.js <NFT CONTRACT>

Verify Marketplace contracts
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_marketplace.js <MARKETPLACE CONTRACT>

Test:
npx hardhat test

Deploy to Rinkeby Arbitrum:
npx hardhat run scripts/deploy.js --network rinkarby
