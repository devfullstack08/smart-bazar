'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store/store';
import { passbookApi, type PassbookEntry, type PassbookSummary } from '@/lib/api/services';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { BookOpen, TrendingUp, TrendingDown, Wallet, Download, FileText, Receipt, ShieldCheck, X, Copy, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/constants/env';

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
    const [selectedInvoice, setSelectedInvoice] = useState<PassbookEntry | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const copyToClipboard = (text: string, isInvoice: boolean = false) => {
        navigator.clipboard.writeText(text);
        if (isInvoice) {
            setCopied(true);
            toast.success('Reference copied');
            setTimeout(() => setCopied(false), 2000);
        } else {
            setCopiedId(text);
            toast.success('Hash copied');
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const sum = summary ?? { totalCredited: 0, totalDebited: 0, netBalance: 0, entryCount: 0, lastActivity: null };
    const totalPages = Math.max(1, pagination?.pages ?? 1);
    const currentPage = pagination?.page ?? page;

    const getEntryIcon = (entry: PassbookEntry) => {
        const desc = entry.description.toLowerCase();
        if (desc.includes('package') || desc.includes('stake') || desc.includes('acquire')) {
            return <BookOpen size={14} className="text-primary" />;
        }
        if (desc.includes('referral') || desc.includes('direct') || desc.includes('commission')) {
            return <TrendingUp size={14} className="text-emerald-500" />;
        }
        if (desc.includes('withdraw') || desc.includes('payout')) {
            return <TrendingDown size={14} className="text-red-500" />;
        }
        return <Wallet size={14} className="text-blue-500" />;
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
                <div className="h-16 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
                <div className="h-64 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <BookOpen size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Account Passbook</h1>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">Audit transactions, commissions and outward settlements statement</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-semibold">
                                User: <span className="text-[var(--foreground)]">{displayName}</span> · <span className="font-mono text-primary">{profile?.userId ?? '—'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Total Credit</p>
                        <p className="text-base sm:text-lg font-black text-emerald-500 mt-2 font-mono tabular-nums leading-tight">{formatCurrency(sum.totalCredited)}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Total Debit</p>
                        <p className="text-base sm:text-lg font-black text-red-500 mt-2 font-mono tabular-nums leading-tight">{formatCurrency(sum.totalDebited)}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Net Balance</p>
                        <p className="text-base sm:text-lg font-black text-primary mt-2 font-mono tabular-nums leading-tight">{formatCurrency(sum.netBalance)}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Available Balance</p>
                        <p className="text-base sm:text-lg font-black text-primary mt-2 font-mono tabular-nums leading-tight">{balanceNum !== null ? formatCurrency(balanceNum) : '—'}</p>
                    </div>
                </div>
            </div>

            {/* Filter and Table Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                
                {/* Filters */}
                <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--surface)]/10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Transaction Ledger</h3>
                        {pagination?.total != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary uppercase tracking-wider">
                                {pagination.total} entries
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold focus:outline-none"
                            title="From date"
                        />
                        <span className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">to</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold focus:outline-none"
                            title="To date"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value as 'credit' | 'debit' | ''); setPage(1); }}
                            className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold focus:outline-none"
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
                                className="px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Download size={13} />
                                {exporting === 'csv' ? '…' : 'CSV'}
                            </button>
                            <button
                                type="button"
                                disabled={!!exporting || !isAuthenticated}
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs bg-primary text-black hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <FileText size={13} />
                                {exporting === 'pdf' ? '…' : 'PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table list */}
                <div className="relative overflow-x-auto">
                    {tableBusy && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-elevated)]/80 backdrop-blur-sm">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    )}
                    <table className="w-full min-w-[520px]">
                        <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Particulars</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Withdrawal (Dr.)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Deposit (Cr.)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)] text-xs font-semibold">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, idx) => (
                                    <tr
                                        key={entry._id ?? `${entry.createdAt}-${idx}`}
                                        onClick={() => setSelectedInvoice(entry)}
                                        className="hover:bg-[var(--surface)]/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-4 text-[var(--muted-foreground)] whitespace-nowrap text-xs font-mono tabular-nums">
                                            {formatDate(entry.createdAt)}
                                        </td>
                                        <td className="px-4 py-4 text-[var(--foreground)] text-xs sm:text-sm font-semibold">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] flex items-center justify-center shrink-0">
                                                    {getEntryIcon(entry)}
                                                </div>
                                                <span className="truncate group-hover:text-primary transition-colors">{entry.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            {entry.type === 'debit' ? (
                                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-mono tabular-nums">
                                                    -{formatCurrency(Math.abs(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--muted-foreground)]">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            {entry.type === 'credit' ? (
                                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono tabular-nums">
                                                    +{formatCurrency(Math.abs(entry.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--muted-foreground)]">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap font-black text-xs sm:text-sm text-[var(--foreground)] font-mono tabular-nums">
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
                    <div className="px-3 sm:px-6 py-4 border-t border-[var(--border)] flex justify-between items-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1 || tableBusy}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages || tableBusy}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted-foreground)] hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Print Voucher Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-[var(--surface-elevated)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col max-w-md w-full relative overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Glow shapes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Receipt size={18} />
                                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--foreground)]">Ledger Voucher</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors focus:outline-none"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="py-6 space-y-6">
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{APP_NAME} Statement</p>
                                <p className="text-xs text-[var(--muted-foreground)] font-semibold">Date: {formatDate(selectedInvoice.createdAt)}</p>
                            </div>

                            <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                            <div className="space-y-4 text-xs font-semibold">
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Description Particulars</p>
                                    <p className="text-xs font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] p-3 rounded-xl leading-relaxed">
                                        {selectedInvoice.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Voucher Type</p>
                                        <p className="text-xs font-bold text-[var(--foreground)] mt-1 capitalize">{selectedInvoice.type === 'credit' ? 'Inward Credit' : 'Outward Debit'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Status</p>
                                        <div className="mt-1">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                <ShieldCheck size={10} /> Cleared
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Transaction Reference ID</p>
                                    <div className="flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-xl mt-1.5 font-mono text-[10px] text-[var(--foreground)]">
                                        <span className="truncate">{selectedInvoice._id}</span>
                                        <button 
                                            onClick={() => copyToClipboard(selectedInvoice._id || '', true)}
                                            className="text-primary hover:text-primary/80 transition-colors focus:outline-none"
                                            title="Copy Hash Reference"
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-[var(--border)] w-full py-0.5" />

                            <div className="space-y-2 text-xs font-semibold">
                                <div className="flex justify-between text-[var(--muted-foreground)]">
                                    <span>Transaction Value:</span>
                                    <span className={`font-bold font-mono tabular-nums text-sm ${selectedInvoice.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {selectedInvoice.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(selectedInvoice.amount))}
                                    </span>
                                </div>
                                <div className="flex justify-between font-black text-[var(--foreground)] text-sm pt-2 border-t border-[var(--border)]">
                                    <span>Ledger Balance After:</span>
                                    <span className="text-primary font-mono tabular-nums">{formatCurrency(selectedInvoice.balanceAfter)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] font-bold text-xs text-[var(--foreground)] transition-colors focus:outline-none"
                            >
                                Close Voucher
                            </button>
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-black hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm"
                            >
                                <FileText size={13} />
                                Print Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
