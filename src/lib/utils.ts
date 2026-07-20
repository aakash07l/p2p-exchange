import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCrypto(amount: number, asset: string): string {
  const decimals: Record<string, number> = { BTC: 8, ETH: 6, USDT: 2, BNB: 4 };
  return `${amount.toFixed(decimals[asset] || 4)} ${asset}`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400',
    PROCESSING: 'text-blue-400',
    COMPLETED: 'text-green-400',
    FAILED: 'text-red-400',
    CANCELLED: 'text-gray-400',
  };
  return colors[status] || 'text-gray-400';
}

export function generateReferralLink(code: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?ref=${code}`;
}
