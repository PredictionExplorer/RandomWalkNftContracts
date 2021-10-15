import "./randomWalkNFT.sol";

contract MintMany is Ownable {

    RandomWalkNFT nftAddress;

    constructor (address nftAddr) {
        nftAddress = RandomWalkNFT(nftAddr);
    }

    function setNFTAddr(address newAddr) public onlyOwner {
        nftAddress = RandomWalkNFT(newAddr);
    }

    function mintMultiple(uint256 num) public onlyOwner payable {
        for (uint256 i = 0; i < num; i++) {
            uint256 mintPrice = nftAddress.getMintPrice();
            nftAddress.mint{value: mintPrice}();
        }
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public returns(bytes4) {
        nftAddress.safeTransferFrom(
            address(this),
            owner(),
            tokenId
        );
        bytes4 _ERC721_RECEIVED = 0x150b7a02;
        return _ERC721_RECEIVED;
    }
}
