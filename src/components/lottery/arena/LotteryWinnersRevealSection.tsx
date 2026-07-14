'use client';

import { RotateCcw, Trophy } from 'lucide-react';
import WinnersPodium from '@/components/lottery/WinnersPodium';
import type { LotteryFairnessProof, LotteryWinner } from '@/lib/api/lotteryApi';

interface LotteryWinnersRevealSectionProps {
    winners: LotteryWinner[];
    revealedRanks: number[];
    revealAll: boolean;
    isStickyCompleted: boolean;
    fairnessProof?: LotteryFairnessProof | null;
    canReplay?: boolean;
    onReplay?: () => void;
}

export default function LotteryWinnersRevealSection({
    winners,
    revealedRanks,
    revealAll,
    isStickyCompleted,
    fairnessProof,
    canReplay = false,
    onReplay,
}: LotteryWinnersRevealSectionProps) {
    if (!winners.length) return null;

    const title = isStickyCompleted ? 'Final results' : 'Winner ceremony';
    const subtitle = isStickyCompleted
        ? 'Top winners stay on stage so every visitor sees the outcome instantly.'
        : 'The reveal rail updates rank by rank as each winning ticket lands and the stage locks each winner in place.';

    return (
        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-[1.25rem] border border-amber-500/25 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_35%),linear-gradient(180deg,rgba(10,10,14,0.95),rgba(6,6,9,0.98))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px] sm:p-5">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />
            <div className="mb-4 sm:mb-6 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-amber-100">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
                    Winner stage
                </div>
                <h3 className="bg-gradient-to-b from-white via-[#ffeaa7] to-[#f59e0b] bg-clip-text text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-[0.06em] text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
                    {title}
                </h3>
                <p className="max-w-xl text-[11px] sm:text-xs sm:text-sm font-medium leading-relaxed text-white/70 mt-0.5 sm:mt-1">
                    {subtitle}
                </p>

                {canReplay && onReplay ? (
                    <button
                        type="button"
                        onClick={onReplay}
                        className="mt-2 inline-flex min-h-9 sm:min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200/28 bg-amber-300/12 px-3 text-xs font-black uppercase tracking-[0.12em] text-amber-50 transition hover:-translate-y-0.5 hover:border-amber-100/50 hover:bg-amber-300/18"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Replay reveal
                    </button>
                ) : null}
            </div>
            <WinnersPodium winners={winners} revealedRanks={revealedRanks} revealAll={revealAll} />
        </section>
    );
}
