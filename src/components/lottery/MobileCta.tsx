'use client';

import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { pad } from '@/components/lottery/lotteryFormat';

export interface MobileCtaCountdown {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
}

interface MobileCtaProps {
    /**
     * Countdown to the relevant moment (draw start or entry close).
     * If `null` the chip falls back to a single-line CTA.
     */
    countdown?: MobileCtaCountdown | null;
    /** Pretext for the countdown e.g. "Draw in" / "Entry closes in". */
    countdownLabel?: string;
    /** Hide the bar entirely (e.g. during sticky-completed view). */
    hidden?: boolean;
    href?: string;
    /** Override CTA button copy (default: "Buy package"). */
    ctaLabel?: string;
    /** When user already has an entry, show their ticket id instead of the CTA. */
    existingTicket?: string | null;
}

/**
 * Fixed-bottom mobile-only CTA bar. Hidden on `lg` and above. Hides itself
 * when `hidden` is true (e.g. completed sticky view) so we never block the
 * podium with redundant copy.
 *
 * Uses `safe-area-inset-bottom` so it sits above iOS home-indicators.
 */
export default function MobileCta({
    countdown,
    countdownLabel = 'Draw in',
    hidden = false,
    href = '/packages',
    ctaLabel = 'Buy package',
    existingTicket,
}: MobileCtaProps) {
    if (hidden) return null;

    const hasCountdown = countdown && countdown.totalMs > 0;

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(8,11,18,0.95)] backdrop-blur-xl lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">
                        {hasCountdown ? countdownLabel : 'Lottery Live'}
                    </div>
                    {hasCountdown ? (
                        <div className="mt-0.5 font-mono text-base font-black text-white">
                            {pad(countdown!.hours)}:{pad(countdown!.minutes)}:{pad(countdown!.seconds)}
                        </div>
                    ) : existingTicket ? (
                        <div className="mt-0.5 truncate font-mono text-sm font-black text-amber-200">
                            {existingTicket}
                        </div>
                    ) : (
                        <div className="mt-0.5 truncate text-sm font-semibold text-slate-200">
                            Be in the next draw
                        </div>
                    )}
                </div>

                {existingTicket ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-200">
                        <Ticket className="h-4 w-4" />
                        Entered
                    </div>
                ) : (
                    <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-[0_8px_24px_-12px_rgba(245,158,11,0.85)]"
                    >
                        <Ticket className="h-4 w-4" />
                        {ctaLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}
