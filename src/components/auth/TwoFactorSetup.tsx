import { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { twoFactorApi } from '@/lib/api/services';
import toast from 'react-hot-toast';

export function TwoFactorSetup() {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
    const [secretCode, setSecretCode] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [checking, setChecking] = useState(true);
    const [isProjectEnabled, setIsProjectEnabled] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            // we use 'withdraw' action just to test if 2FA is globally enabled for the user
            const validation = await twoFactorApi.validateAction('withdraw');
            setIsEnabled(validation.require2FA);
            if (validation.projectEnabled === false) {
                setIsProjectEnabled(false);
            }
        } catch (error) {
            console.error('Failed to check 2FA status', error);
        } finally {
            setChecking(false);
        }
    };

    const handleBeginSetup = async () => {
        setIsSettingUp(true);
        try {
            const data = await twoFactorApi.setup();
            setQrCodeDataURL(data.qrCodeUrl); // Using qrCodeUrl from the backend response
            setSecretCode(data.secret);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to initialize 2FA setup');
            setIsSettingUp(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (!token || token.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setVerifying(true);
        try {
            await twoFactorApi.verifySetup(token);
            toast.success('Two-Factor Authentication successfully enabled!');
            setIsEnabled(true);
            setIsSettingUp(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Invalid code. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    if (checking) return null; // or a skeleton
    if (!isProjectEnabled) return null; // fully hidden if project admin disabled it

    return (
        <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
            <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <Shield className="text-[var(--pw-primary)]" size={20} />
                Two-Factor Authentication (2FA)
            </h3>

            {isEnabled ? (
                <div className="flex items-start justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                        <div>
                            <p className="font-semibold text-emerald-500">2FA is Enabled</p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Your account is secured with Google Authenticator.</p>
                        </div>
                    </div>
                </div>
            ) : !isSettingUp ? (
                <div>
                    <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <p className="font-semibold text-amber-500">Enhance your account security</p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Protect your account and secure your withdrawals by enabling Two-Factor Authentication via Google Authenticator.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBeginSetup}
                        className="btn btn-primary px-4 py-2 flex items-center gap-2 font-semibold rounded-xl text-sm"
                    >
                        <Shield size={16} /> Enable 2FA
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-sm text-[var(--muted-foreground)]">Follow these steps to enable 2FA on your account:</p>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Step 1: Scan QR */}
                        <div className="flex-1 space-y-4">
                            <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                                <span className="bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                Scan QR Code
                            </h4>
                            <p className="text-sm text-[var(--muted-foreground)]">Open Google Authenticator on your mobile device and scan this QR code.</p>
                            {qrCodeDataURL ? (
                                <div className="bg-white p-3 rounded-lg w-fit">
                                    <img src={qrCodeDataURL} alt="2FA QR Code" className="w-40 h-40" />
                                </div>
                            ) : (
                                <div className="w-40 h-40 bg-gray-200/20 animate-pulse rounded-lg" />
                            )}
                            {secretCode && (
                                <p className="text-xs text-[var(--muted-foreground)] break-all mt-2 max-w-[200px]">
                                    Or enter manually:<br />
                                    <span className="font-mono text-[var(--foreground)] font-semibold">{secretCode}</span>
                                </p>
                            )}
                        </div>

                        {/* Step 2: Enter Code */}
                        <div className="flex-1 space-y-4">
                            <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                                <span className="bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                Verify Code
                            </h4>
                            <p className="text-sm text-[var(--muted-foreground)]">Enter the 6-digit verification code generated by the app.</p>
                            <div>
                                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">6-Digit Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="000000"
                                    className="w-full max-w-[200px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-lg tracking-widest font-mono focus:ring-2 focus:ring-[var(--pw-primary)]"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleVerifyAndEnable}
                                    disabled={verifying || token.length !== 6}
                                    className="btn btn-primary px-4 py-2 font-semibold rounded-xl text-sm disabled:opacity-50"
                                >
                                    {verifying ? 'Verifying...' : 'Verify & Enable'}
                                </button>
                                <button
                                    onClick={() => setIsSettingUp(false)}
                                    className="px-4 py-2 font-semibold rounded-xl text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
