'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';
import { isAddress } from 'viem';

const web3RequestWithdrawalSchema = z.object({
    amount: z.number().min(0.000001, 'Amount is required'),
    walletAddress: z
        .string()
        .min(1, 'Wallet address is required')
        .refine((val) => isAddress(val.trim()), 'Invalid wallet address (must be 0x...)'),
    description: z.string().optional(),
});

type Web3RequestWithdrawalFormData = z.infer<typeof web3RequestWithdrawalSchema>;

interface Web3RequestWithdrawalProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; walletAddress: string; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
    availableBalance: number;
}

export function Web3RequestWithdrawal({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
    availableBalance,
}: Web3RequestWithdrawalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Web3RequestWithdrawalFormData>({
        resolver: zodResolver(web3RequestWithdrawalSchema),
    });

    const web3WithdrawalConfig = paymentMethods?.withdrawal?.web3;
    const minAmount = web3WithdrawalConfig?.minAmount ?? 0;
    const maxAmount = web3WithdrawalConfig?.maxAmount ?? 0;
    const maxAmountEffective = maxAmount > 0 ? maxAmount : Infinity;

    return (
        <form
            onSubmit={handleSubmit(async (data) =>
                onSubmit({
                    amount: data.amount,
                    walletAddress: data.walletAddress.trim(),
                    description: data.description,
                })
            )}
            className="space-y-4"
        >
            {(minAmount > 0 || maxAmount > 0) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-500/10 border border-gray-200 dark:border-gray-500/30 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Min: {minAmount.toLocaleString()} | Max: {maxAmount > 0 ? maxAmount.toLocaleString() : 'Unlimited'}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.000001"
                    min={minAmount || 0.000001}
                    max={maxAmount > 0 ? maxAmount : undefined}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.0"
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Available: {availableBalance.toLocaleString()}</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Withdrawal wallet address</label>
                <input
                    {...register('walletAddress')}
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0x..."
                />
                {errors.walletAddress && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.walletAddress.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tokens will be sent to this address after admin approval</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Additional notes..."
                />
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
