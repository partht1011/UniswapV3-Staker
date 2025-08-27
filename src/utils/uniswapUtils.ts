/**
 * Uniswap v3 SDK utilities for proper pool and position management
 */

import { Token, CurrencyAmount, Price, Percent } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick, TickMath, priceToClosestTick, encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACTS, POOL_CONFIG } from '@/config/constants';

// Chain ID for Ethereum mainnet
export const CHAIN_ID = 1;

// Token instances - created once and reused
export const JOCX_TOKEN = new Token(
  CHAIN_ID,
  CONTRACTS.JOCX_TOKEN,
  18,
  'JOCX',
  'JOCX Token'
);

export const USDT_TOKEN = new Token(
  CHAIN_ID,
  CONTRACTS.USDT_TOKEN,
  6,
  'USDT',
  'Tether USD'
);

// Determine token order (Uniswap uses lexicographic ordering)
export const TOKEN_0 = JOCX_TOKEN.address.toLowerCase() < USDT_TOKEN.address.toLowerCase() ? JOCX_TOKEN : USDT_TOKEN;
export const TOKEN_1 = JOCX_TOKEN.address.toLowerCase() < USDT_TOKEN.address.toLowerCase() ? USDT_TOKEN : JOCX_TOKEN;

/**
 * Create a Pool instance from on-chain data
 */
export function createPool(
  sqrtPriceX96: bigint,
  liquidity: bigint,
  tick: number
): Pool {
  return new Pool(
    TOKEN_0,
    TOKEN_1,
    POOL_CONFIG.FEE_TIER,
    sqrtPriceX96.toString(),
    liquidity.toString(),
    tick
  );
}

/**
 * Calculate token price using Uniswap v3 SDK
 */
export function calculateTokenPrice(pool: Pool): number {
  try {
    // Get the price of TOKEN_1 in terms of TOKEN_0
    const price = pool.token0Price;
    
    // If JOCX is token0, we want the price of JOCX in USDT
    // If JOCX is token1, we want the inverse
    if (TOKEN_0.address.toLowerCase() === JOCX_TOKEN.address.toLowerCase()) {
      return parseFloat(price.toSignificant(6));
    } else {
      return parseFloat(price.invert().toSignificant(6));
    }
  } catch (error) {
    console.error('Error calculating token price:', error);
    return 0;
  }
}

/**
 * Create a Position instance from position data
 */
export function createPosition(
  pool: Pool,
  tickLower: number,
  tickUpper: number,
  liquidity: bigint
): Position | null {
  try {
    return new Position({
      pool,
      liquidity: liquidity.toString(),
      tickLower,
      tickUpper,
    });
  } catch (error) {
    console.error('Error creating position:', error);
    return null;
  }
}

/**
 * Calculate position token amounts
 */
export function calculatePositionAmounts(position: Position): {
  jocxAmount: string;
  usdtAmount: string;
  jocxAmountRaw: bigint;
  usdtAmountRaw: bigint;
} {
  const amount0 = position.amount0;
  const amount1 = position.amount1;
  
  const isJocxToken0 = TOKEN_0.address.toLowerCase() === JOCX_TOKEN.address.toLowerCase();
  
  return {
    jocxAmount: isJocxToken0 ? amount0.toExact() : amount1.toExact(),
    usdtAmount: isJocxToken0 ? amount1.toExact() : amount0.toExact(),
    jocxAmountRaw: isJocxToken0 ? BigInt(amount0.quotient.toString()) : BigInt(amount1.quotient.toString()),
    usdtAmountRaw: isJocxToken0 ? BigInt(amount1.quotient.toString()) : BigInt(amount0.quotient.toString()),
  };
}

/**
 * Calculate position value in USD
 */
export function calculatePositionValue(
  position: Position,
  jocxPrice: number
): number {
  const amounts = calculatePositionAmounts(position);
  const jocxValue = parseFloat(amounts.jocxAmount) * jocxPrice;
  const usdtValue = parseFloat(amounts.usdtAmount);
  
  return jocxValue + usdtValue;
}

/**
 * Check if position is in range (active)
 */
export function isPositionInRange(position: Position): boolean {
  const pool = position.pool;
  return pool.tickCurrent >= position.tickLower && pool.tickCurrent < position.tickUpper;
}

/**
 * Calculate optimal tick range for full range position
 */
export function getFullRangeTickLower(tickSpacing: number): number {
  return nearestUsableTick(TickMath.MIN_TICK, tickSpacing);
}

export function getFullRangeTickUpper(tickSpacing: number): number {
  return nearestUsableTick(TickMath.MAX_TICK, tickSpacing);
}

/**
 * Calculate tick spacing for fee tier
 */
export function getTickSpacing(feeTier: number): number {
  switch (feeTier) {
    case 500:
      return 10;
    case 3000:
      return 60;
    case 10000:
      return 200;
    default:
      return 60; // Default to 0.3% fee tier
  }
}

