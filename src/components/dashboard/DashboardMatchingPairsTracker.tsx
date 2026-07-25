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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">
                Binary Matching & Daily Cap
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                {RATE_PERCENTAGE}% Rate • Max {MAX_DAILY_PAIRS} Pairs/Day
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              First Pair: {initialRatioText || '2:1 / 1:2'} ➔ Subsequent Pairs: 1:1 Ratio
            </p>
          </div>
        </div>

        {/* Total Earned Badge */}
        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Matching Income Total
          </span>
          <span className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums">
            {formatCurrency(totalMatchingEarned)}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Daily Cap Progress */}
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              <span className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                Daily Pair Cap Limit ({MAX_DAILY_PAIRS} Pairs Max / Day)
              </span>
            </div>
            <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">
              {todayPairsMatched} / {MAX_DAILY_PAIRS} Pairs ({dailyCapPercentage}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[var(--border)] h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${dailyCapPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>Daily Cap Max: {formatCurrency(MAX_DAILY_PAIRS * PAIR_PAYOUT_AMOUNT)} / day</span>
            <span>Remaining Allowance: {remainingDailyPairs} pairs today</span>
          </div>
        </div>

        {/* Rules & Qualification Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Qualification Status */}
          <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Direct Qualification
            </span>
            {isQualified ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={14} /> Qualified ({MIN_DIRECTS}+ Directs)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <ShieldAlert size={14} /> Needs {MIN_DIRECTS} Active Directs
              </div>
            )}
          </div>

          {/* Ratio Rule */}
          <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Matching Ratio
            </span>
            <span className="font-bold text-[var(--foreground)]">
              1st: {initialRatioText || '2:1/1:2'} ➔ Next: 1:1
            </span>
          </div>

          {/* Payout per pair */}
          <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Payout Per {formatCurrency(PACKAGE_AMOUNT)} Pair
            </span>
            <span className="font-black text-purple-600 dark:text-purple-400 font-mono">
              {formatCurrency(PAIR_PAYOUT_AMOUNT)} ({RATE_PERCENTAGE}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
