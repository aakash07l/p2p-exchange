'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const pathname = usePathname();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    let active = true;
    const prepareAccount = async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Your sign-in session is not ready yet. Please retry.');
        const response = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'We could not prepare your account.');
        if (active) setStatus('ready');
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Unable to prepare your account.');
          setStatus('error');
        }
      }
    };
    void prepareAccount();
    return () => { active = false; };
  }, [attempt, authenticated, getAccessToken, pathname, ready, router]);

  if (status === 'ready' && authenticated) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6">
      {status === 'error' ? (
        <section className="w-full max-w-sm rounded-[26px] border border-[#dce8fa] bg-white p-8 text-center shadow-[0_12px_35px_rgba(14,89,208,.1)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><AlertCircle size={28}/></span>
          <h1 className="mt-5 text-xl font-bold text-[#172033]">Account setup needs attention</h1>
          <p className="mt-2 text-sm leading-6 text-[#606b7e]">{message}</p>
          <button onClick={() => setAttempt((value) => value + 1)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#125fe8] py-3.5 font-bold text-white"><RefreshCw size={17}/>Try again</button>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f2ff] text-[#125fe8]"><Loader2 className="animate-spin" size={28}/></span><p className="text-lg font-semibold text-[#25324a]">Preparing your FastX P2P account…</p></div>
      )}
    </main>
  );
}
