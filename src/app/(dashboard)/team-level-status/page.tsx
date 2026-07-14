'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { teamApi, projectApi } from '@/lib/api/services';
import { TeamStatsData } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/cn';
import {
    qualifiedDirectsForIncome,
    volumeAtLevelForLevelRoi,
    membersAtDepthActiveFromTeamStats,
} from '@/lib/utils/teamStats';
import { Users, UserPlus, CheckCircle2, Activity, UserX, Lock, Unlock, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export default function TeamLevelStatusPage() {
    const [teamData, setTeamData] = useState<TeamStatsData | null>(null);
    const [incomeConfig, setIncomeConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [levelInput, setLevelInput] = useState<string>('30');
    const [depthInput, setDepthInput] = useState<string>('30');

    const requestedLevels = useMemo(() => {
        const parsed = Number(levelInput);
        return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 200) : 30;
    }, [levelInput]);

    const memberDepth = useMemo(() => {
        const parsed = Number(depthInput);
        return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 200) : 30;
    }, [depthInput]);

    useEffect(() => {
        setLoading(true);
        teamApi.getTeamStats(requestedLevels)
            .then((res) => setTeamData(res ?? null))
            .finally(() => setLoading(false));
    }, [requestedLevels]);

    useEffect(() => {
        projectApi.getIncomeConfig()
            .then((res) => setIncomeConfig((res as any)?.data ?? res ?? null))
            .catch(() => {});
    }, []);

    const stats = teamData?.stats ?? {
        totalTeamMembers: 0,
        directReferrals: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        recentMembers: 0,
    };
    const qualifiedDirects = qualifiedDirectsForIncome(teamData ?? undefined);

    const inv = (teamData?.investment as any) ?? {};
    const levelCfg = incomeConfig?.level_roi ?? incomeConfig?.data?.level_roi;
    const levelDefs: any[] = Array.isArray(levelCfg?.levels) ? levelCfg.levels : [];

    const levelWiseBreakdown: { total: number; active: number; inactive: number }[] =
        (teamData as any)?.stats?.levelWiseBreakdown ?? [];
    const membersAtDepth: number[] = membersAtDepthActiveFromTeamStats(teamData);
    const exactLevelWiseBusiness: number[] = (teamData as any)?.investment?.levelWiseBusiness ?? [];

    const totalBusiness = Number(inv?.totalTeamBusiness ?? inv?.totalTeamInvestment ?? 0);
    const todayTeamBusiness = Number(inv?.todayBusiness ?? 0);
    const yesterdayTeamBusiness = Number(inv?.yesterdayBusiness ?? 0);

    const levelCards = useMemo(() => {
        return Array.from({ length: requestedLevels }, (_, idx) => {
            const level = idx + 1;
            const cfg = levelDefs.find((x) => Number(x?.level ?? 0) === level);
            const bRow = levelWiseBreakdown[idx];
            const teamCount = bRow ? bRow.total : Number(membersAtDepth[level] ?? 0);
            const activeCount = bRow ? bRow.active : teamCount;
            const inactiveCount = bRow ? bRow.inactive : 0;
            const directsRequired = Number(cfg?.directsRequired ?? level);
            const unlocked = qualifiedDirects >= directsRequired;

            const vol = volumeAtLevelForLevelRoi({
                levelIndex: level - 1,
                levelWiseBusiness: exactLevelWiseBusiness,
                teamCountAtLevel: teamCount,
                totalTeamMembers: stats.totalTeamMembers,
                totalBusiness,
            });

            return {
                level,
                teamCount,
                activeCount,
                inactiveCount,
                unlocked,
                estimatedBusiness: vol.value,
                volumeSource: vol.source,
            };
        });
    }, [
        requestedLevels,
        levelDefs,
        levelWiseBreakdown,
        membersAtDepth,
        qualifiedDirects,
        exactLevelWiseBusiness,
        stats.totalTeamMembers,
        totalBusiness,
    ]);

    const levelSummary = useMemo(() => {
        const unlocked = levelCards.filter((x) => x.unlocked).length;
        const next = levelCards.find((x) => !x.unlocked) ?? null;
        return { unlocked, total: levelCards.length, next };
    }, [levelCards]);

    if (loading) return <LoadingSpinner />;
    
    if (!teamData) {
        return (
            <div className="flex min-h-[45vh] items-center justify-center text-[var(--muted-foreground)] text-sm">
                No team level status available
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <UserPlus size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Team Level Matrix Status</h1>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">Audit active levels status, member ratios, and generation sales</p>
                            {teamData.sponsorId && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-semibold">
                                    Direct Sponsor: <span className="font-mono text-[var(--foreground)]">{teamData.sponsorId}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Milestone Position Card */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-primary animate-pulse" />
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Affiliate Level Milestone</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                        {levelSummary.unlocked} / {levelSummary.total} Levels Unlocked
                    </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {levelSummary.next
                        ? `Next Level Unlocked target: Level ${levelSummary.next.level} (Requires ${Math.max(0, levelSummary.next.level - qualifiedDirects)} more active direct referrals).`
                        : 'All team levels fully unlocked and clear. 🚀'}
                </p>
            </div>

            {/* General Team Stats Counters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total team network', value: stats.totalTeamMembers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Direct referrals', value: stats.directReferrals, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                    { label: 'Qualified directs', value: qualifiedDirects, icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
                    { label: 'Active members', value: stats.activeMembers, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Inactive members', value: stats.inactiveMembers, icon: UserX, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">{item.label}</span>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                                <item.icon size={13} className={item.color} />
                            </div>
                        </div>
                        <p className="text-xl font-black text-[var(--foreground)] tabular-nums leading-none mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Business Volume Card */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Affiliate Business Volume (PV)</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Total team business volume', value: totalBusiness, color: 'text-blue-500' },
                        { label: "Today's generation volume", value: todayTeamBusiness, color: 'text-sky-500' },
                        { label: "Yesterday's generation volume", value: yesterdayTeamBusiness, color: 'text-indigo-500' },
                    ].map((item) => (
                        <div key={item.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1 truncate">{item.label}</p>
                            <p className="text-lg font-black text-primary font-mono tabular-nums">{formatCurrency(item.value)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Depth Filter Control Bar */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center bg-[var(--surface-elevated)] p-4 rounded-2xl border border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--muted-foreground)]">
                    Showing config: {requestedLevels} levels • showing depth up to {memberDepth}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="levelInput" className="text-xs font-bold text-[var(--muted-foreground)]">
                            Levels:
                        </label>
                        <input
                            id="levelInput"
                            type="number"
                            min={1}
                            max={200}
                            value={levelInput}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') return setLevelInput(raw);
                                const parsed = Number(raw);
                                if (!Number.isFinite(parsed)) return;
                                setLevelInput(String(Math.min(200, Math.max(1, Math.floor(parsed)))));
                            }}
                            className="w-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="depthInput" className="text-xs font-bold text-[var(--muted-foreground)]">
                            Depth:
                        </label>
                        <input
                            id="depthInput"
                            type="number"
                            min={1}
                            max={200}
                            value={depthInput}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') return setDepthInput(raw);
                                const parsed = Number(raw);
                                if (!Number.isFinite(parsed)) return;
                                setDepthInput(String(Math.min(200, Math.max(1, Math.floor(parsed)))));
                            }}
                            className="w-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>
            </div>

            {/* Level status cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {levelCards.map((card) => {
                    const shownMembers = Math.min(memberDepth, card.teamCount);
                    const ratio = card.teamCount > 0 ? shownMembers / card.teamCount : 0;
                    const shownActive = Math.min(shownMembers, Math.round(card.activeCount * ratio));
                    const shownInactive = Math.max(0, shownMembers - shownActive);
                    const shownVolume = card.estimatedBusiness * ratio;
                    
                    // Active members percent inside level downline
                    const activePercent = card.teamCount > 0 ? (card.activeCount / card.teamCount) * 100 : 0;

                    return (
                        <div
                            key={card.level}
                            className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between ${
                                card.unlocked 
                                    ? 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-primary/25 hover:shadow-md' 
                                    : 'border-[var(--border)]/40 bg-[var(--surface-elevated)]/40 opacity-60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                                    <h3 className="text-sm font-black text-[var(--foreground)]">Level {card.level}</h3>
                                    {card.unlocked ? (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                            <Unlock size={10} /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                            <Lock size={10} /> Locked
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mt-3.5 space-y-2 text-xs text-[var(--muted-foreground)]">
                                    <div className="flex justify-between">
                                        <span>Total Team:</span>
                                        <span className="font-bold text-[var(--foreground)]">{card.teamCount}</span>
                                    </div>
                                    
                                    {/* Active member visual indicator bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span>Active Ratio</span>
                                            <span className="text-emerald-500">{activePercent.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-black/30 overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${activePercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-2 border-t border-[var(--border)]/20 mt-2">
                                        <span>PV Business:</span>
                                        <span className="font-bold text-primary font-mono tabular-nums">{formatCurrency(card.estimatedBusiness)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Link
                                href={`/genealogy?level=${card.level}&depth=${Math.min(memberDepth, card.teamCount || 1)}&view=table`}
                                className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                    card.unlocked
                                        ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-primary hover:text-black hover:border-primary shadow-sm'
                                        : 'border-transparent bg-[var(--surface)]/20 text-[var(--muted-foreground)] pointer-events-none'
                                }`}
                            >
                                View Level Downline <ArrowRight size={11} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
