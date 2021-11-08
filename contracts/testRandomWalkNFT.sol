import "./randomWalkNFT.sol";

pragma solidity ^0.8.9;

contract TestRandomWalkNFT is RandomWalkNFT {

    function setSaleTime(uint256 newSaleTime) public onlyOwner {
        saleTime = newSaleTime;
    }

    function setWithdrawalWait(uint256 newTime) public onlyOwner {
        withdrawalWaitSeconds = newTime;
    }
}
