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
import { formatConversionRateBadge, getEffectiveWeb3Config, isWeb3ConfigComplete, isWeb3EOADepositReady, isWeb3ContractDepositReady } from '@/lib/utils/web3Helpers';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils/error';

type DepositMethod = 'bank_transfer' | 'upi' | 'web3_contract' | 'deposit_address';

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
    const [web3SubSelection, setWeb3SubSelection] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);

    const depositWeb3Config = getEffectiveWeb3Config(paymentMethods, 'deposit');

    const hasBank = !!paymentMethods?.deposit.bankTransfer?.enabled;
    const hasUpi = !!paymentMethods?.deposit.upi?.enabled;
    const hasWeb3Contract = isWeb3ContractDepositReady(paymentMethods?.deposit?.web3, paymentMethods?.web3);
    const hasDepositAddress = isWeb3EOADepositReady(paymentMethods?.deposit?.depositAddress, paymentMethods?.web3);

    const hasFiatMethods = hasUpi || hasBank;
    const hasWeb3Methods = hasWeb3Contract || hasDepositAddress;

    // Get conversion rate summary for Web3 deposit if defined
    const conversionSummary =
        paymentMethods?.deposit?.web3?.conversionSummary ||
        paymentMethods?.deposit?.depositAddress?.conversionSummary;

    useEffect(() => {
        if (isOpen) {
            setSelectedMethod(null);
            setWeb3SubSelection(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setSelectedMethod(null);
        setWeb3SubSelection(false);
        onClose();
    };

    const handleSelectWeb3Group = () => {
        if (hasWeb3Contract && hasDepositAddress) {
            setWeb3SubSelection(true);
        } else if (hasWeb3Contract) {
            setSelectedMethod('web3_contract');
        } else if (hasDepositAddress) {
            setSelectedMethod('deposit_address');
        }
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

    const getMethodLabel = (method: DepositMethod) => {
        switch (method) {
            case 'bank_transfer':
                return 'Bank Transfer';
            case 'upi':
                return 'PayPal / UPI';
            case 'web3_contract':
                return 'Web3 Contract Deposit';
            case 'deposit_address':
                return 'Direct Address Deposit';
        }
    };

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
                    <div className="space-y-5">
                        {web3SubSelection ? (
                            /* Web3 Sub-selection view if both web3 methods enabled */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                                            Crypto / Web3 Channel
                                        </span>
                                        <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">
                                            Choose Web3 Deposit Method
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setWeb3SubSelection(false)}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        ← Back to Channels
                                    </button>
                                </div>

                                {conversionSummary && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-amber-400">⚡ Live Exchange Rate</span>
                                        <span className="font-bold text-amber-300 font-mono">
                                            {formatConversionRateBadge(conversionSummary)}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3">
                                    {hasWeb3Contract && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMethod('web3_contract')}
                                            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-indigo-500/50 text-left transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-black text-[var(--foreground)]">Web3 Contract Deposit (Automated)</p>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">Web3 Wallet</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--muted-foreground)]">Connect Web3 wallet (MetaMask, WalletConnect) to deposit instantly on-chain.</p>
                                        </button>
                                    )}

                                    {hasDepositAddress && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMethod('deposit_address')}
                                            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-indigo-500/50 text-left transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-black text-[var(--foreground)]">Direct Address Deposit (QR Code)</p>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">Manual Send</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--muted-foreground)]">Scan QR code or copy deposit address to send USDT from any exchange/wallet.</p>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Primary Channel Selection View (Priority 1: UPI & Bank, Priority 2: Web3) */
                            <div className="space-y-5">
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Step 1</span>
                                    <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">Select Deposit Channel</h4>
                                </div>

                                {/* Priority 1: Primary Domestic Payment Channels (UPI & Bank Transfer) */}
                                {hasFiatMethods && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Instant / Domestic Channels (INR)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {hasUpi && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMethod('upi')}
                                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-primary/60 text-left transition-all group active:scale-[0.99]"
                                                >
                                                    <div className="w-3 h-3 rounded-full mb-2.5 border border-[var(--border)] bg-emerald-500 group-hover:scale-110 transition-transform" />
                                                    <p className="text-sm font-black text-[var(--foreground)]">PayPal / UPI</p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">Instant GPay, PhonePe, Paytm, UPI</p>
                                                </button>
                                            )}

                                            {hasBank && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMethod('bank_transfer')}
                                                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/70 hover:border-primary/60 text-left transition-all group active:scale-[0.99]"
                                                >
                                                    <div className="w-3 h-3 rounded-full mb-2.5 border border-[var(--border)] bg-blue-500 group-hover:scale-110 transition-transform" />
                                                    <p className="text-sm font-black text-[var(--foreground)]">Bank Transfer</p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">Direct IMPS / NEFT bank transfer</p>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Priority 2: Secondary Crypto / Web3 Payment Channels */}
                                {hasWeb3Methods && (
                                    <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                                Web3 & Crypto Options
                                            </p>
                                            {conversionSummary && (
                                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                                    {formatConversionRateBadge(conversionSummary)}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSelectWeb3Group}
                                            className="w-full p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent hover:border-indigo-500/60 text-left transition-all group active:scale-[0.99]"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                        ⚡
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[var(--foreground)]">Web3 / Crypto Deposit (USDT)</p>
                                                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                                                            Deposit via Web3 Wallet or Direct USDT Address
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                                    Select →
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {!hasFiatMethods && !hasWeb3Methods && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                        <p className="text-sm text-yellow-200">No deposit methods are currently enabled.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Step 2 Header with back button */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Step 2</span>
                                <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1.5">
                                    Method: <span className="text-[var(--foreground)]">{getMethodLabel(selectedMethod)}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedMethod(null)}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Change Method
                            </button>
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
