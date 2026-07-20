import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, getRpcClient, eth_getTransactionReceipt } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { privateKeyToAccount } from 'thirdweb/wallets';

// USDT BEP-20 Contract on BSC (BNB Smart Chain)
export const USDT_BSC_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export const bscChain = defineChain(56); // BSC Mainnet

const thirdwebClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

// A harmless build-time id keeps route collection from crashing on Vercel.
// All operations that broadcast a transaction validate the real setting first.
export const thirdwebClient = createThirdwebClient({
  clientId: thirdwebClientId || 'fastx-p2p-build-placeholder',
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

function assertThirdwebConfigured() {
  if (!thirdwebClientId) {
    throw new Error('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not configured. Add it in your Vercel project settings before using on-chain transfers.');
  }
}

export const usdtContract = getContract({
  client: thirdwebClient,
  chain: bscChain,
  address: USDT_BSC_CONTRACT_ADDRESS,
});

export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
} as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

/**
 * Verifies a BEP-20 USDT deposit on BNB Smart Chain.
 * Checks if the tx was successful, targets the USDT contract,
 * matches the expected receiver and amount.
 */
export async function verifyOnChainDeposit(
  txHash: string,
  expectedAmount: number,
  expectedReceiver: string
): Promise<{ success: boolean; amountTransferred: number; fromAddress: string }> {
  try {
    assertThirdwebConfigured();
    const rpcRequest = getRpcClient({ client: thirdwebClient, chain: bscChain });
    const receipt = await eth_getTransactionReceipt(rpcRequest, { hash: txHash as `0x${string}` });

    if (receipt.status !== "success") {
      throw new Error("Transaction failed on-chain");
    }

    // ERC-20 Transfer Topic: Transfer(address indexed from, address indexed to, uint256 value)
    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    
    const usdtLog = receipt.logs.find(
      (log: any) =>
        log.address.toLowerCase() === USDT_BSC_CONTRACT_ADDRESS.toLowerCase() &&
        log.topics[0] === transferTopic
    );

    if (!usdtLog || !usdtLog.topics) {
      throw new Error("No USDT Transfer log found in this transaction");
    }

    // Parse topics (addresses are padded to 32 bytes)
    const topic1 = usdtLog.topics[1];
    const topic2 = usdtLog.topics[2];

    if (!topic1 || !topic2) {
      throw new Error("USDT Transfer log is missing from/to address topics");
    }

    const fromAddress = "0x" + topic1.slice(26);
    const toAddress = "0x" + topic2.slice(26);
    
    // Parse value (BEP-20 USDT on BSC uses 18 decimals)
    const rawValue = BigInt(usdtLog.data);
    const amountTransferred = Number(rawValue) / 1e18;

    const receiverMatches = toAddress.toLowerCase() === expectedReceiver.toLowerCase();
    const amountMatches = Math.abs(amountTransferred - expectedAmount) < 0.01;

    if (!receiverMatches) {
      throw new Error(`Receiver mismatch. Found: ${toAddress}, expected: ${expectedReceiver}`);
    }

    if (!amountMatches) {
      throw new Error(`Amount mismatch. Found: ${amountTransferred}, expected: ${expectedAmount}`);
    }

    return {
      success: true,
      amountTransferred,
      fromAddress,
    };
  } catch (error: any) {
    console.error("On-chain verification error:", error.message || error);
    return { success: false, amountTransferred: 0, fromAddress: "" };
  }
}

/**
 * Automates BEP-20 USDT withdrawal by sending tokens from the platform's
 * hot wallet (defined by private key) to the user's wallet address.
 */
export async function executeOnChainWithdrawal(
  toAddress: string,
  amount: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    assertThirdwebConfigured();
    const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("BACKEND_WALLET_PRIVATE_KEY is not set in environment variables");
    }

    const account = privateKeyToAccount({
      client: thirdwebClient,
      privateKey,
    });

    // Convert amount to 18 decimals (Wei)
    const amountInWei = BigInt(Math.floor(amount * 1e18));

    const transaction = prepareContractCall({
      contract: usdtContract,
      method: "function transfer(address to, uint256 value) returns (bool)",
      params: [toAddress, amountInWei],
    });

    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    return {
      success: true,
      txHash: transactionHash,
    };
  } catch (error: any) {
    console.error("Withdrawal Execution Error:", error.message || error);
    return {
      success: false,
      error: error.message || "On-chain transaction execution failed",
    };
  }
}
