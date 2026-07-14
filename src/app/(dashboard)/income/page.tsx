'use client';

import { useEffect, useState } from 'react';
import { IncomeOverview, IncomeTransaction, IncomeRegistryEntry, WalletState } from '@/types';
import { incomeApi, walletApi } from '@/lib/api/services';
import { getIncomeRowDisplayLabel, getIncomeTypeLabel } from '@/lib/utils/incomeLabel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils/cn';
import { DollarSign, TrendingUp, Users, Target, Zap, Clock, CheckCircle, XCircle, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';

export default function IncomePage() {
    const [overview, setOverview] = useState<IncomeOverview | null>(null);
    // Wallet data comes from the dedicated wallet API — not from income overview
    const [walletState, setWalletState] = useState<WalletState | null>(null);
    const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
    const [incomeRegistry, setIncomeRegistry] = useState<IncomeRegistryEntry[]>([]);
    const [pagination, setPagination] = useState<{
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
        totalCommissions: number;
        totalTransactions: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        limit: 20,
        skip: 0,
    });

    useEffect(() => {
        // Fetch income and wallet data from their respective domain APIs in parallel
        Promise.all([
            incomeApi.getIncomeOverview(),
            walletApi.getWalletState(),
            incomeApi.getIncomeRegistry(),
        ])
            .then(([incomeData, wallet, registry]) => {
                setOverview(incomeData);
                setWalletState(wallet);
                setIncomeRegistry(registry);
            })
            .catch((error) => console.error('Failed to fetch income data:', error))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const data = await incomeApi.getIncomeTransactions(filters);
            setTransactions(data.transactions);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value, skip: 0 });
    };

    const handlePageChange = (newSkip: number) => {
        setFilters({ ...filters, skip: newSkip });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!overview) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">No income data available</p>
            </div>
        );
    }

    const { overview: overviewData, todayIncome, yesterdayIncome } = overview;
    // Wallet data from its own domain API
    const wallet = walletState?.wallet;

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                        <DollarSign size={24} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Income Overview</h1>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Track all your earnings and income sources</p>
                    </div>
                </div>
            </div>

            {/* Wallet Summary — data from GET /users/wallet (wallet domain API) */}
            {wallet && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
                <StatsCard
                    title="Wallet Balance"
                    value={formatCurrency(wallet.balance)}
                    icon={<Wallet size={24} />}
                />
                <StatsCard
                    title="Total Earned"
                    value={formatCurrency(wallet.totalEarned ?? 0)}
                    icon={<DollarSign size={24} />}
                />
                <StatsCard
                    title="Total Withdrawn"
                    value={formatCurrency(wallet.totalWithdrawn ?? 0)}
                    icon={<ArrowDown size={24} />}
                />
                <StatsCard
                    title="Available Balance"
                    value={formatCurrency(wallet.availableBalance)}
                    icon={<TrendingUp size={24} />}
                />
            </div>
            )}

            {/* Overall Statistics */}
            <div className="rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Overall Statistics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
                    <div className="rounded-xl p-4 border border-[var(--pw-primary)]/20 bg-[var(--pw-primary)]/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Total Earned</p>
                        <p className="text-base sm:text-xl font-bold text-[var(--pw-primary)] leading-tight">{formatCurrency(overviewData.overall.totalEarned)}</p>
                    </div>
                    <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Today</p>
                        <p className="text-base sm:text-xl font-bold text-emerald-400 leading-tight">{formatCurrency(todayIncome ?? 0)}</p>
                    </div>
                    <div className="rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5">
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Yesterday</p>
                        <p className="text-base sm:text-xl font-bold text-cyan-400 leading-tight">{formatCurrency(yesterdayIncome ?? 0)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 flex items-center gap-1"><Clock size={12} className="shrink-0" /> Pending</p>
                        <p className="text-xs sm:text-xl font-bold text-amber-600 dark:text-amber-400 leading-tight">{formatCurrency(overviewData.overall.totalPending)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 flex items-center gap-1"><CheckCircle size={12} className="shrink-0" /> Approved</p>
                        <p className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{formatCurrency(overviewData.overall.totalApproved)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-purple-200/60 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Paid Out</p>
                        <p className="text-xs sm:text-xl font-bold text-purple-600 dark:text-purple-400 leading-tight">{formatCurrency(overviewData.overall.totalPaid)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Available</p>
                        <p className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{formatCurrency(overviewData.overall.totalAvailable)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Total Txns</p>
                        <p className="text-xs sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{overviewData.overall.totalTransactions}</p>
                    </div>
                </div>
            </div>

            {/* Commissions Breakdown - PWA compact */}
            {overviewData.commissions.byType.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Commissions Breakdown</h2>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] min-w-0">
                        <table className="w-full min-w-[420px] sm:min-w-0">
                            <thead className="bg-[var(--surface)]">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Pending</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Approved</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Paid</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {overviewData.commissions.byType.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--surface)]/40 transition-colors">
                                        <td className="px-3 py-3">
                                            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                                                {getIncomeTypeLabel(item.type, incomeRegistry)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm font-bold text-[var(--foreground)]">{formatCurrency(item.totalAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-semibold">{formatCurrency(item.pendingAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold">{formatCurrency(item.approvedAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(item.paidAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-[var(--muted-foreground)] font-mono">{item.count}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-[var(--surface)]/60 font-semibold">
                                    <td className="px-3 py-3 text-[var(--foreground)] text-xs sm:text-sm">Total</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.commissions.totals.total)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.commissions.totals.pending)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.commissions.totals.approved)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.commissions.totals.paid)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm font-mono">{overviewData.commissions.totals.count}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {overviewData.transactions.byType.length > 0 && (
                <div className="rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Transactions Breakdown</h2>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] min-w-0">
                        <table className="w-full min-w-[420px] sm:min-w-0">
                            <thead className="bg-[var(--surface)]">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Pending</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Processed</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Stopped</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {overviewData.transactions.byType.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--surface)]/40 transition-colors">
                                        <td className="px-3 py-3">
                                            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                                                {getIncomeTypeLabel(item.type, incomeRegistry)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm font-bold text-[var(--foreground)]">{formatCurrency(item.totalAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-semibold">{formatCurrency(item.pendingAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(item.processedAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold">{formatCurrency(item.stoppedAmount)}</span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs sm:text-sm text-[var(--muted-foreground)] font-mono">{item.count}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-[var(--surface)]/60 font-semibold">
                                    <td className="px-3 py-3 text-[var(--foreground)] text-xs sm:text-sm">Total</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.transactions.totals.total)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.transactions.totals.pending)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.transactions.totals.processed)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm">{formatCurrency(overviewData.transactions.totals.stopped)}</td>
                                    <td className="px-3 py-3 text-right text-[var(--foreground)] text-xs sm:text-sm font-mono">{overviewData.transactions.totals.count}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Transaction History - PWA compact */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Transaction History</h2>
                        {pagination && (
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                                Showing {filters.skip + 1}-{Math.min(filters.skip + filters.limit, pagination.total)} of {pagination.total}
                            </p>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] sm:text-sm focus:ring-2 focus:ring-primary/40 min-h-[40px] touch-manipulation outline-none"
                        >
                            <option value="" className="bg-[var(--surface-elevated)]">All Types</option>
                            <optgroup label="Commissions" className="bg-[var(--surface-elevated)] font-semibold text-[var(--muted-foreground)]">
                                <option value="referral" className="bg-[var(--surface-elevated)] font-normal text-[var(--foreground)]">Direct Referral</option>
                                <option value="binary_placement" className="bg-[var(--surface-elevated)] font-normal text-[var(--foreground)]">Placement Spillover</option>
                                <option value="binary_matching" className="bg-[var(--surface-elevated)] font-normal text-[var(--foreground)]">Binary Matching</option>
                                <option value="global_autopool" className="bg-[var(--surface-elevated)] font-normal text-[var(--foreground)]">Global Auto-Pool</option>
                            </optgroup>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] sm:text-sm focus:ring-2 focus:ring-primary/40 min-h-[40px] touch-manipulation outline-none"
                        >
                            <option value="" className="bg-[var(--surface-elevated)]">All Status</option>
                            <option value="pending" className="bg-[var(--surface-elevated)]">Pending</option>
                            <option value="approved" className="bg-[var(--surface-elevated)]">Approved</option>
                            <option value="paid" className="bg-[var(--surface-elevated)]">Paid</option>
                            <option value="processed" className="bg-[var(--surface-elevated)]">Processed</option>
                            <option value="rejected" className="bg-[var(--surface-elevated)]">Rejected</option>
                            <option value="stopped" className="bg-[var(--surface-elevated)]">Stopped</option>
                            <option value="failed" className="bg-[var(--surface-elevated)]">Failed</option>
                        </select>

                        <select
                            value={filters.limit}
                            onChange={(e) => handleFilterChange('limit', e.target.value)}
                            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-[11px] sm:text-sm focus:ring-2 focus:ring-primary/40 min-h-[40px] touch-manipulation outline-none"
                        >
                            <option value="10" className="bg-[var(--surface-elevated)]">10 per page</option>
                            <option value="20" className="bg-[var(--surface-elevated)]">20 per page</option>
                            <option value="50" className="bg-[var(--surface-elevated)]">50 per page</option>
                            <option value="100" className="bg-[var(--surface-elevated)]">100 per page</option>
                        </select>
                    </div>
                </div>

                {loadingTransactions ? (
                    <div className="p-6 sm:p-12 text-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto min-w-0">
                            <table className="w-full min-w-[520px] sm:min-w-0">
                                <thead className="bg-[var(--surface)]">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Income Type
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hidden md:table-cell">
                                            Details
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {transactions.length > 0 ? (
                                        transactions.map((transaction) => (
                                            <TransactionRow key={transaction.id} transaction={transaction} registry={incomeRegistry} />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-[var(--muted-foreground)] text-sm">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - PWA compact */}
                        {pagination && pagination.total > 0 && (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex justify-between items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, filters.skip - filters.limit))}
                                    disabled={filters.skip === 0}
                                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-[var(--border)] text-[11px] sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[40px]"
                                >
                                    Previous
                                </button>
                                <span className="text-xs sm:text-sm text-[var(--muted-foreground)] text-center">
                                    Page {Math.floor(filters.skip / filters.limit) + 1} of {Math.ceil(pagination.total / filters.limit)}
                                </span>
                                <button
                                    onClick={() => handlePageChange(filters.skip + filters.limit)}
                                    disabled={!pagination.hasMore}
                                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-[var(--border)] text-[11px] sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[40px]"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Transaction Row Component - PWA compact
function TransactionRow({ transaction, registry = [] }: { transaction: IncomeTransaction; registry?: IncomeRegistryEntry[] }) {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'processed':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
            case 'approved':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
            case 'rejected':
            case 'failed':
            case 'stopped':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300';
        }
    };

    const getTypeBadge = (type: string) => {
        return type === 'commission' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    };

    return (
        <tr className="hover:bg-[var(--surface)]/50 transition-colors border-b border-[var(--border)] last:border-0">
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(transaction.type)}`}>
                    {transaction.type}
                </span>
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap min-w-0">
                <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate block">
                    {getIncomeRowDisplayLabel(transaction, registry)}
                </span>
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(transaction.amount)}
                </span>
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                </span>
            </td>
            <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                <div className="text-xs sm:text-sm text-[var(--muted-foreground)] space-y-1">
                    {(transaction.sourceUserId || transaction.fromUserId) && (
                        <p className="truncate">From: <span className="font-mono text-[var(--foreground)]">{transaction.sourceUserId || transaction.fromUserId}</span></p>
                    )}
                    {transaction.sourcePackageId && (
                        <p className="truncate">Pkg: <span className="font-mono text-[var(--foreground)]">{transaction.sourcePackageId}</span></p>
                    )}
                    {transaction.calculationDetails && (
                        <p className="text-xs text-[var(--muted-foreground)]/80 truncate">{transaction.calculationDetails.formula || 'Auto-calculated'}</p>
                    )}
                    {transaction.cappingInfo && (
                        <p className="text-xs text-[var(--muted-foreground)]/80 truncate">
                            Capping: {formatCurrency(transaction.cappingInfo.currentEarnings || 0)} / {formatCurrency(transaction.cappingInfo.cappingLimit || 0)}
                        </p>
                    )}
                </div>
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">{formatDateTime(transaction.createdAt)}</span>
                {transaction.paidAt && (
                    <p className="text-xs text-[var(--muted-foreground)]/70 mt-1">Paid: {formatDate(transaction.paidAt)}</p>
                )}
                {transaction.processedAt && (
                    <p className="text-xs text-[var(--muted-foreground)]/70 mt-1">Processed: {formatDate(transaction.processedAt)}</p>
                )}
            </td>
        </tr>
    );
}