/**
 * Format position display data using SDK
 */
export function formatPositionDisplayData(
  positionData: any,
  pool: Pool,
  jocxPrice: number = 0
): {
  jocxAmount: string;
  usdtAmount: string;
  jocxFees: string;
  usdtFees: string;
  positionValue: string;
  isActive: boolean;
  liquidityFormatted: string;
} {
  const isJocxToken0 = TOKEN_0.address.toLowerCase() === JOCX_TOKEN.address.toLowerCase();
  
  // Format unclaimed fees
  const jocxFees = formatUnits(
    BigInt(isJocxToken0 ? positionData.tokensOwed0 : positionData.tokensOwed1),
    JOCX_TOKEN.decimals
  );
  const usdtFees = formatUnits(
    BigInt(isJocxToken0 ? positionData.tokensOwed1 : positionData.tokensOwed0),
    USDT_TOKEN.decimals
  );

  let jocxAmount = '0';
  let usdtAmount = '0';
  let positionValue = 0;
  let isActive = false;

  try {
    const position = createPosition(
      pool,
      positionData.tickLower,
      positionData.tickUpper,
      BigInt(positionData.liquidity)
    );

    if (position) {
      const amounts = calculatePositionAmounts(position);
      jocxAmount = amounts.jocxAmount;
      usdtAmount = amounts.usdtAmount;
      positionValue = calculatePositionValue(position, jocxPrice);
      isActive = isPositionInRange(position);
    }
  } catch (error) {
    console.error('Error calculating position amounts:', error);
    
    // Fallback: show liquidity value as a rough estimate
    const liquidityValue = parseFloat(formatUnits(BigInt(positionData.liquidity), 18));
    jocxAmount = (liquidityValue * 0.5 / (jocxPrice || 1)).toFixed(6);
    usdtAmount = (liquidityValue * 0.5).toFixed(6);
    positionValue = liquidityValue;
  }

  return {
    jocxAmount: parseFloat(jocxAmount).toFixed(6),
    usdtAmount: parseFloat(usdtAmount).toFixed(6),
    jocxFees: parseFloat(jocxFees).toFixed(6),
    usdtFees: parseFloat(usdtFees).toFixed(6),
    positionValue: positionValue.toFixed(2),
    isActive,
    liquidityFormatted: parseFloat(formatUnits(BigInt(positionData.liquidity), 18)).toFixed(4)
  };
}

/**
 * Calculate amounts for adding liquidity
 */
export function calculateLiquidityAmounts(
  pool: Pool,
  tickLower: number,
  tickUpper: number,
  amount0Desired: bigint,
  amount1Desired: bigint
): {
  amount0: bigint;
  amount1: bigint;
  liquidity: bigint;
} {
  try {
    // Create a position with desired amounts to calculate actual amounts
    const token0Amount = CurrencyAmount.fromRawAmount(TOKEN_0, amount0Desired.toString());
    const token1Amount = CurrencyAmount.fromRawAmount(TOKEN_1, amount1Desired.toString());
    
    const position = Position.fromAmounts({
      pool,
      tickLower,
      tickUpper,
      amount0: token0Amount.quotient.toString(),
      amount1: token1Amount.quotient.toString(),
      useFullPrecision: false,
    });

    return {
      amount0: BigInt(position.amount0.quotient.toString()),
      amount1: BigInt(position.amount1.quotient.toString()),
      liquidity: BigInt(position.liquidity.toString()),
    };
  } catch (error) {
    console.error('Error calculating liquidity amounts:', error);
    return {
      amount0: amount0Desired,
      amount1: amount1Desired,
      liquidity: BigInt(0),
    };
  }
}

/**
 * Calculate slippage amounts
 */
export function calculateSlippageAmounts(
  amount: bigint,
  slippagePercent: number = 5
): {
  min: bigint;
  max: bigint;
} {
  const slippage = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
  const min = (amount * (BigInt(10000) - slippage)) / BigInt(10000);
  const max = (amount * (BigInt(10000) + slippage)) / BigInt(10000);
  
  return { min, max };
}

/**
 * Get price impact for a trade
 */
export function calculatePriceImpact(
  pool: Pool,
  inputAmount: CurrencyAmount<Token>,
  outputAmount: CurrencyAmount<Token>
): Percent {
  const exactQuote = pool.getOutputAmount(inputAmount);
  return new Percent(
    exactQuote[0].subtract(outputAmount).quotient,
    exactQuote[0].quotient
  );
}

/**
 * Helper to create currency amounts
 */
export function createCurrencyAmount(
  token: Token,
  amount: string
): CurrencyAmount<Token> {
  const parsedAmount = parseUnits(amount, token.decimals);
  return CurrencyAmount.fromRawAmount(token, parsedAmount.toString());
}

/**
 * Helper to format currency amounts
 */
export function formatCurrencyAmount(
  amount: CurrencyAmount<Token>,
  significantDigits: number = 6
): string {
  return amount.toSignificant(significantDigits);
}