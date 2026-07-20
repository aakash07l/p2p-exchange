'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';

export function useUser() {
  const { user: privyUser, authenticated, ready, getAccessToken } = usePrivy();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!privyUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/users/me', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      setDbUser(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, privyUser?.id]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!privyUser?.id) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const data = await res.json();
      setDbUser(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, privyUser?.id]);

  useEffect(() => {
    if (authenticated && privyUser) {
      fetchUser();
    }
  }, [authenticated, privyUser, fetchUser]);

  return {
    user: dbUser,
    privyUser,
    authenticated,
    ready,
    loading,
    error,
    fetchUser,
    updateUser,
  };
}
