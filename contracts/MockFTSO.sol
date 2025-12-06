// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Mock FTSO for local testing: returns a settable price for a given token address.
 * In real Flare integration, FTSO has decentralized data and different interfaces.
 */
contract MockFTSO {
    mapping(address => uint256) public prices;

    function setPrice(address token, uint256 price) external {
        prices[token] = price;
    }

    // returns (price, timestamp)
    function getLatestPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        price = prices[token];
        timestamp = block.timestamp;
    }
}
