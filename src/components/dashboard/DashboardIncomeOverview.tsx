'use client';

import Link from 'next/link';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
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
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[var(--surface-elevated)] px-4 py-4">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
              <div className="h-7 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,229,160,0.12)' }}
          >
            <TrendingUp size={17} style={{ color: 'var(--pw-primary)' }} strokeWidth={2.2} />
          </div>
          <h2
            className="text-base font-bold text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Income Overview
          </h2>
        </div>
        <Link
          href="/income"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'rgba(0,229,160,0.1)', color: 'var(--pw-primary)' }}
        >
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* ── Top 3 stat cards ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-px bg-[var(--border)]">

        {/* Today */}
        <div className="bg-[var(--surface-elevated)] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-50 text-[var(--foreground)] mb-1.5">
            Today
          </p>
          <p
            className="text-xl sm:text-2xl font-bold tabular-nums"
            style={{ color: 'var(--pw-primary)' }}
          >
            {formatCurrency(income.todayIncome ?? 0)}
          </p>
        </div>

        {/* Yesterday */}
        <div className="bg-[var(--surface-elevated)] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-50 text-[var(--foreground)] mb-1.5">
            Yesterday
          </p>
          <p className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCurrency(income.yesterdayIncome ?? 0)}
          </p>
        </div>

        {/* Total */}
        <div className="bg-[var(--surface-elevated)] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-50 text-[var(--foreground)] mb-1.5">
            Total Earned
          </p>
          <p className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {formatCurrency(income.totalEarned ?? 0)}
          </p>
        </div>
      </div>

      {/* ── Income by type table ───────────────────────────── */}
      {income.byType.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm opacity-40 text-[var(--foreground)]">No income recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide opacity-40 text-[var(--foreground)]">
                  Type
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide opacity-40 text-[var(--foreground)]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {income.byType.map((item, i) => (
                <tr
                  key={item.type}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {/* Color dot */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                      />
                      <span className="text-[var(--foreground)] font-medium text-sm">
                        {getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold tabular-nums text-sm"
                    style={{ color: 'var(--pw-primary)' }}>
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

const DOT_COLORS = [
  'var(--pw-primary)', '#00C2E0', '#A78BFA', '#FBBF24', '#FB7185', '#34D399',
];