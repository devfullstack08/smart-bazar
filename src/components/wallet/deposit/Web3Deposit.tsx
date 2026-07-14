'use client';

import { WalletWeb3Crypto } from '../WalletWeb3Crypto';
import { IPaymentConfig } from '@/types/paymentConfig';

interface Web3DepositProps {
    paymentMethods: IPaymentConfig;
    availableBalance: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function Web3Deposit({
    paymentMethods,
    availableBalance,
    onSuccess,
    onCancel,
}: Web3DepositProps) {
    return (
        <div className="space-y-4">
            <WalletWeb3Crypto
                mode="deposit"
                paymentMethods={paymentMethods}
                availableBalance={availableBalance}
                onSuccess={onSuccess}
                onClose={onCancel}
            />
            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
