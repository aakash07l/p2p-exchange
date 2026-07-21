'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, MessageSquareMore, Search, ShieldCheck } from 'lucide-react';

const FAQS = [
  {
    q: 'How does FastX P2P protect Indian transactions?',
    a: 'FastX P2P uses smart contract escrow and direct peer-to-peer UPI payments. Funds are locked safely in escrow until payment confirmation, ensuring zero bank freeze risks.',
  },
  {
    q: 'How long does a Buy or Sell order take?',
    a: 'Most orders are completed within 2 to 5 minutes once payment is verified via UPI and confirmed on-chain.',
  },
  {
    q: 'What network is supported for USDT deposits & withdrawals?',
    a: 'We support BNB Smart Chain (BEP-20) for instant, 0-fee USDT transfers directly to/from your Privy embedded wallet.',
  },
  {
    q: 'How do I deposit USDT to my wallet?',
    a: 'Go to Wallet → Deposit, scan the BEP-20 QR code or copy your Privy deposit address, and send USDT from any exchange or wallet.',
  },
  {
    q: 'What should I do if a payment is delayed?',
    a: 'Ensure you enter the correct 12-digit UTR/Reference number. You can also chat directly with our 24/7 support team.',
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = FAQS.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-slide-up pb-10">
      <div className="mt-6"></div>

      {/* Support Hero */}
      <section className="rounded-[24px] bg-gradient-to-br from-[#0f0f1a] via-[#1a1540] to-[#2a1f6e] p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#a99dff]">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold">FastX Help & Support</h1>
            <p className="text-[13px] text-white/60">24/7 assistance for all your trades</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-white/70">
          Have questions about deposits, withdrawals, or UPI payments? Find answers below or reach out to our team.
        </p>
      </section>

      <div className="mt-6"></div>

      {/* Support Contact Button */}
      <section className="rounded-[20px] bg-white border border-[#e8e5ed] p-5 flex items-center justify-between shadow-sm">
        <div>
          <strong className="block text-[16px] text-[#17161c]">Need live help?</strong>
          <p className="text-[13px] text-[#9592a0]">Contact support directly</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#4744ed] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#3a37d4] transition">
          <MessageSquareMore size={18} /> Chat <ArrowRight size={16} />
        </button>
      </section>

      <div className="mt-6"></div>

      {/* FAQ Search & Accordion Section */}
      <section>
        <h2 className="text-[22px] font-bold tracking-[-0.04em] text-[#17161c]">Frequently Asked Questions</h2>

        <div className="mt-6"></div>

        {/* Search Input */}
        <div className="flex items-center gap-3 rounded-[16px] border border-[#e8e5ed] bg-white px-4 py-3 shadow-sm">
          <Search size={20} className="text-[#9592a0] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full text-[15px] outline-none text-[#17161c] bg-transparent"
          />
        </div>

        <div className="mt-6"></div>

        {/* Accordions */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-[14px] text-[#9592a0] text-center py-6">No matching questions found.</p>
          ) : (
            filtered.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.q}>
                  {index > 0 && <div className="mt-6"></div>}
                  <div
                    className="rounded-[18px] border border-[#e8e5ed] bg-white overflow-hidden transition-all shadow-sm"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left text-[16px] font-semibold text-[#17161c]"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        size={20}
                        className={`text-[#4744ed] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 text-[14px] leading-relaxed text-[#504a56] border-t border-[#f2f0f5]">
                        {item.a}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
