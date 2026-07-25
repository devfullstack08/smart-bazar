'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';

const upiWithdrawalSchema = z.object({
    amount: z.number({ message: 'Amount is required' }).min(1, 'Amount is required'),
    upiId: z.string().min(1, 'UPI ID is required').regex(/^[\w.-]+@[\w]+$/, 'Invalid UPI ID format'),
    description: z.string().optional(),
});

type UPIWithdrawalFormData = z.infer<typeof upiWithdrawalSchema>;

interface UPIWithdrawalProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; upiId: string; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
    availableBalance: number;
}

export function UPIWithdrawal({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
    availableBalance,
}: UPIWithdrawalProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UPIWithdrawalFormData>({
        resolver: zodResolver(upiWithdrawalSchema),
    });
    const watchedAmount = watch('amount') || 0;

    const withdrawalConfig = paymentMethods.withdrawal.upi;
    const minAmount = withdrawalConfig?.minAmount || 0;
    const maxAmount = withdrawalConfig?.maxAmount || 0;
    const withdrawalFeePercent = withdrawalConfig?.details?.withdrawalFee || 0;

    const calculatedFee = (watchedAmount * withdrawalFeePercent) / 100;
    const netAmount = Math.max(0, watchedAmount - calculatedFee);

    const handlePresetPercent = (percent: number) => {
        let maxAllowed = availableBalance;
        if (maxAmount > 0) maxAllowed = Math.min(maxAllowed, maxAmount);
        const calc = Math.floor(((maxAllowed * percent) / 100) * 100) / 100;
        setValue('amount', calc > 0 ? calc : 0, { shouldValidate: true });
    };

    return (
        <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4">
            {/* Amount Presets */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-[var(--muted-foreground)]">Withdrawal Amount</label>
                    <div className="flex gap-1.5">
                        {[25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => handlePresetPercent(pct)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-hover)] hover:bg-primary/20 text-[var(--foreground)] transition-colors border border-[var(--border)]"
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
                        min={minAmount || 1}
                        max={maxAmount || undefined}
                        className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none pr-14"
                        placeholder="1000.00"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted-foreground)]">INR</span>
                </div>
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Available: ₹{availableBalance.toLocaleString('en-IN')}
                    {(minAmount > 0 || maxAmount > 0) && (
                        <> &nbsp;·&nbsp; Min: ₹{minAmount > 0 ? minAmount : '—'} &nbsp;·&nbsp; Max: {maxAmount > 0 ? `₹${maxAmount}` : 'Unlimited'}</>
                    )}
                </p>
            </div>

            {/* Fee calculation breakdown */}
            {watchedAmount > 0 && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                        <span>Withdrawal Amount</span>
                        <span className="font-semibold font-mono text-[var(--foreground)]">₹{watchedAmount.toFixed(2)} INR</span>
                    </div>
                    {withdrawalFeePercent > 0 && (
                        <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                            <span>Withdrawal Fee ({withdrawalFeePercent.toFixed(2)}%)</span>
                            <span className="font-semibold font-mono text-red-400">- ₹{calculatedFee.toFixed(2)} INR</span>
                        </div>
                    )}
                    <hr className="border-emerald-500/15 my-1" />
                    <div className="flex justify-between text-sm font-black">
                        <span className="text-[var(--foreground)] flex items-center gap-1.5">
                            <span>⚡</span> You Will Receive
                        </span>
                        <span className={netAmount > 0 ? 'text-emerald-400 font-black font-mono text-base' : 'text-red-400 font-mono'}>
                            {netAmount > 0 ? `₹${netAmount.toFixed(2)} INR` : '₹0.00'}
                        </span>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">UPI ID</label>
                <input
                    {...register('upiId')}
                    type="text"
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="yourname@paytm"
                />
                {errors.upiId && (
                    <p className="mt-1 text-sm text-red-600">{errors.upiId.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="Additional notes..."
                />
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
                    {submitting ? 'Processing...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
