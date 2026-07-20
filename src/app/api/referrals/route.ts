import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';

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
      include: {
        referrals: {
          where: { referrerId: undefined }, // overridden below
          include: {
            referred: {
              select: { name: true, email: true, createdAt: true, isVerified: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // Get referrals where this user is the referrer
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: {
          select: { name: true, email: true, createdAt: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = referrals.reduce((sum, r) => sum + (r.isPaid ? r.reward : 0), 0);
    const pendingEarnings = referrals.reduce((sum, r) => sum + (!r.isPaid ? r.reward : 0), 0);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.vercel.app';

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${appUrl}/ref/${user.referralCode}`,
        totalReferrals: referrals.length,
        totalEarned,
        pendingEarnings,
        referrals: referrals.map((r) => ({
          id: r.id,
          name: r.referred.name || r.referred.email?.split('@')[0] || 'Anonymous',
          joinedAt: r.createdAt,
          isVerified: r.referred.isVerified,
          reward: r.reward,
          isPaid: r.isPaid,
          status: r.isPaid ? 'Paid' : 'Pending',
        })),
      },
    });
  } catch (error) {
    console.error('[Referrals GET]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
