'use client';

import { Zap, CheckCircle2, ShieldAlert, Award, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

interface DashboardMatchingPairsTrackerProps {
  income?: {
    byType?: Array<{ type: string; totalAmount: number; count: number }>;
  };
  incomeConfig?: Record<string, any> | null;
  teamStats?: any;
  loading?: boolean;
}

export default function DashboardMatchingPairsTracker({ income, incomeConfig, teamStats, loading }: DashboardMatchingPairsTrackerProps) {
  // Extract dynamic binary matching income configuration
  const matchingConfig = incomeConfig?.binary_matching_income ?? {};
  
  const MAX_DAILY_PAIRS = Math.max(1, Number(matchingConfig.maxDailyPairs ?? 40));
  const RATE_PERCENTAGE = Math.round(Number(matchingConfig.rate ?? 0.25) * 100);
  const PACKAGE_AMOUNT = Number(matchingConfig.packageAmount ?? 1000);
  const PAIR_PAYOUT_AMOUNT = Math.round(PACKAGE_AMOUNT * (Number(matchingConfig.rate ?? 0.25)));
  const MIN_DIRECTS = Number(matchingConfig.minActiveDirects ?? 2);

  const matchingRules = Array.isArray(matchingConfig.matchingRules) && matchingConfig.matchingRules.length > 0
    ? matchingConfig.matchingRules
    : [{ left: 2, right: 1 }, { left: 1, right: 2 }];
  const initialRatioText = matchingRules.map((r: any) => `${r.left}:${r.right}`).join(' / ');

  // Extract binary matching income details
  const matchingData = income?.byType?.find(
    (item) => item.type === 'binary_matching_income' || item.type === 'binary_matching'
  );

  const totalMatchingEarned = matchingData?.totalAmount ?? 0;
  const totalPairsCount = matchingData?.count ?? 0;

  // Compute daily pairs matched
  const todayPairsMatched = Math.min(MAX_DAILY_PAIRS, totalPairsCount);
  const dailyCapPercentage = Math.min(100, Math.round((todayPairsMatched / MAX_DAILY_PAIRS) * 100));
  const remainingDailyPairs = MAX_DAILY_PAIRS - todayPairsMatched;

  // Direct referrals qualification check
  const directCount = teamStats?.stats?.directReferrals ?? 0;
  const isQualified = directCount >= MIN_DIRECTS;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 animate-pulse">
        <div className="h-6 w-48 bg-[var(--surface)] rounded mb-4" />
        <div className="h-20 bg-[var(--surface)] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--foreground)] tracking-tight leading-snug">
                Binary Pair Matching
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                First: {initialRatioText || '2:1 / 1:2'} ➔ Subsequent: 1:1
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wide whitespace-nowrap shrink-0">
            {RATE_PERCENTAGE}% Rate
          </span>
        </div>

        {/* Total Earned & Daily Cap Summary Bar */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]/60 text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
              Matching Income Total
            </span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums">
              {formatCurrency(totalMatchingEarned)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
              Daily Capping
            </span>
            <span className="text-xs font-bold text-[var(--foreground)] font-mono">
              Max {MAX_DAILY_PAIRS} Pairs / Day
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 space-y-4">
        {/* Daily Cap Progress */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp size={15} className="text-purple-500 shrink-0" />
              <span className="text-xs font-bold text-[var(--foreground)] truncate">
                Today's Daily Pairs
              </span>
            </div>
            <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400 shrink-0">
              {todayPairsMatched} / {MAX_DAILY_PAIRS} ({dailyCapPercentage}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[var(--border)] h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${dailyCapPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
            <span>Cap Max: {formatCurrency(MAX_DAILY_PAIRS * PAIR_PAYOUT_AMOUNT)} / day</span>
            <span>{remainingDailyPairs} pairs left today</span>
          </div>
        </div>

        {/* Rules & Qualification Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Qualification Status */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Direct Qualification
            </span>
            {isQualified ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 size={13} /> Qualified ({MIN_DIRECTS}+ Directs)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <ShieldAlert size={13} /> Needs {MIN_DIRECTS} Active Directs
              </div>
            )}
          </div>

          {/* Payout per pair */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Payout Per {formatCurrency(PACKAGE_AMOUNT)} Pair
            </span>
            <span className="font-black text-purple-600 dark:text-purple-400 font-mono text-xs">
              {formatCurrency(PAIR_PAYOUT_AMOUNT)} ({RATE_PERCENTAGE}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
