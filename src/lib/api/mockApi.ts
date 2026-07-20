/**
 * API Service Layer (Mock & Real)
 * ========================
 * External API calls.
 * USDT uses real on-chain Thirdweb SDK logic.
 * Other assets use mock logic for testing.
 */

import axios from 'axios';
import type {
  DepositRequest,
  WithdrawRequest,
  DepositAddressResponse,
  WithdrawResponse,
  Transaction,
  ApiResponse,
} from '@/types';
import { executeOnChainWithdrawal, verifyOnChainDeposit } from '../thirdweb/client';

const BASE_URL = process.env.MOCK_API_BASE_URL || 'https://api.placeholder.com/v1';
const API_KEY = process.env.MOCK_API_KEY || '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  timeout: 30000,
});

// ─── Deposit API ─────────────────────────────────────────────────────────────

/**
 * Generate a deposit address for the user.
 * Real API: POST /deposits/address
 * Returns: { address, qrCode, expiresAt, minDeposit, network }
 */
export async function generateDepositAddress(
  request: DepositRequest
): Promise<DepositAddressResponse> {
  // Real USDT Deposit Address (Platform Wallet)
  if (request.asset === 'USDT') {
    const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';
    return {
      address: platformAddress,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${platformAddress}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      minDeposit: 1,
      network: 'BSC (BEP-20)',
    };
  }

  // MOCK: Simulate API response for other assets
  await simulateDelay(800);
  return {
    address: `0x${generateMockHash(40)}`,
    qrCode: `data:image/png;base64,mock_qr_code_${request.asset}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    minDeposit: 10,
    network: getNetworkForAsset(request.asset),
  };
}

/**
 * Check deposit confirmation status.
 * Real API: GET /deposits/:transactionId/status
 * Returns: { status, confirmations, txHash }
 */
export async function checkDepositStatus(
  transactionId: string,
  txHash?: string // txHash needed for real on-chain verify
): Promise<{ status: string; confirmations: number; txHash?: string }> {
  // Real USDT on-chain verification
  if (txHash) {
    // In a real app, you would pass the expected amount and receiver here
    const result = await verifyOnChainDeposit(txHash, 0, process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || '');
    if (result.success) {
      return { status: 'COMPLETED', confirmations: 1, txHash };
    }
  }

  await simulateDelay(500);
  // MOCK: Randomly mark as completed after some time
  const mockStatuses = ['PENDING', 'PROCESSING', 'COMPLETED'];
  const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
  return {
    status: randomStatus,
    confirmations: Math.floor(Math.random() * 12),
    txHash: randomStatus === 'COMPLETED' ? `0x${generateMockHash(64)}` : undefined,
  };
}

// ─── Withdraw API ────────────────────────────────────────────────────────────

/**
 * Initiate a withdrawal request.
 * Real API: POST /withdrawals
 * Returns: { transactionId, status, estimatedTime, fee }
 */
export async function initiateWithdrawal(
  request: WithdrawRequest
): Promise<WithdrawResponse> {
  // Real USDT on-chain withdraw
  if (request.asset === 'USDT') {
    const result = await executeOnChainWithdrawal(request.toAddress, request.amount);
    return {
      transactionId: result.txHash || `WD_${generateMockHash(16)}`,
      status: result.success ? 'PROCESSING' : 'FAILED',
      estimatedTime: '1-5 minutes',
      fee: calculateWithdrawFee(request.asset, request.amount),
    };
  }

  await simulateDelay(1200);
  return {
    transactionId: `WD_${generateMockHash(16).toUpperCase()}`,
    status: 'PROCESSING',
    estimatedTime: '10-30 minutes',
    fee: calculateWithdrawFee(request.asset, request.amount),
  };
}

/**
 * Check withdrawal status.
 * Real API: GET /withdrawals/:transactionId/status
 */
export async function checkWithdrawalStatus(
  transactionId: string
): Promise<{ status: string; txHash?: string }> {
  await simulateDelay(400);
  return {
    status: 'PROCESSING',
    txHash: undefined,
  };

  // REAL API (uncomment when ready):
  // const { data } = await apiClient.get(`/withdrawals/${transactionId}/status`);
  // return data;
}

// ─── Price/Market API ────────────────────────────────────────────────────────

/**
 * Get current asset prices in INR.
 * Real API: GET /prices?assets=BTC,ETH,USDT
 */
export async function getAssetPrices(): Promise<Record<string, number>> {
  await simulateDelay(300);
  return {
    BTC: 6842000,
    ETH: 318000,
    USDT: 84.5,
    BNB: 48000,
  };

  // REAL API (uncomment when ready):
  // const { data } = await apiClient.get('/prices?assets=BTC,ETH,USDT,BNB');
  // return data;
}

// ─── KYC API ─────────────────────────────────────────────────────────────────

/**
 * Verify UPI ID with payment provider.
 * Real API: POST /kyc/upi/verify
 */
export async function verifyUpiId(upiId: string): Promise<{ isValid: boolean; name?: string }> {
  await simulateDelay(1000);
  return { isValid: true, name: 'Mock User Name' };

  // REAL API (uncomment when ready):
  // const { data } = await apiClient.post('/kyc/upi/verify', { upiId });
  // return data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockHash(length: number): string {
  const chars = '0123456789abcdef';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getNetworkForAsset(asset: string): string {
  const networks: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum (ERC-20)',
    USDT: 'Tron (TRC-20)',
    BNB: 'BNB Smart Chain (BEP-20)',
  };
  return networks[asset] || 'Ethereum';
}

function calculateWithdrawFee(asset: string, amount: number): number {
  const feeRates: Record<string, number> = {
    BTC: 0.0001,
    ETH: 0.002,
    USDT: 1,
    BNB: 0.001,
  };
  return feeRates[asset] || amount * 0.001;
}
