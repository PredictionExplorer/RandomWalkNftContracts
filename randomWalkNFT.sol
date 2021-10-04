
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.9;

contract RandomWalksToken is ERC721Enumerable, Ownable {

    uint256 public saleTime = 1633647600; // 7PM EDT on October 7th, 2021
    uint256 public price = 10**15; // Price starts at .001 eth

    // Seeds
    mapping(uint256 => bytes32) public seeds;

    // Entropy
    bytes32 public entropy;

    string private _baseTokenURI;

    // IPFS link to the Python script that generates images and videos for each NFT based on seed.
    string public tokenGenerationScript = "ipfs://QmWEao2HjCvyHJSbYnWLyZj8HfFardxzuNh7AUk1jgyXTm";

    constructor(string memory baseURI) ERC721("RandomWalkNFT", "RWLK") {
        setBaseURI(baseURI);
        entropy = keccak256(abi.encode(
            "A two-dimensional random walk will return to the point where it started, but a three-dimensional one may not.",
            block.timestamp, blockhash(block.number)));
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function getMintPrice() public view returns (uint256) {
        return (price * 10011) / 10000;
    }

    function timeUntilSale() public view returns (uint256) {
        if (saleTime < block.timestamp) return 0;
        return saleTime - block.timestamp;
    }

    function mint() public payable {
        uint256 newPrice = getMintPrice();
        require(
            msg.value >= newPrice,
            "The value submitted with this transaction is too low."
        );
        require(
            block.timestamp >= saleTime,
            "The sale is not open yet."
        );
        price = newPrice;
        entropy = keccak256(abi.encode(
            entropy,
            block.timestamp,
            blockhash(block.number),
            msg.sender));
        uint256 tokenId = totalSupply();
        seeds[tokenId] = entropy;
        _safeMint(msg.sender, tokenId);
    }

    // Returns a list of token Ids owned by _owner.
    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        }

        uint256[] memory result = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; i++) {
            result[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return result;
    }

    // Returns a list of seeds owned by _owner.
    function seedsOfOwner(address _owner)
        public
        view
        returns (bytes32[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {
            // Return an empty array
            return new bytes32[](0);
        }

        bytes32[] memory result = new bytes32[](tokenCount);
        for (uint256 i; i < tokenCount; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(_owner, i);
            result[i] = seeds[tokenId];
        }
        return result;
    }

}
