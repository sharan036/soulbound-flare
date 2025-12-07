// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ScoreOracle for MODRAN MVP
 * - Stores credit reputation scores
 * - Emits ScoreUpdated(user, score, reporter)
 * - Admin posts scores (MVP mode)
 */
contract ScoreOracle {
    struct ScoreRecord {
        uint256 score;     // 0–1000
        uint256 timestamp; // last update
        address reporter;  // msg.sender who posted score
    }

    mapping(address => ScoreRecord) public scores;
    address public admin;

    /// @notice Emitted whenever a score is stored or updated
    event ScoreUpdated(address indexed user, uint256 score, address indexed reporter);

    constructor() {
        admin = msg.sender;
    }

    /**
     * MVP: allow anyone (or admin only) to post a score.
     * Future version: only Flare FDC reporter / verified signer.
     */
    function postScore(address user, uint256 score) external {
        require(score <= 1000, "score range");

        scores[user] = ScoreRecord({
            score: score,
            timestamp: block.timestamp,
            reporter: msg.sender
        });

        emit ScoreUpdated(user, score, msg.sender);
    }

    /// @notice Return the user's score (MVP returns only the number)
    function getScore(address user) external view returns (uint256) {
        return scores[user].score;
    }
}
