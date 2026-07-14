'use client';

import { CalendarDays, Clock3, Flame, Users } from 'lucide-react';
import { pad } from './lotteryFormat';

interface ILotteryStats {
    countdownLabel: string;
    countdown: {
        hours: number;
        minutes: number;
        seconds: number;
        totalMs: number;
    } | null;
    totalParticipants: number;
    isCompletedSticky: boolean;
    drawDate: Date | null;
    isAwaitingDrawSync?: boolean;
    isRevealPhase?: boolean;
    minParticipants?: number;
}

function LotteryStats(
    { countdownLabel, countdown, totalParticipants, isCompletedSticky, drawDate, isAwaitingDrawSync = false, isRevealPhase = false, minParticipants }: ILotteryStats
) {
    const cardClass =
        'rounded-[1.05rem] border border-amber-300/14 bg-[linear-gradient(180deg,rgba(22,12,5,0.9),rgba(18,10,41,0.88)_36%,rgba(5,8,22,0.92))] p-3 sm:p-5 text-center shadow-[0_24px_72px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px] sm:min-h-[158px]';
    const showPreparing = isAwaitingDrawSync && !isCompletedSticky;
    const showDrawing = isRevealPhase && !isCompletedSticky;
    const participantCaption = showPreparing
        ? totalParticipants === 0
            ? 'Finalizing player list'
            : 'Entries locked'
        : isCompletedSticky
            ? 'Snapshot at draw'
            : 'Players live';
    const countdownUrgency = countdown?.totalMs
        ? countdown.totalMs <= 10 * 60 * 1000
            ? 'Final minutes'
            : countdown.totalMs <= 60 * 60 * 1000
                ? 'Closing this hour'
                : 'Entries rising'
        : isCompletedSticky
            ? 'Draw completed'
            : 'Stand by';
    const seatPressure = minParticipants
        ? Math.max(minParticipants - totalParticipants, 0)
        : 0;

    return (
        <section className="mt-3 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[1.15fr_0.8fr_1fr]">
            <article className={`${cardClass} col-span-2 lg:col-span-1`}>
                <div className="flex items-center justify-between gap-3 text-left">
                    <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-amber-50/88">
                        {countdownLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                        <Flame className="h-3 w-3 text-amber-300" />
                        {countdownUrgency}
                    </span>
                </div>
                {showPreparing || showDrawing ? (
                    <div className="mt-5">
                        <div className="inline-flex items-center justify-center gap-3 rounded-2xl border border-amber-300/35 bg-amber-300/10 px-4 py-3 shadow-[0_0_28px_rgba(251,191,36,0.16)]">
                            <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-200" />
                            </span>
                            <strong className="bg-[linear-gradient(180deg,#fffbe8,#ffd35a,#ff8a1f)] bg-clip-text text-[clamp(1.8rem,4vw,3rem)] font-black uppercase leading-none text-transparent">
                                {showDrawing ? 'Drawing' : 'Syncing'}
                            </strong>
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                            {showDrawing ? 'Winners are being revealed' : 'Server is preparing the draw'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mt-2 sm:mt-3 flex items-baseline justify-center gap-1.5 sm:gap-2">
                            <strong className="bg-[linear-gradient(180deg,#fff9e4,#ffe08e_26%,#ffbe3d_62%,#ff8a1f)] bg-clip-text text-[clamp(1.6rem,5vw,3.55rem)] font-black leading-none text-transparent drop-shadow-[0_0_18px_rgba(255,180,62,0.34)]">
                                {pad(countdown?.hours || 0)}
                            </strong>
                            <em className="text-[1.6rem] sm:text-[2.5rem] font-black not-italic text-amber-300/75">:</em>
                            <strong className="bg-[linear-gradient(180deg,#fff9e4,#ffe08e_26%,#ffbe3d_62%,#ff8a1f)] bg-clip-text text-[clamp(1.6rem,5vw,3.55rem)] font-black leading-none text-transparent drop-shadow-[0_0_18px_rgba(255,180,62,0.34)]">
                                {pad(countdown?.minutes || 0)}
                            </strong>
                            <em className="text-[1.6rem] sm:text-[2.5rem] font-black not-italic text-amber-300/75">:</em>
                            <strong className="bg-[linear-gradient(180deg,#fff9e4,#ffe08e_26%,#ffbe3d_62%,#ff8a1f)] bg-clip-text text-[clamp(1.6rem,5vw,3.55rem)] font-black leading-none text-transparent drop-shadow-[0_0_18px_rgba(255,180,62,0.34)]">
                                {pad(countdown?.seconds || 0)}
                            </strong>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <small className="text-[0.68rem] font-extrabold uppercase text-white/70">Hours</small>
                            <small className="text-[0.68rem] font-extrabold uppercase text-white/70">Minutes</small>
                            <small className="text-[0.68rem] font-extrabold uppercase text-white/70">Seconds</small>
                        </div>
                        <div className="mt-3 hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/72 sm:inline-flex">
                            <Clock3 className="h-3.5 w-3.5 text-amber-400" />
                            The closer it gets, the hotter the room
                        </div>
                    </>
                )}
            </article>
            <article className={cardClass}>
                <div className="flex items-center justify-between gap-3 text-left">
                    <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-amber-50/88">
                        {showPreparing ? 'Entries locking' : isCompletedSticky ? 'Entries in this draw' : 'Total participants'}
                    </span>
                    {!isCompletedSticky && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                            <Users className="h-3 w-3" />
                            Live
                        </span>
                    )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                    <Users className="h-8 w-8 text-amber-400" />
                    <strong className="bg-[linear-gradient(180deg,#fff9e4,#ffe08e_24%,#ffbe3d_62%,#ff8a1f)] bg-clip-text text-[clamp(2.2rem,5vw,3.55rem)] font-black leading-none text-transparent drop-shadow-[0_0_18px_rgba(255,180,62,0.34)]">
                        {totalParticipants}
                    </strong>
                </div>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-black uppercase text-white/90">
                    <span className={`h-2.5 w-2.5 rounded-full ${showPreparing ? 'bg-amber-300' : 'bg-emerald-400'}`} />
                    {participantCaption}
                </p>
                {showPreparing && minParticipants ? (
                    <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/45">
                        Minimum arena size: {minParticipants}
                    </p>
                ) : seatPressure > 0 && !isCompletedSticky ? (
                    <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-amber-200/75">
                        Only {seatPressure} more {seatPressure === 1 ? 'entry' : 'entries'} to hit the target room size
                    </p>
                ) : (
                    <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-amber-200/70">
                        Arena target already filled
                    </p>
                )}
            </article>
            <article className={cardClass}>
                <div className="flex items-center justify-between gap-3 text-left">
                    <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-amber-50/88">
                        {isCompletedSticky ? 'Draw held' : 'Draw time'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
                        <CalendarDays className="h-3 w-3" />
                        Scheduled
                    </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                    <CalendarDays className="h-8 w-8 text-amber-400" />
                    <div>
                        <strong className="block text-[clamp(1.25rem,2vw,1.7rem)] font-black text-white">
                            {drawDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                        <small className="mt-1 block text-[0.68rem] font-extrabold text-white/70">
                            {drawDate?.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                        </small>
                    </div>
                </div>
                <p className="mt-3 hidden text-[11px] font-black uppercase tracking-[0.14em] text-white/50 sm:block">
                    Show up before the lock, stay for the reveal
                </p>
            </article>
        </section>
    );
}

export default LotteryStats
