'use client';

import { BadgeCheck, Ticket, Trophy, Wallet } from 'lucide-react';
import { LotteryWinner } from '@/lib/api/lotteryApi';
import { getRankLabel, playerDisplayName, rewardValueLabel } from './lotteryFormat';

interface TicketEjectionProps {
    winner: LotteryWinner;
    /** When true, plays the eject + flip animation; otherwise renders statically. */
    animating: boolean;
}

/**
 * The ticket flies out of the wheel and flips to reveal the winner. Built
 * with two stacked surfaces and the shared lottery keyframes from
 * `src/style/lottery.css`.
 */
export default function TicketEjection({ winner, animating }: TicketEjectionProps) {
    const tierLabel = winner.couponLabel
        || (typeof winner.couponAmount === 'number' && Number.isFinite(winner.couponAmount) ? `${winner.couponAmount} coupon` : '');
    const isExternal = winner.participantType === 'external';
    const poolShare = Number(winner.reward?.poolSharePercent || 0);

    return (
        <div className={`relative w-full max-w-md ${animating ? 'lottery-ticket-pop' : ''}`}>
            <div
                className={`relative overflow-hidden rounded-[1.35rem] border border-amber-400/40 bg-[linear-gradient(160deg,rgba(251,191,36,0.15),rgba(15,10,5,0.96)_34%,rgba(8,5,2,0.98))] p-4 text-white shadow-[0_34px_90px_-28px_rgba(245,158,11,0.48),0_0_46px_rgba(251,191,36,0.16),inset_0_1px_0_rgba(255,255,255,0.1)] ${animating ? 'lottery-ticket-flip' : ''}`}
            >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-yellow-300/15 blur-3xl" />

                <div className="relative z-[1] flex items-start justify-between gap-3">
                    <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">
                        <Trophy className="h-4 w-4 text-amber-300" />
                        {getRankLabel(winner.rank)}
                    </div>
                    <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                        <BadgeCheck className="h-4 w-4 text-amber-300" />
                        Verified
                    </div>
                </div>

                <div className="relative z-[1] mt-4 rounded-[1.05rem] border border-amber-500/20 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/70">
                        Winner
                    </div>
                    <div className="mt-2 break-words text-[clamp(1.65rem,8vw,2.25rem)] font-black leading-[1.02] text-white drop-shadow-[0_2px_14px_rgba(245,158,11,0.25)]">
                        {playerDisplayName(winner)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/15 px-3 font-mono text-sm font-black tracking-[0.12em] text-amber-100">
                            <Ticket className="h-4 w-4 shrink-0 text-amber-300" />
                            <span className="truncate">#{winner.lotteryNumber}</span>
                        </span>
                        {tierLabel ? (
                            <span className="inline-flex min-h-9 items-center rounded-xl border border-yellow-200/20 bg-yellow-400/15 px-3 text-xs font-black uppercase tracking-[0.12em] text-yellow-100">
                                {tierLabel}
                            </span>
                        ) : null}
                        {isExternal ? (
                            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-xs font-black uppercase tracking-[0.12em] text-white/72">
                                <Wallet className="h-3.5 w-3.5" />
                                External
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="relative z-[1] mt-3 grid gap-2 rounded-[1.05rem] border border-amber-400/20 bg-amber-400/10 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/70">
                            Prize
                        </div>
                        <div className="mt-1 truncate text-base font-black text-amber-100">
                            {rewardValueLabel(winner.reward)}
                        </div>
                    </div>
                    {poolShare > 0 ? (
                        <div className="inline-flex w-fit items-center rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">
                            {poolShare}% pool
                        </div>
                    ) : (
                        <div className="inline-flex w-fit items-center rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/58">
                            Final reveal
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
