'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, Wallet, ShieldCheck, Clock } from 'lucide-react';
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
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amountUsdt, setAmountUsdt] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [sellMode, setSellMode] = useState<'INTERNAL' | 'ONCHAIN'>('INTERNAL');

  // Loading & Timer states
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [submittedTx, setSubmittedTx] = useState<any | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Fetch real user balance
  const fetchBalance = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(Number(data.data?.wallet?.usdtBalance || 0));
      }
    } catch { /* ignore */ }
  }, [getAccessToken]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const amountInr = Number(amountUsdt || 0) * SELL_RATE;

  // Process Sell Order with 10s Timer
  const handleSellSubmit = async () => {
    if (!amountUsdt || Number(amountUsdt) < 1 || !upiId) return;

    setLoading(true);
    setErrorMsg(null);
    setCountdown(10);
    setStatusMsg('Initiating sell request...');

    let txHash: string | undefined = undefined;

    try {
      // If user chooses ONCHAIN mode
      if (sellMode === 'ONCHAIN') {
        const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
        if (!activeWallet) throw new Error('Please connect your crypto wallet first');
        
        setStatusMsg('Switching to BNB Smart Chain...');
        await activeWallet.switchChain(56);
        
        setStatusMsg('Confirming USDT transfer in your crypto wallet...');
        const provider = new BrowserProvider(await activeWallet.getEthereumProvider());
        const signer = await provider.getSigner();
        const contract = new Contract(
          USDT_CONTRACT,
          ['function transfer(address to, uint256 value) public returns (bool)'],
          signer,
        );

        const tx = await contract.transfer(
          PLATFORM_HOT_WALLET,
          parseUnits(amountUsdt, 18),
          { gasLimit: BigInt(100000) }
        );
        txHash = tx.hash;
        setStatusMsg('On-chain transfer broadcasted! Processing order...');
      } else {
        setStatusMsg('Deducting USDT from wallet balance & submitting payout order...');
      }

      // Submit transaction to backend API
      const token = await getAccessToken();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          type: 'SELL',
          amountUsdt: Number(amountUsdt),
          amountInr,
          txHash,
          upiId,
          phone,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit sell order');
      }

      setSubmittedTx(data.data);
      fetchBalance();

      // Start 10-second Countdown Timer before showing Success screen
      let currentSec = 10;
      const interval = setInterval(() => {
        currentSec -= 1;
        setCountdown(currentSec);
        if (currentSec <= 0) {
          clearInterval(interval);
          setLoading(false);
          setStep(3); // Step 3: Success Screen
        }
      }, 1000);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Sell order failed. Please retry.');
    }
  };

  /* ── Step 1: Amount Keypad ── */
  if (step === 1) {
    const isInsufficient = walletBalance !== null && sellMode === 'INTERNAL' && Number(amountUsdt) > walletBalance;

    return (
      <div className="space-y-4">
        {/* Toggle Mode: Internal Balance vs On-Chain Transfer */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-[#f2f0f5] border border-[#e2dee8]">
          <button
            type="button"
            onClick={() => setSellMode('INTERNAL')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sellMode === 'INTERNAL' ? 'bg-white text-[#17161c] shadow-sm' : 'text-[#726e7a]'
            }`}
          >
            <Wallet size={15} />
            <span>Sell from Balance</span>
          </button>
          <button
            type="button"
            onClick={() => setSellMode('ONCHAIN')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              sellMode === 'ONCHAIN' ? 'bg-white text-[#17161c] shadow-sm' : 'text-[#726e7a]'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Sell On-Chain (Crypto Wallet)</span>
          </button>
        </div>

        <AmountKeypad
          amount={amountUsdt}
          onChange={setAmountUsdt}
          currency="USDT"
          actionLabel="Continue"
          onContinue={() => setStep(2)}
          hasInsufficientFunds={isInsufficient}
          balanceNote={
            walletBalance === null
              ? 'Loading balance…'
              : `${walletBalance.toFixed(2)} USDT`
          }
        />
      </div>
    );
  }

  /* ── Step 3: Success Screen after 10s Timer ── */
  if (step === 3 && submittedTx) {
    return (
      <section className="animate-slide-up pb-8 pt-4 space-y-5">
        <div className="rounded-[26px] bg-white border border-[#e8e5ed] p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Sell Order Submitted
            </span>
            <h2 className="text-2xl font-extrabold text-[#17161c] mt-2">Payout In Progress</h2>
            <p className="text-[14px] text-[#5e5964] mt-1 max-w-sm mx-auto">
              Your USDT has been received. Admin is transferring <strong className="text-[#17161c]">₹{amountInr.toFixed(2)}</strong> to your UPI ID.
            </p>
          </div>

          {/* Details breakdown */}
          <div className="rounded-2xl bg-[#f8f7fa] border border-[#ece9f2] p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#726e7a] font-medium">Selling Amount</span>
              <span className="font-bold text-[#17161c] text-sm">{amountUsdt} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#726e7a] font-medium">Payout Expected</span>
              <span className="font-extrabold text-emerald-600 text-sm">₹{amountInr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#726e7a] font-medium">Target UPI ID</span>
              <code className="font-mono font-bold text-[#4744ed] bg-[#4744ed]/10 px-2 py-0.5 rounded text-xs select-all">
                {upiId}
              </code>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#e8e5ed]">
              <span className="text-[#726e7a] font-medium">Order Status</span>
              <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 uppercase text-[10px]">
                PENDING (Awaiting Admin INR Payout)
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.push('/transactions')}
              className="w-full py-4 rounded-xl bg-[#4744ed] hover:bg-[#3b38db] text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>View in Transaction History</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                setStep(1);
                setAmountUsdt('');
                setUpiId('');
                setSubmittedTx(null);
              }}
              className="w-full py-3 rounded-xl bg-[#f2f0f5] text-[#5e5964] font-bold text-xs hover:text-[#17161c] transition-colors"
            >
              Sell Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ── Step 2: Payout Details & 10s Timer Loading State ── */
  return (
    <section className="animate-slide-up pb-6 pt-2 space-y-4">
      {/* Summary card */}
      <div className="rounded-[22px] bg-[#111] p-6 text-white">
        <p className="text-[13px] font-medium uppercase tracking-wider text-white/60">You're selling</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[44px] font-extrabold tracking-[-0.06em]">{amountUsdt}</span>
          <span className="text-[18px] font-semibold text-white/70">USDT</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[15px] text-white/80">
            You'll receive <strong className="text-white">₹{amountInr.toFixed(2)}</strong>
          </span>
          <span className="text-[12px] font-medium bg-white/10 rounded-full px-3 py-1">
            ₹{SELL_RATE}/USDT
          </span>
        </div>
      </div>

      {/* Payout details card */}
      <div className="rounded-[22px] border border-[#e8e5ed] bg-white p-6 shadow-sm space-y-4">
        <div>
          <p className="text-[18px] font-bold text-[#17161c]">Payout UPI ID</p>
          <p className="mt-0.5 text-[13px] text-[#5e5964]">
            Admin will copy your UPI ID and transfer ₹{amountInr.toFixed(2)} directly to your account.
          </p>
        </div>

        {/* UPI ID */}
        <div>
          <label className="block text-[13px] font-semibold text-[#3d3843] mb-1.5">
            Recipient UPI ID <span className="text-red-500">*</span>
          </label>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. yourname@upi"
            className="p2p-input"
            disabled={loading}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[13px] font-semibold text-[#3d3843] mb-1.5">
            Mobile Number <span className="text-[#9592a0] font-normal">(optional)</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+91 98765 43210"
            className="p2p-input"
            disabled={loading}
          />
        </div>

        {/* Loading & 10s Timer Banner */}
        {loading && (
          <div className="rounded-2xl bg-[#f0edff] border border-[#d7d0f0] p-5 space-y-3 text-center">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#4744ed]" size={24} />
              <span className="text-lg font-black text-[#4744ed] flex items-center gap-1.5">
                <Clock size={18} /> {countdown}s
              </span>
            </div>
            <p className="text-xs font-semibold text-[#4744ed]">{statusMsg}</p>
            
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#d7d0f0] overflow-hidden">
              <div
                className="h-full bg-[#4744ed] transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error alert */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl p-4 text-xs bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Note */}
        <div className="rounded-2xl bg-[#f6f9ff] border border-[#e0dbf5] p-4 text-xs text-[#5e5964] leading-relaxed">
          <strong className="text-[#17161c]">How Payout Works:</strong> Once you click below, your sell order will be registered. Admin will review the order in the Admin Panel, copy your UPI ID ({upiId || 'your UPI'}), and complete the INR transfer.
        </div>

        {/* Submit */}
        <button
          onClick={handleSellSubmit}
          disabled={loading || !upiId || Number(amountUsdt) < 1}
          className="w-full py-4 rounded-2xl bg-[#4744ed] hover:bg-[#3b38db] disabled:opacity-50 text-white font-extrabold text-sm tracking-wide transition-all shadow-md"
        >
          {loading ? `Processing Order... (${countdown}s)` : `Submit Sell Order & Get ₹${amountInr.toFixed(2)}`}
        </button>

        <button
          onClick={() => setStep(1)}
          disabled={loading}
          className="w-full text-[13px] font-semibold text-[#4744ed] py-1 disabled:opacity-40"
        >
          ← Back to amount
        </button>
      </div>
    </section>
  );
}
