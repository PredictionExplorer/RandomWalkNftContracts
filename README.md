## Deploying on Rinkeby
npx hardhat run scripts/deploy.js --network rinkeby

## Verify NFT:
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_nft.js NFT_CONTRACT_ADDRESS

## Verify NFTMarket contracts
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_nftmarket.js NFTMARKET_ADDRESS

## Test:
npx hardhat test

## Deploy to Rinkeby Arbitrum:
npx hardhat run scripts/deploy.js --network rinkarby
