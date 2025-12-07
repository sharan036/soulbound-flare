export const NETWORKS = {
  local: {
    label: "Local Testnet",
    chainId: 31337,
    rpcUrl: "http://localhost:8545",
    relayer: "http://localhost:3001",
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_LOCAL || "",
      soulbound: import.meta.env.VITE_SOULBOUND_LOCAL || "",
      collateral: import.meta.env.VITE_COLLATERAL_LOCAL || "",
      stable: import.meta.env.VITE_STABLE_LOCAL || "",
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_LOCAL || ""
    }
  },

  flare: {
    label: "Flare Mainnet",
    chainId: 14,
    rpcUrl: "https://flare-api.flare.network/ext/bc/C/rpc",
    relayer: import.meta.env.VITE_RELAYER_FLARE || "https://api.modran.xyz/relay",
    contracts: {
      lendingPool: import.meta.env.VITE_LENDING_POOL_FLARE || "",
      soulbound: import.meta.env.VITE_SOULBOUND_FLARE || "",
      collateral: import.meta.env.VITE_COLLATERAL_FLARE || "",
      stable: import.meta.env.VITE_STABLE_FLARE || "",
      scoreOracle: import.meta.env.VITE_SCORE_ORACLE_FLARE || ""
    }
  }
};
