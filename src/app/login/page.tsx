'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScanLine, ChevronDown } from 'lucide-react';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazilian Real' },
  { code: 'IDR', symbol: 'Rp', flag: '🇮🇩', name: 'Indonesian Rupiah' },
];

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();
  const [currency,      setCurrency]      = useState('INR');
  const [currencyOpen,  setCurrencyOpen]  = useState(false);

  useEffect(() => {
    if (ready && authenticated) router.replace('/dashboard');
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eeeef5]">
        <div className="w-8 h-8 border-2 border-[#4744ed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sel = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <div className="min-h-screen bg-[#eeeef5] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-80px] left-[-60px] w-[340px] h-[340px] rounded-full bg-[#4744ed]/10 blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-40px] w-[280px] h-[280px] rounded-full bg-[#7557ff]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] animate-slide-up">

        {/* ── CARD ── */}
        <div className="bg-white rounded-[28px] border border-[#e8e5ed] shadow-[0_20px_60px_rgba(71,68,237,.12)] overflow-hidden">

          {/* Top gradient strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#4744ed] via-[#7557ff] to-[#4744ed]" />

          {/* Hero */}
          <div className="flex flex-col items-center text-center px-8 pt-8 pb-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4744ed] to-[#7557ff] text-white shadow-[0_4px_12px_rgba(71,68,237,.35)]">
                <ScanLine size={20} strokeWidth={2.5} />
              </span>
              <span className="text-[24px] font-extrabold tracking-[-0.05em] text-[#17161c]">
                FASTX <span className="text-[#33aa33]">P2P</span>
              </span>
            </div>

            {/* Illustration */}
            <div className="relative w-52 h-36 mb-6">
              {/* Left phone */}
              <div className="absolute left-2 bottom-0 w-20 h-32 bg-white rounded-[20px] border-2 border-[#e0dbf5] shadow-[0_8px_24px_rgba(71,68,237,.12)] flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#f0edff] flex items-center justify-center">
                  <span className="text-[#4744ed] font-black text-lg">₹</span>
                </div>
                <div className="w-12 h-1.5 bg-[#c4beff] rounded-full" />
                <div className="w-8 h-1 bg-[#e0dbf5] rounded-full" />
              </div>
              {/* Center arrow */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border-2 border-[#4744ed] flex items-center justify-center shadow-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 16L3 12M3 12L7 8M3 12H21M17 8L21 12M21 12L17 16"
                    stroke="#4744ed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Right phone */}
              <div className="absolute right-2 bottom-0 w-20 h-32 bg-gradient-to-b from-[#4744ed] to-[#7557ff] rounded-[20px] shadow-[0_8px_24px_rgba(71,68,237,.30)] flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-lg">$</span>
                </div>
                <div className="w-12 h-1.5 bg-white/40 rounded-full" />
                <div className="w-8 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[#17161c]">
              Swap USDT ↔ {sel.code} instantly
            </h1>
            
          </div>

          {/* Controls */}
          <div className="px-8 pb-8 space-y-4">
            <p className="text-center text-[13px] font-medium text-[#9592a0]">Select currency and language</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Currency picker */}
              <div className="relative">
                <button
                  id="currency-select"
                  onClick={() => setCurrencyOpen(!currencyOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-[14px] border border-[#e8e5ed] bg-[#f6f5fb] text-[14px] font-semibold text-[#17161c] hover:border-[#4744ed] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{sel.flag}</span>
                    <span>{sel.code}</span>
                  </span>
                  <ChevronDown size={14} className="text-[#9592a0]" />
                </button>
                {currencyOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e8e5ed] rounded-[16px] shadow-xl z-50 overflow-hidden">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-[14px] text-left transition-colors ${
                          currency === c.code
                            ? 'bg-[#f0edff] text-[#4744ed] font-semibold'
                            : 'text-[#17161c] hover:bg-[#f6f5fb]'
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span>{c.code}</span>
                        <span className="text-[#9592a0] text-[12px]">· {c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language (static) */}
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-[14px] border border-[#e8e5ed] bg-[#f6f5fb] text-[14px] font-semibold text-[#17161c]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#9592a0]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                English
                <ChevronDown size={14} className="ml-auto text-[#9592a0]" />
              </div>
            </div>

            <p className="text-center text-[12px] text-[#9592a0]">
              By logging in, you agree to our{' '}
              <a href="#" className="text-[#4744ed] underline underline-offset-2 hover:text-[#3a37d4]">
                Terms & Conditions
              </a>
            </p>

            <button
              id="login-button"
              onClick={() => login()}
              className="w-full py-4 rounded-[16px] bg-[#000000] hover:bg-[#000000] active:scale-[0.98] text-white font-bold text-[16px] tracking-[-0.01em] transition-all shadow-[0_6px_20px_rgba(71,68,237,.30)]"
            >
              Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#9592a0] mt-5">
          🔒 Secured by Privy
        </p>
      </div>
    </div>
  );
}
