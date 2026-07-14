import type { LotteryEntry, LotteryReward, LotteryWinner, LotteryWinnerClaimFee } from '@/lib/api/lotteryApi';

type PlayerDisplayInput = Partial<Pick<LotteryEntry, 'displayUserId' | 'userId' | 'userName'>> &
    Partial<Pick<LotteryWinner, 'userId' | 'userName'>>;

export function pad(value: number) {
    return String(value).padStart(2, '0');
}

export function getRankLabel(rank: number) {
    if (rank === 1) return '1st Prize';
    if (rank === 2) return '2nd Prize';
    if (rank === 3) return '3rd Prize';
    return `${rank}th Prize`;
}

export function rewardValueLabel(reward?: LotteryReward) {
    if (!reward) return 'Reward pending';
    return reward.label || (reward.type === 'text' ? reward.value : `${reward.type.toUpperCase()} reward`);
}

export function playerUserId(entry: PlayerDisplayInput | null | undefined) {
    if (!entry) return '';
    const id = 'displayUserId' in entry ? entry.displayUserId || entry.userId : entry.userId;
    return String(id || '').trim();
}

export function playerDisplayName(entry: PlayerDisplayInput | null | undefined) {
    if (!entry) return 'Lucky Player';
    const name = String(entry.userName || '').trim();
    const id = playerUserId(entry);
    if (name && id && name !== id) return `${name} (${id})`;
    return name || id || 'Lucky Player';
}

/** Short line for claim UI when tier/event applies a payout fee */
export function claimFeeSummary(
    claimFee: LotteryWinnerClaimFee | null | undefined,
    payoutSymbol?: string,
) {
    if (!claimFee?.enabled) return null;
    const sym = (claimFee.tokenSymbol || payoutSymbol || '').trim();
    if (claimFee.feeType === 'percentage') {
        const pct = Number(claimFee.value || 0);
        const amt = claimFee.amount != null && String(claimFee.amount) !== '' ? String(claimFee.amount) : '';
        if (amt && sym) return `${pct}% fee (~${amt} ${sym})`;
        return `${pct}% claim fee`;
    }
    const flat = claimFee.amount != null && String(claimFee.amount) !== '' ? String(claimFee.amount) : String(claimFee.value ?? '');
    if (flat && sym) return `${flat} ${sym} claim fee`;
    return flat ? `${flat} claim fee` : 'Claim fee applies';
}
