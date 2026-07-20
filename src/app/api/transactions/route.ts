import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { verifyUsdtDeposit } from '@/lib/blockchain/bscscan';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('privy-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  const claims = await privy.verifyAuthToken(token);
  return claims;
}

export async function GET(req: NextRequest) {
  try {
    const claims = await getAuthUser(req);
    const user = await prisma.user.findUnique({ where: { privyId: claims.userId } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = {
      userId: user.id,
      ...(type && { type: type as any }),
      ...(status && { status: status as any }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { transactions, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const claims = await getAuthUser(req);
    const user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      include: { wallet: true },
    });
    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, error: 'User wallet not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, amountInr, amountUsdt, upiRef, txHash, upiId } = body;

    if (!type || (type !== 'BUY' && type !== 'SELL')) {
      return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    // --- Handling BUY Transaction (User expects USDT from Platform after manual UPI pay) ---
    if (type === 'BUY') {
      if (!amountInr || !amountUsdt || !upiRef) {
        return NextResponse.json({ success: false, error: 'Inr Amount, Usdt Amount and UPI Reference ID are required' }, { status: 400 });
      }

      // Check for duplicate UPI Reference
      const duplicate = await prisma.transaction.findFirst({
        where: { upiRef },
      });
      if (duplicate) {
        return NextResponse.json({ success: false, error: 'This UPI Reference ID has already been submitted' }, { status: 409 });
      }

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'BUY',
          status: 'PENDING',
          asset: 'USDT',
          amount: parseFloat(amountUsdt),
          fromAddress: 'Platform UPI',
          toAddress: user.wallet.address,
          upiRef,
          notes: `Buy order submitted. Expecting ₹${amountInr} via UPI`,
          metadata: { amountInr: parseFloat(amountInr) },
        },
      });

      return NextResponse.json({ success: true, data: tx });
    }

    // --- Handling SELL Transaction (User sends USDT on-chain ➔ expects INR UPI payout from Admin) ---
    if (type === 'SELL') {
      if (!amountUsdt || !amountInr || !txHash || !upiId) {
        return NextResponse.json({ success: false, error: 'Usdt Amount, Inr Amount, TX Hash and Payout UPI ID are required' }, { status: 400 });
      }

      // Verify user's USDT transfer on-chain via BSCScan
      const platformHotWallet = process.env.NEXT_PUBLIC_PLATFORM_HOT_WALLET || '';
      if (!platformHotWallet) {
        return NextResponse.json({ success: false, error: 'Platform Hot Wallet address is not configured on server' }, { status: 500 });
      }

      // First check if txHash is already used
      const duplicateTx = await prisma.transaction.findFirst({
        where: { txHash },
      });
      if (duplicateTx) {
        return NextResponse.json({ success: false, error: 'This Transaction Hash has already been submitted' }, { status: 409 });
      }

      const verification = await verifyUsdtDeposit(txHash, platformHotWallet, parseFloat(amountUsdt));

      if (!verification.success) {
        return NextResponse.json({
          success: false,
          error: verification.error || 'USDT Transfer verification failed on BSC network',
        }, { status: 400 });
      }

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'SELL',
          status: 'PENDING', // Awaiting Admin manual payout of INR
          asset: 'USDT',
          amount: parseFloat(amountUsdt),
          fromAddress: user.wallet.address,
          toAddress: platformHotWallet,
          txHash,
          notes: `Sell order verified. Payout of ₹${amountInr} expected to UPI ID: ${upiId}`,
          metadata: { amountInr: parseFloat(amountInr), upiId },
        },
      });

      return NextResponse.json({ success: true, data: tx });
    }

    return NextResponse.json({ success: false, error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('[Transactions POST Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
