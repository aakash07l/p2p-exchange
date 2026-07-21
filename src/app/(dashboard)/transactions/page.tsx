'use client';

import { useEffect, useState } from 'react';
import { Download, Filter, Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const { getAccessToken } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTransactions = async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/transactions', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (active && data.success) setTransactions(data.data.transactions);
      } catch {} finally {
        if (active) setLoading(false);
      }
    };
    void loadTransactions();
    return () => { active = false; };
  }, [getAccessToken]);

  return (
    <div className="animate-slide-up pb-10">
      <div style={{ height: '24px' }} />

      {/* Activity Header */}
      <section className="overflow-hidden rounded-[22px] border border-[#e8e5ed] bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f0f5]">
          <div>
            <h2 className="text-[20px] font-bold text-[#17161c]">Your Activity</h2>
            <p className="mt-0.5 text-[13px] text-[#9592a0]">All P2P transactions history</p>
          </div>
          <div className="flex gap-2">
            <button className="icon-button">
              <Filter size={18} />
            </button>
            <button className="icon-button">
              <Download size={18} />
            </button>
          </div>
        </div>
      </section>

      <div style={{ height: '20px' }} />

      {/* Transactions List */}
      <section className="min-h-[220px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#059669]" size={28} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[22px] border border-[#e8e5ed] bg-white p-10 text-center space-y-2">
            <p className="text-[17px] font-bold text-[#17161c]">No transactions found</p>
            <p className="text-[14px] text-[#9592a0]">Your completed buys, sells, and deposits will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-[18px] border border-[#e8e5ed] bg-white p-5 flex items-center justify-between shadow-sm transition hover:border-[#059669]/30"
              >
                <div>
                  <strong className="block text-[16px] font-bold text-[#17161c]">
                    {tx.type.replace('_', ' ')}
                  </strong>
                  <p className="mt-1 text-[13px] text-[#9592a0]">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#059669] text-[16px]">
                    {tx.amount} {tx.asset}
                  </span>
                  <p className={`text-[12px] font-semibold capitalize mt-0.5 ${
                    tx.status === 'COMPLETED' ? 'text-emerald-600' : tx.status === 'FAILED' ? 'text-red-500' : 'text-amber-600'
                  }`}>
                    {tx.status.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
