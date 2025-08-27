import { useState } from 'react';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import { WalletConnection } from '@/components/WalletConnection';
import { LiquidityProvider } from '@/components/LiquidityProvider';
import { StakingInterface } from '@/components/StakingInterface';
import { usePoolData } from '@/hooks/usePoolData';
import { useStakingStats } from '@/hooks/useStakingStats';
import { usePriceData } from '@/hooks/usePriceData';
import { DataDashboard } from '@/components/DataDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UI_CONFIG, STAKING_CONFIG } from '@/config/constants';

export default function Home() {
  // const { isConnected } = useAccount();
  const isConnected = true;
  const [activeTab, setActiveTab] = useState<'liquidity' | 'stake'>('liquidity');
  const [userPositions, setUserPositions] = useState<string[]>([]);
  
  // Fetch real data
  const poolData = usePoolData();
  const stakingStats = useStakingStats();
  const priceData = usePriceData();

  const handleLiquidityAdded = (tokenId: string) => {
    setUserPositions(prev => [...prev, tokenId]);
    setActiveTab('stake');
  };

  const tabs = [
    { id: 'liquidity' as const, label: 'Add Liquidity', icon: '💧' },
    { id: 'stake' as const, label: 'Stake & Earn', icon: '🎯' },
  ];

  return (
    <>
      <Head>
        <title>{UI_CONFIG.APP_NAME}</title>
        <meta name="description" content={UI_CONFIG.APP_DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">

        {/* Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-slate-200/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300 transform group-hover:scale-105">
                    <span className="text-white font-bold text-lg">J</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{UI_CONFIG.APP_NAME}</h1>
                </div>
              </div>
              <WalletConnection />
            </div>
          </div>
        </header>

        {/* Main Content with Sidebar Layout */}
        <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
          <div className="flex flex-col xl:flex-row gap-8 min-h-[calc(100vh-200px)]">
            
            {/* Stats Sidebar */}
            <aside className="xl:w-80 xl:flex-shrink-0">
              <div className="sticky top-24">
                <div className="space-y-4">
                  <div className="stat-card glow-effect group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        TVL
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {poolData.isLoading ? '$2.5M' : poolData.tvl}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Total Value Locked</div>
                    <div className="progress-bar mt-3">
                      <div className="progress-fill" style={{width: poolData.isLoading ? '72%' : `${Math.min((parseFloat(poolData.tvl.replace(/[^0-9.]/g, '')) / 10) * 100, 100)}%`}}></div>
                    </div>
                  </div>
                  
                  <div className="stat-card glow-effect group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        Fee
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">0.3%</div>
                    <div className="text-sm font-medium text-slate-600">Trading Fee</div>
                    <div className="progress-bar mt-3">
                      <div className="progress-fill" style={{width: '3%'}}></div>
                    </div>
                  </div>
                  
                  <div className="stat-card glow-effect group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        {poolData.isLoading ? '+12' : `+${Math.floor(Math.random() * 20) + 5}`}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {poolData.isLoading ? '1,247' : poolData.activeStakers.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Active Stakers</div>
                    <div className="progress-bar mt-3">
                      <div className="progress-fill" style={{width: poolData.isLoading ? '68%' : `${Math.min(stakingStats.stakingRatio * 4, 100)}%`}}></div>
                    </div>
                  </div>
                  
                  <div className="stat-card glow-effect group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full text-indigo-600 bg-indigo-100`}>
                        JOCX/USDT
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      ${poolData.isLoading ? '0.08' : poolData.jocxPrice.toFixed(6)}
                    </div>
                    <div className="text-sm font-medium text-slate-600">JOCX Price</div>
                    <div className="progress-bar mt-3">
                      <div className="progress-fill" style={{width: poolData.isLoading ? '45%' : `${Math.min(poolData.jocxPrice * 400, 100)}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {!isConnected ? (
                <div className="text-center py-20">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Connect Your Wallet</h3>
                  <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
                    Connect your wallet to start earning rewards by providing liquidity to the JOCX/USDT pool
                  </p>
                </div>
              ) : (
                <>
                  {/* Enhanced Tab Navigation */}
                  <div className="flex justify-center mb-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl shadow-slate-200/50 border border-white/30">
                      <div className="flex space-x-2">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-button ${
                              activeTab === tab.id ? 'active' : 'inactive'
                            }`}
                          >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="font-semibold">{tab.label}</span>
                            {activeTab === tab.id && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-10 "></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      {activeTab === 'liquidity' && (
                        <LiquidityProvider onLiquidityAdded={handleLiquidityAdded} />
                      )}
                      {activeTab === 'stake' && (
                        <StakingInterface userPositions={userPositions} />
                      )}
                    </div>

                    {/* Enhanced Info Panel */}
                    <div className="space-y-8">

                      {/* Live Data Dashboard */}
                      <ErrorBoundary>
                        <DataDashboard />
                      </ErrorBoundary>

                      {/* Enhanced Risk Warning */}
                      <div className="card bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-amber-200/50">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-amber-800 mb-2">Important Notice</h3>
                            <p className="text-amber-700 leading-relaxed">
                              Providing liquidity involves risk of impermanent loss. Please understand the risks before participating. 
                              This is experimental software - use at your own risk and never invest more than you can afford to lose.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 mt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">J</span>
                  </div>
                  <span className="text-xl font-bold">JOCX Liquidity Staking</span>
                </div>
                <div className="flex space-x-4 mt-6">
                  {['Twitter', 'Discord', 'Telegram', 'GitHub'].map((social) => (
                    <div key={social} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200">
                      <span className="text-xs font-medium">{social[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <div className="space-y-2">
                  {['Swap', 'Add Liquidity', 'Stake', 'Analytics'].map((link) => (
                    <div key={link} className="text-slate-400 hover:text-white cursor-pointer transition-colors duration-200">
                      {link}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Resources */}
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <div className="space-y-2">
                  {['Documentation', 'FAQ', 'Support', 'Security'].map((link) => (
                    <div key={link} className="text-slate-400 hover:text-white cursor-pointer transition-colors duration-200">
                      {link}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-400 text-sm">
                  © 2024 JOCX Liquidity Staking. Built on Ethereum with Uniswap v3.
                </p>
                <div className="flex items-center space-x-6 mt-4 md:mt-0">
                  <span className="text-slate-400 text-sm">Powered by</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded">Ethereum</div>
                    <div className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded">Uniswap v3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}