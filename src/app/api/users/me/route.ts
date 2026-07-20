import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';

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
    let user = await prisma.user.findUnique({
      where: { privyId: claims.userId },
      include: { wallet: true },
    });

    // Auto-create user on first login
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
        console.error('Error fetching Privy user info:', err);
      }

      // Check for referral cookie
      const refCookie = req.cookies.get('referral-code')?.value;
      let referrerId: string | null = null;
      if (refCookie) {
        try {
          const referrer = await prisma.user.findUnique({
            where: { referralCode: refCookie },
          });
          if (referrer) {
            referrerId = referrer.id;
          }
        } catch (err) {
          console.error('Failed to resolve referrer code:', err);
        }
      }

      user = await prisma.user.create({
        data: {
          privyId: claims.userId,
          referralCode: nanoid(8),
          referredBy: referrerId,
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

      // Create Referral log in DB
      if (referrerId) {
        try {
          await prisma.referral.create({
            data: {
              referrerId,
              referredId: user.id,
              reward: 0.5,
              isPaid: false,
            },
          });
        } catch (err) {
          console.error('Failed to create Referral relationship entry:', err);
        }
      }
    } else {
      // Sync or create wallet if missing from database (handles older test accounts)
      if (!user.wallet) {
        let realAddress = '';
        try {
          const privyUser = await privy.getUser(claims.userId);
          realAddress = privyUser.wallet?.address || '';
          if (!realAddress) {
            const walletAccount = privyUser.linkedAccounts.find(
              (acc: any) => acc.type === 'wallet' && acc.walletClientType === 'privy'
            ) || privyUser.linkedAccounts.find(
              (acc: any) => acc.type === 'wallet'
            );
            realAddress = (walletAccount as any)?.address || '';
          }
        } catch (err) {
          console.error('Error fetching Privy wallet to heal record:', err);
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
      } else {
        // Sync user wallet with their actual Privy embedded wallet if needed
        try {
          const privyUser = await privy.getUser(claims.userId);
          let realAddress = privyUser.wallet?.address || '';
          if (!realAddress) {
            const walletAccount = privyUser.linkedAccounts.find(
              (acc: any) => acc.type === 'wallet' && acc.walletClientType === 'privy'
            ) || privyUser.linkedAccounts.find(
              (acc: any) => acc.type === 'wallet'
            );
            realAddress = (walletAccount as any)?.address || '';
          }
          
          if (realAddress && user.wallet.address !== realAddress) {
            await prisma.wallet.update({
              where: { userId: user.id },
              data: { address: realAddress },
            });
            user.wallet.address = realAddress;
          }
        } catch (err) {
          console.error('Error syncing Privy wallet address:', err);
        }
      }
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const claims = await getAuthUser(req);
    const body = await req.json();
    const { name, upiId, theme, phone, avatar } = body;

    const user = await prisma.user.update({
      where: { privyId: claims.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(upiId !== undefined && { upiId }),
        ...(theme !== undefined && { theme }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { wallet: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
