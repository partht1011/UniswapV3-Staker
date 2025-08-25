Client’s Request Explained

Staker Website (Uniswap v3 integration)

The client wants a staking website built using Uniswap v3 Staker contracts (Uniswap has an official periphery contract system for staking liquidity positions).

This needs to be ready by Monday to match the event timeline.

👉 Reference: They gave the official Uniswap v3 Staker design docs
.

Campaign: 20% APY for Providing Liquidity

The campaign should reward users with 20% annual interest in JOCX tokens.

The liquidity pool is JOCX/USDT on Uniswap v3.

Basically: if people provide liquidity (LP) to this pool, they earn extra JOCX rewards on top of normal Uniswap trading fees.

Flexibility in Deposits (Ease of Participation)

Ideally, users shouldn’t need to already hold JOCX or USDT.

They want the UI to support deposits with ETH, USDC, etc., and internally swap into the right tokens before staking.

This makes onboarding one-click or few-clicks instead of requiring multiple manual swaps.

UI & Hosting

A frontend (web app) is required for this staking system.

In Summary

The client is asking for:

A Uniswap v3 Staker-based liquidity mining system for the JOCX/USDT pool.

A web interface where users can:

Add liquidity to the pool (even from ETH/USDC).

Stake their LP tokens via the Uniswap v3 Staker.

Earn 20% APY rewards in JOCX.

🔹 What the UI needs to do

Connect Wallet (MetaMask, WalletConnect, etc.).

Deposit into Pool

Let users provide liquidity into the JOCX/USDT pool.

(Optional) If they only have ETH/USDC/etc., the UI can route via a swap (e.g., using Uniswap router) before adding liquidity.

Stake LP NFT

After adding liquidity, users receive a Uniswap v3 NFT (their liquidity position).

The UI should let them stake this NFT into the Uniswap v3 Staker contract.

Show Rewards

Display the 20% APY JOCX reward rate.

Track accrued rewards for the connected wallet.

Claim Rewards

Allow users to claim JOCX rewards from the Staker contract.