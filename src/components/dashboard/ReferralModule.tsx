'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Gift, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarned: number;
  pendingPayout: number;
}

export function ReferralModule() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mockData: ReferralData = {
    referralCode: 'P2P-DEMO',
    referralLink: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}?ref=P2P-DEMO`,
    totalReferrals: 0,
    totalEarned: 0,
    pendingPayout: 0,
  };

  const displayData = data || mockData;

  return (
    <div className="rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
            <Gift size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Referral Program</h3>
            <p className="text-xs text-gray-500">Earn ₹500 per successful referral</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: <Users size={15} className="text-indigo-500" />, label: 'Referrals', value: displayData.totalReferrals },
            { icon: <TrendingUp size={15} className="text-emerald-500" />, label: 'Earned', value: `₹${displayData.totalEarned}` },
            { icon: <Gift size={15} className="text-purple-500" />, label: 'Pending', value: `₹${displayData.pendingPayout}` },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-white border border-indigo-200">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-xl border border-indigo-200 p-3 mb-3">
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-indigo-600 truncate font-mono">{displayData.referralLink}</code>
            <button
              onClick={copyLink}
              className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              {copied ? (
                <CheckCircle size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} className="text-indigo-500" />
              )}
            </button>
          </div>
        </div>

        <Button size="sm" variant="primary" className="w-full" onClick={copyLink}>
          {copied ? '✓ Copied!' : 'Copy & Share Link'}
        </Button>
      </div>
    </div>
  );
}
