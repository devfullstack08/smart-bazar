'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Crown, Trophy, ExternalLink, Loader2, LockKeyhole, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { LotteryReward, LotteryWinner, lotteryApi } from '@/lib/api/lotteryApi';
import { getRankLabel, playerDisplayName, rewardValueLabel } from './lotteryFormat';
import { getFileUrl } from '@/lib/utils/file';
import { getErrorMessage } from '@/lib/utils/error';

interface WinnersPodiumProps {
    winners: LotteryWinner[];
    /**
     * Subset of ranks already revealed. Hidden ranks render as locked
     * placeholders — this lets the orchestrator drive a per-rank reveal.
     */
    revealedRanks?: number[];
    /** Render every rank as revealed (for the 24h sticky completed view). */
    revealAll?: boolean;
}

function RewardMedia({ reward, className = '' }: { reward?: LotteryReward; className?: string }) {
    if (!reward) return null;
    if (reward.type === 'image' && reward.value) {
        return <img src={getFileUrl(reward.value)} alt={reward.label || 'Reward'} className={`w-full rounded-2xl object-cover ${className}`} />;
    }
    if (reward.type === 'video' && reward.value) {
        return (
            <video
                src={getFileUrl(reward.value)}
                className={`w-full rounded-2xl bg-black object-cover ${className}`}
                muted
                controls
                playsInline
                preload="metadata"
            />
        );
    }
    return (
        <div className={`flex items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-2.5 text-center text-base sm:text-lg font-black tracking-wide text-amber-200 shadow-inner ${className}`}>
            {reward.value}
        </div>
    );
}

interface WinnerCardProps {
    winner: LotteryWinner;
    isFirst?: boolean;
    heightClass?: string;
    orderClass?: string;
    revealed: boolean;
    claiming: boolean;
    onClaim: (winnerId: string, rank: number) => Promise<void>;
    currentUserIds: string[];
}

