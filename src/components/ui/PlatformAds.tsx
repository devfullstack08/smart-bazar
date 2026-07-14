'use client';

import { cn } from '@/lib/utils/cn';
import { Sparkles, Coins, Zap, Shield } from 'lucide-react';

const FEATURES = [
  { label: 'Referral Payouts', icon: Coins },
  { label: 'Binary Matching', icon: Zap },
  { label: 'Secure Accounts', icon: Shield },
] as const;

export interface PlatformAdsProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export default function PlatformAds({
  title = 'More coming soon',
  subtitle = 'Direct referral, binary matching & global auto-pool — one platform.',
  compact = false,
  className = '',
}: PlatformAdsProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]',
        'shadow-lg shadow-black/5 dark:shadow-black/20',
        'transition-all duration-[var(--duration-normal)] ease-[var(--ease-smooth)]',
        'hover:shadow-xl hover:border-[var(--pw-primary)]/30 hover:shadow-[var(--pw-primary)]/5',
        className
      )}
    >
      {/* Subtle animated gradient band at top */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--pw-primary)] via-[var(--pw-secondary)] to-[var(--pw-primary)] bg-[length:200%_100%] animate-gradient opacity-90"
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pw-primary)]/15 text-[var(--pw-primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          </div>
        </div>

        {!compact && (
          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--pw-primary)]/40 hover:text-[var(--foreground)]"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--pw-primary)]" />
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--surface)]/80 px-3 py-2 text-xs text-[var(--muted-foreground)]">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pw-primary)]" />
          Early access — stay tuned
        </div>
      </div>
    </div>
  );
}
