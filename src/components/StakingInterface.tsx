import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useStakingRewards } from '@/hooks/useStakingRewards';
import { useUserPositions } from '@/hooks/useUserPositions';
import { CONTRACTS, STAKING_CONFIG } from '@/config/constants';
import toast from 'react-hot-toast';
import { formatUnits } from 'viem';
import { usePoolData } from '@/hooks/usePoolData';
import { getBasicPositionInfo } from '@/utils/positionUtils';
import { UNISWAP_V3_STAKER_ABI } from '@/config/abis';

interface StakingInterfaceProps {
  userPositions?: string[]; // Array of NFT token IDs
}

export function StakingInterface({ userPositions = [] }: StakingInterfaceProps) {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [available, setAvailable] = useState<boolean>(true);
  const [isPositionSelectorOpen, setIsPositionSelectorOpen] = useState(false);
  
  const { rewards, refetch: refetchRewards } = useStakingRewards();
  const { positions, isLoading: isLoadingPositions } = useUserPositions();
  const poolData = usePoolData();
  const { writeContract, data: hash, isError } = useWriteContract();
  
  const { isSuccess } = useWaitForTransactionReceipt({
    hash
  });  
  
  useEffect(() => {
    if(isError) {
      setAvailable(true);
      return;
    }
    if(isSuccess) {
    }
  }, [isError, isSuccess]);


  // Mock incentive ID - in production, this should be fetched from the contract
  const incentiveId = '0x0000000000000000000000000000000000000000000000000000000000000001';

  const handleStake = async () => {
    if (!address || !selectedTokenId) return;

    setAvailable(false);
    try {
      
      writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'stakeToken',
        args: [incentiveId as `0x${string}`, BigInt(selectedTokenId)],
      });

      toast.success('Stake transaction submitted!');
    } catch (error) {
      console.error('Stake failed:', error);
      toast.error('Failed to stake. Please try again.');
      setAvailable(true);
    }
  };

  const handleUnstake = async () => {
    if (!address || !selectedTokenId) return;

    setAvailable(false);
    try {
      
      writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'unstakeToken',
        args: [incentiveId as `0x${string}`, BigInt(selectedTokenId)],
      });

      toast.success('Unstake transaction submitted!');
    } catch (error) {
      console.error('Unstake failed:', error);
      toast.error('Failed to unstake. Please try again.');
      setAvailable(true);
    }
  };

  const handleClaimRewards = async () => {
    if (!address) return;

    setAvailable(false);
    try {
      
      writeContract({
        address: CONTRACTS.UNISWAP_V3_STAKER as `0x${string}`,
        abi: UNISWAP_V3_STAKER_ABI,
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
      setAvailable(true);
    }
  };

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
          disabled={!address || parseFloat(rewards) === 0 || !available}
          className="btn-primary w-full text-lg py-4"
        >
          {!available ? (
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
        
        {isLoadingPositions ? (
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Loading Positions...</h4>
            <p className="text-slate-600">Fetching your liquidity positions from the blockchain</p>
          </div>
        ) : positions.length === 0 ? (
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
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Select Position to Stake
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsPositionSelectorOpen(!isPositionSelectorOpen)}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedTokenId ? (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">#</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">Position #{selectedTokenId}</div>
                            <div className="text-sm text-slate-500">
                              {(() => {
                                const position = positions.find(p => p.tokenId === selectedTokenId);
                                if (!position) return '';
                                const positionInfo = getBasicPositionInfo(position, CONTRACTS.JOCX_TOKEN, CONTRACTS.USDT_TOKEN, poolData.jocxPrice);
                                return `Fee: ${positionInfo.feePercent}% • Value: $${positionInfo.estimatedValue}`;
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">Choose a position...</div>
                            <div className="text-sm text-slate-500">Select from your {positions.length} positions</div>
                          </div>
                        </>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isPositionSelectorOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isPositionSelectorOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                    {positions.map((position) => (
                      <button
                        key={position.tokenId}
                        onClick={() => {
                          setSelectedTokenId(position.tokenId);
                          setIsPositionSelectorOpen(false);
                        }}
                        className="w-full p-4 text-left hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">#</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">Position #{position.tokenId}</div>
                            {(() => {
                              const positionInfo = getBasicPositionInfo(position, CONTRACTS.JOCX_TOKEN, CONTRACTS.USDT_TOKEN, poolData.jocxPrice);
                              return (
                                <>
                                  <div className="text-sm text-slate-500">
                                    Fee: {positionInfo.feePercent}% • Liquidity: {positionInfo.liquidityFormatted}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    Value: ${positionInfo.estimatedValue} • JOCX Fees: {positionInfo.jocxFees} • USDT Fees: {positionInfo.usdtFees}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          {selectedTokenId === position.tokenId && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedTokenId && (() => {
              const selectedPosition = positions.find(p => p.tokenId === selectedTokenId);
              if (!selectedPosition) return null;
              
              const isJocxToken0 = selectedPosition.token0.toLowerCase() === CONTRACTS.JOCX_TOKEN.toLowerCase();
              const jocxTokensOwed = isJocxToken0 ? selectedPosition.tokensOwed0 : selectedPosition.tokensOwed1;
              const usdtTokensOwed = isJocxToken0 ? selectedPosition.tokensOwed1 : selectedPosition.tokensOwed0;
              
              return (
                <div className="card-compact bg-slate-50/80 space-y-3">
                  <h5 className="font-semibold text-slate-900">Position Details</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Token ID:</span>
                      <span className="font-semibold text-slate-900">#{selectedTokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="font-semibold text-green-600">
                        {BigInt(selectedPosition.liquidity) > BigInt(0) ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fee Tier:</span>
                      <span className="font-semibold text-slate-900">{selectedPosition.fee / 10000}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Liquidity:</span>
                      <span className="font-semibold text-slate-900">
                        {parseFloat(formatUnits(BigInt(selectedPosition.liquidity), 18)).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">JOCX Fees:</span>
                      <span className="font-semibold text-slate-900">
                        {parseFloat(formatUnits(BigInt(jocxTokensOwed), 18)).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">USDT Fees:</span>
                      <span className="font-semibold text-slate-900">
                        {parseFloat(formatUnits(BigInt(usdtTokensOwed), 6)).toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleStake}
                disabled={!address || !selectedTokenId || !available}
                className="btn-primary py-4"
              >
                {!available ? (
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
                disabled={!address || !selectedTokenId || !available}
                className="btn-secondary py-4"
              >
                {!available ? (
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