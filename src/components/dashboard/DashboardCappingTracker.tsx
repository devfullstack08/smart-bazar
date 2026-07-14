'use client';

import Link from 'next/link';
import { Target, ShoppingCart, Share2, AlertTriangle, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
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

  const activeColor = isCapped ? '#FB7185' : isNearLimit ? '#FBBF24' : 'var(--pw-primary)';

  const levels = cappingData.levelAchievements ?? [];
  const nextLevel = cappingData.nextLevel;
  const multiplier = cappingData.multiplier;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,229,160,0.12)' }}>
          <Target size={17} style={{ color: 'var(--pw-primary)' }} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Capping Tracker
          </h2>
          <p className="text-[11px] opacity-40 text-[var(--foreground)] mt-0.5">
            Your earning limit & progress
          </p>
        </div>
      </div>

      {/* No active package state */}
      {!cappingData.hasActivePackage ? (
        <div className="px-5 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,229,160,0.1)' }}>
            <ShoppingCart size={20} style={{ color: 'var(--pw-primary)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">No active package</p>
            <p className="text-xs opacity-50 text-[var(--foreground)] mt-1 max-w-[200px]">
              {cappingData.message || 'Purchase a package to start earning.'}
            </p>
          </div>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--pw-primary)', color: '#050508' }}
          >
            <ShoppingCart size={15} /> Browse Packages
          </Link>
        </div>

      ) : (
        <div className="p-5 space-y-5">

          {/* Circular progress ring + stats grid */}
          <div className="flex items-center gap-5">
            {/* Circular progress */}
            <div className="relative shrink-0 w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke="var(--border)" strokeWidth="7" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={activeColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-[var(--foreground)] leading-none">
                  {Math.round(pct)}%
                </span>
                <span className="text-[9px] opacity-40 text-[var(--foreground)] mt-0.5 uppercase tracking-wide">used</span>
              </div>
            </div>

            {/* Stats: Limit, Earned, Remaining */}
            <div className="flex-1 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)]">Limit</p>
                <p className="text-base font-bold tabular-nums text-[var(--foreground)] mt-0.5">
                  {formatCurrency(cappingData.currentCapping)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)]">Earned</p>
                <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: 'var(--pw-primary)' }}>
                  {formatCurrency(cappingData.totalEarned ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 col-span-2">
                <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)]">Remaining</p>
                <p className="text-base font-bold tabular-nums mt-0.5"
                  style={{ color: isCapped ? '#FB7185' : isNearLimit ? '#FBBF24' : 'var(--foreground)' }}>
                  {isCapped ? 'Limit reached' : formatCurrency(Math.max(0, cappingData.remainingCapping))}
                </p>
              </div>
            </div>
          </div>

          {/* Linear progress bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1.5 opacity-50 text-[var(--foreground)]">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(cappingData.currentCapping)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: activeColor }}
              />
            </div>
            <div className="flex justify-between text-[11px] mt-1.5">
              <span className="font-semibold" style={{ color: 'var(--pw-primary)' }}>
                {formatCurrency(cappingData.totalEarned ?? 0)} earned
              </span>
              <span className="opacity-40 text-[var(--foreground)]">{Math.round(pct)}% of limit</span>
            </div>
          </div>

          {/* Referral Capping Booster */}
          {(cappingData.referralCappingTotal ?? 0) > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🚀</span>
                <span className="text-xs text-[var(--foreground)] opacity-60">Referral Bonus</span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--pw-primary)' }}>
                +{formatCurrency(cappingData.referralCappingTotal ?? 0)}
              </span>
            </div>
          )}

          {/* Multiplier info */}
          {multiplier && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: 'var(--pw-primary)' }} />
                <span className="text-xs text-[var(--foreground)] opacity-60">Cap Multiplier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--pw-primary)' }}>
                  {multiplier.total}×
                </span>
                <span className="text-[10px] opacity-40 text-[var(--foreground)]">
                  ({multiplier.achievedLevels}/{levels.length} levels)
                </span>
              </div>
            </div>
          )}

          {/* Level achievements */}
          {levels.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] font-semibold">
                Level Achievements
              </p>
              <div className="space-y-1.5">
                {levels.map((lvl) => {
                  const lvlPct = lvl.membersRequired > 0
                    ? Math.min(100, (lvl.currentMembers / lvl.membersRequired) * 100)
                    : 0;
                  return (
                    <div key={lvl.level} className="flex items-center gap-3">
                      {lvl.achieved
                        ? <CheckCircle2 size={14} style={{ color: 'var(--pw-primary)' }} className="shrink-0" />
                        : <Circle size={14} className="shrink-0 opacity-30 text-[var(--foreground)]" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-medium text-[var(--foreground)]" style={{ opacity: lvl.achieved ? 1 : 0.5 }}>
                            Level {lvl.level}
                          </span>
                          <span className="opacity-40 text-[var(--foreground)]">
                            {lvl.currentMembers}/{lvl.membersRequired} members
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${lvlPct}%`,
                              backgroundColor: lvl.achieved ? 'var(--pw-primary)' : 'rgba(0,229,160,0.4)',
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
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Level {nextLevel.level} unlock
                </p>
                <p className="text-[10px] opacity-50 text-[var(--foreground)] mt-0.5">
                  {nextLevel.remaining} more {nextLevel.remaining === 1 ? 'member' : 'members'} needed
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'rgba(0,229,160,0.12)', color: 'var(--pw-primary)' }}>
                {nextLevel.currentMembers}/{nextLevel.membersRequired}
              </span>
            </div>
          )}

          {/* Near-limit warning banner */}
          {isNearLimit && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <AlertTriangle size={16} style={{ color: '#FBBF24' }} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium" style={{ color: '#FBBF24' }}>
                You're close to your earning limit. Refer more members to increase your cap.
              </p>
            </div>
          )}

          {/* Capped banner */}
          {isCapped && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
              <AlertTriangle size={16} style={{ color: '#FB7185' }} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium" style={{ color: '#FB7185' }}>
                Capping limit reached. Refer more members or upgrade your package to keep earning.
              </p>
            </div>
          )}

          {/* CTA */}
          <Link
            href="/team"
            className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--pw-primary)' }}
          >
            <Share2 size={15} /> Refer more to increase limit →
          </Link>
        </div>
      )}
    </section>
  );
}
