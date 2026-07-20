'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Menu, Bell, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useUser } from '@/hooks/useUser';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm">
      {/* Left: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <Menu size={19} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">Welcome back,</p>
          <p className="text-sm font-semibold text-gray-900">{user?.name || 'Trader'}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <User size={13} className="text-white" />
            )}
          </div>
          <span className="hidden sm:block text-xs font-medium text-gray-700">
            {user?.email?.split('@')[0] || 'Profile'}
          </span>
        </button>
      </div>
    </header>
  );
}
