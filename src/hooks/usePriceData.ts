import { useState, useEffect } from 'react';

export interface PriceData {
  usdtPrice: number;
  jocxPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function usePriceData(): PriceData {
  const [priceData, setPriceData] = useState<PriceData>({
    jocxPrice: 0,
    usdtPrice: 1.0,
    priceChange24h: 0,
    volume24h: 0,
    marketCap: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setPriceData(prev => ({ ...prev, isLoading: true, error: null }));

        // In a real implementation, you would fetch from:
        // 1. CoinGecko API for JOCX price data
        // 2. Uniswap subgraph for pool-specific data
        // 3. DEX aggregators like 1inch or 0x
        
        // For now, we'll simulate realistic price data
        const simulatedData = {
          jocxPrice: 0.125 + (Math.random() - 0.5) * 0.02, // $0.115 - $0.135
          usdtPrice: 1.0,
          priceChange24h: (Math.random() - 0.5) * 10, // -5% to +5%
          volume24h: 50000 + Math.random() * 100000, // $50k - $150k
          marketCap: 12500000 + Math.random() * 2500000, // $12.5M - $15M
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setPriceData(simulatedData);
      } catch (error) {
        console.error('Error fetching price data:', error);
        setPriceData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch price data',
        }));
      }
    };

    fetchPriceData();

    // Update price data every 30 seconds
    const interval = setInterval(fetchPriceData, 30000);

    return () => clearInterval(interval);
  }, []);

  return priceData;
}