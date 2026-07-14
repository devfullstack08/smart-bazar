'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { API_URL } from '@/constants/env';
import { IPaymentConfig } from '@/types/paymentConfig';

const upiDepositSchema = z.object({
    amount: z.number().min(1, 'Amount is required').min(1, 'Amount must be at least 1'),
    proof: z.instanceof(File, {
        message: 'Please upload a payment proof image',
    }).refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
    description: z.string().optional(),
});

type UPIDepositFormData = z.infer<typeof upiDepositSchema>;

interface UPIDepositProps {
    paymentMethods: IPaymentConfig;
    onSubmit: (data: { amount: number; proof: File; description?: string }) => Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
}

export function UPIDeposit({
    paymentMethods,
    onSubmit,
    onCancel,
    submitting = false,
}: UPIDepositProps) {
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<UPIDepositFormData>({
        resolver: zodResolver(upiDepositSchema),
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

    const upiDetails = paymentMethods.deposit.upi?.details;
    const apiBaseUrl = API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

    return (
        <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4">
            {upiDetails && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">UPI Details:</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                        {upiDetails.upiId && (
                            <p><strong>UPI ID:</strong> {upiDetails.upiId}</p>
                        )}
                        {upiDetails.payeeName && (
                            <p><strong>Payee Name:</strong> {upiDetails.payeeName}</p>
                        )}
                        {upiDetails.qrCodeImage && (
                            <div>
                                <p className="font-semibold mb-2">QR Code:</p>
                                <img
                                    src={`${apiBaseUrl}${upiDetails.qrCodeImage}`}
                                    alt="UPI QR Code"
                                    className="max-w-xs mx-auto border border-gray-200 dark:border-white/10 rounded-xl"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Amount</label>
                <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="1000.00"
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Payment Proof (Image)</label>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofFileChange}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
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
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Description (Optional)</label>
                <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none"
                    placeholder="Additional notes..."
                />
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 btn btn-secondary px-4 py-3 rounded-xl font-semibold transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn btn-primary px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}
