'use client';

import { useEffect, useState } from 'react';
import { TeamStatsData } from '@/types';
import { teamApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatsCard } from '@/components/ui/StatsCard';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { Users, UserCheck, TrendingUp, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TeamPage() {
    const [teamData, setTeamData] = useState<TeamStatsData | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <LoadingSpinner />;
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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                        <Users size={24} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>My Team</h1>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage and track your team performance</p>
                        {teamData.sponsorId && (
                            <p className="text-sm text-[var(--muted-foreground)] mt-1 truncate">Sponsor: <span className="font-semibold text-[var(--foreground)]">{teamData.sponsorId}</span></p>
                        )}
                    </div>
                </div>
            </div>

            {/* Overview Stats - PWA compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
                <StatsCard
                    title="Total Team Members"
                    value={stats.totalTeamMembers}
                    icon={<Users size={24} />}
                />
                <StatsCard
                    title="Direct Referrals"
                    value={stats.directReferrals}
                    icon={<UserCheck size={24} />}
                />
                <StatsCard
                    title="Active Members"
                    value={stats.activeMembers}
                    icon={<CheckCircle size={24} />}
                />
                <StatsCard
                    title="Recent (30 days)"
                    value={stats.recentMembers}
                    icon={<TrendingUp size={24} />}
                />
            </div>


            {/* Team Earnings */}
            <div className="rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Team Earnings</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--background)]">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Total from Team</p>
                        <p className="text-base sm:text-xl font-bold text-[var(--foreground)] leading-tight">{formatCurrency(earnings.totalFromTeam)}</p>
                    </div>
                    <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1 flex items-center gap-1"><Clock size={14} className="shrink-0" /> Pending</p>
                        <p className="text-base sm:text-xl font-bold text-amber-600 dark:text-amber-400 leading-tight">{formatCurrency(earnings.pendingFromTeam)}</p>
                    </div>
                    <div className="rounded-xl p-4 border border-[var(--pw-primary)]/20 bg-[var(--pw-primary)]/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1 flex items-center gap-1"><CheckCircle size={14} className="shrink-0" /> Approved</p>
                        <p className="text-base sm:text-xl font-bold text-[var(--pw-primary)] leading-tight">{formatCurrency(earnings.approvedFromTeam)}</p>
                    </div>
                    <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1 flex items-center gap-1"><DollarSign size={14} className="shrink-0" /> Paid Out</p>
                        <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{formatCurrency(earnings.paidFromTeam)}</p>
                    </div>
                </div>
            </div>

            {/* Team Investment */}
            <div className="rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Team Investment</h2>
                <div className="rounded-xl p-4 sm:p-6 border border-[var(--pw-primary)]/20 bg-[var(--pw-primary)]/5">
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-2">Total Investment by Direct Referrals</p>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--pw-primary)] leading-tight">{formatCurrency(investment.totalTeamInvestment)}</p>
                </div>
            </div>

            {/* Direct Referrals Table */}
            <div className="rounded-2xl premium-card border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Direct Referrals ({directReferrals.length})</h2>
                </div>

                {directReferrals.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]">
                            <Users size={28} />
                        </div>
                        <p className="text-[var(--foreground)] text-base font-medium mb-2">No direct referrals yet</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Share your referral link to build your team!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-w-0 -webkit-overflow-scrolling-touch">
                        <table className="w-full min-w-[560px] text-sm sm:text-base">
                            <thead className="bg-[var(--surface)]">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Name</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase hidden sm:table-cell">User ID</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase hidden md:table-cell">Email</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Rank</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Joined</th>
                                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {directReferrals.map((referral) => (
                                    <tr key={referral.userId} className="hover:bg-[var(--surface)]">
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/20 flex items-center justify-center text-[var(--pw-primary)] font-bold shrink-0">
                                                    {referral.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-[var(--foreground)] truncate">{referral.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                                            <span className="text-sm text-[var(--muted-foreground)] font-mono truncate block max-w-[100px]">{referral.userId}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap hidden md:table-cell">
                                            <span className="text-sm text-[var(--muted-foreground)] truncate block max-w-[140px]">{referral.email}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[var(--pw-primary)]/10 text-[var(--pw-primary)]">{referral.rank}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                                referral.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                                referral.status === 'blocked' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                                                'bg-[var(--surface)] text-[var(--muted-foreground)]'
                                            }`}>{referral.status}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-[var(--muted-foreground)]">{formatDate(referral.joinedAt)}</td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm font-semibold text-[var(--pw-primary)]">{formatCurrency(referral.totalEarned)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
