'use client';

import Link from 'next/link';
import {
  Sparkles,
  Layers,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  Lock,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

/** Royalty accent — distinct from capping mint, still readable on dark/light */
const ROYALTY_ACCENT = '#A78BFA';
const ROYALTY_ACCENT_SOFT = 'rgba(167, 139, 250, 0.12)';
const ROYALTY_PAYING = '#FBBF24';

type RoyaltyLevelMeta = {
  level: number;
  unlocked?: boolean;
  paying?: boolean;
  locked?: boolean;
  team?: { current: number; required: number };
  business?: { current: number; required: number };
  dailyReward?: number;
  maxCap?: number;
};

export type RoyaltyMeta = {
  levels?: RoyaltyLevelMeta[];
  payingLevel?: number;
  qualifiedLevel?: number;
  dailyReward?: number;
  remainingBudget?: number;
  lifetimePaid?: number;
  rewardType?: string;
  cumulativeCap?: number;
};

/** Subset of pool-status payload used here (avoids tight coupling to pool-details types). */
export type RoyaltyTrackerPoolStatus = {
  year: number;
  month: number;
  pools: Array<{
    incomeTypeCode: string;
    label?: string;
    scheduleSummary?: string;
    receivedThisMonth?: number;
    eligibilityStatus?: {
      isEligible?: boolean;
      message?: string;
      meta?: RoyaltyMeta;
    };
  }>;
};

function pct(cur: number, req: number) {
  if (req <= 0) return 0;
  return Math.min(100, (cur / req) * 100);
}

export default function DashboardRoyaltyTracker({
  poolStatus,
  incomeConfig,
  loading = false,
}: {
  poolStatus: RoyaltyTrackerPoolStatus | null;
  incomeConfig?: Record<string, unknown> | null;
  loading?: boolean;
}) {
  const royaltyCfg = incomeConfig?.royalty_pool as Record<string, unknown> | undefined;
  const levelsCfg = Array.isArray(royaltyCfg?.levels) ? (royaltyCfg.levels as Array<Record<string, unknown>>) : [];
  const rewardType = String(royaltyCfg?.rewardType ?? '').toLowerCase();

  const royaltyPool = poolStatus?.pools?.find((p) => p.incomeTypeCode?.toLowerCase() === 'royalty_pool');
  const rawMeta = royaltyPool?.eligibilityStatus?.meta as RoyaltyMeta | undefined;
  const metaLevels = rawMeta?.levels ?? [];

  const hasAnyRoyalty =
    levelsCfg.length > 0 || !!royaltyPool || metaLevels.length > 0;
  if (!loading && !hasAnyRoyalty) return null;

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl animate-pulse bg-gray-200 dark:bg-white/10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            <div className="h-3 w-52 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
          <div className="flex gap-3 overflow-hidden pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 min-w-[200px] shrink-0 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const meta = rawMeta;
  const message = royaltyPool?.eligibilityStatus?.message ?? '';
  const receivedMonth = royaltyPool?.receivedThisMonth ?? 0;
  const schedule = royaltyPool?.scheduleSummary ?? '';

  const payingLevel = meta?.payingLevel ?? 0;
  const dailyReward = meta?.dailyReward ?? 0;
  const remaining = meta?.remainingBudget ?? 0;
  const lifetimePaid = meta?.lifetimePaid ?? 0;
  const isDaily = rewardType === 'daily';

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
      {/* Header — matches DashboardCappingTracker */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: ROYALTY_ACCENT_SOFT }}
          >
            <Sparkles size={17} style={{ color: ROYALTY_ACCENT }} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-base font-bold text-[var(--foreground)] leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Royalty depth tracker
              </h2>
              {isDaily && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    color: ROYALTY_PAYING,
                  }}
                >
                  <Zap className="h-3 w-3" />
                  Daily
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-40 text-[var(--foreground)] mt-0.5 max-w-xl">
              Unlocked depths, paying level &amp; royalty budget — separate from package capping.
            </p>
          </div>
        </div>
        <Link
          href="/income"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80 sm:self-center"
          style={{ color: ROYALTY_ACCENT }}
        >
          Income history
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI strip — same card language as capping inner stats */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] flex items-center gap-1.5">
              <Layers className="h-3 w-3 shrink-0" style={{ color: ROYALTY_ACCENT }} />
              Paying depth
            </p>
            <p className="text-base font-bold tabular-nums text-[var(--foreground)] mt-0.5">
              {payingLevel > 0 ? `L${payingLevel}` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 shrink-0" style={{ color: ROYALTY_ACCENT }} />
              Daily reward
            </p>
            <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: ROYALTY_PAYING }}>
              {dailyReward > 0 ? formatCurrency(dailyReward) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] flex items-center gap-1.5">
              <PiggyBank className="h-3 w-3 shrink-0" style={{ color: ROYALTY_ACCENT }} />
              Budget left
            </p>
            <p className="text-base font-bold tabular-nums text-[var(--foreground)] mt-0.5">
              {formatCurrency(Math.max(0, remaining))}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 col-span-2 lg:col-span-1">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3 shrink-0" style={{ color: ROYALTY_ACCENT }} />
              Month / lifetime
            </p>
            <p className="text-sm font-bold tabular-nums text-[var(--foreground)] mt-0.5">
              {formatCurrency(receivedMonth)}
              <span className="text-[10px] font-normal opacity-40 ml-1">this month</span>
            </p>
            <p className="text-[11px] tabular-nums opacity-60 text-[var(--foreground)] mt-0.5">
              Lifetime {formatCurrency(lifetimePaid)}
            </p>
          </div>
        </div>

        {/* Depth ladder — one row, horizontal scroll (mobile + desktop) */}
        {metaLevels.length > 0 && (
          <div className="space-y-2 -mx-5 sm:-mx-5">
            <div className="flex items-center justify-between px-5 gap-2">
              <p className="text-[10px] uppercase tracking-wide opacity-40 font-semibold text-[var(--foreground)]">
                Depth levels
              </p>
              <span className="text-[10px] opacity-40 text-[var(--foreground)] shrink-0 sm:hidden">
                Swipe →
              </span>
              <span className="text-[10px] opacity-40 text-[var(--foreground)] shrink-0 hidden sm:inline">
                Scroll →
              </span>
            </div>
            <div>
              <div
                className="flex gap-3 overflow-x-auto pb-2 pt-0.5 px-5 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(167,139,250,0.35) transparent',
                }}
              >
                {metaLevels.map((row) => {
                  const L = row.level;
                  const team = row.team ?? { current: 0, required: 0 };
                  const biz = row.business ?? { current: 0, required: 0 };
                  const teamP = pct(team.current, team.required);
                  const bizP = pct(biz.current, biz.required);
                  const isPaying = row.paying === true;
                  const isUnlocked = row.unlocked === true;

                  return (
                    <div
                      key={L}
                      className="snap-start shrink-0 min-w-[200px] max-w-[240px] w-[78vw] sm:w-[240px] rounded-xl border px-3.5 py-3 flex flex-col"
                      style={{
                        borderColor: isPaying
                          ? 'rgba(251, 191, 36, 0.35)'
                          : isUnlocked
                            ? 'rgba(167, 139, 250, 0.35)'
                            : 'var(--border)',
                        backgroundColor: isPaying
                          ? 'rgba(251, 191, 36, 0.06)'
                          : 'var(--background)',
                      }}
                    >
                      {isPaying && (
                        <span
                          className="self-start mb-2 inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: 'rgba(251, 191, 36, 0.15)',
                            color: ROYALTY_PAYING,
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                          }}
                        >
                          Pays now
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--foreground)]">Level {L}</span>
                        {!isUnlocked ? (
                          <Lock className="h-3.5 w-3.5 opacity-40 text-[var(--foreground)] shrink-0" />
                        ) : (
                          <span className="text-[10px] font-semibold" style={{ color: ROYALTY_ACCENT }}>
                            Open
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2.5 flex-1">
                        <div>
                          <div className="flex justify-between text-[10px] mb-1 opacity-50 text-[var(--foreground)]">
                            <span>Team</span>
                            <span className="tabular-nums font-medium">
                              {team.current}/{team.required}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${teamP}%`,
                                backgroundColor: isPaying ? ROYALTY_PAYING : ROYALTY_ACCENT,
                                opacity: isUnlocked ? 1 : 0.45,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] mb-1 opacity-50 text-[var(--foreground)]">
                            <span>Business</span>
                            <span className="tabular-nums font-medium">
                              {formatCurrency(biz.current)} / {formatCurrency(biz.required)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${bizP}%`,
                                backgroundColor: isPaying ? ROYALTY_PAYING : ROYALTY_ACCENT,
                                opacity: isUnlocked ? 0.85 : 0.35,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="shrink-0 w-2 sm:w-3" aria-hidden />
              </div>
            </div>
          </div>
        )}

        {/* Message + schedule */}
        {message ? (
          <div
            className="rounded-xl px-4 py-3 text-sm text-[var(--foreground)]"
            style={{
              backgroundColor: 'rgba(167, 139, 250, 0.06)',
              border: '1px solid rgba(167, 139, 250, 0.15)',
            }}
          >
            {message.replace(/\s+/g, ' ').trim()}
          </div>
        ) : null}
        {schedule ? (
          <p className="text-[11px] opacity-50 text-[var(--foreground)]">{schedule}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <p className="text-[11px] opacity-50 text-[var(--foreground)] leading-relaxed max-w-xl">
            Higher depths replace lower ones for the daily rate — only your current paying depth earns when qualified.
          </p>
          <Link
            href="/team"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: ROYALTY_ACCENT }}
          >
            View team
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
