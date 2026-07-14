'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, parseUnits } from 'viem';
import { Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, userApi } from '@/lib/api/services';
import { useAppSelector } from '@/lib/store/hooks';
import { IPaymentConfig } from '@/types/paymentConfig';
import { getEffectiveWeb3Config, getErc20AbiFromConfig, getNativeSymbol } from '@/lib/utils/web3Helpers';
import { getErrorMessage } from '@/lib/utils/error';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

interface DepositAddressDepositProps {
    paymentMethods: IPaymentConfig;
    availableBalance: number;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Deposit Address (deposit to address method).
 * Shows the configured deposit address + QR code.
 * User scans / copies the address, sends tokens externally,
 * then submits the transaction hash for backend verification.
 * No wallet connection required.
 *
 * Flow:
 *  1. User sees address → sends tokens from any wallet
 *  2. User pastes tx hash + amount → submits for backend to verify on-chain
 *  3. Backend derives sender from tx hash and credits wallet balance
 */
export function DepositAddressDeposit({
    paymentMethods,
    availableBalance,
    onSuccess,
    onCancel,
}: DepositAddressDepositProps) {
    const { address, isConnected } = useAccount();
    const connectedChainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [amount, setAmount] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [entryMode, setEntryMode] = useState<'connected' | 'manual'>('connected');
    const [submitting, setSubmitting] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [copied, setCopied] = useState(false);
    const reduxPrimaryWallet = useAppSelector((state) => state.auth.user?.walletAddress?.trim());
    const [profileWallet, setProfileWallet] = useState<string | undefined | 'pending'>('pending');

    const web3Config = getEffectiveWeb3Config(paymentMethods, 'deposit') ?? paymentMethods?.web3;
    const erc20Abi = getErc20AbiFromConfig(web3Config);
    const depositAddressConfig = paymentMethods?.deposit?.depositAddress;
    const depositAddress = depositAddressConfig?.details?.address ?? '';
    const chainId = web3Config?.chainId;
    const blockExplorerUrl = web3Config?.blockExplorerUrl;
    const nativeSymbol = getNativeSymbol(chainId);
    const tokenAddress = web3Config?.tokenAddress ?? '';
    const primaryWallet =
        (profileWallet !== 'pending' ? profileWallet ?? reduxPrimaryWallet : reduxPrimaryWallet) || undefined;

    useEffect(() => {
        let cancelled = false;
        userApi
            .getProfile()
            .then((profile) => {
                if (!cancelled) setProfileWallet(profile?.walletAddress?.trim() || undefined);
            })
            .catch(() => {
                if (!cancelled) setProfileWallet(undefined);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const copyAddress = () => {
        if (!depositAddress) return;
        navigator.clipboard.writeText(depositAddress);
        setCopied(true);
        toast.success('Address copied');
        setTimeout(() => setCopied(false), 1500);
    };

    const createDepositFromTx = async (txHash: string) => {
        await paymentApi.createWeb3Deposit({
            method: 'web3',
            amount: parseFloat(amount),
            web3Details: {
                transactionHash: txHash,
                walletAddress: address ?? '',
                network: (web3Config?.network as 'localhost' | 'testnet' | 'mainnet') ?? 'testnet',
                chainId: chainId ?? 97,
                status: 'pending',
            },
        });
    };

    const validateBaseDepositInput = () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return false;
        }
        if (!primaryWallet) {
            toast.error('Set your primary wallet address in Profile before submitting a deposit.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (entryMode === 'connected') {
            await handleConnectedTransfer();
            return;
        }
        if (!validateBaseDepositInput()) return;
        if (!transactionHash || !/^0x[a-fA-F0-9]{64}$/.test(transactionHash.trim())) {
            toast.error('Please enter a valid transaction hash (0x...)');
            return;
        }
        setSubmitting(true);
        try {
            await createDepositFromTx(transactionHash.trim());
            toast.success('Deposit submitted. Backend will verify the transaction and credit your wallet shortly.');
            onSuccess();
        } catch (err: unknown) {
            const msg = getErrorMessage(err, 'Failed to submit deposit');
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConnectedTransfer = async () => {
        if (!validateBaseDepositInput()) return;
        if (!isConnected || !address) {
            toast.error('Connect your wallet first');
            return;
        }
        if (!walletClient || !publicClient) {
            toast.error('Wallet client not available. Please reconnect your wallet.');
            return;
        }
        if (!depositAddress || !/^0x[a-fA-F0-9]{40}$/.test(depositAddress)) {
            toast.error('Deposit wallet address is not configured correctly.');
            return;
        }
        if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
            toast.error('Token address is not configured correctly.');
            return;
        }
        if (!erc20Abi) {
            toast.error('Token ABI is missing. Please contact support.');
            return;
        }
        if (chainId && connectedChainId !== chainId) {
            toast.error(`Please switch your wallet to chain ID ${chainId}.`);
            return;
        }

        setTransferring(true);
        try {
            const decimalsRaw = await publicClient
                .readContract({
                    address: tokenAddress as Address,
                    abi: erc20Abi,
                    functionName: 'decimals',
                })
                .catch(() => 18);
            const decimals = typeof decimalsRaw === 'number' ? decimalsRaw : Number(decimalsRaw);
            const amountUnits = parseUnits(amount, Number.isFinite(decimals) ? decimals : 18);
            const hash = await walletClient.writeContract({
                address: tokenAddress as Address,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [depositAddress as Address, amountUnits],
                account: address as Address,
            });
            toast.success('Transfer submitted. Waiting for confirmation...');

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt?.status !== 'success') {
                toast.error('Transfer failed on-chain');
                return;
            }

            await createDepositFromTx(receipt.transactionHash);
            toast.success('Transfer confirmed and submitted for verification.');
            onSuccess();
        } catch (err: unknown) {
            const msg = getErrorMessage(err, 'Transfer failed');
            if (msg.toLowerCase().includes('reject')) {
                toast.error('Transaction rejected');
            } else {
                toast.error(msg);
            }
        } finally {
            setTransferring(false);
        }
    };

    if (!depositAddress || !web3Config?.chainId) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">Deposit address is not configured.</p>
            </div>
        );
    }

    if (profileWallet === 'pending' && !reduxPrimaryWallet) {
        return (
            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300">Loading primary wallet…</p>
            </div>
        );
    }

    if (!primaryWallet) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Primary wallet required</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Set your primary wallet before submitting deposits. You can still send the deposit from any wallet after primary is set.
                    </p>
                    <Link
                        href="/profile"
                        className="inline-block mt-3 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
                    >
                        Go to Profile
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(depositAddress)}`;

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Send tokens to the configured deposit wallet. You can transfer from a connected wallet or paste a transaction hash after sending manually.
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 dark:bg-white/5 p-1">
                <button
                    type="button"
                    onClick={() => setEntryMode('connected')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${entryMode === 'connected'
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Connected wallet
                </button>
                <button
                    type="button"
                    onClick={() => setEntryMode('manual')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${entryMode === 'manual'
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Manual tx hash
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Deposit address with QR code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deposit Address</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex shrink-0 items-center justify-center p-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10">
                            <img src={qrCodeUrl} alt="Deposit address QR code" className="w-[150px] h-[150px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                <code className="flex-1 text-xs sm:text-sm font-mono truncate text-gray-900 dark:text-white">{depositAddress}</code>
                                <button
                                    type="button"
                                    onClick={copyAddress}
                                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Send tokens to this address on chain ID {chainId} ({nativeSymbol}).
                            </p>
                            {blockExplorerUrl && (
                                <a
                                    href={`${blockExplorerUrl.replace(/\/+$/, '')}/address/${depositAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                                >
                                    View on explorer <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ This sends tokens directly to the configured wallet address, not to the smart contract. Contract liquidity for withdrawals must be managed separately.
                    </p>
                </div>

                {/* Amount */}
                <div>
                    <label htmlFor="deposit-address-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount sent
                    </label>
                    <input
                        id="deposit-address-amount"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the amount you sent (for verification)</p>
                </div>

                {entryMode === 'manual' ? (
                    <div>
                        <label htmlFor="deposit-address-txhash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Transaction hash
                        </label>
                        <input
                            id="deposit-address-txhash"
                            type="text"
                            value={transactionHash}
                            onChange={(e) => setTransactionHash(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required={entryMode === 'manual'}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paste the tx hash after sending tokens</p>
                        {blockExplorerUrl && transactionHash && /^0x[a-fA-F0-9]{64}$/.test(transactionHash.trim()) && (
                            <a
                                href={`${blockExplorerUrl.replace(/\/+$/, '')}/tx/${transactionHash.trim()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                            >
                                View transaction <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {!isConnected ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300">Connect your wallet to transfer directly:</p>
                                <ConnectWalletButton fullWidth />
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Connected wallet</p>
                                <p className="text-xs font-mono text-gray-900 dark:text-white break-all">{address}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type={entryMode === 'manual' ? 'submit' : 'button'}
                        onClick={entryMode === 'connected' ? handleConnectedTransfer : undefined}
                        disabled={
                            submitting ||
                            transferring ||
                            !amount ||
                            parseFloat(amount) <= 0 ||
                            (entryMode === 'manual' && !transactionHash)
                        }
                        className="flex-1 px-4 py-2.5 text-sm sm:text-base rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {transferring ? 'Transferring...' : submitting ? 'Submitting...' : entryMode === 'connected' ? 'Transfer now' : 'Submit for verification'}
                    </button>
                </div>
            </form>
        </div>
    );
}
