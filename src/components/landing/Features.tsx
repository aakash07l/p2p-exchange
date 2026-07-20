import { Shield, Zap, Globe, Wallet, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const features = [
  {
    icon: <Wallet size={24} className="text-indigo-400" />,
    title: 'Embedded Wallets',
    description: 'Auto-created non-custodial wallet on signup. No seed phrases to manage.',
    color: 'from-indigo-500/20 to-indigo-600/5',
  },
  {
    icon: <Zap size={24} className="text-yellow-400" />,
    title: 'Lightning Fast',
    description: 'Trades settle in under 5 minutes. No bank delays or manual approvals.',
    color: 'from-yellow-500/20 to-yellow-600/5',
  },
  {
    icon: <Shield size={24} className="text-emerald-400" />,
    title: 'Bank-Grade Security',
    description: 'Privy-powered auth with MFA. Your keys, your crypto. Always.',
    color: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    icon: <Globe size={24} className="text-blue-400" />,
    title: 'Multi-Asset Support',
    description: 'Trade BTC, ETH, USDT, BNB and more against INR.',
    color: 'from-blue-500/20 to-blue-600/5',
  },
  {
    icon: <TrendingUp size={24} className="text-purple-400" />,
    title: 'Best Rates Guaranteed',
    description: 'P2P marketplace ensures you always get competitive market rates.',
    color: 'from-purple-500/20 to-purple-600/5',
  },
  {
    icon: <Users size={24} className="text-pink-400" />,
    title: 'Earn with Referrals',
    description: 'Refer friends and earn ₹500 for every successful trade they complete.',
    color: 'from-pink-500/20 to-pink-600/5',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">Why P2Xchange</p>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Built for Serious Traders</h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">Everything you need to trade crypto safely and efficiently.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} glow className="group overflow-hidden">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
