import type { TeamStatsData } from '@/types';

export function membersAtDepthActiveFromTeamStats(ts: TeamStatsData | null | undefined): number[] {
    const b = ts?.stats?.levelWiseBreakdown ?? [];
    const lw = ts?.stats?.levelWiseMembers ?? [];
    const per = b.length > 0 ? b.map((r: { active: number }) => r.active) : lw;
    return [0, ...per];
}

export function membersUpToDepthActiveFromTeamStats(ts: TeamStatsData | null | undefined): number[] {
    const b = ts?.stats?.levelWiseBreakdown ?? [];
    const actives = b.map((r: { active: number }) => r.active);
    const cum: number[] = [];
    let s = 0;
    for (const a of actives) {
        s += a;
        cum.push(s);
    }
    return [0, ...cum];
}

export function maxTreeDepthUsedFromTeamStats(ts: TeamStatsData | null | undefined): number {
    const b = ts?.stats?.levelWiseBreakdown ?? [];
    for (let i = b.length - 1; i >= 0; i--) {
        if ((b[i]?.total ?? 0) > 0 || (b[i]?.active ?? 0) > 0) return i + 1;
    }
    return 0;
}

/**
 * Qualified directs: `levelWiseBreakdown[0].active` (level-1 active members with package).
 */
export function qualifiedDirectsForIncome(input: TeamStatsData | TeamStatsData['stats'] | undefined): number {
    const isFullPayload = Boolean(input && typeof input === 'object' && 'stats' in input);
    const stats = (isFullPayload ? (input as TeamStatsData).stats : input) as TeamStatsData['stats'] | undefined;

    const fromBreakdown = stats?.levelWiseBreakdown?.[0]?.active;
    if (typeof fromBreakdown === 'number' && Number.isFinite(fromBreakdown)) return fromBreakdown;

    if (isFullPayload) {
        const directReferrals = (input as TeamStatsData).directReferrals ?? [];
        if (directReferrals.length > 0) {
            const hasPackageSignal = directReferrals.some((ref) => typeof (ref as any)?.totalPackageValue === 'number');
            if (hasPackageSignal) {
                return directReferrals.filter(
                    (ref) => ref.status === 'active' && Number((ref as any)?.totalPackageValue ?? 0) > 0,
                ).length;
            }

            return directReferrals.filter((ref) => ref.status === 'active').length;
        }
    }

    return stats?.directReferrals ?? 0;
}

export type LevelVolumeSource = 'exact' | 'estimated' | 'none';

export function volumeAtLevelForLevelRoi(opts: {
    levelIndex: number;
    levelWiseBusiness: number[];
    teamCountAtLevel: number;
    totalTeamMembers: number;
    totalBusiness: number;
}): { value: number; source: LevelVolumeSource } {
    const { levelIndex, levelWiseBusiness, teamCountAtLevel, totalTeamMembers, totalBusiness } = opts;
    const lw = levelWiseBusiness;

    if (lw.length > 0) {
        if (levelIndex < lw.length) {
            return { value: Number(lw[levelIndex] ?? 0), source: 'exact' };
        }
        return { value: 0, source: 'none' };
    }

    if (totalBusiness > 0 && totalTeamMembers > 0) {
        return {
            value: (teamCountAtLevel / Math.max(1, totalTeamMembers)) * totalBusiness,
            source: 'estimated',
        };
    }
    return { value: 0, source: 'none' };
}
