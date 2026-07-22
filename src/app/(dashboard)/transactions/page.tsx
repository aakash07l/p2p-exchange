'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Filter, Loader2, ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle2, Clock, XCircle, Copy } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const { getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadTransactions = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/transactions', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadTransactions();
    // Live Auto-Sync every 4 seconds so status updates (PENDING -> COMPLETED) show in real-time!
    const interval = setInterval(loadTransactions, 4000);
    return () => clearInterval(interval);
  }, [loadTransactions]);

  return (
    <div className="animate-slide-up pb-10">
      <div style={{ height: '24px' }} />

      {/* Activity Header */}
      <section className="overflow-hidden rounded-[22px] border border-[#e8e5ed] bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f0f5]">
          <div>
            <h2 className="text-[20px] font-bold text-[#17161c]">Your Activity & Payouts</h2>
            <p className="mt-0.5 text-[13px] text-[#9592a0]">Real-time status of your buys, sells, and wallet payouts</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadTransactions} className="icon-button" title="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      <div style={{ height: '20px' }} />

      {/* Transactions List */}
      <section className="min-h-[220px]">
        {loading && transactions.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#4744ed]" size={32} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[22px] border border-[#e8e5ed] bg-white p-12 text-center space-y-2">
            <p className="text-[17px] font-bold text-[#17161c]">No transactions found</p>
            <p className="text-[14px] text-[#9592a0]">Your completed buys, sells, and deposits will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {transactions.map((tx: any) => {
              const isSell = tx.type === 'SELL' || tx.type === 'WITHDRAW';
              const payoutUpi = tx.metadata?.upiId || tx.upiRef;

              return (
                <div
                  key={tx.id}
                  className="rounded-[20px] border border-[#e8e5ed] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition hover:border-[#4744ed]/30"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSell ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isSell ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[16px] font-bold text-[#17161c] capitalize">
                          {tx.type.replace('_', ' ')} Order
                        </strong>
                        
                        {/* Status tag */}
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {tx.status === 'PENDING' ? 'PENDING ADMIN PAYOUT' : tx.status}
                        </span>
                      </div>

                      <p className="mt-1 text-[12px] text-[#9592a0]">{formatDate(tx.createdAt)}</p>

                      {/* Details: Payout UPI or TxHash */}
                      {isSell && payoutUpi && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#5e5964]">
                          <span className="font-semibold text-[#17161c]">Payout UPI:</span>
                          <code className="font-mono text-[#4744ed] font-bold bg-[#f0edff] px-2 py-0.5 rounded select-all">
                            {payoutUpi}
                          </code>
                          <button
                            onClick={() => copyToClipboard(payoutUpi, tx.id)}
                            className="p-1 text-slate-400 hover:text-[#4744ed] transition-colors"
                            title="Copy UPI ID"
                          >
                            <Copy size={12} />
                          </button>
                          {copiedId === tx.id && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                        </div>
                      )}

                      {!isSell && tx.upiRef && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#5e5964]">
                          <span className="font-semibold text-[#17161c]">UTR Ref:</span>
                          <code className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded select-all">
                            {tx.upiRef}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side amounts */}
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f2f0f5]">
                    <span className={`font-extrabold text-[17px] block ${isSell ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isSell ? '-' : '+'}{tx.amount} USDT
                    </span>
                    {tx.metadata?.amountInr && (
                      <span className="text-[13px] font-bold text-[#5e5964] block mt-0.5">
                        ₹{Number(tx.metadata.amountInr).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
