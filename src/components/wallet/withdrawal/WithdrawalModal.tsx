'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { WalletData, WalletState } from '@/types';
import { IPaymentConfig } from '@/types/paymentConfig';
import { Modal } from '@/components/ui/Modal';
import { BankTransferWithdrawal } from './BankTransferWithdrawal';
import { UPIWithdrawal } from './UPIWithdrawal';
import { Web3Withdrawal } from './Web3Withdrawal';
import { Web3RequestWithdrawal } from './Web3RequestWithdrawal';
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

interface WithdrawalMethodOption {
    value: WithdrawalMethod;
    label: string;
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


    const { register, watch, setValue, reset } = useForm<{ method: WithdrawalMethod }>({
        defaultValues: { method: '' as WithdrawalMethod },
    });

    // wallet_address is NOT in this list — it is auto-shown without user selection
    const selectableMethods: WithdrawalMethodOption[] = [];
    if (paymentMethods?.withdrawal.bankTransfer?.enabled) {
        selectableMethods.push({ value: 'bank_transfer', label: 'Bank Transfer' });
    }
    if (paymentMethods?.withdrawal.upi?.enabled) {
        selectableMethods.push({ value: 'upi', label: 'PayPal / UPI' });
    }
    if (paymentMethods?.withdrawal.web3?.enabled && isWeb3ConfigComplete(withdrawalWeb3Config)) {
        selectableMethods.push({ value: 'web3_contract', label: 'Web3 (self-withdraw via contract)' });
    }
    if (paymentMethods?.withdrawal.withdrawalRequest?.enabled) {
        selectableMethods.push({ value: 'withdrawal_request', label: 'Withdrawal Request' });
    }

    const walletAddressEnabled = Boolean(paymentMethods?.withdrawal.walletAddressWithdrawal?.enabled);

    const watchedMethod = watch('method');

    useEffect(() => {
        if (watchedMethod) setSelectedMethod(watchedMethod);
    }, [watchedMethod]);

