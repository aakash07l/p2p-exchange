'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { AmountKeypad } from '@/components/dashboard/AmountKeypad';

const SELL_RATE = 95;
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const rawHot = process.env.NEXT_PUBLIC_PLATFORM_HOT_WALLET;
const PLATFORM_HOT_WALLET = (rawHot && rawHot !== '0x0000000000000000000000000000000000000000')
  ? rawHot
  : '0x57db74fec2dfc517315ea6034aa746511dd80d4b';

export default function SellPage() {
  const { getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [step, setStep] = useState<1 | 2>(1);
  const [amountUsdt, setAmountUsdt] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Fetch real balance
  const fetchBalance = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(Number(data.data?.wallet?.usdtBalance || 0));
      }
    } catch { /* show null */ }
  }, [getAccessToken]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);


  const amountInr = Number(amountUsdt || 0) * SELL_RATE;

  const sell = async () => {
    if (!amountUsdt || Number(amountUsdt) < 1 || !upiId) return;
    setLoading(true); setResult(null); setStatus('Connecting your wallet…');
    try {
      const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      if (!activeWallet) throw new Error('Please connect your crypto wallet first');
      await activeWallet.switchChain(56);
      setStatus('Confirm the USDT (BEP-20) transfer in your wallet…');
      const provider = new BrowserProvider(await activeWallet.getEthereumProvider());
      const signer = await provider.getSigner();
      const contract = new Contract(
        USDT_CONTRACT,
        ['function transfer(address to, uint256 value) public returns (bool)'],
        signer,
      );

      // Explicit gasLimit BigInt(100000) prevents Out Of Gas reverts on BSC Mainnet
      const tx = await contract.transfer(
        PLATFORM_HOT_WALLET,
        parseUnits(amountUsdt, 18),
        { gasLimit: BigInt(100000) }
      );
      
      const hash = tx.hash;
      setStatus('Transfer broadcasted on-chain! Registering sell order…');

      const token = await getAccessToken();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'SELL',
          amountUsdt: Number(amountUsdt),
          amountInr,
          txHash: hash,
          upiId,
          phone,
        }),
      });
      const data = await res.json();
      setResult({
        success: data.success,
        message: data.success
          ? `Sell order submitted! ₹${amountInr.toFixed(2)} will be paid to ${upiId}. TX: ${hash.slice(0, 10)}...${hash.slice(-6)}`
          : data.error || 'Sell order submitted on-chain.',
      });
      if (data.success) { setAmountUsdt(''); setUpiId(''); setPhone(''); fetchBalance(); }
    } catch (error: unknown) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Transaction failed. Please retry.',
      });
    } finally {
      setLoading(false); setStatus('');
    }
  };

  /* ── Step 1: Amount keypad ── */
  if (step === 1) {
    const isInsufficient = walletBalance === null ? false : Number(amountUsdt) > walletBalance;

    return (
      <AmountKeypad
        amount={amountUsdt}
        onChange={setAmountUsdt}
        currency="USDT"
        actionLabel="Continue"
        onContinue={() => setStep(2)}
        hasInsufficientFunds={isInsufficient}
        balanceNote={
          walletBalance === null
            ? 'Loading…'
            : `${walletBalance.toFixed(2)} USDT`
        }
      />
    );
  }


  /* ── Step 2: Payout details ── */
  return (
    <section className="animate-slide-up pb-6 pt-2 space-y-4">

      {/* Summary card */}
      <div className="rounded-[22px] bg-[#111] p-6 text-white">
        <p className="text-[13px] font-medium uppercase tracking-wider text-white/60">You're selling</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[48px] font-extrabold tracking-[-0.06em]">{amountUsdt}</span>
          <span className="text-[18px] font-semibold text-white/70">USDT (BEP-20)</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[16px] text-white/80">
            You'll receive <strong className="text-white">₹{amountInr.toFixed(2)}</strong>
          </span>
          <span className="text-[13px] font-medium bg-white/10 rounded-full px-3 py-1">
            ₹{SELL_RATE}/USDT
          </span>
        </div>
      </div>

      {/* Payout details card */}
      <div className="rounded-[22px] border border-[#e8e5ed] bg-white p-6 shadow-[0_3px_12px_rgba(43,35,77,.06)]">
        <p className="text-[18px] font-bold text-[#17161c]">Where should we pay you?</p>
        <p className="mt-1 text-[14px] text-[#5e5964]">
          We'll transfer ₹{amountInr.toFixed(2)} to your UPI ID instantly after the USDT is confirmed.
        </p>

        {/* UPI ID */}
        <div className="mt-5">
          <label className="block text-[13px] font-semibold text-[#3d3843] mb-2">
            Payout UPI ID <span className="text-red-500">*</span>
          </label>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="p2p-input"
          />
        </div>

        {/* Phone */}
        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[#3d3843] mb-2">
            Mobile Number <span className="text-[#9592a0] font-normal">(optional)</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+91 98765 43210"
            className="p2p-input"
          />
        </div>

        {/* Status / loading */}
        {loading && (
          <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-[#f0edff] border border-[#d7d0f0] p-4">
            <Loader2 className="animate-spin shrink-0 text-[#4744ed]" size={18} />
            <p className="text-[14px] text-[#4744ed] font-medium">{status}</p>
          </div>
        )}

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

        {/* What happens next note */}
        <div className="mt-5 rounded-[14px] bg-[#f6f9ff] border border-[#e0dbf5] p-4">
          <p className="text-[13px] text-[#5e5964] leading-5">
            <strong className="text-[#17161c]">How it works:</strong> After clicking below, your USDT (BEP-20) will
            be transferred to our hot wallet. Once confirmed on-chain, we'll instantly pay the INR to your UPI.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={sell}
          disabled={loading || !upiId || Number(amountUsdt) < 5}
          className="mt-5 p2p-btn p2p-btn-primary"
        >
          {loading ? 'Processing…' : `Transfer USDT & Get ₹${amountInr.toFixed(2)}`}
        </button>

        <button
          onClick={() => setStep(1)}
          disabled={loading}
          className="mt-3 w-full text-[15px] font-semibold text-[#4744ed] py-2 disabled:opacity-40"
        >
          ← Back to amount
        </button>
      </div>
    </section>
  );
}
