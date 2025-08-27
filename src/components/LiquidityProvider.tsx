import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useUserPositions } from '@/hooks/useUserPositions';
import { CONTRACTS, POOL_CONFIG } from '@/config/constants';
import { TransactionStatus } from '@/types';
import toast from 'react-hot-toast';
import { usePoolData } from '@/hooks/usePoolData';

interface LiquidityProviderProps {
  onLiquidityAdded: () => void;
}

const POSITION_MANAGER_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'amount0Min', type: 'uint256' },
          { name: 'amount1Min', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
    ],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
  {
    name: 'increaseLiquidity',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'amount0Min', type: 'uint256' },
          { name: 'amount1Min', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
    ],
    outputs: [
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
] as const;

export function LiquidityProvider({ onLiquidityAdded }: LiquidityProviderProps) {
  const { address } = useAccount();
  const [jocxAmount, setJocxAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [available, setAvailable] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<'approve' | 'liquidity'>('approve');
  const [liquidityMode, setLiquidityMode] = useState<'new' | 'existing'>('new');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [isPositionSelectorOpen, setIsPositionSelectorOpen] = useState(false);
  
  const poolData = usePoolData();
  const { positions, isLoading: isLoadingPositions } = useUserPositions();

  const { balance: jocxBalance, refetch: refetchJocx } = useTokenBalance(CONTRACTS.JOCX_TOKEN);
  const { balance: usdtBalance, refetch: refetchUsdt } = useTokenBalance(CONTRACTS.USDT_TOKEN);

  // Token approvals
  const jocxApproval = useTokenApproval(CONTRACTS.JOCX_TOKEN, CONTRACTS.UNISWAP_V3_POSITION_MANAGER);
  const usdtApproval = useTokenApproval(CONTRACTS.USDT_TOKEN, CONTRACTS.UNISWAP_V3_POSITION_MANAGER);

  const { writeContract: addLiquidity, data: hash, isError} = useWriteContract();
  
  const { isSuccess } = useWaitForTransactionReceipt({
    hash
  });

  useEffect(() => {
    if(isError) {
      setAvailable(true);
      return;
    }
    if(isSuccess) {
      toast.success('Liquidity added successfully!');
      refetchJocx();
      refetchUsdt();
      setCurrentStep('approve');
      setJocxAmount('');
      setUsdtAmount('');
      // Extract tokenId from transaction logs in production
      onLiquidityAdded(); // Mock tokenId
    }
  }, [isError, isSuccess]);

  // Handle approval success
  useEffect(() => {
    if (jocxApproval.isApprovalSuccess || usdtApproval.isApprovalSuccess) {
      toast.success('Token approval successful!');
    }
  }, [jocxApproval.isApprovalSuccess, usdtApproval.isApprovalSuccess]);

  // Handle approval errors
  useEffect(() => {
    if (jocxApproval.isApprovalError) {
      toast.error('JOCX approval failed. Please try again.');
      setAvailable(true);
    }
    if (usdtApproval.isApprovalError) {
      toast.error('USDT approval failed. Please try again.');
      setAvailable(true);
    }
  }, [jocxApproval.isApprovalError, usdtApproval.isApprovalError]);

  const handleApproveTokens = async () => {
    if (!address || !jocxAmount || !usdtAmount) return;

    setAvailable(false);

    try {
      const needsJocxApproval = !jocxApproval.hasAllowance(jocxAmount);
      const needsUsdtApproval = !usdtApproval.hasAllowance(usdtAmount);

      if (needsJocxApproval && needsUsdtApproval) {
        toast.error('Please approve tokens one at a time. Start with JOCX.');
        setAvailable(true);
        return;
      }

      if (needsJocxApproval) {
        await jocxApproval.approveToken(jocxAmount);
        toast.success('JOCX approval submitted!');
      } else if (needsUsdtApproval) {
        await usdtApproval.approveToken(usdtAmount);
        toast.success('USDT approval submitted!');
      } else {
        // Both tokens are approved, move to liquidity step
        setCurrentStep('liquidity');
        setAvailable(true);
      }
    } catch (error) {
      console.error('Token approval failed:', error);
      toast.error('Failed to approve tokens. Please try again.');
      setAvailable(true);
    }
  };

  const handleAddLiquidity = async () => {
    if (!address || !jocxAmount || !usdtAmount) return;

    setAvailable(false);

    try {
      const amount0Desired = parseUnits(jocxAmount, 18);
      const amount1Desired = parseUnits(usdtAmount, 6); // USDT has 6 decimals
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      if (liquidityMode === 'existing' && selectedPositionId) {
        // Increase liquidity for existing position
        addLiquidity({
          address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER as `0x${string}`,
          abi: POSITION_MANAGER_ABI,
          functionName: 'increaseLiquidity',
          args: [
            {
              tokenId: BigInt(selectedPositionId),
              amount0Desired,
              amount1Desired,
              amount0Min: (amount0Desired * BigInt(95)) / BigInt(100), // 5% slippage
              amount1Min: (amount1Desired * BigInt(95)) / BigInt(100), // 5% slippage
              deadline: BigInt(deadline),
            },
          ],
        });
      } else {
        // Mint new position
        const tickLower = -887220; // Min tick
        const tickUpper = 887220;  // Max tick

        addLiquidity({
          address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER as `0x${string}`,
          abi: POSITION_MANAGER_ABI,
          functionName: 'mint',
          args: [
            {
              token0: CONTRACTS.JOCX_TOKEN as `0x${string}`,
              token1: CONTRACTS.USDT_TOKEN as `0x${string}`,
              fee: POOL_CONFIG.FEE_TIER,
              tickLower,
              tickUpper,
              amount0Desired,
              amount1Desired,
              amount0Min: (amount0Desired * BigInt(95)) / BigInt(100), // 5% slippage
              amount1Min: (amount1Desired * BigInt(95)) / BigInt(100), // 5% slippage
              recipient: address,
              deadline: BigInt(deadline),
            },
          ],
        });
      }

      toast.success('Liquidity transaction submitted!');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Failed to add liquidity. Please try again.');
      setAvailable(true);
    }
  };

  // Check if tokens need approval
  const needsJocxApproval = jocxAmount && !jocxApproval.hasAllowance(jocxAmount);
  const needsUsdtApproval = usdtAmount && !usdtApproval.hasAllowance(usdtAmount);
  const needsApproval = needsJocxApproval || needsUsdtApproval;

  // Determine current action
  const getButtonText = () => {
    if (!available) {
      if (jocxApproval.isApproving || usdtApproval.isApproving) {
        return 'Approving...';
      }
      return 'Adding Liquidity...';
    }

    if (needsJocxApproval) {
      return 'Approve JOCX';
    }
    if (needsUsdtApproval) {
      return 'Approve USDT';
    }
    return liquidityMode === 'existing' ? 'Add Liquidity to Position' : 'Add Liquidity & Mint NFT';
  };

  const handleButtonClick = () => {
    if (liquidityMode === 'existing' && !selectedPositionId) {
      toast.error('Please select a position to add liquidity to.');
      return;
    }
    
    if (needsApproval) {
      handleApproveTokens();
    } else {
      handleAddLiquidity();
    }
  };

  return (
    <div className="card glow-effect group">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Add Liquidity</h3>
          <p className="text-sm text-slate-600">Provide liquidity to earn fees and rewards</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Liquidity Mode Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Liquidity Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setLiquidityMode('new');
                setSelectedPositionId('');
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                liquidityMode === 'new'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  liquidityMode === 'new' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">New Position</div>
                  <div className="text-xs opacity-75">Mint new NFT</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setLiquidityMode('existing')}
              disabled={positions.length === 0}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                liquidityMode === 'existing'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : positions.length === 0
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  liquidityMode === 'existing' 
                    ? 'bg-purple-500 text-white' 
                    : positions.length === 0
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Add to Existing</div>
                  <div className="text-xs opacity-75">
                    {positions.length === 0 ? 'No positions' : `${positions.length} available`}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Position Selector for Existing Mode */}
        {liquidityMode === 'existing' && positions.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Select Position
            </label>
            <div className="relative">
              <button
                onClick={() => setIsPositionSelectorOpen(!isPositionSelectorOpen)}
                className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedPositionId ? (
                      <>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Position #{selectedPositionId}</div>
                          <div className="text-sm text-slate-500">
                            {(() => {
                              const position = positions.find(p => p.tokenId === selectedPositionId);
                              return position ? `Fee: ${position.fee / 10000}% • Liquidity: ${parseFloat(formatUnits(BigInt(position.liquidity), 18)).toFixed(4)}` : '';
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
                        setSelectedPositionId(position.tokenId);
                        setIsPositionSelectorOpen(false);
                      }}
                      className="w-full p-4 text-left hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">Position #{position.tokenId}</div>
                          <div className="text-sm text-slate-500">
                            Fee: {position.fee / 10000}% • Liquidity: {parseFloat(formatUnits(BigInt(position.liquidity), 18)).toFixed(4)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            JOCX Fees: {parseFloat(formatUnits(BigInt(position.token0.toLowerCase() === CONTRACTS.JOCX_TOKEN.toLowerCase() ? position.tokensOwed0 : position.tokensOwed1), 18)).toFixed(6)} • 
                            USDT Fees: {parseFloat(formatUnits(BigInt(position.token0.toLowerCase() === CONTRACTS.JOCX_TOKEN.toLowerCase() ? position.tokensOwed1 : position.tokensOwed0), 6)).toFixed(6)}
                          </div>
                        </div>
                        {selectedPositionId === position.tokenId && (
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
        )}

        {/* Token Pair Display */}
        <div className="flex items-center justify-center space-x-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">J</span>
            </div>
            <span className="font-semibold text-slate-900">JOCX</span>
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-semibold text-slate-900">USDT</span>
          </div>
        </div>

        {/* JOCX Amount */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            JOCX Amount
          </label>
          <div className="input-group">
            <input
              type="number"
              value={jocxAmount}
              onChange={(e) => setJocxAmount(e.target.value)}
              placeholder="0.0"
              className="input-field text-right text-lg font-semibold"
            />
            <div className="input-addon">
              <button 
                onClick={() => setJocxAmount(jocxBalance)}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Balance: {parseFloat(jocxBalance).toFixed(4)} JOCX
            </span>
            <span className="text-slate-500">
              ~${(parseFloat(jocxAmount || '0') * (poolData ? poolData.jocxPrice : 0)).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* USDT Amount */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            USDT Amount
          </label>
          <div className="input-group">
            <input
              type="number"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="0.0"
              className="input-field text-right text-lg font-semibold"
            />
            <div className="input-addon">
              <button 
                onClick={() => setUsdtAmount(usdtBalance)}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Balance: {parseFloat(usdtBalance).toFixed(2)} USDT
            </span>
            <span className="text-slate-500">
              ~${parseFloat(usdtAmount || '0').toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Approval Status */}
        {(jocxAmount || usdtAmount) && (
          <div className="card-compact bg-slate-50/80 space-y-2">
            <h5 className="font-semibold text-slate-900 mb-2">Token Approvals</h5>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">JOCX</span>
              <div className="flex items-center space-x-2">
                {jocxAmount && jocxApproval.hasAllowance(jocxAmount) ? (
                  <span className="text-green-600 font-semibold">✓ Approved</span>
                ) : jocxAmount ? (
                  <span className="text-orange-600 font-semibold">⚠ Needs Approval</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">USDT</span>
              <div className="flex items-center space-x-2">
                {usdtAmount && usdtApproval.hasAllowance(usdtAmount) ? (
                  <span className="text-green-600 font-semibold">✓ Approved</span>
                ) : usdtAmount ? (
                  <span className="text-orange-600 font-semibold">⚠ Needs Approval</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleButtonClick}
          disabled={!address || !jocxAmount || !usdtAmount || !available}
          className="btn-primary w-full text-lg py-4"
        >
          {!available ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{getButtonText()}</span>
            </div>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );
}