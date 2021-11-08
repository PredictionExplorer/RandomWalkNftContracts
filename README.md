## Deploying on Rinkeby
npx hardhat run scripts/deployNFT.js --network rinkeby
npx hardhat run scripts/deployMarket.js --network rinkeby

## Verify NFT:
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_nft.js NFT_CONTRACT_ADDRESS

## Verify NFTMarket contracts
npx hardhat verify --network rinkeby --constructor-args etherscan/arguments_nftmarket.js NFTMARKET_ADDRESS

## Test:
npx hardhat test

## Deploy to Rinkeby Arbitrum:
npx hardhat run scripts/deployNFT.js --network rinkarby
npx hardhat run scripts/deployMarket.js --network rinkarby

## Deploy ot Arbitrum:
npx hardhat run scripts/deployNFT.js --network arbitrum
npx hardhat run scripts/deployMarket.js --network arbitrum
