import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { executeOnChainWithdrawal } from '@/lib/thirdweb/client';

// Simple API Key security for external admin panel integration
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'super-secret-admin-key-change-in-production';

function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get('x-admin-api-key') || new URL(req.url).searchParams.get('apiKey');
  return apiKey === ADMIN_API_KEY;
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Admin Access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type'); // e.g. BUY, SELL, WITHDRAW

    // Fetch users
    const users = await prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: filterType ? { type: filterType as any } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, upiId: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch referrals
    const referrals = await prisma.referral.findMany({
      include: {
        referrer: { select: { name: true, email: true } },
        referred: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Stats calculations
    const stats = {
      totalUsers: users.length,
      pendingBuys: transactions.filter(t => t.type === 'BUY' && t.status === 'PENDING').length,
      pendingSells: transactions.filter(t => t.type === 'SELL' && t.status === 'PENDING').length,
      totalVolumeUsdt: transactions.filter(t => t.status === 'COMPLETED').reduce((acc, t) => acc + t.amount, 0),
    };

    return NextResponse.json({
      success: true,
      data: { stats, users, transactions, referrals },
    });
  } catch (error) {
    console.error('[Admin GET API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Admin Access' }, { status: 401 });
    }

    const body = await req.json();
    const { action, transactionId, note } = body;

    if (!transactionId || !action) {
      return NextResponse.json({ success: false, error: 'Transaction ID and action are required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: { include: { wallet: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'PENDING' && transaction.status !== 'PROCESSING') {
      return NextResponse.json({ success: false, error: 'Transaction is already finalized' }, { status: 400 });
    }

    // --- Action: APPROVE BUY (Release USDT to User) ---
    if (action === 'approve_buy') {
      if (transaction.type !== 'BUY') {
        return NextResponse.json({ success: false, error: 'Only BUY transactions can be approved this way' }, { status: 400 });
      }

      const userWalletAddress = transaction.user.wallet?.address;
      if (!userWalletAddress) {
        return NextResponse.json({ success: false, error: 'User does not have an active wallet address registered' }, { status: 400 });
      }

      // Execute on-chain transfer to user's Privy address from Hot Wallet
      const txResult = await executeOnChainWithdrawal(userWalletAddress, transaction.amount);
      if (!txResult.success) {
        return NextResponse.json({ success: false, error: txResult.error || 'On-chain transfer failed' }, { status: 500 });
      }

      // Finalize database transaction
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            txHash: txResult.txHash,
            notes: note || 'Approved and released on-chain by Admin',
          },
        }),
        prisma.wallet.update({
          where: { userId: transaction.userId },
          data: { usdtBalance: { increment: transaction.amount } },
        }),
      ]);

      // Check if user was referred, and reward the referrer if it's the user's first trade
      try {
        const firstTrade = await prisma.transaction.count({
          where: { userId: transaction.userId, type: 'BUY', status: 'COMPLETED' },
        });

        if (firstTrade === 1 && transaction.user.referredBy) {
          const referral = await prisma.referral.findFirst({
            where: { referredId: transaction.userId, isPaid: false },
          });

          if (referral) {
            // Reward: 0.5 USDT to the referrer
            await prisma.$transaction([
              prisma.referral.update({
                where: { id: referral.id },
                data: { isPaid: true, reward: 0.5 },
              }),
              prisma.wallet.update({
                where: { userId: referral.referrerId },
                data: { usdtBalance: { increment: 0.5 } },
              }),
              prisma.transaction.create({
                data: {
                  userId: referral.referrerId,
                  type: 'REFERRAL_BONUS',
                  status: 'COMPLETED',
                  asset: 'USDT',
                  amount: 0.5,
                  notes: `Referral bonus for inviting user ID: ${transaction.userId}`,
                },
              }),
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to process referral credit:', err);
      }

      return NextResponse.json({ success: true, message: 'Buy order approved. USDT sent successfully!', txHash: txResult.txHash });
    }

    // --- Action: COMPLETE SELL (Confirm INR payout sent by Admin) ---
    if (action === 'complete_sell') {
      if (transaction.type !== 'SELL') {
        return NextResponse.json({ success: false, error: 'Only SELL transactions can be completed this way' }, { status: 400 });
      }

      // Finalize database transaction as paid
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          notes: note || 'INR Payment confirmed and completed by Admin via UPI',
        },
      });

      return NextResponse.json({ success: true, message: 'Sell order marked as COMPLETED successfully.' });
    }

    // --- Action: REJECT / CANCEL TRANSACTION ---
    if (action === 'reject') {
      // If it's a SELL, refund the user's USDT in database if already deducted,
      // but in direct Privy transfers, the user has already transferred it on-chain to the platform wallet.
      // So rejection might require admin to manually refund USDT on-chain.
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          notes: note || 'Rejected by Admin',
        },
      });

      return NextResponse.json({ success: true, message: 'Transaction rejected.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin POST API Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
