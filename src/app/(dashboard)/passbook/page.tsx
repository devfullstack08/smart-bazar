'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store/store';
import { passbookApi, type PassbookEntry, type PassbookSummary } from '@/lib/api/services';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { BookOpen, TrendingUp, TrendingDown, Wallet, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

type ProfileUser = NonNullable<RootState['auth']['user']> & {
    userName?: string;
    wallet?: { balance?: number };
};

export default function PassbookPage() {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [summary, setSummary] = useState<PassbookSummary | null>(null);
    const [entries, setEntries] = useState<PassbookEntry[]>([]);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [typeFilter, setTypeFilter] = useState<'credit' | 'debit' | ''>('');
    const [page, setPage] = useState(1);
    const limit = 30;

    const [loading, setLoading] = useState(true);
    const [tableBusy, setTableBusy] = useState(false);
    const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

    const firstLoadRef = useRef(true);
    const profile = user as ProfileUser | null;
    const displayName = profile?.userName ?? profile?.fullName ?? profile?.name ?? '—';
    const balanceNum = typeof profile?.wallet?.balance === 'number' ? profile.wallet.balance : null;

    const fetchData = useCallback(async () => {
        const isFirst = firstLoadRef.current;
        if (isFirst) setLoading(true);
        else setTableBusy(true);
        try {
            const [sum, list] = await Promise.all([
                passbookApi.getSummary(),
                passbookApi.getPassbook({
                    page,
                    limit,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                    type: typeFilter || undefined,
                }),
            ]);
            setSummary(sum);
            setEntries(list.entries);
            setPagination(list.pagination);
        } catch {
            toast.error('Failed to load passbook');
        } finally {
            if (isFirst) {
                setLoading(false);
                firstLoadRef.current = false;
            } else {
                setTableBusy(false);
            }
        }
    }, [page, limit, fromDate, toDate, typeFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        setExporting(format);
        try {
            const blob = await passbookApi.exportPassbook(format, {
                from: fromDate || undefined,
                to: toDate || undefined,
            });
            downloadBlob(blob, `passbook-${profile?.userId ?? 'export'}.${format}`);
            toast.success('Download started');
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(null);
        }
    };

    const sum = summary ?? { totalCredited: 0, totalDebited: 0, netBalance: 0, entryCount: 0, lastActivity: null };
    const totalPages = Math.max(1, pagination?.pages ?? 1);
    const currentPage = pagination?.page ?? page;

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="h-28 sm:h-32 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 sm:h-28 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="h-16 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="h-64 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8 sm:pb-12 lg:pb-16">

            {/* ── Header Card ── */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                            <BookOpen size={24} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Account Passbook</h1>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{displayName} · {profile?.userId ?? '—'}</p>
                        </div>
                    </div>
                    {profile?.status && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 capitalize self-start sm:self-auto">
                            {profile.status}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                <div className="premium-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--muted-foreground)] text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Credit</p>
                            <p className="text-base sm:text-xl md:text-2xl font-bold text-emerald-500 dark:text-emerald-400 truncate leading-tight">
                                {formatCurrency(sum.totalCredited)}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-500 flex-shrink-0">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                </div>

                <div className="premium-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--muted-foreground)] text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Debit</p>
                            <p className="text-base sm:text-xl md:text-2xl font-bold text-red-500 dark:text-red-400 truncate leading-tight">
                                {formatCurrency(sum.totalDebited)}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500 flex-shrink-0">
                            <TrendingDown size={22} />
                        </div>
                    </div>
                </div>

                <div className="premium-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--muted-foreground)] text-xs sm:text-sm font-medium mb-1 sm:mb-2">Net Balance</p>
                            <p className="text-base sm:text-xl md:text-2xl font-bold text-[var(--pw-primary)] truncate leading-tight">
                                {formatCurrency(sum.netBalance)}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] flex-shrink-0">
                            <Wallet size={22} />
                        </div>
                    </div>
                </div>

                <div className="premium-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--muted-foreground)] text-xs sm:text-sm font-medium mb-1 sm:mb-2">Available Balance</p>
                            <p className="text-base sm:text-xl md:text-2xl font-bold text-[var(--pw-primary)] truncate leading-tight">
                                {balanceNum !== null ? formatCurrency(balanceNum) : '—'}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] flex-shrink-0">
                            <BookOpen size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Ledger Table Card ── */}
            <div className="premium-card rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

                {/* Filter & Export Bar */}
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Transaction Ledger</h2>
                        {pagination?.total != null && (
                            <p className="text-sm text-[var(--muted-foreground)]">
                                {pagination.total} entries
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent outline-none"
                            title="From date"
                        />
                        <span className="text-[var(--muted-foreground)] text-sm">to</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent outline-none"
                            title="To date"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value as 'credit' | 'debit' | ''); setPage(1); }}
                            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent outline-none"
                        >
                            <option value="">All Entries</option>
                            <option value="credit">Credits Only</option>
                            <option value="debit">Debits Only</option>
                        </select>

                        <div className="flex gap-2 ml-auto">
                            <button
                                type="button"
                                disabled={!!exporting || !isAuthenticated}
                                onClick={() => handleExport('csv')}
                                className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Download size={14} />
                                {exporting === 'csv' ? '…' : 'CSV'}
                            </button>
                            <button
                                type="button"
                                disabled={!!exporting || !isAuthenticated}
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm bg-[var(--pw-primary)] text-gray-900 hover:bg-[var(--pw-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <FileText size={14} />
                                {exporting === 'pdf' ? '…' : 'PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Passbook Ledger Table */}
                <div className="relative overflow-x-auto">
                    {tableBusy && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-elevated)]/80 backdrop-blur-sm">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pw-primary)] border-t-transparent" />
                        </div>
                    )}
                    <table className="w-full min-w-[520px]">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-3 py-3 sm:px-4 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-3 py-3 sm:px-4 sm:py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                    Particulars
                                </th>
                                <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                    Withdrawal (Dr.)
                                </th>
                                <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                    Deposit (Cr.)
                                </th>
                                <th className="px-3 py-3 sm:px-4 sm:py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 sm:py-16 text-center text-[var(--muted-foreground)] text-sm">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, idx) => (
                                    <tr
                                        key={entry._id ?? `${entry.createdAt}-${idx}`}
                                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-[var(--muted-foreground)] whitespace-nowrap text-sm tabular-nums">
                                            {formatDate(entry.createdAt)}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-[var(--foreground)] text-sm">
                                            {entry.description}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-sm font-medium">
                                            {entry.type === 'debit' ? (
                                                <span className="text-red-600 dark:text-red-400">{formatCurrency(Math.abs(entry.amount))}</span>
                                            ) : (
                                                <span className="text-[var(--muted-foreground)]">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-sm font-medium">
                                            {entry.type === 'credit' ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(Math.abs(entry.amount))}</span>
                                            ) : (
                                                <span className="text-[var(--muted-foreground)]">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-sm font-bold text-[var(--foreground)]">
                                            {formatCurrency(entry.balanceAfter)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {entries.length > 0 && (
                    <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex justify-between items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1 || tableBusy}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-[var(--muted-foreground)]">
                            Page {currentPage} of {totalPages}
                            {pagination?.total != null ? ` · ${pagination.total} entries` : ''}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages || tableBusy}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
