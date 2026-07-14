'use client';

import { Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import type { PoolBalance } from '@/types';

const HIDDEN_POOL_KEYS = new Set(['single_leg_pool','royalty_pool']);
const POOL_LABELS: Record<string, string> = {
  single_leg_pool: 'Single Leg',
  booster_pool:    'Booster',
  club_pool:       'Club',
  salary_pool:     'Salary',
  leaderboard_pool:'Leaderboard',
  royalty_pool:    'Royalty',
};

// Each pool gets a distinct accent so the grid feels alive
const POOL_COLORS: Record<string, { color: string; bg: string }> = {
  booster_pool:     { color: 'var(--pw-primary)', bg: 'rgba(212,175,55,0.10)'   },
  club_pool:        { color: '#00C2E0', bg: 'rgba(0,194,224,0.10)'   },
  salary_pool:      { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  leaderboard_pool: { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)'  },
  royalty_pool:     { color: '#FB7185', bg: 'rgba(251,113,133,0.10)' },
};
const FALLBACK = { color: 'var(--pw-primary)', bg: 'rgba(212,175,55,0.10)' };

function poolLabel(key: string) {
  return POOL_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DashboardGlobalPools({ globalWallets, loading = false }: { globalWallets: PoolBalance[]; loading?: boolean }) {

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="h-5 w-44 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[var(--border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[var(--surface-elevated)] px-5 py-4">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-3" />
              <div className="h-7 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const visible = globalWallets.filter(w => !HIDDEN_POOL_KEYS.has(w.key));

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(167,139,250,0.12)' }}>
          <Wallet size={17} style={{ color: '#A78BFA' }} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Global Pool Balances
          </h2>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            Distributed to eligible users
          </p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[var(--border)]">
          {visible.map((w) => {
            const { color, bg } = POOL_COLORS[w.key] ?? FALLBACK;
            return (
              <div key={w.key}
                className="flex flex-col justify-between px-5 py-4 bg-[var(--surface-elevated)]">

                {/* Top row: dot + label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] truncate">
                    {poolLabel(w.key)}
                  </p>
                </div>

                {/* Amount */}
                <p className="text-2xl font-bold tabular-nums"
                  style={{ color }}>
                  {formatCurrency(w.balance)}
                </p>

                {/* Bottom bar accent */}
                <div className="mt-3 h-1 rounded-full w-full"
                  style={{ backgroundColor: bg }}>
                  <div className="h-full w-1/3 rounded-full"
                    style={{ backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(167,139,250,0.1)' }}>
            <Wallet size={18} style={{ color: '#A78BFA' }} />
          </div>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            No pool balances yet
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs mx-auto leading-relaxed">
            Pools are funded when users purchase packages and income is distributed.
          </p>
        </div>
      )}
    </section>
  );
}