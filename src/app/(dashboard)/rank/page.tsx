'use client';

import { useEffect, useState } from 'react';
import { RankStatusData } from '@/types';
import { projectApi, teamApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/cn';
import { membersUpToDepthActiveFromTeamStats } from '@/lib/utils/teamStats';
import { Award, TrendingUp, Users, DollarSign, Target, CheckCircle, Clock, XCircle, Star, Calendar } from 'lucide-react';

export default function RankPage() {
    const [rankData, setRankData] = useState<RankStatusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankStatus();
    }, []);

    const fetchRankStatus = async () => {
        try {
            const [incomeConfig, teamStats] = await Promise.all([projectApi.getIncomeConfig(), teamApi.getTeamStats()]);

            // projectApi.getIncomeConfig() returns { success, data: config }
            const rankIncome = (incomeConfig as any)?.data?.rank_income ?? (incomeConfig as any)?.rank_income;
            const ranks: any[] = rankIncome?.ranks ?? [];
            const enabled = !!rankIncome?.enabled;

            if (!enabled) {
                setRankData({ enabled: false } as any);
                return;
            }

            const memberRankMode = ranks.some((r) => r?.requiredLevel != null && r?.requiredTeamAtLevel != null);
            const membersUpToDepth: number[] = membersUpToDepthActiveFromTeamStats(teamStats ?? null);

            const selfBusiness = (teamStats as any)?.investment?.packageValue ?? 0;
            const directTeam = (teamStats as any)?.stats?.directReferrals ?? 0;
            const teamBusiness = (teamStats as any)?.investment?.totalTeamBusiness ?? 0;

            const reqProgress = (current: number, required: number) => {
                if (!required || required <= 0) {
                    return {
                        required,
                        current,
                        remaining: 0,
                        progress: 100,
                        completed: true,
                    };
                }
                const pct = Math.min((current / required) * 100, 100);
                return {
                    required,
                    current,
                    remaining: Math.max(0, required - current),
                    progress: Math.round(pct),
                    completed: current >= required,
                };
            };

            const allRanks = ranks.map((r, idx) => {
                const rankName = String(r?.rankName ?? `Level ${idx + 1}`);
                const rankLevel = idx + 1;

                if (memberRankMode) {
                    const requiredLevel = Math.max(0, Number(r?.requiredLevel ?? 0));
                    const requiredTeamAtLevel = Math.max(0, Number(r?.requiredTeamAtLevel ?? 0));
                    const currentMembers = membersUpToDepth[requiredLevel] ?? 0;
                    const monthlyReward = Number(r?.reward?.amount ?? 0);

                    return {
                        rankName,
                        rankLevel,
                        isAchieved: currentMembers >= requiredTeamAtLevel,
                        requirements: {
                            selfBusiness: 0,
                            directTeam: 0,
                            teamBusiness: requiredTeamAtLevel,
                        },
                        monthlyReward,
                        durationMonths: 1,
                        _requiredLevel: requiredLevel,
                        _currentMembers: currentMembers,
                    };
                }

                // Legacy/business-based rank config
                const monthlyReward = Number(r?.monthlyReward ?? r?.reward?.amount ?? 0);
                const durationMonths = Number(r?.durationMonths ?? 0);

                return {
                    rankName,
                    rankLevel,
                    isAchieved:
                        selfBusiness >= Number(r?.selfBusiness ?? 0) &&
                        directTeam >= Number(r?.directTeam ?? 0) &&
                        teamBusiness >= Number(r?.teamBusiness ?? 0),
                    requirements: {
                        selfBusiness: Number(r?.selfBusiness ?? 0),
                        directTeam: Number(r?.directTeam ?? 0),
                        teamBusiness: Number(r?.teamBusiness ?? 0),
                    },
                    monthlyReward,
                    durationMonths,
                };
            });

            const currentRank = [...allRanks].reverse().find((r) => r.isAchieved) ?? null;
            const currentRankIndex = currentRank ? allRanks.findIndex((x) => x.rankName === currentRank.rankName) : -1;
            const nextRank =
                currentRankIndex === -1
                    ? allRanks[0] ?? null
                    : currentRankIndex < allRanks.length - 1
                      ? allRanks[currentRankIndex + 1]
                      : null;

            const currentRankForStats = currentRank ?? allRanks[0] ?? null;

            const currentStats = memberRankMode
                ? {
                      selfBusiness: 0,
                      directTeam: 0,
                      teamBusiness: currentRankForStats
                          ? membersUpToDepth[(currentRankForStats as any)._requiredLevel] ?? 0
                          : 0,
                  }
                : {
                      selfBusiness,
                      directTeam,
                      teamBusiness,
                  };

            let progress = null;
            if (nextRank) {
                if (memberRankMode) {
                    const current = (nextRank as any)._currentMembers ?? 0;
                    const required = (nextRank as any).requirements.teamBusiness ?? 0;
                    const teamBusinessReq = reqProgress(current, required);

                    progress = {
                        nextRank: nextRank.rankName,
                        requirements: {
                            selfBusiness: reqProgress(0, 0),
                            directTeam: reqProgress(0, 0),
                            teamBusiness: teamBusinessReq,
                        },
                        overallProgress: teamBusinessReq.progress,
                        allRequirementsMet: teamBusinessReq.completed,
                    };
                } else {
                    const sbReq = reqProgress(selfBusiness, nextRank.requirements.selfBusiness);
                    const dtReq = reqProgress(directTeam, nextRank.requirements.directTeam);
                    const tbReq = reqProgress(teamBusiness, nextRank.requirements.teamBusiness);

                    const applicable = [sbReq, dtReq, tbReq].filter((x) => x.required > 0).length;
                    const overall =
                        applicable > 0
                            ? Math.round(
                                  ([sbReq, dtReq, tbReq].filter((x) => x.required > 0).reduce((a, b) => a + b.progress, 0) /
                                      applicable) as any
                              )
                            : 100;

                    progress = {
                        nextRank: nextRank.rankName,
                        requirements: { selfBusiness: sbReq, directTeam: dtReq, teamBusiness: tbReq },
                        overallProgress: overall,
                        allRequirementsMet: sbReq.completed && dtReq.completed && tbReq.completed,
                    };
                }
            }

            setRankData({
                enabled: true,
                currentStats,
                currentRank: currentRank
                    ? {
                          rankName: currentRank.rankName,
                          rankLevel: currentRank.rankLevel,
                          requirements: currentRank.requirements,
                          monthlyReward: currentRank.monthlyReward,
                          durationMonths: currentRank.durationMonths,
                      }
                    : null,
                activeRankAchievement: null,
                nextRank: nextRank
                    ? {
                          rankName: nextRank.rankName,
                          rankLevel: nextRank.rankLevel,
                          requirements: nextRank.requirements,
                          monthlyReward: nextRank.monthlyReward,
                          durationMonths: nextRank.durationMonths,
                      }
                    : null,
                progress,
                allRanks: allRanks.map((r) => ({
                    rankName: r.rankName,
                    rankLevel: r.rankLevel,
                    requirements: r.requirements,
                    monthlyReward: r.monthlyReward,
                    durationMonths: r.durationMonths,
                    isAchieved: r.isAchieved,
                })),
            } as any);
        } catch (error) {
            console.error('Failed to fetch rank status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!rankData) {
        return (
            <div className="flex items-center justify-center min-h-[200px] sm:h-64">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No rank data available</p>
            </div>
        );
    }

    if (!rankData.enabled) {
        return (
            <div className="space-y-2 sm:space-y-5 lg:space-y-8">
                <div className="relative overflow-hidden rounded-lg sm:rounded-2xl gradient-hero p-2.5 sm:p-6 md:p-8 text-gray-900 dark:text-white shadow-lg sm:shadow-xl border border-gray-200/80 dark:border-white/10">
                    <div className="absolute inset-0 hero-grid opacity-50" />
                    <div className="relative z-10 flex items-center gap-2.5 sm:gap-4">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-indigo-100/80 dark:bg-white/10 border border-indigo-200/60 dark:border-white/20 shrink-0">
                            <Award size={22} className="text-indigo-700 dark:text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-100/80 dark:bg-white/10 border border-indigo-200/60 dark:border-white/20 text-indigo-800 dark:text-white text-[10px] sm:text-sm font-medium mb-1 sm:mb-2">Rank</span>
                            <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Rank Income</h1>
                            <p className="text-gray-600 dark:text-indigo-100/90 text-[11px] sm:text-sm mt-0.5 sm:mt-1">Track your rank achievements and monthly rewards</p>
                        </div>
                    </div>
                </div>
                <div className="card rounded-lg sm:rounded-2xl p-4 sm:p-8 md:p-12 text-center border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a]">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-4 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
                        <XCircle className="text-white" size={22} />
                    </div>
                    <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Rank Income Disabled</h2>
                    <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-300">Rank income is currently disabled for this project.</p>
                </div>
            </div>
        );
    }

    const { currentStats, currentRank, activeRankAchievement, nextRank, progress, allRanks } = rankData;

    return (
        <div className="space-y-2 sm:space-y-5 lg:space-y-8">
            {/* Header - Hero-style, PWA compact on mobile */}
            <div className="relative overflow-hidden rounded-lg sm:rounded-2xl gradient-hero p-2.5 sm:p-6 md:p-8 text-gray-900 dark:text-white shadow-lg sm:shadow-xl border border-gray-200/80 dark:border-white/10">
                <div className="absolute inset-0 hero-grid opacity-50" />
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-2.5 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-indigo-100/80 dark:bg-white/10 border border-indigo-200/60 dark:border-white/20 shrink-0">
                        <Award size={22} className="text-indigo-700 dark:text-white" />
                    </div>
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-100/80 dark:bg-white/10 border border-indigo-200/60 dark:border-white/20 text-indigo-800 dark:text-white text-[10px] sm:text-sm font-medium mb-1 sm:mb-2">Achievements</span>
                        <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Rank Income</h1>
                        <p className="text-gray-600 dark:text-indigo-100/90 text-[11px] sm:text-sm mt-0.5 sm:mt-1">Track your rank achievements and monthly rewards</p>
                    </div>
                </div>
            </div>

            {/* Current Stats - extra compact on mobile */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-6">
                <div className="card rounded-lg sm:rounded-2xl p-1.5 sm:p-2.5 md:p-6 border border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 to-indigo-100/80 dark:from-indigo-500/10 dark:to-indigo-500/5 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-0.5 sm:mb-2">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-indigo-500/80 dark:bg-indigo-500 shrink-0">
                            <DollarSign className="text-white" size={14} />
                        </div>
                        <p className="text-[8px] sm:text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate min-w-0">
                            <span className="sm:hidden">Self</span>
                            <span className="hidden sm:inline">Self Business</span>
                        </p>
                    </div>
                    <p className="text-xs sm:text-base md:text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight truncate">{formatCurrency(currentStats.selfBusiness)}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Total package purchases</p>
                </div>
                <div className="card rounded-lg sm:rounded-2xl p-1.5 sm:p-2.5 md:p-6 border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 dark:from-emerald-500/10 dark:to-emerald-500/5 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-0.5 sm:mb-2">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-emerald-500/80 dark:bg-emerald-500 shrink-0">
                            <Users className="text-white" size={14} />
                        </div>
                        <p className="text-[8px] sm:text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate min-w-0">
                            <span className="sm:hidden">Direct</span>
                            <span className="hidden sm:inline">Direct Team</span>
                        </p>
                    </div>
                    <p className="text-xs sm:text-base md:text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight truncate">{currentStats.directTeam}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Direct referrals</p>
                </div>
                <div className="card rounded-lg sm:rounded-2xl p-1.5 sm:p-2.5 md:p-6 border border-purple-200/60 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-500/10 dark:to-purple-500/5 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-0.5 sm:mb-2">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-purple-500/80 dark:bg-purple-500 shrink-0">
                            <TrendingUp className="text-white" size={14} />
                        </div>
                        <p className="text-[8px] sm:text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400 truncate min-w-0">
                            <span className="sm:hidden">Team</span>
                            <span className="hidden sm:inline">Team Business</span>
                        </p>
                    </div>
                    <p className="text-xs sm:text-base md:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400 leading-tight truncate">{formatCurrency(currentStats.teamBusiness)}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">15-level team volume</p>
                </div>
            </div>

            {/* Current Rank & Active Achievement - PWA compact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
                {/* Current Rank */}
                {currentRank && (
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-lg sm:rounded-2xl p-2.5 sm:p-6 text-white border border-white/10 shadow-lg sm:shadow-xl">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <div className="icon-container icon-container-sm shrink-0">
                                <Award className="text-white" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-2xl font-bold truncate">Current Rank</h2>
                                <p className="text-indigo-100 text-[10px] sm:text-sm">Your highest achievable rank</p>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-xl sm:text-3xl font-bold truncate">{currentRank.rankName}</span>
                                <Star className="text-yellow-300 shrink-0" size={24} />
                            </div>
                            <p className="text-indigo-100 text-[10px] sm:text-sm mb-2 sm:mb-4">Level {currentRank.rankLevel}</p>
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div>
                                    <p className="text-[9px] sm:text-xs text-indigo-100 mb-0.5 sm:mb-1">Monthly Reward</p>
                                    <p className="text-base sm:text-xl font-bold">{formatCurrency(currentRank.monthlyReward)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-xs text-indigo-100 mb-0.5 sm:mb-1">Duration</p>
                                    <p className="text-base sm:text-xl font-bold">{currentRank.durationMonths} months</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Rank Achievement */}
                {activeRankAchievement && (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg sm:rounded-2xl p-2.5 sm:p-6 text-white border border-white/10 shadow-lg sm:shadow-xl">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <div className="icon-container icon-container-sm shrink-0">
                                <CheckCircle className="text-white" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-2xl font-bold truncate">Active Achievement</h2>
                                <p className="text-green-100 text-[10px] sm:text-sm">Currently receiving rewards</p>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                                <span className="text-lg sm:text-2xl font-bold truncate">{activeRankAchievement.rankName}</span>
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500 rounded-full text-[9px] sm:text-xs font-semibold shrink-0">
                                    Active
                                </span>
                            </div>
                            <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-4">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] sm:text-sm text-green-100">Monthly Reward:</span>
                                    <span className="text-sm sm:text-lg font-bold">{formatCurrency(activeRankAchievement.monthlyReward)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] sm:text-sm text-green-100">Months Paid:</span>
                                    <span className="text-sm sm:text-lg font-bold">{activeRankAchievement.monthsPaid} / {activeRankAchievement.durationMonths}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] sm:text-sm text-green-100">Total Received:</span>
                                    <span className="text-sm sm:text-lg font-bold">{formatCurrency(activeRankAchievement.totalPaid)}</span>
                                </div>
                                {activeRankAchievement.nextPaymentDate && (
                                    <div className="pt-2 sm:pt-3 border-t border-white/20">
                                        <div className="flex items-center gap-2 text-[10px] sm:text-sm text-green-100">
                                            <Calendar size={14} className="shrink-0" />
                                            <span>Next Payment: {formatDate(activeRankAchievement.nextPaymentDate)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Next Rank Progress - PWA compact */}
            {nextRank && progress && (
                <div className="card rounded-lg sm:rounded-2xl p-2.5 sm:p-6 border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a]">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                        <div className="icon-container icon-container-sm shrink-0">
                            <Target className="text-white" size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">Next Rank: {nextRank.rankName}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm">Progress towards achieving {nextRank.rankName}</p>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="mb-3 sm:mb-6">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                            <span className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                            <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{progress.overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 sm:h-4">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 sm:h-4 rounded-full transition-all"
                                style={{ width: `${progress.overallProgress}%` }}
                            />
                        </div>
                        {progress.allRequirementsMet && (
                            <p className="text-[10px] sm:text-sm text-green-600 dark:text-green-400 font-medium mt-1.5 sm:mt-2 flex items-center gap-1">
                                <CheckCircle size={14} className="shrink-0" />
                                All requirements met! Rank will be awarded automatically.
                            </p>
                        )}
                    </div>

                    {/* Individual Requirements */}
                    <div className="space-y-2 sm:space-y-4">
                        {/* Self Business */}
                        <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10">
                            <div className="flex justify-between items-center gap-2 mb-1.5 sm:mb-2">
                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                    <DollarSign className="text-blue-600 dark:text-blue-400 shrink-0" size={16} />
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">Self Business</span>
                                </div>
                                <span className={`text-[10px] sm:text-sm font-semibold shrink-0 ${progress.requirements.selfBusiness.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {progress.requirements.selfBusiness.progress}%
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 gap-1">
                                <span className="truncate">{formatCurrency(progress.requirements.selfBusiness.current)} / {formatCurrency(progress.requirements.selfBusiness.required)}</span>
                                {!progress.requirements.selfBusiness.completed && (
                                    <span className="text-orange-600 dark:text-orange-400 shrink-0">Need: {formatCurrency(progress.requirements.selfBusiness.remaining)}</span>
                                )}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 sm:h-2">
                                <div
                                    className={`h-1.5 sm:h-2 rounded-full transition-all ${progress.requirements.selfBusiness.completed ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`}
                                    style={{ width: `${progress.requirements.selfBusiness.progress}%` }}
                                />
                            </div>
                            {progress.requirements.selfBusiness.completed && (
                                <p className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                                    <CheckCircle size={12} className="shrink-0" />
                                    Requirement met
                                </p>
                            )}
                        </div>

                        {/* Direct Team */}
                        <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
                            <div className="flex justify-between items-center gap-2 mb-1.5 sm:mb-2">
                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                    <Users className="text-green-600 dark:text-green-400 shrink-0" size={16} />
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">Direct Team</span>
                                </div>
                                <span className={`text-[10px] sm:text-sm font-semibold shrink-0 ${progress.requirements.directTeam.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {progress.requirements.directTeam.progress}%
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 gap-1">
                                <span className="truncate">{progress.requirements.directTeam.current} / {progress.requirements.directTeam.required} members</span>
                                {!progress.requirements.directTeam.completed && (
                                    <span className="text-orange-600 dark:text-orange-400 shrink-0">Need: {progress.requirements.directTeam.remaining} more</span>
                                )}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 sm:h-2">
                                <div
                                    className={`h-1.5 sm:h-2 rounded-full transition-all ${progress.requirements.directTeam.completed ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-emerald-500 dark:bg-emerald-500'}`}
                                    style={{ width: `${progress.requirements.directTeam.progress}%` }}
                                />
                            </div>
                            {progress.requirements.directTeam.completed && (
                                <p className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                                    <CheckCircle size={12} className="shrink-0" />
                                    Requirement met
                                </p>
                            )}
                        </div>

                        {/* Team Business */}
                        <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-purple-200/60 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10">
                            <div className="flex justify-between items-center gap-2 mb-1.5 sm:mb-2">
                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                    <TrendingUp className="text-purple-600 dark:text-purple-400 shrink-0" size={16} />
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">Team Business</span>
                                </div>
                                <span className={`text-[10px] sm:text-sm font-semibold shrink-0 ${progress.requirements.teamBusiness.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {progress.requirements.teamBusiness.progress}%
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 gap-1">
                                <span className="truncate">{formatCurrency(progress.requirements.teamBusiness.current)} / {formatCurrency(progress.requirements.teamBusiness.required)}</span>
                                {!progress.requirements.teamBusiness.completed && (
                                    <span className="text-orange-600 dark:text-orange-400 shrink-0">Need: {formatCurrency(progress.requirements.teamBusiness.remaining)}</span>
                                )}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 sm:h-2">
                                <div
                                    className={`h-1.5 sm:h-2 rounded-full transition-all ${progress.requirements.teamBusiness.completed ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-purple-600 dark:bg-purple-500'}`}
                                    style={{ width: `${progress.requirements.teamBusiness.progress}%` }}
                                />
                            </div>
                            {progress.requirements.teamBusiness.completed && (
                                <p className="text-[9px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                                    <CheckCircle size={12} className="shrink-0" />
                                    Requirement met
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Next Rank Reward Info */}
                    <div className="mt-3 sm:mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-indigo-200 dark:border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                            <Award className="text-indigo-600 dark:text-indigo-400 shrink-0" size={18} />
                            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">Reward for {nextRank.rankName}</span>
                        </div>
                        <p className="text-[11px] sm:text-sm text-gray-700 dark:text-gray-300">
                            <strong>{formatCurrency(nextRank.monthlyReward)}</strong> per month for <strong>{nextRank.durationMonths} months</strong>
                        </p>
                        <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">Total potential: {formatCurrency(nextRank.monthlyReward * nextRank.durationMonths)}</p>
                    </div>
                </div>
            )}

            {/* All Ranks Table - PWA compact, responsive columns */}
            <div className="card rounded-lg sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-500/10 dark:to-purple-500/10 px-3 py-2.5 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">All Ranks (Star-1 to Star-10)</h2>
                    <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Complete list of all achievable ranks and their requirements</p>
                </div>
                <div className="overflow-x-auto rounded-b-lg sm:rounded-b-2xl border-t border-gray-200 dark:border-white/10">
                    <table className="w-full min-w-[480px]">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                                <th className="px-2 py-2 sm:px-6 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Self</th>
                                <th className="hidden sm:table-cell px-2 py-2 sm:px-6 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Direct</th>
                                <th className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                                <th className="px-2 py-2 sm:px-6 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reward</th>
                                <th className="px-2 py-2 sm:px-6 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {allRanks.map((rank) => (
                                <tr key={rank.rankLevel} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Star className={`shrink-0 ${rank.isAchieved ? 'text-amber-500 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} size={18} />
                                            <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{rank.rankName}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2.5 sm:px-6 sm:py-4 text-right text-[10px] sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                        {formatCurrency(rank.requirements.selfBusiness)}
                                    </td>
                                    <td className="hidden sm:table-cell px-2 py-2.5 sm:px-6 sm:py-4 text-right text-[10px] sm:text-sm text-gray-900 dark:text-white">
                                        {rank.requirements.directTeam}
                                    </td>
                                    <td className="hidden md:table-cell px-2 py-2.5 sm:px-6 sm:py-4 text-right text-[10px] sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                        {formatCurrency(rank.requirements.teamBusiness)}
                                    </td>
                                    <td className="px-2 py-2.5 sm:px-6 sm:py-4 text-right">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-sm">{formatCurrency(rank.monthlyReward)}</span>
                                        <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 block">/mo × {rank.durationMonths}</span>
                                    </td>
                                    <td className="px-2 py-2.5 sm:px-6 sm:py-4 text-center">
                                        {rank.isAchieved ? (
                                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 inline-flex items-center text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                <CheckCircle size={12} className="mr-0.5 sm:mr-1 shrink-0" />
                                                Achieved
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 inline-flex text-[10px] sm:text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-400">
                                                <span className="hidden sm:inline">Not Achieved</span>
                                                <span className="sm:hidden">No</span>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Section - PWA compact */}
            <div className="card rounded-lg sm:rounded-2xl p-2.5 sm:p-6 border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <div className="icon-container icon-container-sm shrink-0">
                        <Clock size={16} className="text-white" />
                    </div>
                    How Rank Income Works
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-1.5 sm:gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span>When you meet all requirements for a rank, it's automatically awarded</span>
                    </li>
                    <li className="flex items-start gap-1.5 sm:gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span>Monthly rewards are distributed on the 1st of each month</span>
                    </li>
                    <li className="flex items-start gap-1.5 sm:gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span>
                            Your rank_income uses <span className="font-semibold">oneTime</span> rewards, so each rank is paid for{" "}
                            <span className="font-semibold">1 month</span> (durationMonths = 1)
                        </span>
                    </li>
                    <li className="flex items-start gap-1.5 sm:gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span>If you achieve multiple ranks, only the highest rank reward is given</span>
                    </li>
                    <li className="flex items-start gap-1.5 sm:gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">•</span>
                        <span>
                            Rank requirements are evaluated from your <span className="font-semibold">rank_income</span> rules{" "}
                            (member mode counts unique downline members up to the required depth)
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
