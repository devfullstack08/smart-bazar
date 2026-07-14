'use client';

import Link from 'next/link';
import { Package, ShoppingCart, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils/cn';

interface ActivePackage {
  totalValue: number;
  purchaseDate?: string;
  status?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Active',      color: '#f97316', bg: 'rgba(249,115,22,0.10)'  },
  cap_reached: { label: 'Cap Reached', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
  expired:     { label: 'Expired',     color: '#6B7280', bg: 'rgba(107,114,128,0.10)'},
};

export default function DashboardPackages({ activePackages, loading = false }: { activePackages: ActivePackage[]; loading?: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-5 w-36 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="px-5 py-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-12 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
            <Package size={17} style={{ color: '#f97316' }} strokeWidth={2.2} />
          </div>
          <h2 className="text-base font-bold text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            My Store Memberships
          </h2>
        </div>
        {activePackages.length > 0 && (
          <Link
            href="/packages"
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316' }}
          >
            View all <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* ── Package list ─────────────────────────────────────── */}
      {activePackages.length > 0 ? (
        <div className="divide-y divide-[var(--border)]">
          {activePackages.slice(0, 5).map((pkg, i) => {
            const s = STATUS_MAP[pkg.status ?? 'active'] ?? STATUS_MAP.active;
            return (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">

                {/* Left: icon + value + date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: s.bg }}>
                    <Package size={14} style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                      {formatCurrency(pkg.totalValue)}
                    </p>
                    <p className="text-[11px] opacity-40 text-[var(--foreground)] mt-0.5">
                      {pkg.purchaseDate ? formatDateTime(pkg.purchaseDate) : '—'}
                    </p>
                  </div>
                </div>

                {/* Status pill */}
                <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
            <ShoppingCart size={20} style={{ color: '#f97316' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">No Active Store Memberships</p>
            <p className="text-xs opacity-40 text-[var(--foreground)] mt-1">
              Activate a membership package to begin earning referral & matching bonuses.
            </p>
          </div>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#f97316', color: '#ffffff' }}
          >
            <ShoppingCart size={15} /> Go to Bazar Store
          </Link>
        </div>
      )}
    </section>
  );
}