'use client';

import { useEffect } from 'react';
import { Flame, Ticket, Wallet } from 'lucide-react';
import type { LotteryEvent } from '@/lib/api/lotteryApi';
import { compactLotteryAmount, formatLotteryMoney, safeLotteryBuyerName, toFiniteLotteryAmount } from './lotteryMoney';
import { getCouponPoolAmount } from './lotteryPoolHelpers';
import { dispatchHypeBurst } from './arena/LotteryLiveReactions';

type RoomPoolGrowth = {
    amount: number;
    tickets: number;
};

type RoomPoolActivity = {
    id: string;
    buyerName: string;
    amount: number;
    symbol: string;
    quantity: number;
    tierLabel?: string;
};

export default function LotteryRoomPoolSummary({
    event,
    tierGrowth,
    poolActivity,
    heartbeatId,
}: {
    event: LotteryEvent;
    tierGrowth: Record<string, RoomPoolGrowth>;
    poolActivity: RoomPoolActivity | null;
    heartbeatId?: string | null;
}) {
    const tiers = (event.couponTiers || []).filter((tier) => tier.enabled !== false);
    if (!tiers.length) return null;

    const poolByTier = event.couponPools?.byTier || {};
    const fallbackSymbol = tiers[0]?.currencySymbol || 'USDT';
    const totalPoolAmount = getCouponPoolAmount(event);
    const totalTickets = toFiniteLotteryAmount(event.couponPools?.totalTickets ?? tiers.reduce((sum, tier) => sum + toFiniteLotteryAmount(tier.poolTicketCount), 0));
    const totalBuyers = toFiniteLotteryAmount(event.couponPools?.totalBuyers ?? tiers.reduce((sum, tier) => sum + toFiniteLotteryAmount(tier.poolBuyerCount), 0));
    const hotCandidate = Object.entries(tierGrowth || {}).reduce((best, [tierId, growth]) => {
        const amount = toFiniteLotteryAmount(growth.amount);
        return amount > best.amount ? { tierId, amount } : best;
    }, { tierId: '', amount: 0 });
    const leadingTier = tiers.reduce((best, tier) => {
        const amount = toFiniteLotteryAmount(poolByTier[tier.tierId]?.totalAmount ?? tier.poolAmount);
        return amount > best.amount ? { tierId: tier.tierId, amount } : best;
    }, { tierId: tiers[0]?.tierId || '', amount: -1 });
    const highlightedTierId = hotCandidate.tierId || leadingTier.tierId;
    const highlightedTier = tiers.find((tier) => tier.tierId === highlightedTierId) || tiers[0];
    const maxTierPoolAmount = Math.max(1, ...tiers.map((tier) => toFiniteLotteryAmount(poolByTier[tier.tierId]?.totalAmount ?? tier.poolAmount)));
    const isPoolWise = tiers.some((tier) => tier.prizeMode === 'pool_percentage');
    const visibleTiers = tiers.slice(0, 4);

    useEffect(() => {
        if (!poolActivity) return;
        if (poolActivity.amount >= 500 || poolActivity.quantity >= 50) {
            dispatchHypeBurst(poolActivity.amount >= 1000 ? '🤑' : '🚀', Math.min(10, Math.floor(poolActivity.quantity / 5) || 5));
        } else if (poolActivity.quantity >= 10) {
            dispatchHypeBurst('🔥', 3);
        }
    }, [poolActivity?.id]);

    return (
        <section className="overflow-hidden rounded-[1.1rem] border border-amber-100/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.06),rgba(250,204,21,0.015)),rgba(9,9,11,0.95)] p-2.5 shadow-[0_22px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:rounded-[1.35rem] sm:p-3 md:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1fr)] lg:items-stretch">
                <div className="rounded-[0.9rem] border border-white/10 bg-black/24 p-3 sm:rounded-[1.1rem] sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/70">
                                {isPoolWise ? 'Live coupon pool' : 'Ticket reserve'}
                            </p>
                            <h2 className="mt-1 text-[clamp(1.5rem,7vw,3.2rem)] font-black leading-none text-white sm:mt-2">
                                {formatLotteryMoney(totalPoolAmount, fallbackSymbol)}
                            </h2>
                        </div>
                        <div
                            key={heartbeatId || 'pool-idle'}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200/24 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100 ${heartbeatId ? 'animate-pulse' : ''}`}
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.86)]" />
                            Live
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 sm:rounded-xl sm:p-3">
                            <Ticket className="h-3.5 w-3.5 text-amber-300/90 sm:h-4 sm:w-4" />
                            <strong className="mt-1.5 block truncate text-base font-black text-white sm:mt-2 sm:text-lg">{totalTickets.toLocaleString()}</strong>
                            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/42 sm:text-[10px]">Tickets</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 sm:rounded-xl sm:p-3">
                            <Wallet className="h-3.5 w-3.5 text-amber-200/90 sm:h-4 sm:w-4" />
                            <strong className="mt-1.5 block truncate text-base font-black text-white sm:mt-2 sm:text-lg">{totalBuyers.toLocaleString()}</strong>
                            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/42 sm:text-[10px]">Buyers</span>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 sm:rounded-xl sm:p-3">
                            <Flame className="h-3.5 w-3.5 text-amber-200 sm:h-4 sm:w-4" />
                            <strong className="mt-1.5 block leading-tight line-clamp-2 text-sm font-black text-white sm:mt-2 sm:text-lg">
                                {highlightedTier?.label || formatLotteryMoney(highlightedTier?.amount, highlightedTier?.currencySymbol || fallbackSymbol)}
                            </strong>
                            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/42 sm:text-[10px]">
                                {hotCandidate.amount > 0 ? 'Hot tier' : 'Leader'}
                            </span>
                        </div>
                    </div>
                    {poolActivity ? (
                        <div key={poolActivity.id} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/16 bg-amber-300/8 px-3 py-2 text-xs font-bold text-white/72">
                            <span className="text-amber-100 flex items-center gap-1">
                                {(poolActivity.amount >= 500 || poolActivity.quantity >= 50) && (
                                    <span className="text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" title="High Roller">{poolActivity.amount >= 1000 ? '👑' : '🐋'}</span>
                                )}
                                {safeLotteryBuyerName(poolActivity.buyerName)}
                            </span>
                            <span>added</span>
                            <strong className="text-white">+{formatLotteryMoney(poolActivity.amount, poolActivity.symbol)}</strong>
                            <span className="text-white/45">{poolActivity.quantity} ticket{poolActivity.quantity === 1 ? '' : 's'}</span>
                        </div>
                    ) : null}
                </div>

                <div className="grid gap-1.5 sm:gap-2 sm:grid-cols-2">
                    {visibleTiers.map((tier) => {
                        const pool = poolByTier[tier.tierId];
                        const tierAmount = toFiniteLotteryAmount(pool?.totalAmount ?? tier.poolAmount);
                        const tickets = toFiniteLotteryAmount(pool?.ticketCount ?? tier.poolTicketCount);
                        const growth = tierGrowth?.[tier.tierId] || { amount: 0, tickets: 0 };
                        const progress = Math.max(5, Math.min(100, (tierAmount / maxTierPoolAmount) * 100));
                        const isHot = highlightedTierId === tier.tierId && hotCandidate.amount > 0;
                        const tierSymbol = tier.currencySymbol || fallbackSymbol;
                        return (
                            <article
                                key={tier.tierId}
                                className={`rounded-[1.05rem] border p-3.5 transition ${isHot ? 'border-amber-200/40 bg-amber-300/10 shadow-[0_0_26px_rgba(251,191,36,0.12)]' : 'border-white/10 bg-white/[0.035]'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <h3 className="truncate text-sm font-black text-white">
                                                {tier.label || formatLotteryMoney(tier.amount, tierSymbol)}
                                            </h3>
                                            {isHot ? (
                                                <span className="shrink-0 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#241400]">
                                                    Hot
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 truncate text-[11px] font-semibold text-white/48">
                                            {tickets.toLocaleString()} ticket{tickets === 1 ? '' : 's'} minted
                                        </p>
                                    </div>
                                    <strong className="shrink-0 text-right text-sm font-black text-amber-100">
                                        {compactLotteryAmount(tierAmount)} {tierSymbol}
                                    </strong>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                    <span
                                        className="block h-full rounded-full bg-linear-to-r from-[#d97706] to-[#facc15] transition-[width] duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-white/48">
                                    <span>Last minute</span>
                                    <span className="truncate text-right text-white/68">
                                        +{compactLotteryAmount(growth.amount)} {tierSymbol} · +{growth.tickets || 0} tickets
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                    {tiers.length > visibleTiers.length ? (
                        <div className="grid min-h-[118px] place-items-center rounded-[1.05rem] border border-dashed border-white/12 bg-white/[0.025] p-4 text-center">
                            <p className="text-xs font-bold leading-5 text-white/55">
                                +{tiers.length - visibleTiers.length} more coupon tier{tiers.length - visibleTiers.length === 1 ? '' : 's'} live in the shop.
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
