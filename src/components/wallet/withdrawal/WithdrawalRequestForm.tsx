'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';
import { calculateConvertedAmount, formatConversionRateBadge } from '@/lib/utils/web3Helpers';

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
    const conversionSummary = withdrawalRequestConfig?.conversionSummary || (paymentMethods?.withdrawal as any)?.web3?.conversionSummary;

    const withdrawalRequestSchema = useMemo(() => {
        let amountSchema = z.number({ message: 'Amount is required' }).min(0.01, 'Amount is required');
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
        setValue,
        formState: { errors },
    } = useForm<WithdrawalRequestFormData>({
        resolver: zodResolver(withdrawalRequestSchema),
    });

    const watchedAmount = watch('amount');

    // Calculate fee based on BPS (Basis Points)
    // Formula: (Amount * BPS) / 10000
    const calculatedFee = watchedAmount ? (watchedAmount * withdrawalFee) / 10000 : 0;
    const netAmount = (watchedAmount || 0) - calculatedFee;
    const convertedInfo = calculateConvertedAmount(conversionSummary, netAmount, 'INR');

    const handleSetPercent = (pct: number) => {
        let maxAvailable = availableBalance;
        if (maxAmount > 0) maxAvailable = Math.min(maxAvailable, maxAmount);
        const targetVal = parseFloat(((maxAvailable * pct) / 100).toFixed(2));
        setValue('amount', targetVal, { shouldValidate: true });
    };

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

            {/* Conversion Rate Info */}
            {conversionSummary && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <span>⚡</span> Live Conversion Rate
                        </span>
                        <span className="font-extrabold text-amber-300 font-mono text-sm">
                            {formatConversionRateBadge(conversionSummary)}
                        </span>
                    </div>
                    {netAmount > 0 && convertedInfo && (
                        <div className="flex items-center justify-between pt-2 border-t border-amber-500/15 font-semibold text-emerald-400">
                            <span>Crypto Payout:</span>
                            <span className="font-extrabold font-mono text-sm">
                                {convertedInfo.outputAmount.toFixed(6)} {convertedInfo.outputCurrency}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Amount */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-[var(--foreground)]">Withdrawal Amount</label>
                    {/* Preset Amount Chips */}
                    <div className="flex items-center gap-1.5">
                        {[25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => handleSetPercent(pct)}
                                className="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-primary/15 hover:border-primary/50 text-[var(--foreground)] transition-all active:scale-95"
                            >
                                {pct === 100 ? 'MAX' : `${pct}%`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <input
                        {...register('amount', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="w-full px-4 py-3 pr-14 text-base sm:text-lg font-mono font-bold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                        placeholder="0.00"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted-foreground)] font-mono bg-[var(--surface-elevated)] px-2 py-1 rounded border border-[var(--border)]">
                        INR
                    </span>
                </div>
                {errors.amount && (
                    <p className="mt-1 text-xs font-semibold text-red-500">{errors.amount.message}</p>
                )}
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                    <span>Available: <strong className="font-mono text-[var(--foreground)]">₹{availableBalance.toLocaleString()}</strong></span>
                    {(minAmount > 0 || maxAmount > 0) && (
                        <span>Min: {minAmount > 0 ? `₹${minAmount}` : '—'} · Max: {maxAmount > 0 ? `₹${maxAmount}` : 'Unlimited'}</span>
                    )}
                </p>
            </div>

            {/* Fee breakdown */}
            {watchedAmount > 0 && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent space-y-2 shadow-inner">
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-[var(--muted-foreground)]">Withdrawal Amount</span>
                        <span className="font-semibold font-mono text-[var(--foreground)]">₹{watchedAmount.toFixed(2)} INR</span>
                    </div>
                    {withdrawalFee > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-[var(--muted-foreground)]">Fee ({(withdrawalFee / 100).toFixed(2)}%)</span>
                            <span className="font-semibold font-mono text-red-400">- ₹{calculatedFee.toFixed(2)} INR</span>
                        </div>
                    )}
                    <hr className="border-emerald-500/15 my-1" />
                    <div className="flex justify-between text-sm font-black">
                        <span className="text-[var(--foreground)] flex items-center gap-1.5">
                            <span>⚡</span> You Will Receive
                        </span>
                        <span className={netAmount > 0 ? 'text-emerald-400 font-black font-mono text-base' : 'text-red-400 font-mono'}>
                            {netAmount > 0
                                ? convertedInfo
                                    ? `${convertedInfo.outputAmount.toFixed(6)} ${convertedInfo.outputCurrency}`
                                    : `₹${netAmount.toFixed(2)} INR`
                                : '0.00'}
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
