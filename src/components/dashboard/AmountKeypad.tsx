'use client';

import { Delete } from 'lucide-react';

interface AmountKeypadProps {
  amount: string;
  onChange: (value: string) => void;
  actionLabel: string;
  onContinue: () => void;
  disabled?: boolean;
  balanceNote?: string;
  currency?: string;
}

export function AmountKeypad({
  amount,
  onChange,
  actionLabel,
  onContinue,
  disabled = false,
  balanceNote,
  currency = 'USDC',
}: AmountKeypadProps) {
  const append = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount.replace('.', '').length >= 8) return;
    if (amount === '0' && key !== '.') {
      onChange(key);
    } else {
      onChange(amount + key);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <section className="keypad-page">
      {/* Amount display */}
      <div className="text-center mt-8 mb-2">
        <div className="flex items-baseline justify-center gap-2">
          <span
            className="font-extrabold leading-none tracking-[-0.07em]"
            style={{
              fontSize: amount.length > 5 ? '52px' : '68px',
              color: '#a093f6',
            }}
          >
            {amount || '0'}
          </span>
          <span className="text-[20px] font-semibold text-[#4e4954] tracking-[-0.03em]">
            {currency}
          </span>
        </div>

        {/* Currency toggle pill */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f0edff] px-5 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 10L12 5L17 10M17 14L12 19L7 14" stroke="#4744ed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[16px] font-semibold text-[#504b55]">INR</span>
        </div>

        {/* Balance note */}
        {balanceNote && (
          <p className="mt-4 text-[16px] text-[#504b55]">
            Available Balance:{' '}
            <strong className="font-semibold text-[#4744ed]">{balanceNote}</strong>
          </p>
        )}
      </div>



      {/* Numeric keypad */}
      <div className="mt-6 grid grid-cols-3">
        {keys.map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => append(key)}
            className="flex items-center justify-center py-4 rounded-xl text-[30px] font-medium tracking-[-0.04em] text-[#17161b] transition hover:bg-[#f6f9ff] active:scale-90"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(amount.slice(0, -1))}
          aria-label="Delete"
          className="flex items-center justify-center py-4 rounded-xl transition hover:bg-[#f6f9ff] active:scale-90"
        >
          <Delete size={28} className="text-[#17161b]" />
        </button>
      </div>

      {/* Max / Clear shortcuts */}
      <div className="mt-2 flex justify-between px-[18%] text-[19px] font-semibold text-[#4744ed]">
        <button type="button" onClick={() => onChange('999')}>Max</button>
        <button type="button" onClick={() => onChange('')}>Clear</button>
      </div>

      {/* Continue button */}
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || !Number(amount)}
        className="mt-6 w-full rounded-[16px] py-[18px] text-[18px] font-bold text-white transition-all
          disabled:bg-[#b3c6fb] disabled:cursor-not-allowed
          enabled:bg-[#4744ed] enabled:shadow-[0_6px_16px_rgba(71,68,237,.28)] enabled:hover:bg-[#3a37d4]"
      >
        {actionLabel}
      </button>
    </section>
  );
}
