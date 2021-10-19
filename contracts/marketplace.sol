// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Marketplace {

    struct Offer {
        uint256 tokenId;
        uint256 price;
        address seller;
        address buyer;
        bool active;
    }

    event NewOffer(uint256 indexed offerId,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price);
    event ItemBought(uint256 indexed offerId);
    event OfferCanceled(uint256 indexed offerId);

    IERC721 nftAddress;

    mapping (uint256 => Offer) public offers;
    uint256 public numOffers = 0;

    constructor (address nftAddr) {
        nftAddress = IERC721(nftAddr);
    }
    function makeBuyOffer(uint256 tokenId) payable public {
        require(nftAddress.ownerOf(tokenId) != address(0));
        uint256 offerId = numOffers;
        offers[offerId] = Offer({
            tokenId: tokenId,
            price: msg.value,
            seller: address(0),
            buyer: msg.sender,
            active: true
        });
        numOffers += 1;
        emit NewOffer(offerId, tokenId, offers[offerId].seller, offers[offerId].buyer, offers[offerId].price);
    }

    function makeSellOffer(uint256 tokenId, uint256 price) public {
        uint256 offerId = numOffers;
        offers[offerId] = Offer({
            tokenId: tokenId,
            price: price,
            seller: msg.sender,
            buyer: address(0),
            active: true
        });
        numOffers += 1;

        nftAddress.safeTransferFrom(
            offers[offerId].seller,
            address(this),
            offers[offerId].tokenId
        );
        emit NewOffer(offerId, tokenId, offers[offerId].seller, offers[offerId].buyer, offers[offerId].price);
    }

    function acceptBuyOffer(uint256 offerId) public {
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].seller == address(0), "Must be a buy offer");

        offers[offerId].seller = msg.sender;
        offers[offerId].active = false;

        nftAddress.safeTransferFrom(
            offers[offerId].seller,
            offers[offerId].buyer,
            offers[offerId].tokenId
        );
        (bool success, ) = offers[offerId].seller.call{value: offers[offerId].price}("");
        require(success, "Transfer failed.");
        emit ItemBought(offerId);
    }

    function acceptSellOffer(uint256 offerId) public payable {
        require(offers[offerId].price == msg.value, "Incorrect value sent.");
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].buyer == address(0), "Must be a sell offer");

        offers[offerId].buyer = msg.sender;
        offers[offerId].active = false;

        nftAddress.safeTransferFrom(
            address(this),
            offers[offerId].buyer,
            offers[offerId].tokenId
        );
        (bool success, ) = offers[offerId].seller.call{value: offers[offerId].price}("");
        require(success, "Transfer failed.");
        emit ItemBought(offerId);
    }

    function cancelBuyOffer(uint256 offerId) public {
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].seller == address(0), "Must be a buy offer");
        require(msg.sender == offers[offerId].buyer, "Only the buyer can cancel offer.");

        offers[offerId].active = false;
        (bool success, ) = offers[offerId].buyer.call{value: offers[offerId].price}("");
        require(success, "Transfer failed.");
        emit OfferCanceled(offerId);
    }

    function cancelSellOffer(uint256 offerId) public {
        require(offers[offerId].active, "Offer must be active");
        require(offers[offerId].buyer == address(0), "Must be a sell offer");
        require(offers[offerId].seller == msg.sender, "Only the seller can cancel offer.");

        offers[offerId].active = false;
        nftAddress.safeTransferFrom(
            address(this),
            offers[offerId].seller,
            offers[offerId].tokenId
        );
        emit OfferCanceled(offerId);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public pure returns(bytes4) {
        bytes4 _ERC721_RECEIVED = 0x150b7a02;
        return _ERC721_RECEIVED;
    }

    /**
     * Returns a list of tokens that are for sale by a certain address.
     * Each value should appear only once.
     */
    function getSellTokenBy(address seller) public view returns(uint256[] memory){
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].seller == seller) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].seller == seller) {
                result[k] = offers[i].tokenId;
                k += 1;
            }
        }
        return result;
    }

    /**
     * Returns a list of tokens that a certain address is offering to buy.
     * (Theoretically, there could be duplicates here.)
     */
    function getBuyTokensBy(address buyer) public view returns(uint256[] memory){
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].buyer == buyer) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].buyer == buyer) {
                result[k] = offers[i].tokenId;
                k += 1;
            }
        }
        return result;
    }

    /**
     * Returns a list of offersIds that are on sale by a certain address.
     */
    function getSellOffersBy(address seller) public view returns(uint256[] memory){
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].seller == seller) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].seller == seller) {
                result[k] = i;
                k += 1;
            }
        }
        return result;
    }

    /**
     * Returns a list of offersIds where a certain address is trying to buy.
     */
    function getBuyOffersBy(address buyer) public view returns(uint256[] memory){
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].buyer == buyer) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].buyer == buyer) {
                result[k] = i;
                k += 1;
            }
        }
        return result;
    }

    function getBuyOffers(uint256 tokenId) public view returns(uint256[] memory) {
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].tokenId == tokenId && offers[i].seller == address(0)) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].active && offers[i].tokenId == tokenId && offers[i].seller == address(0)) {
                result[k] = i;
                k += 1;
            }
        }
        return result;
    }

    function getSellOffers(uint256 tokenId) public view returns(uint256[] memory) {
        uint256 size = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].tokenId == tokenId && offers[i].active && offers[i].buyer == address(0)) {
                size += 1;
            }
        }
        uint256[] memory result = new uint256[](size);
        uint256 k = 0;
        for (uint256 i = 0; i < numOffers; i++) {
            if (offers[i].tokenId == tokenId && offers[i].active && offers[i].buyer == address(0)) {
                result[k] = i;
                k += 1;
            }
        }
        return result;
    }

}
