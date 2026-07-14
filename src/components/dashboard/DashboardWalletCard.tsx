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
        <div className="px-6 py-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shimmer-placeholder" />
              <div className="space-y-2">
                <div className="h-3.5 w-36 rounded shimmer-placeholder" />
                <div className="h-6 w-48 rounded shimmer-placeholder" />
              </div>
            </div>
            <div className="h-8 w-20 rounded-lg shimmer-placeholder" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[var(--surface-elevated)] px-6 py-4.5 space-y-2">
              <div className="h-3 w-20 rounded shimmer-placeholder" />
              <div className="h-5 w-24 rounded shimmer-placeholder" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const available = wallet.availableBalance ?? wallet.balance ?? 0;
  const locked = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

  const stats = [
    { label: 'Total Earned',  value: formatCurrency(wallet.totalEarned),            icon: TrendingUp,       color: '#d4af37' },
    { label: 'Deposited',     value: formatCurrency(wallet.totalDeposited ?? 0),     icon: ArrowDownToLine,  color: '#c87a53' },
    { label: 'Withdrawn',     value: formatCurrency(wallet.totalWithdrawn),          icon: ArrowUpToLine,    color: '#e2e8f0' },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Available balance — hero row ─────────────────────── */}
      <div className="px-6 py-6 border-b border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 60%)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20"
              style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
              <Wallet size={18} className="text-primary" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">
                Available Balance
              </p>
              <p className="text-2xl sm:text-3xl font-black text-primary tabular-nums mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {formatCurrency(available)}
              </p>
            </div>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary hover:bg-[var(--primary)]/20 shadow-sm"
          >
            Details <ArrowRight size={12} />
          </Link>
        </div>
        {locked > 0 && (
          <p className="mt-2 text-[11px] font-medium text-amber-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Locked: {formatCurrency(locked)} (pending withdrawal authorization)
          </p>
        )}
      </div>

      {/* ── Stat row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5 bg-black/15">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col gap-1 hover:border-[var(--primary)]/20 hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color }} strokeWidth={2.5} className="shrink-0" />
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold truncate">
                {label}
              </p>
            </div>
            <p className="text-sm sm:text-base md:text-lg font-black tabular-nums text-[var(--foreground)] mt-1.5 truncate">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
