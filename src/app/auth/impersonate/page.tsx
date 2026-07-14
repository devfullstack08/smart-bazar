'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/lib/store/hooks';
import { loginSuccess, logout } from '@/lib/store/slices/authSlice';
import { userApi } from '@/lib/api/services';
import toast from 'react-hot-toast';

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
                            background: '#4f46e5',
                            color: '#fff',
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Accessing User Account</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                    Verifying authorization and redirecting to user dashboard...
                </p>
            </div>
        </div>
    );
}

export default function ImpersonatePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        }>
            <ImpersonateContent />
        </Suspense>
    );
}
