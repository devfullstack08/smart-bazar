'use client';

import { IPaymentConfig } from '@/types/paymentConfig';
import { WalletWeb3Crypto } from '../WalletWeb3Crypto';

interface Web3WithdrawalProps {
    paymentMethods: IPaymentConfig;
    availableBalance: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function Web3Withdrawal({
    paymentMethods,
    availableBalance,
    onSuccess,
    onCancel,
}: Web3WithdrawalProps) {
    return (
        <div className="space-y-4">
            <WalletWeb3Crypto
                mode="withdraw"
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
