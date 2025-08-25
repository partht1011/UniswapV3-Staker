import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

const ERC20_ABI = [
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