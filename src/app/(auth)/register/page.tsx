'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Loader2, Copy, Check, Download, ShoppingBag, TrendingUp, Award } from 'lucide-react';
import { authApi } from '@/lib/api/services';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, APP_CONSTANTS } from '@/constants';

const registerSchema = z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    countryCode: z.string().min(1, 'Country code is required'),
    phone: z.string().min(7, 'Phone number must be at least 7 digits').max(15, 'Phone number is too long'),
    walletAddress: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    sponsorId: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sponsorValid, setSponsorValid] = useState<boolean | null>(null);
    const [isValidatingSponsor, setIsValidatingSponsor] = useState(false);
    const [sponsorName, setSponsorName] = useState<string | null>(null);
    const [registrationSuccess, setRegistrationSuccess] = useState<{
        userId: string;
        email: string;
        name: string;
        password: string;
        walletAddress?: string;
        vaultUserId?: string;
        vaultKey?: string;
    } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const isInitialLoadRef = useRef(true);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setError,
        clearErrors,
        setValue,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { countryCode: DEFAULT_COUNTRY_CODE },
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = sessionStorage.getItem('registerFormData');
            if (savedData) {
                try {
                    const formData = JSON.parse(savedData);
                    isInitialLoadRef.current = true;
                    Object.keys(formData).forEach((key) => {
                        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
                            setValue(key as keyof RegisterFormData, formData[key], {
                                shouldDirty: true,
                                shouldValidate: false,
                            });
                        }
                    });
                    setTimeout(() => { isInitialLoadRef.current = false; }, 100);
                } catch (error) {
                    console.error('Error loading saved form data:', error);
                    isInitialLoadRef.current = false;
                }
            } else {
                isInitialLoadRef.current = false;
            }
        }
    }, [setValue]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const subscription = watch((formData) => {
                if (isInitialLoadRef.current) return;
                const dataToSave = {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    countryCode: formData.countryCode,
                    sponsorId: formData.sponsorId,
                    password: formData.password || '',
                    confirmPassword: formData.confirmPassword || '',
                };
                sessionStorage.setItem('registerFormData', JSON.stringify(dataToSave));
            });
            return () => subscription.unsubscribe();
        }
    }, [watch]);

    const sponsorId = watch('sponsorId');
    const password = watch('password');

    const validateSponsor = useCallback(async (id: string) => {
        if (!id) {
            setSponsorValid(null);
            setSponsorName(null);
            clearErrors('sponsorId');
            return;
        }
        setIsValidatingSponsor(true);
        try {
            const res = await authApi.validateSponsor(id);
            if (res?.isValid) {
                setSponsorValid(true);
                setSponsorName(res.sponsorName ?? null);
                clearErrors('sponsorId');
            } else {
                setSponsorValid(false);
                setSponsorName(null);
            }
        } catch {
            setSponsorValid(false);
            setSponsorName(null);
        } finally {
            setIsValidatingSponsor(false);
        }
    }, [clearErrors]);

    useEffect(() => {
        const querySponsor = searchParams.get('sponsor');
        if (querySponsor) {
            setValue('sponsorId', querySponsor);
            validateSponsor(querySponsor);
        }
    }, [searchParams, setValue, validateSponsor]);

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            if (data.sponsorId) {
                const check = await authApi.validateSponsor(data.sponsorId);
                if (!check?.isValid) {
                    setSponsorValid(false);
                    setSponsorName(null);
                    setError('sponsorId', { type: 'manual', message: 'Sponsor ID is invalid' });
                    setIsLoading(false);
                    return;
                }
            }

            const hexChars = '0123456789abcdef';
            let mockWalletAddress = '0x';
            for (let i = 0; i < 40; i++) {
                mockWalletAddress += hexChars[Math.floor(Math.random() * 16)];
            }

            const response = await authApi.register({
                name: data.fullName,
                email: data.email,
                phone: `${data.countryCode}${data.phone}`,
                walletAddress: mockWalletAddress,
                password: data.password,
                sponsorId: data.sponsorId || undefined,
            });

            if (response?.user) {
                sessionStorage.removeItem('registerFormData');
                setRegistrationSuccess({
                    userId: response.user.userId,
                    email: response.user.email,
                    name: response.user.name,
                    password: data.password,
                    walletAddress: response.user.walletAddress || undefined,
                    vaultUserId: response.vaultUserId || undefined,
                    vaultKey: response.vaultKey || undefined,
                });
                toast.success('Registration successful!');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const getPasswordStrength = () => {
        if (!password) return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength();

    const renderSuccessCard = () => {
        if (!registrationSuccess) return null;
        const creds = registrationSuccess;

        const CredentialRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
            <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-700/50">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">{label}</span>
                    <button
                        type="button"
                        onClick={() => copyToClipboard(value, field)}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-800/40 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-700/40 transition-colors"
                    >
                        {copiedField === field ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === field ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <code className="w-full break-all font-mono text-sm text-gray-900 dark:text-white bg-white/60 dark:bg-white/5 px-2.5 py-1.5 rounded-lg">
                    {value}
                </code>
            </div>
        );

        return (
            <div className="border border-[var(--border)] bg-[var(--surface-elevated)] auth-panel rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)]">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-2">Registration Successful!</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Screenshot or save these credentials — you'll need them to log in.
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <CredentialRow label="User ID (Username)" value={creds.userId} field="userId" />
                    <CredentialRow label="Email Address" value={creds.email} field="email" />
                    <CredentialRow label="Password" value={creds.password} field="password" />

                    {creds.vaultUserId && creds.vaultKey && (
                        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 mt-4">
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                Secure Recovery Vault Key Created
                            </h4>
                            <p className="text-[11px] text-[var(--muted-foreground)] mb-3 leading-relaxed">
                                A personal credentials backup key has been initialized. Copy and write this key down in a safe offline location.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(creds.vaultKey!, 'vaultKey')}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[var(--pw-primary)] bg-[var(--pw-primary)]/15 rounded-lg hover:bg-[var(--pw-primary)]/25 transition-colors"
                                >
                                    {copiedField === 'vaultKey' ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedField === 'vaultKey' ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const txt = `User ID: ${creds.vaultUserId}\nVault Key: ${creds.vaultKey}\n\nSave this. We cannot recover it for you.`;
                                        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'vault-credentials.txt';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[var(--pw-primary)] bg-[var(--pw-primary)]/15 rounded-lg hover:bg-[var(--pw-primary)]/25 transition-colors"
                                >
                                    <Download size={12} /> Save .txt
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">Save this. We cannot recover it for you.</p>
                        </div>
                    )}

                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-5 text-center">
                        Keep your password safe and do not share it with anyone.
                    </p>
                    <Link
                        href="/login"
                        className="block w-full py-3 rounded-xl font-semibold text-center bg-[var(--pw-primary)] text-[#050508] hover:opacity-90 transition-opacity"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col lg:flex-row w-full min-h-full relative">
            {/* Left side: Full-Bleed Logo Branding Column (Sticky on scroll) */}
            <div 
                className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white sticky top-0"
                style={{ height: 'calc(100vh - 53px)' }}
            >
                {/* Subtle soft gradient over the white to give it premium depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-zinc-100 dark:from-zinc-100 dark:to-zinc-300 z-0 pointer-events-none" />
                <img
                    src={APP_CONSTANTS.APP_LOGO_URL}
                    className="absolute inset-0 w-full h-full object-contain p-8 lg:p-16 xl:p-20 z-10 mix-blend-multiply"
                    alt="Smart Bazar Logo"
                />
            </div>

            {/* Right side: Registration Form Panel (Transparent, Scrollable) */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-transparent min-h-full relative">
                <div className="w-full max-w-3xl my-auto">
                    {registrationSuccess ? (
                        renderSuccessCard()
                    ) : (
                        <div className="bg-transparent relative overflow-hidden">
                            
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 relative z-10">
                                {/* Header */}
                                <div className="mb-6 sm:mb-10 text-left">
                                    <img
                                        src={APP_CONSTANTS.APP_LOGO_URL}
                                        className="h-10 w-auto object-contain mb-6 lg:hidden"
                                        alt="Smart Bazar Logo"
                                    />
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                                        Create Account
                                    </h1>
                                    <p className="text-sm text-[var(--muted-foreground)] mt-2">Register a new affiliate profile on Smart Bazar</p>
                                </div>

                            {/* ── Personal Information ── */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {/* Full Name */}
                                        <div>
                                            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                                Full Name
                                            </label>
                                            <input
                                                {...register('fullName')}
                                                type="text"
                                                id="fullName"
                                                className="premium-input w-full text-base"
                                                placeholder="John Doe"
                                                autoComplete="name"
                                            />
                                            {errors.fullName && (
                                                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                                Email Address
                                            </label>
                                            <input
                                                {...register('email')}
                                                type="email"
                                                id="email"
                                                className="premium-input w-full text-base"
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                            )}
                                        </div>

                                        {/* Phone — full width */}
                                        <div className="sm:col-span-2">
                                            <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                                Phone Number
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    {...register('countryCode')}
                                                    defaultValue={DEFAULT_COUNTRY_CODE}
                                                    className="shrink-0 w-[5.5rem] sm:w-28 px-2 sm:px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--pw-primary)]/40 text-sm"
                                                >
                                                    {COUNTRY_CODES.map((country) => (
                                                        <option key={country.code} value={country.dialCode}>
                                                            {country.flag} {country.dialCode}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    {...register('phone')}
                                                    type="tel"
                                                    id="phone"
                                                    inputMode="numeric"
                                                    className="premium-input flex-1 min-w-0 text-base"
                                                    placeholder="1234567890"
                                                    autoComplete="tel-national"
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── MLM Information ── */}
                                <div className="border-t border-[var(--border)] pt-5">
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                                        MLM Information
                                    </h3>
                                    <div>
                                        <label htmlFor="sponsorId" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                            Sponsor ID{' '}
                                            <span className="text-[var(--muted-foreground)] font-normal text-xs">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('sponsorId')}
                                                type="text"
                                                id="sponsorId"
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    if (value.length >= 3) validateSponsor(value);
                                                }}
                                                className="premium-input w-full pr-10 text-base"
                                                placeholder="Enter sponsor ID"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {isValidatingSponsor ? (
                                                    <Loader2 className="w-5 h-5 text-[var(--pw-primary)] animate-spin" />
                                                ) : sponsorValid === true ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : sponsorValid === false ? (
                                                    <span className="text-red-500 text-lg leading-none">✗</span>
                                                ) : null}
                                            </div>
                                        </div>
                                        {errors.sponsorId && (
                                            <p className="mt-1 text-xs text-red-500">{errors.sponsorId.message}</p>
                                        )}
                                        {sponsorValid === false && !errors.sponsorId && (
                                            <p className="mt-1 text-xs text-red-500">Invalid sponsor ID</p>
                                        )}
                                        {sponsorValid === true && (
                                            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                                                <CheckCircle2 size={12} />
                                                {sponsorName ? <>Valid sponsor: <span className="font-semibold">{sponsorName}</span></> : 'Valid sponsor ID'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ── Security ── */}
                                <div className="border-t border-[var(--border)] pt-5">
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                                        Security
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {/* Password */}
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register('password')}
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    className="premium-input w-full pr-11"
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
                                            {password && (
                                                <div className="mt-2">
                                                    <div className="flex gap-1 mb-1">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200 dark:bg-white/10'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-[var(--muted-foreground)]">{passwordStrength.label}</p>
                                                </div>
                                            )}
                                            {errors.password && (
                                                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                            )}
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register('confirmPassword')}
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    id="confirmPassword"
                                                    className="premium-input w-full pr-11"
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
                                            {errors.confirmPassword && (
                                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Terms ── */}
                                <div className="border-t border-[var(--border)] pt-5">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            {...register('acceptTerms')}
                                            type="checkbox"
                                            className="w-4 h-4 shrink-0 mt-0.5 text-[var(--pw-primary)] border-[var(--border)] rounded focus:ring-[var(--pw-primary)]/50"
                                        />
                                        <span className="text-sm text-[var(--foreground)] leading-relaxed text-left">
                                            I accept the{' '}
                                            <Link href="/terms" className="text-[var(--pw-primary)] hover:opacity-80 font-medium underline-offset-2 hover:underline">
                                                Terms and Conditions
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" className="text-[var(--pw-primary)] hover:opacity-80 font-medium underline-offset-2 hover:underline">
                                                Privacy Policy
                                            </Link>
                                        </span>
                                    </label>
                                    {errors.acceptTerms && (
                                        <p className="mt-1 text-xs text-red-500">{errors.acceptTerms.message}</p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading || (!!sponsorId && sponsorId.trim().length > 0 && sponsorValid === false)}
                                    className="premium-btn-primary w-full py-3 text-sm sm:text-base font-semibold"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating Account...
                                        </span>
                                    ) : 'Create Account'}
                                </button>
                            </form>

                            <div className="mt-5 text-center">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Already have an account?{' '}
                                    <Link href="/login" className="font-semibold text-[var(--pw-primary)] hover:opacity-80">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--pw-primary)]" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}