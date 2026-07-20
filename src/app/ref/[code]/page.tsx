import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;

  // Validate referral code exists
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true },
  });

  if (!referrer) {
    redirect('/login');
  }

  // Store referral code in cookie via redirect to login with query param
  redirect(`/login?ref=${code}`);
}
