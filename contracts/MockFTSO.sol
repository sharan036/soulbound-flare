// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockFTSO
 * @dev Local-only mock oracle for price feeds. Compatible with your UI and LendingPool.
 *      Returns manually set prices & timestamps. Prevents "unrecognized selector" errors.
 */
contract MockFTSO {
    mapping(address => uint256) private prices;
    uint256 public defaultPrice = 1e18; // fallback price (1.0)

    event PriceUpdated(address indexed token, uint256 price);

    /**
     * @notice Set the price for a token (for testing only)
     * @param token ERC20 token address
     * @param price Price in 18 decimals
     */
    function setPrice(address token, uint256 price) external {
        prices[token] = price;
        emit PriceUpdated(token, price);
    }

    /**
     * @notice Returns latest price + timestamp. Never reverts.
     * @param token ERC20 token address
     * @return price  token price in 18 decimals
     * @return timestamp current block timestamp
     */
    function getLatestPrice(address token)
        external
        view
        returns (uint256 price, uint256 timestamp)
    {
        price = prices[token] > 0 ? prices[token] : defaultPrice;
        timestamp = block.timestamp;
    }

    /**
     * Optional: set fallback default price used when no price set.
     */
    function setDefaultPrice(uint256 _p) external {
        defaultPrice = _p;
    }
}
