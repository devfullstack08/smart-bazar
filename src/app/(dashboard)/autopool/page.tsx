'use client';

import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/lib/api/services';
import {
    Users,
    Target,
    RotateCcw,
    Layers,
    DollarSign,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Lock,
    Percent,
    Receipt,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { APP_NAME } from '@/constants/env';

interface MatrixEntry {
    matrixId: string;
    userId: string;
    position: number;
    status: 'Active' | 'Filled' | 'Inactive';
    joinedAt: string;
    parentId?: string;
}

interface AutoPoolData {
    hasMatrix: boolean;
    config: { width: number; depth: number; entryFee: number };
    summary: {
        totalPositions: number;
        filledPositions: number;
        closedEntries: number;
        openEntries: number;
        totalEarned: number;
        mainWalletEarned: number;
        rebirthWalletEarned: number;
        rebirthCount: number;
    };
    activeEntry: {
        matrixId: string;
        level: number;
        position: number;
        childrenCount: number;
        status: string;
        createdAt: string;
    } | null;
    matrix: {
        level1: MatrixEntry[];
        level2: MatrixEntry[];
    };
    incomeDistribution: Record<string, { members: number; amountPerMember: number; total: number }>;
}

export default function AutoPoolPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['autopool-matrix'],
        queryFn: teamApi.getAutoPoolMatrix,
        refetchInterval: 30000, // Refresh every 30s
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Failed to load data</h3>
                <p className="text-gray-500">Please try again later.</p>
            </div>
        );
    }

    const poolData: AutoPoolData = data?.data;

    // State: Not Enrolled
    if (!poolData?.hasMatrix) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center">
                <div className="rounded-full bg-primary/10 p-6">
                    <Layers className="h-16 w-16 text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-zinc-800 dark:text-white">
                        Join the Global Auto Pool
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        You are not currently enrolled in the Global Auto Pool. Purchase the specific package to enter the matrix and start earning.
                    </p>
                </div>
                <Link href="/packages">
                    <Button size="lg" className="bg-primary hover:bg-primary-dark text-black font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        Buy Component Package
                    </Button>
                </Link>
            </div>
        );
    }

    const { summary, activeEntry, matrix, config } = poolData;

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <Layers size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Shared Autopool Dividend Registry</h1>
                                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold">
                                    {config.width}x{config.depth} Matrix
                                </span>
                            </div>
                            <p className="mt-1.5 text-zinc-500 dark:text-white/60 text-xs">
                                Automated global placement queue. Earn pools commissions as slots are populated.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 shrink-0">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-4 min-w-[140px]">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-white/40">Total Dividend</p>
                            <p className="text-lg sm:text-2xl font-black text-primary mt-1 tabular-nums">{formatCurrency(summary.totalEarned)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Positions"
                    value={summary.totalPositions.toString()}
                    icon={Layers}
                    color="blue"
                />
                <StatCard
                    title="Filled Spots"
                    value={`${summary.filledPositions}/${summary.totalPositions}`}
                    icon={Users}
                    color="emerald"
                />
                <StatCard
                    title="Rebirth Cycles"
                    value={summary.rebirthCount.toString()}
                    icon={RotateCcw}
                    color="amber"
                />
                <StatCard
                    title="Active Cycles"
                    value={summary.openEntries.toString()}
                    icon={Target}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Left Col: Active Entry dashed cycle certificate */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-sm">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Receipt size={16} />
                                <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider">Active Cycle Certificate</h3>
                            </div>
                        </div>

                        {activeEntry ? (
                            <div className="py-4 space-y-5">
                                {/* Header particular details */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Matrix Account Reference</p>
                                        <h4 className="text-sm font-bold text-[var(--foreground)] mt-1">Matrix Cycle #{activeEntry.matrixId.slice(-6)}</h4>
                                    </div>
                                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                        Running
                                    </span>
                                </div>

                                {/* Dashed Divider */}
                                <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                                {/* Level config breakdown */}
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Depth Level</p>
                                        <p className="text-sm font-black text-[var(--foreground)] mt-1">Level {activeEntry.level}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Position Index</p>
                                        <p className="text-sm font-black text-[var(--foreground)] mt-1">Queue #{activeEntry.position}</p>
                                    </div>
                                </div>

                                {/* Dashed Divider */}
                                <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                                {/* L1 Progress bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)]">
                                        <span>Level-1 Spots Filled</span>
                                        <span className="text-primary tabular-nums">{activeEntry.childrenCount} / {config.width}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-black/30 overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${(activeEntry.childrenCount / config.width) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 space-y-3">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 animate-bounce" />
                                <p className="font-black text-sm text-[var(--foreground)]">All Entries Cleared!</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Waiting for a new rebirth cycle matrix index entry.</p>
                            </div>
                        )}

                        <div className="border-t border-[var(--border)] pt-4 text-[9px] text-[var(--muted-foreground)] font-semibold flex items-center gap-1">
                            <Calendar size={10} />
                            <span>System audited: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Col: Matrix Tree downline mapping */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Level 1 Generation */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">1</span>
                            Direct Generation Members (Level 1)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {matrix.level1?.map((entry) => (
                                <MatrixEntryCard key={entry.matrixId} entry={entry} />
                            ))}
                            {Array.from({ length: Math.max(0, config.width - (matrix.level1?.length || 0)) }).map((_, i) => (
                                <EmptySlotCard key={i} />
                            ))}
                        </div>
                    </div>

                    {/* Level 2 Generation */}
                    {config.depth >= 2 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">2</span>
                                Secondary Generation Members (Level 2)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {matrix.level2?.map((entry) => (
                                    <MatrixEntryCard key={entry.matrixId} entry={entry} isSmall />
                                ))}
                                {Array.from({ length: Math.max(0, (config.width * config.width) - (matrix.level2?.length || 0)) }).map((_, i) => (
                                    <EmptySlotCard key={i} isSmall />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border border-purple-500/20',
    };

    return (
        <Card className="p-5 transition-all hover:shadow-lg border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">{title}</p>
                    <h4 className="mt-2 text-2xl font-black text-[var(--foreground)] tabular-nums">{value}</h4>
                </div>
                <div className={`rounded-xl p-2.5 shrink-0 ${colors[color] || colors.blue}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    );
}

function MatrixEntryCard({ entry, isSmall }: { entry: MatrixEntry, isSmall?: boolean }) {
    const isFilled = entry.status === 'Filled';
    
    // Get user initials for display
    const userInitials = entry.userId.slice(0, 2).toUpperCase();

    return (
        <div className={`relative group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all hover:border-primary/20 ${isFilled ? 'bg-[var(--surface)] border-emerald-500/20' : ''}`}>
            <div className="flex items-center gap-3">
                {/* Initials profile avatar mockup */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black border 
                    ${isFilled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                    {userInitials}
                </div>
                <div className="overflow-hidden">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">Member</span>
                    <p className="truncate text-xs font-bold text-[var(--foreground)] tracking-tight">
                        ID: {entry.userId.slice(0, 8)}...
                    </p>
                </div>
            </div>
            {!isSmall && (
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${isFilled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                        {entry.status}
                    </span>
                    <span className="text-[var(--muted-foreground)] font-semibold">
                        {formatDate(entry.joinedAt)}
                    </span>
                </div>
            )}
        </div>
    );
}

function EmptySlotCard({ isSmall }: { isSmall?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 p-4 text-center transition-all hover:bg-[var(--surface)] hover:border-primary/20 select-none">
            <div className="mb-2 rounded-xl bg-black/10 dark:bg-black/30 p-2 text-[var(--muted-foreground)]">
                <Lock className="h-4 w-4" />
            </div>
            {!isSmall && <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Vacancy Slot</span>}
        </div>
    );
}
