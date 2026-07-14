'use client';

import { Sparkles, Ticket } from 'lucide-react';
import type { ParticipantCard } from '@/hooks/useLotteryParticipantPacing';
import { playerDisplayName } from '@/components/lottery/lotteryFormat';

interface ParticipantPopupProps {
    card: ParticipantCard | null;
    queueSize?: number;
}

/**
 * Glassy bottom-right card showing one participant at a time. Driven by
 * `useLotteryParticipantPacing` so initial-load and live socket joins share
 * a single FIFO — never spammed.
 */
export default function ParticipantPopup({ card, queueSize = 0 }: ParticipantPopupProps) {
    if (!card) return null;
    return (
        <div className="pointer-events-none fixed bottom-24 right-3 z-50 flex w-[min(78vw,330px)] flex-col gap-2 sm:right-4 sm:w-[min(92vw,390px)] lg:bottom-5">
            <div
                key={card.id}
                className="lottery-popup-in pointer-events-auto relative overflow-hidden rounded-[1rem] border border-amber-500/25 bg-[linear-gradient(135deg,rgba(17,17,20,0.96),rgba(8,8,10,0.98))] p-2.5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.7),0_0_24px_rgba(251,191,36,0.08)] backdrop-blur-xl sm:rounded-[1.25rem] sm:p-4"
            >
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" aria-hidden />
                <div className="relative flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <Ticket className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-amber-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                Ticket entered
                            </div>
                            {queueSize > 0 && (
                                <div className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[0.65rem] font-black text-white/80">
                                    +{queueSize} more
                                </div>
                            )}
                        </div>
                        <div className="mt-1 truncate text-sm font-black text-white sm:mt-2 sm:text-lg">
                            {playerDisplayName(card)}
                        </div>
                        <div className="mt-0.5 hidden text-xs font-semibold text-white/55 sm:block">{card.displayUserId}</div>
                        <div className="mt-1.5 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-black text-amber-300 sm:mt-3 sm:px-3 sm:py-1 sm:text-sm">
                            {card.lotteryNumber}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
