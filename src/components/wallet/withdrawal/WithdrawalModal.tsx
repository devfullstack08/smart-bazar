'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { WalletData, WalletState } from '@/types';
import { IPaymentConfig } from '@/types/paymentConfig';
import { Modal } from '@/components/ui/Modal';
import { BankTransferWithdrawal } from './BankTransferWithdrawal';
import { UPIWithdrawal } from './UPIWithdrawal';
import { Web3Withdrawal } from './Web3Withdrawal';
import { WithdrawalRequestForm } from './WithdrawalRequestForm';
import { WalletAddressWithdrawal } from './WalletAddressWithdrawal';
import { walletApi } from '@/lib/api/services';
import { getEffectiveWeb3Config, isWeb3ConfigComplete } from '@/lib/utils/web3Helpers';
import { getErrorMessage } from '@/lib/utils/error';
import { TwoFactorVerificationModal } from '@/components/auth/TwoFactorVerificationModal';
import toast from 'react-hot-toast';
import { HelpCircle, Lock, RefreshCw } from 'lucide-react';
import { getMainWallet, getPurposeWallet, getWalletLabel } from '@/lib/wallets';
import { WithdrawalAllowanceHelpDialog } from './WithdrawalAllowanceHelpDialog';

type WithdrawalMethod = 'bank_transfer' | 'upi' | 'web3_contract' | 'withdrawal_request' | 'wallet_address';
type AllowanceDisplayStatus = 'synced' | 'needs_refresh' | 'unavailable';

const allowanceBadgeClass: Record<AllowanceDisplayStatus, string> = {
    synced: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    needs_refresh: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    unavailable: 'border-white/10 bg-white/5 text-text-muted',
};

const allowanceBadgeLabel: Record<AllowanceDisplayStatus, string> = {
    synced: 'Synced',
    needs_refresh: 'Needs refresh',
    unavailable: 'Unavailable',
};

