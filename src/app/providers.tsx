'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ThirdwebProvider } from 'thirdweb/react';
import { ThemeProvider } from 'next-themes';
import { privyConfig } from '@/lib/privy/config';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <PrivyProvider appId={appId} config={privyConfig}>
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
