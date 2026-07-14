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
import { Users, UserPlus, CheckCircle2, Activity, UserX } from 'lucide-react';

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
        <div className="space-y-3 sm:space-y-4">
            <section className="relative overflow-hidden rounded-xl border border-[var(--pw-primary)]/25 bg-gradient-to-br from-[var(--pw-primary)] via-[#00c78a] to-[#00997a] p-3 text-white shadow-lg sm:rounded-2xl sm:p-4">
                <div className="absolute inset-0 hero-grid pointer-events-none opacity-10" />
                <div className="relative z-10">
                    <div className="mb-1 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-white/90 sm:text-[10px]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Team Level Status
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md sm:h-11 sm:w-11">
                            <UserPlus size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-bold sm:text-2xl">My Team Level Status</h1>
                            <p className="mt-0.5 text-xs text-white/90 sm:text-sm">
                                Sponsor: <span className="font-semibold text-white">{teamData.sponsorId || 'N/A'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
                    <div className="mb-1 flex items-center gap-1.5">
                        <Activity size={14} className="text-[var(--pw-primary)]" />
                        <p className="text-xs font-bold text-[var(--foreground)]">Level ROI Position</p>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Unlocked Levels</p>
                    <p className="text-lg font-extrabold text-[var(--foreground)]">
                        {levelSummary.unlocked}/{levelSummary.total}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[var(--pw-primary)]">
                        {levelSummary.next
                            ? `Next: L${levelSummary.next.level} (need ${Math.max(0, levelSummary.next.level - qualifiedDirects)} active directs)`
                            : 'All configured levels unlocked'}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {[
                    { label: 'Total team members', value: stats.totalTeamMembers, icon: Users, color: 'text-blue-500' },
                    { label: 'Direct referrals', value: stats.directReferrals, icon: Users, color: 'text-indigo-500' },
                    { label: 'Qualified directs (Level ROI)', value: qualifiedDirects, icon: UserPlus, color: 'text-violet-500' },
                    { label: 'Active members', value: stats.activeMembers, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Inactive members', value: stats.inactiveMembers, icon: UserX, color: 'text-amber-600 dark:text-amber-400' },
                ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-sm">
                        <div className="mb-1 flex items-center gap-1.5">
                            <item.icon size={12} className={item.color} />
                            <p className="truncate text-[10px] leading-tight text-[var(--muted-foreground)]">{item.label}</p>
                        </div>
                        <p className={`text-lg font-bold tabular-nums leading-none ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm sm:p-4">
                <h2 className="mb-2 text-sm font-bold text-[var(--foreground)]">Total Business Volume</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Total Level Team Business Volume', value: totalBusiness, color: 'text-blue-500' },
                        { label: "Today's team business", value: todayTeamBusiness, color: 'text-sky-500' },
                        { label: "Yesterday's team business", value: yesterdayTeamBusiness, color: 'text-indigo-500' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <p className="mb-0.5 truncate text-[10px] text-[var(--muted-foreground)]">{item.label}</p>
                            <p className={`text-xl font-bold tabular-nums ${item.color}`}>{formatCurrency(item.value)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    Showing {requestedLevels} level cards • each level preview shows up to {memberDepth} members
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                    <label htmlFor="levelInput" className="whitespace-nowrap text-xs font-semibold text-[var(--muted-foreground)]">
                        Level:
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
                        className="w-20 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/40"
                    />
                    <label htmlFor="depthInput" className="ml-2 whitespace-nowrap text-xs font-semibold text-[var(--muted-foreground)]">
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
                        className="w-20 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pw-primary)]/40"
                    />
                </div>
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {levelCards.map((card) => {
                    const shownMembers = Math.min(memberDepth, card.teamCount);
                    const ratio = card.teamCount > 0 ? shownMembers / card.teamCount : 0;
                    const shownActive = Math.min(shownMembers, Math.round(card.activeCount * ratio));
                    const shownInactive = Math.max(0, shownMembers - shownActive);
                    const shownVolume = card.estimatedBusiness * ratio;

                    return (
                        <div
                            key={card.level}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition-colors hover:border-[var(--pw-primary)]/35"
                        >
                            <h3 className="text-base font-extrabold text-[var(--foreground)]">Level {card.level}</h3>
                            <div className="mt-1.5 space-y-0.5 text-[11px] text-[var(--muted-foreground)]">
                                <p>
                                    Level team members: <span className="font-semibold text-[var(--foreground)]">{shownMembers}</span>
                                </p>
                                <p>
                                    Showing by depth:{' '}
                                    <span className="font-semibold text-[var(--foreground)]">
                                        {shownMembers} of {card.teamCount}
                                    </span>
                                </p>
                                <p className="flex gap-2">
                                    <span>
                                        Active: <span className="font-semibold text-emerald-500">{shownActive}</span>
                                    </span>
                                    <span>
                                        Inactive:{' '}
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{shownInactive}</span>
                                    </span>
                                </p>
                                <p>
                                    Volume: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(shownVolume)}</span>
                                    {card.volumeSource === 'estimated' && (
                                        <span className="ml-1 font-normal text-[var(--muted-foreground)]" title="Share of total team business when per-level amounts are not provided">
                                            (est.)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Link
                                href={`/genealogy?level=${card.level}&depth=${Math.min(memberDepth, card.teamCount || 1)}&view=table`}
                                className="mt-2 inline-flex w-full justify-center rounded-md border border-[var(--pw-primary)]/25 bg-[var(--pw-primary)]/10 px-2 py-1.5 text-xs font-bold text-[#00a372] transition-colors hover:bg-[var(--pw-primary)]/20 dark:text-[var(--pw-primary)]"
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
