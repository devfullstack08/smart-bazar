'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, Sparkles, Ticket, Trophy, Wallet } from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { getRankLabel, playerDisplayName, rewardValueLabel } from '@/components/lottery/lotteryFormat';
import LotteryWinnerClaimAction from '@/components/lottery/LotteryWinnerClaimAction';
import { lotteryApi, type LotteryEvent, type LotteryRecentWinner, type LotteryWinner } from '@/lib/api/lotteryApi';

interface WinnersReelProps {
    /**
     * Fallback/initial history payload. The reel now loads winners from the
     * paginated recent-winners API so it can keep extending horizontally.
     */
    events: Array<LotteryEvent & { winners?: LotteryWinner[] }>;
    limit?: number;
}

const formatDateTime = (iso?: string) => {
    if (!iso) return 'Draw date';
    try {
        return new Date(iso).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'Draw date';
    }
};

const formatDateLabel = (iso?: string) => {
    if (!iso) return 'Latest';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return 'Latest';
    }
};

const formatTierLabel = (winner: LotteryRecentWinner) => {
    if (winner.couponLabel) return winner.couponLabel;
    if (typeof winner.couponAmount === 'number' && Number.isFinite(winner.couponAmount)) {
        return `$${winner.couponAmount} coupon`;
    }
    return 'Main draw';
};

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'W';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

const isWhaleWin = (reward?: { label?: string; payout?: { amount?: string } }) => {
    if (!reward) return false;
    if (reward.payout?.amount && Number(reward.payout.amount) >= 500) return true;
    if (reward.label) {
        const match = reward.label.match(/[\d.,]+/);
        if (match && parseFloat(match[0].replace(/,/g, '')) >= 500) return true;
    }
    return false;
};

const flattenHistoryEvents = (
    events: Array<LotteryEvent & { winners?: LotteryWinner[] }>,
): LotteryRecentWinner[] => {
    return events.flatMap((event) =>
        (event.winners || []).map((winner) => ({
            ...winner,
            lotteryId: event._id,
            eventTitle: event.title,
            eventDrawTime: event.drawTime,
            eventStatus: event.status,
            eventVersion: event.version,
            eventEntryTrigger: event.entryTrigger,
        })),
    );
};

