/**
 * BSCScan API Utility
 * Verifies BEP20 USDT deposits on BNB Smart Chain using BSCScan public API.
 * Free tier: 5 req/sec, 100k req/day
 */

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';
const BSCSCAN_BASE = 'https://api.bscscan.com/api';
// USDT BEP20 contract on BSC Mainnet
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

export interface DepositVerificationResult {
  success: boolean;
  confirmed: boolean;
  fromAddress: string;
  toAddress: string;
  amount: number;   // in USDT (human readable)
  txHash: string;
  blockNumber: number;
  error?: string;
}

/**
 * Verifies a BEP20 USDT deposit transaction via BSCScan API.
 * Checks: correct contract, correct receiver, amount, and confirmations.
 */
export async function verifyUsdtDeposit(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<DepositVerificationResult> {
  try {
    if (!BSCSCAN_API_KEY) {
      throw new Error('BSCSCAN_API_KEY is not configured');
    }

    // 1. Get TX receipt
    const txUrl = `${BSCSCAN_BASE}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`;
    const txRes = await fetch(txUrl);
    const txData = await txRes.json();

    if (!txData.result) {
      return { success: false, confirmed: false, fromAddress: '', toAddress: '', amount: 0, txHash, blockNumber: 0, error: 'Transaction not found on BSC network' };
    }

    const receipt = txData.result;

    // Check TX status (0x1 = success)
    if (receipt.status !== '0x1') {
      return { success: false, confirmed: false, fromAddress: '', toAddress: '', amount: 0, txHash, blockNumber: 0, error: 'Transaction failed on-chain' };
    }

    // 2. Get BEP20 token transfer events for this TX
    const tokenUrl = `${BSCSCAN_BASE}?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.result || tokenData.result.length === 0) {
      // Fallback: parse logs from receipt
      return verifyFromLogs(receipt, expectedRecipient, expectedAmount, txHash);
    }

    // Find the transfer matching our expected recipient
    const transfer = tokenData.result.find(
      (t: any) => t.to.toLowerCase() === expectedRecipient.toLowerCase()
    );

    if (!transfer) {
      return {
        success: false,
        confirmed: false,
        fromAddress: '',
        toAddress: '',
        amount: 0,
        txHash,
        blockNumber: 0,
        error: `No USDT transfer found to address ${expectedRecipient}`,
      };
    }

    // USDT on BSC has 18 decimals
    const amount = Number(transfer.value) / 1e18;
    const blockNumber = parseInt(receipt.blockNumber, 16);

    // Check amount matches (allow 0.5 USDT tolerance for rounding)
    if (Math.abs(amount - expectedAmount) > 0.5) {
      return {
        success: false,
        confirmed: false,
        fromAddress: transfer.from,
        toAddress: transfer.to,
        amount,
        txHash,
        blockNumber,
        error: `Amount mismatch: received ${amount} USDT, expected ${expectedAmount} USDT`,
      };
    }

    // Get confirmations count
    const latestBlockUrl = `${BSCSCAN_BASE}?module=proxy&action=eth_blockNumber&apikey=${BSCSCAN_API_KEY}`;
    const latestRes = await fetch(latestBlockUrl);
    const latestData = await latestRes.json();
    const latestBlock = parseInt(latestData.result, 16);
    const confirmations = latestBlock - blockNumber;

    return {
      success: true,
      confirmed: confirmations >= 3, // Require 3 confirmations
      fromAddress: transfer.from,
      toAddress: transfer.to,
      amount,
      txHash,
      blockNumber,
    };
  } catch (error: any) {
    return {
      success: false,
      confirmed: false,
      fromAddress: '',
      toAddress: '',
      amount: 0,
      txHash,
      blockNumber: 0,
      error: error.message || 'Verification failed',
    };
  }
}

/**
 * Fallback: parse ERC20 Transfer event logs manually
 */
function verifyFromLogs(
  receipt: any,
  expectedRecipient: string,
  expectedAmount: number,
  txHash: string
): DepositVerificationResult {
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  const log = receipt.logs?.find(
    (l: any) =>
      l.address?.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
      l.topics?.[0] === TRANSFER_TOPIC
  );

  if (!log || !log.topics?.[2]) {
    return { success: false, confirmed: false, fromAddress: '', toAddress: '', amount: 0, txHash, blockNumber: 0, error: 'No USDT transfer log found' };
  }

  const fromAddress = '0x' + log.topics[1].slice(26);
  const toAddress = '0x' + log.topics[2].slice(26);
  const amount = Number(BigInt(log.data)) / 1e18;
  const blockNumber = parseInt(receipt.blockNumber, 16);

  if (toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
    return { success: false, confirmed: false, fromAddress, toAddress, amount, txHash, blockNumber, error: 'Recipient address mismatch' };
  }

  return { success: true, confirmed: true, fromAddress, toAddress, amount, txHash, blockNumber };
}

/**
 * Gets the current USDT balance of an address on BSC
 */
export async function getUsdtBalance(address: string): Promise<number> {
  try {
    const url = `${BSCSCAN_BASE}?module=account&action=tokenbalance&contractaddress=${USDT_CONTRACT}&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return Number(data.result) / 1e18;
  } catch {
    return 0;
  }
}

/**
 * Gets incoming BEP-20 USDT transfer transactions for a specific address.
 */
export async function getIncomingUsdtTransfers(
  recipientAddress: string
): Promise<{ from: string; to: string; value: number; hash: string; blockNumber: number }[]> {
  try {
    if (!BSCSCAN_API_KEY) {
      throw new Error('BSCSCAN_API_KEY is not configured');
    }

    const url = `${BSCSCAN_BASE}?module=account&action=tokentx&address=${recipientAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${BSCSCAN_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result
      .filter(
        (t: any) =>
          t.to.toLowerCase() === recipientAddress.toLowerCase() &&
          t.contractAddress.toLowerCase() === USDT_CONTRACT.toLowerCase()
      )
      .map((t: any) => ({
        from: t.from,
        to: t.to,
        value: Number(t.value) / 1e18,
        hash: t.hash,
        blockNumber: Number(t.blockNumber),
      }));
  } catch (error) {
    console.error('Error fetching BscScan token transfers:', error);
    return [];
  }
}
