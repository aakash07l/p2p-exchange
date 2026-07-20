import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import prisma from '@/lib/db/prisma';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

async function getUser(req: NextRequest) {
  const token = req.cookies.get('privy-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  const claims = await privy.verifyAuthToken(token);
  const user = await prisma.user.findUnique({ where: { privyId: claims.userId } });
  if (!user) throw new Error('User not found');
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const asset = searchParams.get('asset');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        ...(type && { type: type as any }),
        ...(asset && { asset }),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    const body = await req.json();
    const { type, asset, amount, price, minLimit, maxLimit, paymentMethod, description } = body;

    const offer = await prisma.offer.create({
      data: { userId: user.id, type, asset, amount, price, minLimit, maxLimit, paymentMethod, description },
    });

    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
