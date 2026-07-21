'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Headphones, Info, WalletCards } from 'lucide-react';

const SELL_RATE = 95;

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
      <div style={{ height: '24px' }} />

      {/* Sell price pill */}
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#a7f3d0] bg-white px-5 py-2 shadow-[0_2px_6px_rgba(5,150,105,.08)]">
        <span className="h-3.5 w-3.5 rounded-full bg-[#059669] shadow-[0_0_0_4px_#d1fae5]" />
        <span className="text-[15px] font-medium text-[#17161c]">Sell Price</span>
        <strong className="ml-6 text-[15px]">₹{SELL_RATE.toFixed(2)}</strong>
        <Info size={16} className="text-[#059669]" />
      </div>

      <div style={{ height: '32px' }} />

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
      <div style={{ height: '32px' }} />
      <section className="grid grid-cols-4 gap-2">
        {[
          { label: 'Wallet',   href: '/wallet',             icon: WalletCards },
          { label: 'Deposit',  href: '/wallet?tab=deposit',  icon: ArrowDownToLine },
          { label: 'Withdraw', href: '/wallet?tab=withdraw', icon: ArrowUpFromLine },
          { label: 'Support',  href: '/help',               icon: Headphones },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="group flex flex-col items-center gap-2.5 text-center">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[#059669]/30 bg-white text-[#059669] transition group-hover:-translate-y-1 group-hover:bg-[#ecfdf5] shadow-[0_2px_8px_rgba(5,150,105,.08)]">
              <Icon size={28} strokeWidth={1.7} />
            </span>
            <span className="text-[14px] font-medium text-[#312d36]">{label}</span>
          </Link>
        ))}
      </section>

    </div>
  );
}
