import type { IncomeRegistryEntry } from '@/types';

/** Smart Bazar pool key → display label fallback (when registry has no override) */
const BLOOMX_POOL_LABELS: Record<string, string> = {
  single_leg_pool: 'Single-Leg Pool',
  booster_pool: 'Booster Pool',
  club_pool: 'Club Pool',
  salary_pool: 'Salary Pool',
  leaderboard_pool: 'Leaderboard Pool',
  royalty_pool: 'Royalty Pool',
  global_autopool: 'Global Auto-Pool',
};

/** Get display label for income type code. Uses registry if provided, else fallback formatting. */
export function getIncomeTypeLabel(
  code: string,
  registry?: IncomeRegistryEntry[] | null
): string {
  if (!code) return '';
  if (registry?.length) {
    const entry = registry.find((r) => r.code === code);
    if (entry?.label) return entry.label;
  }
  return BLOOMX_POOL_LABELS[code] ?? code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Level ROI rows: show level + source user id (downline whose ROI triggered the payout). */
export function getIncomeRowDisplayLabel(
  transaction: {
    incomeType: string;
    level?: number | null;
    sourceUserId?: string | null;
    fromUserId?: string;
  },
  registry?: IncomeRegistryEntry[] | null
): string {
  const base = getIncomeTypeLabel(transaction.incomeType, registry);
  const norm = transaction.incomeType?.toLowerCase?.().replace(/-/g, '_') ?? '';
  if (norm === 'level_roi' && transaction.level != null && transaction.level !== undefined) {
    const src = transaction.sourceUserId || transaction.fromUserId;
    if (src) {
      return `${base} (L${transaction.level} - ${src})`;
    }
    return `${base} (L${transaction.level})`;
  }
  return base;
}

/** Get display label for Smart Bazar pool key */
export function getPoolLabel(key: string): string {
  return BLOOMX_POOL_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
