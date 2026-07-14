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
    Percent
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Types (You can move these to a types file)
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
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-white">
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

    // State: Enrolled (Dashboard)
    const { summary, activeEntry, matrix, config } = poolData;

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-amber-50/30 via-white to-amber-50/10 dark:from-[rgba(18,25,44,0.85)] dark:via-[rgba(10,14,24,0.95)] dark:to-[rgba(8,10,18,0.98)] p-6 sm:p-8 shadow-sm">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Global Auto-Pool</h1>
                            <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-bold">
                                {config.width}x{config.depth} Matrix
                            </span>
                        </div>
                        <p className="mt-2 text-zinc-500 dark:text-white/60 text-sm">
                            Your automated income engine is running.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-white/40 font-extrabold">Total Earned</p>
                            <p className="text-xl sm:text-2xl font-black text-primary truncate mt-0.5 tabular-nums">${summary.totalEarned.toFixed(2)}</p>
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
                    title="Rebirths"
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

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                {/* Left Col: Active Entry & Wallet Split */}
                <div className="space-y-8 lg:col-span-1">

                    {/* Active Entry Card */}
                    <Card className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm">
                        <div className="border-b border-[var(--border)] p-5">
                            <h3 className="flex items-center gap-2 text-md font-extrabold text-zinc-800 dark:text-white">
                                <Target className="h-5 w-5 text-primary" />
                                Current Active Entry
                            </h3>
                        </div>
                        <div className="p-6">
                            {activeEntry ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-500 dark:text-white/60">Matrix ID</span>
                                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                            #{activeEntry.matrixId.slice(-6)}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-500 dark:text-white/60 font-bold">L1 Progress</span>
                                            <span className="font-bold text-zinc-700 dark:text-white/80">{activeEntry.childrenCount} / {config.width}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${(activeEntry.childrenCount / config.width) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                                        <div>
                                            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-white/40 uppercase tracking-widest">Level</p>
                                            <p className="text-xl font-black text-zinc-800 dark:text-white mt-0.5">{activeEntry.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-extrabold text-zinc-400 dark:text-white/40 uppercase tracking-widest">Position</p>
                                            <p className="text-xl font-black text-zinc-800 dark:text-white mt-0.5">{activeEntry.position}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-500 dark:text-white/60">
                                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3 animate-bounce" />
                                    <p className="font-bold text-sm">All entries completed!</p>
                                    <p className="text-xs mt-1">Waiting for new rebirth...</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Col: Matrix Tree */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Level 1 */}
                    <div>
                        <h3 className="text-md font-extrabold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                            Direct Downline (Level 1)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {matrix.level1?.map((entry) => (
                                <MatrixEntryCard key={entry.matrixId} entry={entry} />
                            ))}
                            {/* Placeholders */}
                            {Array.from({ length: Math.max(0, config.width - (matrix.level1?.length || 0)) }).map((_, i) => (
                                <EmptySlotCard key={i} />
                            ))}
                        </div>
                    </div>

                    {/* Level 2 (Only rendered if depth is 2 or higher) */}
                    {config.depth >= 2 && (
                        <div>
                            <h3 className="text-md font-extrabold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                                2nd Generation (Level 2)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
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

// Reuseable Components
function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20',
    };

    return (
        <Card className="p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">{title}</p>
                    <h4 className="mt-2 text-2xl font-black text-zinc-800 dark:text-white tabular-nums">{value}</h4>
                </div>
                <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
}

function MatrixEntryCard({ entry, isSmall }: { entry: MatrixEntry, isSmall?: boolean }) {
    const isFilled = entry.status === 'Filled';

    return (
        <div className={`relative group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm transition-all hover:shadow-md ${isFilled ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold 
            ${isFilled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                    #{entry.position}
                </div>
                <div className="overflow-hidden">
                    <p className="truncate text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">Member</p>
                    <p className="truncate text-sm font-bold text-zinc-800 dark:text-white">
                        {entry.userId.slice(0, 8)}...
                    </p>
                </div>
            </div>
            {!isSmall && (
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isFilled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                        {entry.status}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                        {new Date(entry.joinedAt).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
}

function EmptySlotCard({ isSmall }: { isSmall?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 p-4 text-center transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
            <div className="mb-2 rounded-full bg-zinc-100 dark:bg-white/5 p-2">
                <Lock className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
            </div>
            {!isSmall && <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Locked Slot</span>}
        </div>
    );
}
