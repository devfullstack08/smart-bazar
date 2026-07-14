import Link from 'next/link';
import AppBrand from '@/components/ui/AppBrand';
import { Home } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-premium-shell overflow-x-hidden flex flex-col min-h-screen min-h-[100dvh]">
            {/* Header with home link */}
            <header className="flex-shrink-0 z-50 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-md">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-[var(--foreground)] hover:opacity-90 transition-opacity"
                >
                    <Home className="h-5 w-5 text-[var(--pw-primary)]" />
                    <span className="text-sm font-medium">Home</span>
                </Link>
                <AppBrand size="sm" asLink className="text-[var(--pw-primary)]" />
            </header>
            <div className="container-landing flex flex-1 min-h-0 min-w-0 flex-col w-full max-w-full relative overflow-y-auto overflow-x-hidden pb-safe">
                {children}
            </div>
        </div>
    );
}
