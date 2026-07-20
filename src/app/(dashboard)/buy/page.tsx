'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { AmountKeypad } from '@/components/dashboard/AmountKeypad';

const BUY_RATE = 101;
const PLATFORM_UPI_ID = process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || 'fastxp2p@ybl';

export default function BuyPage() {
  const { getAccessToken } = usePrivy();
  const [step, setStep] = useState<1 | 2>(1);
  const [amountUsdt, setAmountUsdt] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const amountInr = Number(amountUsdt || 0) * BUY_RATE;

  const copyUpi = () => {
    navigator.clipboard.writeText(PLATFORM_UPI_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async () => {
    if (!/^\d{12}$/.test(upiRef)) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'BUY', amountInr, amountUsdt: Number(amountUsdt), upiRef }),
      });
      const data = await res.json();
      setResult({
        success: data.success,
        message: data.success
          ? 'Payment submitted! Your USDT (BEP-20) will arrive after verification.'
          : data.error || 'Unable to submit payment.',
      });
      if (data.success) { setAmountUsdt(''); setUpiRef(''); }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 1: Amount keypad ── */
  if (step === 1) {
    return (
      <AmountKeypad
        amount={amountUsdt}
        onChange={setAmountUsdt}
        currency="USDT"
        actionLabel="Continue"
        onContinue={() => setStep(2)}
      />
    );
  }

  /* ── Step 2: UPI payment details ── */
  return (
    <section className="animate-slide-up pb-6 pt-2 space-y-4">

      {/* Summary card */}
      <div className="rounded-[22px] bg-[#f0edff] p-6">
        <p className="text-[14px] font-medium text-[#57505e] uppercase tracking-wider">You'll receive</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[48px] font-extrabold tracking-[-0.06em] text-[#4744ed]">{amountUsdt}</span>
          <span className="text-[18px] font-semibold text-[#36313a]">USDT</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[16px] text-[#514c58]">
            Pay <strong className="text-[#17161c]">₹{amountInr.toFixed(2)}</strong> via UPI
          </span>
          <span className="text-[13px] font-medium text-[#7e78a0] bg-white rounded-full px-3 py-1">
            Rate: ₹{BUY_RATE}/USDT
          </span>
        </div>
      </div>

      {/* UPI payment card */}
      <div className="rounded-[22px] border border-[#e8e5ed] bg-white p-6 shadow-[0_3px_12px_rgba(43,35,77,.06)]">
        <p className="text-[18px] font-bold text-[#17161c]">Make UPI Payment</p>
        <p className="mt-1 text-[14px] text-[#5e5964]">
          Send ₹{amountInr.toFixed(2)} to the UPI ID below, then enter your 12-digit UTR.
        </p>

        {/* UPI ID */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-[14px] bg-[#f6f9ff] px-4 py-4 border border-[#e0dbf5]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9592a0] mb-0.5">UPI ID</p>
            <code className="text-[16px] font-bold text-[#4744ed]">{PLATFORM_UPI_ID}</code>
          </div>
          <button
            onClick={copyUpi}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-[#d7d0f0] px-3 py-2 text-[13px] font-semibold text-[#4744ed] transition hover:bg-[#f0edff]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* UTR input */}
        <div className="mt-5">
          <label className="block text-[13px] font-semibold text-[#3d3843] mb-2">
            12-digit UTR / Reference Number
          </label>
          <input
            value={upiRef}
            onChange={(e) => setUpiRef(e.target.value.replace(/\D/g, '').slice(0, 12))}
            inputMode="numeric"
            placeholder="e.g. 425612345678"
            className="p2p-input"
          />
          <p className="mt-1.5 text-[12px] text-[#9592a0]">
            Find this in your UPI app → Transaction Details
          </p>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 flex items-start gap-3 rounded-[14px] p-4 text-[14px] ${
            result.success
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.success
              ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
              : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading || !/^\d{12}$/.test(upiRef)}
          className="mt-6 p2p-btn p2p-btn-primary"
        >
          {loading ? 'Submitting…' : 'Submit & Verify Payment'}
        </button>

        <button
          onClick={() => setStep(1)}
          className="mt-3 w-full text-[15px] font-semibold text-[#4744ed] py-2"
        >
          ← Back to amount
        </button>
      </div>
    </section>
  );
}
