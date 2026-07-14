'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/lib/store/hooks';
import { loginSuccess, logout } from '@/lib/store/slices/authSlice';
import { userApi } from '@/lib/api/services';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/constants/env';
import { APP_CONSTANTS } from '@/constants/app';

function ImpersonateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            const performImpersonation = async () => {
                // Clear existing auth
                dispatch(logout());

                try {
                    // 1. Store token in localStorage (required for api services to work)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('accessToken', token);
                        localStorage.setItem('token', token); // For backward compatibility
                        localStorage.removeItem('refreshToken'); // Impersonation tokens are short-lived and don't refresh
                    }

                    // 2. Fetch user profile to validate token and get user details
                    const user = await userApi.getProfile();

                    // 3. Update Redux store
                    const authResponse = {
                        success: true,
                        message: 'Impersonation successful',
                        data: {
                            user,
                            accessToken: token,
                            refreshToken: '', // No refresh token
                        },
                        timestamp: new Date().toISOString(),
                    };

                    dispatch(loginSuccess(authResponse));

                    // 4. Show success message (optional banner logic could be added here)
                    toast.success(`impersonating: ${user.name || user.email}`, {
                        duration: 4000,
                        icon: '🕵️',
                        style: {
                            background: 'var(--surface-elevated)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)',
                        },
                    });

                    // 5. Redirect to Dashboard
                    // Use replace to prevent going back to impersonate page
                    router.replace('/dashboard');
                } catch (error) {
                    console.error('Impersonation failed:', error);
                    toast.error('Invalid or expired impersonation session');

                    // Clear invalid token
                    dispatch(logout());

                    // Redirect to login
                    router.replace('/login');
                }
            };

            performImpersonation();
        } else {
            // No token provided
            toast.error('No impersonation token provided');
            router.replace('/login');
        }
    }, [searchParams, dispatch, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
            <div className="bg-[var(--surface-elevated)] p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <img
                    src={APP_CONSTANTS.APP_LOGO_URL}
                    alt={APP_NAME}
                    className="h-14 sm:h-16 w-auto object-contain mb-6"
                />
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Accessing User Account</h2>
                <p className="text-[var(--muted-foreground)] text-center text-sm">
                    Verifying authorization and redirecting to user dashboard...
                </p>
            </div>
        </div>
    );
}

export default function ImpersonatePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ImpersonateContent />
        </Suspense>
    );
}
