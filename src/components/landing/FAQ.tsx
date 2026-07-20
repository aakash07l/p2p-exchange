'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Is P2Xchange safe to use?',
    a: 'Absolutely. We use Privy for authentication (no seed phrases exposed), non-custodial embedded wallets, and all trades are secured by smart contracts. Your funds are always under your control.',
  },
  {
    q: 'How long do deposits take?',
    a: 'Crypto deposits are confirmed after blockchain confirmations (typically 10–30 minutes depending on network congestion). INR deposits via UPI are instant.',
  },
  {
    q: 'What are the trading fees?',
    a: 'P2Xchange charges 0.1% on completed trades. Deposits are free. Withdrawals have a small network fee based on the asset.',
  },
  {
    q: 'How does the referral program work?',
    a: 'Share your unique referral link. When someone signs up and completes their first trade, you both earn a ₹500 reward. Track all referrals in your dashboard.',
  },
  {
    q: 'Can I use my existing crypto wallet?',
    a: 'Yes! You can connect MetaMask or any WalletConnect-compatible wallet. We also auto-create an embedded wallet for you so you can start immediately without any setup.',
  },
  {
    q: 'What assets can I trade?',
    a: 'Currently we support BTC, ETH, USDT, and BNB against INR. More assets are being added regularly.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Got Questions?</h2>
          <p className="text-white/50 text-lg">Everything you need to know about P2Xchange.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden transition-all"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-white/90 text-sm sm:text-base pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-white/40 flex-shrink-0 transition-transform duration-200',
                    open === i && 'rotate-180 text-indigo-400'
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
