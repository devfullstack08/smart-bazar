/**
 * Backend `/users/income/pool-status` can include non-pool rows (e.g. base ROI).
 * For Smart Bazar dashboard, show only actual global pool programs.
 */
/** Fixed order for Global pool programs UI (dashboard / pool status). */
export const POOL_DISPLAY_ORDER = [
  'global_autopool',
] as const;

const INCLUDED_POOL_CODES = new Set(
  (POOL_DISPLAY_ORDER as readonly string[]).map((c) => c.toLowerCase()),
);

const POOL_ORDER_INDEX = new Map(
  (POOL_DISPLAY_ORDER as readonly string[]).map((c, i) => [c, i]),
);

/** Sort pool rows to match {@link POOL_DISPLAY_ORDER}; unknown codes last. */
export function sortPoolsByDisplayOrder<T extends { incomeTypeCode: string }>(pools: T[]): T[] {
  return [...pools].sort((a, b) => {
    const ia = POOL_ORDER_INDEX.get(a.incomeTypeCode.trim().toLowerCase()) ?? 999;
    const ib = POOL_ORDER_INDEX.get(b.incomeTypeCode.trim().toLowerCase()) ?? 999;
    return ia - ib;
  });
}

/** Short labels for at-a-glance summary chips */
export const POOL_CODE_SHORT_LABEL: Record<string, string> = {
  global_autopool: 'Auto-Pool',
};

export function poolShortLabel(code: string): string {
  const k = code.trim().toLowerCase();
  return POOL_CODE_SHORT_LABEL[k] ?? code.replace(/_/g, ' ');
}

export function isPoolStatusRow(code: string | undefined | null): boolean {
  if (!code || typeof code !== 'string') return false;
  return INCLUDED_POOL_CODES.has(code.trim().toLowerCase());
}
