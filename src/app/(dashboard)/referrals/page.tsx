'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Link as LinkIcon, Share2, UsersRound } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

interface ReferralData { referralLink: string; referralCode: string; totalReferrals: number; totalEarned: number; pendingEarnings: number; }

export default function ReferralsPage() {
  const { getAccessToken } = usePrivy();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    const loadReferrals = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (live && json.success) setData(json.data);
      } catch {}
    };
    void loadReferrals();
    return () => { live = false; };
  }, [getAccessToken]);
  const share = async () => { const link = data?.referralLink || `${window.location.origin}/ref/P2P-DEMO`; try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  const referrals = data?.totalReferrals || 0;

  return (
    <div className="animate-slide-up pt-5 pb-10">
      <h2 className="max-w-[420px] text-[34px] font-bold leading-[1.32] tracking-[-.055em]">Refer your friends &<br/>Earn 0.5% of their volume</h2>
      <div className="mt-12 grid grid-cols-[1fr_1.35fr] items-center gap-6">
        <div className="text-center"><div className="relative mx-auto flex h-[170px] w-[170px] items-center justify-center rounded-full bg-[conic-gradient(from_230deg,#059669_0deg,#d1fae5_8deg,#d1fae5_280deg,transparent_280deg)] before:absolute before:inset-[14px] before:rounded-full before:bg-white"><span className="relative"><strong className="block text-[38px] leading-none text-[#059669]">{referrals}</strong><small className="text-[16px] text-[#504a56]">out of 4</small></span></div><p className="mt-3 text-[16px]">Referred</p></div>
        <div className="space-y-5 text-[18px] font-medium">{[[Share2, 'Share FastX P2P with friends'], [LinkIcon, 'Invite via referral link'], [UsersRound, 'Earn 0.5% of their volume']].map(([Icon, label]) => { const I = Icon as typeof Share2; return <div key={label as string} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669]"><I size={17}/></span>{label as string}</div>; })}</div>
      </div>
      <section className="mt-14 rounded-[23px] bg-[#ecfdf5] border border-[#a7f3d0] p-8 shadow-sm"><h3 className="text-[23px] font-bold">Refer & Earn</h3><p className="mt-2 text-[18px] leading-7 text-[#56505e]">Share your referral link with friends and earn 0.5% every time they trade.</p><div className="mt-8 rounded-[22px] bg-white p-6 shadow-sm border border-[#a7f3d0]"><p className="text-[17px] font-medium">Invite via referral link</p><button onClick={share} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17161c] hover:bg-[#059669] py-4 text-[18px] font-bold text-white transition">{copied ? <CheckCircle2 size={19}/> : <Copy size={19}/>} {copied ? 'Link copied' : 'Generate Link'}</button></div><div className="mt-7 flex items-center gap-4 rounded-[22px] bg-white p-5 shadow-sm border border-[#a7f3d0]"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669]"><CheckCircle2 size={27}/></span><span><strong className="block text-[17px]">Claimable Rewards</strong><small className="text-[#059669]">{(data?.pendingEarnings || 0).toFixed(2)} USDT</small></span><button className="ml-auto rounded-xl bg-[#059669] hover:bg-[#047857] px-5 py-2.5 font-semibold text-white transition">Claim</button></div></section>
    </div>
  );
}
