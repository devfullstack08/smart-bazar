'use client';

import Link from 'next/link';
import { TrendingUp, ArrowUpRight, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import { getIncomeTypeLabel } from '@/lib/utils/incomeLabel';
import type { CappingTrackingData } from '@/types';

export interface DashboardIncomeOverviewProps {
  income: {
    todayIncome?: number;
    yesterdayIncome?: number;
    totalEarned?: number;
    byType: Array<{ type: string; totalAmount?: number }>;
  };
  cappingData?: CappingTrackingData | null;
  loading?: boolean;
}

export default function DashboardIncomeOverview({ income, cappingData, loading = false }: DashboardIncomeOverviewProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shimmer-placeholder" />
              <div className="h-5 w-40 rounded shimmer-placeholder" />
            </div>
            <div className="h-8 w-20 rounded-lg shimmer-placeholder" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[var(--surface-elevated)] px-6 py-5 space-y-2">
              <div className="h-3 w-16 rounded shimmer-placeholder" />
              <div className="h-6 w-24 rounded shimmer-placeholder" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Calculate total across categories for proportion mapping
  const totalVal = income.byType.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20"
            style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
            <TrendingUp size={18} className="text-primary" strokeWidth={2} />
          </div>
          <h2 className="text-base font-black text-[var(--foreground)]" style={{ fontFamily: 'var(--font-sans)' }}>
            Income Overview
          </h2>
        </div>
        <Link
          href="/income"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary hover:bg-[var(--primary)]/25 shadow-sm"
        >
          View Statement <ArrowUpRight size={12} />
        </Link>
      </div>



      {/* ── SVG Proportional Mix bar ─────────────────────────── */}
      {totalVal > 0 && (
        <div className="px-6 py-4 border-b border-[var(--border)] bg-black/5 dark:bg-black/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Earnings Composition</p>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-black/15 dark:bg-black/35">
            {income.byType.map((item, idx) => {
              const pct = totalVal > 0 ? ((item.totalAmount ?? 0) / totalVal) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={item.type}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: GOLD_DOT_COLORS[idx % GOLD_DOT_COLORS.length]
                  }}
                  className="h-full transition-all duration-300"
                  title={`${getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Income by type table ───────────────────────────── */}
      {income.byType.length === 0 ? (
        <div className="px-6 py-12 flex flex-col items-center justify-center text-center space-y-3 bg-black/5 dark:bg-black/15">
          <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]">
            <Award size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)]">No Income Logged Yet</h4>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1 max-w-[240px] leading-relaxed">
              Commissions and binary matching payouts appear here in real-time as your network active nodes scale up.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-black/5 dark:bg-black/10">
                <th className="px-6 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Commission Channel
                </th>
                <th className="px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Total Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {income.byType.map((item, i) => (
                <tr
                  key={item.type}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/10"
                        style={{ backgroundColor: GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length] }}
                      />
                      <span className="text-[var(--foreground)] font-bold text-sm">
                        {getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-right font-black tabular-nums text-sm text-primary">
                    {formatCurrency(item.totalAmount ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const GOLD_DOT_COLORS = [
  'var(--primary)',
  '#c87a53',
  '#e2e8f0',
  '#a37d4c',
  '#a0522d',
  '#708090'
];