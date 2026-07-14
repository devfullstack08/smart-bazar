'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAppSelector } from '@/lib/store/hooks';
import { userApi } from '@/lib/api/services';
import { IPaymentConfig } from '@/types/paymentConfig';

type FormData = { amount: number; description?: string };

interface WalletAddressWithdrawalProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; walletAddress: string; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
    availableBalance: number;
    withdrawalAllowance?: number;
}

/**
 * Wallet Address Withdrawal (5th withdrawal method).
 * Tokens are sent to the user's primary wallet address (set in profile) via adminTransfer on approval.
 */
export function WalletAddressWithdrawal({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
    availableBalance,
    withdrawalAllowance = 0,
}: WalletAddressWithdrawalProps) {
    const config = (paymentMethods?.withdrawal as any)?.walletAddressWithdrawal;
    const withdrawalFee = config?.details?.withdrawalFee ?? 0;
    const adminDescription = config?.details?.description ?? '';
    const minAmount = config?.minAmount ?? 0;
    const maxAmount = config?.maxAmount ?? 0;

    const reduxWallet = useAppSelector((state) => state.auth.user?.walletAddress?.trim());
    const [profileWallet, setProfileWallet] = useState<string | undefined | 'pending'>('pending');

    useEffect(() => {
        let cancelled = false;
        userApi
            .getProfile()
            .then((p) => {
                if (!cancelled) setProfileWallet(p?.walletAddress?.trim() || undefined);
            })
            .catch(() => {
                if (!cancelled) setProfileWallet(undefined);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const primaryWallet =
        (profileWallet !== 'pending' ? profileWallet ?? reduxWallet : reduxWallet) || undefined;

    const schema = useMemo(() => {
        let amountSchema = z.number().min(0.01, 'Amount is required');
        if (minAmount > 0) amountSchema = amountSchema.min(minAmount, `Minimum is ${minAmount}`);
        if (maxAmount > 0) amountSchema = amountSchema.max(maxAmount, `Maximum is ${maxAmount}`);
        return z.object({
            amount: amountSchema,
            description: z.string().optional(),
        });
    }, [minAmount, maxAmount]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const watchedAmount = watch('amount');
    const calculatedFee = watchedAmount ? (watchedAmount * withdrawalFee) / 10000 : 0;
    const netAmount = (watchedAmount || 0) - calculatedFee;

    if (profileWallet === 'pending' && !reduxWallet) {
        return (
            <div className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Loading wallet…
            </div>
        );
    }

    // Block if user has no primary wallet address set
    if (!primaryWallet) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Wallet address not set
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Please update your profile and add a wallet address before using this withdrawal method.
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

    return (
        <form
            onSubmit={handleSubmit(async (data) =>
                onSubmit({ ...data, walletAddress: primaryWallet })
            )}
            className="space-y-4"
        >
            {/* Admin note */}
            {adminDescription && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">{adminDescription}</p>
                </div>
            )}

            {/* Primary wallet (read-only display) */}
            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                    Receiving Wallet Address
                </label>
                <div className="px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">Your primary wallet</p>
                    <p className="text-sm font-mono text-[var(--foreground)] break-all">{primaryWallet}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    To change this address, update it in your{' '}
                    <Link href="/profile" className="text-primary hover:underline">
                        profile settings
                    </Link>
                    .
                </p>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Amount</label>
                <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="0.00"
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Available: {availableBalance.toLocaleString()}
                    {(minAmount > 0 || maxAmount > 0) && (
                        <> &nbsp;·&nbsp; Min: {minAmount > 0 ? minAmount : '—'} &nbsp;·&nbsp; Max: {maxAmount > 0 ? maxAmount : 'Unlimited'}</>
                    )}
                </p>
                {watchedAmount > withdrawalAllowance && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                        Refresh allowance before withdrawing this amount. Current allowance: {withdrawalAllowance.toFixed(6)}
                    </p>
                )}
            </div>

            {/* Fee breakdown */}
            {watchedAmount > 0 && (
                <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Withdrawal Amount</span>
                        <span className="font-medium text-[var(--foreground)]">{watchedAmount.toFixed(2)}</span>
                    </div>
                    {withdrawalFee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">Fee ({(withdrawalFee / 100).toFixed(2)}%)</span>
                            <span className="font-medium text-red-600 dark:text-red-400">- {calculatedFee.toFixed(2)}</span>
                        </div>
                    )}
                    <hr className="border-[var(--border)]" />
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-[var(--foreground)]">You Will Receive</span>
                        <span className={netAmount > 0 ? 'text-emerald-500 font-bold' : 'text-red-600 dark:text-red-400'}>
                            {netAmount > 0 ? netAmount.toFixed(2) : '0.00'}
                        </span>
                    </div>
                </div>
            )}

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Note (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="Add a note..."
                />
            </div>

            {/* Info note */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    This is a direct withdrawal. Tokens will be sent to your primary wallet address immediately after successful processing.
                    {withdrawalFee > 0 && ` A fee of ${(withdrawalFee / 100).toFixed(2)}% will be deducted.`}
                </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 btn btn-secondary px-4 py-2.5 text-sm sm:text-base rounded-xl font-semibold transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || !watchedAmount || netAmount <= 0}
                    className="flex-1 btn btn-primary px-4 py-2.5 text-sm sm:text-base rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Processing...' : 'Withdraw Now'}
                </button>
            </div>
        </form>
    );
}
