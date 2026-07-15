'use client';

import { useMemo, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { walletApi, authApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils/cn';
import { ArrowRightLeft, Users, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TransferFundsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletConfig: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletState: any;
    onSuccess: () => void;
};

export function TransferFundsModal({ isOpen, onClose, walletConfig, walletState, onSuccess }: TransferFundsModalProps) {
    const [activeTab, setActiveTab] = useState<'internal' | 'p2p'>('internal');
    
    // Internal Transfer State
    const [fromWalletTypeCode, setFromWalletTypeCode] = useState('');
    const [toWalletTypeCode, setToWalletTypeCode] = useState('');
    const [internalAmount, setInternalAmount] = useState('');
    const [internalLoading, setInternalLoading] = useState(false);
    
    // P2P Transfer State
    const [p2pToUserId, setP2pToUserId] = useState('');
    const [p2pAmount, setP2pAmount] = useState('');
    const [p2pLoading, setP2pLoading] = useState(false);
    const [verifyingUser, setVerifyingUser] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState<{ id: string; name: string } | null>(null);

    // --- Parse Config ---
    const p2pSettings = walletConfig?.transactionSettings?.transfer || walletConfig?.transfer || { enabled: false };
    const walletTransferSettings = walletConfig?.transactionSettings?.walletTransfer || walletConfig?.walletTransfer || { enabled: false };

    // Get relevant wallets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allWallets: any[] = walletState?.wallets || [];
    
    // --- Internal Transfer Logic ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internalRules: any[] = walletTransferSettings.rules || [];
    
    const fromWallets = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allowed = new Set(internalRules.flatMap((r: any) => r.fromWalletTypeCodes || []));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return allWallets.filter((w: any) => allowed.has(w.walletTypeCode || w.typeCode));
    }, [internalRules, allWallets]);

    const toWallets = useMemo(() => {
        const allowed = new Set(
            internalRules
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((r: any) => (r.fromWalletTypeCodes || []).includes(fromWalletTypeCode))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .flatMap((r: any) => r.toWalletTypeCodes || [])
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return allWallets.filter((w: any) => allowed.has(w.walletTypeCode || w.typeCode) && (w.walletTypeCode || w.typeCode) !== fromWalletTypeCode);
    }, [internalRules, fromWalletTypeCode, allWallets]);

    const selectedRule = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return internalRules.find((r: any) => {
            const fromCodes = r.fromWalletTypeCodes || [];
            const toCodes = r.toWalletTypeCodes || [];
            return fromCodes.includes(fromWalletTypeCode) && toCodes.includes(toWalletTypeCode);
        });
    }, [internalRules, fromWalletTypeCode, toWalletTypeCode]);

    // Auto-select first available options
    useEffect(() => {
        if (!fromWalletTypeCode && fromWallets.length > 0) {
            setFromWalletTypeCode(fromWallets[0].walletTypeCode || fromWallets[0].typeCode);
        }
    }, [fromWalletTypeCode, fromWallets]);

    useEffect(() => {
        if (!toWalletTypeCode && toWallets.length > 0) {
            setToWalletTypeCode(toWallets[0].walletTypeCode || toWallets[0].typeCode);
        } else if (toWalletTypeCode && !toWallets.find((w: any) => (w.walletTypeCode || w.typeCode) === toWalletTypeCode)) {
            // Reset if no longer valid
            setToWalletTypeCode(toWallets.length > 0 ? (toWallets[0].walletTypeCode || toWallets[0].typeCode) : '');
        }
    }, [toWalletTypeCode, toWallets, fromWalletTypeCode]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceWallet = allWallets.find((w: any) => (w.walletTypeCode || w.typeCode) === fromWalletTypeCode);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetWallet = allWallets.find((w: any) => (w.walletTypeCode || w.typeCode) === toWalletTypeCode);

    const internalAmountNum = parseFloat(internalAmount) || 0;
    const internalMinAmount = walletTransferSettings.minAmount || 1;
    const internalMaxAmount = walletTransferSettings.maxAmount || 100000;
    
    const internalFeeValue = selectedRule?.feeEnabled ? (selectedRule.fee || 0) : 0;
    const internalFeeAmount = internalFeeValue > 0 
        ? (selectedRule?.feeType === 'FLAT' ? internalFeeValue : internalAmountNum * (internalFeeValue / 100)) 
        : 0;
        
    const internalFeeMode = selectedRule?.feeEnabled && internalFeeAmount > 0 ? (selectedRule.feeDeductionMode || 'extra') : 'none';
    const internalTotalDeduct = internalFeeMode === 'extra' ? internalAmountNum + internalFeeAmount : internalAmountNum;
    const internalCreditAmount = internalFeeMode === 'included' ? Math.max(0, internalAmountNum - internalFeeAmount) : internalAmountNum;
    const internalBalance = sourceWallet?.availableBalance || 0;

    const internalIsValid = !!fromWalletTypeCode && !!toWalletTypeCode && !!selectedRule &&
                           internalAmountNum >= internalMinAmount && 
                           internalAmountNum <= internalMaxAmount && 
                           internalTotalDeduct <= internalBalance &&
                           internalCreditAmount > 0;

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!internalIsValid) return;
        setInternalLoading(true);
        try {
            await walletApi.walletTransfer(fromWalletTypeCode, toWalletTypeCode, internalAmountNum);
            toast.success('Funds transferred successfully!');
            setInternalAmount('');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Transfer failed');
        } finally {
            setInternalLoading(false);
        }
    };

    // --- P2P Transfer Logic ---
    const p2pSourceCode = p2pSettings.sourceWalletTypeCode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p2pSourceWallet = p2pSourceCode ? allWallets.find((w: any) => (w.walletTypeCode || w.typeCode) === p2pSourceCode) : allWallets[0];
    
    const p2pAmountNum = parseFloat(p2pAmount) || 0;
    const p2pMinAmount = p2pSettings.minAmount || 1;
    const p2pMaxAmount = p2pSettings.maxAmount || 100000;
    const p2pFeeAmount = p2pSettings.feeType === 'PERCENTAGE' ? p2pAmountNum * ((p2pSettings.fee || 0) / 100) : (p2pSettings.fee || 0);
    const p2pTotalDeduct = p2pAmountNum + p2pFeeAmount;
    const p2pBalance = p2pSourceWallet?.availableBalance || 0;
    
    const p2pIsValid = p2pToUserId.trim().length > 0 && verifiedUser && p2pAmountNum >= p2pMinAmount && p2pAmountNum <= p2pMaxAmount && p2pTotalDeduct <= p2pBalance;

    const handleVerifyUser = async () => {
        if (!p2pToUserId.trim()) return;
        setVerifyingUser(true);
        try {
            const res = await authApi.checkUser(p2pToUserId.trim());
            if (res.exists) {
                setVerifiedUser({ id: p2pToUserId.trim(), name: res.name || 'Verified User' });
                toast.success('User verified');
            } else {
                toast.error('User not found');
            }
        } catch (error) {
            toast.error('Failed to verify user');
        } finally {
            setVerifyingUser(false);
        }
    };

    const handleP2PSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!p2pIsValid) return;
        setP2pLoading(true);
        try {
            await walletApi.transferP2P(p2pToUserId.trim(), p2pAmountNum, p2pSourceCode);
            toast.success('P2P Transfer successful!');
            setP2pAmount('');
            setP2pToUserId('');
            setVerifiedUser(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'P2P Transfer failed');
        } finally {
            setP2pLoading(false);
        }
    };

    const formatLabel = (code: string) => {
        if (!code) return '';
        return code.replace('_WALLET', '').replace('_', ' ');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transfer Funds" size="md">
            
            {/* Loading Config State */}
            {walletConfig === null ? (
                <div className="py-12 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-sm font-medium">Loading transfer settings...</p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border)] mb-6">
                        {walletTransferSettings.enabled && (
                            <button
                                onClick={() => setActiveTab('internal')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    activeTab === 'internal'
                                        ? 'border-[var(--primary)] text-[var(--primary)]'
                                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                <RefreshCw className="w-4 h-4" />
                                My Wallets
                            </button>
                        )}
                        {p2pSettings.enabled && (
                            <button
                                onClick={() => setActiveTab('p2p')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    activeTab === 'p2p'
                                        ? 'border-[var(--primary)] text-[var(--primary)]'
                                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                P2P Transfer
                            </button>
                        )}
                    </div>

                    {/* Content: Internal Transfer */}
                    {activeTab === 'internal' && walletTransferSettings.enabled && (
                        <form onSubmit={handleInternalSubmit} className="space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">From</label>
                                    <select
                                        value={fromWalletTypeCode}
                                        onChange={(e) => setFromWalletTypeCode(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                                        required
                                    >
                                        <option value="" disabled>Select Wallet</option>
                                        {fromWallets.map((w: any) => (
                                            <option key={w.walletTypeCode || w.typeCode} value={w.walletTypeCode || w.typeCode}>
                                                {formatLabel(w.walletTypeCode || w.typeCode)} - {formatCurrency(w.availableBalance || 0)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">To</label>
                                    <select
                                        value={toWalletTypeCode}
                                        onChange={(e) => setToWalletTypeCode(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                                        required
                                        disabled={!fromWalletTypeCode}
                                    >
                                        <option value="" disabled>Select Wallet</option>
                                        {toWallets.map((w: any) => (
                                            <option key={w.walletTypeCode || w.typeCode} value={w.walletTypeCode || w.typeCode}>
                                                {formatLabel(w.walletTypeCode || w.typeCode)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Transfer Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-[var(--muted-foreground)] font-medium">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={internalMinAmount}
                                        max={internalMaxAmount}
                                        value={internalAmount}
                                        onChange={(e) => setInternalAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                    Min: {formatCurrency(internalMinAmount)} | Max: {formatCurrency(internalMaxAmount)}
                                </p>
                            </div>

                            {internalAmountNum > 0 && selectedRule && (
                                <div className="rounded-xl p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 space-y-2 text-sm">
                                    <div className="flex justify-between text-[var(--foreground)]">
                                        <span>Transfer Amount</span>
                                        <span>{formatCurrency(internalAmountNum)}</span>
                                    </div>
                                    {selectedRule.feeEnabled && (
                                        <div className="flex justify-between text-red-500">
                                            <span>Fee ({selectedRule.feeType === 'PERCENTAGE' ? `${selectedRule.fee}%` : 'Fixed'})</span>
                                            <span>{formatCurrency(internalFeeAmount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-[var(--border)] flex justify-between font-bold text-[var(--foreground)]">
                                        <span>Total Deducted</span>
                                        <span>{formatCurrency(internalTotalDeduct)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-500">
                                        <span>Total Received</span>
                                        <span>{formatCurrency(internalCreditAmount)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!internalIsValid || internalLoading}
                                className="w-full py-3 px-4 bg-[var(--color-primary)] hover:opacity-90 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {internalLoading ? 'Processing...' : 'Transfer Funds'}
                            </button>
                        </form>
                    )}

                    {/* Content: P2P Transfer */}
                    {activeTab === 'p2p' && p2pSettings.enabled && (
                        <form onSubmit={handleP2PSubmit} className="space-y-5">
                            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Source: {formatLabel(p2pSourceCode || p2pSourceWallet?.walletTypeCode || 'Wallet')}</p>
                                <p className="font-bold text-xl text-[var(--foreground)]">{formatCurrency(p2pBalance)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Recipient User ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={p2pToUserId}
                                        onChange={(e) => {
                                            setP2pToUserId(e.target.value);
                                            setVerifiedUser(null);
                                        }}
                                        placeholder="Enter User ID"
                                        className="flex-1 px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow uppercase"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyUser}
                                        disabled={!p2pToUserId.trim() || verifyingUser || !!verifiedUser}
                                        className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                    >
                                        {verifyingUser ? <LoadingSpinner size="sm" /> : (verifiedUser ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : 'Verify')}
                                    </button>
                                </div>
                                {verifiedUser && (
                                    <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Sending to: {verifiedUser.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Transfer Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-[var(--muted-foreground)] font-medium">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={p2pMinAmount}
                                        max={p2pMaxAmount}
                                        value={p2pAmount}
                                        onChange={(e) => setP2pAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                    Min: {formatCurrency(p2pMinAmount)} | Max: {formatCurrency(p2pMaxAmount)}
                                </p>
                            </div>

                            {p2pAmountNum > 0 && verifiedUser && (
                                <div className="rounded-xl p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 space-y-2 text-sm">
                                    <div className="flex justify-between text-[var(--foreground)]">
                                        <span>Amount to Send</span>
                                        <span>{formatCurrency(p2pAmountNum)}</span>
                                    </div>
                                    {p2pSettings.fee > 0 && (
                                        <div className="flex justify-between text-red-500">
                                            <span>Network Fee ({p2pSettings.feeType === 'PERCENTAGE' ? `${p2pSettings.fee}%` : 'Fixed'})</span>
                                            <span>{formatCurrency(p2pFeeAmount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-[var(--border)] flex justify-between font-bold text-[var(--foreground)]">
                                        <span>Total Deducted</span>
                                        <span>{formatCurrency(p2pTotalDeduct)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!p2pIsValid || p2pLoading}
                                className="w-full py-3 px-4 bg-[var(--color-primary)] hover:opacity-90 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {p2pLoading ? 'Processing...' : 'Send Funds'}
                            </button>
                        </form>
                    )}

                    {/* Missing config states */}
                    {activeTab === 'internal' && !walletTransferSettings.enabled && (
                        <div className="text-center py-8 text-[var(--muted-foreground)]">
                            <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Internal wallet transfers are currently disabled.</p>
                        </div>
                    )}
                    
                    {activeTab === 'p2p' && !p2pSettings.enabled && (
                        <div className="text-center py-8 text-[var(--muted-foreground)]">
                            <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>P2P transfers are currently disabled.</p>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
}
