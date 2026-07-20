'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Download, Filter, Loader2 } from 'lucide-react';
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
        const response = await fetch('/api/transactions', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await response.json();
        if (active && data.success) setTransactions(data.data.transactions);
      } catch {} finally { if (active) setLoading(false); }
    };
    void loadTransactions();
    return () => { active = false; };
  }, [getAccessToken]);

  return (
    <div className="animate-slide-up">
      <section className="overflow-hidden rounded-[20px] bg-[#edf5ff] shadow-[0_2px_6px_rgba(48,39,129,.08)]">
        <div className="flex items-center justify-between bg-[#d9e8ff] px-7 py-5">
          <div><h2 className="text-[22px] font-bold tracking-[-.04em]">Your Activity</h2><p className="mt-1 text-[16px] text-[#625c69]">All transactions from this month</p></div>
          <div className="flex gap-2"><button className="icon-button h-12 w-12 border-[#7c70dc] bg-transparent text-[#5145c5]"><Filter size={23}/></button><button className="icon-button h-12 w-12 border-[#a8a0e9] bg-transparent text-[#857bdd]"><Download size={23}/></button></div>
        </div>
        <div className="grid grid-cols-3 px-5 py-5 text-center">
          {[['0', 'Buy Volume', 'USDT'], ['0', 'Sell & Pay Volume', 'USDT'], ['0', 'Completed', 'Transactions']].map(([value, label, suffix], index) => <div key={label} className={index ? 'border-l border-[#ddd8f2]' : ''}><strong className="block text-[30px] leading-none text-[#3a86ff]">{value}</strong><span className="mt-2 block text-[15px] leading-5 text-[#3f3a44]">{label}<br/>{suffix}</span></div>)}
        </div>
      </section>

      <section className="min-h-[220px] pt-20 text-center">
        {loading ? <Loader2 className="mx-auto animate-spin text-[#125fe8]" size={28}/> : transactions.length === 0 ? <p className="text-[21px] text-[#47424c]">No transactions found</p> : <div className="space-y-3 text-left">{transactions.map((transaction) => <div key={transaction.id} className="rounded-2xl border border-[#e6e2ea] px-5 py-4"><strong>{transaction.type.replace('_', ' ')}</strong><span className="float-right font-semibold text-[#125fe8]">{transaction.amount} {transaction.asset}</span><p className="mt-1 text-sm text-[#706a76]">{formatDate(transaction.createdAt)}</p></div>)}</div>}
      </section>

      <section className="pb-10">
        <div className="flex items-center justify-between"><h2 className="text-[27px] font-bold tracking-[-.04em]">FAQs</h2><button className="text-[17px] font-medium text-[#125fe8]">See all</button></div>
        <div className="mt-8 divide-y divide-[#e5e1e7] border-y border-[#e5e1e7]">
          {['How can I raise a dispute?', 'What happens if I raise a false dispute?', 'The shopkeeper is asking to see the payment – what should I do?', 'How does FastX P2P protect Indian transactions?'].map((faq) => <button key={faq} className="flex w-full items-center gap-4 py-6 text-left text-[18px] font-medium leading-6"><span>{faq}</span><ChevronDown className="ml-auto shrink-0" size={20}/></button>)}
        </div>
      </section>
    </div>
  );
}
