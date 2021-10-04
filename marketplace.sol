pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Marketplace {

    struct Offer {
        uint256 tokenId;
        uint256 price;
        address payable seller;
        address payable buyer;
        bool active;
    }

    event NewOffer(uint256 offerId);
    event ItemBought(uint256 offerId);

    IERC721 nftAddress;

    mapping (uint256 => Offer) public offers;
    uint256 numOffers = 0;

    constructor (address nftAddr) {
        nftAddress = IERC721(nftAddr);
    }

    function makeBuyOffer(uint256 tokenId) payable public {
        offers[numOffers] = Offer({
            tokenId: tokenId,
            price: msg.value,
            seller: payable(0),
            buyer: payable(msg.sender),
            active: true
        });
        uint256 offerId = numOffers;
        numOffers += 1;
        emit NewOffer(offerId);
    }

    function makeSellOffer(uint256 tokenId, uint256 price) public {
        offers[numOffers] = Offer({
            tokenId: tokenId,
            price: price,
            seller: payable(msg.sender),
            buyer: payable(0),
            active: true
        });
        uint256 offerId = numOffers;
        numOffers += 1;

        nftAddress.safeTransferFrom(
            offers[offerId].seller,
            address(this),
            offers[offerId].tokenId
        );
        emit NewOffer(offerId);
    }

    function acceptBuyOffer(uint256 offerId) public {
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].seller == address(0), "Must be a buy offer");
        offers[offerId].seller = payable(msg.sender);
        nftAddress.safeTransferFrom(
            offers[offerId].seller,
            offers[offerId].buyer,
            offers[offerId].tokenId
        );
        offers[offerId].seller.transfer(offers[offerId].price);
        emit ItemBought(offerId);
    }

    function acceptSellOffer(uint256 offerId) public payable {
        require(offers[offerId].price == msg.value, "Incorrect value sent.");
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].buyer == address(0), "Must be a sell offer");

        offers[offerId].buyer = payable(msg.sender);

        nftAddress.safeTransferFrom(
            address(this),
            offers[offerId].buyer,
            offers[offerId].tokenId
        );
        offers[offerId].seller.transfer(offers[offerId].price);
        emit ItemBought(offerId);
    }

    function cancelBuyOffer(uint256 offerId) public {
        require(msg.sender == offers[offerId].buyer, "Only the buyer can cancel offer.");
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].seller == address(0), "Must be a buy offer");

        offers[offerId].active = false;
        offers[offerId].buyer.transfer(offers[offerId].price);
    }

    function cancelSellOffer(uint256 offerId) public {
        require(offers[offerId].seller == msg.sender, "Only the seller can cancel offer.");
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].buyer == address(0), "Must be a sell offer");

        offers[offerId].active = false;
        nftAddress.safeTransferFrom(
            address(this),
            offers[offerId].seller,
            offers[offerId].tokenId
        );
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public returns(bytes4) {
        bytes4 _ERC721_RECEIVED = 0x150b7a02;
        return _ERC721_RECEIVED;
    }

}
