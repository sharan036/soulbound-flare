export const NETWORKS = {
  local: {
    label: "Local Testnet",
    chainId: 31337,
    rpcUrl: "http://localhost:8545",
    relayer: "http://localhost:3001",
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_LOCAL,
      soulbound: import.meta.env.VITE_SOULBOUND_LOCAL,
      collateral: import.meta.env.VITE_COLLATERAL_LOCAL,
      stable: import.meta.env.VITE_STABLE_LOCAL,
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_LOCAL
    }
  },

  flare: {
    label: "Flare Mainnet",
    chainId: 14,
    rpcUrl: "https://flare-api.flare.network/ext/bc/C/rpc",
    relayer: "https://api.modran.xyz/relay",
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_MAINNET,
      soulbound: import.meta.env.VITE_SOULBOUND_MAINNET,
      collateral: import.meta.env.VITE_COLLATERAL_MAINNET,
      stable: import.meta.env.VITE_STABLE_MAINNET,
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_MAINNET
    }
  }
};
