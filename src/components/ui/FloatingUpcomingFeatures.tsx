'use client';

import { Coins, Gamepad2, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const FEATURES = [
  {
    id: 'staking',
    label: 'Staking',
    sub: 'Coming soon',
    icon: Coins,
    // Desktop: left side, vertically centered
    posClass: 'left-4 lg:left-8 xl:left-14 top-1/2 -translate-y-1/2',
    floatDelay: 'delay-200',
  },
  {
    id: 'gaming',
    label: 'Gaming',
    sub: 'Coming soon',
    icon: Gamepad2,
    // Desktop: right side, vertically centered
    posClass: 'right-4 lg:right-8 xl:right-14 top-1/2 -translate-y-1/2',
    floatDelay: 'delay-400',
  },
  {
    id: 'swap',
    label: 'Swap',
    sub: 'Exchange',
    icon: ArrowLeftRight,
    // Desktop: top center
    posClass: 'left-1/2 -translate-x-1/2 top-6 lg:top-10',
    floatDelay: 'delay-300',
  },
] as const;

export interface FloatingUpcomingFeaturesProps {
  className?: string;
  showFrom?: 'sm' | 'md' | 'lg';
}

// Single feature pill used in both desktop floating and mobile strip
function FeaturePill({
  label,
  sub,
  icon: Icon,
  compact = false,
  delay = '',
}: {
  label: string;
  sub: string;
  icon: typeof Coins;
  compact?: boolean;
  delay?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-2xl',
        'border border-[var(--pw-primary)]/20 bg-[var(--surface-elevated,#0d0d12)]/90 backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,229,160,0.08)]',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        compact ? '' : 'animate-float-slow',
        delay
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-[var(--pw-primary)]/25 to-[var(--pw-primary)]/10',
          'border border-[var(--pw-primary)]/20 text-[var(--pw-primary)]',
          compact ? 'h-7 w-7' : 'h-9 w-9'
        )}
      >
        <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5 md:h-5 md:w-5'} />
      </span>
      <div className="flex flex-col gap-0">
        <span className={cn('font-semibold text-[var(--foreground,#fff)] leading-tight', compact ? 'text-xs' : 'text-sm')}>
          {label}
        </span>
        <span className={cn('text-[var(--muted-foreground,#888)] leading-tight', compact ? 'text-[10px]' : 'text-xs')}>
          {compact ? 'Soon' : sub}
        </span>
      </div>
    </div>
  );
}

export default function FloatingUpcomingFeatures({
  className = '',
  showFrom = 'md',
}: FloatingUpcomingFeaturesProps) {
  const desktopVisibility =
    showFrom === 'lg' ? 'hidden lg:block' : showFrom === 'md' ? 'hidden md:block' : 'hidden sm:block';

  // Mobile strip: show only when desktop floating is hidden
  const mobileVisibility =
    showFrom === 'lg' ? 'flex lg:hidden' : showFrom === 'md' ? 'flex md:hidden' : 'flex sm:hidden';

  return (
    <>
      {/* ── Desktop: absolute floating pills ── */}
      {FEATURES.map(({ id, label, sub, icon: Icon, posClass, floatDelay }) => (
        <div
          key={id}
          className={cn('absolute z-0 pointer-events-none', desktopVisibility, posClass, className)}
          aria-hidden
        >
          <FeaturePill label={label} sub={sub} icon={Icon} delay={floatDelay} />
        </div>
      ))}

      {/* ── Mobile: infinite marquee strip (right to left) ── */}
      <div
        className={cn(
          mobileVisibility,
          'fixed bottom-0 left-0 right-0 z-20 pointer-events-none overflow-hidden',
          'py-2.5',
          'bg-gradient-to-t from-[var(--background,#050508)]/95 to-transparent backdrop-blur-sm',
          'border-t border-[var(--pw-primary)]/10'
        )}
        aria-hidden
      >
        <div className="flex w-max animate-marquee-left gap-3">
          {[...FEATURES, ...FEATURES].map(({ id, label, sub, icon: Icon }, idx) => (
            <div key={`${id}-${idx}`} className="flex-shrink-0">
              <FeaturePill label={label} sub={sub} icon={Icon} compact />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}