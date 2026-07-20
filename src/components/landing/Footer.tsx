import Link from 'next/link';
import { Zap, MessageSquare, ExternalLink, Send } from 'lucide-react';

export function Footer() {
  return (
    <footer id="help" className="border-t border-white/[0.06] py-12 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl text-white">P2X<span className="text-indigo-400">change</span></span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              India&apos;s fastest decentralized P2P crypto exchange. Secure, transparent, and built for everyone.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[MessageSquare, ExternalLink, Send].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white/80 text-sm mb-4">Product</h4>
            <ul className="space-y-2">
              {['Buy Crypto', 'Sell Crypto', 'P2P Offers', 'Referrals', 'Wallet'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-white/80 text-sm mb-4">Help & Legal</h4>
            <ul className="space-y-2">
              {['Support Center', 'Privacy Policy', 'Terms of Service', 'API Docs', 'Status'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">© 2025 P2Xchange. All rights reserved.</p>
          <p className="text-xs text-white/20">Secured by Privy · Powered by Thirdweb</p>
        </div>
      </div>
    </footer>
  );
}
