'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Eye, EyeOff, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { shortenAddress, formatCrypto } from '@/lib/utils';

interface WalletData {
  wallet: {
    address: string;
    usdtBalance: number;
    btcBalance: number;
    ethBalance: number;
    inrBalance: number;
  };
  prices: Record<string, number>;
  totalValue: number;
}

const ASSETS = [
  { key: 'usdtBalance', symbol: 'USDT', textColor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'btcBalance', symbol: 'BTC', textColor: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { key: 'ethBalance', symbol: 'ETH', textColor: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
];

export function WalletCard() {
  const { getAccessToken } = usePrivy();
  const [data, setData] = useState<WalletData | null>(null);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    setRefreshing(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const copy = () => {
    if (data?.wallet.address) {
      navigator.clipboard.writeText(data.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Total Portfolio Value</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {hidden ? '••••••' : `₹${(data?.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setHidden(!hidden)} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
            {hidden ? <Eye size={16} className="text-gray-500" /> : <EyeOff size={16} className="text-gray-500" />}
          </button>
          <button onClick={fetchWallet} className={`p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Address */}
      {data?.wallet.address && (
        <div className="flex items-center gap-2 mb-5 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
          <code className="flex-1 text-xs text-indigo-600 font-mono">{shortenAddress(data.wallet.address, 6)}</code>
          <button onClick={copy} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {/* Asset Balances */}
      <div className="space-y-2">
        {ASSETS.map(({ key, symbol, textColor, bg }) => {
          const balance = (data?.wallet as any)?.[key] || 0;
          const price = data?.prices?.[symbol] || 0;
          const inrValue = balance * price;
          return (
            <div key={symbol} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${bg}`}>
                  <span className={`text-xs font-bold ${textColor}`}>{symbol.slice(0, 1)}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{hidden ? '••••' : formatCrypto(balance, symbol)}</p>
                <p className="text-xs text-gray-400">{hidden ? '••••' : `≈ ₹${inrValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
