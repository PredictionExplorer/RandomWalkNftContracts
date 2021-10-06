import "./randomWalkNFT.sol";

contract MintMany is Ownable {

    randomWalkNFT nftAddress;

    constructor (address nftAddr) {
        nftAddress = randomWalkNFT(nftAddr);
    }

    function mintMultiple(uint256 num) public onlyOwner {
        for (uint256 i = 0; i < num; i++) {
            uint256 mintPrice = nftAddress.getMintPrice();
            nftAddress.mint{value: mintPrice}();
        }
    }

    function approveAll(address operator) public onlyOwner {
        nftAddress.setApprovalForAll(operator, true);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public returns(bytes4) {
        bytes4 _ERC721_RECEIVED = 0x150b7a02;
        return _ERC721_RECEIVED;
    }
}
