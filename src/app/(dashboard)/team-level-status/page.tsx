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
import { Users, UserPlus, CheckCircle2, Activity, UserX, Lock, Unlock } from 'lucide-react';

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
            <div className="flex min-h-[45vh] items-center justify-center text-[var(--muted-foreground)]">
                No team level status available
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                        <UserPlus size={24} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Team Level Status</h1>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Sponsor: <span className="font-semibold text-[var(--foreground)]">{teamData.sponsorId || 'N/A'}</span></p>
                    </div>
                </div>
            </div>            <section className="grid grid-cols-1 gap-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-primary animate-pulse" />
                            <h2 className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Level ROI Position</h2>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            {levelSummary.unlocked} / {levelSummary.total} Unlocked
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Unlocked Levels Status</p>
                    <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                        {levelSummary.next
                            ? `Next milestone: Level ${levelSummary.next.level} (requires ${Math.max(0, levelSummary.next.level - qualifiedDirects)} more active directs)`
                            : 'All levels fully unlocked! 🚀'}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {[
                    { label: 'Total team members', value: stats.totalTeamMembers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Direct referrals', value: stats.directReferrals, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                    { label: 'Qualified directs', value: qualifiedDirects, icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
                    { label: 'Active members', value: stats.activeMembers, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Inactive members', value: stats.inactiveMembers, icon: UserX, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">{item.label}</span>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg}`}>
                                <item.icon size={14} className={item.color} />
                            </div>
                        </div>
                        <p className="text-2xl font-black tabular-nums text-[var(--foreground)] leading-none mt-1">{item.value}</p>
                    </div>
                ))}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Total Business Volume</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Total Level Team Business Volume', value: totalBusiness, color: 'text-blue-500' },
                        { label: "Today's team business", value: todayTeamBusiness, color: 'text-sky-500' },
                        { label: "Yesterday's team business", value: yesterdayTeamBusiness, color: 'text-indigo-500' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                            <p className="mb-1 truncate text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">{item.label}</p>
                            <p className="text-xl font-black tabular-nums text-primary">{formatCurrency(item.value)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center bg-[var(--surface-elevated)] p-4 rounded-2xl border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                    Showing {requestedLevels} levels • showing depth up to {memberDepth}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="levelInput" className="whitespace-nowrap text-xs font-bold text-[var(--muted-foreground)]">
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
                        <label htmlFor="depthInput" className="whitespace-nowrap text-xs font-bold text-[var(--muted-foreground)]">
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
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {levelCards.map((card) => {
                    const shownMembers = Math.min(memberDepth, card.teamCount);
                    const ratio = card.teamCount > 0 ? shownMembers / card.teamCount : 0;
                    const shownActive = Math.min(shownMembers, Math.round(card.activeCount * ratio));
                    const shownInactive = Math.max(0, shownMembers - shownActive);
                    const shownVolume = card.estimatedBusiness * ratio;

                    return (
                        <div
                            key={card.level}
                            className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 flex flex-col justify-between ${
                                card.unlocked 
                                ? 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-primary/35' 
                                : 'border-[var(--border)]/40 bg-[var(--surface-elevated)]/40 opacity-60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-extrabold text-[var(--foreground)]">Level {card.level}</h3>
                                    {card.unlocked ? (
                                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                            <Unlock size={10} /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                            <Lock size={10} /> Locked
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3.5 space-y-1.5 text-xs text-[var(--muted-foreground)]">
                                    <p className="flex justify-between">
                                        <span>Level team:</span>
                                        <span className="font-bold text-[var(--foreground)]">{shownMembers}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Active:</span>
                                        <span className="font-bold text-emerald-500">{shownActive}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Inactive:</span>
                                        <span className="font-bold text-amber-500">{shownInactive}</span>
                                    </p>
                                    <p className="flex justify-between pt-1 border-t border-[var(--border)]/20 mt-1">
                                        <span>Volume:</span>
                                        <span className="font-bold text-[var(--foreground)] tabular-nums">{formatCurrency(shownVolume)}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/genealogy?level=${card.level}&depth=${Math.min(memberDepth, card.teamCount || 1)}&view=table`}
                                className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                    card.unlocked
                                    ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-primary hover:text-zinc-950 hover:border-primary shadow-sm'
                                    : 'border-transparent bg-[var(--surface)]/20 text-[var(--muted-foreground)] pointer-events-none'
                                }`}
                            >
                                View Team
                            </Link>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}
