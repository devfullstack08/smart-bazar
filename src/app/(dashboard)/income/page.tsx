'use client';

import { useEffect, useState } from 'react';
import { IncomeOverview, IncomeTransaction, IncomeRegistryEntry, WalletState } from '@/types';
import { incomeApi, walletApi } from '@/lib/api/services';
import { getIncomeRowDisplayLabel, getIncomeTypeLabel } from '@/lib/utils/incomeLabel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils/cn';
import { DollarSign, TrendingUp, Users, Target, Zap, Clock, CheckCircle, XCircle, Wallet, ArrowUp, ArrowDown, Receipt, X, Copy, Check, Info, Calendar, FileText } from 'lucide-react';
import { APP_NAME } from '@/constants/env';
import toast from 'react-hot-toast';

export default function IncomePage() {
    const [overview, setOverview] = useState<IncomeOverview | null>(null);
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
    const [selectedTx, setSelectedTx] = useState<IncomeTransaction | null>(null);
    const [copied, setCopied] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        limit: 20,
        skip: 0,
    });

    useEffect(() => {
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Transaction ID copied');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="h-28 sm:h-32 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                    ))}
                </div>
                <div className="h-44 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                <div className="h-64 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">No income data available</p>
            </div>
        );
    }

    const { overview: overviewData, todayIncome, yesterdayIncome } = overview;
    const wallet = walletState?.wallet;
    const totalCommissions = overviewData.commissions.totals.total || 1;

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                        <DollarSign size={24} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] leading-tight tracking-tight">Income Analytics</h1>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Track, audit, and analyze all income commission flows</p>
                    </div>
                </div>
            </div>

            {/* Wallet Summary */}
            {wallet && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] relative overflow-hidden transition-all hover:shadow-lg">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Income Ledger</p>
                        <h4 className="text-lg sm:text-2xl font-black text-[var(--foreground)] mt-2 tabular-nums">{formatCurrency(wallet.balance)}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-2">
                            <Wallet size={12} className="text-primary" />
                            <span>Total Balance</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] relative overflow-hidden transition-all hover:shadow-lg">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Total Gross Sales</p>
                        <h4 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">{formatCurrency(wallet.totalEarned ?? 0)}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-2">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span>Lifetime Earnings</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] relative overflow-hidden transition-all hover:shadow-lg">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Settled Payouts</p>
                        <h4 className="text-lg sm:text-2xl font-black text-primary mt-2 tabular-nums">{formatCurrency(wallet.totalWithdrawn ?? 0)}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-2">
                            <ArrowDown size={12} className="text-primary" />
                            <span>Total Withdrawn</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] relative overflow-hidden transition-all hover:shadow-lg">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Clearable Fund</p>
                        <h4 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">{formatCurrency(wallet.availableBalance)}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-2">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span>Instantly Available</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Overall Statistics */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4">
                <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">Overall Performance Indicators</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div className="rounded-xl p-3.5 border border-primary/20 bg-primary/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Gross Revenue</p>
                        <p className="text-sm sm:text-base font-black text-primary leading-tight mt-1.5 tabular-nums">{formatCurrency(overviewData.overall.totalEarned)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Today</p>
                        <p className="text-sm sm:text-base font-black text-emerald-400 leading-tight mt-1.5 tabular-nums">{formatCurrency(todayIncome ?? 0)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-cyan-500/20 bg-cyan-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Yesterday</p>
                        <p className="text-sm sm:text-base font-black text-cyan-400 leading-tight mt-1.5 tabular-nums">{formatCurrency(yesterdayIncome ?? 0)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-amber-500/20 bg-amber-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Unsettled</p>
                        <p className="text-sm sm:text-base font-black text-amber-500 leading-tight mt-1.5 tabular-nums">{formatCurrency(overviewData.overall.totalPending)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Cleared</p>
                        <p className="text-sm sm:text-base font-black text-emerald-500 leading-tight mt-1.5 tabular-nums">{formatCurrency(overviewData.overall.totalApproved)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-purple-500/20 bg-purple-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Paid Out</p>
                        <p className="text-sm sm:text-base font-black text-purple-400 leading-tight mt-1.5 tabular-nums">{formatCurrency(overviewData.overall.totalPaid)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Net Liquid</p>
                        <p className="text-sm sm:text-base font-black text-emerald-500 leading-tight mt-1.5 tabular-nums">{formatCurrency(overviewData.overall.totalAvailable)}</p>
                    </div>
                    <div className="rounded-xl p-3.5 border border-[var(--border)] bg-[var(--surface)]">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Audited Txns</p>
                        <p className="text-sm sm:text-base font-black text-[var(--foreground)] leading-tight mt-1.5 tabular-nums">{overviewData.overall.totalTransactions}</p>
                    </div>
                </div>
            </div>

            {/* Commissions Breakdown - Progress bars visualizer */}
            {overviewData.commissions.byType.length > 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-6">
                    <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">Channel Revenue Contributions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {overviewData.commissions.byType.map((item, index) => {
                                const percent = (item.totalAmount / totalCommissions) * 100;
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-[var(--foreground)]">
                                            <span>{getIncomeTypeLabel(item.type, incomeRegistry)}</span>
                                            <span className="tabular-nums">{percent.toFixed(1)}% ({formatCurrency(item.totalAmount)})</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-black/30 overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-[var(--border)] min-w-0 bg-[var(--surface)]/50">
                            <table className="w-full min-w-[320px] text-xs">
                                <thead>
                                    <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] font-semibold">
                                        <th className="px-3 py-3.5 text-left">Channel Name</th>
                                        <th className="px-3 py-3.5 text-right">Cleared</th>
                                        <th className="px-3 py-3.5 text-right">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {overviewData.commissions.byType.map((item, index) => (
                                        <tr key={index} className="hover:bg-[var(--surface)]/60 transition-colors">
                                            <td className="px-3 py-3 font-semibold text-[var(--foreground)]">
                                                {getIncomeTypeLabel(item.type, incomeRegistry)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {formatCurrency(item.approvedAmount)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-[var(--muted-foreground)] tabular-nums">
                                                {item.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction History Grid */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">Audit Stream Logs</h2>
                        {pagination && (
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-semibold">
                                Showing {filters.skip + 1}-{Math.min(filters.skip + filters.limit, pagination.total)} of {pagination.total} entries
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
                                <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
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
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white dark:bg-transparent">
                                    {transactions.length > 0 ? (
                                        transactions.map((transaction) => (
                                            <tr 
                                                key={transaction.id} 
                                                onClick={() => setSelectedTx(transaction)}
                                                className="hover:bg-[var(--surface)] cursor-pointer transition-colors border-b border-[var(--border)] last:border-0 group"
                                            >
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-[9px] font-bold rounded-full uppercase tracking-wider ${
                                                        transaction.type === 'commission' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                        {transaction.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] flex items-center justify-center shrink-0">
                                                            <Receipt size={14} className="text-primary" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-semibold text-[var(--foreground)] group-hover:text-primary transition-colors">
                                                            {getIncomeRowDisplayLabel(transaction, incomeRegistry)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                                    +{formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-[9px] font-bold rounded-full uppercase tracking-wider ${
                                                        transaction.status.toLowerCase() === 'paid' || transaction.status.toLowerCase() === 'processed'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                            : transaction.status.toLowerCase() === 'approved'
                                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-[var(--muted-foreground)] tabular-nums">
                                                    {formatDateTime(transaction.createdAt)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-[var(--muted-foreground)] text-sm">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex justify-between items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, filters.skip - filters.limit))}
                                    disabled={filters.skip === 0}
                                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-[var(--border)] text-[11px] sm:text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[40px]"
                                >
                                    Previous
                                </button>
                                <span className="text-xs sm:text-sm text-[var(--muted-foreground)] text-center font-semibold">
                                    Page {Math.floor(filters.skip / filters.limit) + 1} of {Math.ceil(pagination.total / filters.limit)}
                                </span>
                                <button
                                    onClick={() => handlePageChange(filters.skip + filters.limit)}
                                    disabled={!pagination.hasMore}
                                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-[var(--border)] text-[11px] sm:text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[40px]"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Audit Details Voucher Modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-[var(--surface-elevated)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col max-w-md w-full relative overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Decorative background glows */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                        {/* Invoice Header */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Receipt size={18} />
                                <h3 className="text-base font-black text-[var(--foreground)] tracking-tight">Audit Statement</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedTx(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors focus:outline-none"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Invoice Voucher Body */}
                        <div className="py-6 space-y-6 relative">
                            {/* Brand Tag */}
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{APP_NAME} Auditor</p>
                                <p className="text-xs text-[var(--muted-foreground)] font-medium">Logged: {formatDateTime(selectedTx.createdAt)}</p>
                            </div>

                            {/* Dashed Divider */}
                            <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                            {/* Particular details */}
                            <div className="space-y-4 text-xs">
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Commission description</p>
                                    <p className="text-xs font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] p-3 rounded-lg leading-relaxed">
                                        {getIncomeRowDisplayLabel(selectedTx, incomeRegistry)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Stream Type</p>
                                        <p className="text-xs font-bold text-[var(--foreground)] mt-1 capitalize">{selectedTx.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Settlement Status</p>
                                        <div className="mt-1">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                {selectedTx.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculation details formula */}
                                {selectedTx.calculationDetails && (
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Calculation Formula</p>
                                        <p className="text-xs font-mono text-primary bg-[var(--surface)] border border-[var(--border)] p-2 rounded-lg mt-1 select-all">
                                            {selectedTx.calculationDetails.formula || 'Auto-calculated commission'}
                                        </p>
                                    </div>
                                )}

                                {/* Transaction Hash Reference ID with copy */}
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Tx Reference ID</p>
                                    <div className="flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg mt-1 font-mono text-[10px] text-[var(--foreground)]">
                                        <span className="truncate">{selectedTx.id}</span>
                                        <button 
                                            onClick={() => copyToClipboard(selectedTx.id)}
                                            className="text-primary hover:text-primary/80 transition-colors focus:outline-none"
                                            title="Copy ID"
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dashed Divider */}
                            <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                            {/* Grand Totals */}
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between font-black text-[var(--foreground)] text-sm pt-2 border-t border-[var(--border)]">
                                    <span>Allocated Commission:</span>
                                    <span className="text-emerald-500 tabular-nums">+{formatCurrency(selectedTx.amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] font-bold text-xs text-[var(--foreground)] transition-colors focus:outline-none"
                            >
                                Close Voucher
                            </button>
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-black hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                            >
                                <FileText size={13} />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
