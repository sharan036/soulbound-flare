// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Simple SoulBound NFT: non-transferable ERC721 used to represent on-chain reputation identity.
 * Owner (protocol admin) can mint and set reputation attributes for demonstration.
 */
contract SoulBound is ERC721, Ownable {
    uint256 public nextId;
    mapping(uint256 => bool) private _nonTransferable;
    mapping(uint256 => uint256) public reputation; // 0 - 1000 scale

    constructor() ERC721("SoulBoundCredit", "SBC") {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 id = ++nextId;
        _safeMint(to, id);
        _nonTransferable[id] = true;
        return id;
    }

    // block transfers except mint (from==0) and burn (to==0)
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override {
        require(from == address(0) || to == address(0), "SBT: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function setReputation(uint256 tokenId, uint256 score) external onlyOwner {
        require(_exists(tokenId), "SBT: token doesn't exist");
        reputation[tokenId] = score;
    }

    // helper: get token id for owner (first token)
    function tokenOfOwner(address owner) external view returns (uint256) {
        for (uint256 i = 1; i <= nextId; i++) {
            if (ownerOf(i) == owner) return i;
        }
        revert("SBT: owner has no token");
    }
}
