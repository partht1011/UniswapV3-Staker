import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '@/config/constants';
import { UNISWAP_V3_STAKER_ABI } from '@/config/abis';

export function useStakingRewards() {
  const { address } = useAccount();
  const [rewards, setRewards] = useState<string>('0');
  const [totalStaked, setTotalStaked] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const { data: rewardsData, refetch: refetchRewards } = useReadContract({
    address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
    abi: UNISWAP_V3_STAKER_ABI,
    functionName: 'rewards',
    args: address ? [CONTRACTS.JOCX_TOKEN as `0x${string}`, address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (rewardsData) {
      const formattedRewards = formatUnits(rewardsData, 18); // Assuming 18 decimals for JOCX
      setRewards(formattedRewards);
    }
  }, [rewardsData]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      await refetchRewards();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rewards,
    totalStaked,
    isLoading,
    refetch,
  };
}