import { useState, useEffect } from 'react';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS, POOL_CONFIG } from '@/config/constants';
import { formatCurrency } from '@/utils/common';
import { 
  UNISWAP_V3_FACTORY_ABI, 
  UNISWAP_V3_POOL_ABI, 
  ERC20_ABI 
} from '@/config/abis';
import { 
  createPool, 
  calculateTokenPrice, 
  JOCX_TOKEN, 
  USDT_TOKEN 
} from '@/utils/uniswapUtils';

export interface PoolData {
  poolAddress: string | null;
  tvl: string;
  jocxPrice: number;
  liquidity: string;
  jocxBalance: number;
  usdtBalance: number;
  activeStakers: number;
  isLoading: boolean;
  error: string | null;
}

export function usePoolData(): PoolData {
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [tvl, setTvl] = useState<string>('0');
  const [jocxPrice, setJocxPrice] = useState<number>(0);
  const [liquidity, setLiquidity] = useState<string>('0');
  const [jocxBalance, setJocxBalance] = useState<number>(0);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [activeStakers, setActiveStakers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get pool address from factory
  const { data: poolAddressData} = useReadContract({
    address: CONTRACTS.UNISWAP_V3_FACTORY as `0x${string}`,
    abi: UNISWAP_V3_FACTORY_ABI,
    functionName: 'getPool',
    args: [
      CONTRACTS.JOCX_TOKEN as `0x${string}`,
      CONTRACTS.USDT_TOKEN as `0x${string}`,
      POOL_CONFIG.FEE_TIER,
    ],
  });

  // Update pool address when data is available
  useEffect(() => {

    if (poolAddressData && poolAddressData !== '0x0000000000000000000000000000000000000000') {
      setPoolAddress(poolAddressData);
    }
  }, [poolAddressData]);

  // Pool data contracts
  const { data: poolDataResults, isLoading: poolDataLoading } = useReadContracts({
    contracts: poolAddress ? [
      {
        address: poolAddress as `0x${string}`,
        abi: UNISWAP_V3_POOL_ABI,
        functionName: 'slot0',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: UNISWAP_V3_POOL_ABI,
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
          slot0Result?.status === 'success' &&
          liquidityResult?.status === 'success' &&
          jocxBalanceResult?.status === 'success' &&
          usdtBalanceResult?.status === 'success' &&
          jocxDecimalsResult?.status === 'success' &&
          usdtDecimalsResult?.status === 'success'
        ) {
          const slot0Data = slot0Result.result;
          const sqrtPriceX96 = slot0Data[0];
          const tick = slot0Data[1];
          const liquidityData = liquidityResult.result;
          const jocxBalance = jocxBalanceResult.result;
          const usdtBalance = usdtBalanceResult.result;
          const jocxDecimals = jocxDecimalsResult.result;
          const usdtDecimals = usdtDecimalsResult.result;

          // Create pool instance using SDK
          const pool = createPool(sqrtPriceX96, liquidityData, tick);
          
          // Calculate JOCX price using SDK
          const price = calculateTokenPrice(pool);
          setJocxPrice(price);

          // Calculate TVL
          const jocxBalanceFormatted = parseFloat(formatUnits(jocxBalance, jocxDecimals));
          const usdtBalanceFormatted = parseFloat(formatUnits(usdtBalance, usdtDecimals));

          const tvlValue = (jocxBalanceFormatted * price) + usdtBalanceFormatted;
          setTvl(formatCurrency(tvlValue));

          // Set liquidity
          setLiquidity(formatUnits(liquidityData, 0));
          setJocxBalance(jocxBalanceFormatted);
          setUsdtBalance(usdtBalanceFormatted);

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
    jocxBalance,
    usdtBalance,
    activeStakers,
    isLoading,
    error,
  };
}

// Note: Price calculation is now handled by the Uniswap v3 SDK in uniswapUtils.ts

