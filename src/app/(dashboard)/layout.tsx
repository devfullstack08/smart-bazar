'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { APP_NAME } from '@/constants/env';
import { APP_CONSTANTS } from '@/constants/app';
import {
    LayoutDashboard,
    Package,
    DollarSign,
    Users,
    GitBranch,
    Wallet,
    User,
    LogOut,
    Menu,
    X,
    ChevronDown,
    ArrowLeft,
    BookOpen,
    BarChart3,
    Headphones,
    Layers,
    ShoppingCart,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import UserProfileImage from '@/components/ui/UserProfileImage';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { logout, restoreAuth } from '@/lib/store/slices/authSlice';
import { authApi, walletApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils/cn';
import { STORAGE_KEYS } from '@/constants/storageKey';
import { storageGetItem } from '@/lib/safe-storage';
 
// Smart Bazar: no Rank income — nav includes Team Levels & Global Autopool
const baseNavigation = [
    { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Smart Packages', href: '/packages', icon: Package },
    { name: 'My Earnings', href: '/income', icon: DollarSign },
    { name: 'Global Autopool', href: '/autopool', icon: Layers },
    { name: 'Transaction Ledger', href: '/passbook', icon: BookOpen },
    { name: 'Direct Referrals', href: '/team', icon: Users },
    { name: 'Team Levels', href: '/team-level-status', icon: BarChart3 },
    { name: 'Genealogy', href: '/genealogy', icon: GitBranch },
    { name: 'Wallet & Funds', href: '/wallet', icon: Wallet },
    { name: 'Help & Support', href: '/support', icon: Headphones },
    { name: 'Profile', href: '/profile', icon: User },
];
 
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [mounted, setMounted] = useState(false);
    const navigation = baseNavigation;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || storageGetItem(STORAGE_KEYS.TOKEN);
        const userStr = storageGetItem(STORAGE_KEYS.USER_KEY);
        if (!accessToken || !userStr) {
            if (!isAuthenticated) router.push('/login');
            return;
        }
        if (!isAuthenticated || !user) dispatch(restoreAuth());
    }, [isAuthenticated, user, router, dispatch]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const fetchWalletBalance = async () => {
            try {
                setLoadingBalance(true);
                const walletState = await walletApi.getWalletState();
                setAvailableBalance(walletState.wallet.availableBalance);
            } catch {
                // ignore
            } finally {
                setLoadingBalance(false);
            }
        };
        fetchWalletBalance();
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {
            console.error(e);
        } finally {
            dispatch(logout());
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen max-w-[100vw] bg-[var(--background)] relative overflow-hidden">
            {/* Premium Radial Ambient Glows & Grid Mesh */}
            <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-[var(--primary)]/4 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[55%] h-[55%] bg-indigo-500/[0.03] rounded-full blur-[160px] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.01)_1px,transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />

            {/* overflow-x-hidden only on <main> so header nav can use overflow-x-auto */}
            {/* Top bar only — no sidebar, Linear/Stripe style */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md safe-area-inset-top">
                <div className="mx-auto flex h-14 sm:h-16 max-w-[1600px] min-w-0 items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link
                        href="/dashboard"
                        className="flex shrink-0 items-center gap-2 min-w-0"
                    >
                        <img
                            src={APP_CONSTANTS.APP_LOGO_URL}
                            alt={APP_NAME}
                            className="h-11 sm:h-14 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop nav — horizontal scroll when many links (flex-1 min-w-0 + inner overflow-x) */}
                    <div className="hidden min-w-0 flex-1 overflow-hidden lg:block">
                        <nav
                            className="flex max-w-full touch-pan-x items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain py-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
                            aria-label="Main navigation"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right: theme, balance, user */}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <ThemeToggle />
                        <Link
                            href="/wallet"
                            className="hidden sm:flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all px-3 py-2 cursor-pointer shadow-sm group"
                        >
                            <div className="relative">
                                <ShoppingCart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-black text-black">
                                    ✓
                                </span>
                            </div>
                            <div className="h-4 w-[1px] bg-primary/25" />
                            <span className="text-xs font-black text-[var(--foreground)] tabular-nums tracking-tight">
                                {!mounted || loadingBalance ? (
                                    <span className="inline-block h-4 w-12 animate-pulse rounded bg-[var(--border)]" />
                                ) : (
                                    formatCurrency(availableBalance ?? 0)
                                )}
                            </span>
                        </Link>

                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen((o) => !o)}
                                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1.5 min-h-[44px] min-w-[44px] sm:min-w-0 sm:pl-1.5 sm:pr-3 hover:bg-[var(--surface)]/80 transition-colors focus:outline-none"
                                aria-expanded={userMenuOpen}
                            >
                                <UserProfileImage
                                    src={(user as any)?.profilePicture}
                                    alt={mounted ? (user?.name ?? 'User') : 'User'}
                                    width={32}
                                    height={32}
                                    className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]"
                                />
                                <ChevronDown className={`h-4 w-4 text-[var(--muted-foreground)] hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] py-2 shadow-xl">
                                        <div className="border-b border-[var(--border)] px-4 py-3">
                                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user?.name ?? 'User'}</p>
                                            <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email ?? ''}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/profile"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface)]"
                                            >
                                                <User className="h-4 w-4 text-[var(--muted-foreground)]" /> Profile Settings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-[var(--surface)]"
                                            >
                                                <LogOut className="h-4 w-4" /> Log out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Mobile menu trigger */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile sidebar navigation */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="fixed bottom-0 top-0 left-0 flex w-full max-w-xs flex-col bg-[var(--surface-elevated)] shadow-2xl animate-slide-in">
                        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--border)]">
                            <span className="text-lg font-black text-primary tracking-tight">{APP_NAME}</span>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-full p-1 border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium min-h-[48px] ${
                                            isActive ? 'bg-primary/10 text-primary' : 'text-[var(--foreground)]'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-[var(--border)]">
                            <Link
                                href="/wallet"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 mb-3 hover:bg-primary/10 transition-all"
                            >
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <span className="text-sm font-black text-[var(--foreground)] tracking-tight">
                                    {loadingBalance ? '...' : formatCurrency(availableBalance ?? 0)}
                                </span>
                            </Link>
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    handleLogout();
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400"
                            >
                                <LogOut className="h-5 w-5" /> Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className={`mx-auto max-w-[1600px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-safe min-h-[60vh] overflow-x-hidden ${pathname !== '/dashboard' ? 'page-content' : ''}`}>
                {pathname !== '/dashboard' && (
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                        aria-label="Back to dashboard"
                    >
                        <ArrowLeft className="h-5 w-5 shrink-0" /> Back
                    </Link>
                )}
                {children}
            </main>
        </div>
    );
}
