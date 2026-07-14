'use client';

import { ReactNode } from 'react';

export interface TickerItem {
    id: string;
    icon?: ReactNode;
    label: ReactNode;
    /** Optional extra emphasis colour for the label (CSS color). */
    accent?: string;
}

interface LotteryTickerProps {
    items: TickerItem[];
    /** Duration of one full scroll loop. Default scales with item count. */
    durationSec?: number;
}

/**
 * One-line, full-width auto-scrolling marquee. Pure CSS animation
 * (`lottery-ticker-track` keyframe) — no JS interval. Hovering pauses
 * the scroll so users can read.
 *
 * The trick: we render the items twice and animate `translateX(-50%)`,
 * which produces a perfectly seamless loop because the second copy
 * starts exactly where the first ends.
 */
export default function LotteryTicker({ items, durationSec }: LotteryTickerProps) {
    if (!items.length) return null;
    const duration = durationSec ?? Math.max(28, items.length * 8);
    const repeat = items.concat(items);

    return (
        <div className="relative w-full overflow-hidden border-b border-amber-300/15 bg-[linear-gradient(90deg,rgba(8,10,16,0.95),rgba(20,16,8,0.85)_50%,rgba(8,10,16,0.95))]">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#06080d] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#06080d] to-transparent" />

            <div
                className="lottery-ticker-track py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-200 sm:text-sm"
                style={{ ['--ticker-duration' as string]: `${duration}s` }}
            >
                {repeat.map((item, index) => (
                    <span
                        key={`${item.id}-${index}`}
                        className="inline-flex shrink-0 items-center gap-2"
                        style={item.accent ? { color: item.accent } : undefined}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        <span className="mx-2 text-amber-300/60">·</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
