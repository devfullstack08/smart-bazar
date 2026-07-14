'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Layers, CheckCircle2, Lock, ChevronDown, ArrowRight, Users
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils/cn';
import { isPoolStatusRow, poolShortLabel, sortPoolsByDisplayOrder } from '@/lib/utils/poolStatusFilter';
import { dashboardApi } from '@/lib/api/services';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';

export interface PoolStatusData {
  year: number;
  month: number;
  pools: Array<{
    incomeTypeCode: string;
    label: string;
    scheduleSummary: string;
    receivedThisMonth: number;
    eligibilityStatus?: { isEligible: boolean; message: string; current?: number; required?: number; unit?: string; meta?: any };
  }>;
}

type PoolViewMode = 'card' | 'list';

export interface PoolDetailsData {
  incomeTypeCode: string;
  label: string;
  requirementText: string;
  requiredCount: number;
  currentCount: number;
  rewardDescription: string;
  scheduleSummary: string;
  members: Array<{ userId: string; name?: string; position?: number; note?: string; joinCount?: number; directCount?: number; joinedAt?: string }>;
  /** Leaderboard pool: current user's rank in top 100 (1-based) */
  currentUserRank?: number;
}

type PoolTier = {
  name: string;
  required: number;
  current: number;
  unlocked: boolean;
  /** Smart Bazar club_pool: config level = network depth counted for this tier */
  clubDepth?: number;
  /** Royalty daily mode: this depth pays the daily rate */
  paying?: boolean;
  business?: {
    current: number;
    required: number;
  };
};

function getPoolTiers(code: string, cfg: Record<string, any> | null, currentCount: number, pool?: PoolStatusData['pools'][number]): PoolTier[] {
  const c = code.toLowerCase();
  if (!cfg) return [];
  if (c === 'salary_pool' && Array.isArray(cfg.salary_pool?.tiers)) {
    return cfg.salary_pool.tiers.map((t: any) => {
      const required = Number(t?.directRequired ?? 0);
      return {
        name: String(t?.name ?? 'Tier'),
        required,
        current: currentCount,
        unlocked: currentCount >= required,
      };
    });
  }
  if (c === 'club_pool' && Array.isArray(cfg.club_pool?.clubs)) {
    const fromApi = pool?.eligibilityStatus?.meta?.clubs;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi.map((row: any) => ({
        name: String(row?.name ?? `Level ${row?.level ?? ''}`),
        required: Number(row?.required ?? 0),
        current: Number(row?.current ?? 0),
        unlocked: Boolean(row?.unlocked),
        clubDepth: Number(row?.level ?? 0) || undefined,
      }));
    }
    return cfg.club_pool.clubs.map((club: any) => {
      const required = Number(club?.teamRequiredAtLevel ?? 0);
      const depth = Number(club?.level ?? 0) || undefined;
      return {
        name: String(club?.name ?? `Level ${club?.level ?? ''}`),
        required,
        current: currentCount,
        unlocked: currentCount >= required,
        clubDepth: depth,
      };
    });
  }
  if (c === 'royalty_pool' && Array.isArray(cfg.royalty_pool?.levels)) {
    const metaLevels = pool?.eligibilityStatus?.meta?.levels;
    const daily = String(cfg.royalty_pool?.rewardType ?? '').toLowerCase() === 'daily';
    return cfg.royalty_pool.levels.map((lvl: any, index: number) => {
      const requiredTeam = Number(lvl?.teamAtLevel ?? 0);
      const levelNum = Number(lvl?.level ?? index + 1);

      const m = metaLevels?.find((row: any) => row.level === levelNum);
      const currentTeamCount = m?.team?.current ?? 0;
      const currentBiz = m?.business?.current ?? 0;
      const requiredBiz = m?.business?.required ?? lvl?.teamBusinessAtLevel ?? 0;
      const isUnlocked = m?.unlocked === true;
      const isPaying = m?.paying === true;

      const cap = lvl?.maxRewardsCap ?? 0;
      const dayAmt = lvl?.dailyReward;
      const dur = lvl?.durationDays;
      const nameParts = [`Level ${levelNum}`, `$${cap} cap`];
      if (daily && dayAmt != null) nameParts.push(`$${dayAmt}/day`);
      if (daily && dur != null) nameParts.push(`${dur}d max`);

      return {
        name: nameParts.join(' · '),
        required: requiredTeam,
        current: currentTeamCount,
        unlocked: isUnlocked,
        paying: isPaying,
        business: {
          current: currentBiz,
          required: requiredBiz
        }
      };
    });
  }
  return [];
}

