import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { verifyUsdtDeposit } from '@/lib/blockchain/bscscan';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('privy-token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const claims = await privy.verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      include: { wallet: true },
    });
    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, error: 'User wallet not found' }, { status: 404 });
    }

    const { txHash, expectedAmount } = await req.json();

    if (!txHash || !expectedAmount || expectedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'TX Hash and amount are required' }, { status: 400 });
    }

    // Check if this TX has already been processed
    const existingTx = await prisma.transaction.findFirst({
      where: { txHash, status: 'COMPLETED' },
    });
    if (existingTx) {
      return NextResponse.json({ success: false, error: 'This transaction has already been credited' }, { status: 409 });
    }

    const walletAddress = user.wallet.address;
    if (!walletAddress) {
      return NextResponse.json({ success: false, error: 'No wallet address assigned to this wallet' }, { status: 400 });
    }

    // Verify on BSCScan
    const verification = await verifyUsdtDeposit(txHash, walletAddress, expectedAmount);

    if (!verification.success) {
      return NextResponse.json({
        success: false,
        error: verification.error || 'Could not verify transaction on BSC network',
      }, { status: 400 });
    }

    if (!verification.confirmed) {
      return NextResponse.json({
        success: false,
        error: 'Transaction found but not yet confirmed (need 3 confirmations). Try again in ~15 seconds.',
      }, { status: 202 });
    }

    // Credit the balance atomically
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          asset: 'USDT',
          amount: verification.amount,
          fromAddress: verification.fromAddress,
          toAddress: walletAddress,
          txHash,
          depositAddress: walletAddress,
          notes: 'BEP20 USDT verified via BSCScan',
        },
      }),
      prisma.wallet.update({
        where: { userId: user.id },
        data: { usdtBalance: { increment: verification.amount } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        credited: verification.amount,
        txHash,
        message: `${verification.amount} USDT credited to your wallet successfully!`,
      },
    });
  } catch (error) {
    console.error('[Verify Deposit API]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
