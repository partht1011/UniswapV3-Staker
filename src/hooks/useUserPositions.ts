import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { CONTRACTS } from '@/config/constants';

const POSITION_MANAGER_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'positions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
  },
] as const;

export interface Position {
  tokenId: string;
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
}

export function useUserPositions() {
  const { address } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Get the number of positions owned by the user
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Create contracts array for fetching token IDs
  const tokenIdContracts = balance ? Array.from({ length: Number(balance) }, (_, i) => ({
    address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'tokenOfOwnerByIndex' as const,
    args: [address!, BigInt(i)],
  })) : [];

  // Fetch all token IDs at once
  const { data: tokenIdResults, isLoading: isLoadingTokenIds } = useReadContracts({
    contracts: tokenIdContracts,
    query: {
      enabled: !!address && !!balance && Number(balance) > 0,
    },
  });

  // Create contracts array for fetching position details
  const positionContracts = tokenIds.map(tokenId => ({
    address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions' as const,
    args: [BigInt(tokenId)],
  }));

  // Fetch all position details at once
  const { data: positionResults, isLoading: isLoadingPositionDetails } = useReadContracts({
    contracts: positionContracts,
    query: {
      enabled: tokenIds.length > 0,
    },
  });

  // Process token ID results
  useEffect(() => {
    if (tokenIdResults) {
      const validTokenIds = tokenIdResults
        .filter(result => result.status === 'success' && result.result)
        .map(result => (result.result as bigint).toString());
      
      setTokenIds(validTokenIds);
    }
  }, [tokenIdResults]);

  // Process position results
  useEffect(() => {
    if (positionResults && tokenIds.length > 0) {
      setIsLoadingPositions(true);
      
      const validPositions: Position[] = [];
      
      positionResults.forEach((result, index) => {
        if (result.status === 'success' && result.result) {
          const tokenId = tokenIds[index];
          const [
            nonce,
            operator,
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1,
          ] = result.result;

          // Filter for JOCX/USDT positions only
          const isJocxUsdtPosition = 
            (token0.toLowerCase() === CONTRACTS.JOCX_TOKEN.toLowerCase() && 
             token1.toLowerCase() === CONTRACTS.USDT_TOKEN.toLowerCase()) ||
            (token0.toLowerCase() === CONTRACTS.USDT_TOKEN.toLowerCase() && 
             token1.toLowerCase() === CONTRACTS.JOCX_TOKEN.toLowerCase());

          // Only include positions with liquidity > 0
          if (isJocxUsdtPosition && BigInt(liquidity) > 0n) {
            validPositions.push({
              tokenId,
              token0: token0 as string,
              token1: token1 as string,
              fee: Number(fee),
              tickLower: Number(tickLower),
              tickUpper: Number(tickUpper),
              liquidity: liquidity.toString(),
              tokensOwed0: tokensOwed0.toString(),
              tokensOwed1: tokensOwed1.toString(),
            });
          }
        }
      });
      
      setPositions(validPositions);
      setIsLoadingPositions(false);
    }
  }, [positionResults, tokenIds]);

  // Reset positions when address changes or balance is 0
  useEffect(() => {
    if (!address || (balance !== undefined && Number(balance) === 0)) {
      setPositions([]);
      setTokenIds([]);
    }
  }, [address, balance]);

  const refetch = async () => {
    await refetchBalance();
  };

  const isLoading = isLoadingBalance || isLoadingTokenIds || isLoadingPositionDetails || isLoadingPositions;

  return {
    positions,
    isLoading,
    refetch,
    tokenIds: positions.map(p => p.tokenId),
    balance: balance ? Number(balance) : 0,
  };
}