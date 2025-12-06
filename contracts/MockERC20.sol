// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initial) ERC20(name_, symbol_) {
        _mint(msg.sender, initial);
    }

    function mintTo(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