function WinnerCard({
    winner,
    isFirst = false,
    heightClass = '',
    orderClass = '',
    revealed,
    claiming,
    onClaim,
    currentUserIds,
}: WinnerCardProps) {
    const isTokenPayout = winner.reward.rewardMode === 'token_payout';
    const canShowClaim = currentUserIds.includes(String(winner.userId || '').trim()) && isTokenPayout;

    const tone = isFirst
        ? 'border-amber-300/45 bg-[linear-gradient(155deg,rgba(255,231,178,0.22),rgba(245,158,11,0.2))] shadow-[0_28px_100px_-48px_rgba(251,191,36,0.85)]'
        : winner.rank === 2
            ? 'border-slate-300/30 bg-[linear-gradient(155deg,rgba(226,232,240,0.10),rgba(148,163,184,0.12))]'
            : winner.rank === 3
                ? 'border-orange-300/30 bg-[linear-gradient(155deg,rgba(251,146,60,0.10),rgba(180,83,9,0.18))]'
                : 'border-amber-500/20 bg-[linear-gradient(155deg,rgba(251,191,36,0.06),rgba(217,119,6,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(245,158,11,0.02)]';

    if (!revealed) {
        return (
            <div
                className={`lottery-podium-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-5 text-center backdrop-blur h-full flex flex-col justify-center ${heightClass} ${orderClass}`}
            >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="relative z-10 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                    {getRankLabel(winner.rank)}
                </div>
                <div className="mt-2.5 sm:mt-3 text-base sm:text-lg font-black text-white">Awaiting reveal…</div>
                <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400">The wheel is still spinning for this rank.</div>
            </div>
        );
    }

    return (
        <div
            className={`lottery-podium-card relative overflow-hidden rounded-3xl border p-3.5 sm:p-5 text-center backdrop-blur h-full flex flex-col justify-between ${tone} ${heightClass} ${orderClass}`}
        >
            {isFirst ? (
                <>
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/90 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15),transparent_65%)] opacity-75 animate-pulse" />
                </>
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)] opacity-60 z-0" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-center">
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                            isFirst 
                                ? 'bg-amber-300 text-black hover:scale-110 hover:-rotate-12 duration-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                                : winner.rank === 2
                                    ? 'bg-slate-300/20 text-slate-200 hover:scale-105 duration-300'
                                    : winner.rank === 3
                                        ? 'bg-orange-300/20 text-orange-200 hover:scale-105 duration-300'
                                        : 'bg-amber-500/10 text-amber-300/90 hover:scale-105 duration-300'
                        }`}>
                            {isFirst ? <Crown className="h-5 w-5 sm:h-6 sm:w-6" /> : <Trophy className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
                        </div>
                    </div>
                    <div className={`mt-2.5 sm:mt-3 text-[10px] font-bold uppercase tracking-[0.3em] ${
                        isFirst 
                            ? 'text-amber-50' 
                            : winner.rank === 2
                                ? 'text-slate-300'
                                : winner.rank === 3
                                    ? 'text-orange-300/90'
                                    : 'text-amber-400/80'
                    }`}>
                        {isFirst ? 'Grand Prize Winner' : 'Winner Locked'}
                    </div>
                    <div className={`mt-1 sm:mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] ${
                        isFirst 
                            ? 'text-amber-100' 
                            : winner.rank === 2
                                ? 'text-slate-400'
                                : winner.rank === 3
                                    ? 'text-orange-400/80'
                                    : 'text-amber-500/70'
                    }`}>
                        {getRankLabel(winner.rank)}
                    </div>
                    <div className={`mt-1 truncate font-black ${isFirst ? 'text-xl sm:text-2xl text-white' : 'text-base sm:text-lg text-white'}`}>
                        {playerDisplayName(winner)}
                    </div>
                    
                    {/* Styled Physical "Lottery Ticket" Cutout View */}
                    <div className="flex justify-center mt-2">
                        <div className={`relative px-4 py-1 font-mono font-extrabold tracking-[0.18em] text-center border-y border-dashed overflow-hidden ${
                            isFirst 
                                ? 'text-xs border-amber-300/30 bg-amber-400/5 text-amber-200' 
                                : winner.rank === 2
                                    ? 'text-[10px] sm:text-xs border-slate-300/20 bg-slate-400/5 text-slate-300/90'
                                    : winner.rank === 3
                                        ? 'text-[10px] sm:text-xs border-orange-300/20 bg-orange-400/5 text-orange-300/90'
                                        : 'text-[10px] sm:text-xs border-amber-500/20 bg-amber-500/5 text-amber-300/70'
                        }`}>
                            {/* Left Ticket Notch */}
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0c0c10] border-r border-white/5" />
                            {/* Right Ticket Notch */}
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0c0c10] border-l border-white/5" />
                            
                            <span className="relative z-10">{winner.lotteryNumber}</span>
                        </div>
                    </div>

                    <div className="mt-2.5 sm:mt-3">
                        <RewardMedia reward={winner.reward} className={winner.reward.type === 'text' ? '' : isFirst ? 'h-20 sm:h-28' : 'h-18 sm:h-24'} />
                    </div>
                    <div className={`mt-1.5 sm:mt-2 font-semibold text-slate-200 ${isFirst ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px] truncate'}`}>
                        {rewardValueLabel(winner.reward)}
                    </div>
                </div>

                {isTokenPayout ? (
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 shrink-0">
                        {canShowClaim ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-amber-400">
                                <Wallet className="h-3 w-3" />
                                Winning account can claim this payout
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
                                <LockKeyhole className="h-3 w-3" />
                                Reserved for the winning account
                            </div>
                        )}
                        {canShowClaim ? (
                            <div>
                                {(winner.claimStatus === 'claimable' || winner.claimStatus === 'failed') ? (
                                    <button
                                        onClick={() => onClaim(winner._id, winner.rank)}
                                        disabled={claiming}
                                        className="relative overflow-hidden w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-amber-300/60 bg-[linear-gradient(180deg,#fcd34d,#fbbf24)] px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[0.06em] text-[#2b1500] shadow-[0_4px_14px_rgba(251,191,36,0.25)] transition hover:brightness-110 disabled:opacity-50"
                                    >
                                        <span className="absolute inset-0 animate-shimmer pointer-events-none" />
                                        {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        {claiming ? 'Claiming...' : 'Claim Payout'}
                                    </button>
                                ) : winner.claimStatus === 'processing' ? (
                                    <div className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-amber-200">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-200" /> Processing...
                                    </div>
                                ) : winner.claimStatus === 'claimed' ? (
                                    <div className="w-full inline-flex justify-center flex-col items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-amber-400">
                                        Claimed
                                        {winner.claimTxHash && (
                                            <a href={`https://bscscan.com/tx/${winner.claimTxHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300">
                                                View TX <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>
                                ) : winner.claimStatus === 'blocked' ? (
                                    <div className="w-full inline-flex justify-center items-center rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-red-400">
                                        Payout Blocked
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function WinnersPodium({ winners, revealedRanks, revealAll = false }: WinnersPodiumProps) {
    const [localWinners, setLocalWinners] = useState<LotteryWinner[]>(winners);
    const { user } = useAppSelector((state) => state.auth);
    const [claiming, setClaiming] = useState<Record<string, boolean>>({});
    const currentUserIds = [user?.userId, user?.id].map((value) => String(value || '').trim()).filter(Boolean);

    const railRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [scrollRatio, setScrollRatio] = useState(0);

    const refreshScrollState = useCallback(() => {
        const rail = railRef.current;
        if (!rail) return;
        const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
        setCanScrollLeft(rail.scrollLeft > 8);
        setCanScrollRight(rail.scrollLeft < maxScrollLeft - 8);
        setScrollRatio(maxScrollLeft > 0 ? rail.scrollLeft / maxScrollLeft : 0);
    }, []);

    useEffect(() => {
        refreshScrollState();
        const rail = railRef.current;
        if (!rail) return;
        
        const onScroll = () => {
            refreshScrollState();
        };
        
        rail.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', refreshScrollState);
        return () => {
            rail.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', refreshScrollState);
        };
    }, [refreshScrollState, localWinners]);

    const scrollRail = (direction: 'left' | 'right') => {
        const rail = railRef.current;
        if (!rail) return;
        const distance = Math.max(rail.clientWidth * 0.8, 300);
        rail.scrollBy({
            left: direction === 'left' ? -distance : distance,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        setLocalWinners(winners);
        // Reset scroll position and recalculate indicators on new data
        if (railRef.current) {
            railRef.current.scrollLeft = 0;
        }
        window.setTimeout(refreshScrollState, 100);
    }, [winners, refreshScrollState]);

    const handleClaim = async (winnerId: string, rank: number) => {
        try {
            setClaiming((prev) => ({ ...prev, [rank]: true }));
            await lotteryApi.claimReward(winnerId);
            toast.success('Payout claimed successfully! Please wait for on-chain processing.');
            
            // Optimistically update local state to 'processing'
            setLocalWinners((prev) => 
                prev.map(w => w._id === winnerId ? { ...w, claimStatus: 'processing' } : w)
            );
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to claim reward'));
        } finally {
            setClaiming((prev) => ({ ...prev, [rank]: false }));
        }
    };

    const sorted = [...localWinners].sort((a, b) => a.rank - b.rank);
    const isRevealed = (rank: number) => revealAll || (revealedRanks?.includes(rank) ?? false);

    if (!sorted.length) return null;

    return (
        <div className="relative group/winners-rail">
            {/* Left Scroll Button */}
            <button
                type="button"
                onClick={() => scrollRail('left')}
                disabled={!canScrollLeft}
                className="absolute -left-4 top-[50%] z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-amber-500/20 bg-black/70 text-amber-100 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-[1.05] hover:border-amber-400/50 hover:text-white disabled:pointer-events-none disabled:opacity-0 md:grid"
                aria-label="Scroll left"
            >
                <ChevronLeft className="h-6 w-6 text-amber-300" />
            </button>

            {/* Right Scroll Button */}
            <button
                type="button"
                onClick={() => scrollRail('right')}
                disabled={!canScrollRight}
                className="absolute -right-4 top-[50%] z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-amber-500/28 bg-amber-500/12 text-amber-50 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-[1.05] hover:border-amber-400/50 hover:text-white disabled:pointer-events-none disabled:opacity-0 md:grid"
                aria-label="Scroll right"
            >
                <ChevronRight className="h-6 w-6 text-amber-300" />
            </button>

            {/* Scrollable Container */}
            <div
                ref={railRef}
                className="flex overflow-x-auto gap-4 pb-4 pt-1 snap-x scroll-smooth hide-scrollbar w-full"
            >
                {sorted.map((winner) => {
                    const isFirst = winner.rank === 1;
                    return (
                        <div
                            key={winner.rank}
                            className="flex-shrink-0 w-[min(260px,76vw)] snap-center"
                        >
                            <WinnerCard
                                winner={winner}
                                isFirst={isFirst}
                                revealed={isRevealed(winner.rank)}
                                claiming={Boolean(claiming[winner.rank])}
                                onClaim={handleClaim}
                                currentUserIds={currentUserIds}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Scroll Indicator progress rail at the bottom */}
            {sorted.length > 1 && (
                <div className="mt-4 flex justify-center items-center">
                    <div className="w-20 h-[3px] rounded-full bg-white/10 overflow-hidden relative">
                        <div 
                            className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-75"
                            style={{
                                left: `${scrollRatio * 65}%`, // track width (100%) minus thumb width (35%)
                                width: '35%',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
