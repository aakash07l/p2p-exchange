'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Headphones, Info, WalletCards } from 'lucide-react';

const SELL_RATE = 97.66;

export default function DashboardPage() {
  const { getAccessToken } = usePrivy();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setBalance(Number(data.data?.wallet?.usdtBalance || 0));
      } catch { /* zero-state is fine */ }
    };
    load();
  }, [getAccessToken]);

  return (
    <div className="animate-slide-up pb-8">
      {/* Sell price pill */}
      <div className="mx-auto mb-10 flex w-fit items-center gap-3 rounded-full border border-[#d7d1ff] bg-white px-5 py-2 shadow-[0_2px_6px_rgba(80,64,200,.08)]">
        <span className="h-3.5 w-3.5 rounded-full bg-[#4744ed] shadow-[0_0_0_4px_#e7e0ff]" />
        <span className="text-[15px] font-medium text-[#47414f]">Sell Price</span>
        <strong className="ml-6 text-[15px]">₹{SELL_RATE.toFixed(2)}</strong>
        <Info size={16} className="text-[#4744ed]" />
      </div>

      {/* Balance display */}
      <section className="text-center">
        <p className="text-[18px] font-medium text-[#504a56]">Available Balance</p>
        <h1 className="mt-2 text-[58px] font-extrabold leading-none tracking-[-.06em] text-[#17161b]">
          ${balance.toFixed(2)}
        </h1>
        <p className="mt-4 text-[22px] text-[#514c58]">
          ≈ ₹{(balance * SELL_RATE).toFixed(2)}
        </p>
      </section>

      {/* Action icons grid */}
      <section className="mt-10 grid grid-cols-4 gap-2">
        {[
          { label: 'Wallet',   href: '/wallet',             icon: WalletCards },
          { label: 'Deposit',  href: '/wallet?tab=deposit',  icon: ArrowDownToLine },
          { label: 'Withdraw', href: '/wallet?tab=withdraw', icon: ArrowUpFromLine },
          { label: 'Support',  href: '/help',               icon: Headphones },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group flex flex-col items-center gap-2.5 text-center">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[#6c5ae8]/30 bg-white text-[#4744ed] transition group-hover:-translate-y-1 group-hover:bg-[#f5f3ff] shadow-[0_2px_8px_rgba(71,68,237,.08)]">
              <Icon size={28} strokeWidth={1.7} />
            </span>
            <span className="text-[14px] font-medium text-[#312d36]">{label}</span>
          </Link>
        ))}
      </section>

      {/* P2P Image Banner */}
      <section className="mt-8 overflow-hidden rounded-[22px] border border-[#e8e5ed] shadow-[0_4px_16px_rgba(0,0,0,0.06)] bg-black">
        <img
          src="/images/p2p-banner.jpg"
          alt="Peer-to-Peer P2P Trading"
          className="w-full h-auto max-h-[180px] object-cover"
        />
      </section>


      {/* Refer & Earn */}
      <section className="mt-2 rounded-[22px] bg-[#f6f5fb] p-6 shadow-[0_2px_8px_rgba(40,29,111,.07)]">
        <h2 className="text-[21px] font-bold tracking-[-0.04em]">Refer &amp; Earn</h2>
        <p className="mt-3 text-[16px] leading-6 text-[#514c58]">
          Earn 0.5% on every trade your friends make. Invite people you trust &amp; start earning today!
        </p>
        <div className="mt-6 rounded-[18px] bg-[#e7e2ff] p-6 text-[16px] leading-6 text-[#3d385e]">
          Start trading and invite friends to unlock referral rewards!
        </div>
        <Link
          href="/referrals"
          className="mt-5 flex items-center gap-2 text-[16px] font-semibold text-[#4744ed]"
        >
          Invite friends <ChevronRight size={18} />
        </Link>
      </section>
    </div>
  );
}
