import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';
import { getIncomingUsdtTransfers } from '@/lib/blockchain/bscscan';

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

    if (!user || !user.wallet || !user.wallet.address) {
      return NextResponse.json({ success: false, error: 'User wallet not set up' }, { status: 400 });
    }

    const userAddress = user.wallet.address;

    // Get all incoming transfers for this address from BscScan
    const transfers = await getIncomingUsdtTransfers(userAddress);

    if (transfers.length === 0) {
      return NextResponse.json({ success: true, detected: false, creditedAmount: 0 });
    }

    const newlyCredited: number[] = [];

    // Process each transfer in a loop
    for (const transfer of transfers) {
      // Check if this transaction hash has already been credited in the DB
      const existingTx = await prisma.transaction.findFirst({
        where: { txHash: transfer.hash, status: 'COMPLETED' },
      });

      if (!existingTx) {
        // Not credited yet! Credit it atomically now
        try {
          await prisma.$transaction([
            prisma.transaction.create({
              data: {
                userId: user.id,
                type: 'DEPOSIT',
                status: 'COMPLETED',
                asset: 'USDT',
                amount: transfer.value,
                fromAddress: transfer.from,
                toAddress: userAddress,
                txHash: transfer.hash,
                depositAddress: userAddress,
                notes: 'BEP20 USDT detected and credited automatically via BscScan',
              },
            }),
            prisma.wallet.update({
              where: { userId: user.id },
              data: { usdtBalance: { increment: transfer.value } },
            }),
          ]);

          newlyCredited.push(transfer.value);
        } catch (err) {
          console.error(`Failed to credit tx ${transfer.hash}:`, err);
        }
      }
    }

    const totalNewCredit = newlyCredited.reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      detected: totalNewCredit > 0,
      creditedAmount: totalNewCredit,
      message: totalNewCredit > 0 
        ? `Successfully detected and credited ${totalNewCredit} USDT to your wallet!`
        : 'No new deposits detected.',
    });
  } catch (error) {
    console.error('[Detect Deposit API Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
