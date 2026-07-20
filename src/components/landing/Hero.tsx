'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const { login, authenticated } = usePrivy();

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot" />
            Live trading available — Join 50,000+ traders
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            The Fastest
            <span className="block gradient-text">P2P Crypto Exchange</span>
            in India
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Buy and sell Bitcoin, USDT, ETH directly with INR. Zero hidden fees, instant settlements, secured by blockchain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {authenticated ? (
              <Link href="/dashboard">
                <Button size="xl" rightIcon={<ArrowRight size={20} />}>
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button size="xl" rightIcon={<ArrowRight size={20} />} onClick={() => login()}>
                  Start Trading Free
                </Button>
                <Button size="xl" variant="outline" onClick={() => login()}>
                  View Live Offers
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-xl mx-auto">
            {[
              { label: 'Active Traders', value: '50K+' },
              { label: 'Volume (INR)', value: '₹2B+' },
              { label: 'Avg. Trade Time', value: '<5 min' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-16">
          {[
            { icon: <Shield size={14} />, label: 'Non-custodial wallet' },
            { icon: <Zap size={14} />, label: 'Instant KYC-free' },
            { icon: <TrendingUp size={14} />, label: 'Best market rates' },
          ].map((pill) => (
            <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm">
              {pill.icon}
              {pill.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
