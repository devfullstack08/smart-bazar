import { useState } from 'react';
import { Address, PublicClient, WalletClient, parseEther } from 'viem';
import Web3ContractHelper from '@/lib/utils/web3Contract';
import { walletApi } from '@/lib/api/services';

const PENDING_KEY_PREFIX = 'mlm_wd_pending_';
const PENDING_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function useWeb3Withdrawal(projectId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractHelper = new Web3ContractHelper(projectId);

  /**
   * Returns any unexpired pending withdrawal stored in localStorage.
   * Use this in the UI to show "Withdrawal in progress" instead of the form.
   */
  const getPendingWithdrawal = () => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${PENDING_KEY_PREFIX}${projectId}`);
    if (!raw) return null;
    try {
      const pending = JSON.parse(raw) as { txHash: string; amount: number; walletAddress: string; submittedAt: number };
      if (Date.now() - pending.submittedAt < PENDING_EXPIRY_MS) return pending;
      localStorage.removeItem(`${PENDING_KEY_PREFIX}${projectId}`);
    } catch {
      localStorage.removeItem(`${PENDING_KEY_PREFIX}${projectId}`);
    }
    return null;
  };

  /** Manually clear the pending lock (call after confirmed or failed). */
  const clearPendingWithdrawal = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${PENDING_KEY_PREFIX}${projectId}`);
    }
  };

  const withdraw = async (
    amount: string,
    toAddress: Address,
    publicClient: PublicClient,
    walletClient: WalletClient
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Guard: prevent double-submission on page refresh
      const pending = getPendingWithdrawal();
      if (pending) {
        throw new Error(
          `A withdrawal is already in progress (tx: ${pending.txHash.slice(0, 10)}...). ` +
          `Please wait for it to confirm or contact support if it has been more than 30 minutes.`
        );
      }

      // 1. Validate amount against limits
      const withdrawalConfig = await contractHelper.getWithdrawalConfig();

      const amountNum = parseFloat(amount);

      if (withdrawalConfig.minAmount > 0 && amountNum < withdrawalConfig.minAmount) {
        throw new Error(`Minimum withdrawal amount is ${withdrawalConfig.minAmount}`);
      }

      if (withdrawalConfig.maxAmount > 0 && amountNum > withdrawalConfig.maxAmount) {
        throw new Error(`Maximum withdrawal amount is ${withdrawalConfig.maxAmount}`);
      }

      // 2. Get user address
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account connected');
      }

      const contractAddress = (await contractHelper.getWithdrawalContractAddress()) as Address;
      const abi = await contractHelper.getContractABI(contractAddress);

      if (!abi) {
        throw new Error('Contract ABI not found');
      }

      const amountInWei = parseEther(amount);

      // Simulate first to catch revert errors before sending
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: 'withdraw',
        args: [amountInWei],
        account,
      });

      const hash = await walletClient.writeContract(request as any);

      // ─── IMMEDIATELY after tx is submitted to chain ───────────────────
      // 1. Lock to prevent double-submission on refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `${PENDING_KEY_PREFIX}${projectId}`,
          JSON.stringify({ txHash: hash, amount: amountNum, walletAddress: account, submittedAt: Date.now() })
        );
      }

      // 2. Register with backend right away — cron will confirm even if we close
      try {
        await walletApi.withdrawSelf({
          transactionHash: hash,
          amount: amountNum,
          walletAddress: account,
        });
      } catch {
        // Non-fatal: backend cron will pick it up via Web3WithdrawalVerificationService
      }
      // ─────────────────────────────────────────────────────────────────

      // 3. Wait for on-chain confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        // Transaction reverted — clear the pending lock
        clearPendingWithdrawal();
        throw new Error('Withdrawal transaction failed on-chain');
      }

      // 4. Confirmed — clear the pending lock
      clearPendingWithdrawal();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Withdrawal failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { withdraw, loading, error, getPendingWithdrawal, clearPendingWithdrawal };
}
