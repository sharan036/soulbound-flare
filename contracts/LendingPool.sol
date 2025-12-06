// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IScoreOracle {
    function getScore(address user) external view returns (uint256);
}

interface IFTSO {
    // Minimal interface for demonstration. Real Flare FTSO integrations will differ.
    function getLatestPrice(address asset) external view returns (uint256 price, uint256 timestamp);
}

/**
 * Very small lending pool that accepts an ERC20 collateral (representing FAssets in MVP)
 * and a stable token for lending/borrowing. Borrow limits are derived from:
 *   borrowLimit = (CRS / 1000) * collateralValue * riskMultiplier
 *
 * This contract is intentionally minimal for hackathon MVP and omits interest accrual,
 * liquidation incentives, and other production features.
 */
contract LendingPool is ReentrancyGuard {
    IERC20 public stable; // lending asset (e.g., mUSD)
    IERC20 public collateralToken; // e.g., FA-BTC token (ERC20)
    IScoreOracle public oracle;
    IFTSO public ftso;

    mapping(address => uint256) public deposits;   // lender deposits of stable
    mapping(address => uint256) public collateralBalances; // user collateral balances (in collateralToken)
    mapping(address => uint256) public borrows;    // borrowed stable amounts

    uint256 public totalDeposits;

    event Deposited(address indexed lender, uint256 amount);
    event CollateralAdded(address indexed user, uint256 amount);
    event Borrowed(address indexed borrower, uint256 amount);
    event Repaid(address indexed borrower, uint256 amount);

    constructor(address stableAddr, address collateralAddr, address oracleAddr, address ftsoAddr) {
        stable = IERC20(stableAddr);
        collateralToken = IERC20(collateralAddr);
        oracle = IScoreOracle(oracleAddr);
        ftso = IFTSO(ftsoAddr);
    }

    // Lender deposits stable tokens to provide liquidity
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "amount>0");
        stable.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    // Borrower deposits FAsset collateral (ERC20 representation)
    function addCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "amount>0");
        collateralToken.transferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;
        emit CollateralAdded(msg.sender, amount);
    }

    // Compute collateral value via FTSO price oracle
    function _collateralValue(address user) internal view returns (uint256) {
        (uint256 price, ) = ftso.getLatestPrice(address(collateralToken));
        // price is assumed to be in stable token units with 18 decimals
        // collateralBalances recorded in token decimals; for simplicity assume token decimals = 18
        return (collateralBalances[user] * price) / (1 ether);
    }

    // Update borrow limit based on ScoreOracle + collateral + safety multiplier
    function getBorrowLimit(address user) public view returns (uint256) {
        uint256 score = oracle.getScore(user); // 0 - 1000
        uint256 collateralValue = _collateralValue(user);
        // risk multiplier: conservative base 60% (600 / 1000)
        uint256 riskMulNumerator = 600;
        uint256 limit = (score * collateralValue * riskMulNumerator) / (1000 * 1000);
        return limit;
    }

    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "amount>0");
        uint256 limit = getBorrowLimit(msg.sender);
        require(borrows[msg.sender] + amount <= limit, "exceeds limit");
        require(amount <= totalDeposits, "insufficient liquidity");
        borrows[msg.sender] += amount;
        stable.transfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "amount>0");
        require(borrows[msg.sender] >= amount, "repay > borrow");
        stable.transferFrom(msg.sender, address(this), amount);
        borrows[msg.sender] -= amount;
        emit Repaid(msg.sender, amount);
    }

    // Admin helper for demo: withdraw deposited stable (owner pattern omitted for simplicity)
    function adminWithdraw(address to, uint256 amount) external {
        require(amount <= totalDeposits, "too much");
        stable.transfer(to, amount);
        totalDeposits -= amount;
    }
}
