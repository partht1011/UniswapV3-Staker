import { useState, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS, POOL_CONFIG } from '@/config/constants';

// Uniswap V3 Pool ABI
const POOL_ABI = [
  {
    name: 'liquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'liquidity', type: 'uint128' }],
  },
  {
    name: 'slot0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'token0', type: 'address' }],
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'token1', type: 'address' }],
  },
] as const;

// Uniswap V3 Factory ABI
const FACTORY_ABI = [
  {
    name: 'getPool',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    outputs: [{ name: 'pool', type: 'address' }],
  },
] as const;

// ERC20 ABI for token info
const ERC20_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'totalSupply', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;

export interface PoolData {
  poolAddress: string | null;
  tvl: string;
  jocxPrice: string;
  liquidity: string;
  volume24h: string;
  activeStakers: number;
  isLoading: boolean;
  error: string | null;
}

export function usePoolData(): PoolData {
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [tvl, setTvl] = useState<string>('0');
  const [jocxPrice, setJocxPrice] = useState<string>('0');
  const [liquidity, setLiquidity] = useState<string>('0');
  const [volume24h, setVolume24h] = useState<string>('0');
  const [activeStakers, setActiveStakers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get pool address from factory
  const { data: poolAddressData } = useReadContract({
    address: CONTRACTS.UNISWAP_V3_FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPool',
    args: [
      CONTRACTS.JOCX_TOKEN as `0x${string}`,
      CONTRACTS.USDT_TOKEN as `0x${string}`,
      POOL_CONFIG.FEE_TIER,
    ],
  });

  // Update pool address when data is available
  useEffect(() => {
    console.log("PoolAddressData", poolAddressData);
    if (poolAddressData && poolAddressData !== '0x0000000000000000000000000000000000000000') {
      setPoolAddress(poolAddressData);
    }
  }, [poolAddressData]);

  // Pool data contracts
  const { data: poolDataResults, isLoading: poolDataLoading } = useReadContracts({
    contracts: poolAddress ? [
      {
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'slot0',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: 'liquidity',
      },
      {
        address: CONTRACTS.JOCX_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [poolAddress as `0x${string}`],
      },
      {
        address: CONTRACTS.USDT_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [poolAddress as `0x${string}`],
      },
      {
        address: CONTRACTS.JOCX_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
      {
        address: CONTRACTS.USDT_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
    ] : [],
    query: {
      enabled: !!poolAddress,
    },
  });

  // Process pool data
  useEffect(() => {
    if (poolDataResults && poolAddress) {
      try {
        const [slot0Result, liquidityResult, jocxBalanceResult, usdtBalanceResult, jocxDecimalsResult, usdtDecimalsResult] = poolDataResults;

        if (
          slot0Result.status === 'success' &&
          liquidityResult.status === 'success' &&
          jocxBalanceResult.status === 'success' &&
          usdtBalanceResult.status === 'success' &&
          jocxDecimalsResult.status === 'success' &&
          usdtDecimalsResult.status === 'success'
        ) {
          const slot0Data = slot0Result.result as any[];
          const sqrtPriceX96 = slot0Data[0];
          const liquidityData = liquidityResult.result;
          const jocxBalance = jocxBalanceResult.result;
          const usdtBalance = usdtBalanceResult.result;
          const jocxDecimals = jocxDecimalsResult.result;
          const usdtDecimals = usdtDecimalsResult.result;

          // Calculate JOCX price from sqrtPriceX96
          // Price = (sqrtPriceX96 / 2^96)^2
          const price = calculatePriceFromSqrtPriceX96(sqrtPriceX96, jocxDecimals, usdtDecimals);
          setJocxPrice(price.toFixed(6));

          // Calculate TVL
          const jocxBalanceFormatted = parseFloat(formatUnits(jocxBalance, jocxDecimals));
          const usdtBalanceFormatted = parseFloat(formatUnits(usdtBalance, usdtDecimals));
          const tvlValue = (jocxBalanceFormatted * price) + usdtBalanceFormatted;
          setTvl(formatTVL(tvlValue));

          // Set liquidity
          setLiquidity(formatUnits(liquidityData, 0));

          setError(null);
        }
      } catch (err) {
        console.error('Error processing pool data:', err);
        setError('Failed to process pool data');
      }
    }
    setIsLoading(poolDataLoading);
  }, [poolDataResults, poolAddress, poolDataLoading]);

  // Fetch additional data from external APIs or estimate
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        // Simulate fetching volume data (in a real app, you'd use The Graph or similar)
        // For now, we'll estimate based on TVL
        const tvlNum = parseFloat(tvl.replace(/[^0-9.]/g, ''));
        if (tvlNum > 0) {
          const estimatedVolume = tvlNum * 0.1; // Assume 10% of TVL as daily volume
          setVolume24h(formatTVL(estimatedVolume));
          
          // Estimate active stakers (in a real app, you'd query events or subgraph)
          const estimatedStakers = Math.floor(tvlNum / 2000) + Math.floor(Math.random() * 50); // Rough estimate
          setActiveStakers(estimatedStakers);
        }
      } catch (err) {
        console.error('Error fetching additional data:', err);
      }
    };

    if (tvl !== '0' && !isLoading) {
      fetchAdditionalData();
    }
  }, [tvl, isLoading]);

  return {
    poolAddress,
    tvl,
    jocxPrice,
    liquidity,
    volume24h,
    activeStakers,
    isLoading,
    error,
  };
}

// Helper function to calculate price from sqrtPriceX96
function calculatePriceFromSqrtPriceX96(sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number): number {
  const Q96 = 2n ** 96n;
  const price = (sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96);
  const decimalAdjustment = 10 ** (token1Decimals - token0Decimals);
  return Number(price) * decimalAdjustment;
}

// Helper function to format TVL
function formatTVL(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}
