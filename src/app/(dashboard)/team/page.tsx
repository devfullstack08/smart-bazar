'use client';

import { useEffect, useState } from 'react';
import { TeamStatsData } from '@/types';
import { teamApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { Users, UserCheck, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
    const [teamData, setTeamData] = useState<TeamStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            const data = await teamApi.getTeamStats();
            setTeamData(data);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success('User ID copied');
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="space-y-6 sm:space-y-8 pb-12">
                <div className="h-28 sm:h-32 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                    ))}
                </div>
                <div className="h-48 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
            </div>
        );
    }

    if (!teamData) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No team data available</p>
            </div>
        );
    }

    const { stats, earnings, investment, directReferrals } = teamData;

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <Users size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Affiliate Sales Network</h1>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">Manage, verify, and audit your downline organization sales volumes</p>
                            {teamData.sponsorId && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-semibold">
                                    Direct Sponsor: <span className="font-mono text-[var(--foreground)]">{teamData.sponsorId}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Team Network"
                    value={stats.totalTeamMembers.toString()}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Direct Referrals"
                    value={stats.directReferrals.toString()}
                    icon={UserCheck}
                    color="purple"
                />
                <StatCard
                    title="Active Sales Partners"
                    value={stats.activeMembers.toString()}
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatCard
                    title="Recent signups (30d)"
                    value={stats.recentMembers.toString()}
                    icon={TrendingUp}
                    color="amber"
                />
            </div>

            {/* Network Earnings Ledger Card */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Network Revenue Split</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Gross Generated</p>
                        <p className="text-base sm:text-lg font-black text-[var(--foreground)] mt-1.5 tabular-nums">{formatCurrency(earnings.totalFromTeam)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-1"><Clock size={12} /> Pending</p>
                        <p className="text-base sm:text-lg font-black text-amber-500 mt-1.5 tabular-nums">{formatCurrency(earnings.pendingFromTeam)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-1"><CheckCircle size={12} /> Approved</p>
                        <p className="text-base sm:text-lg font-black text-primary mt-1.5 tabular-nums">{formatCurrency(earnings.approvedFromTeam)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-1"><DollarSign size={12} /> Settled Payouts</p>
                        <p className="text-base sm:text-lg font-black text-emerald-500 mt-1.5 tabular-nums">{formatCurrency(earnings.paidFromTeam)}</p>
                    </div>
                </div>
            </div>

            {/* Direct Investment Statement Card */}
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Affiliate Business Volume</h3>
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Direct referrals business volume (PV)</p>
                        <p className="text-xl sm:text-2xl font-black text-primary mt-1.5 tabular-nums">{formatCurrency(investment.totalTeamInvestment)}</p>
                    </div>
                </div>
            </div>

            {/* Direct Referrals List Table */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Direct referrals list ({directReferrals.length})</h3>
                </div>

                {directReferrals.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-primary/10 border border-primary/20 text-primary">
                            <Users size={24} />
                        </div>
                        <p className="text-sm font-bold text-[var(--foreground)]">No referrals yet</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Share your referral link to build your affiliate sales team.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-w-0">
                        <table className="w-full min-w-[560px]">
                            <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Partner Name</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:table-cell">User ID</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hidden md:table-cell">Email</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Rank</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Joined</th>
                                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {directReferrals.map((referral) => {
                                    const userInitials = referral.name.slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={referral.userId} className="hover:bg-[var(--surface)]/45 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl border border-primary/20 bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                                        {userInitials}
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">{referral.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                                                    <span className="truncate max-w-[80px]">{referral.userId}</span>
                                                    <button 
                                                        onClick={() => copyToClipboard(referral.userId)}
                                                        className="text-primary hover:text-primary/80 transition-colors focus:outline-none"
                                                        title="Copy ID"
                                                    >
                                                        {copiedId === referral.userId ? <Check size={10} /> : <Copy size={10} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                <span className="text-xs text-[var(--muted-foreground)] truncate block max-w-[140px]">{referral.email}</span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">{referral.rank}</span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 inline-flex text-[9px] font-bold rounded-full uppercase tracking-wider ${
                                                    referral.status === 'active' 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                                }`}>{referral.status}</span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-[var(--muted-foreground)]">{formatDate(referral.joinedAt)}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-xs font-bold text-primary font-mono tabular-nums">{formatCurrency(referral.totalEarned)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border border-purple-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
    };

    return (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm relative overflow-hidden transition-all hover:shadow-lg">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">{title}</p>
                    <h4 className="mt-2 text-xl sm:text-2xl font-black text-[var(--foreground)] tabular-nums">{value}</h4>
                </div>
                <div className={`rounded-xl p-2.5 shrink-0 ${colors[color] || colors.blue}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
