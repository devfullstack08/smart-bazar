'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';

const upiWithdrawalSchema = z.object({
    amount: z.number().min(1, 'Amount is required'),
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
    withdrawalAllowance?: number;
}

export function UPIWithdrawal({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
    availableBalance,
    withdrawalAllowance = 0,
}: UPIWithdrawalProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<UPIWithdrawalFormData>({
        resolver: zodResolver(upiWithdrawalSchema),
    });
    const watchedAmount = watch('amount');

    const withdrawalConfig = paymentMethods.withdrawal.upi;
    const minAmount = withdrawalConfig.minAmount || 0;
    const maxAmount = withdrawalConfig.maxAmount || 0;

    return (
        <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4">
            {(minAmount > 0 || maxAmount > 0) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                        Min: {minAmount.toLocaleString()} | Max: {maxAmount > 0 ? maxAmount.toLocaleString() : 'Unlimited'}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min={minAmount || 1}
                    max={maxAmount || undefined}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="1000.00"
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Available: {availableBalance.toLocaleString()}</p>
                {watchedAmount > withdrawalAllowance && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                        Refresh allowance before withdrawing this amount. Current allowance: {withdrawalAllowance.toFixed(6)}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                <input
                    {...register('upiId')}
                    type="text"
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="yourname@paytm"
                />
                {errors.upiId && (
                    <p className="mt-1 text-sm text-red-600">{errors.upiId.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Additional notes..."
                />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2.5 text-sm sm:text-base rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Processing...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
