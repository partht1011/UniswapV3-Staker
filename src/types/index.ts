export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface PoolPosition {
  tokenId: string;
  liquidity: string;
  token0: TokenInfo;
  token1: TokenInfo;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0: string;
  amount1: string;
}

export interface StakingRewards {
  earned: string;
  rate: string;
  totalStaked: string;
  userStaked: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  route: string[];
  priceImpact: string;
  gasEstimate: string;
}

export interface LiquidityParams {
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string;
  amount1Desired: string;
  amount0Min: string;
  amount1Min: string;
  recipient: string;
  deadline: number;
}

export interface StakeParams {
  tokenId: string;
  incentiveId: string;
}

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}