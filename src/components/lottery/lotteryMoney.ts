export function toFiniteLotteryAmount(value: number | string | undefined | null) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? amount : 0;
}

export function formatLotteryMoney(value: number | string | undefined, symbol = 'USDT') {
    const amount = toFiniteLotteryAmount(value);
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
}

export function compactLotteryAmount(value: number | string | undefined) {
    const amount = toFiniteLotteryAmount(value);
    return amount.toLocaleString(undefined, {
        maximumFractionDigits: amount >= 1000 ? 1 : 2,
        notation: amount >= 10000 ? 'compact' : 'standard',
    });
}

export function safeLotteryBuyerName(name?: string | null, maxLength = 18) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return 'Someone';
    return trimmed.length > maxLength ? `${trimmed.slice(0, Math.max(1, maxLength - 2))}...` : trimmed;
}
