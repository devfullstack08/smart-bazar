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
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 space-y-4 animate-pulse">
        <div className="h-6 w-40 bg-[var(--surface)] rounded-md" />
        <div className="h-28 w-full bg-[var(--surface)] rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-[var(--surface)] rounded-xl" />
          <div className="h-20 bg-[var(--surface)] rounded-xl" />
        </div>
      </section>
    );
  }

  // Calculate total across categories for proportion mapping
  const totalVal = income.byType.reduce((acc, curr) => acc + (curr.totalAmount ?? 0), 0);
  const totalEarned = income.totalEarned ?? totalVal;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-500/5 via-[var(--surface-elevated)] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">
              Income & Revenue Overview
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Real-time commission channels status</p>
          </div>
        </div>
        <Link
          href="/income"
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)] hover:text-blue-600 dark:hover:text-blue-400 shadow-sm"
        >
          Statement <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="p-6 space-y-6">
        {/* Total Earnings Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-[var(--surface)] to-[var(--surface)] p-5 sm:p-6 shadow-inner">
          <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                Cumulative Network Earnings
              </p>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 font-mono mt-1 tabular-nums">
                {formatCurrency(totalEarned)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Sub-payout status breakdown */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-[var(--border)]/60 text-xs z-10 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <Clock size={14} />
              </div>
              <div>
                <p className="text-[9px] text-[var(--muted-foreground)] font-extrabold uppercase tracking-wider">Pending Audit</p>
                <p className="font-black text-[var(--foreground)] text-sm font-mono mt-0.5 tabular-nums">
                  {formatCurrency(income.totalPending ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle size={14} />
              </div>
              <div>
                <p className="text-[9px] text-[var(--muted-foreground)] font-extrabold uppercase tracking-wider">Approved & Paid</p>
                <p className="font-black text-[var(--foreground)] text-sm font-mono mt-0.5 tabular-nums">
                  {formatCurrency(income.totalApproved ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today vs Yesterday Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-emerald-500/30">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">
              Today's Earnings
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono tabular-nums">
              +{formatCurrency(income.todayIncome ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-blue-500/30">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">
              Yesterday's Earnings
            </p>
            <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-2 font-mono tabular-nums">
              {formatCurrency(income.yesterdayIncome ?? 0)}
            </p>
          </div>
        </div>

        {/* Earnings Composition Bar */}
        {totalVal > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Earnings Channels Composition</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{income.byType.length} Active Channels</span>
            </div>
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-[var(--surface)] border border-[var(--border)] p-0.5">
              {income.byType.map((item, idx) => {
                const pct = totalVal > 0 ? ((item.totalAmount ?? 0) / totalVal) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={item.type}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: GOLD_DOT_COLORS[idx % GOLD_DOT_COLORS.length],
                    }}
                    className="h-full rounded-full transition-all duration-300"
                    title={`${getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Channel Breakdown Cards */}
        {income.byType.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] bg-[var(--surface-elevated)]">
              <Award size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">No Commissions Earned Yet</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-[260px] leading-relaxed">
                Direct referrals and binary pair payouts will appear here in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">
              Channel Wise Revenue Breakdown
            </p>
            <div className="space-y-2.5">
              {income.byType.map((item, i) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{
                        backgroundColor: GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length],
                        boxShadow: `0 0 10px ${GOLD_DOT_COLORS[i % GOLD_DOT_COLORS.length]}50`,
                      }}
                    />
                    <span className="text-[var(--foreground)] font-bold text-xs sm:text-sm">
                      {getIncomeTypeLabel(item.type, cappingData?.incomeRegistry)}
                    </span>
                  </div>
                  <span
                    className="font-black font-mono tabular-nums text-xs sm:text-sm"
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
  '#d4af37', // Champagne Gold (Direct Referral)
  '#3b82f6', // Vibrant Blue (Binary Placement)
  '#10b981', // Emerald Green (Binary Matching)
  '#8b5cf6', // Violet (Global Auto-Pool)
  '#f97316', // Coral Orange (Royalty/Other)
  '#06b6d4', // Cyan (Others)
];