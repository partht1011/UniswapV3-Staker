import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: 'allowance', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;

export function useTokenApproval(tokenAddress: string, spenderAddress: string) {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [allowance, setAllowance] = useState<string>('0');

  // Read current allowance
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress,
    },
  });

  // Get token decimals
  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Write contract for approval
  const { writeContract: approve, data: approvalHash, isError: isApprovalError } = useWriteContract();

  // Wait for approval transaction
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Update allowance when data changes
  useEffect(() => {
    if (allowanceData && decimalsData) {
      const formattedAllowance = formatUnits(allowanceData, decimalsData);
      setAllowance(formattedAllowance);
    }
  }, [allowanceData, decimalsData]);

  // Handle approval success/error
  useEffect(() => {
    if (isApprovalError) {
      setIsApproving(false);
    }
    if (isApprovalSuccess) {
      setIsApproving(false);
      refetchAllowance();
    }
  }, [isApprovalError, isApprovalSuccess, refetchAllowance]);

  const approveToken = async (amount: string) => {
    if (!address || !decimalsData) return;

    setIsApproving(true);
    try {
      const amountInWei = parseUnits(amount, decimalsData);
      
      approve({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amountInWei],
      });
    } catch (error) {
      console.error('Approval failed:', error);
      setIsApproving(false);
    }
  };

  const hasAllowance = (requiredAmount: string): boolean => {
    if (!allowance || !requiredAmount) return false;
    return parseFloat(allowance) >= parseFloat(requiredAmount);
  };

  return {
    allowance,
    isApproving,
    approveToken,
    hasAllowance,
    refetchAllowance,
    isApprovalSuccess,
    isApprovalError,
  };
}