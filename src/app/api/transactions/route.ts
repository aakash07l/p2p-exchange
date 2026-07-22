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
    const limit = parseInt(searchParams.get('limit') || '50');

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
    let user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      include: { wallet: true },
    });

    if (!user) {
      const { nanoid } = await import('nanoid');
      let realAddress = '';
      try {
        const privyUser = await privy.getUser(claims.userId);
        const walletAccount = privyUser.linkedAccounts.find(
          (acc: any) => acc.type === 'wallet' && acc.walletClientType === 'privy'
        ) || privyUser.linkedAccounts.find(
          (acc: any) => acc.type === 'wallet'
        );
        realAddress = (walletAccount as any)?.address || '';
      } catch (err) {
        console.error('Error fetching Privy user info in transactions API:', err);
      }

      user = await prisma.user.create({
        data: {
          privyId: claims.userId,
          referralCode: nanoid(8),
          wallet: {
            create: {
              address: realAddress || `0x${Array.from({ length: 40 }, () =>
                '0123456789abcdef'[Math.floor(Math.random() * 16)]
              ).join('')}`,
            },
          },
        },
        include: { wallet: true },
      });
    } else if (!user.wallet) {
      let realAddress = '';
      try {
        const privyUser = await privy.getUser(claims.userId);
        realAddress = privyUser.wallet?.address || '';
      } catch (err) {
        console.error('Error fetching Privy wallet in transactions API:', err);
      }

      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address: realAddress || `0x${Array.from({ length: 40 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('')}`,
        },
      });
      user.wallet = newWallet;
    }

    const body = await req.json();
    const { type, amountInr, amountUsdt, upiRef, txHash, upiId } = body;

    if (!type || (type !== 'BUY' && type !== 'SELL')) {
      return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
    }

    // --- Handling BUY Transaction ---
    if (type === 'BUY') {
      if (!amountInr || !amountUsdt || !upiRef) {
        return NextResponse.json({ success: false, error: 'INR Amount, USDT Amount and UPI Reference ID are required' }, { status: 400 });
      }

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
          toAddress: user.wallet?.address || '',
          upiRef,
          notes: `Buy order submitted. Expecting ₹${amountInr} via UPI`,
          metadata: { amountInr: parseFloat(amountInr) },
        },
      });

      return NextResponse.json({ success: true, data: tx });
    }

    // --- Handling SELL Transaction ---
    if (type === 'SELL') {
      if (!amountUsdt || !amountInr || !upiId || !txHash) {
        return NextResponse.json({ success: false, error: 'USDT Amount, INR Amount, Payout UPI ID, and Transaction Hash are required' }, { status: 400 });
      }

      const numAmountUsdt = parseFloat(amountUsdt);
      const numAmountInr = parseFloat(amountInr);

      const rawHot = process.env.NEXT_PUBLIC_PLATFORM_HOT_WALLET;
      const platformHotWallet = (rawHot && rawHot !== '0x0000000000000000000000000000000000000000')
        ? rawHot
        : '0x57db74fec2dfc517315ea6034aa746511dd80d4b';

      const duplicateTx = await prisma.transaction.findFirst({
        where: { txHash },
      });
      if (duplicateTx) {
        return NextResponse.json({ success: false, error: 'This Transaction Hash has already been submitted' }, { status: 409 });
      }

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'SELL',
          status: 'PENDING',
          asset: 'USDT',
          amount: numAmountUsdt,
          fromAddress: user.wallet?.address || '',
          toAddress: platformHotWallet,
          txHash,
          upiRef: upiId,
          notes: `Sell order submitted on-chain. Payout of ₹${numAmountInr} pending to UPI: ${upiId}`,
          metadata: { amountInr: numAmountInr, upiId },
        },
      });

      // Background verification
      void verifyUsdtDeposit(txHash, platformHotWallet, numAmountUsdt).then(async (verification) => {
        if (!verification.success && verification.error?.includes('failed on-chain')) {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: 'FAILED', notes: `On-chain transfer failed: ${verification.error}` },
          });
        }
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
