// Contract addresses - Replace with actual addresses
export const CONTRACTS = {
  // JOCX Token Contract Address (Replace with actual)
  JOCX_TOKEN: '0xbb1E1399EEE1f577F1B4359224155f5Db39CA084',
  
  // USDT Token Contract Address
  USDT_TOKEN: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  
  // Uniswap v3 Staker Contract Address (Replace with actual)
  UNISWAP_V3_STAKER: '0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d',
  
  // Uniswap v3 Core Contracts
  UNISWAP_V3_FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  UNISWAP_V3_POSITION_MANAGER: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  
  // Common tokens
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86a33E6441b8C4505B7C0b5b5C0b5b5C0b5b5', // Replace with actual USDC address
};

// Pool configuration
export const POOL_CONFIG = {
  FEE_TIER: 3000, // 0.3% fee tier
  TICK_SPACING: 60,
};

// Staking configuration
export const STAKING_CONFIG = {
  REWARD_TOKEN: 'JOCX',
  POOL_PAIR: 'JOCX/USDT',
};

// Network configuration
export const NETWORK_CONFIG = {
  CHAIN_ID: 1, // Ethereum Mainnet
  CHAIN_NAME: 'Ethereum',
  RPC_URL: 'https://mainnet.infura.io/v3/d392a7e8626740d3a48379f0a533af9a', // Replace with actual RPC
};

// UI Configuration
export const UI_CONFIG = {
  APP_NAME: 'JOCX Liquidity Staking',
  APP_DESCRIPTION: 'Earn by providing liquidity to JOCX/USDT pool',
  BRAND_COLOR: '#3b82f6',
};