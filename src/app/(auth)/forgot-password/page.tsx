'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Key, Loader2, CheckCircle2 } from 'lucide-react';
import AppBrand from '@/components/ui/AppBrand';
import { authApi } from '@/lib/api/services';
import { useAppDispatch } from '@/lib/store/hooks';
import { loginSuccess } from '@/lib/store/slices/authSlice';

const step1Schema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    vaultKey: z
        .string()
        .min(1, 'Recovery Key is required')
        .regex(/^VLT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Format: VLT-XXXX-XXXX-XXXX'),
});
const step2Schema = z
    .object({
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(1, 'Confirm your password'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

function ForgotPasswordForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const step1Form = useForm<Step1FormData>({ resolver: zodResolver(step1Schema) });
    const step2Form = useForm<Step2FormData>({ resolver: zodResolver(step2Schema) });

    const onStep1Submit = async (data: Step1FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const { resetToken: token } = await authApi.verifyVault(data.userId.trim(), data.vaultKey.trim());
            setResetToken(token);
            setStep(2);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid User ID or Recovery Key. Please check and try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const onStep2Submit = async (data: Step2FormData) => {
        if (!resetToken) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await authApi.resetPassword(resetToken, data.newPassword);
            const auth = result && typeof result === 'object' && 'data' in result ? (result as { data?: { accessToken?: string; refreshToken?: string; user?: unknown } }).data : null;
            if (auth?.accessToken && auth?.refreshToken && auth?.user) {
                dispatch(loginSuccess(result as Parameters<typeof loginSuccess>[0]));
                setStep(3);
                toast.success('Password reset successful! Logging you in...');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                setStep(3);
                toast.success('Password reset successful!');
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed. Please start over.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        setStep(1);
        setResetToken(null);
        setError(null);
        step1Form.reset();
        step2Form.reset();
    };

    return (
        <div className="relative flex-1 flex items-center justify-center py-6 pb-20 md:pb-12 sm:py-8 md:py-12 px-4 overflow-x-hidden">
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--pw-primary)]/25 to-violet-500/25 border border-[var(--pw-primary)]/30 flex items-center justify-center text-[var(--pw-primary)]">
                        <Key className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--foreground)] mb-1.5">
                        Reset Password
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Use your Recovery Key to recover your <AppBrand size="md" /> account
                    </p>
                </div>

                <div className="auth-panel rounded-2xl p-5 sm:p-6 md:p-8">
                    {step === 1 && (
                        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
                            <div>
                                <label htmlFor="userId" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    User ID
                                </label>
                                <input
                                    {...step1Form.register('userId')}
                                    type="text"
                                    id="userId"
                                    className="premium-input w-full text-base"
                                    placeholder="e.g. USR-00001"
                                    autoComplete="username"
                                />
                                {step1Form.formState.errors.userId && (
                                    <p className="mt-1 text-xs text-red-500">{step1Form.formState.errors.userId.message}</p>
                                )}
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Found on your registration confirmation</p>
                            </div>
                            <div>
                                <label htmlFor="vaultKey" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Recovery Key
                                </label>
                                <input
                                    {...step1Form.register('vaultKey')}
                                    type="text"
                                    id="vaultKey"
                                    className="premium-input w-full text-base font-mono"
                                    placeholder="VLT-XXXX-XXXX-XXXX"
                                    autoComplete="off"
                                />
                                {step1Form.formState.errors.vaultKey && (
                                    <p className="mt-1 text-xs text-red-500">{step1Form.formState.errors.vaultKey.message}</p>
                                )}
                                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                            </div>
                            <button type="submit" disabled={isLoading} className="premium-btn-primary w-full py-3 text-sm sm:text-base font-semibold">
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Key size={18} /> Continue
                                    </span>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
                            <button type="button" onClick={goBack} className="text-xs font-medium text-[var(--pw-primary)] hover:opacity-80 flex items-center gap-1">
                                ← Use different User ID or Recovery Key
                            </button>
                            <div className="p-3 rounded-xl bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20 text-xs text-[var(--foreground)]">
                                Recovery Key verified. Set your new password below.
                            </div>
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...step2Form.register('newPassword')}
                                        type={showPassword ? 'text' : 'password'}
                                        id="newPassword"
                                        className="premium-input w-full pr-11 text-base"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {step2Form.formState.errors.newPassword && (
                                    <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...step2Form.register('confirmPassword')}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        className="premium-input w-full pr-11 text-base"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {step2Form.formState.errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <button type="submit" disabled={isLoading} className="premium-btn-primary w-full py-3 text-sm sm:text-base font-semibold">
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Resetting...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Password Reset Successful</h2>
                            <p className="text-sm text-[var(--muted-foreground)] mb-4">You will be redirected shortly...</p>
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--pw-primary)]" />
                        </div>
                    )}

                    <div className="mt-5 text-center">
                        <p className="text-sm text-[var(--muted-foreground)]">
                            Remember your password?{' '}
                            <Link href="/login" className="font-semibold text-[var(--pw-primary)] hover:opacity-80">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--pw-primary)]" />
            </div>
        }>
            <ForgotPasswordForm />
        </Suspense>
    );
}
