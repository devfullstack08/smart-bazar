import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface TwoFactorVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: (token: string) => void;
    actionDescription?: string;
}

export function TwoFactorVerificationModal({
    isOpen,
    onClose,
    onVerified,
    actionDescription = 'complete this action'
}: TwoFactorVerificationModalProps) {
    const [token, setToken] = useState('');

    // Reset token when modal opens
    useEffect(() => {
        if (isOpen) {
            setToken('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token || token.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        // Pass the token back to the parent to append to the request body/headers
        onVerified(token);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Two-Factor Authentication"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] rounded-full flex items-center justify-center">
                        <Shield size={32} />
                    </div>
                    <div>
                        <p className="text-[var(--foreground)] font-medium">Verify your identity</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-2">
                            Enter the 6-digit code from your Google Authenticator app to {actionDescription}.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block pl-1 text-sm font-medium text-[var(--foreground)] text-center">
                        Authenticator Code
                    </label>
                    <input
                        type="text"
                        maxLength={6}
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000 000"
                        className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/50 transition-shadow"
                        autoFocus
                        required
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={token.length !== 6}
                        className="flex-1 py-3 px-4 rounded-xl bg-[var(--pw-primary)] text-[#0A2540] font-bold hover:bg-[var(--pw-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Verify Code
                    </button>
                </div>
            </form>
        </Modal>
    );
}
