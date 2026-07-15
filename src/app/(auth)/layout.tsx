import Link from 'next/link';
import AppBrand from '@/components/ui/AppBrand';
import { Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
 
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-premium-shell overflow-x-hidden flex flex-col min-h-screen min-h-[100dvh] relative">
            {/* Premium Radial Ambient Glows & Grid Mesh */}
            <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-[var(--primary)]/6 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[65%] h-[65%] bg-indigo-500/[0.04] rounded-full blur-[160px] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.012)_1px,transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />
 
            {/* Header with home link and theme toggle */}
            <header className="flex-shrink-0 z-50 flex items-center justify-between px-4 py-2 border-b border-[var(--border)]/50 bg-[var(--background)]/85 backdrop-blur-md">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-[var(--foreground)] hover:opacity-90 transition-opacity"
                >
                    <Home className="h-5 w-5 text-[var(--pw-primary)]" />
                    <span className="text-sm font-medium">Home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <AppBrand size="sm" asLink className="text-[var(--pw-primary)]" />
                    <ThemeToggle />
                </div>
            </header>
            <div className="flex flex-1 min-h-0 min-w-0 flex-col w-full max-w-full relative overflow-y-auto overflow-x-hidden pb-safe">
                {children}
            </div>
        </div>
    );
}
