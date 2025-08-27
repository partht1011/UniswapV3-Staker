# JOCX Liquidity Staking Platform

A React + TypeScript + Tailwind CSS application for Uniswap v3 liquidity staking.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `NEXT_PUBLIC_INFURA_API_KEY`: Get from [Infura](https://infura.io/)
- `NEXT_PUBLIC_JOCX_TOKEN_ADDRESS`: JOCX token contract address
- `NEXT_PUBLIC_UNISWAP_V3_STAKER_ADDRESS`: Uniswap v3 Staker contract address

### 3. Update Contract Addresses

Edit `src/config/constants.ts` and replace the placeholder addresses with actual contract addresses:

```typescript
export const CONTRACTS = {
  JOCX_TOKEN: 'YOUR_JOCX_TOKEN_ADDRESS',
  UNISWAP_V3_STAKER: 'YOUR_STAKER_CONTRACT_ADDRESS',
  // ... other addresses
};
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── WalletConnection.tsx
│   ├── TokenSwap.tsx
│   ├── LiquidityProvider.tsx
│   └── StakingInterface.tsx
├── config/             # Configuration files
│   ├── constants.ts    # Contract addresses and settings
│   └── wagmi.ts       # Wagmi configuration
├── hooks/              # Custom React hooks
│   ├── useTokenBalance.ts
│   └── useStakingRewards.ts
├── pages/              # Next.js pages
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── styles/             # CSS styles
│   └── globals.css
└── types/              # TypeScript type definitions
    └── index.ts
```

## 🔧 Features

- **Wallet Connection**: MetaMask, WalletConnect, and other popular wallets
- **Token Swapping**: Convert ETH/USDC to JOCX/USDT using Uniswap v3
- **Liquidity Provision**: Add liquidity to JOCX/USDT pool
- **NFT Staking**: Stake Uniswap v3 LP NFTs for rewards
- **Rewards Tracking**: Real-time rewards calculation and claiming
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 📋 Prerequisites

Before deploying, ensure you have:

1. **JOCX Token Contract**: Deployed ERC-20 token
2. **Uniswap v3 Pool**: JOCX/USDT pool created on Uniswap v3
3. **Staker Contract**: Uniswap v3 Staker contract with incentive program
4. **WalletConnect Project**: Project ID from WalletConnect Cloud
5. **RPC Provider**: Infura or Alchemy API key

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 🔒 Security Considerations

- All contract interactions use proper error handling
- Slippage protection implemented for swaps and liquidity provision
- User funds are never held by the application
- All transactions require user approval

## 🛠️ Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update `src/styles/globals.css` for global styles
- Component styles use Tailwind utility classes

### Contract Integration
- Update ABIs in component files as needed
- Modify `src/config/constants.ts` for different networks or contracts
- Extend hooks for additional contract functionality

## 📝 Notes

- This is a production-ready template but requires proper testing
- Contract addresses are placeholders and must be updated
- Consider implementing additional security measures for production
- Monitor gas costs and optimize transactions as needed

## 🤝 Support

For questions or issues:
1. Check the contract addresses are correct
2. Ensure wallet is connected to the right network
3. Verify environment variables are set properly
4. Check browser console for detailed error messages