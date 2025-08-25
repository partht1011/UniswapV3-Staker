import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { CONTRACTS } from '@/config/constants';
import { TransactionStatus } from '@/types';
import toast from 'react-hot-toast';

interface TokenSwapProps {
  onSwapComplete?: () => void;
}

const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

export function TokenSwap({ onSwapComplete }: TokenSwapProps) {
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('JOCX');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.IDLE);

  const { balance: ethBalance } = useTokenBalance(CONTRACTS.WETH);
  const { balance: usdcBalance } = useTokenBalance(CONTRACTS.USDC);
  const { balance: jocxBalance } = useTokenBalance(CONTRACTS.JOCX_TOKEN);
  const { balance: usdtBalance } = useTokenBalance(CONTRACTS.USDT_TOKEN);

  const { writeContract, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const getTokenAddress = (token: string) => {
    switch (token) {
      case 'ETH':
        return CONTRACTS.WETH;
      case 'USDC':
        return CONTRACTS.USDC;
      case 'JOCX':
        return CONTRACTS.JOCX_TOKEN;
      case 'USDT':
        return CONTRACTS.USDT_TOKEN;
      default:
        return CONTRACTS.WETH;
    }
  };

  const getTokenBalance = (token: string) => {
    switch (token) {
      case 'ETH':
        return ethBalance;
      case 'USDC':
        return usdcBalance;
      case 'JOCX':
        return jocxBalance;
      case 'USDT':
        return usdtBalance;
      default:
        return '0';
    }
  };

  const handleSwap = async () => {
    if (!address || !amount) return;

    try {
      setStatus(TransactionStatus.PENDING);
      
      const tokenInAddress = getTokenAddress(fromToken);
      const tokenOutAddress = getTokenAddress(toToken);
      const amountIn = parseUnits(amount, 18);
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      await writeContract({
        address: CONTRACTS.UNISWAP_V3_ROUTER as `0x${string}`,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [
          {
            tokenIn: tokenInAddress as `0x${string}`,
            tokenOut: tokenOutAddress as `0x${string}`,
            fee: 3000,
            recipient: address,
            deadline: BigInt(deadline),
            amountIn,
            amountOutMinimum: 0n, // In production, calculate proper slippage
            sqrtPriceLimitX96: 0n,
          },
        ],
        value: fromToken === 'ETH' ? amountIn : 0n,
      });

      toast.success('Swap transaction submitted!');
      setStatus(TransactionStatus.SUCCESS);
      onSwapComplete?.();
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. Please try again.');
      setStatus(TransactionStatus.ERROR);
    }
  };

  const isLoading = status === TransactionStatus.PENDING || isConfirming;

  return (
    <div className="card glow-effect group">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Swap Tokens</h3>
          <p className="text-sm text-slate-600">Convert your tokens to JOCX and USDT</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* From Token */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            From
          </label>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="input-field text-center font-semibold"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="JOCX">JOCX</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div className="col-span-3 input-group">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="input-field text-right text-lg font-semibold"
              />
              <div className="input-addon">
                <button 
                  onClick={() => setAmount(getTokenBalance(fromToken))}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Balance: {parseFloat(getTokenBalance(fromToken)).toFixed(4)} {fromToken}
            </span>
            <span className="text-slate-500">
              ~${(parseFloat(amount || '0') * 1850).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              setFromToken(toToken);
              setToToken(fromToken);
            }}
            className="relative p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 transform hover:scale-110 group/swap"
          >
            <svg className="w-5 h-5 text-slate-600 group-hover/swap:text-slate-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover/swap:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            To (estimated)
          </label>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="input-field text-center font-semibold"
              >
                <option value="JOCX">JOCX</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div className="col-span-3">
              <div className="input-field bg-slate-50 text-right text-lg font-semibold text-slate-600 cursor-not-allowed">
                ~{amount ? (parseFloat(amount) * 0.5).toFixed(4) : '0.0'}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Balance: {parseFloat(getTokenBalance(toToken)).toFixed(4)} {toToken}
            </span>
            <span className="text-slate-500">
              Price Impact: ~0.1%
            </span>
          </div>
        </div>

        {/* Swap Details */}
        {amount && (
          <div className="card-compact bg-slate-50/80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Exchange Rate</span>
              <span className="font-semibold text-slate-900">1 {fromToken} = 0.5 {toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Network Fee</span>
              <span className="font-semibold text-slate-900">~$12.50</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Route</span>
              <span className="font-semibold text-slate-900">{fromToken} → {toToken}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={!address || !amount || isLoading}
          className="btn-primary w-full text-lg py-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
              <span>Swapping...</span>
            </div>
          ) : (
            `Swap ${fromToken} for ${toToken}`
          )}
        </button>
      </div>
    </div>
  );
}