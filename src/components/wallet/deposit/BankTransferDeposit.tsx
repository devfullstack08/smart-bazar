'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPaymentConfig } from '@/types/paymentConfig';
import { useState } from 'react';

const bankTransferDepositSchema = z.object({
    amount: z.number().min(1, 'Amount is required').min(1, 'Amount must be at least 1'),
    proof: z.instanceof(File, {
        message: 'Please upload a payment proof image',
    }).refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
    description: z.string().optional(),
});

type BankTransferDepositFormData = z.infer<typeof bankTransferDepositSchema>;

interface BankTransferDepositProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; proof: File; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
}

export function BankTransferDeposit({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
}: BankTransferDepositProps) {
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<BankTransferDepositFormData>({
        resolver: zodResolver(bankTransferDepositSchema),
    });

    const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('proof', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const bankDetails = paymentMethods.deposit.bankTransfer.details;

    return (
        <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4">
            {bankDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Bank Details:</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                        {bankDetails.bankName && <p><strong>Bank:</strong> {bankDetails.bankName}</p>}
                        {bankDetails.accountNumber && <p><strong>Account:</strong> {bankDetails.accountNumber}</p>}
                        {bankDetails.ifscCode && <p><strong>IFSC:</strong> {bankDetails.ifscCode}</p>}
                        {bankDetails.accountHolderName && <p><strong>Holder:</strong> {bankDetails.accountHolderName}</p>}
                        {bankDetails.branchName && <p><strong>Branch:</strong> {bankDetails.branchName}</p>}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1000.00"
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Proof (Image)</label>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofFileChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/30"
                />
                {errors.proof && (
                    <p className="mt-1 text-sm text-red-600">{errors.proof.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Max size: 5MB (JPEG, PNG, WebP)</p>
                {proofPreview && (
                    <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <img
                            src={proofPreview}
                            alt="Proof preview"
                            className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
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
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