function formatRelativeTime(value?: string | null): string {
    if (!value) return 'Never';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} day ago`;
}

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethods: IPaymentConfig | null;
    walletData: WalletState | WalletData | null;
    onSuccess: () => void;
}

export function WithdrawalModal({
    isOpen,
    onClose,
    paymentMethods,
    walletData,
    onSuccess,
}: WithdrawalModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);
    const [web3SubSelection, setWeb3SubSelection] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [pendingWithdrawalData, setPendingWithdrawalData] = useState<any>(null);
    const [allowanceStatus, setAllowanceStatus] = useState<{
        available: boolean;
        status: AllowanceDisplayStatus;
        withdrawalAllowanceHuman: string;
        lastRefreshedAt: string | null;
    } | null>(null);
    const [refreshingAllowance, setRefreshingAllowance] = useState(false);
    const [allowanceRefreshMessage, setAllowanceRefreshMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [allowanceCooldownUntil, setAllowanceCooldownUntil] = useState(0);
    const [allowanceCooldownSeconds, setAllowanceCooldownSeconds] = useState(0);
    const [showAllowanceHelp, setShowAllowanceHelp] = useState(false);

    const withdrawalWeb3Config = getEffectiveWeb3Config(paymentMethods, 'withdrawal');

    const hasBank = !!paymentMethods?.withdrawal.bankTransfer?.enabled;
    const hasUpi = !!paymentMethods?.withdrawal.upi?.enabled;

    const hasWeb3Contract = !!(paymentMethods?.withdrawal.web3?.enabled && isWeb3ConfigComplete(withdrawalWeb3Config));
    const hasWalletAddress = !!paymentMethods?.withdrawal.walletAddressWithdrawal?.enabled;
    const hasWithdrawalRequest = !!paymentMethods?.withdrawal.withdrawalRequest?.enabled;

    const hasFiatMethods = hasUpi || hasBank;
    const hasWeb3Methods = hasWeb3Contract || hasWalletAddress || hasWithdrawalRequest;

    const conversionSummary =
        paymentMethods?.withdrawal.web3?.conversionSummary ||
        paymentMethods?.withdrawal.walletAddressWithdrawal?.conversionSummary ||
        paymentMethods?.withdrawal.withdrawalRequest?.conversionSummary;

    useEffect(() => {
        if (isOpen) {
            setSelectedMethod(null);
            setWeb3SubSelection(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !selectedMethod || (selectedMethod !== 'wallet_address' && selectedMethod !== 'web3_contract')) return;
        walletApi.getWithdrawalAllowanceStatus()
            .then(setAllowanceStatus)
            .catch(() => setAllowanceStatus(null));
    }, [isOpen, selectedMethod]);

    useEffect(() => {
        if (allowanceCooldownUntil <= 0) {
            setAllowanceCooldownSeconds(0);
            return;
        }

        const updateCooldown = () => {
            const seconds = Math.max(0, Math.ceil((allowanceCooldownUntil - Date.now()) / 1000));
            setAllowanceCooldownSeconds(seconds);
            if (seconds <= 0) setAllowanceCooldownUntil(0);
        };

        updateCooldown();
        const interval = window.setInterval(updateCooldown, 1000);
        return () => window.clearInterval(interval);
    }, [allowanceCooldownUntil]);

    const handleClose = () => {
        setSelectedMethod(null);
        setWeb3SubSelection(false);
        setShow2FAModal(false);
        setPendingWithdrawalData(null);
        onClose();
    };

    const handleSelectWeb3Group = () => {
        const enabledWeb3Methods: WithdrawalMethod[] = [];
        if (hasWalletAddress) enabledWeb3Methods.push('wallet_address');
        if (hasWeb3Contract) enabledWeb3Methods.push('web3_contract');
        if (hasWithdrawalRequest) enabledWeb3Methods.push('withdrawal_request');

        if (enabledWeb3Methods.length > 1) {
            setWeb3SubSelection(true);
        } else if (enabledWeb3Methods.length === 1) {
            setSelectedMethod(enabledWeb3Methods[0]);
        }
    };

    const handleSubmit = async (data: {
        amount: number;
        bankAccount?: string;
        upiId?: string;
        walletAddress?: string;
        description?: string;
    }, twoFactorToken?: string) => {
        if (!selectedMethod) return;

        const method: 'bank_transfer' | 'upi' | 'web3' | 'withdrawal_request' | 'wallet_address' =
            selectedMethod === 'web3_contract' ? 'web3'
                : selectedMethod === 'withdrawal_request' ? 'withdrawal_request'
                    : selectedMethod === 'wallet_address' ? 'wallet_address'
                        : selectedMethod as 'bank_transfer' | 'upi';
        setSubmitting(true);
        try {
            await walletApi.withdraw({
                method,
                amount: data.amount,
                withdrawalDetails: {
                    bankAccount: data.bankAccount,
                    upiId: data.upiId,
                    walletAddress: data.walletAddress,
                },
                description: data.description,
                twoFactorToken,
            });
            toast.success(method === 'wallet_address'
                ? 'Withdrawal processed successfully!'
                : 'Withdrawal request submitted successfully!');
            handleClose();
            onSuccess();
        } catch (error: any) {
            const statusCode = error.response?.status;
            const codeString = error.response?.data?.error || error.response?.data?.message;
            if (statusCode === 403 && codeString === '2FA_SETUP_REQUIRED') {
                toast.error('Please enable 2FA in your Profile to make withdrawals.');
            } else if (statusCode === 403 && (codeString === '2FA_REQUIRED' || String(codeString).includes('2FA'))) {
                setPendingWithdrawalData(data);
                setShow2FAModal(true);
            } else {
                const message = getErrorMessage(error, 'Withdrawal failed');
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleWeb3Success = () => {
        handleClose();
        onSuccess();
    };

    const handleRefreshWithdrawalAllowance = async () => {
        if (allowanceCooldownSeconds > 0) {
            setAllowanceRefreshMessage({ type: 'info', text: `Please wait ${allowanceCooldownSeconds}s before refreshing again.` });
            return;
        }

        setRefreshingAllowance(true);
        setAllowanceRefreshMessage({ type: 'info', text: 'Refreshing withdrawal allowance...' });
        try {
            const result = await walletApi.refreshWithdrawalAllowance();
            setAllowanceCooldownUntil(new Date(result.nextRefreshAt).getTime());
            const status = await walletApi.getWithdrawalAllowanceStatus();
            setAllowanceStatus(status);
            setAllowanceRefreshMessage({
                type: result.sync.skipped ? 'info' : 'success',
                text: result.sync.skipped ? 'Withdrawal allowance already up to date.' : 'Withdrawal allowance refreshed.',
            });
        } catch (error: any) {
            const retryAfterSeconds = Number(error?.response?.data?.retryAfterSeconds || 0);
            if (error?.response?.status === 429 && retryAfterSeconds > 0) {
                setAllowanceCooldownUntil(Date.now() + retryAfterSeconds * 1000);
                setAllowanceRefreshMessage({ type: 'info', text: `Please wait ${retryAfterSeconds}s before refreshing again.` });
            } else {
                setAllowanceRefreshMessage({
                    type: 'error',
                    text: 'Withdrawal allowance refresh failed. Please try again later or contact admin support.',
                });
            }
        } finally {
            setRefreshingAllowance(false);
        }
    };

    if (!paymentMethods || !walletData) return null;

    const withdrawalWallet = getPurposeWallet(walletData, 'withdrawal')
        ?? getMainWallet(walletData)
        ?? walletData.wallet;
    const availableBalance = withdrawalWallet.availableBalance ?? withdrawalWallet.balance ?? 0;
    const totalBalance = withdrawalWallet.balance ?? availableBalance;
    const lockedAmount = Math.max(0, totalBalance - availableBalance);
    const withdrawalWalletName = getWalletLabel((withdrawalWallet as { walletTypeCode?: string }).walletTypeCode);
    const allowanceAmount = parseFloat(allowanceStatus?.withdrawalAllowanceHuman ?? '0') || 0;
    const allowanceDisplayStatus: AllowanceDisplayStatus = allowanceStatus?.status ?? 'unavailable';

    const getMethodLabel = (method: WithdrawalMethod) => {
        switch (method) {
            case 'bank_transfer':
                return 'Bank Transfer';
            case 'upi':
                return 'PayPal / UPI';
            case 'wallet_address':
                return 'Wallet Address Payout';
            case 'web3_contract':
                return 'Web3 Contract Withdrawal';
            case 'withdrawal_request':
                return 'Withdrawal Request';
        }
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request Withdrawal"
            size="md"
        >
            <div className="space-y-4">
                {/* Method Selection Step 1 */}
                {!selectedMethod ? (
                    <div className="space-y-5">
                        {web3SubSelection ? (
                            /* Sub-selection for Web3 channels */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                                            Crypto / Web3 Payout
                                        </span>
                                        <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">
                                            Choose Web3 Payout Method
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setWeb3SubSelection(false)}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        ← Back to Channels
                                    </button>
                                </div>

                                {conversionSummary && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-amber-400">⚡ Live Conversion Rate</span>
                                        <span className="font-bold text-amber-300 font-mono">
                                            1 USDT = ₹{conversionSummary.rate} INR
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3">
                                    {hasWalletAddress && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMethod('wallet_address')}
                                            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-indigo-500/50 text-left transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-black text-[var(--foreground)]">Direct Wallet Address Payout</p>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">Direct Payout</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--muted-foreground)]">Tokens are sent directly to your primary wallet address registered in your profile.</p>
                                        </button>
                                    )}

                                    {hasWeb3Contract && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMethod('web3_contract')}
                                            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-indigo-500/50 text-left transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-black text-[var(--foreground)]">Web3 Contract Self-Withdrawal</p>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">On-Chain</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--muted-foreground)]">Connect Web3 wallet and execute contract withdraw function on-chain.</p>
                                        </button>
                                    )}

                                    {hasWithdrawalRequest && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMethod('withdrawal_request')}
                                            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-indigo-500/50 text-left transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-black text-[var(--foreground)]">Web3 Manual Withdrawal Request</p>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">Admin Approval</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--muted-foreground)]">Submit a withdrawal request for admin review and approval.</p>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Primary Channel Selection View */
                            <div className="space-y-5">


                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Step 1</span>
                                    <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">Select Payout Channel</h4>
                                </div>

                                {/* Priority 1: Instant / Domestic Payout Channels (UPI & Bank) */}
                                {hasFiatMethods && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Instant / Domestic Channels (INR)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {hasUpi && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMethod('upi')}
                                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-primary/60 text-left transition-all group active:scale-[0.99]"
                                                >
                                                    <div className="w-3 h-3 rounded-full mb-2.5 border border-[var(--border)] bg-emerald-500 group-hover:scale-110 transition-transform" />
                                                    <p className="text-sm font-black text-[var(--foreground)]">PayPal / UPI</p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">Direct UPI, GPay, PhonePe, Paytm</p>
                                                </button>
                                            )}

                                            {hasBank && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMethod('bank_transfer')}
                                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-primary/60 text-left transition-all group active:scale-[0.99]"
                                                >
                                                    <div className="w-3 h-3 rounded-full mb-2.5 border border-[var(--border)] bg-blue-500 group-hover:scale-110 transition-transform" />
                                                    <p className="text-sm font-black text-[var(--foreground)]">Bank Transfer</p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">Direct IMPS / NEFT bank transfer</p>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Priority 2: Web3 & Crypto Options */}
                                {hasWeb3Methods && (
                                    <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                                Web3 & Crypto Options
                                            </p>
                                            {conversionSummary && (
                                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                                    1 USDT = ₹{conversionSummary.rate} INR
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSelectWeb3Group}
                                            className="w-full p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent hover:border-indigo-500/60 text-left transition-all group active:scale-[0.99]"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                        ⚡
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[var(--foreground)]">Web3 / Crypto Withdrawal (USDT)</p>
                                                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                                                            Withdraw to Web3 Wallet or Crypto Address
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                                    Select →
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {!hasFiatMethods && !hasWeb3Methods && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                        <p className="text-sm text-yellow-200">No withdrawal methods are currently enabled.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Step 2: Selected Method Form View */
                    <div className="space-y-4">
                        {/* Step 2 Header */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Step 2</span>
                                <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1.5">
                                    Method: <span className="text-[var(--foreground)]">{getMethodLabel(selectedMethod)}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedMethod(null)}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Change Method
                            </button>
                        </div>

                        {/* Top Card: Show Wallet Balance only for UPI/Bank Transfer, and Wallet + Web3 Allowance for Web3 methods */}
                        {selectedMethod === 'upi' || selectedMethod === 'bank_transfer' ? (
                            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Withdrawal Wallet Balance</p>
                                    <p className="text-2xl font-black text-[var(--foreground)] mt-0.5 font-mono">
                                        ₹{Math.max(0, availableBalance).toLocaleString()} <span className="text-xs font-normal text-[var(--muted-foreground)]">INR</span>
                                    </p>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--muted-foreground)] font-medium">
                                    {withdrawalWalletName}
                                </span>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-white/10 bg-white/5 glass-panel overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                    {/* Left: Withdrawal Wallet */}
                                    <div className="p-3.5 min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Withdrawal Wallet</p>
                                        <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{withdrawalWalletName}</p>
                                        <p className="mt-2 text-2xl font-bold leading-tight text-foreground font-mono">
                                            {Math.max(0, availableBalance).toLocaleString()} <span className="text-xs text-text-muted font-normal">INR</span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-text-muted">Available balance</p>
                                    </div>

                                    {/* Right: Withdrawal Allowance */}
                                    <div className="p-3.5 min-w-0">
                                        <div className="flex h-full flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted truncate">Withdrawal Allowance</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAllowanceHelp(true)}
                                                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                                                        title="What is withdrawal allowance?"
                                                    >
                                                        <HelpCircle className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${allowanceBadgeClass[allowanceDisplayStatus]}`}>
                                                    {allowanceBadgeLabel[allowanceDisplayStatus]}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={handleRefreshWithdrawalAllowance}
                                                    disabled={refreshingAllowance || allowanceCooldownSeconds > 0}
                                                    className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Refresh withdrawal allowance"
                                                >
                                                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingAllowance ? 'animate-spin' : ''}`} />
                                                    <span>
                                                        {refreshingAllowance
                                                            ? 'Refreshing'
                                                            : allowanceCooldownSeconds > 0
                                                                ? `${allowanceCooldownSeconds}s`
                                                                : 'Refresh'}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="min-w-0 pt-1">
                                                <p className="text-2xl font-bold leading-tight text-foreground font-mono">
                                                    {allowanceAmount.toFixed(6)} <span className="text-xs text-text-muted font-normal">USDT</span>
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-text-muted">Last refreshed: {formatRelativeTime(allowanceStatus?.lastRefreshedAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(lockedAmount > 0 || availableBalance <= 0 || allowanceRefreshMessage) && (
                                    <div className="border-t border-white/10 px-3.5 py-2.5 space-y-1 bg-white/[0.02]">
                                        {lockedAmount > 0 && (
                                            <div className="flex items-start gap-2">
                                                <Lock size={14} className="mt-0.5 text-amber-400 shrink-0" />
                                                <p className="text-xs text-amber-200">
                                                    {lockedAmount.toLocaleString()} is locked for pending withdrawal request(s).
                                                </p>
                                            </div>
                                        )}
                                        {availableBalance <= 0 && (
                                            <p className="text-xs text-red-400/80">
                                                No available balance in this withdrawal wallet.
                                            </p>
                                        )}
                                        {allowanceRefreshMessage && (
                                            <p
                                                className={`text-xs ${
                                                    allowanceRefreshMessage.type === 'success'
                                                        ? 'text-emerald-300'
                                                        : allowanceRefreshMessage.type === 'error'
                                                            ? 'text-red-300'
                                                            : 'text-text-muted'
                                                }`}
                                            >
                                                {allowanceRefreshMessage.text}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Render method-specific form */}
                        {selectedMethod === 'wallet_address' ? (
                            <WalletAddressWithdrawal
                                paymentMethods={paymentMethods}
                                onSubmit={async (data) =>
                                    await handleSubmit({
                                        amount: data.amount,
                                        walletAddress: data.walletAddress,
                                        description: data.description,
                                    })
                                }
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                                withdrawalAllowance={allowanceAmount}
                            />
                        ) : selectedMethod === 'web3_contract' ? (
                            isWeb3ConfigComplete(withdrawalWeb3Config) ? (
                                <Web3Withdrawal
                                    paymentMethods={paymentMethods}
                                    availableBalance={availableBalance}
                                    onSuccess={handleWeb3Success}
                                    onCancel={handleClose}
                                />
                            ) : (
                                <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                                    Config is missing, please try later.
                                </p>
                            )
                        ) : selectedMethod === 'bank_transfer' ? (
                            <BankTransferWithdrawal
                                paymentMethods={paymentMethods}
                                onSubmit={async (data: { amount: number; bankAccount?: string; description?: string }) => await handleSubmit(data)}
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                            />
                        ) : selectedMethod === 'upi' ? (
                            <UPIWithdrawal
                                paymentMethods={paymentMethods}
                                onSubmit={async (data: { amount: number; upiId?: string; description?: string }) => await handleSubmit(data)}
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                            />
                        ) : selectedMethod === 'withdrawal_request' ? (
                            <WithdrawalRequestForm
                                paymentMethods={paymentMethods}
                                onSubmit={async (data: { amount: number; description?: string }) =>
                                    await handleSubmit({ amount: data.amount, description: data.description })
                                }
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                                withdrawalAllowance={allowanceAmount}
                            />
                        ) : null}
                    </div>
                )}
            </div>
        </Modal>

        <WithdrawalAllowanceHelpDialog
            open={showAllowanceHelp}
            onClose={() => setShowAllowanceHelp(false)}
        />

        {show2FAModal && (
            <TwoFactorVerificationModal
                isOpen={show2FAModal}
                onClose={() => setShow2FAModal(false)}
                onVerified={(token) => {
                    setShow2FAModal(false);
                    if (pendingWithdrawalData) {
                        handleSubmit(pendingWithdrawalData, token);
                    }
                }}
                actionDescription="confirm this withdrawal"
            />
        )}
        </>
    );
}
