'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';

type WithdrawalRequestFormData = { amount: number; description?: string };

interface WithdrawalRequestFormProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
    availableBalance: number;
    withdrawalAllowance?: number;
}

/**
 * Withdrawal Request (4th withdrawal method).
 * Purely off-chain — no wallet connection needed.
 * User submits a withdrawal request from wallet balance.
 * Admin approves/rejects, and withdrawalFee is deducted upon approval.
 * Uses payment method config only (no transactionSettings.withdrawal).
 */
export function WithdrawalRequestForm({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
    availableBalance,
    withdrawalAllowance = 0,
}: WithdrawalRequestFormProps) {
    const withdrawalRequestConfig = paymentMethods?.withdrawal?.withdrawalRequest;
    const adminDescription = withdrawalRequestConfig?.details?.description ?? '';
    const withdrawalFee = withdrawalRequestConfig?.details?.withdrawalFee ?? 0;
    const minAmount = withdrawalRequestConfig?.minAmount ?? 0;
    const maxAmount = withdrawalRequestConfig?.maxAmount ?? 0;

    const withdrawalRequestSchema = useMemo(() => {
        let amountSchema = z.number().min(0.01, 'Amount is required');
        if (minAmount > 0) {
            amountSchema = amountSchema.min(minAmount, `Minimum withdrawal amount is ${minAmount}`);
        }
        if (maxAmount > 0) {
            amountSchema = amountSchema.max(maxAmount, `Maximum withdrawal amount is ${maxAmount}`);
        }
        return z.object({ amount: amountSchema, description: z.string().optional() });
    }, [minAmount, maxAmount]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<WithdrawalRequestFormData>({
        resolver: zodResolver(withdrawalRequestSchema),
    });

    const watchedAmount = watch('amount');

    // Calculate fee based on BPS (Basis Points)
    // Formula: (Amount * BPS) / 10000
    const calculatedFee = watchedAmount ? (watchedAmount * withdrawalFee) / 10000 : 0;
    const netAmount = (watchedAmount || 0) - calculatedFee;

    return (
        <form
            onSubmit={handleSubmit(async (data) =>
                onSubmit({
                    amount: data.amount,
                    description: data.description,
                })
            )}
            className="space-y-4"
        >
            {/* Admin description/note */}
            {adminDescription && (
                <div className="p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-xl">
                    <p className="text-sm text-teal-800 dark:text-teal-200">{adminDescription}</p>
                </div>
            )}

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Withdrawal Amount</label>
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
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
                            <span className="text-[var(--muted-foreground)]">Withdrawal Fee ({(withdrawalFee / 100).toFixed(2)}%)</span>
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
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="Add a note to your withdrawal request..."
                />
            </div>

            {/* Info note */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Your request will be reviewed by admin. No wallet connection is needed for this withdrawal method.
                    {withdrawalFee > 0 && ` A fee of ${(withdrawalFee / 100).toFixed(2)}% will be deducted upon approval.`}
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
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
