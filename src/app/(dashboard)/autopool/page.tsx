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
    Lock
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
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
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
                <div className="rounded-full bg-indigo-100 p-6 dark:bg-indigo-900/20">
                    <Layers className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Join the Global Auto Pool
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You are not currently enrolled in the Global Auto Pool. Purchase the specific package to enter the matrix and start earning.
                    </p>
                </div>
                <Link href="/packages">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        Buy Component Package
                    </Button>
                </Link>
            </div>
        );
    }

    // State: Enrolled (Dashboard)
    const { summary, activeEntry, matrix, config } = poolData;

    return (
        <div className="space-y-8 p-6 lg:p-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">Global Auto-Pool</h1>
                            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-md">
                                {config.width}x{config.depth} Matrix
                            </span>
                        </div>
                        <p className="mt-2 text-indigo-100">
                            Your automated income engine is running.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                            <p className="text-sm text-indigo-200">Total Earned</p>
                            <p className="text-2xl font-bold">${summary.totalEarned.toFixed(2)}</p>
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
                    <Card className="overflow-hidden rounded-2xl border-none shadow-lg">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                                <Target className="h-5 w-5 text-indigo-400" />
                                Current Active Entry
                            </h3>
                        </div>
                        <div className="p-6">
                            {activeEntry ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Matrix ID</span>
                                        <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                            #{activeEntry.matrixId.slice(-6)}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">L1 Progress</span>
                                            <span className="font-medium">{activeEntry.childrenCount} / {config.width}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-1000"
                                                style={{ width: `${(activeEntry.childrenCount / config.width) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Level</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeEntry.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Position</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeEntry.position}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                                    <p>All entries completed!</p>
                                    <p className="text-xs mt-1">Waiting for new rebirth...</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Earnings Breakdown */}
                    <Card className="rounded-2xl border-gray-100 shadow-lg">
                        <div className="p-6">
                            <h3 className="mb-6 font-semibold text-gray-900 dark:text-white">Earnings Breakdown</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Main Wallet</p>
                                            <p className="text-xs text-gray-500">60% Allocation</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-emerald-600">${summary.mainWalletEarned.toFixed(2)}</p>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                                            <RotateCcw className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rebirth Wallet</p>
                                            <p className="text-xs text-gray-500">25% Allocation</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-amber-600">${summary.rebirthWalletEarned.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Col: Matrix Tree */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Level 1 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                            Direct Downline (Level 1)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {matrix.level1.map((entry) => (
                                <MatrixEntryCard key={entry.matrixId} entry={entry} />
                            ))}
                            {/* Placeholders */}
                            {Array.from({ length: Math.max(0, config.width - matrix.level1.length) }).map((_, i) => (
                                <EmptySlotCard key={i} />
                            ))}
                        </div>
                    </div>

                    {/* Level 2 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">2</span>
                            2nd Generation (Level 2)
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                            {matrix.level2.map((entry) => (
                                <MatrixEntryCard key={entry.matrixId} entry={entry} isSmall />
                            ))}
                            {Array.from({ length: Math.max(0, (config.width * config.width) - matrix.level2.length) }).map((_, i) => (
                                <EmptySlotCard key={i} isSmall />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reuseable Components
function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    };

    return (
        <Card className="p-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h4 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
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
        <div className={`relative group overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700 ${isFilled ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold 
            ${isFilled ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    #{entry.position}
                </div>
                <div className="overflow-hidden">
                    <p className="truncate text-xs font-medium text-gray-500">Member</p>
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {entry.userId.slice(0, 8)}...
                    </p>
                </div>
            </div>
            {!isSmall && (
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${isFilled ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {entry.status}
                    </span>
                    <span className="text-gray-400">
                        {new Date(entry.joinedAt).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
}

function EmptySlotCard({ isSmall }: { isSmall?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 rounded-full bg-gray-200 p-2 dark:bg-gray-700">
                <Lock className="h-4 w-4 text-gray-400" />
            </div>
            {!isSmall && <span className="text-xs font-medium text-gray-400">Empty Slot</span>}
        </div>
    );
}
