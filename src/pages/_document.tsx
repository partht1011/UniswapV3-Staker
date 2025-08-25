import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="description" content="Earn by providing liquidity to JOCX/USDT pool on Uniswap v3" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="JOCX Liquidity Staking" />
        <meta property="og:description" content="Provide liquidity to JOCX/USDT pool and stake your positions to earn in JOCX rewards" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JOCX Liquidity Staking" />
        <meta name="twitter:description" content="Provide liquidity to JOCX/USDT pool and stake your positions to earn in JOCX rewards" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}