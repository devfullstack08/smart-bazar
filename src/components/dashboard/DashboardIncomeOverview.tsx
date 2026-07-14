'use client';

import Link from 'next/link';
import { TrendingUp, ArrowUpRight, Award, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import { getIncomeTypeLabel } from '@/lib/utils/incomeLabel';
import type { CappingTrackingData } from '@/types';

export interface DashboardIncomeOverviewProps {
  income: {
    todayIncome?: number;
    yesterdayIncome?: number;
    totalEarned?: number;
    totalPending?: number;
    totalApproved?: number;
    totalPaid?: number;
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
        <div className="p-6 space-y-4">
          <div className="h-24 w-full rounded-2xl shimmer-placeholder" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 rounded-xl shimmer-placeholder" />
            <div className="h-20 rounded-xl shimmer-placeholder" />
          </div>
        </div>
      </section>
    );
  }

  // Calculate total across categories for proportion mapping
  const totalVal = income.byType.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);
  const totalEarned = income.totalEarned ?? totalVal;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10">
            <TrendingUp size={18} className="text-primary" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
              Income Overview
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Real-time commission channels status</p>
          </div>
        </div>
        <Link
          href="/income"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface)]/80 hover:text-primary shadow-sm"
        >
          View Statement <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Hero Earnings Card ────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-[var(--surface)] p-5">
          {/* Decorative subtle background circle */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-500/5 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Total Earnings</p>
              <h3 className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mt-1.5 tabular-nums">
                {formatCurrency(totalEarned)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign size={20} />
            </div>
          </div>
          
          {/* Sub-payout metrics */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)] text-xs">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Pending</p>
                <p className="font-semibold text-[var(--foreground)] mt-0.5">{formatCurrency(income.totalPending ?? 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Approved</p>
                <p className="font-semibold text-[var(--foreground)] mt-0.5">{formatCurrency(income.totalApproved ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Today / Yesterday grid ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Today's Commission</p>
            <p className="text-lg font-black text-[var(--foreground)] mt-1.5 tabular-nums">
              {formatCurrency(income.todayIncome ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Yesterday</p>
            <p className="text-lg font-black text-[var(--foreground)] mt-1.5 tabular-nums">
              {formatCurrency(income.yesterdayIncome ?? 0)}
            </p>
          </div>
        </div>

        {/* ── SVG Proportional Mix bar ─────────────────────────── */}
        {totalVal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Earnings Composition</span>
              <span className="text-primary">{income.byType.length} channels</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-black/15 dark:bg-black/35 border border-[var(--border)]/20">
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

        {/* ── Channels List ───────────────────────────────────── */}
        {income.byType.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] bg-[var(--surface-elevated)]">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">No Income Logged Yet</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1 max-w-[240px] leading-relaxed">
                Commissions and payouts appear here in real-time as your network nodes active matching scales.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Channel Breakdown</p>
            <div className="space-y-2">
              {income.byType.map((item, i) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                      style={{ 
                        backgroundColor: GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length],
                        boxShadow: `0 0 10px ${GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length]}40`
                      }}
                    />
                    <span className="text-[var(--foreground)] font-bold text-sm">
                      {getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}
                    </span>
                  </div>
                  <span 
                    className="font-black tabular-nums text-sm"
                    style={{ color: GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length] }}
                  >
                    {formatCurrency(item.totalAmount ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const GOLD_DOT_COLORS = [
  'var(--primary)', // Gold (Direct Referral)
  '#3b82f6',        // Vibrant Blue (Binary Placement)
  '#10b981',        // Emerald Green (Binary Matching)
  '#8b5cf6',        // Violet (Global Auto-Pool)
  '#f97316',        // Coral Orange (Royalty/Other)
  '#06b6d4'         // Cyan (Others)
];