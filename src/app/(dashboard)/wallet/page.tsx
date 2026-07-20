'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Copy, CheckCircle, AlertCircle, Loader2, RefreshCw, Sparkles,
  Wallet, ArrowDownToLine, ArrowUpFromLine, X,
} from 'lucide-react';
import { usePrivy, useCreateWallet, useWallets } from '@privy-io/react-auth';
import QRCode from 'qrcode';

type Sheet = null | 'deposit' | 'withdraw';

interface WalletData {
  usdtBalance: number;
  btcBalance:  number;
  ethBalance:  number;
  inrBalance:  number;
  address:     string | null;
}

const CHAIN_ICONS = ['🔵','🟡','🟠','⬛','🔴','🔶','⚪'];
const CHAINS = ['Ethereum','BNB','Polygon','Arbitrum','Avalanche','Solana','Tron'];

export default function WalletPage() {
  const { getAccessToken }  = usePrivy();
  const { wallets }         = useWallets();
  const { createWallet }    = useCreateWallet();

  const [walletData,     setWalletData]     = useState<WalletData | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [qrDataUrl,      setQrDataUrl]      = useState('');
  const [copied,         setCopied]         = useState(false);
  const [sheet,          setSheet]          = useState<Sheet>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddr,   setWithdrawAddr]   = useState('');
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; message: string } | null>(null);
  const [detectResult,   setDetectResult]   = useState<{ success: boolean; message: string } | null>(null);
  const [detecting,      setDetecting]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [createError,    setCreateError]    = useState<string | null>(null);

  const hasWallet = wallets.some((w) => w.walletClientType === 'privy');

  /* Helpers */
  const authHeaders = useCallback(async () => {
    const token = await getAccessToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [getAccessToken]);

  const loadWallet = useCallback(async () => {
    try {
      const h = await authHeaders();
      const r = await fetch('/api/wallet', { headers: h });
      const d = await r.json();
      if (d.success) {
        const wallet = d.data.wallet;
        // If API doesn't return address, pull it from Privy embedded wallet directly
        if (!wallet.address) {
          const privyWallet = wallets.find((w) => w.walletClientType === 'privy');
          if (privyWallet) wallet.address = privyWallet.address;
        }
        setWalletData(wallet);
      }
    } catch {}
  }, [authHeaders, wallets]);

  const loadDeposit = useCallback(async () => {
    try {
      const h = await authHeaders();
      const r = await fetch('/api/wallet/deposit', { headers: h });
      const d = await r.json();
      if (d.success && d.data.depositAddress) {
        setDepositAddress(d.data.depositAddress);
        const qr = await QRCode.toDataURL(d.data.depositAddress, {
          width: 220, margin: 2, color: { dark: '#17161c', light: '#ffffff' },
        });
        setQrDataUrl(qr);
      }
    } catch {}
  }, [authHeaders]);

  useEffect(() => { if (hasWallet) loadWallet(); }, [hasWallet, loadWallet]);

  useEffect(() => {
    if (sheet === 'deposit' && hasWallet && !depositAddress) loadDeposit();
  }, [sheet, hasWallet, depositAddress, loadDeposit]);

  /* Query-param deep links e.g. /wallet?tab=deposit */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('tab');
    if (t === 'deposit' || t === 'withdraw') setSheet(t);
  }, []);

  const copyAddress = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectDeposit = async () => {
    setDetecting(true);
    try {
      const h = await authHeaders();
      const r = await fetch('/api/wallet/detect-deposit', { headers: h });
      const d = await r.json();
      if (d.success && d.detected) {
        setDetectResult({ success: true, message: d.message });
        loadWallet();
      } else {
        setDetectResult({ success: true, message: 'No new deposits detected. Still scanning…' });
      }
    } catch {
      setDetectResult({ success: false, message: 'Auto-detection failed.' });
    } finally {
      setDetecting(false);
    }
  };

  const withdraw = async () => {
    if (!withdrawAmount || !withdrawAddr) return;
    setLoading(true); setWithdrawResult(null);
    try {
      const h = await authHeaders();
      const r = await fetch('/api/wallet/withdraw', {
        method: 'POST', headers: h,
        body: JSON.stringify({ asset: 'USDT', amount: parseFloat(withdrawAmount), toAddress: withdrawAddr }),
      });
      const d = await r.json();
      setWithdrawResult({
        success: d.success,
        message: d.success
          ? `Withdrawal of ${withdrawAmount} USDC submitted! TX: ${d.data?.txHash?.slice(0, 20)}…`
          : d.error,
      });
      if (d.success) { setWithdrawAmount(''); setWithdrawAddr(''); loadWallet(); }
    } catch {
      setWithdrawResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setCreating(true); setCreateError(null);
    try {
      await createWallet();
      const token = await getAccessToken();
      if (token) await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Unable to create wallet. Please retry.');
    } finally {
      setCreating(false);
    }
  };

  const balances = [
    { asset: 'USDC', balance: walletData?.usdtBalance || 0, icon: '₮', color: '#059669', bg: '#d1fae5', fgCls: 'text-emerald-700' },
    { asset: 'BTC',  balance: walletData?.btcBalance  || 0, icon: '₿', color: '#f59e0b', bg: '#fef3c7', fgCls: 'text-amber-700' },
    { asset: 'ETH',  balance: walletData?.ethBalance  || 0, icon: 'Ξ', color: '#6366f1', bg: '#e0e7ff', fgCls: 'text-indigo-700' },
  ];

  /* ── No wallet: create prompt ── */
  if (!hasWallet) {
    return (
      <div className="animate-slide-up my-6 rounded-[26px] bg-[#f6f9ff] p-8 text-center space-y-5 shadow-[0_4px_20px_rgba(50,38,143,.08)]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#d0e4ff] flex items-center justify-center mx-auto shadow-sm">
          <Wallet size={30} className="text-[#4744ed]" />
        </div>
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.04em] text-[#17161c]">Setup Your Wallet</h2>
          <p className="mt-2 text-[15px] text-[#5d5762] leading-relaxed">
            Create a secure Privy embedded wallet to start buying, selling, and depositing USDC. Takes only a few seconds.
          </p>
        </div>
        <button
          onClick={handleCreateWallet}
          disabled={creating}
          className="p2p-btn p2p-btn-primary"
        >
          {creating
            ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
            : <><Sparkles size={16} /> Create My Wallet</>}
        </button>
        {createError && (
          <p className="rounded-[14px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{createError}</p>
        )}
      </div>
    );
  }

  /* ── Main wallet view ── */
  return (
    <div className="animate-slide-up space-y-4 pt-2 pb-6">

      {/* Balance hero */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#4744ed] to-[#7557ff] p-5 text-white shadow-[0_8px_28px_rgba(71,68,237,.30)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">Available Balance</p>
        <p className="mt-1 text-[42px] font-extrabold tracking-[-0.05em] leading-tight">
          ${(walletData?.usdtBalance || 0).toFixed(2)}
        </p>
        <p className="text-[16px] text-white/60 mt-0.5">
          ≈ ₹{((walletData?.usdtBalance || 0) * 97.66).toFixed(2)}
        </p>

        {/* Wallet address */}
        {walletData?.address && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
            <code className="flex-1 text-[11px] font-mono text-white/70 truncate">
              {walletData.address}
            </code>
            <button onClick={copyAddress} className="shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition">
              {copied ? <CheckCircle size={14} className="text-emerald-300" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSheet('deposit')}
          className="flex items-center justify-center gap-2.5 rounded-[18px] border border-[#e8e5ed] bg-white py-4 font-semibold text-[15px] text-[#17161c] shadow-sm transition hover:border-[#4744ed] hover:text-[#4744ed]"
        >
          <ArrowDownToLine size={18} strokeWidth={2} /> Deposit
        </button>
        <button
          onClick={() => setSheet('withdraw')}
          className="flex items-center justify-center gap-2.5 rounded-[18px] border border-[#e8e5ed] bg-white py-4 font-semibold text-[15px] text-[#17161c] shadow-sm transition hover:border-[#17161c]"
        >
          <ArrowUpFromLine size={18} strokeWidth={2} /> Withdraw
        </button>
      </div>

      {/* Asset balances */}
      <div className="space-y-2">
        {balances.map(({ asset, balance, icon, bg, fgCls }) => (
          <div
            key={asset}
            className="flex items-center justify-between rounded-[18px] border border-[#e8e5ed] bg-white p-4 transition hover:border-[#ccc8d8] hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-[18px] font-bold"
                style={{ background: bg }}
              >
                <span className={fgCls}>{icon}</span>
              </div>
              <div>
                <p className="font-semibold text-[#17161c] text-[15px]">{asset}</p>
                <p className="text-[11px] text-[#9592a0] font-medium">BNB Smart Chain</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#17161c] text-[16px]">
                {balance.toFixed(asset === 'BTC' ? 6 : 2)}
              </p>
              <p className="text-[11px] text-[#9592a0]">{asset}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <button
        onClick={loadWallet}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] bg-[#f6f9ff] border border-[#e0dbf5] text-[14px] font-semibold text-[#4744ed] transition hover:bg-[#edeaff]"
      >
        <RefreshCw size={14} /> Refresh Balances
      </button>

      {/* ── DEPOSIT BOTTOM SHEET ── */}
      {sheet === 'deposit' && (
        <div className="sheet-overlay" onClick={() => setSheet(null)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="px-6 pb-6 space-y-5">
              {/* Sheet Header */}
              <div className="flex items-start justify-between border-b border-[#f0edff] pb-4">
                <div>
                  <h3 className="text-[22px] font-extrabold text-[#17161c]">Deposit USDT</h3>
                  <p className="text-[14px] font-medium text-[#504b55] mt-0.5">
                    BNB Smart Chain (BEP-20)
                  </p>
                </div>
                <button onClick={() => setSheet(null)} className="icon-button">
                  <X size={20} />
                </button>
              </div>

              {/* Main Card */}
              {depositAddress ? (
                <div className="space-y-5 text-center">

                  {/* Network Pill */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f0edff] border border-[#d7d0f0] px-4 py-2 text-[14px] font-bold text-[#4744ed] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Network: BEP-20 (BNB Smart Chain)
                  </div>

                  {/* QR Code Container - Perfectly Centered */}
                  <div className="flex justify-center items-center py-2">
                    <div className="p-4 bg-white border-2 border-[#e8e5ed] rounded-[24px] shadow-md flex items-center justify-center mx-auto">
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="Deposit QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto block"
                        />
                      )}
                    </div>
                  </div>

                  {/* Deposit Address Card - Bold & Larger Text */}
                  <div className="rounded-[20px] bg-[#f6f5fb] border-2 border-[#e0dbf5] p-5 text-center space-y-3 shadow-sm">
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#6b6575]">
                      Your BEP-20 Deposit Address
                    </p>

                    <div className="rounded-xl bg-white border border-[#e0dbf5] p-3.5">
                      <p className="text-[15px] sm:text-[16px] font-extrabold font-mono text-[#17161c] break-all leading-relaxed select-all">
                        {depositAddress}
                      </p>
                    </div>

                    <button
                      onClick={copyAddress}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#4744ed] text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(71,68,237,.25)] hover:bg-[#3a37d4] transition active:scale-[0.98]"
                    >
                      {copied ? <CheckCircle size={18} className="text-emerald-300" /> : <Copy size={18} />}
                      {copied ? 'Address Copied to Clipboard!' : 'Copy Deposit Address'}
                    </button>
                  </div>

                  {/* Warning Notice */}
                  <div className="flex items-center justify-center gap-2.5 p-4 rounded-[16px] bg-amber-50 border border-amber-200 text-[13px] text-amber-800 font-semibold leading-snug">
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    <span>Send only <strong>USDT on BEP-20 (BNB Smart Chain)</strong> network.</span>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#9592a0]">
                  <Loader2 size={28} className="animate-spin text-[#4744ed]" />
                  <p className="text-[15px] font-medium">Generating your BEP-20 address…</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW BOTTOM SHEET ── */}
      {sheet === 'withdraw' && (
        <div className="sheet-overlay" onClick={() => setSheet(null)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div className="px-6 pb-2 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[20px] font-bold text-[#17161c]">Withdraw USDT</h3>
                  <p className="text-[14px] text-[#9592a0]">
                    Available: <strong className="text-[#17161c]">{walletData?.usdtBalance?.toFixed(2) || '0.00'} USDT</strong>
                  </p>
                </div>
                <button onClick={() => setSheet(null)} className="icon-button">
                  <X size={18} />
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[13px] font-semibold text-[#3d3843] mb-2">
                  Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Min. 5 USDT"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="p2p-input pr-20"
                  />
                  <button
                    onClick={() => setWithdrawAmount(String(walletData?.usdtBalance || 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#4744ed] bg-[#f0edff] border border-[#d7d0f0] px-2.5 py-1.5 rounded-lg"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Destination address */}
              <div>
                <label className="block text-[13px] font-semibold text-[#3d3843] mb-2">
                  Destination BEP-20 Address
                </label>
                <input
                  type="text"
                  placeholder="0x…"
                  value={withdrawAddr}
                  onChange={(e) => setWithdrawAddr(e.target.value)}
                  className="p2p-input font-mono text-[13px]"
                />
              </div>

              {/* Fee breakdown */}
              <div className="rounded-[14px] bg-[#f6f9ff] border border-[#e0dbf5] p-4 text-[13px] space-y-2">
                <div className="flex justify-between text-[#9592a0]">
                  <span>Network</span>
                  <span className="font-semibold text-[#17161c]">BNB Smart Chain (BEP-20)</span>
                </div>
                <div className="flex justify-between text-[#9592a0]">
                  <span>Network Fee</span>
                  <span className="font-bold text-emerald-600">0 USDT (Free)</span>
                </div>
                <div className="flex justify-between border-t border-[#e0dbf5] pt-2">
                  <span className="text-[#9592a0]">Net Payout</span>
                  <span className="font-bold text-emerald-600">
                    {parseFloat(withdrawAmount || '0').toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Result */}
              {withdrawResult && (
                <div className={`flex items-start gap-2.5 rounded-[14px] p-4 text-[13px] ${
                  withdrawResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {withdrawResult.success ? <CheckCircle size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" />}
                  <p>{withdrawResult.message}</p>
                </div>
              )}

              <button
                onClick={withdraw}
                disabled={loading || !withdrawAmount || !withdrawAddr || parseFloat(withdrawAmount) < 5}
                className="p2p-btn p2p-btn-primary"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Processing…</> : 'Confirm Withdrawal'}
              </button>

              <button onClick={() => setSheet(null)} className="w-full text-[14px] font-semibold text-[#9592a0] py-2 mb-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
