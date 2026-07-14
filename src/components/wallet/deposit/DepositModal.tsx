'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { WalletData } from '@/types';
import { IPaymentConfig } from '@/types/paymentConfig';
import { Modal } from '@/components/ui/Modal';
import { BankTransferDeposit } from './BankTransferDeposit';
import { UPIDeposit } from './UPIDeposit';
import { Web3Deposit } from './Web3Deposit';
import { DepositAddressDeposit } from './DepositAddressDeposit';
import { paymentApi } from '@/lib/api/services';
import { getEffectiveWeb3Config, isWeb3ConfigComplete, isWeb3EOADepositReady, isWeb3ContractDepositReady } from '@/lib/utils/web3Helpers';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils/error';

type DepositMethod = 'bank_transfer' | 'upi' | 'web3_contract' | 'deposit_address';

interface DepositMethodOption {
    value: DepositMethod;
    label: string;
}

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethods: IPaymentConfig | null;
    walletData: WalletData | null;
    onSuccess: () => void;
}

export function DepositModal({
    isOpen,
    onClose,
    paymentMethods,
    walletData,
    onSuccess,
}: DepositModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const depositWeb3Config = getEffectiveWeb3Config(paymentMethods, 'deposit');

    const { register, watch, setValue, reset } = useForm<{ method: DepositMethod }>({
        defaultValues: { method: '' as DepositMethod },
    });
    // console.log("paymentMethods", paymentMethods);
    const depositMethods: DepositMethodOption[] = [];
    if (paymentMethods?.deposit.bankTransfer?.enabled) {
        depositMethods.push({ value: 'bank_transfer', label: 'Bank Transfer' });
    }
    if (paymentMethods?.deposit.upi?.enabled) {
        depositMethods.push({ value: 'upi', label: 'PayPal / UPI' });
    }
    if (isWeb3ContractDepositReady(paymentMethods?.deposit?.web3, paymentMethods?.web3)) {
        depositMethods.push({ value: 'web3_contract', label: 'Deposit via contract' });
    }
    if (isWeb3EOADepositReady(paymentMethods?.deposit?.depositAddress, paymentMethods?.web3)) {
        depositMethods.push({ value: 'deposit_address', label: 'Deposit to Address' });
    }

    const watchedMethod = watch('method');

    useEffect(() => {
        if (watchedMethod) {
            setSelectedMethod(watchedMethod);
        }
    }, [watchedMethod]);

    useEffect(() => {
        if (isOpen && paymentMethods) {
            if (depositMethods.length === 1) {
                setValue('method', depositMethods[0].value);
                setSelectedMethod(depositMethods[0].value);
            } else {
                setSelectedMethod(null);
                reset();
            }
        }
    }, [isOpen, depositMethods.length]);


    const handleClose = () => {
        setSelectedMethod(null);
        reset();
        onClose();
    };

    const handleSubmit = async (data: { amount: number; proof: File; description?: string }) => {
        if (!selectedMethod) return;

        const apiMethod: 'bank_transfer' | 'upi' | 'web3' | 'web3_contract' | 'deposit_address' =
            selectedMethod === 'web3_contract' || selectedMethod === 'deposit_address'
                ? 'web3'
                : selectedMethod;

        setSubmitting(true);
        try {
            await paymentApi.createDeposit({
                method: apiMethod,
                amount: data.amount,
                proof: data.proof,
                description: data.description,
            });

            toast.success('Deposit request submitted successfully! Waiting for admin approval.');
            handleClose();
            onSuccess();
        } catch (error: any) {
            const message = getErrorMessage(error, 'Deposit request failed');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleWeb3Success = () => {
        handleClose();
        onSuccess();
    };

    if (!paymentMethods) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Request Deposit"
            size="md"
        >
            <div className="space-y-4">
                {/* Method Selection */}
                {depositMethods.length > 1 ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                        <select
                            {...register('method', { required: 'Please select a payment method' })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            defaultValue=""
                        >
                            <option value="" disabled>Select payment method</option>
                            {depositMethods.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                ) : depositMethods.length === 1 ? (
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Payment Method:</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{depositMethods[0].label}</p>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">No deposit methods are currently enabled.</p>
                    </div>
                )}

                {/* Render appropriate component based on selected method */}
                {depositMethods.length > 1 && !selectedMethod ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a payment method to continue.</p>
                ) : selectedMethod === 'web3_contract' ? (
                    isWeb3ConfigComplete(depositWeb3Config) ? (
                        <Web3Deposit
                            paymentMethods={paymentMethods}
                            availableBalance={walletData?.wallet.availableBalance ?? 0}
                            onSuccess={handleWeb3Success}
                            onCancel={handleClose}
                        />
                    ) : (
                        <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                            Config is missing, please try later.
                        </p>
                    )
                ) : selectedMethod === 'bank_transfer' ? (
                    <BankTransferDeposit
                        paymentMethods={paymentMethods}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                        submitting={submitting}
                    />
                ) : selectedMethod === 'upi' ? (
                    <UPIDeposit
                        paymentMethods={paymentMethods}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                        submitting={submitting}
                    />
                ) : selectedMethod === 'deposit_address' ? (
                    <DepositAddressDeposit
                        paymentMethods={paymentMethods}
                        availableBalance={walletData?.wallet.availableBalance ?? 0}
                        onSuccess={handleWeb3Success}
                        onCancel={handleClose}
                    />
                ) : null}
            </div>
        </Modal>
    );
}
