'use client';

import { TrendingDown, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

export function ActionButtons() {
  const actions = [
    { id: 'buy', label: 'Buy USDT', href: '/buy', icon: <TrendingUp size={20} />, iconClass: 'text-emerald-600 bg-emerald-50 border border-emerald-200', labelClass: 'text-gray-700' },
    { id: 'sell', label: 'Sell USDT', href: '/sell', icon: <TrendingDown size={20} />, iconClass: 'text-red-600 bg-red-50 border border-red-200', labelClass: 'text-gray-700' },
    { id: 'deposit', label: 'Deposit', href: '/wallet?tab=deposit', icon: <ArrowDownCircle size={20} />, iconClass: 'text-indigo-600 bg-indigo-50 border border-indigo-200', labelClass: 'text-gray-700' },
    { id: 'withdraw', label: 'Withdraw', href: '/wallet?tab=withdraw', icon: <ArrowUpCircle size={20} />, iconClass: 'text-purple-600 bg-purple-50 border border-purple-200', labelClass: 'text-gray-700' },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map(({ id, label, href, icon, iconClass, labelClass }) => (
        <Link
          key={id}
          id={`action-${id}`}
          href={href}
          className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3 text-center group active:scale-95 hover:border-gray-300 hover:shadow-md transition-all"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 ${iconClass}`}>
            {icon}
          </div>
          <span className={`text-xs font-semibold ${labelClass} group-hover:text-gray-900 transition-colors`}>{label}</span>
        </Link>
      ))}
    </div>
  );
}
