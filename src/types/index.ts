export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL' | 'REFERRAL_BONUS';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type OfferType = 'BUY' | 'SELL';

export interface User {
  id: string;
  privyId: string;
  email?: string;
  name?: string;
  avatar?: string;
  upiId?: string;
  phone?: string;
  theme: 'light' | 'dark';
  referralCode: string;
  referredBy?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  inrBalance: number;
  usdtBalance: number;
  btcBalance: number;
  ethBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  asset: string;
  amount: number;
  fee: number;
  networkFee: number;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  upiRef?: string;
  depositAddress?: string;
  externalRef?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  userId: string;
  type: OfferType;
  asset: string;
  amount: number;
  price: number;
  minLimit: number;
  maxLimit: number;
  paymentMethod: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'isVerified'>;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  reward: number;
  isPaid: boolean;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DepositRequest {
  userId: string;
  asset: string;
  amount: number;
  walletAddress: string;
}

export interface WithdrawRequest {
  userId: string;
  asset: string;
  amount: number;
  toAddress: string;
  upiId?: string;
}

export interface DepositAddressResponse {
  address: string;
  qrCode: string;
  expiresAt: string;
  minDeposit: number;
  network: string;
}

export interface WithdrawResponse {
  transactionId: string;
  status: TransactionStatus;
  estimatedTime: string;
  fee: number;
}
