import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { CONTRACTS, POOL_CONFIG } from '@/config/constants';
import { TransactionStatus } from '@/types';
import toast from 'react-hot-toast';

interface LiquidityProviderProps {
  onLiquidityAdded?: (tokenId: string) => void;
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
] as const;

export function LiquidityProvider({ onLiquidityAdded }: LiquidityProviderProps) {
  const { address } = useAccount();
  const [jocxAmount, setJocxAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.IDLE);

  const { balance: jocxBalance, refetch: refetchJocx } = useTokenBalance(CONTRACTS.JOCX_TOKEN);
  const { balance: usdtBalance, refetch: refetchUsdt } = useTokenBalance(CONTRACTS.USDT_TOKEN);

  const { writeContract, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: (data) => {
      toast.success('Liquidity added successfully!');
      setStatus(TransactionStatus.SUCCESS);
      refetchJocx();
      refetchUsdt();
      // Extract tokenId from transaction logs in production
      onLiquidityAdded?.('1'); // Mock tokenId
    },
  });

  const handleAddLiquidity = async () => {
    if (!address || !jocxAmount || !usdtAmount) return;

    try {
      setStatus(TransactionStatus.PENDING);
      
      const amount0Desired = parseUnits(jocxAmount, 18);
      const amount1Desired = parseUnits(usdtAmount, 6); // USDT has 6 decimals
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Calculate tick range (simplified - in production, use proper price calculations)
      const tickLower = -887220; // Min tick
      const tickUpper = 887220;  // Max tick

      await writeContract({
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
            amount0Min: (amount0Desired * 95n) / 100n, // 5% slippage
            amount1Min: (amount1Desired * 95n) / 100n, // 5% slippage
            recipient: address,
            deadline: BigInt(deadline),
          },
        ],
      });

      toast.success('Liquidity transaction submitted!');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Failed to add liquidity. Please try again.');
      setStatus(TransactionStatus.ERROR);
    }
  };

  const isLoading = status === TransactionStatus.PENDING || isConfirming;

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
              ~${(parseFloat(jocxAmount || '0') * 0.5).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Plus Icon */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
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

        {/* Pool Information */}
        <div className="card-compact bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/50">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-blue-900">Pool Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Fee Tier:</span>
              <span className="font-semibold text-blue-900">0.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Current Price:</span>
              <span className="font-semibold text-blue-900">$0.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">24h Volume:</span>
              <span className="font-semibold text-blue-900">$125K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">TVL:</span>
              <span className="font-semibold text-blue-900">$2.5M</span>
            </div>
          </div>
        </div>

        {/* Position Preview */}
        {jocxAmount && usdtAmount && (
          <div className="card-compact bg-slate-50/80 space-y-2">
            <h5 className="font-semibold text-slate-900 mb-2">Position Preview</h5>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pool Share</span>
              <span className="font-semibold text-slate-900">~0.05%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">LP Tokens</span>
              <span className="font-semibold text-slate-900">~{Math.sqrt(parseFloat(jocxAmount) * parseFloat(usdtAmount)).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Est. APR</span>
              <span className="font-semibold text-green-600">~15.2%</span>
            </div>
          </div>
        )}

        <button
          onClick={handleAddLiquidity}
          disabled={!address || !jocxAmount || !usdtAmount || isLoading}
          className="btn-primary w-full text-lg py-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
              <span>Adding Liquidity...</span>
            </div>
          ) : (
            'Add Liquidity & Mint NFT'
          )}
        </button>
      </div>
    </div>
  );
}