import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '@/config/constants';

// Simplified Uniswap V3 Staker ABI
const STAKER_ABI = [
  {
    name: 'rewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'rewardToken', type: 'address' },
      { name: 'owner', type: 'address' }
    ],
    outputs: [{ name: 'reward', type: 'uint256' }],
  },
  {
    name: 'stakes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'incentiveId', type: 'bytes32' }
    ],
    outputs: [
      { name: 'secondsPerLiquidityInsideInitialX128', type: 'uint160' },
      { name: 'liquidity', type: 'uint128' }
    ],
  },
] as const;

export function useStakingRewards() {
  const { address } = useAccount();
  const [rewards, setRewards] = useState<string>('0');
  const [totalStaked, setTotalStaked] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const { data: rewardsData, refetch: refetchRewards } = useReadContract({
    address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
    abi: STAKER_ABI,
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