const mergeWinners = (current: LotteryRecentWinner[], incoming: LotteryRecentWinner[]) => {
    const seen = new Set<string>();
    const merged: LotteryRecentWinner[] = [];
    for (const winner of [...current, ...incoming]) {
        const key = winner._id || `${winner.lotteryId}:${winner.couponTierId || 'default'}:${winner.rank}:${winner.lotteryNumber}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(winner);
    }
    return merged;
};

const claimStatusLabel = (winner: LotteryRecentWinner) => {
    if (winner.reward.rewardMode !== 'token_payout') return 'Display reward';
    if (winner.claimStatus === 'claimed') return 'Already claimed';
    if (winner.claimStatus === 'processing') return 'Claim processing';
    if (winner.claimStatus === 'failed') return 'Retry available';
    if (winner.claimStatus === 'claimable') return 'Claimable payout';
    return 'Payout locked';
};

export default function WinnersReel({ events, limit = 12 }: WinnersReelProps) {
    const railRef = useRef<HTMLDivElement | null>(null);
    const requestedPagesRef = useRef<Set<number>>(new Set());
    const [winners, setWinners] = useState<LotteryRecentWinner[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const currentUserIds = [user?.userId, user?.id].map((value) => String(value || '').trim()).filter(Boolean);
    const pageSize = Math.min(40, Math.max(10, limit));

    const historyFallback = useMemo(() => flattenHistoryEvents(events), [events]);

    useEffect(() => {
        if (!historyFallback.length) return;
        setWinners((prev) => mergeWinners(prev, historyFallback));
    }, [historyFallback]);

    const refreshScrollState = useCallback(() => {
        const rail = railRef.current;
        if (!rail) return;
        const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
        setCanScrollLeft(rail.scrollLeft > 8);
        setCanScrollRight(rail.scrollLeft < maxScrollLeft - 8);
    }, []);

    const loadPage = useCallback(async (nextPage: number, replace = false) => {
        if (requestedPagesRef.current.has(nextPage)) return;
        requestedPagesRef.current.add(nextPage);
        setIsLoading(true);
        setLoadError('');

        try {
            const response = await lotteryApi.getRecentWinners(nextPage, pageSize);
            const nextWinners = response.data || [];
            setWinners((prev) => mergeWinners(replace ? [] : prev, nextWinners));
            setPage(response.pagination?.page || nextPage);
            setHasMore(Boolean(response.pagination?.hasNextPage ?? nextWinners.length >= pageSize));
        } catch {
            requestedPagesRef.current.delete(nextPage);
            setLoadError('Could not load more winners right now.');
            setHasMore(false);
        } finally {
            setIsLoading(false);
            window.setTimeout(refreshScrollState, 80);
        }
    }, [pageSize, refreshScrollState]);

    useEffect(() => {
        requestedPagesRef.current.clear();
        setPage(0);
        setHasMore(true);
        void loadPage(1, true);
    }, [loadPage]);

    const maybeLoadNextPage = useCallback(() => {
        const rail = railRef.current;
        if (!rail || isLoading || !hasMore) return;
        const remaining = rail.scrollWidth - rail.clientWidth - rail.scrollLeft;
        if (remaining < 320) {
            void loadPage(page + 1);
        }
    }, [hasMore, isLoading, loadPage, page]);

    useEffect(() => {
        refreshScrollState();
        const rail = railRef.current;
        if (!rail) return;
        const onScroll = () => {
            refreshScrollState();
            maybeLoadNextPage();
        };
        rail.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', refreshScrollState);
        return () => {
            rail.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', refreshScrollState);
        };
    }, [maybeLoadNextPage, refreshScrollState, winners.length]);

    const scrollRail = (direction: 'left' | 'right') => {
        const rail = railRef.current;
        if (!rail) return;
        const distance = Math.max(rail.clientWidth * 0.82, 300);
        rail.scrollBy({
            left: direction === 'left' ? -distance : distance,
            behavior: 'smooth',
        });
        if (direction === 'right') window.setTimeout(maybeLoadNextPage, 260);
    };

    const updateWinner = (winnerId: string, patch: Partial<LotteryWinner>) => {
        setWinners((prev) => prev.map((winner) => (winner._id === winnerId ? { ...winner, ...patch } : winner)));
    };

    if (!winners.length && !isLoading) return null;

    return (
        <section className="relative mt-4 mb-16 overflow-hidden rounded-[1.35rem] border border-amber-500/20 bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,0.06),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(217,119,6,0.04),transparent_30%),linear-gradient(135deg,rgba(10,10,12,0.98),rgba(7,7,9,0.96)_48%,rgba(4,4,5,0.98))] p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-[18px] sm:mt-8 sm:mb-0 sm:p-5">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-50">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        Previous winners
                    </div>
                    <h3 className="mt-3 text-xl font-black uppercase tracking-[-0.02em] text-white sm:text-2xl">
                        Winner reel
                    </h3>
                    <p className="mt-1 hidden max-w-2xl text-sm font-medium leading-6 text-white/58 sm:block">
                        Newest draws first, with event name, draw date, coupon tier, ticket number, and claim status in one clean rail.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    {winners.length} loaded{hasMore ? ' +' : ''}
                </div>
            </div>

            <button
                type="button"
                aria-label="Scroll winners left"
                onClick={() => scrollRail('left')}
                disabled={!canScrollLeft}
                className="absolute left-2 top-[58%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/45 text-white/70 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:scale-[1.03] hover:border-amber-500/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:grid"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                type="button"
                aria-label="Scroll winners right"
                onClick={() => scrollRail('right')}
                disabled={!canScrollRight && !hasMore}
                className="absolute right-2 top-[58%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-amber-500/28 bg-amber-500/12 text-amber-50 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:scale-[1.03] hover:border-amber-400/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:grid"
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-6 w-6" />}
            </button>

            {/* ── Mobile Compact List View (paginated, 10 at a time) ── */}
            <MobileCompactWinnersList winners={winners} />

            {/* ── Desktop/Tablet Card Rail ── */}
            <div
                ref={railRef}
                className="mt-5 hidden snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [scrollbar-width:thin] [scrollbar-color:rgba(245,158,11,0.25)_transparent] sm:flex md:px-10"
            >
                {winners.map((winner, index) => {
                    const winnerName = playerDisplayName(winner);
                    const isWhale = isWhaleWin(winner.reward);
                    const isCurrentUserWinner =
                        winner.reward.rewardMode === 'token_payout' &&
                        currentUserIds.includes(String(winner.userId || '').trim());
                    const rankLabel = getRankLabel(winner.tierRank || winner.rank);

                    return (
                        <article
                            key={`${winner._id}-${winner.lotteryId}-${winner.couponTierId || 'default'}-${index}`}
                            className="relative flex w-[min(86vw,330px)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.05rem] border border-amber-500/15 bg-[linear-gradient(160deg,rgba(251,191,36,0.04),rgba(255,255,255,0.035)_42%,rgba(0,0,0,0.28))] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_46px_rgba(0,0,0,0.28)] sm:w-[350px]"
                        >
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.06),transparent_36%),radial-gradient(circle_at_82%_16%,rgba(217,119,6,0.04),transparent_34%)]" />
                            <div className="relative z-[1] flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/72">
                                        <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
                                        {formatDateLabel(winner.eventDrawTime)}
                                    </div>
                                    <h4 className="mt-2 line-clamp-2 text-base font-black leading-tight text-white">
                                        {winner.eventTitle || 'Lottery Draw'}
                                    </h4>
                                </div>
                                <div
                                    className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-500/40 bg-[linear-gradient(180deg,#3b2306,#0a0a0c)] text-lg font-black text-white shadow-[0_12px_30px_rgba(217,119,6,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-amber-500/20"
                                    aria-label={`${rankLabel} rank ${winner.tierRank || winner.rank}`}
                                >
                                    <span className="pointer-events-none absolute inset-1 rounded-xl border border-amber-500/15" />
                                    <span className="relative drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
                                        {winner.tierRank || winner.rank}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-[1] mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-amber-500/10 bg-black/22 p-3">
                                <div className="grid h-14 w-14 place-items-center rounded-full border border-amber-500/15 bg-[radial-gradient(circle_at_50%_24%,rgba(245,158,11,0.12),rgba(255,255,255,0.06)_46%,rgba(0,0,0,0.38))] text-base font-black text-white">
                                    {getInitials(winnerName)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[0.17em] text-white/45">
                                        {rankLabel}
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 truncate text-lg font-black text-white">
                                            {isWhale && <span className="text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" title="Grand Winner">👑</span>}
                                            <span className="truncate">{winnerName}</span>
                                        </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-black text-amber-100">
                                            <Ticket className="h-3 w-3" />
                                            {winner.lotteryNumber}
                                        </span>
                                        <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
                                            {formatTierLabel(winner)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-[1] mt-3 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Reward</span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/45">
                                        <Clock3 className="h-3 w-3" />
                                        {formatDateTime(winner.eventDrawTime)}
                                    </span>
                                </div>
                                <div className="truncate text-sm font-black text-amber-100">
                                    {rewardValueLabel(winner.reward)}
                                </div>
                                <div className="text-[11px] font-semibold text-white/50">
                                    {claimStatusLabel(winner)}
                                </div>
                            </div>

                            {isCurrentUserWinner ? (
                                <div className="relative z-[1] mt-3 rounded-2xl border border-amber-500/20 bg-[linear-gradient(180deg,rgba(217,119,6,0.11),rgba(0,0,0,0.34))] p-3">
                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Your winning payout
                                    </div>
                                    <LotteryWinnerClaimAction
                                        winner={winner}
                                        fullWidth
                                        compact={winner.claimStatus === 'claimed' || winner.claimStatus === 'processing'}
                                        onWinnerUpdate={updateWinner}
                                    />
                                </div>
                            ) : null}
                        </article>
                    );
                })}

                {hasMore || isLoading ? (
                    <button
                        type="button"
                        onClick={() => loadPage(page + 1)}
                        disabled={isLoading}
                        className="grid w-[min(72vw,260px)] shrink-0 snap-start place-items-center rounded-[1.05rem] border border-dashed border-amber-500/28 bg-amber-500/5 p-5 text-center text-amber-50 transition hover:border-amber-400/55 hover:bg-amber-500/12 disabled:cursor-wait disabled:opacity-75"
                    >
                        <span className="grid h-12 w-12 place-items-center rounded-full border border-amber-500/20 bg-black/25">
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-6 w-6" />}
                        </span>
                        <span className="mt-3 text-sm font-black uppercase tracking-[0.16em]">
                            {isLoading ? 'Loading winners' : 'Load more'}
                        </span>
                        <span className="mt-1 text-xs font-medium text-white/45">
                            Continue the previous winner rail
                        </span>
                    </button>
                ) : null}
            </div>

            {loadError ? (
                <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-50">
                    {loadError}
                </p>
            ) : null}
        </section>
    );
}

/* ── Sub-component: Paginated compact list for mobile ── */
const MOBILE_PAGE_SIZE = 10;

function MobileCompactWinnersList({ winners }: { winners: LotteryRecentWinner[] }) {
    const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
    const visible = winners.slice(0, visibleCount);
    const remaining = winners.length - visibleCount;

    if (!winners.length) return null;

    return (
        <div className="mt-3 sm:hidden">
            <div className="grid gap-1.5">
                {visible.map((winner, index) => {
                    const winnerName = playerDisplayName(winner);
                    const rankLabel = getRankLabel(winner.tierRank || winner.rank);
                    const isWhale = isWhaleWin(winner.reward);
                    return (
                        <article
                            key={`compact-${winner._id}-${index}`}
                            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2"
                        >
                            <div className="grid h-8 w-8 place-items-center rounded-lg border border-amber-500/15 bg-amber-500/8 text-[10px] font-black text-white">
                                {getInitials(winnerName)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="flex items-center gap-1 truncate text-xs font-black text-white">
                                        {isWhale && <span className="text-xs drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">👑</span>}
                                        <span className="truncate">{winnerName}</span>
                                    </span>
                                    <span className="shrink-0 rounded bg-amber-500/12 px-1.5 py-0.5 font-mono text-[9px] font-black text-amber-200">
                                        {winner.lotteryNumber}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-[10px] font-medium text-white/50">
                                    {rankLabel} · {rewardValueLabel(winner.reward)}
                                </div>
                            </div>
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-amber-500/20 bg-amber-500/8 text-xs font-black text-amber-300">
                                {winner.tierRank || winner.rank}
                            </div>
                        </article>
                    );
                })}
            </div>
            {remaining > 0 && (
                <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + MOBILE_PAGE_SIZE)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/8 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-500/15"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Show {Math.min(remaining, MOBILE_PAGE_SIZE)} more of {remaining}
                </button>
            )}
        </div>
    );
}
