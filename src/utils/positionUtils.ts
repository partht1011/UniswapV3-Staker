import { Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { formatUnits } from 'viem';
import { 
  createPool, 
  createPosition, 
  formatPositionDisplayData as formatPositionDisplayDataSDK,
  JOCX_TOKEN,
  USDT_TOKEN
} from '@/utils/uniswapUtils';

/**
 * Create Uniswap V3 SDK Position from position data
 * @deprecated Use createPosition from uniswapUtils instead
 */
export function createPositionFromData(
  positionData: any,
  currentTick: number,
  sqrtPriceX96: bigint,
  jocxTokenAddress: string,
  usdtTokenAddress: string,
  chainId: number = 1
) {
  try {
    // Create pool first
    const pool = createPool(sqrtPriceX96, BigInt(0), currentTick);
    
    // Create position using SDK utilities
    return createPosition(
      pool,
      positionData.tickLower,
      positionData.tickUpper,
      BigInt(positionData.liquidity)
    );
  } catch (error) {
    console.error('Error creating position:', error);
    return null;
  }
}

/**
 * Format position data for display
 * @deprecated Use formatPositionDisplayData from uniswapUtils instead
 */
export function formatPositionDisplayData(
  positionData: any,
  currentTick: number,
  sqrtPriceX96: bigint,
  jocxTokenAddress: string,
  usdtTokenAddress: string,
  jocxPrice: number = 0
) {
  try {
    // Create pool and use SDK utilities
    const pool = createPool(sqrtPriceX96, BigInt(0), currentTick);
    return formatPositionDisplayDataSDK(positionData, pool, jocxPrice);
  } catch (error) {
    console.error('Error formatting position data:', error);
    
    // Fallback to basic calculation
    return getBasicPositionInfo(positionData, jocxTokenAddress, usdtTokenAddress, jocxPrice);
  }
}

/**
 * Simple fallback calculation without SDK
 */
export function getBasicPositionInfo(
  positionData: any,
  jocxTokenAddress: string,
  usdtTokenAddress: string,
  jocxPrice: number = 0
) {
  const isJocxToken0 = positionData.token0.toLowerCase() === jocxTokenAddress.toLowerCase();
  
  // Format unclaimed fees
  const jocxFees = formatUnits(
    BigInt(isJocxToken0 ? positionData.tokensOwed0 : positionData.tokensOwed1),
    18
  );
  const usdtFees = formatUnits(
    BigInt(isJocxToken0 ? positionData.tokensOwed1 : positionData.tokensOwed0),
    6
  );

  // Simple liquidity display
  const liquidityFormatted = parseFloat(formatUnits(BigInt(positionData.liquidity), 18)).toFixed(4);
  
  // Estimate position value from liquidity (rough approximation)
  const estimatedValue = parseFloat(liquidityFormatted) * (jocxPrice || 1);

  return {
    jocxFees: parseFloat(jocxFees).toFixed(6),
    usdtFees: parseFloat(usdtFees).toFixed(6),
    liquidityFormatted,
    estimatedValue: estimatedValue.toFixed(2),
    feePercent: (positionData.fee / 10000).toFixed(2)
  };
}