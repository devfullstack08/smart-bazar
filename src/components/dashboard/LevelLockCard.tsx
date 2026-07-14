'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Users, Trophy, Zap, TrendingUp, CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import { teamApi, projectApi, userApi } from '@/lib/api/services';
import { TeamStatsData } from '@/types';

/* ─── helpers: parse levelNUpgrade keys from config ────────────── */
type LevelUpgradeConfig = {
    withinDays: number;
    directsRequired: number;
    businessRequired: number;
    defaultPercentage: number;
    upgradedPercentage: number;
};

function parseLevelUpgrades(cfg: Record<string, any> | null | undefined): Map<number, LevelUpgradeConfig> {
    const map = new Map<number, LevelUpgradeConfig>();
    if (!cfg) return map;
    for (const key of Object.keys(cfg)) {
        const m = key.match(/^level(\d+)Upgrade$/);
        if (m) {
            const val = cfg[key];
            if (val && typeof val === 'object' && 'withinDays' in val) {
                map.set(parseInt(m[1], 10), val as LevelUpgradeConfig);
            }
        }
    }
    return map;
}

/* ─── Level Upgrade Countdown (dynamic for any level) ──────────── */
function LevelUpgradeCountdown({ levelNum, joinDate, upgrade, currentDirects, businessMet }: {
    levelNum: number;
    joinDate: string | null;
    upgrade: LevelUpgradeConfig;
    currentDirects: number;
    businessMet: boolean;
}) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        if (!joinDate) return;
        const deadline = new Date(joinDate).getTime() + upgrade.withinDays * 24 * 60 * 60 * 1000;
        const tick = () => {
            const diff = deadline - Date.now();
            if (diff <= 0) { setExpired(true); setTimeLeft(null); return; }
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / (1000 * 60)) % 60),
            });
        };
        tick();
        const interval = setInterval(tick, 60000);
        return () => clearInterval(interval);
    }, [joinDate, upgrade.withinDays]);

    const directsOk = currentDirects >= upgrade.directsRequired;
    const allMet = directsOk && businessMet;

    if (allMet && !expired) {
        return (
            <div className="rounded-xl p-3 mt-2 border" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}>
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-400">Level {levelNum} Upgrade Achieved!</span>
                </div>
                <p className="text-[10px] text-emerald-400/70 mt-1">You earn {(upgrade.upgradedPercentage * 100).toFixed(1)}% on Level {levelNum} ROI.</p>
            </div>
        );
    }

    if (expired) {
        return (
            <div className="rounded-xl p-3 mt-2 border" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.2)' }}>
                <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[11px] font-bold text-red-400">Level {levelNum} upgrade expired</span>
                </div>
                <p className="text-[10px] text-red-400/70 mt-1">The {upgrade.withinDays}-day window has passed. Level {levelNum} uses the default {(upgrade.defaultPercentage * 100).toFixed(1)}% rate.</p>
            </div>
        );
    }

    if (!timeLeft) return null;

    return (
        <div className="rounded-xl p-3 mt-2 border" style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Clock size={12} style={{ color: '#A78BFA' }} />
                    <span className="text-[11px] font-bold text-[var(--foreground)]">Level {levelNum} Upgrade</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: timeLeft.days <= 2 ? '#F87171' : '#A78BFA' }}>
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m
                </span>
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--muted)]">Directs</span>
                    <span className={`text-[10px] font-bold ${directsOk ? 'text-emerald-400' : ''}`}>
                        {currentDirects}/{upgrade.directsRequired}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--muted)]">Business</span>
                    <span className={`text-[10px] font-bold ${businessMet ? 'text-emerald-400' : ''}`}>
                        {businessMet ? '✓ Met' : `${formatCurrency(upgrade.businessRequired)} needed`}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─── Level ROI Tab ─────────────────────────────────────────────── */
