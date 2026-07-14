'use client';

import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '@/constants/env';
import { WalletState, WalletTransaction, PaymentRequest } from '@/types';
import { IPaymentConfig } from '@/types/paymentConfig';
import { walletApi, paymentApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils/cn';
import { Wallet as WalletIcon, RefreshCw, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, DollarSign, CreditCard, Upload, History, CheckCircle, XCircle, Clock, Image as ImageIcon, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { StatsCard } from '@/components/ui/StatsCard';
import { Modal } from '@/components/ui/Modal';
import { DepositModal } from '@/components/wallet/deposit/DepositModal';
import { WithdrawalModal } from '@/components/wallet/withdrawal/WithdrawalModal';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

export default function WalletPage() {
    const [walletState, setWalletState] = useState<WalletState | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [transactionsPagination, setTransactionsPagination] = useState<{
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
    } | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<IPaymentConfig | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
    const [paymentHistoryPagination, setPaymentHistoryPagination] = useState<{
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        limit: 20,
        skip: 0,
    });
    const [paymentHistoryFilters, setPaymentHistoryFilters] = useState({
        type: '' as 'deposit' | 'withdrawal' | '',
        status: '',
        limit: 20,
        skip: 0,
    });

    const fetchWalletState = useCallback(async () => {
        try {
            const data = await walletApi.getWalletState();
            setWalletState(data);
        } catch (error) {
            console.error('Failed to fetch wallet state:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        setLoadingTransactions(true);
        try {
            const data = await walletApi.getWalletTransactions({
                limit: filters.limit,
                skip: filters.skip,
                category: filters.category || undefined,
            });
            setTransactions(data.transactions);
            setTransactionsPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoadingTransactions(false);
        }
    }, [filters.limit, filters.skip, filters.category]);

    useEffect(() => {
        fetchWalletState();
        fetchPaymentMethods();
    }, [fetchWalletState]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        if (showPaymentHistory) {
            fetchPaymentHistory();
        }
    }, [showPaymentHistory, paymentHistoryFilters]);

    const handleFilterChange = (key: string, value: string | number) => {
        setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
    };

    const handlePageChange = (newSkip: number) => {
        setFilters((prev) => ({ ...prev, skip: newSkip }));
    };

    const fetchPaymentMethods = async () => {
        try {
            const methods = await paymentApi.getPaymentMethods();
            setPaymentMethods(methods);
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        }
    };

    const fetchPaymentHistory = async () => {
        setLoadingPaymentHistory(true);
        try {
            // Filter out empty strings from filters
            const filters = {
                ...paymentHistoryFilters,
                type: paymentHistoryFilters.type || undefined,
                status: paymentHistoryFilters.status || undefined,
            };
            const data = await paymentApi.getPaymentHistory(filters);
            setPaymentHistory(data.requests);
            setPaymentHistoryPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch payment history:', error);
            toast.error('Failed to load payment history');
        } finally {
            setLoadingPaymentHistory(false);
        }
    };

    const handleDepositSuccess = () => {
        fetchWalletState();
        fetchTransactions();
        if (showPaymentHistory) {
            fetchPaymentHistory();
        }
    };

    const handleWithdrawalSuccess = () => {
        fetchWalletState();
        fetchTransactions();
        if (showPaymentHistory) {
            fetchPaymentHistory();
        }
    };

    if (loading && !walletState) {
        return (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="h-32 sm:h-40 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="h-24 sm:h-28 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="h-48 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="h-64 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
        );
    }

    if (!walletState) {
        return (
            <div className="flex items-center justify-center min-h-[200px] sm:h-64">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No wallet data available</p>
            </div>
        );
    }

    const { wallet, summary, statistics } = walletState;
    const lockedAmount = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                            <WalletIcon size={24} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>My Wallet</h1>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage your funds and withdrawals</p>
                        </div>
                    </div>
                    {(paymentMethods?.deposit?.web3?.enabled || paymentMethods?.withdrawal?.web3?.enabled) && (
                        <div className="sm:ml-auto shrink-0">
                            <ConnectWalletButton variant="compact" />
                        </div>
                    )}
                </div>
            </div>

            {/* Wallet Summary Cards - 2x2 on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                <StatsCard
                    title="Current Balance"
                    value={formatCurrency(wallet.balance)}
                    icon={<WalletIcon size={24} />}
                />
                <StatsCard
                    title="Total Earned"
                    value={formatCurrency(wallet.totalEarned)}
                    icon={<TrendingUp size={24} />}
                />
                <StatsCard
                    title="Total Withdrawn"
                    value={formatCurrency(wallet.totalWithdrawn)}
                    icon={<TrendingDown size={24} />}
                />
                <StatsCard
                    title="Available Balance"
                    value={formatCurrency(wallet.availableBalance)}
                    icon={<DollarSign size={24} />}
                />
            </div>

            {lockedAmount > 0 && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10 p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Lock size={16} className="mt-0.5 text-amber-700 dark:text-amber-300 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                {formatCurrency(lockedAmount)} is locked
                            </p>
                            <p className="text-xs sm:text-sm text-amber-700/90 dark:text-amber-200/90">
                                This amount is blocked because one or more withdrawal requests are pending review. You cannot spend this locked amount until those requests are approved or rejected.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Statistics */}
            <div className="premium-card rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4">Summary Statistics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 min-w-0">
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Total Credit</p>
                        <p className="text-xs sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate">{formatCurrency(summary.totalCredit)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-red-200/60 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 min-w-0">
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Total Debit</p>
                        <p className="text-xs sm:text-xl font-bold text-red-600 dark:text-red-400 truncate">{formatCurrency(summary.totalDebit)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 min-w-0">
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Total Income</p>
                        <p className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(summary.totalIncome)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 min-w-0">
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Total Withdrawal</p>
                        <p className="text-xs sm:text-xl font-bold text-amber-600 dark:text-amber-400 truncate">{formatCurrency(summary.totalWithdrawal)}</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl p-2 sm:p-4 border border-purple-200/60 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10 min-w-0 col-span-2 sm:col-span-1">
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Net Balance</p>
                        <p className="text-xs sm:text-xl font-bold text-purple-600 dark:text-purple-400 truncate">{formatCurrency(summary.netBalance)}</p>
                    </div>
                </div>
            </div>

            {/* Category Statistics */}
            {statistics.byCategory.length > 0 && (
                <div className="premium-card rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4">Statistics by Category</h2>
                    <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-white/10">
                        <table className="w-full min-w-[420px]">
                            <thead className="bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</th>
                                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Total</th>
                                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Count</th>
                                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Credit</th>
                                    <th className="hidden md:table-cell px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Debit</th>
                                    <th className="hidden lg:table-cell px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completed</th>
                                    <th className="hidden lg:table-cell px-2 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pending</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {statistics.byCategory.map((stat, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                                            <span className="text-sm font-medium text-[var(--foreground)] capitalize">
                                                {stat.category}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(stat.totalAmount)}</span>
                                        </td>
                                        <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-sm text-[var(--muted-foreground)]">{stat.count}</span>
                                        </td>
                                        <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-[10px] sm:text-sm text-green-600 dark:text-green-400">{formatCurrency(stat.creditAmount)}</span>
                                        </td>
                                        <td className="hidden md:table-cell px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-[10px] sm:text-sm text-red-600 dark:text-red-400">{formatCurrency(stat.debitAmount)}</span>
                                        </td>
                                        <td className="hidden lg:table-cell px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-[10px] sm:text-sm text-blue-600 dark:text-blue-400">{formatCurrency(stat.completedAmount)}</span>
                                        </td>
                                        <td className="hidden lg:table-cell px-2 py-2.5 sm:px-4 sm:py-3 text-right">
                                            <span className="text-[10px] sm:text-sm text-yellow-600 dark:text-yellow-400">{formatCurrency(stat.pendingAmount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div className="premium-card rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">Transaction History</h2>
                            {transactionsPagination && (
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Showing {filters.skip + 1}-{Math.min(filters.skip + filters.limit, transactionsPagination.total)} of {transactionsPagination.total}
                                </p>
                            )}
                        </div>

                    {/* Filters - compact, stack on mobile */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            <option value="deposit">Deposit</option>
                            <option value="income">Income</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="investment">Investment</option>
                            <option value="fee">Fee</option>
                            <option value="refund">Refund</option>
                        </select>

                        <select
                            value={filters.limit}
                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>

                        <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-auto">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="btn btn-primary px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm"
                            >
                                <Upload size={14} />
                                Deposit
                            </button>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="btn btn-primary px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm"
                            >
                                <CreditCard size={14} />
                                Withdraw
                            </button>
                            <button
                                onClick={() => setShowPaymentHistory(true)}
                                className="btn btn-secondary px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm"
                            >
                                <History size={14} />
                                History
                            </button>
                        </div>
                    </div>
                </div>

                {loadingTransactions ? (
                    <div className="p-6 sm:p-12 text-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px]">
                                <thead className="bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Type</th>
                                        <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</th>
                                        <th className="px-2 py-2 sm:px-6 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                        <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                                        <th className="hidden md:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                                        <th className="hidden lg:table-cell px-2 py-2 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                                        <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                                    {transactions.length > 0 ? (
                                        transactions.map((transaction) => (
                                            <TransactionRow key={transaction.id} transaction={transaction} />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - compact */}
                        {transactionsPagination && transactionsPagination.total > 0 && (
                            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, filters.skip - filters.limit))}
                                    disabled={filters.skip === 0}
                                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-[var(--muted-foreground)]">
                                    Page {Math.floor(filters.skip / filters.limit) + 1} of {Math.ceil(transactionsPagination.total / filters.limit)}
                                </span>
                                <button
                                    onClick={() => handlePageChange(filters.skip + filters.limit)}
                                    disabled={!transactionsPagination.hasMore}
                                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Withdrawal Modal */}
            <WithdrawalModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                paymentMethods={paymentMethods}
                walletData={walletState}
                onSuccess={handleWithdrawalSuccess}
            />

            {/* Deposit Modal */}
            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                paymentMethods={paymentMethods}
                walletData={walletState}
                onSuccess={handleDepositSuccess}
            />

            {/* Payment History Modal */}
            <Modal
                isOpen={showPaymentHistory}
                onClose={() => setShowPaymentHistory(false)}
                title="Payment History"
                size="lg"
            >
                <div className="space-y-3 sm:space-y-4">
                    {/* Filters - compact */}
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                        <select
                            value={paymentHistoryFilters.type}
                            onChange={(e) => setPaymentHistoryFilters({ ...paymentHistoryFilters, type: e.target.value as any, skip: 0 })}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                        </select>

                        <select
                            value={paymentHistoryFilters.status}
                            onChange={(e) => setPaymentHistoryFilters({ ...paymentHistoryFilters, status: e.target.value, skip: 0 })}
                            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="approved">Approved</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="failed">Failed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Payment History List */}
                    {loadingPaymentHistory ? (
                        <div className="p-6 sm:p-12 text-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 sm:space-y-3">
                                {paymentHistory.length > 0 ? (
                                    paymentHistory.map((request) => (
                                        <PaymentRequestCard key={request.id} request={request} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400 text-sm">
                                        No payment requests found
                                    </div>
                                )}
                            </div>

                            {/* Pagination - compact */}
                            {paymentHistoryPagination && paymentHistoryPagination.total > 0 && (
                                <div className="flex justify-between items-center gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
                                    <button
                                        onClick={() => setPaymentHistoryFilters({ ...paymentHistoryFilters, skip: Math.max(0, paymentHistoryFilters.skip - paymentHistoryFilters.limit) })}
                                        disabled={paymentHistoryFilters.skip === 0}
                                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-[var(--muted-foreground)]">
                                        Page {Math.floor(paymentHistoryFilters.skip / paymentHistoryFilters.limit) + 1} of {Math.ceil(paymentHistoryPagination.total / paymentHistoryFilters.limit)}
                                    </span>
                                    <button
                                        onClick={() => setPaymentHistoryFilters({ ...paymentHistoryFilters, skip: paymentHistoryFilters.skip + paymentHistoryFilters.limit })}
                                        disabled={!paymentHistoryPagination.hasMore}
                                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

// Payment Request Card Component
function PaymentRequestCard({ request }: { request: PaymentRequest }) {
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'confirmed':
                return <CheckCircle size={18} className="text-green-600" />;
            case 'rejected':
            case 'failed':
                return <XCircle size={18} className="text-red-600" />;
            case 'pending':
                return <Clock size={18} className="text-yellow-600" />;
            case 'processing':
                return <RefreshCw size={18} className="text-blue-600 animate-spin" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'confirmed':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
            case 'rejected':
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
            case 'processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'deposit' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    };

    const getProofUrl = (proofImage?: string | null) => {
        if (!proofImage) return null;
        if (proofImage.startsWith('http://') || proofImage.startsWith('https://')) {
            return proofImage;
        }
        const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
        const cleanUrl = proofImage.startsWith('/') ? proofImage : `/${proofImage}`;
        return `${baseUrl}${cleanUrl}`;
    };

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap min-w-0">
                    <span className={`px-2 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${getTypeColor(request.type)}`}>
                        {request.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)} flex items-center gap-1`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                    </span>
                </div>
                <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white shrink-0">{formatCurrency(request.amount)}</span>
            </div>

            <div className="space-y-1.5 sm:space-y-2 text-sm text-[var(--muted-foreground)]">
                <p><strong>Method:</strong> {request.method.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Reference:</strong> <span className="font-mono text-xs break-all">{request.reference}</span></p>
                {request.transactionHash && (
                    <p><strong>Tx Hash:</strong> <span className="font-mono text-xs break-all">{request.transactionHash}</span></p>
                )}
                {request.description && (
                    <p><strong>Description:</strong> {request.description}</p>
                )}
                {request.withdrawalDetails && (
                    <div>
                        <p><strong>Withdrawal Details:</strong></p>
                        {request.withdrawalDetails.bankAccount && (
                            <p className="text-xs ml-2 sm:ml-4">Bank Account: {request.withdrawalDetails.bankAccount}</p>
                        )}
                        {request.withdrawalDetails.upiId && (
                            <p className="text-xs ml-2 sm:ml-4">UPI ID: {request.withdrawalDetails.upiId}</p>
                        )}
                        {request.withdrawalDetails.walletAddress && (
                            <p className="text-xs ml-2 sm:ml-4">Wallet: {request.withdrawalDetails.walletAddress}</p>
                        )}
                    </div>
                )}
                {request.proofImage && (
                    <div>
                        <p><strong>Proof:</strong></p>
                        <a
                            href={getProofUrl(request.proofImage) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--pw-primary)] hover:text-[var(--pw-primary)]/80 text-xs ml-2 sm:ml-4"
                        >
                            <ImageIcon size={12} />
                            View Proof
                        </a>
                    </div>
                )}
                {request.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded p-1.5 sm:p-2 mt-1.5 sm:mt-2">
                        <p className="text-xs text-red-800 dark:text-red-300"><strong>Rejection Reason:</strong> {request.rejectionReason}</p>
                    </div>
                )}
                {request.reviewedAt && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                        Reviewed {formatDateTime(request.reviewedAt)}
                        {request.reviewedBy && ` by ${request.reviewedBy}`}
                    </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">Created: {formatDateTime(request.createdAt)}</p>
            </div>
        </div>
    );
}

// Transaction Row Component - PWA compact, responsive columns
function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
    const isCredit = transaction.type === 'credit';
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'income':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
            case 'withdrawal':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
            case 'investment':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
            case 'fee':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400';
            case 'refund':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300';
        }
    };

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-white/5">
            <td className="px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className={`px-2 py-0.5 sm:px-2 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isCredit ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'}`}>
                    {transaction.type.toUpperCase()}
                </span>
            </td>
            <td className="px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className={`px-2 py-0.5 sm:px-2 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                </span>
            </td>
            <td className="px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap text-right">
                <span className={`text-sm font-bold ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
            </td>
            <td className="px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                </span>
            </td>
            <td className="hidden md:table-cell px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className="text-sm font-mono text-[var(--muted-foreground)] truncate max-w-[100px] sm:max-w-none inline-block">{transaction.reference}</span>
                {transaction.description && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{transaction.description}</p>
                )}
            </td>
            <td className="hidden lg:table-cell px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--muted-foreground)] font-mono">
                    {formatCurrency(transaction.balanceBefore)} → {formatCurrency(transaction.balanceAfter)}
                </div>
            </td>
            <td className="px-2 py-2.5 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className="text-sm text-[var(--muted-foreground)]">{formatDateTime(transaction.createdAt)}</span>
            </td>
        </tr>
    );
}
