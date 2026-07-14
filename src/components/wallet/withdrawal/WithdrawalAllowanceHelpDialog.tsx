'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface WithdrawalAllowanceHelpDialogProps {
    open: boolean;
    onClose: () => void;
}

export function WithdrawalAllowanceHelpDialog({ open, onClose }: WithdrawalAllowanceHelpDialogProps) {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <h3 className="text-base font-semibold text-foreground">Withdrawal Allowance</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-white/10 hover:text-foreground"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-4 py-3 text-sm leading-6 text-text-muted">
                    <p>
                        Withdrawal allowance is the on-chain permission that controls how much can be withdrawn from the Web3 contract.
                    </p>
                    <p className="mt-3">
                        Your withdrawal wallet balance is stored in the system. The allowance is stored on-chain. When both are aligned, withdrawals stay within the balance allowed for your account.
                    </p>
                    <p className="mt-3">
                        Refresh asks the system to sync the on-chain allowance with your withdrawal wallet balance. It can take time because it sends a blockchain transaction.
                    </p>
                    <p className="mt-3">
                        This helps protect withdrawals by keeping the contract limit controlled instead of leaving unlimited access.
                    </p>
                    <p className="mt-3">
                        Example: if your withdrawal wallet has 100 and allowance is 40, you can withdraw up to 40 until allowance is refreshed.
                    </p>
                    <p className="mt-3">
                        If refresh fails, wait and try again later. If it keeps failing, contact admin support.
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}
