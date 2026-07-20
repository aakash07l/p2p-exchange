'use client';

import { TrendingUp, TrendingDown, ShieldCheck, ArrowRightLeft, Wallet } from 'lucide-react';
import Link from 'next/link';

// Platform rates config
const BUY_RATE = 90;
const SELL_RATE = 88;

export function OfferBanner() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-xs text-gray-500 font-semibold">Official Platform Exchange Rates</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck size={11} className="text-emerald-600" />
            <span className="font-semibold text-emerald-700">Zero Bank Freeze Risk</span>
          </div>
        </div>

        {/* Rates Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sell Card */}
          <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-500" /> Platform Buys From You
              </span>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">₹{SELL_RATE}.00 <span className="text-sm text-gray-400 font-normal">/ USDT</span></p>
            </div>
            <Link href="/sell" className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-sm">
              Sell to Us
            </Link>
          </div>

          {/* Buy Card */}
          <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <TrendingDown size={11} className="text-indigo-500" /> Platform Sells To You
              </span>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">₹{BUY_RATE}.00 <span className="text-sm text-indigo-400 font-normal">/ USDT</span></p>
            </div>
            <Link href="/buy" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
              Buy from Us
            </Link>
          </div>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          {[
            { label: 'Instant Settlement', desc: 'Automatic payouts', icon: <ArrowRightLeft size={12} className="text-indigo-500" /> },
            { label: 'No Third-Party Risk', desc: 'Direct exchange', icon: <ShieldCheck size={12} className="text-indigo-500" /> },
            { label: 'Privy Embedded', desc: 'Secure wallets', icon: <Wallet size={12} className="text-indigo-500" /> }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1 text-center">
              <div className="flex justify-center mb-1">{item.icon}</div>
              <span className="text-[9px] font-semibold text-gray-600 block">{item.label}</span>
              <p className="text-[9px] text-gray-400 hidden sm:block leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
