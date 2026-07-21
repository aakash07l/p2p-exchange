import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { getAssetPrices } from '@/lib/api/mockApi';
import { getUsdtBalance } from '@/lib/blockchain/bscscan';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('privy-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const claims = await privy.verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      include: { wallet: true },
    });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const prices = await getAssetPrices();
    let wallet = user.wallet;

    // Auto-sync real-time on-chain BEP20 USDT balance from BSC RPC
    if (wallet && wallet.address) {
      try {
        const onChainUsdt = await getUsdtBalance(wallet.address);
        const diff = onChainUsdt - wallet.usdtBalance;

        // Auto-create DEPOSIT transaction if new funds received on-chain
        if (diff > 0.001) {
          await prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              asset: 'USDT',
              amount: diff,
              fromAddress: 'External Wallet',
              toAddress: wallet.address,
              depositAddress: wallet.address,
              notes: 'BEP-20 USDT deposit detected on BNB Smart Chain',
            },
          });
        }

        if (onChainUsdt !== wallet.usdtBalance) {
          wallet = await prisma.wallet.update({
            where: { userId: user.id },
            data: { usdtBalance: onChainUsdt },
          });
        }
      } catch (err) {
        console.error('[Wallet API] On-chain balance sync failed:', err);
      }
    }

    // Reset legacy mock balance (6061.12) to 0 if present
    if (wallet && Math.abs(wallet.usdtBalance - 6061.12) < 0.01) {
      wallet = await prisma.wallet.update({
        where: { userId: user.id },
        data: { usdtBalance: 0 },
      });
    }

    // Calculate total portfolio value in INR
    const totalValue = wallet
      ? (wallet.usdtBalance * prices.USDT) +
        (wallet.btcBalance * prices.BTC) +
        (wallet.ethBalance * prices.ETH) +
        wallet.inrBalance
      : 0;

    return NextResponse.json({
      success: true,
      data: { wallet, prices, totalValue },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
