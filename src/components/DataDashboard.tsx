import { usePoolData } from '@/hooks/usePoolData';
import { useStakingStats } from '@/hooks/useStakingStats';
import { usePriceData } from '@/hooks/usePriceData';
import { LoadingSkeleton } from './LoadingSkeleton';
import { formatCurrency } from '@/utils/common';

export function DataDashboard() {
  const poolData = usePoolData();
  const stakingStats = useStakingStats();
  const priceData = usePriceData();

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className="card glow-effect">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">Live Protocol Data</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pool Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Pool Information</h4>
          
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Pool:</span>
            <span className="text-slate-900 font-mono text-sm">
              {poolData.isLoading ? (
                <LoadingSkeleton className="w-32 h-4" />
              ) : poolData.poolAddress ? (
                `${poolData.poolAddress.slice(0, 6)}...${poolData.poolAddress.slice(-4)}`
              ) : (
                'Not found'
              )}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">JOCX Balance:</span>
            <span className="text-slate-900 font-semibold">
              {priceData.isLoading ? <LoadingSkeleton className="w-16 h-4" /> : formatCurrency(poolData.jocxBalance, '')}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600">USDT Balance:</span>
            <span className="text-slate-900 font-semibold">
              {priceData.isLoading ? <LoadingSkeleton className="w-16 h-4" /> : formatCurrency(poolData.usdtBalance)}
            </span>
          </div>
        </div>

        {/* Staking Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Staking Information</h4>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Staked Value:</span>
            <span className="text-slate-900 font-semibold">
              {stakingStats.isLoading ? <LoadingSkeleton className="w-16 h-4" /> : stakingStats.totalStakedValue}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Avg. Stake Size:</span>
            <span className="text-slate-900 font-semibold">
              {stakingStats.isLoading ? <LoadingSkeleton className="w-16 h-4" /> : stakingStats.averageStakeSize}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600">Staking Ratio:</span>
            <span className="text-slate-900 font-semibold">
              {stakingStats.isLoading ? <LoadingSkeleton className="w-16 h-4" /> : `${stakingStats.stakingRatio.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Last updated:</span>
          <span>
            {priceData.lastUpdated ? priceData.lastUpdated.toLocaleTimeString() : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
}