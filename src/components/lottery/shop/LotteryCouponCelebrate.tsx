'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Sparkles, TicketCheck } from 'lucide-react';

type AnimationMode = 'full' | 'reduced' | 'still';

/**
 * Full-screen ticket confirmation after coupon purchase.
 * Kept non-interactive so it never blocks the next user action.
 */
export default function LotteryCouponCelebrate({
    ticketNumbers,
    onComplete,
}: {
    ticketNumbers: string[];
    onComplete: () => void;
}) {
    const [animationMode, setAnimationMode] = useState<AnimationMode>('full');
    const reduceMotion = animationMode === 'still';
    const visibleTickets = ticketNumbers.slice(0, 12);
    const extraTickets = Math.max(0, ticketNumbers.length - visibleTickets.length);

    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncMode = () => {
            const nav = navigator as Navigator & { deviceMemory?: number };
            const lowHardware = (navigator.hardwareConcurrency || 8) <= 4 || Number(nav.deviceMemory || 8) <= 4;
            const compactScreen = window.innerWidth < 520;
            setAnimationMode(mq.matches ? 'still' : lowHardware || compactScreen ? 'reduced' : 'full');
        };
        syncMode();
        const fn = () => syncMode();
        mq.addEventListener('change', fn);
        window.addEventListener('resize', fn, { passive: true });
        return () => {
            mq.removeEventListener('change', fn);
            window.removeEventListener('resize', fn);
        };
    }, []);

    useEffect(() => {
        const hasManyTickets = ticketNumbers.length > 8;
        const ms = reduceMotion ? 1800 : animationMode === 'reduced' ? 2800 : hasManyTickets ? 4600 : 3400;
        const t = window.setTimeout(() => {
            onCompleteRef.current?.();
        }, ms);
        return () => window.clearTimeout(t);
    }, [animationMode, reduceMotion, ticketNumbers.length]);

    if (reduceMotion) {
        return (
            <div
                className="pointer-events-none fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-black/72 px-4 backdrop-blur-[3px]"
                role="status"
                aria-live="polite"
            >
                <CheckCircle2 className="h-12 w-12 text-emerald-200" />
                <p className="text-center text-lg font-black text-white">Tickets minted</p>
                <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-emerald-100/80">{ticketNumbers.length} ticket{ticketNumbers.length === 1 ? '' : 's'} secured</p>
                <div className="flex max-w-[min(100vw-2rem,520px)] flex-wrap justify-center gap-2">
                    {visibleTickets.map((num) => (
                        <span
                            key={num}
                            className="rounded-xl border border-emerald-100/45 bg-black/80 px-3 py-2 font-mono text-base font-black tracking-[0.04em] text-white shadow-[0_0_24px_rgba(16,185,129,0.22)]"
                        >
                            #{num}
                        </span>
                    ))}
                    {extraTickets > 0 ? (
                        <span className="rounded-xl border border-amber-100/35 bg-amber-300/14 px-3 py-2 text-sm font-black text-amber-50">
                            +{extraTickets} more
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" role="presentation">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(250,204,21,0.16),transparent_42%),radial-gradient(circle_at_50%_78%,rgba(20,184,166,0.14),transparent_44%),rgba(2,6,12,0.70)] backdrop-blur-[2px]" />
            <div className="absolute left-1/2 top-[max(5.5rem,14vh)] w-full max-w-[min(92vw,560px)] -translate-x-1/2 px-3 sm:top-1/2 sm:-translate-y-1/2">
                <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-100/24 bg-[linear-gradient(145deg,rgba(5,24,24,0.96),rgba(4,9,17,0.98))] p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] [animation:lottery-ticket-pop_520ms_cubic-bezier(0.2,0.9,0.2,1)_both] sm:p-5">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/18 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-14 left-6 h-32 w-32 rounded-full bg-emerald-300/14 blur-3xl" />
                    <div className="relative flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200/45 bg-[linear-gradient(180deg,rgba(254,243,199,0.98),rgba(250,204,21,0.88))] text-amber-950 shadow-[0_14px_34px_rgba(250,204,21,0.28)]">
                            <TicketCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/22 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
                                <Sparkles className="h-3 w-3 text-amber-200" />
                                Confirmed
                            </div>
                            <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">Tickets minted</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-200/62">
                                {ticketNumbers.length} coupon ticket{ticketNumbers.length === 1 ? '' : 's'} added to this draw.
                            </p>
                        </div>
                    </div>

                    <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/24 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="grid max-h-[34vh] gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(16,185,129,0.45)_transparent] [scrollbar-width:thin] sm:grid-cols-2">
                            {visibleTickets.map((num, index) => (
                                <div
                                    key={num}
                                    className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-emerald-100/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.2)]"
                                    style={{ animation: `lottery-ticket-pop 420ms cubic-bezier(0.2,0.9,0.2,1) ${index * 45}ms both` }}
                                >
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-300/14 text-[11px] font-black text-emerald-100">
                                        {index + 1}
                                    </span>
                                    <span className="min-w-0 truncate font-mono text-sm font-black tracking-[0.04em] text-white">
                                        #{num}
                                    </span>
                                </div>
                            ))}
                            {extraTickets > 0 ? (
                                <div className="grid min-h-12 place-items-center rounded-xl border border-amber-100/22 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-50">
                                    +{extraTickets} more ticket{extraTickets === 1 ? '' : 's'}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="relative mt-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300/48">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200/70" />
                        Saved to your lottery entry list
                    </div>
                </div>
            </div>
        </div>
    );
}
