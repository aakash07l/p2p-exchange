'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { authenticated, login, logout } = usePrivy();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white">P2X<span className="text-indigo-400">change</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</Link>
            <Link href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</Link>
            <Link href="#help" className="text-sm text-white/60 hover:text-white transition-colors">Help</Link>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {authenticated ? (
              <>
                <Link href="/dashboard">
                  <Button size="md">Go to Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Button variant="ghost" size="md" onClick={() => login()}>Login</Button>
                <Button size="md" onClick={() => login()}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0f] px-4 py-4 space-y-3">
          <Link href="#features" className="block text-sm text-white/60 hover:text-white py-2 transition-colors" onClick={() => setIsOpen(false)}>Features</Link>
          <Link href="#faq" className="block text-sm text-white/60 hover:text-white py-2 transition-colors" onClick={() => setIsOpen(false)}>FAQ</Link>
          <Link href="#help" className="block text-sm text-white/60 hover:text-white py-2 transition-colors" onClick={() => setIsOpen(false)}>Help</Link>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {authenticated ? (
              <Link href="/dashboard"><Button size="md" className="w-full">Go to Dashboard</Button></Link>
            ) : (
              <>
                <Button variant="outline" size="md" className="w-full" onClick={() => { login(); setIsOpen(false); }}>Login</Button>
                <Button size="md" className="w-full" onClick={() => { login(); setIsOpen(false); }}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
