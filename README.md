
# MODRAN — SoulBound Lending Protocol (Flare + EIP-712 Relayer + SBT Credit Scoring)

A next-generation decentralized lending protocol powered by SoulBound Tokens, AI-based scoring (mock), and gasless EIP‑712 relaying.  
Supports Local Hardhat, Flare Testnet, and Ethereum Mainnet.

---

## Features

- SoulBound identity (non-transferable)
- AI‑based credit score (mock backend or ScoreOracle)
- Gasless EIP‑712 relay for borrow/repay/deposit
- Network switching (Local / Flare / Mainnet)
- Neon Glass UI (React + Pure CSS)
- Guided onboarding tour
- Realtime score history
- Secure backend relayer

---

## Project Structure

```
project/
├── backend/
├── contracts/
├── frontend/
└── hardhat/
```

---

## Backend Setup

```
cd backend
npm install
```

Create **backend/.env**:

```
RPC_URL=http://localhost:8545
RELAYER_PRIVATE_KEY=0xYourPrivateKey
SCORE_ORACLE_ADDRESS=0xOracle
PORT=3001
```

Run backend:

```
npm start
```

---

## Frontend Setup

```
cd frontend
npm install
```

Create **frontend/.env**:

```
VITE_LENDING_POOL_LOCAL=0x...
VITE_SOULBOUND_LOCAL=0x...
VITE_COLLATERAL_LOCAL=0x...
VITE_STABLE_LOCAL=0x...
VITE_SCORE_ORACLE_LOCAL=0x...

VITE_RPC_LOCAL=http://localhost:8545
VITE_RELAYER_LOCAL=http://localhost:3001
```

Run frontend:

```
npm run dev
```

---

## Local Deployment (Hardhat)

```
cd hardhat
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Deployment script will auto‑write all addresses into **frontend/.env**.

---

## Testing Flows

### 1️ Connect MetaMask  
Switch to **Localhost 8545** or **Flare**.

### 2️ Mint SBT  
Creates identity profile.

### 3️ Trigger Score  
Backend computes mock AI score.

### 4️ Deposit → Borrow → Repay  
Gasless using EIP‑712 typed signatures.

---

## Network Switching

The top‑right dropdown switches between:

| Network | Purpose |
|--------|---------|
| Local Testnet | Dev mode |
| Flare C‑Chain | Hackathon chain |
| Ethereum Mainnet | Production |

Changing the network updates:
- RPC URL  
- All contract addresses  
- Relayer backend URL  

---

## Contracts Included

- **LendingPool.sol**
- **SoulBound.sol**
- **ScoreOracle.sol**
- **ERC20Collateal.sol**
- **StableToken.sol**

---

## 👨 Development Notes

- React App auto-refreshes score history every 6 seconds.
- Relayer validates typed EIP‑712 signatures.
- BorrowLimits determined from ScoreOracle.
- UI shows user‑friendly previews before they sign.
---
## Deploy link
- **Frontend:** https://soulbound-flare.vercel.app/
- **Backend:**  
---
## Contract address
- **ERC20Collateal.sol:** 0xA5Bc167931bFAFd5FBF9c84488531300404Fc353
- **StableToken.sol:** 0xfDEbB94e267eF613A86A141E86cA6052158B8103
- **ScoreOracle.sol:** 0x7148FB9C8d03382C79CaAb4E1e6Bc04f2388b72B


## ❤️ Built By  
**DIL — MODRAN Protocol**
