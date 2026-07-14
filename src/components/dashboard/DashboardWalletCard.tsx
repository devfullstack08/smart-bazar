'use client';

import Link from 'next/link';
import { Wallet, ArrowDownToLine, ArrowUpToLine, TrendingUp, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

interface WalletData {
  availableBalance?: number;
  balance?: number;
  totalEarned: number;
  totalDeposited?: number;
  totalWithdrawn: number;
}

export default function DashboardWalletCard({ wallet, loading = false }: { wallet: WalletData; loading?: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
          <div className="h-8 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[var(--surface-elevated)] px-4 py-3.5">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
              <div className="h-5 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const available = wallet.availableBalance ?? wallet.balance ?? 0;
  const locked = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

  const stats = [
    { label: 'Total Earned',  value: formatCurrency(wallet.totalEarned),            icon: TrendingUp,       color: '#f97316' },
    { label: 'Deposited',     value: formatCurrency(wallet.totalDeposited ?? 0),     icon: ArrowDownToLine,  color: '#3b82f6' },
    { label: 'Withdrawn',     value: formatCurrency(wallet.totalWithdrawn),          icon: ArrowUpToLine,    color: '#FB7185' },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Available balance — hero row ─────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, transparent 60%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
              <Wallet size={17} style={{ color: '#f97316' }} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)] font-semibold">
                Store Wallet / Cash Balance
              </p>
              <p className="text-2xl font-bold tabular-nums mt-0.5"
                style={{ color: '#f97316' }}>
                {formatCurrency(available)}
              </p>
            </div>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316' }}
          >
            Details <ArrowRight size={12} />
          </Link>
        </div>
        {locked > 0 && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Locked: {formatCurrency(locked)} (pending withdrawal request)
          </p>
        )}
      </div>

      {/* ── Stat row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface-elevated)] px-4 py-3.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color }} strokeWidth={2.5} />
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] font-semibold">
                {label}
              </p>
            </div>
            <p className="text-base font-bold tabular-nums text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
