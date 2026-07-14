'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, CheckCircle2, Loader2, Copy, Check, Download } from 'lucide-react';
import AppBrand from '@/components/ui/AppBrand';
import { authApi } from '@/lib/api/services';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '@/constants';

const registerSchema = z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    countryCode: z.string().min(1, 'Country code is required'),
    phone: z.string().min(7, 'Phone number must be at least 7 digits').max(15, 'Phone number is too long'),
    walletAddress: z.string().trim().min(1, 'Wallet address is required').regex(/^0x[a-fA-F0-9]{40}$/, 'Enter a valid wallet address'),
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

    const password = watch('password');
    const sponsorId = watch('sponsorId');

    const validateSponsor = useCallback(async (id: string) => {
        if (!id || id.trim().length < 3) {
            setSponsorValid(null);
            setSponsorName(null);
            setIsValidatingSponsor(false);
            clearErrors('sponsorId');
            return;
        }
        setIsValidatingSponsor(true);
        setSponsorValid(null);
        setSponsorName(null);
        try {
            const response = await authApi.validateSponsor(id.trim());
            const isValid = response?.valid ?? response?.success ?? response?.data?.valid ?? false;
            const sponsorData = response?.data || response;
            if (isValid) {
                setSponsorValid(true);
                const name = sponsorData?.sponsor?.name || sponsorData?.name || sponsorData?.fullName || sponsorData?.user?.name || sponsorData?.user?.fullName || null;
                setSponsorName(name);
                clearErrors('sponsorId');
            } else {
                setSponsorValid(false);
                setSponsorName(null);
                setError('sponsorId', { type: 'manual', message: 'Invalid sponsor ID. Please check and try again.' });
            }
        } catch (error: any) {
            setSponsorValid(false);
            setSponsorName(null);
            setError('sponsorId', { type: 'manual', message: error.response?.data?.message || 'Invalid sponsor ID' });
        } finally {
            setIsValidatingSponsor(false);
        }
    }, [setError, clearErrors]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const sponsorFromUrl = searchParams.get('sponsor');
            if (sponsorFromUrl && sponsorFromUrl.trim().length >= 3) {
                const currentSponsorId = watch('sponsorId');
                if (!currentSponsorId || currentSponsorId.trim() === '') {
                    setValue('sponsorId', sponsorFromUrl.trim(), { shouldDirty: true, shouldValidate: false });
                    validateSponsor(sponsorFromUrl.trim());
                }
            }
        }
    }, [searchParams, setValue, watch, validateSponsor]);

    useEffect(() => {
        if (!sponsorId || sponsorId.trim().length < 3) {
            setSponsorValid(null);
            setSponsorName(null);
            setIsValidatingSponsor(false);
            clearErrors('sponsorId');
            return;
        }
        const timeoutId = setTimeout(() => { validateSponsor(sponsorId); }, 800);
        return () => clearTimeout(timeoutId);
    }, [sponsorId, validateSponsor, clearErrors]);

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const response = await authApi.register({
                name: data.fullName,
                email: data.email,
                phone: `${data.countryCode}${data.phone}`,
                password: data.password,
                walletAddress: data.walletAddress,
                ...(data.sponsorId && data.sponsorId.trim() && { sponsorId: data.sponsorId.trim() }),
            }) as { user?: { userId?: string; id?: string }; userId?: string; data?: { user?: { userId?: string; id?: string }; userId?: string; vaultCredentials?: { userId: string; vaultKey: string } }; vaultCredentials?: { userId: string; vaultKey: string } };

            if (typeof window !== 'undefined') sessionStorage.removeItem('registerFormData');

            const payload = response?.data ?? response;
            const baseUser = payload?.user ?? payload;
            const vault = payload?.vaultCredentials ?? response?.vaultCredentials ?? null;
            const userId = baseUser?.userId ?? (baseUser as { id?: string })?.id ?? payload?.userId ?? response?.userId ?? '';
            setRegistrationSuccess({
                userId: userId || data.email,
                email: data.email,
                name: data.fullName,
                password: data.password,
                walletAddress: data.walletAddress,
                vaultUserId: vault?.userId ?? userId ?? '',
                vaultKey: vault?.vaultKey ?? undefined,
            });
            toast.success('Registration successful! Save your Vault Key securely.');
        } catch (error: any) {
            const msg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
            if (typeof msg === 'string' && msg.toLowerCase().includes('project context')) {
                toast.error('Server configuration error. Please try again later.');
            } else {
                toast.error(msg);
            }
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

    // ── Success screen ──
    if (registrationSuccess) {
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
            <div className="flex items-start justify-center min-h-[calc(100vh-4rem)] py-6 px-4">
                <div className="w-full max-w-lg">
                    {/* Form card - native styling on mobile, boxed on desktop */}
                    <div className="border-0 sm:border border-[var(--border)] bg-transparent sm:bg-[var(--surface-elevated)] sm:auth-panel rounded-none sm:rounded-2xl p-0 sm:p-8 shadow-none">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)]">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-2">Registration Successful!</h1>
                            <p className="text-sm text-[var(--muted-foreground)]">
                                Screenshot or save these credentials — you'll need them to log in.
                            </p>
                        </div>
                        <div className="space-y-3 mb-4">
                            <CredentialRow label="User ID" value={creds.userId} field="userId" />
                            <CredentialRow label="Email" value={creds.email} field="email" />
                            <CredentialRow label="Name" value={creds.name} field="name" />
                            {creds.walletAddress && (
                                <CredentialRow label="Wallet Address" value={creds.walletAddress} field="walletAddress" />
                            )}
                            <CredentialRow label="Password" value={creds.password} field="password" />
                        </div>

                        {/* Vault Key — required for password recovery */}
                        {creds.vaultKey && creds.vaultUserId && (
                            <div className="mb-4 p-3 sm:p-4 rounded-xl border bg-[var(--pw-primary)]/5 border-[var(--pw-primary)]/30" style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pw-primary)] mb-2">Vault Key (for password recovery)</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <code className="text-sm text-[var(--foreground)] break-all font-mono">{creds.vaultKey}</code>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(creds.vaultKey!, 'vaultKey')}
                                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--pw-primary)] bg-[var(--pw-primary)]/15 rounded-lg hover:bg-[var(--pw-primary)]/25 transition-colors"
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
                                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--pw-primary)] bg-[var(--pw-primary)]/15 rounded-lg hover:bg-[var(--pw-primary)]/25 transition-colors"
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
            </div>
        );
    }

    // ── Register form ──
    return (
        // flex-1 min-h-full: fill auth content area; overflow only when form is tall. pb-20 for mobile feature strip
        <div className="relative flex-1 flex items-center justify-center min-h-full py-6 sm:py-8 md:py-12 px-4 sm:px-6 overflow-x-hidden">
            <div className="relative z-10 w-full max-w-2xl">
                {/* Form card - native styling on mobile, boxed on desktop */}
                <div className="border-0 sm:border border-[var(--border)] bg-transparent sm:bg-[var(--surface-elevated)] sm:auth-panel rounded-none sm:rounded-2xl p-0 sm:p-6 md:p-8 shadow-none">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                        {/* Clean Inline Header */}
                        <div className="mb-4 sm:mb-6">
                            <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                                Create Account
                            </h1>
                            <p className="text-xs text-[var(--muted-foreground)]">Register a new affiliate profile on Smart Bazar</p>
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
                                            className="shrink-0 w-[5.5rem] sm:w-28 px-2 sm:px-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--pw-primary)]/40 text-sm"
                                        >
                                            {COUNTRY_CODES.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.flag} {country.code}
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

                        {/* ── Web3 Wallet ── */}
                        <div className="border-t border-[var(--border)] pt-5">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                                Web3 Wallet
                            </h3>
                            <div>
                                <label htmlFor="walletAddress" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Wallet Address
                                </label>
                                <input
                                    {...register('walletAddress')}
                                    type="text"
                                    id="walletAddress"
                                    className="premium-input w-full text-base"
                                    placeholder="0x..."
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                {errors.walletAddress && (
                                    <p className="mt-1 text-xs text-red-500">{errors.walletAddress.message}</p>
                                )}
                                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                                    This becomes your primary wallet address for contract payouts and must be unique.
                                </p>
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
                                <span className="text-sm text-[var(--foreground)] leading-relaxed">
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