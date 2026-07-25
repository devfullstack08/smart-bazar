'use client';

import { useState } from 'react';
import { Layers, CheckCircle2, Lock, Sparkles, ChevronDown, ChevronUp, Trophy, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

interface DashboardAutoPoolProgressProps {
  income?: {
    byType?: Array<{ type: string; totalAmount: number; count: number }>;
    totalEarned?: number;
  };
  incomeConfig?: Record<string, any> | null;
  loading?: boolean;
}

export default function DashboardAutoPoolProgress({ income, incomeConfig, loading }: DashboardAutoPoolProgressProps) {
  const [expanded, setExpanded] = useState(false);

  // Extract dynamic auto pool configuration
  const poolConfig = incomeConfig?.global_auto_pool ?? {};
  const levelIncomeArray: number[] = Array.isArray(poolConfig.levelIncome) && poolConfig.levelIncome.length > 0
    ? poolConfig.levelIncome
    : [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
  const matrixWidth = Math.max(2, Number(poolConfig.width ?? 2));
  const entryFee = Number(poolConfig.entryFee ?? 500);

  // Dynamically calculate level member capacity and payouts
  const autoPoolLevels = levelIncomeArray.map((payout: number, idx: number) => {
    const level = idx + 1;
    const members = Math.pow(matrixWidth, level);
    const incomePerMember = Number(payout) || 0;
    const totalIncome = members * incomePerMember;
    return {
      level,
      members,
      incomePerMember,
      totalIncome,
    };
  });

  const totalMatrixPotential = autoPoolLevels.reduce((sum, lvl) => sum + lvl.totalIncome, 0);

  // Extract global auto pool earnings
  const autoPoolData = income?.byType?.find(
    (item) => item.type === 'global_auto_pool' || item.type === 'global_autopool'
  );
  const totalEarned = autoPoolData?.totalAmount ?? 0;

  // Calculate level progress based on earnings
  let accumulatedIncome = 0;
  const levelStatuses = autoPoolLevels.map((lvl) => {
    const prevAccumulated = accumulatedIncome;
    accumulatedIncome += lvl.totalIncome;

    if (totalEarned >= accumulatedIncome) {
      return { status: 'completed', earnedInLevel: lvl.totalIncome, progressPercent: 100 };
    } else if (totalEarned > prevAccumulated) {
      const earnedInLevel = totalEarned - prevAccumulated;
      const progressPercent = Math.min(100, Math.round((earnedInLevel / lvl.totalIncome) * 100));
      return { status: 'in_progress', earnedInLevel, progressPercent };
    } else {
      return { status: 'locked', earnedInLevel: 0, progressPercent: 0 };
    }
  });

  const completedLevelsCount = levelStatuses.filter((s) => s.status === 'completed').length;
  const totalLevelsCount = autoPoolLevels.length;
  const currentActiveLevel = levelStatuses.findIndex((s) => s.status === 'in_progress') + 1 || (completedLevelsCount === totalLevelsCount ? totalLevelsCount : completedLevelsCount + 1);


  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 animate-pulse">
        <div className="h-6 w-48 bg-[var(--surface)] rounded mb-4" />
        <div className="h-20 bg-[var(--surface)] rounded-xl" />
      </div>
    );
  }

  const visibleLevels = expanded ? autoPoolLevels : autoPoolLevels.slice(0, 4);

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Card Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">
                Global Auto-Pool Matrix
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                {formatCurrency(entryFee)} Entry • 1×{matrixWidth} Matrix
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {totalLevelsCount}-Level Spillover Matrix • Dynamic level payout schedule
            </p>
          </div>
        </div>

        {/* Total Earned Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
              Auto-Pool Earnings
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {formatCurrency(totalEarned)}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-[var(--surface)]/50 border-b border-[var(--border)] text-xs">
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Current Stage
          </span>
          <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
            Level {currentActiveLevel} {completedLevelsCount === totalLevelsCount ? '(Completed)' : 'Active'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Levels Unlocked
          </span>
          <span className="text-sm font-black text-[var(--foreground)] mt-0.5 block">
            {completedLevelsCount} / {totalLevelsCount} Levels
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Entry Fee
          </span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block font-mono">
            {formatCurrency(entryFee)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Total Matrix Potential
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
            {formatCurrency(totalMatrixPotential)}
          </span>
        </div>
      </div>

      {/* Visual Roadmap Stepper */}
      <div className="px-4 sm:px-6 pt-5 pb-3 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] block mb-3">
          Matrix Progress Roadmap
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar snap-x min-w-0">
          {autoPoolLevels.map((lvl, index) => {
            const statusInfo = levelStatuses[index];
            const isCompleted = statusInfo.status === 'completed';
            const isInProgress = statusInfo.status === 'in_progress';
            return (
              <div key={lvl.level} className="flex items-center gap-1.5 shrink-0 snap-start">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : isInProgress
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 ring-2 ring-blue-500/20 animate-pulse'
                      : 'bg-[var(--surface)] text-[var(--muted-foreground)] border-[var(--border)] opacity-60'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : isInProgress ? <Zap size={12} /> : <Lock size={12} />}
                  <span>L{lvl.level}</span>
                </div>
                {index < autoPoolLevels.length - 1 && (
                  <span className={`w-3 h-0.5 rounded-full ${isCompleted ? 'bg-emerald-500/40' : 'bg-[var(--border)]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 10-Level Progress List */}
      <div className="p-4 sm:p-6 space-y-3">
        {visibleLevels.map((lvl, index) => {
          const statusInfo = levelStatuses[index];
          const isCompleted = statusInfo.status === 'completed';
          const isInProgress = statusInfo.status === 'in_progress';
          const isLocked = statusInfo.status === 'locked';

          return (
            <div
              key={lvl.level}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : isInProgress
                  ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
                  : 'border-[var(--border)] bg-[var(--surface)]/40 opacity-70'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isInProgress
                        ? 'bg-blue-500 text-white'
                        : 'bg-[var(--border)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    L{lvl.level}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                        Level {lvl.level} Matrix ({lvl.members} Members)
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          <Zap size={10} /> In Progress
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--muted-foreground)] bg-gray-500/10 px-2 py-0.5 rounded-full shrink-0">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)] block mt-0.5">
                      {lvl.members} members × {formatCurrency(lvl.incomePerMember)} = max {formatCurrency(lvl.totalIncome)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-[var(--foreground)]">
                    {formatCurrency(statusInfo.earnedInLevel)} / {formatCurrency(lvl.totalIncome)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isInProgress
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${statusInfo.progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Show More / Show Less Toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 border border-[var(--border)] rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1.5 mt-2"
        >
          {expanded ? (
            <>
              Show Less Levels <ChevronUp size={14} />
            </>
          ) : (
            <>
              View All 10 Auto-Pool Levels <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
