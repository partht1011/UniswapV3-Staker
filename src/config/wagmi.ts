// import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { mainnet } from 'wagmi/chains';

// export const config = getDefaultConfig({
//   appName: 'JOCX Liquidity Staking',
//   projectId: '22cbbbc67e91d87b648ed114c3524a75', // Replace with your WalletConnect project ID
//   chains: [mainnet],
//   ssr: true,
// });


import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
  },
})