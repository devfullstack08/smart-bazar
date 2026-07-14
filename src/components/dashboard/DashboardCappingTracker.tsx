'use client';

import Link from 'next/link';
import { Target, ShoppingCart, Share2, AlertTriangle, CheckCircle2, Circle, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import type { CappingTrackingData } from '@/types';

export default function DashboardCappingTracker({ cappingData, loading = false }: { cappingData?: CappingTrackingData | null; loading?: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-5 w-36 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="p-5 space-y-4">
          <div className="h-20 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-16 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!cappingData) return null;

  const pct = cappingData.currentCapping > 0
    ? Math.min(100, ((cappingData.totalEarned ?? 0) / cappingData.currentCapping) * 100)
    : 0;

  // Fix: use isCappingReached from API (avoids floating point near-zero like 9.22e-12)
  const isCapped = cappingData.isCappingReached || cappingData.remainingCapping <= 0.001;
  const isNearLimit = !isCapped && cappingData.remainingCapping <= cappingData.currentCapping * 0.2 && cappingData.remainingCapping > 0;

  const activeColor = isCapped ? '#f43f5e' : isNearLimit ? '#fbbf24' : 'var(--pw-primary)';

  const levels = cappingData.levelAchievements ?? [];
  const nextLevel = cappingData.nextLevel;
  const multiplier = cappingData.multiplier;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10">
          <Target size={18} className="text-primary" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Capping Tracker
          </h2>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            Your earning limit & progress
          </p>
        </div>
      </div>

      {/* No active package state */}
      {!cappingData.hasActivePackage ? (
        <div className="px-5 py-12 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">No Active Package</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-[220px] leading-relaxed">
              {cappingData.message || 'Purchase an e-commerce package to activate your capping limit and start receiving commissions.'}
            </p>
          </div>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary px-5 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShoppingCart size={15} /> Browse Packages
          </Link>
        </div>

      ) : (
        <div className="p-5 space-y-5">

          {/* Circular progress ring + stats grid */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {/* Circular progress */}
            <div className="relative shrink-0 w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="var(--border)" strokeWidth="6" className="opacity-40" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={activeColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-[var(--foreground)] leading-none tabular-nums">
                  {Math.round(pct)}%
                </span>
                <span className="text-[9px] text-[var(--muted-foreground)] mt-0.5 uppercase tracking-wider font-bold">used</span>
              </div>
            </div>

            {/* Stats: Limit, Earned, Remaining */}
            <div className="w-full sm:flex-1 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-sm">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">Limit</p>
                <p className="text-sm font-extrabold tabular-nums text-[var(--foreground)] mt-0.5">
                  {formatCurrency(cappingData.currentCapping)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-sm">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">Earned</p>
                <p className="text-sm font-extrabold tabular-nums text-primary mt-0.5">
                  {formatCurrency(cappingData.totalEarned ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 col-span-2 shadow-sm">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">Remaining</p>
                <p className="text-sm font-extrabold tabular-nums mt-0.5"
                  style={{ color: isCapped ? '#f43f5e' : isNearLimit ? '#fbbf24' : 'var(--foreground)' }}>
                  {isCapped ? 'Limit reached' : formatCurrency(Math.max(0, cappingData.remainingCapping))}
                </p>
              </div>
            </div>
          </div>

          {/* Linear progress bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]/30">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: activeColor }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-primary">
                {formatCurrency(cappingData.totalEarned ?? 0)} earned
              </span>
              <span className="text-[var(--muted-foreground)] font-medium">{Math.round(pct)}% of limit</span>
            </div>
          </div>

          {/* Referral Capping Booster & Multiplier Area */}
          {((cappingData.referralCappingTotal ?? 0) > 0 || multiplier) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Booster */}
              {(cappingData.referralCappingTotal ?? 0) > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-[var(--foreground)] opacity-70">Referral Booster</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-primary">
                    +{formatCurrency(cappingData.referralCappingTotal ?? 0)}
                  </span>
                </div>
              )}

              {/* Multiplier info */}
              {multiplier && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-[var(--foreground)] opacity-70">Multiplier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary">
                      {multiplier.total}×
                    </span>
                    <span className="text-[9px] text-[var(--muted-foreground)]">
                      ({multiplier.achievedLevels}/{levels.length} levels)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level achievements */}
          {levels.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[10px] uppercase tracking-widest font-black text-[var(--muted-foreground)]">
                Level Achievements
              </p>
              <div className="space-y-3">
                {levels.map((lvl) => {
                  const lvlPct = lvl.membersRequired > 0
                    ? Math.min(100, (lvl.currentMembers / lvl.membersRequired) * 100)
                    : 0;
                  return (
                    <div key={lvl.level} className="flex items-center gap-3">
                      <div className="shrink-0">
                        {lvl.achieved ? (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/20 border border-primary/40 text-primary">
                            <CheckCircle2 size={12} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted-foreground)] opacity-40">
                            <Circle size={10} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-bold ${lvl.achieved ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                            Level {lvl.level}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums font-semibold">
                            {lvl.currentMembers}/{lvl.membersRequired} nodes
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--surface-elevated)] overflow-hidden border border-[var(--border)]/20">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${lvlPct}%`,
                              backgroundColor: lvl.achieved ? 'var(--pw-primary)' : 'rgba(212,175,55,0.3)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next level nudge */}
          {nextLevel && !isCapped && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between border border-primary/20 bg-primary/5">
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]">
                  Level {nextLevel.level} Unlock Progress
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  Need {nextLevel.remaining} more {nextLevel.remaining === 1 ? 'member' : 'members'} to boost your multiplier.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {nextLevel.currentMembers}/{nextLevel.membersRequired}
              </span>
            </div>
          )}

          {/* Near-limit warning banner */}
          {isNearLimit && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 leading-relaxed">
                You are close to your earning limit capping! Refer more direct members to unlock the next level and increase your multiplier cap.
              </p>
            </div>
          )}

          {/* Capped banner */}
          {isCapped && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-rose-500/20 bg-rose-500/5 animate-pulse">
              <ShieldCheck size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 leading-relaxed">
                Capping limit fully reached. Upgrade your package bundle or scale up direct placements to increase your capping thresholds immediately.
              </p>
            </div>
          )}

          {/* CTA Link */}
          <Link
            href="/team"
            className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity pt-1"
          >
            <Share2 size={13} /> Refer more to increase limit →
          </Link>
        </div>
      )}
    </section>
  );
}
