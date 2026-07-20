import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FastX P2P — Buy & Sell USDC Instantly',
  description:
    'The fastest, most secure P2P crypto exchange. Buy and sell USDC with INR via UPI, powered by Privy wallets.',
  keywords: ['P2P exchange', 'crypto', 'USDC', 'INR', 'buy crypto', 'sell crypto', 'UPI'],
  openGraph: {
    title: 'FastX P2P',
    description: 'Buy & Sell USDC Instantly',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
