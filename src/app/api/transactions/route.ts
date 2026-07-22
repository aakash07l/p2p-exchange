import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { verifyUsdtDeposit, getUsdtBalance } from '@/lib/blockchain/bscscan';

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

    // Auto-detect incoming deposits for user's wallet via on-chain balance check
    const userWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (userWallet && userWallet.address) {
      try {
        const onChainUsdt = await getUsdtBalance(userWallet.address);
        const existingDepositCount = await prisma.transaction.count({
          where: { userId: user.id, type: 'DEPOSIT' },
        });

        if (existingDepositCount === 0 && onChainUsdt > 0) {
          await prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              asset: 'USDT',
              amount: onChainUsdt,
              fromAddress: 'External Wallet',
              toAddress: userWallet.address,
              depositAddress: userWallet.address,
              notes: 'BEP-20 USDT deposit detected on BNB Smart Chain',
            },
          });
        } else {
          const diff = onChainUsdt - userWallet.usdtBalance;
          if (diff > 0.001) {
            await prisma.transaction.create({
              data: {
                userId: user.id,
                type: 'DEPOSIT',
                status: 'COMPLETED',
                asset: 'USDT',
                amount: diff,
                fromAddress: 'External Wallet',
                toAddress: userWallet.address,
                depositAddress: userWallet.address,
                notes: 'BEP-20 USDT deposit detected on BNB Smart Chain',
              },
            });
          }
        }

        if (onChainUsdt !== userWallet.usdtBalance) {
          await prisma.wallet.update({
            where: { userId: user.id },
            data: { usdtBalance: onChainUsdt },
          });
        }
      } catch (err) {
        console.error('[Transactions API] On-chain deposit sync error:', err);
      }
    }

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
          toAddress: user.wallet.address,
          upiRef,
          notes: `Buy order submitted. Expecting ₹${amountInr} via UPI`,
          metadata: { amountInr: parseFloat(amountInr) },
        },
      });

      return NextResponse.json({ success: true, data: tx });
    }

    // --- Handling SELL Transaction ---
    if (type === 'SELL') {
      if (!amountUsdt || !amountInr || !upiId) {
        return NextResponse.json({ success: false, error: 'USDT Amount, INR Amount and Payout UPI ID are required' }, { status: 400 });
      }

      const numAmountUsdt = parseFloat(amountUsdt);
      const numAmountInr = parseFloat(amountInr);

      const rawHot = process.env.NEXT_PUBLIC_PLATFORM_HOT_WALLET;
      const platformHotWallet = (rawHot && rawHot !== '0x0000000000000000000000000000000000000000')
        ? rawHot
        : '0x57db74fec2dfc517315ea6034aa746511dd80d4b';

      // 1. Sell from Internal Wallet Balance
      if (!txHash) {
        if (user.wallet.usdtBalance < numAmountUsdt) {
          return NextResponse.json({ success: false, error: 'Insufficient USDT wallet balance' }, { status: 400 });
        }

        const [_, tx] = await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: user.id },
            data: { usdtBalance: { decrement: numAmountUsdt } },
          }),
          prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'SELL',
              status: 'PENDING',
              asset: 'USDT',
              amount: numAmountUsdt,
              fromAddress: user.wallet.address,
              toAddress: platformHotWallet,
              upiRef: upiId,
              notes: `Sell order submitted from internal balance. Payout of ₹${numAmountInr} pending to UPI: ${upiId}`,
              metadata: { amountInr: numAmountInr, upiId },
            },
          }),
        ]);

        return NextResponse.json({ success: true, data: tx });
      }

      // 2. Sell via On-Chain Transfer
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
          fromAddress: user.wallet.address,
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
