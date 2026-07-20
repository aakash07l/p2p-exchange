'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowLeft, ArrowRight, Bell, CircleHelp, Coins, 
  Headphones, Menu, ReceiptText, Settings, SlidersHorizontal, WalletCards,
  LogOut, ScanLine, ChevronRight,
} from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/buy':          'Buy USDC',
  '/sell':         'Sell USDC',
  '/wallet':       'Wallet',
  '/transactions': 'Transactions',
  '/referrals':    'Refer & Earn',
  '/help':         'Help & Support',
  '/settings':     'Settings',
};

const MENU_ITEMS = [
  { href: '/transactions', label: 'Transactions',     icon: ReceiptText },
  { href: '/referrals',    label: 'Refer & Earn',     icon: Coins },
  { href: '/help',         label: 'Help & Support',   icon: Headphones },
  { href: '/settings',     label: 'Settings',         icon: Settings },
];

function Logo() {
  return (
    <span className="flex items-center gap-2 text-[22px] leading-none font-extrabold tracking-[-0.05em] text-[#16151b]">
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#4744ed] to-[#7557ff] text-white shadow-[0_3px_8px_rgba(71,68,237,.3)]">
        <ScanLine size={16} strokeWidth={2.5} />
      </span>
      FASTX <span className="text-[#4744ed]">P2P</span>
    </span>
  );
}

/* ── Dashboard top header ── */
function DashboardHeader({ onMenu }: { onMenu: () => void }) {
  const { user } = usePrivy();
  const initials = (user?.email?.address || user?.google?.name || 'U')[0].toUpperCase();
  return (
    <header className="app-header">
      <button onClick={onMenu} aria-label="Open menu" className="icon-button">
        <Menu size={20} />
      </button>
      <Link href="/dashboard" aria-label="FastX P2P home"><Logo /></Link>
      <div className="flex items-center gap-2">
        <button aria-label="Notifications" className="icon-button relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#4744ed] ring-2 ring-white" />
        </button>
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px] border border-[#e8e5ed] bg-[#f0edff] text-[15px] font-bold text-[#4744ed]">
          {initials}
        </div>
      </div>
    </header>
  );
}

/* ── Sub-page header (back + title + help) ── */
function PageHeader({ title }: { title: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header className="app-header">
      <button onClick={handleBack} aria-label="Go back" className="icon-button">
        <ArrowLeft size={20} />
      </button>
      <h1 className="ml-3 text-[20px] font-bold tracking-[-0.04em] text-[#17161c]">{title}</h1>
      <Link href="/help" aria-label="Help" className="icon-button ml-auto">
        <CircleHelp size={20} />
      </Link>
    </header>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = usePrivy();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = pathname === '/dashboard';
  const title = Object.entries(PAGE_TITLES).find(([href]) => pathname.startsWith(href))?.[1] || 'FastX P2P';
  const name = user?.email?.address?.split('@')[0] || user?.google?.name || 'FastX Member';

  return (
    <>
      {isDashboard
        ? <DashboardHeader onMenu={() => setMenuOpen(true)} />
        : <PageHeader title={title} />}

      {/* Drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[80]">
          {/* Backdrop */}
          <button
            className="absolute inset-0 w-full cursor-default bg-black/45"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute inset-y-0 left-0 flex w-[min(85vw,420px)] flex-col bg-white shadow-2xl animate-[drawerIn_.22s_ease-out]">
            {/* Drawer header */}
            <div className="flex h-[72px] items-center gap-3 border-b border-[#e8e6ed] px-5">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                className="ml-auto rounded-full p-2 text-[#4744ed] hover:bg-[#f2f0ff]"
                aria-label="Close menu"
              >
                <ArrowLeft size={26} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="px-5 pt-2 overflow-y-auto flex-1">
              {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="drawer-item"
                >
                  <Icon size={24} strokeWidth={1.8} className="text-[#4744ed] shrink-0" />
                  <span>{label}</span>
                  <ArrowRight className="ml-auto text-[#ccc8d8]" size={22} strokeWidth={1.8} />
                </Link>
              ))}
              <div className="drawer-item">
                <SlidersHorizontal size={24} strokeWidth={1.8} className="text-[#4744ed] shrink-0" />
                <span>Connection Status</span>
                <span className="ml-auto h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-[0_1px_4px_rgba(16,185,129,.7)]" />
              </div>
            </nav>

            {/* Drawer footer */}
            <div className="space-y-4 border-t border-[#e8e6ed] px-5 py-5">
              <Link
                href="/wallet"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 rounded-[20px] bg-[#f0edff] p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4744ed]">
                  <WalletCards size={20} />
                </span>
                <span className="font-semibold text-sm">
                  <strong className="block text-[#17161c]">FastX Wallet</strong>
                  <small className="font-normal text-[#55515e]">Send · Receive · Swap</small>
                </span>
                <ChevronRight className="ml-auto text-[#4744ed]" size={18} />
              </Link>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ebe9ed] text-xs font-bold text-[#55515e]">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <strong className="block truncate text-[#17161c]">Logged in as</strong>
                  <small className="block truncate text-[#686372]">{user?.email?.address || name}</small>
                </span>
                <button
                  onClick={() => logout()}
                  className="rounded-xl p-2 text-[#4744ed] hover:bg-[#f2f0ff]"
                  aria-label="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </div>

              <p className="text-center text-xs text-[#9592a0]">FastX P2P · Terms & Conditions</p>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom trade dock — only on dashboard */}
      {isDashboard && <TradeDock />}
    </>
  );
}

function TradeDock() {
  return (
    <div className="trade-dock">
      <Link href="/buy" className="dock-trade dock-buy">
        <WalletCards size={17} /> Buy USDT
      </Link>
      <Link href="/sell" className="dock-trade dock-sell">
        <WalletCards size={17} /> Sell USDT
      </Link>
    </div>
  );
}


