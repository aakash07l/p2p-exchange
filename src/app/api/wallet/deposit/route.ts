import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Get the user's registered Privy wallet address for deposits
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
    if (!user || !user.wallet) return NextResponse.json({ success: false, error: 'User wallet not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        depositAddress: user.wallet.address,
        network: 'BNB Smart Chain (BEP-20)',
        asset: 'USDT',
        minDeposit: 1,
        note: 'Send USDT (BEP-20) only. Send from your connected wallet to credit your account automatically on verify.',
      },
    });
  } catch (error) {
    console.error('[Deposit GET API Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
