import React, { useState, useEffect } from 'react';
import { Crown, Medal, UserCircle2 } from 'lucide-react';
import type { LotteryReward, LotteryWinner, LotteryWinnerConfig, LotteryEvent } from '@/lib/api/lotteryApi';
import type { TLotteryPhase } from '@/app/(dashboard)/lottery';
import { getFileUrl } from '@/lib/utils/file';
import { playerName } from './arena/lotteryArenaHelpers';
import { rewardValueLabel } from './lotteryFormat';

const prizeToneClasses = [
    'border-amber-200/38 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(255,255,255,0.035))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    'border-slate-300/34 bg-[linear-gradient(135deg,rgba(148,163,184,0.14),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    'border-orange-300/28 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
];

// ── Animated Number Component ──
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        const duration = 1000;
        const start = display;
        const end = value;
        if (start === end) return;
        let startTime: number | null = null;
        let animationFrameId: number;

        const tick = (now: number) => {
            if (!startTime) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            // easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setDisplay(start + (end - start) * ease);
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(tick);
            } else {
                setDisplay(end);
            }
        };
        animationFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value, display]);

    return (
        <span>
            {display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {suffix}
        </span>
    );
}

interface LotteryPrizeLadderProps {
    prizeConfigs: LadderPrizeConfig[];
    winners: LotteryWinner[];
    revealedRanks: number[];
    phase: TLotteryPhase;
    isCompletedSticky: boolean;
    event?: LotteryEvent | null;
    activeWinner?: LotteryWinner | null;
}

type LadderPrizeConfig = LotteryWinnerConfig & {
    reward: LotteryReward;
    couponTierId?: string;
    couponTierLabel?: string;
    couponTierAmount?: number;
    ladderKey?: string;
};

