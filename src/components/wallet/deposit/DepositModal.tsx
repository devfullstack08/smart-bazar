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
                {/* Method Selection Step */}
                {!selectedMethod ? (
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Step 1</span>
                            <h4 className="text-sm font-bold text-[var(--foreground)] mt-2 mb-3">Select Deposit Channel</h4>
                        </div>
                        {depositMethods.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {depositMethods.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => {
                                            setValue('method', m.value);
                                            setSelectedMethod(m.value);
                                        }}
                                        className="relative p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-[var(--border)]/80 text-left transition-all group overflow-hidden active:scale-[0.99]"
                                    >
                                        <div className="w-3 h-3 rounded-full mb-3 border border-[var(--border)] bg-[var(--surface-elevated)] group-hover:border-primary transition-colors" />
                                        <p className="text-sm font-black text-[var(--foreground)]">{m.label}</p>
                                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-medium">Click to authorize setup</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                <p className="text-sm text-yellow-200">No deposit methods are currently enabled.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Step Header with back button */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Step 2</span>
                                <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1.5">
                                    Method: <span className="text-[var(--foreground)]">{depositMethods.find(m => m.value === selectedMethod)?.label}</span>
                                </p>
                            </div>
                            {depositMethods.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMethod(null);
                                        setValue('method', '' as DepositMethod);
                                    }}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Change Method
                                </button>
                            )}
                        </div>

                        {/* Render appropriate component based on selected method */}
                        {selectedMethod === 'web3_contract' ? (
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
                )}
            </div>
        </Modal>
    );
}
