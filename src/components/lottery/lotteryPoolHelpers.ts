import type { LotteryEvent, LotteryWalletResponse, LotteryDepositConfig } from '@/lib/api/lotteryApi';
import { toFiniteLotteryAmount } from './lotteryMoney';

export type ApiErrorResponse = {
    response?: {
        data?: {
            error?: string;
            message?: string;
        };
    };
};

export function lotteryErrorMessage(error: unknown, fallback: string) {
    const data = (error as ApiErrorResponse)?.response?.data;
    return data?.error || data?.message || fallback;
}

export function mergeLotteryWalletWithPageDeposit(
    wallet: LotteryWalletResponse | null,
    pageDeposit?: LotteryDepositConfig,
): LotteryWalletResponse | null {
    const cfg = pageDeposit;
    const cfgUsable = Boolean(cfg?.enabled && cfg?.depositAddress);
    if (wallet) {
        const w = wallet.depositConfig;
        const walletMissing = !w?.enabled || !w?.depositAddress;
        if (cfgUsable && walletMissing) {
            return { ...wallet, depositConfig: { ...cfg! } };
        }
        return wallet;
    }
    if (cfgUsable && cfg) {
        return {
            walletTypeCode: cfg.walletTypeCode || 'LOTTERY_WALLET',
            wallet: {
                balance: 0,
                availableBalance: 0,
                totalDeposit: 0,
                totalWithdraw: 0,
                totalIncome: 0,
            },
            depositConfig: cfg,
        };
    }
    return null;
}

export function getCouponPoolAmount(event: LotteryEvent | null | undefined, tierId?: string) {
    if (!event) return 0;
    if (tierId) {
        const pool = event.couponPools?.byTier?.[tierId];
        const tier = event.couponTiers?.find((item) => item.tierId === tierId);
        return toFiniteLotteryAmount(pool?.totalAmount ?? tier?.poolAmount ?? 0);
    }
    return toFiniteLotteryAmount(
        event.couponPools?.totalAmount ??
        (event.couponTiers || []).reduce((sum, tier) => sum + toFiniteLotteryAmount(tier.poolAmount), 0),
    );
}

export function attachCouponPools(event: LotteryEvent, couponPools: NonNullable<LotteryEvent['couponPools']>): LotteryEvent {
    return {
        ...event,
        couponPools,
        couponTiers: (event.couponTiers || []).map((tier) => {
            const pool = couponPools.byTier?.[tier.tierId];
            return pool
                ? {
                    ...tier,
                    poolAmount: pool.totalAmount,
                    poolTicketCount: pool.ticketCount,
                    poolPurchaseCount: pool.purchaseCount,
                    poolBuyerCount: pool.buyerCount,
                }
                : tier;
        }),
    };
}

export function crossedPoolMilestone(previousTotal: number, nextTotal: number) {
    const milestones = [100, 500, 1000, 5000, 10000, 25000, 50000];
    return milestones.find((milestone) => previousTotal < milestone && nextTotal >= milestone);
}