export default function LotteryPrizeLadder({
    prizeConfigs,
    winners,
    revealedRanks,
    phase,
    isCompletedSticky,
    event,
    activeWinner,
}: LotteryPrizeLadderProps) {
    // ── Helpers ──
    const isWinnerRevealed = (rank: number) => revealedRanks.includes(rank) || phase === 'completed' || isCompletedSticky;
    const winnerMatchesConfig = (winner: LotteryWinner, config: LadderPrizeConfig) => {
        if (!config.couponTierId) return winner.rank === config.rank;
        if (winner.couponTierId !== config.couponTierId) return false;
        return Number(winner.tierRank ?? winner.rank) === config.rank;
    };
    const isConfigRevealed = (config: LadderPrizeConfig, winner: LotteryWinner | null) => {
        if (phase === 'completed' || isCompletedSticky) return true;
        if (winner) return revealedRanks.includes(winner.rank);
        return isWinnerRevealed(config.rank);
    };
    const getWinnerForConfig = (config: LadderPrizeConfig) => {
        const pool = winners
            .filter((item) => {
                if (!winnerMatchesConfig(item, config)) return false;
                return isConfigRevealed(config, item);
            })
            .sort((a, b) => Number(a.couponAmount || 0) - Number(b.couponAmount || 0));
        return pool[0] || null; // Pick first for visual simplicity
    };

    const getTierPoolAmount = (config: LadderPrizeConfig) => {
        if (!config.couponTierId) return Number(event?.couponPools?.totalAmount || 0);
        const pool = event?.couponPools?.byTier?.[config.couponTierId];
        if (pool) return Number(pool.totalAmount || 0);
        const tier = event?.couponTiers?.find((item) => item.tierId === config.couponTierId);
        return Number(tier?.poolAmount || 0);
    };

    const getTierSymbol = (config: LadderPrizeConfig) => {
        const tier = event?.couponTiers?.find((item) => item.tierId === config.couponTierId);
        return tier?.currencySymbol || event?.couponTiers?.[0]?.currencySymbol || 'USDT';
    };

    const getTierLabel = (config: LadderPrizeConfig) => {
        if (config.couponTierLabel) return config.couponTierLabel;
        const tier = event?.couponTiers?.find((item) => item.tierId === config.couponTierId);
        if (tier?.label) return tier.label;
        if (tier?.amount) return `${tier.amount} ${tier.currencySymbol || 'USDT'} Coupon`;
        return 'Coupon pool';
    };

    const formatDynamicReward = (config: LadderPrizeConfig, winner: LotteryWinner | null): { main: React.ReactNode; detail?: string } => {
        const reward = config.reward;
        if (reward?.poolSharePercent != null) {
            const amount = winner?.poolPrize?.grossAmount != null
                ? Number(winner.poolPrize.grossAmount)
                : (getTierPoolAmount(config) * reward.poolSharePercent) / 100;
            const symbol = getTierSymbol(config);
            return {
                main: <AnimatedNumber value={Number.isFinite(amount) ? amount : 0} suffix={` ${symbol}`} />,
                detail: `${reward.poolSharePercent}% of ${getTierLabel(config)} pool`,
            };
        }
        return { main: rewardValueLabel(reward) };
    };

    return (
        <aside className="rounded-[1.25rem] border border-amber-100/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.06),rgba(250,204,21,0.015)),rgba(9,9,11,0.95)] p-4 shadow-[0_22px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
            {/* Header */}
            <header className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/22 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                        <Crown className="h-4 w-4 text-amber-300" />
                        Reward desk
                    </div>
                    <h3 className="mt-3 text-[1.12rem] font-black text-white">Winner ladder</h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Tiers</div>
                    <div className="mt-1 text-xl font-black text-white">{prizeConfigs.length || 0}</div>
                </div>
            </header>

            {/* Ladder Grid */}
            <div className="mt-5 grid gap-3">
                {prizeConfigs.map((config: LadderPrizeConfig, index: number) => {
                    const winner = getWinnerForConfig(config);
                    const displayReward = formatDynamicReward(config, winner);
                    const hasMedia = config.reward?.type !== 'text';

                    // Active Draw Highlighting
                    const isActiveDraw = activeWinner
                        && winnerMatchesConfig(activeWinner, config)
                        && ['tumbling', 'drawing', 'ejecting'].includes(phase);
                    const highlightClass = isActiveDraw ? 'ring-2 ring-amber-300/80 ring-offset-2 ring-offset-[#09090b] shadow-[0_0_30px_rgba(251,191,36,0.35)] animate-pulse' : '';

                    return (
                        <article
                            key={`prize-${config.ladderKey || `${config.rank}-${index}`}`}
                            className={`relative grid min-h-[108px] ${hasMedia ? 'grid-cols-[auto_minmax(0,1fr)_62px]' : 'grid-cols-[auto_minmax(0,1fr)]'} items-center gap-3 overflow-hidden rounded-[1.05rem] border p-3 transition-all duration-500 ${prizeToneClasses[index] || 'border-white/10 bg-white/[0.035]'} ${highlightClass}`}
                        >
                            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                            
                            {/* Rank Badge */}
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/18 bg-white/[0.07] text-lg font-black text-white shadow-[inset_0_0_16px_rgba(255,255,255,0.06)]">
                                {config.rank}
                            </div>
                            
                            {/* Reward Details */}
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-black text-white">
                                    {displayReward.main}
                                </h4>
                                {displayReward.detail ? (
                                    <p className="mt-1 truncate text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/45">
                                        {displayReward.detail}
                                    </p>
                                ) : config.couponTierId ? (
                                    <p className="mt-1 truncate text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/45">
                                        {getTierLabel(config)}
                                    </p>
                                ) : null}
                                {winner ? (
                                    <span className="mt-2 flex items-center gap-1.5 truncate text-[0.72rem] font-black text-amber-200/90">
                                        <Medal className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                                        {playerName(winner)} won {winner.lotteryNumber}
                                    </span>
                                ) : isActiveDraw ? (
                                    <span className="mt-2 flex items-center gap-1.5 truncate text-[0.72rem] font-black text-amber-300">
                                        <UserCircle2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                                        Drawing winner...
                                    </span>
                                ) : (
                                    <span className="mt-2 block truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white/45">
                                        Waiting for draw
                                    </span>
                                )}
                            </div>

                            {/* Media (Hidden for 'text' rewards) */}
                            {hasMedia && (
                                <div className="group h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/30">
                                    <RewardMedia reward={config.reward} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                </div>
                            )}
                        </article>
                    );
                })}

                {/* Skeleton Loading State */}
                {prizeConfigs.length === 0 && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <article key={`skeleton-${i}`} className="grid min-h-[108px] grid-cols-[auto_minmax(0,1fr)_62px] items-center gap-3 overflow-hidden rounded-[1.05rem] border border-white/5 bg-white/[0.02] p-3">
                                <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                                <div className="flex flex-col gap-2">
                                    <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse mt-1" />
                                </div>
                                <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                            </article>
                        ))}
                    </>
                )}
            </div>
        </aside>
    );
}


export function RewardMedia({ reward, className = '' }: { reward?: LotteryReward; className?: string }) {
    if (!reward) return null;
    if (reward.type === 'image' && reward.value) {
        return (
            <img
                src={getFileUrl(reward.value)}
                alt={reward.label || 'Reward'}
                className={`w-full rounded-2xl object-cover ${className}`}
            />
        );
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
        <div
            className={`flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs font-semibold text-white ${className}`}
        >
            {reward.value}
        </div>
    );
}
