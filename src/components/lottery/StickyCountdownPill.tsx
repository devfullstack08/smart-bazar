'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock3, Ticket } from 'lucide-react';
import { pad } from '@/components/lottery/lotteryFormat';

interface StickyCountdownPillProps {
    countdown: { hours: number; minutes: number; seconds: number; totalMs: number } | null;
    countdownLabel?: string;
    ticketNumber?: string | null;
    /** Ref to the hero section — pill appears when hero scrolls out of view */
    heroRef: React.RefObject<HTMLElement | null>;
}

export default function StickyCountdownPill({
    countdown,
    countdownLabel = 'Draw in',
    ticketNumber    ,
    heroRef,
}: StickyCountdownPillProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show pill when hero is less than 10% visible
                setVisible(!entry.isIntersecting);
            },
            { threshold: 0.1 },
        );

        observer.observe(hero);
        return () => observer.disconnect();
    }, [heroRef]);

    const hasCountdown = countdown && countdown.totalMs > 0;
    if (!visible || !hasCountdown) return null;

    return (
        <div
            className={`fixed left-1/2 top-[env(safe-area-inset-top,0px)] z-50 -translate-x-1/2 pt-2 transition-all duration-300 lg:hidden ${
                visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
        >
            <div className="flex items-center gap-2.5 rounded-full border border-amber-300/35 bg-[rgba(8,8,12,0.92)] px-3.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-xl">
                <Clock3 className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/80">
                    {countdownLabel}
                </span>
                <span className="font-mono text-sm font-black text-white">
                    {pad(countdown!.hours)}:{pad(countdown!.minutes)}:{pad(countdown!.seconds)}
                </span>
                {ticketNumber ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                        <Ticket className="h-3 w-3" />
                        {ticketNumber}
                    </span>
                ) : null}   
            </div>
        </div>
    );
}