    useEffect(() => {
        if (!isOpen || !paymentMethods) return;
        reset();
        if (walletAddressEnabled) {
            // Auto-show wallet address form — no selection needed
            setSelectedMethod('wallet_address');
        } else if (selectableMethods.length === 1) {
            setValue('method', selectableMethods[0].value);
            setSelectedMethod(selectableMethods[0].value);
        } else {
            setSelectedMethod(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || selectedMethod === 'web3_contract') return;
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
        setShow2FAModal(false);
        setPendingWithdrawalData(null);
        reset();
        onClose();
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

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request Withdrawal"
            size="md"
        >
            <div className="space-y-4">
                {selectedMethod !== 'web3_contract' && (
                    <div className="rounded-xl border border-white/10 bg-white/5 glass-panel overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                            <div className="p-3.5 min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Withdrawal Wallet</p>
                                <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{withdrawalWalletName}</p>
                                <p className="mt-2 text-2xl font-bold leading-tight text-foreground">
                                    {Math.max(0, availableBalance).toLocaleString()}
                                </p>
                                <p className="mt-0.5 text-xs text-text-muted">Available balance</p>
                            </div>
                            <div className="p-3.5 min-w-0">
                                <div className="flex h-full flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Withdrawal Allowance</p>
                                        <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${allowanceBadgeClass[allowanceDisplayStatus]}`}>
                                            {allowanceBadgeLabel[allowanceDisplayStatus]}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllowanceHelp(true)}
                                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                                            title="What is withdrawal allowance?"
                                        >
                                            <HelpCircle className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-end justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-2xl font-bold leading-tight text-foreground">
                                                {allowanceAmount.toFixed(6)}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-text-muted">Last refreshed: {formatRelativeTime(allowanceStatus?.lastRefreshedAt)}</p>
                                        </div>
                                    
                                    </div>
                                    <div className='flex items-end justify-end'>
                                    <button
                                            type="button"
                                            onClick={handleRefreshWithdrawalAllowance}
                                            disabled={refreshingAllowance || allowanceCooldownSeconds > 0}
                                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                </div>
                            </div>
                        </div>
                        {(lockedAmount > 0 || availableBalance <= 0 || allowanceRefreshMessage) && (
                            <div className="border-t border-white/10 px-3.5 py-3 space-y-1.5">
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
                                {allowanceStatus && !allowanceStatus.available && (
                                    <p className="text-xs text-text-muted">
                                        Withdrawal allowance is not available for this wallet yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Wallet Address method: auto-shown, no selection step ── */}
                {selectedMethod === 'wallet_address' && (
                    <>
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

                        {/* Let users switch to another method if available */}
                        {selectableMethods.length > 0 && (
                            <div className="pt-4 border-t border-white/10 mt-4">
                                <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
                                    Use a different method
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectableMethods.map((m) => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => {
                                                setValue('method', m.value);
                                                setSelectedMethod(m.value);
                                            }}
                                            className="p-3 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-left transition-all text-xs font-bold text-foreground"
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Standard methods (bank / UPI / web3 / withdrawal_request) ── */}
                {selectedMethod !== 'wallet_address' && (
                    <>
                        {/* Back to wallet address link */}
                        {walletAddressEnabled && (
                            <button
                                type="button"
                                onClick={() => { reset(); setSelectedMethod('wallet_address'); }}
                                className="text-xs text-teal-600 dark:text-teal-400 underline"
                            >
                                ← Back to Wallet Address Withdrawal
                            </button>
                        )}

                        {/* Method selector */}
                        {selectableMethods.length > 1 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {selectableMethods.map((m) => {
                                    const isSelected = selectedMethod === m.value;
                                    return (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => {
                                                setValue('method', m.value);
                                                setSelectedMethod(m.value);
                                            }}
                                            className={`relative p-4 rounded-xl border text-left transition-all overflow-hidden ${
                                                isSelected 
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                        >
                                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent pointer-events-none" />}
                                            <div className={`w-3 h-3 rounded-full mb-3 border ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'border-white/30'}`} />
                                            <p className={`text-sm font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-foreground'}`}>{m.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : selectableMethods.length === 1 ? (
                            <div className="p-4 rounded-xl glass-panel border border-white/10 bg-white/5 mb-6">
                                <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Withdrawal Method</p>
                                <p className="text-sm font-bold text-foreground">{selectableMethods[0].label}</p>
                            </div>
                        ) : !walletAddressEnabled ? (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6">
                                <p className="text-sm text-yellow-200">
                                    No withdrawal methods are currently enabled.
                                </p>
                            </div>
                        ) : null}

                        {/* Show prompt if multiple methods and none selected yet */}
                        {selectableMethods.length > 1 && !selectedMethod && (
                            <div className="text-center py-6 text-text-muted text-sm glass-panel rounded-xl border border-white/5">
                                Please select a withdrawal method above.
                            </div>
                        )}

                        {/* Method forms */}
                        {selectedMethod === 'web3_contract' ? (
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
                                onSubmit={async (data) => await handleSubmit({ ...data, bankAccount: data.bankAccount })}
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                                withdrawalAllowance={allowanceAmount}
                            />
                        ) : selectedMethod === 'upi' ? (
                            <UPIWithdrawal
                                paymentMethods={paymentMethods}
                                onSubmit={async (data) => await handleSubmit({ ...data, upiId: data.upiId })}
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                                withdrawalAllowance={allowanceAmount}
                            />
                        ) : selectedMethod === 'withdrawal_request' ? (
                            <WithdrawalRequestForm
                                paymentMethods={paymentMethods}
                                onSubmit={async (data) =>
                                    await handleSubmit({ amount: data.amount, description: data.description })
                                }
                                onCancel={handleClose}
                                submitting={submitting}
                                availableBalance={availableBalance}
                                withdrawalAllowance={allowanceAmount}
                            />
                        ) : null}
                    </>
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
