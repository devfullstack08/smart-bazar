import { isCouponLotteryEvent, type LotteryEntry, type LotteryEvent, type LotteryReward, type LotteryWinner, type LotteryWinnerConfig } from '@/lib/api/lotteryApi';
import { playerDisplayName, rewardValueLabel } from '@/components/lottery/lotteryFormat';
import type { TickerItem } from '@/components/lottery/LotteryTicker';

/** Default wheel labels when the server has not returned ticket numbers yet. */
export const FALLBACK_WHEEL_TICKETS = [
    'LOT-83921',
    'LOT-28221',
    'LOT-74831',
    'LOT-91022',
    'LOT-19302',
    'LOT-38591',
    'LOT-84820',
    'LOT-35291',
    'LOT-57291',
    'LOT-29481',
    'LOT-73629',
    'LOT-73822',
];

export function formatRelativeTime(value?: string) {
    if (!value) return 'just now';
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return 'just now';
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function shortDrawId(event: LotteryEvent | null) {
    if (!event) return 'LOT-READY';
    const dateKey = new Date(event.drawTime).toISOString().slice(0, 10);
    return `LOT-${dateKey}`;
}

export function playerName(entry: LotteryEntry | LotteryWinner | null | undefined) {
    return playerDisplayName(entry);
}

export function normalizePrizeConfigs(
    event: LotteryEvent | null
): Array<LotteryWinnerConfig & { reward: LotteryReward; couponTierId?: string; couponTierLabel?: string; couponTierAmount?: number; ladderKey?: string }> {
    if (!event) return [];
    if (isCouponLotteryEvent(event) && Array.isArray(event.couponTiers) && event.couponTiers.length > 0) {
        const tierConfigs = event.couponTiers
            .filter((tier) => tier.enabled !== false)
            .flatMap((tier, tierIndex) => (tier.winnerConfigs || []).map((config, configIndex) => ({
                ...config,
                couponTierId: tier.tierId,
                couponTierLabel: tier.label || `${tier.amount} ${tier.currencySymbol || 'USDT'} Coupon`,
                couponTierAmount: tier.amount,
                ladderKey: `${tier.tierId || tierIndex}-${config.rank}-${configIndex}`,
            })))
            .sort((a, b) => Number(a.couponTierAmount || 0) - Number(b.couponTierAmount || 0) || a.rank - b.rank);
        if (tierConfigs.length > 0) return tierConfigs;
    }
    if (Array.isArray(event.winnerConfigs) && event.winnerConfigs.length > 0) {
        return [...event.winnerConfigs].sort((a, b) => a.rank - b.rank);
    }
    return (event.rewards || [])
        .map((reward) => ({ rank: reward.rank, selectionType: 'random' as const, reward }))
        .sort((a, b) => a.rank - b.rank);
}

function truncate(s: string, max: number) {
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
