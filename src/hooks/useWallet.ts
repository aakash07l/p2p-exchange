'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useCallback } from 'react';
import type { Wallet } from '@/types';

export function useWallet() {
  const { authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [dbWallet, setDbWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
  const externalWallet = wallets.find((w) => w.walletClientType !== 'privy');
  const activeWallet = embeddedWallet || externalWallet || null;

  const fetchWallet = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (res.ok) {
        const data = await res.json();
        setDbWallet(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [authenticated, getAccessToken]);

  const deposit = useCallback(async (asset: string, amount: number) => {
    const token = await getAccessToken();
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ asset, amount, walletAddress: activeWallet?.address }),
    });
    return res.json();
  }, [activeWallet, getAccessToken]);

  const withdraw = useCallback(async (asset: string, amount: number, toAddress: string, upiId?: string) => {
    const token = await getAccessToken();
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ asset, amount, toAddress, upiId }),
    });
    return res.json();
  }, [getAccessToken]);

  return {
    activeWallet,
    embeddedWallet,
    externalWallet,
    wallets,
    dbWallet,
    loading,
    fetchWallet,
    deposit,
    withdraw,
  };
}
