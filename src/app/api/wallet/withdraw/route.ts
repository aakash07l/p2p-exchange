import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { initiateWithdrawal } from '@/lib/api/mockApi';

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
      return NextResponse.json({ success: false, error: 'User or wallet not found' }, { status: 404 });
    }

    const { asset, amount, toAddress, upiId } = await req.json();

    // Validate inputs
    if (!asset || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid withdrawal details' }, { status: 400 });
    }
    if (!toAddress && !upiId) {
      return NextResponse.json({ success: false, error: 'Destination address or UPI ID required' }, { status: 400 });
    }

    // Check balance
    const balanceMap: Record<string, number> = {
      USDT: user.wallet.usdtBalance,
      BTC: user.wallet.btcBalance,
      ETH: user.wallet.ethBalance,
    };
    const currentBalance = balanceMap[asset] || 0;
    if (currentBalance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    // Step 1: Call external withdrawal API
    const withdrawResult = await initiateWithdrawal({
      userId: user.id,
      asset,
      amount,
      toAddress: toAddress || '',
      upiId,
    });

    // Step 2: Deduct balance and create transaction
    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          ...(asset === 'USDT' && { usdtBalance: { decrement: amount } }),
          ...(asset === 'BTC' && { btcBalance: { decrement: amount } }),
          ...(asset === 'ETH' && { ethBalance: { decrement: amount } }),
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAW',
          status: 'PROCESSING',
          asset,
          amount,
          fee: withdrawResult.fee,
          toAddress: toAddress || upiId,
          externalRef: withdrawResult.transactionId,
          upiRef: upiId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...withdrawResult,
        message: 'Withdrawal initiated. Funds will arrive within ' + withdrawResult.estimatedTime,
      },
    });
  } catch (error) {
    console.error('[Withdraw API]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
