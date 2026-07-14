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
  active:      { label: 'Staked',      color: 'var(--primary)', bg: 'rgba(212,175,55,0.10)'  },
  cap_reached: { label: 'Cap Reached', color: '#c87a53',        bg: 'rgba(200,122,83,0.10)' },
  expired:     { label: 'Matured',     color: '#94a3b8',        bg: 'rgba(148,163,184,0.10)'},
};

export default function DashboardPackages({ activePackages, loading = false }: { activePackages: ActivePackage[]; loading?: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <div className="h-5 w-40 rounded shimmer-placeholder" />
        </div>
        <div className="px-6 py-5 space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-14 rounded-xl shimmer-placeholder" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20"
            style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
            <Package size={18} className="text-primary" strokeWidth={2} />
          </div>
          <h2 className="text-base font-black text-[var(--foreground)]" style={{ fontFamily: 'var(--font-sans)' }}>
            My Memberships
          </h2>
        </div>
        {activePackages.length > 0 && (
          <Link
            href="/packages"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary hover:bg-[var(--primary)]/20 shadow-sm"
          >
            Store <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* ── Package list ─────────────────────────────────────── */}
      {activePackages.length > 0 ? (
        <div className="p-4 sm:p-5 flex flex-col gap-2.5 bg-black/10">
          {activePackages.slice(0, 5).map((pkg, i) => {
            const s = STATUS_MAP[pkg.status ?? 'active'] ?? STATUS_MAP.active;
            return (
              <div key={i} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/15 hover:bg-white/[0.03] transition-all duration-200">

                {/* Left: icon + value + date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/5 animate-pulse"
                    style={{ backgroundColor: s.bg }}>
                    <Package size={14} style={{ color: s.color }} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--foreground)] tabular-nums">
                      {formatCurrency(pkg.totalValue)}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {pkg.purchaseDate ? formatDateTime(pkg.purchaseDate) : '—'}
                    </p>
                  </div>
                </div>

                {/* Status pill */}
                <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/5"
                  style={{ backgroundColor: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-10 flex flex-col items-center text-center space-y-4 bg-black/10">
          <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] bg-white/[0.02]">
            <ShoppingCart size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">No Active Memberships</h3>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5 max-w-[220px] leading-relaxed">
              Activate a package in the store to start earning binary referral rewards.
            </p>
          </div>
          <Link
            href="/packages"
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary hover:bg-[var(--primary)]/20 shadow-sm"
          >
            <ShoppingCart size={13} /> Buy Membership
          </Link>
        </div>
      )}
    </section>
  );
}