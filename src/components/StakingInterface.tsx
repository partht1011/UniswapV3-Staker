import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useStakingRewards } from '@/hooks/useStakingRewards';
import { CONTRACTS, STAKING_CONFIG } from '@/config/constants';
import { TransactionStatus } from '@/types';
import toast from 'react-hot-toast';

const STAKER_ABI = [
  {
    name: 'stakeToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'incentiveId', type: 'bytes32' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'unstakeToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'incentiveId', type: 'bytes32' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'claimReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'rewardToken', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amountRequested', type: 'uint256' },
    ],
    outputs: [{ name: 'reward', type: 'uint256' }],
  },
] as const;

interface StakingInterfaceProps {
  userPositions?: string[]; // Array of NFT token IDs
}

export function StakingInterface({ userPositions = [] }: StakingInterfaceProps) {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.IDLE);
  
  const { rewards, refetch: refetchRewards } = useStakingRewards();
  const { writeContract, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast.success('Transaction completed successfully!');
      setStatus(TransactionStatus.SUCCESS);
      refetchRewards();
    },
  });

  // Mock incentive ID - in production, this should be fetched from the contract
  const incentiveId = '0x0000000000000000000000000000000000000000000000000000000000000001';

  const handleStake = async () => {
    if (!address || !selectedTokenId) return;

    try {
      setStatus(TransactionStatus.PENDING);
      
      await writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: STAKER_ABI,
        functionName: 'stakeToken',
        args: [incentiveId as `0x${string}`, BigInt(selectedTokenId)],
      });

      toast.success('Stake transaction submitted!');
    } catch (error) {
      console.error('Stake failed:', error);
      toast.error('Failed to stake. Please try again.');
      setStatus(TransactionStatus.ERROR);
    }
  };

  const handleUnstake = async () => {
    if (!address || !selectedTokenId) return;

    try {
      setStatus(TransactionStatus.PENDING);
      
      await writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: STAKER_ABI,
        functionName: 'unstakeToken',
        args: [incentiveId as `0x${string}`, BigInt(selectedTokenId)],
      });

      toast.success('Unstake transaction submitted!');
    } catch (error) {
      console.error('Unstake failed:', error);
      toast.error('Failed to unstake. Please try again.');
      setStatus(TransactionStatus.ERROR);
    }
  };

  const handleClaimRewards = async () => {
    if (!address) return;

    try {
      setStatus(TransactionStatus.PENDING);
      
      await writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: STAKER_ABI,
        functionName: 'claimReward',
        args: [
          CONTRACTS.JOCX_TOKEN as `0x${string}`,
          address,
          BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), // Max uint256
        ],
      });

      toast.success('Claim transaction submitted!');
    } catch (error) {
      console.error('Claim failed:', error);
      toast.error('Failed to claim rewards. Please try again.');
      setStatus(TransactionStatus.ERROR);
    }
  };

  const isLoading = status === TransactionStatus.PENDING || isConfirming;

  return (
    <div className="space-y-8">
      {/* Enhanced Rewards Overview */}
      <div className="card glow-effect group">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Staking Rewards</h3>
            <p className="text-sm text-slate-600">Earn JOCX tokens by staking your LP positions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          
          <div className="stat-card bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/50 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Earned
              </div>
            </div>
            <p className="text-sm text-blue-600 font-medium mb-1">Claimable Rewards</p>
            <p className="text-3xl font-bold text-blue-700">
              {parseFloat(rewards).toFixed(4)}
            </p>
            <p className="text-xs text-blue-600 mt-1">JOCX Tokens</p>
          </div>
        </div>

        <button
          onClick={handleClaimRewards}
          disabled={!address || parseFloat(rewards) === 0 || isLoading}
          className="btn-primary w-full text-lg py-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
              <span>Claiming...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Claim {parseFloat(rewards).toFixed(4)} JOCX</span>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Staking Actions */}
      <div className="card glow-effect group">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Manage Positions</h3>
            <p className="text-sm text-slate-600">Stake your LP NFTs to earn rewards</p>
          </div>
        </div>
        
        {userPositions.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No Liquidity Positions</h4>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              Add liquidity to the JOCX/USDT pool first to start earning staking rewards
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200/50">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Switch to "Add Liquidity" tab</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select Position to Stake
              </label>
              <select
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
                className="input-field text-center font-semibold"
              >
                <option value="">Choose a position...</option>
                {userPositions.map((tokenId) => (
                  <option key={tokenId} value={tokenId}>
                    Position #{tokenId} - JOCX/USDT LP
                  </option>
                ))}
              </select>
            </div>

            {selectedTokenId && (
              <div className="card-compact bg-slate-50/80 space-y-3">
                <h5 className="font-semibold text-slate-900">Position Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Token ID:</span>
                    <span className="font-semibold text-slate-900">#{selectedTokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Liquidity:</span>
                    <span className="font-semibold text-slate-900">$1,250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fees Earned:</span>
                    <span className="font-semibold text-slate-900">$12.50</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleStake}
                disabled={!address || !selectedTokenId || isLoading}
                className="btn-primary py-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span>Staking...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Stake Position</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={handleUnstake}
                disabled={!address || !selectedTokenId || isLoading}
                className="btn-secondary py-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full"></div>
                    <span>Unstaking...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Unstake Position</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}