import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/config/abis';

export function useTokenBalance(tokenAddress: string) {
  const { address } = useAccount();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  });

  useEffect(() => {
    if (balanceData && decimalsData) {
      const formattedBalance = formatUnits(balanceData, decimalsData);
      setBalance(formattedBalance);
    }
  }, [balanceData, decimalsData]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      await refetchBalance();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    balance,
    isLoading,
    refetch,
  };
}