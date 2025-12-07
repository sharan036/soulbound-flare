export const NETWORKS = {
  local: {
    label: "Local Testnet",
    chainId: 31337,
    rpcUrl: "http://localhost:8545",
    relayer: "http://localhost:3001",
    contracts: {
      lendingPool:
        import.meta.env.VITE_LENDING_POOL_LOCAL ||
        import.meta.env.VITE_LENDING_POOL,
      soulbound:
        import.meta.env.VITE_SOULBOUND_LOCAL ||
        import.meta.env.VITE_SOULBOUND,
      collateral:
        import.meta.env.VITE_COLLATERAL_LOCAL ||
        import.meta.env.VITE_COLLATERAL,
      stable:
        import.meta.env.VITE_STABLE_LOCAL ||
        import.meta.env.VITE_STABLE,
      scoreOracle:
        import.meta.env.VITE_SCORE_ORACLE_LOCAL ||
        import.meta.env.VITE_SCORE_ORACLE
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
