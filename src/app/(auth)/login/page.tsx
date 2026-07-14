'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft } from 'lucide-react';
import AppBrand from '@/components/ui/AppBrand';
import FloatingUpcomingFeatures from '@/components/ui/FloatingUpcomingFeatures';
import { useAppDispatch } from '@/lib/store/hooks';
import { loginStart, loginSuccess, loginFailure } from '@/lib/store/slices/authSlice';
import { authApi } from '@/lib/api/services';
import { REMEMBER_ME_KEY } from '@/constants';

const step1Schema = z.object({
    emailOrUserId: z.string().min(1, 'Email or User ID is required'),
});

const step2Schema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

function LoginForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [verifiedUser, setVerifiedUser] = useState<{ emailOrUserId: string; name: string } | null>(null);
    const [checkError, setCheckError] = useState<string | null>(null);

    const getRememberedEmailOrUserId = () => {
        if (typeof window !== 'undefined') return localStorage.getItem(REMEMBER_ME_KEY) || '';
        return '';
    };

    const step1Form = useForm<Step1FormData>({
        resolver: zodResolver(step1Schema),
        defaultValues: { emailOrUserId: getRememberedEmailOrUserId() },
    });

    const step2Form = useForm<Step2FormData>({
        resolver: zodResolver(step2Schema),
        defaultValues: { rememberMe: !!getRememberedEmailOrUserId() },
    });

    useEffect(() => {
        const v = getRememberedEmailOrUserId();
        if (v) {
            step1Form.setValue('emailOrUserId', v);
            step2Form.setValue('rememberMe', true);
        }
    }, [step1Form, step2Form]);

    const onStep1Submit = async (data: Step1FormData) => {
        setIsLoading(true);
        setCheckError(null);
        try {
            const result = await authApi.checkUser(data.emailOrUserId);
            if (result.exists) {
                setVerifiedUser({ emailOrUserId: data.emailOrUserId, name: result.name || 'User' });
                setStep(2);
                step2Form.reset({ password: '', rememberMe: step2Form.getValues('rememberMe') });
            } else {
                setCheckError('No account found with this email or User ID. Please check and try again.');
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setCheckError(msg || 'Unable to verify user. Please check your email/User ID and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onStep2Submit = async (data: Step2FormData) => {
        if (!verifiedUser) return;
        setIsLoading(true);
        dispatch(loginStart());
        try {
            const response = await authApi.login(verifiedUser.emailOrUserId, data.password);
            if (typeof window !== 'undefined') {
                if (data.rememberMe) localStorage.setItem(REMEMBER_ME_KEY, verifiedUser.emailOrUserId);
                else localStorage.removeItem(REMEMBER_ME_KEY);
            }
            dispatch(loginSuccess(response));
            toast.success('Login successful!');
            router.push('/dashboard');
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            dispatch(loginFailure(message));
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        setStep(1);
        setVerifiedUser(null);
        setCheckError(null);
    };

    return (
        // flex-1: take exactly the auth content area so no extra scroll; center form. pb-20 for mobile feature strip
        <div className="relative flex-1 flex items-center justify-center py-6 pb-20 md:pb-12 sm:py-8 md:py-12 px-4 overflow-x-hidden">
            {/* Desktop floating pills */}
            <FloatingUpcomingFeatures showFrom="md" />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--pw-primary)]/25 to-violet-500/25 border border-[var(--pw-primary)]/30 flex items-center justify-center text-[var(--pw-primary)]">
                        <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--foreground)] mb-1.5">
                        Welcome back
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Sign in to your <AppBrand size="md" /> account
                    </p>
                </div>

                {/* Form card */}
                <div className="auth-panel rounded-2xl p-5 sm:p-6 md:p-8">
                    {step === 1 ? (
                        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
                            <div>
                                <label htmlFor="emailOrUserId" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Email or User ID
                                </label>
                                <input
                                    {...step1Form.register('emailOrUserId')}
                                    type="text"
                                    id="emailOrUserId"
                                    autoComplete="username"
                                    className="premium-input w-full text-base"
                                    placeholder="you@example.com or USER123"
                                />
                                {step1Form.formState.errors.emailOrUserId && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {step1Form.formState.errors.emailOrUserId.message}
                                    </p>
                                )}
                                {checkError && (
                                    <p className="mt-1 text-xs text-red-500">{checkError}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="premium-btn-primary w-full py-3 text-sm sm:text-base font-semibold"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Checking...
                                    </span>
                                ) : 'Continue'}
                            </button>
                            <p className="text-center">
                                <Link href="/forgot-password" className="text-sm font-medium text-[var(--pw-primary)] hover:opacity-80">
                                    Forgot password?
                                </Link>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
                            {/* Verified user badge */}
                            {verifiedUser && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20">
                                    <div className="w-8 h-8 rounded-full bg-[var(--pw-primary)]/20 border border-[var(--pw-primary)]/30 flex items-center justify-center text-[var(--pw-primary)] shrink-0 text-sm font-bold">
                                        {verifiedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{verifiedUser.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] truncate">{verifiedUser.emailOrUserId}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="shrink-0 text-xs text-[var(--pw-primary)] hover:opacity-80 flex items-center gap-1"
                                    >
                                        <ArrowLeft size={12} /> Change
                                    </button>
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...step2Form.register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        className="premium-input w-full pr-11 text-base"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {step2Form.formState.errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {step2Form.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        {...step2Form.register('rememberMe')}
                                        type="checkbox"
                                        className="w-4 h-4 shrink-0 text-[var(--pw-primary)] border-[var(--border)] rounded focus:ring-[var(--pw-primary)]/50"
                                    />
                                    <span className="text-sm text-[var(--foreground)]">Remember me</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-[var(--pw-primary)] hover:opacity-80 shrink-0"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="premium-btn-primary w-full py-3 text-sm sm:text-base font-semibold"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </form>
                    )}

                    <div className="mt-5 text-center">
                        <p className="text-sm text-[var(--muted-foreground)]">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-semibold text-[var(--pw-primary)] hover:opacity-80">
                                Register now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--pw-primary)]" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}