function LevelRoiTab({ teamData, incomeConfig, userJoinDate }: { teamData: TeamStatsData | null; incomeConfig: Record<string, any> | null; userJoinDate: string | null }) {
    const cfg = incomeConfig?.level_roi;
    const inv = teamData?.investment;

    if (!cfg?.levels?.length) {
        return (
            <div className="flex items-center justify-center py-12 text-[var(--muted)] text-sm">
                {!teamData || !incomeConfig ? 'Loading…' : 'Level ROI not configured.'}
            </div>
        );
    }

    const directCount = teamData?.stats?.directReferrals ?? 0;
    const powerLine = inv?.powerLineBusiness ?? 0;
    const otherLines = inv?.otherLinesBusiness ?? 0;
    const teamBusiness = inv?.totalTeamBusiness ?? 0;
    const lineSplit = inv?.lineSplit ?? cfg.lineSplit;
    const powerPct = ((lineSplit as any)?.powerLinePercent ?? 50) / 100;
    const otherPct = ((lineSplit as any)?.otherLinesPercent ?? 50) / 100;
    const upgradeMap = parseLevelUpgrades(cfg);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const scrollByCards = (direction: 'prev' | 'next') => {
        const container = scrollRef.current;
        if (!container) return;
        const cardWidth = 240 + 16; // card width + gap
        const delta = direction === 'next' ? cardWidth * 2 : -cardWidth * 2;
        container.scrollBy({ left: delta, behavior: 'smooth' });
    };

    return (
        <div className="gba-infinite-scroll-wrap py-5 px-1 relative">
            {/* Prev/Next controls */}
            <button
                type="button"
                onClick={() => scrollByCards('prev')}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 border border-white/10 text-[var(--muted)] hover:text-white hover:bg-black/60 transition-colors"
                aria-label="Previous levels"
            >
                <ChevronLeft size={16} />
            </button>
            <button
                type="button"
                onClick={() => scrollByCards('next')}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 border border-white/10 text-[var(--muted)] hover:text-white hover:bg-black/60 transition-colors"
                aria-label="Next levels"
            >
                <ChevronRight size={16} />
            </button>

            <div
                ref={scrollRef}
                className="overflow-x-auto no-scrollbar"
                style={{ width: '100%' }}
            >
                <div className="gba-infinite-scroll flex" style={{ width: 'max-content' }}>
                    {[0, 1].map((loop) => (
                        <div key={loop} className="flex gap-4 pr-4" style={{ flexShrink: 0 }}>
                            {cfg.levels.map((lvl: any) => {
                            const powerRequired = Math.ceil(lvl.businessRequired * powerPct);
                            const otherRequired = Math.floor(lvl.businessRequired * otherPct);
                            const directsOk = lvl.directsRequired === 0 || directCount >= lvl.directsRequired;
                            const powerOk = lvl.businessRequired === 0 || powerLine >= powerRequired;
                            const otherOk = lvl.businessRequired === 0 || otherLines >= otherRequired;
                            const unlocked = directsOk && powerOk && otherOk;
                            const roiPct = (lvl.percentage * 100).toFixed(1);
                            const lvlUpgrade = upgradeMap.get(lvl.level);

                            return (
                                <div
                                    key={`${loop}-${lvl.level}`}
                                    className="level-lock-card w-[240px] flex-shrink-0 rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                                    style={{
                                        background: unlocked
                                            ? 'linear-gradient(145deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.05) 100%)'
                                            : 'linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)',
                                        borderColor: unlocked ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)',
                                        boxShadow: unlocked
                                            ? '0 8px 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(34,197,94,0.15)'
                                            : '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {/* Header strip */}
                                    <div className="px-4 pt-3 pb-2 flex items-center justify-between"
                                        style={{
                                            background: unlocked
                                                ? 'linear-gradient(90deg, rgba(34,197,94,0.15), transparent)'
                                                : 'linear-gradient(90deg, rgba(139,92,246,0.1), transparent)',
                                            borderBottom: `1px solid ${unlocked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black"
                                                style={{
                                                    background: unlocked ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)',
                                                    color: unlocked ? '#4ADE80' : '#A78BFA',
                                                    border: `1px solid ${unlocked ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.3)'}`,
                                                }}>
                                                {lvl.level}
                                            </div>
                                            <span className="text-[11px] font-semibold text-[var(--muted)]">Level</span>
                                        </div>
                                        {unlocked ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                                <CheckCircle2 size={9} /> UNLOCKED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
                                                <Lock size={9} /> LOCKED
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {/* ROI */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[var(--muted)]">Level ROI</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-black" style={{ color: '#A78BFA' }}>{roiPct}%</span>
                                                {lvlUpgrade && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                                                        ↑{((lvlUpgrade.upgradedPercentage ?? 0) * 100).toFixed(1)}% in {lvlUpgrade.withinDays}d
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Level upgrade countdown (dynamic for any level) */}
                                        {lvlUpgrade && (
                                            <LevelUpgradeCountdown
                                                levelNum={lvl.level}
                                                joinDate={userJoinDate}
                                                upgrade={lvlUpgrade}
                                                currentDirects={directCount}
                                                businessMet={(() => {
                                                    const powerReq = Math.ceil(lvlUpgrade.businessRequired * powerPct);
                                                    const otherReq = Math.floor(lvlUpgrade.businessRequired * otherPct);
                                                    return powerLine >= powerReq && otherLines >= otherReq;
                                                })()}
                                            />
                                        )}

                                        {/* Directs */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                                                    <Users size={10} /> Directs
                                                </span>
                                                <span className={`text-[11px] font-bold ${directsOk ? 'text-emerald-400' : 'text-[var(--foreground)]'}`}>
                                                    {directCount} / {lvl.directsRequired}
                                                </span>
                                            </div>
                                            {lvl.directsRequired > 0 && (
                                                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                    <div className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(100, (directCount / lvl.directsRequired) * 100)}%`,
                                                            background: directsOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#8B5CF6,#A78BFA)',
                                                        }} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Business */}
                                        {lvl.businessRequired > 0 && (
                                            <div className="rounded-xl p-2.5 space-y-2"
                                                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] text-[var(--muted)]">Business</span>
                                                    <span className={`text-[11px] font-bold ${(powerOk && otherOk) ? 'text-emerald-400' : ''}`}>
                                                        {formatCurrency(teamBusiness)} / {formatCurrency(lvl.businessRequired)}
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] text-amber-400/80 flex items-center gap-0.5">
                                                                <Zap size={9} /> Power ({Math.round(powerPct * 100)}%)
                                                            </span>
                                                            <span className={`text-[10px] font-semibold ${powerOk ? 'text-emerald-400' : 'text-[var(--muted)]'}`}>
                                                                {formatCurrency(powerLine)} / {formatCurrency(powerRequired)}
                                                            </span>
                                                        </div>
                                                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                            <div className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.min(100, powerRequired > 0 ? (powerLine / powerRequired) * 100 : 100)}%`,
                                                                    background: powerOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#F59E0B,#FCD34D)',
                                                                }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] text-cyan-400/80 flex items-center gap-0.5">
                                                                <TrendingUp size={9} /> Other ({Math.round(otherPct * 100)}%)
                                                            </span>
                                                            <span className={`text-[10px] font-semibold ${otherOk ? 'text-emerald-400' : 'text-[var(--muted)]'}`}>
                                                                {formatCurrency(otherLines)} / {formatCurrency(otherRequired)}
                                                            </span>
                                                        </div>
                                                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                            <div className="h-full rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.min(100, otherRequired > 0 ? (otherLines / otherRequired) * 100 : 100)}%`,
                                                                    background: otherOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#06B6D4,#22D3EE)',
                                                                }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Rank Tab ──────────────────────────────────────────────────── */
function RankTab({ teamData, incomeConfig }: { teamData: TeamStatsData | null; incomeConfig: Record<string, any> | null }) {
    const rankCfg = incomeConfig?.rank_income;
    const inv = teamData?.investment;

    if (!rankCfg?.ranks?.length) {
        return (
            <div className="flex items-center justify-center py-12 text-[var(--muted)] text-sm">
                {!teamData || !incomeConfig ? 'Loading…' : 'Rank income not configured.'}
            </div>
        );
    }

    const teamBusiness = inv?.totalTeamBusiness ?? 0;
    const powerLine = inv?.powerLineBusiness ?? 0;
    const otherLines = inv?.otherLinesBusiness ?? 0;
    const directCount = teamData?.stats?.directReferrals ?? 0;
    const selfPackage = inv?.packageValue ?? 0;

    // Build a map of how many directs hold each rank name
    const directsByRank: Record<string, number> = (teamData?.directReferrals ?? []).reduce(
        (acc: Record<string, number>, ref) => {
            const r = ref.rank || 'Member';
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        },
        {}
    );

    // Determine current achieved rank — include directRankReqs (same logic as backend)
    const currentRankLevel = rankCfg.ranks.reduce((highest: number, rank: any) => {
        const sbReq = rank.selfBusiness ?? rank.requirements?.selfBusiness ?? 0;
        const dtReq = rank.directTeam ?? rank.requirements?.directTeam ?? 0;
        const tbReq = rank.teamBusiness ?? rank.requirements?.teamBusiness ?? 0;
        const sbOk = sbReq === 0 || selfPackage >= sbReq;
        const dtOk = dtReq === 0 || directCount >= dtReq;
        const tbOk = tbReq === 0 || teamBusiness >= tbReq;
        let directReqsOk = true;
        if (Array.isArray(rank.directRankReqs) && rank.directRankReqs.length > 0) {
            const needed: Record<string, number> = {};
            for (const r of rank.directRankReqs) needed[r] = (needed[r] || 0) + 1;
            directReqsOk = Object.entries(needed).every(([rName, cnt]) => (directsByRank[rName] || 0) >= cnt);
        }
        return (sbOk && dtOk && tbOk && directReqsOk) ? rank.rankLevel : highest;
    }, 0);

    return (
        <div className="gba-infinite-scroll-wrap py-5 px-1">
            <div className="gba-infinite-scroll" style={{ width: 'max-content' }}>
                {['a', 'b'].map((loop) => (
                    <div key={loop} className="flex gap-4 pr-4" style={{ flexShrink: 0 }}>
                        {rankCfg.ranks.map((rank: any, rankIdx: number) => {
                            const achieved = rank.rankLevel <= currentRankLevel;
                            const isNext = rank.rankLevel === currentRankLevel + 1;
                            // Backend stores flat fields: rank.teamBusiness, rank.directTeam
                            // Frontend RankInfo uses rank.requirements.teamBusiness — support both
                            const teamReq = rank.teamBusiness ?? rank.requirements?.teamBusiness ?? 0;
                            const powerRequired = Math.ceil(teamReq * 0.5);
                            const otherRequired = Math.floor(teamReq * 0.5);
                            const teamOk = teamBusiness >= teamReq;
                            const powerOk = powerLine >= powerRequired;
                            const otherOk = otherLines >= otherRequired;
                            const directReq = rank.directTeam ?? rank.requirements?.directTeam ?? 0;
                            const directOk = directCount >= directReq;

                            return (
                                <div
                                    key={`${loop}-${rank.rankName ?? rankIdx}`}
                                    className="level-lock-card w-[250px] flex-shrink-0 rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                                    style={{
                                        background: achieved
                                            ? 'linear-gradient(145deg, rgba(245,158,11,0.14) 0%, rgba(251,191,36,0.05) 100%)'
                                            : isNext
                                                ? 'linear-gradient(145deg, rgba(245,158,11,0.06) 0%, var(--surface) 100%)'
                                                : 'linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)',
                                        borderColor: achieved ? 'rgba(245,158,11,0.45)' : isNext ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                                        boxShadow: achieved
                                            ? '0 8px 24px rgba(245,158,11,0.15), inset 0 1px 0 rgba(245,158,11,0.2)'
                                            : '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
                                    }}
                                >
                                    <div className="px-4 pt-3 pb-2 flex items-center justify-between"
                                        style={{
                                            background: achieved
                                                ? 'linear-gradient(90deg, rgba(245,158,11,0.18), transparent)'
                                                : 'linear-gradient(90deg, rgba(37,99,235,0.08), transparent)',
                                            borderBottom: `1px solid ${achieved ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        }}>
                                        <span className="text-sm font-black text-[var(--foreground)]">{rank.rankName}</span>
                                        {achieved ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                                <Trophy size={9} /> ACHIEVED
                                            </span>
                                        ) : isNext ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                NEXT
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
                                                <Lock size={9} /> LOCKED
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {rank.dailyReward != null && rank.dailyReward > 0 && (
                                            <div className="flex items-center justify-between rounded-lg px-3 py-2"
                                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                                <span className="text-[11px] text-[var(--muted)]">Daily Reward</span>
                                                <span className="text-sm font-black" style={{ color: '#F59E0B' }}>
                                                    {formatCurrency(rank.dailyReward)}
                                                    {rank.durationDays && <span className="text-[10px] ml-1 text-amber-400/70">×{rank.durationDays}d</span>}
                                                </span>
                                            </div>
                                        )}

                                        {teamReq > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] text-[var(--muted)]">Team Business</span>
                                                    <span className={`text-[11px] font-bold ${teamOk ? 'text-emerald-400' : ''}`}>
                                                        {formatCurrency(teamBusiness)} / {formatCurrency(teamReq)}
                                                    </span>
                                                </div>
                                                <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                    <div className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(100, (teamBusiness / teamReq) * 100)}%`,
                                                            background: teamOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#F59E0B,#FCD34D)',
                                                        }} />
                                                </div>
                                                <div className="rounded-xl p-2.5 space-y-1.5"
                                                    style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] text-amber-400/80 flex items-center gap-0.5"><Zap size={9} /> Power (50%)</span>
                                                            <span className={`text-[10px] font-semibold ${powerOk ? 'text-emerald-400' : 'text-[var(--muted)]'}`}>
                                                                {formatCurrency(powerLine)} / {formatCurrency(powerRequired)}
                                                            </span>
                                                        </div>
                                                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, powerRequired > 0 ? (powerLine / powerRequired) * 100 : 100)}%`, background: powerOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#F59E0B,#FCD34D)' }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] text-cyan-400/80 flex items-center gap-0.5"><TrendingUp size={9} /> Other (50%)</span>
                                                            <span className={`text-[10px] font-semibold ${otherOk ? 'text-emerald-400' : 'text-[var(--muted)]'}`}>
                                                                {formatCurrency(otherLines)} / {formatCurrency(otherRequired)}
                                                            </span>
                                                        </div>
                                                        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, otherRequired > 0 ? (otherLines / otherRequired) * 100 : 100)}%`, background: otherOk ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#06B6D4,#22D3EE)' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {directReq > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                                                    <Users size={10} /> Direct Count
                                                </span>
                                                <span className={`text-[11px] font-bold ${directOk ? 'text-emerald-400' : ''}`}>
                                                    {directCount} / {directReq}
                                                </span>
                                            </div>
                                        )}

                                        {/* Direct Rank Achievers requirement */}
                                        {Array.isArray(rank.directRankReqs) && rank.directRankReqs.length > 0 && (() => {
                                            // Group: ["Star-1","Star-1"] → {"Star-1": 2}
                                            const needed: Record<string, number> = {};
                                            for (const r of rank.directRankReqs) {
                                                needed[r] = (needed[r] || 0) + 1;
                                            }
                                            const allMet = Object.entries(needed).every(
                                                ([rName, cnt]) => (directsByRank[rName] || 0) >= cnt
                                            );
                                            return (
                                                <div className="rounded-xl p-2.5"
                                                    style={{ background: allMet ? 'rgba(34,197,94,0.07)' : 'rgba(139,92,246,0.07)', border: `1px solid ${allMet ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.15)'}` }}>
                                                    <div className="flex items-center gap-1 mb-1.5">
                                                        <Trophy size={10} style={{ color: allMet ? '#4ADE80' : '#A78BFA' }} />
                                                        <span className="text-[10px] font-semibold" style={{ color: allMet ? '#4ADE80' : '#A78BFA' }}>
                                                            Rank Achievers in Directs
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {Object.entries(needed).map(([rName, cnt]) => {
                                                            const have = directsByRank[rName] || 0;
                                                            const met = have >= cnt;
                                                            return (
                                                                <div key={rName} className="flex items-center justify-between">
                                                                    <span className="text-[10px] text-[var(--muted)]">{cnt}× {rName}</span>
                                                                    <span className={`text-[10px] font-bold ${met ? 'text-emerald-400' : 'text-[var(--foreground)]'}`}>
                                                                        {have}/{cnt}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export function LevelLockCard() {
    const [activeTab, setActiveTab] = useState<'levelRoi' | 'rank'>('levelRoi');
    const [teamData, setTeamData] = useState<TeamStatsData | null>(null);
    const [incomeConfig, setIncomeConfig] = useState<Record<string, any> | null>(null);
    const [userJoinDate, setUserJoinDate] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            teamApi.getTeamStats().then(setTeamData).catch(console.error),
            projectApi.getIncomeConfig().then((r) => setIncomeConfig(r?.data ?? r)).catch(console.error),
            userApi.getProfile().then((p) => setUserJoinDate(p?.joinedAt || p?.joinDate || (p as any)?.createdAt || null)).catch(console.error),
        ]);
    }, []);

    const levelCount = (incomeConfig?.level_roi?.levels as any[] | undefined)?.length;
    const rankCount = (incomeConfig?.rank_income?.ranks as any[] | undefined)?.length;

    return (
        <div className="relative overflow-hidden rounded-2xl"
            style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}>
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)' }} />

            {/* Header */}
            <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[var(--border)]"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(245,158,11,0.05) 100%)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(245,158,11,0.15))',
                            border: '1px solid rgba(139,92,246,0.3)',
                            boxShadow: '0 0 20px rgba(139,92,246,0.2)',
                        }}>
                        <Lock size={18} style={{ color: '#A78BFA' }} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--foreground)]">Level Lock Status</h3>
                        <p className="text-[11px] text-[var(--muted)]">Power Leg 50% · Other Legs 50% · Hover to pause</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('levelRoi')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                        style={activeTab === 'levelRoi' ? {
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.1))',
                            color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.4)',
                            boxShadow: '0 0 16px rgba(139,92,246,0.2)',
                        } : { background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                        <Unlock size={13} />
                        Level ROI
                        {levelCount && <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>{levelCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('rank')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                        style={activeTab === 'rank' ? {
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))',
                            color: '#FCD34D', border: '1px solid rgba(245,158,11,0.4)',
                            boxShadow: '0 0 16px rgba(245,158,11,0.2)',
                        } : { background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                        <Trophy size={13} />
                        Ranks
                        {rankCount && <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>{rankCount}</span>}
                    </button>
                </div>
            </div>

            <div className="relative z-10 min-h-[220px]">
                {activeTab === 'levelRoi' && <LevelRoiTab teamData={teamData} incomeConfig={incomeConfig} userJoinDate={userJoinDate} />}
                {activeTab === 'rank' && <RankTab teamData={teamData} incomeConfig={incomeConfig} />}
            </div>
        </div>
    );
}