export default function DashboardPoolStatus({
  poolStatus,
  loading = false,
  incomeConfig = null,
}: {
  poolStatus: PoolStatusData | null;
  loading?: boolean;
  incomeConfig?: Record<string, any> | null;
}) {
  const [expandedPoolCode, setExpandedPoolCode] = useState<string | null>(null);
  const [poolDetails, setPoolDetails] = useState<PoolDetailsData | null>(null);
  const [poolDetailsLoading, setPoolDetailsLoading] = useState<string | null>(null);
  const poolRowRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({});
  const leaderboardYouRowRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useAppSelector((s) => s.auth.user?.userId ?? '');

  /** Scroll leaderboard so the current user’s row is visible (encouragement). */
  useLayoutEffect(() => {
    if (poolDetails?.incomeTypeCode !== 'leaderboard_pool') return;
    const members = poolDetails.members;
    if (!members?.length || !currentUserId) return;
    const inList = members.some((m) => String(m.userId) === String(currentUserId));
    if (!inList) return;
    const frame = requestAnimationFrame(() => {
      leaderboardYouRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [poolDetails?.incomeTypeCode, poolDetails?.members, currentUserId]);

  const focusPoolFromGlance = (code: string) => {
    setPoolDetails(null);
    const willOpen = expandedPoolCode !== code;
    setExpandedPoolCode((prev) => (prev === code ? null : code));
    if (willOpen) {
      requestAnimationFrame(() => {
        const el = poolRowRefs.current[code];
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const displayPools = useMemo(
    () =>
      sortPoolsByDisplayOrder(
        (poolStatus?.pools ?? []).filter((p) => isPoolStatusRow(p.incomeTypeCode)),
      ),
    [poolStatus?.pools],
  );

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-5 w-36 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!poolStatus || displayPools.length === 0) return null;

  const monthLabel = new Date(poolStatus.year, poolStatus.month - 1).toLocaleString('en-US', {
    month: 'long', year: 'numeric',
  });

  const renderPoolRow = (pool: PoolStatusData['pools'][number]) => {
    const isExpanded = expandedPoolCode === pool.incomeTypeCode;
    const isEarning = pool.eligibilityStatus?.isEligible ?? false;
    const current = pool.eligibilityStatus?.current ?? 0;
    const required = pool.eligibilityStatus?.required ?? 100;
    const needMore = Math.max(0, required - current);
    const progressPct = required > 0 ? Math.min(100, (current / required) * 100) : 0;
    const accentColor = isEarning ? 'var(--pw-primary)' : '#FBBF24';

    return (
      <div key={pool.incomeTypeCode}>
        <button
          type="button"
          onClick={() => {
            setPoolDetails(null);
            setExpandedPoolCode(isExpanded ? null : pool.incomeTypeCode);
          }}
          className="w-full px-4 sm:px-5 py-4 text-left hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] active:bg-zinc-200/90 dark:active:bg-white/[0.06] transition-colors touch-manipulation min-touch"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}18` }}>
              {isEarning
                ? <CheckCircle2 size={18} style={{ color: accentColor }} strokeWidth={2} />
                : <Lock size={16} style={{ color: accentColor }} strokeWidth={2} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-[var(--foreground)] text-sm truncate">
                  {pool.label}
                </p>
                <span className="text-xs font-bold tabular-nums shrink-0"
                  style={{ color: accentColor }}>
                  {current}/{required}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: accentColor }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                  {isEarning ? '✓ Earning' : `${needMore} more to unlock`}
                </span>
                {isEarning && pool.receivedThisMonth > 0 && (
                  <span className="text-xs font-semibold opacity-70 text-[var(--foreground)]">
                    {formatCurrency(pool.receivedThisMonth)} this month
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              size={18}
              className="shrink-0 opacity-50 transition-transform duration-200"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[var(--border)] bg-zinc-50/90 dark:bg-black/20">
            <div className="flex items-start gap-3 rounded-xl p-3 mt-3"
              style={{ backgroundColor: `${accentColor}0F`, border: `1px solid ${accentColor}30` }}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                style={{ backgroundColor: `${accentColor}20` }}>
                {isEarning
                  ? <CheckCircle2 size={15} style={{ color: accentColor }} />
                  : <Lock size={14} style={{ color: accentColor }} />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {isEarning ? 'You are earning from this pool' : 'Keep going — almost there'}
                </p>
                <p className="text-xs opacity-60 text-[var(--foreground)] mt-0.5">
                  {pool.eligibilityStatus?.message
                    ? String(pool.eligibilityStatus.message).replace(/\s+/g, ' ').trim()
                    : (isEarning ? 'You qualify for this pool.' : 'Complete the goal to start earning.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                <p className="text-xs uppercase tracking-wide opacity-40 text-[var(--foreground)] mb-1">Progress</p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                  {String(current).padStart(2, '0')}
                  <span className="text-sm font-normal opacity-40"> / {required}</span>
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                <p className="text-xs uppercase tracking-wide opacity-40 text-[var(--foreground)] mb-1">This Month</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pw-primary)' }}>
                  {formatCurrency(pool.receivedThisMonth)}
                </p>
              </div>
            </div>

            {!isEarning && needMore > 0 && (
              <Link
                href="/team"
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: 'rgba(0,229,160,0.1)', color: 'var(--pw-primary)', border: '1px solid rgba(0,229,160,0.25)' }}
              >
                <span className="flex items-center gap-2">
                  <Users size={15} />
                  Refer {needMore} more to unlock
                </span>
                <ArrowRight size={15} />
              </Link>
            )}

            {pool.scheduleSummary && (
              <p className="text-xs opacity-50 text-[var(--foreground)]">{pool.scheduleSummary}</p>
            )}

            {poolDetails?.incomeTypeCode === pool.incomeTypeCode ? (
              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--foreground)]">Full Details</p>
                {poolDetails.incomeTypeCode === 'leaderboard_pool' && (() => {
                  const rank = poolDetails.currentUserRank ?? 0;
                  const onBoard =
                    Boolean(currentUserId) &&
                    (poolDetails.members ?? []).some((m) => String(m.userId) === String(currentUserId));
                  return (
                    <div className={cn(
                      'rounded-xl px-4 py-2.5 border',
                      rank > 0
                        ? 'border-[var(--pw-primary)]/40 bg-[var(--pw-primary)]/10'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    )}>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {rank > 0
                          ? onBoard
                            ? `You're rank #${rank} — your row is highlighted in the list below. Keep growing your directs to climb!`
                            : `You are rank #${rank} in the top qualifiers.`
                          : 'You are not in the top list yet. Get more active direct referrals to climb the leaderboard.'}
                      </p>
                    </div>
                  );
                })()}
                {poolDetails.members && poolDetails.members.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-60 text-[var(--foreground)]">
                      {poolDetails.incomeTypeCode === 'leaderboard_pool'
                        ? 'Top qualifiers (by lifetime active directs)'
                        : 'Members'}
                    </p>
                    <div
                      className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden max-h-[min(55vh,400px)] overflow-y-auto"
                      role="list"
                      aria-label={poolDetails.incomeTypeCode === 'leaderboard_pool' ? 'Leaderboard top list' : 'Pool member list'}
                    >
                      {poolDetails.incomeTypeCode === 'leaderboard_pool' && (
                        <div
                          className="sticky top-0 z-[1] flex items-center gap-3 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-elevated)] text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                          aria-hidden
                        >
                          <span className="w-9 text-center">Rank</span>
                          <span className="flex-1 min-w-0">Member</span>
                          <span className="shrink-0 w-12 text-right">Directs</span>
                        </div>
                      )}
                      {poolDetails.members.map((m) => {
                        const isLb = poolDetails.incomeTypeCode === 'leaderboard_pool';
                        const isYou =
                          Boolean(currentUserId) && String(m.userId) === String(currentUserId);
                        const rankOrPos =
                          m.position != null && m.position > 0
                            ? poolDetails.incomeTypeCode === 'leaderboard_pool'
                              ? `#${m.position}`
                              : `#${m.position}`
                            : null;
                        const metric =
                          m.joinCount != null
                            ? `${m.joinCount} directs`
                            : m.directCount != null
                              ? `${m.directCount} directs`
                              : m.note ?? '';
                        return (
                          <div
                            key={`${m.userId}-${m.position ?? ''}`}
                            ref={isYou && isLb ? leaderboardYouRowRef : undefined}
                            role="listitem"
                            className={cn(
                              'flex items-center gap-3 px-3 border-b border-[var(--border)] last:border-b-0 text-sm transition-colors',
                              isYou && isLb
                                ? 'py-3 bg-gradient-to-r from-[var(--pw-primary)]/22 via-[var(--pw-primary)]/10 to-transparent shadow-[inset_4px_0_0_0_var(--pw-primary)]'
                                : isYou
                                  ? 'py-2.5 bg-[var(--pw-primary)]/8'
                                  : 'py-2.5',
                            )}
                          >
                            <span
                              className={cn(
                                'shrink-0 w-10 text-center font-bold tabular-nums',
                                isYou && isLb
                                  ? 'text-sm text-[var(--pw-primary)]'
                                  : isYou
                                    ? 'text-xs text-[var(--pw-primary)]'
                                    : 'text-xs opacity-60 text-[var(--foreground)]',
                              )}
                            >
                              {rankOrPos ?? '—'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    'truncate',
                                    isYou && isLb
                                      ? 'font-bold text-[var(--foreground)]'
                                      : 'font-semibold text-[var(--foreground)]',
                                  )}
                                >
                                  {m.name ?? m.userId}
                                </span>
                                {isYou && isLb && (
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-[var(--pw-primary)]/50"
                                    style={{ backgroundColor: 'rgba(0,229,160,0.22)', color: 'var(--pw-primary)' }}
                                  >
                                    Your rank
                                  </span>
                                )}
                                {isYou && !isLb && (
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: 'rgba(0,229,160,0.2)', color: 'var(--pw-primary)' }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              {isYou && isLb && (
                                <p className="text-[10px] font-medium text-[var(--pw-primary)] mt-1 leading-snug">
                                  This is you — every extra direct can move you up.
                                </p>
                              )}
                              {metric && poolDetails.incomeTypeCode !== 'leaderboard_pool' && (
                                <p className="text-[11px] opacity-50 text-[var(--foreground)] truncate mt-0.5">{metric}</p>
                              )}
                            </div>
                            {poolDetails.incomeTypeCode === 'leaderboard_pool' && (
                              <span
                                className={cn(
                                  'shrink-0 w-12 text-right text-xs font-bold tabular-nums',
                                  isYou ? 'text-[var(--pw-primary)]' : 'text-[var(--foreground)]',
                                )}
                              >
                                {m.joinCount ?? m.directCount ?? '—'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-sm opacity-60 text-[var(--foreground)]">{poolDetails.requirementText}</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{poolDetails.rewardDescription}</p>
                {(() => {
                  const tiers = getPoolTiers(pool.incomeTypeCode, incomeConfig, current, pool);
                  if (tiers.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-60 text-[var(--foreground)]">
                        {pool.incomeTypeCode === 'club_pool' ? 'Tier targets (per depth)' : 'Tier lock status'}
                      </p>
                      {pool.incomeTypeCode === 'club_pool' && (
                        <p className="text-[10px] leading-snug text-[var(--muted-foreground)]">
                          Each row is active members at that depth (same as Team → level-wise active). Tiers must be completed in club order (Bronze, then Silver, then Gold, …); deeper legs do not skip an earlier tier.
                          {pool.eligibilityStatus?.meta?.memberCountNote
                            ? ` ${String(pool.eligibilityStatus.meta.memberCountNote)}`
                            : ''}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tiers.map((tier) => (
                          <div
                            key={`${pool.incomeTypeCode}-${tier.name}`}
                            className={cn(
                              'rounded-xl border px-3 py-2.5',
                              tier.unlocked ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[var(--border)] bg-[var(--surface)]'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-[var(--foreground)] truncate">{tier.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {tier.paying && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--pw-primary)]/25 text-emerald-800 dark:text-emerald-300">
                                    Paying
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                                    tier.unlocked
                                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                                  )}
                                >
                                  {pool.incomeTypeCode === 'club_pool'
                                    ? tier.unlocked
                                      ? 'Target met'
                                      : 'Below target'
                                    : tier.unlocked
                                      ? 'Unlocked'
                                      : 'Locked'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-[var(--muted-foreground)]">
                                {pool.incomeTypeCode === 'club_pool' && tier.clubDepth
                                  ? `Active team (depth ${tier.clubDepth})`
                                  : pool.incomeTypeCode === 'club_pool'
                                    ? 'Active team'
                                    : 'Team'}
                              </span>
                              <span className="font-semibold text-[var(--foreground)]">{tier.current} / {tier.required}</span>
                            </div>
                            {tier.business && (
                              <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="text-[var(--muted-foreground)]">Business</span>
                                <span className="font-semibold text-[var(--foreground)]">${tier.business.current} / ${tier.business.required}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <button type="button" onClick={() => setPoolDetails(null)}
                  className="text-xs font-semibold opacity-50 hover:opacity-80 text-[var(--foreground)] transition-opacity py-1">
                  Hide details
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setPoolDetailsLoading(pool.incomeTypeCode);
                  setPoolDetails(null);
                  try {
                    const details = await dashboardApi.getPoolStatusDetails(
                      pool.incomeTypeCode, poolStatus?.year, poolStatus?.month
                    );
                    setPoolDetails(details ?? null);
                  } catch {
                    toast.error('Could not load pool details');
                  } finally {
                    setPoolDetailsLoading(null);
                  }
                }}
                disabled={poolDetailsLoading === pool.incomeTypeCode}
                className="text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{ color: 'var(--pw-primary)' }}
              >
                {poolDetailsLoading === pool.incomeTypeCode ? 'Loading…' : 'View full details →'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(0,229,160,0.12)' }}>
            <Layers size={18} style={{ color: 'var(--pw-primary)' }} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
              Global pool programs
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{monthLabel} · Global pool programs only</p>
          </div>
        </div>
        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,229,160,0.1)', color: 'var(--pw-primary)' }}>
            {displayPools.filter(p => p.eligibilityStatus?.isEligible).length} Earning
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {displayPools.filter(p => !p.eligibilityStatus?.isEligible).length} In progress
          </span>
        </div>
      </div>

      {/* ── At a glance: current/required for every pool (no expand needed) ── */}
      <div className="px-4 sm:px-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]/60 dark:bg-transparent">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2.5">
          Your progress by pool
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 no-scrollbar sm:flex-wrap sm:overflow-visible">
          {displayPools.map((pool) => {
            const current = pool.eligibilityStatus?.current ?? 0;
            const required = pool.eligibilityStatus?.required ?? 0;
            const earning = pool.eligibilityStatus?.isEligible ?? false;
            const short = poolShortLabel(pool.incomeTypeCode);
            const isRowOpen = expandedPoolCode === pool.incomeTypeCode;
            return (
              <button
                key={`glance-${pool.incomeTypeCode}`}
                type="button"
                onClick={() => focusPoolFromGlance(pool.incomeTypeCode)}
                aria-expanded={isRowOpen}
                aria-controls={`pool-row-${pool.incomeTypeCode}`}
                className={cn(
                  'shrink-0 text-left rounded-xl border px-3 py-2.5 min-w-[118px] max-w-[200px] sm:min-w-0 sm:flex-1 sm:max-w-[220px]',
                  'transition-[box-shadow,transform] duration-200 touch-manipulation min-h-[44px]',
                  'hover:brightness-[1.02] dark:hover:brightness-110 active:scale-[0.99]',
                  earning
                    ? 'border-emerald-500/40 bg-emerald-500/[0.07] dark:bg-emerald-500/10'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)]',
                  isRowOpen
                    ? 'ring-2 ring-[var(--pw-primary)]/45 ring-offset-2 ring-offset-[var(--background)] dark:ring-offset-[var(--surface-elevated)]'
                    : '',
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] truncate">
                  {short}
                </p>
                <p className="text-base sm:text-lg font-bold tabular-nums text-[var(--foreground)] leading-tight mt-1">
                  {current}
                  <span className="text-[var(--muted-foreground)] font-semibold text-sm"> / {required}</span>
                </p>
                <p
                  className={cn(
                    'text-[10px] font-semibold mt-1',
                    earning ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300',
                  )}
                >
                  {earning ? 'Earning' : 'In progress'}
                </p>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-2 leading-snug">
          Tap a chip or a row below for full status, tiers, and actions.
        </p>
      </div>

      {/* ── Pool list ────────────────────────────────────────── */}
      <div className="divide-y divide-[var(--border)]">
        {displayPools.map((pool) => (
          <div
            key={pool.incomeTypeCode}
            id={`pool-row-${pool.incomeTypeCode}`}
            ref={(el) => {
              poolRowRefs.current[pool.incomeTypeCode] = el;
            }}
          >
            {renderPoolRow(pool)}
          </div>
        ))}

      </div>
    </section>
  );
}
