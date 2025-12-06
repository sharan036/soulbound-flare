// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ScoreOracle receives Credit Reputation Scores (CRS) posted via Flare Data Connector (FDC)
 * or by an admin reporter in the MVP. In production, this would verify signatures from a reporter
 * or accept verifiably-registered FDC callbacks.
 */
contract ScoreOracle {
    struct ScoreRecord {
        uint256 score; // 0 - 1000
        uint256 timestamp;
        address reporter;
    }

    mapping(address => ScoreRecord) public scores;
    address public admin;

    event ScoreUpdated(address indexed user, uint256 score, address indexed reporter);

    constructor() {
        admin = msg.sender;
    }

    // For hackathon MVP: allow admin or reporter to post score.
    // In Flare integration this would be called by an FDC-registered contract or via signed message verification.
    function postScore(address user, uint256 score) external {
        require(score <= 1000, "score range");
        scores[user] = ScoreRecord(score, block.timestamp, msg.sender);
        emit ScoreUpdated(user, score, msg.sender);
    }

    function getScore(address user) external view returns (uint256) {
        return scores[user].score;
    }
}
