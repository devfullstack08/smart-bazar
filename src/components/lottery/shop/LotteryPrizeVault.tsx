'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LotteryCouponPoolSummary, LotteryCouponTier } from '@/lib/api/lotteryApi';
import { compactLotteryAmount, formatLotteryMoney, toFiniteLotteryAmount } from '../lotteryMoney';

type PoolAnimationMode = 'full' | 'reduced';

export default function LotteryPrizeVault({
    tiers,
    couponPools,
    boost,
    tierGrowth = {},
    hotTierId,
    lastActivity,
    heartbeatId,
}: {
    tiers: LotteryCouponTier[];
    couponPools?: LotteryCouponPoolSummary;
    boost?: { id: string; amount: number; symbol: string; quantity?: number; tierId?: string; tierLabel?: string; buyerName?: string; milestone?: number } | null;
    tierGrowth?: Record<string, { amount: number; tickets: number }>;
    hotTierId?: string | null;
    lastActivity?: { id: string; buyerName: string; amount: number; symbol: string; quantity: number; tierLabel?: string } | null;
    heartbeatId?: string | null;
}) {
    const activeTiers = tiers.filter((tier) => tier.enabled !== false);
    const [animationMode, setAnimationMode] = useState<PoolAnimationMode>('full');

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncMode = () => {
            const nav = navigator as Navigator & { deviceMemory?: number };
            const lowHardware = (navigator.hardwareConcurrency || 8) <= 4 || Number(nav.deviceMemory || 8) <= 4;
            const compactScreen = window.innerWidth < 520;
            setAnimationMode(mq.matches || lowHardware || compactScreen ? 'reduced' : 'full');
        };
        syncMode();
        const fn = () => syncMode();
        mq.addEventListener('change', fn);
        window.addEventListener('resize', fn, { passive: true });
        return () => {
            mq.removeEventListener('change', fn);
            window.removeEventListener('resize', fn);
        };
    }, []);

    const fallbackSymbol = activeTiers[0]?.currencySymbol || 'USDT';
    const totalAmount = toFiniteLotteryAmount(couponPools?.totalAmount ?? activeTiers.reduce((sum, tier) => sum + toFiniteLotteryAmount(tier.poolAmount), 0));
    const totalTickets = toFiniteLotteryAmount(couponPools?.totalTickets ?? activeTiers.reduce((sum, tier) => sum + toFiniteLotteryAmount(tier.poolTicketCount), 0));
    const poolByTier = couponPools?.byTier || {};
    const isPoolWise = activeTiers.some((tier) => tier.prizeMode === 'pool_percentage');
    const showBoost = isPoolWise && boost && toFiniteLotteryAmount(boost.amount) > 0;
    const computedHotTierId = hotTierId ?? Object.entries(tierGrowth).reduce((best, [tierId, growth]) => {
        return toFiniteLotteryAmount(growth.amount) > toFiniteLotteryAmount(best.amount) ? { tierId, amount: growth.amount } : best;
    }, { tierId: '', amount: 0 }).tierId;
    const recentTicketCount = showBoost && boost.quantity ? boost.quantity : lastActivity?.quantity || 0;
    const maxTierAmount = Math.max(1, ...activeTiers.map((tier) => {
        const pool = poolByTier[tier.tierId];
        return toFiniteLotteryAmount(pool?.totalAmount ?? tier.poolAmount);
    }));
    const fullNoteCount = boost?.milestone ? 22 : 14;
    const noteCount = showBoost
        ? animationMode === 'reduced'
            ? Math.max(6, Math.ceil(fullNoteCount * 0.48))
            : fullNoteCount
        : 0;
    const portalTarget = typeof document === 'undefined' ? null : document.body;
    const cinema = showBoost ? (
        <div
            key={boost.id}
            className={`lottery-pool-cinema ${boost.milestone ? 'lottery-pool-cinema--milestone' : ''} ${animationMode === 'reduced' ? 'lottery-pool-cinema--reduced' : ''}`}
            aria-hidden="true"
        >
            <div className="lottery-pool-cinema__backdrop" />
            <div className="lottery-pool-cinema__rig">
                <Image className="lottery-pool-cinema__piggy" src="/assets/images/lottery/prize-piggy-bank.png" alt="" width={520} height={520} unoptimized />
                <Image className="lottery-pool-cinema__pile" src="/assets/images/lottery/cash-pile.png" alt="" width={260} height={180} unoptimized />
                {Array.from({ length: noteCount }, (_, index) => (
                    <Image
                        key={`${boost.id}-${index}`}
                        className={`lottery-pool-cinema__note lottery-pool-cinema__note--${(index % 7) + 1}`}
                        src="/assets/images/lottery/money-note.png"
                        alt=""
                        width={120}
                        height={58}
                        unoptimized
                    />
                ))}
                <div className="lottery-pool-cinema__boost">+{formatLotteryMoney(boost.amount, boost.symbol)}</div>
                {boost.milestone ? (
                    <div className="lottery-pool-cinema__milestone">
                        Pool crossed {formatLotteryMoney(boost.milestone, boost.symbol)}
                    </div>
                ) : null}
            </div>
        </div>
    ) : null;

    if (!activeTiers.length) return null;

    return (
        <section 
            className="relative block overflow-hidden rounded-[1.05rem] border p-[0.9rem] min-[900px]:p-[1.2rem] shadow-[0_24px_64px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)]"
            style={{
                borderColor: 'rgba(120, 244, 214, 0.18)',
                background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 36%), radial-gradient(circle at 16% 0%, rgba(52, 211, 153, 0.18), transparent 34%), radial-gradient(circle at 92% 8%, rgba(56, 189, 248, 0.13), transparent 32%), linear-gradient(145deg, rgba(4, 20, 19, 0.98), rgba(4, 10, 15, 0.99))'
            }}
            aria-label="Lottery coupon pool vault"
        >
            <div className="relative z-[1] flex min-w-0 flex-col gap-[0.85rem]">
                <div className="flex min-w-0 items-start justify-between gap-[0.85rem]">
                    <div>
                        <p className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-emerald-200/90">{isPoolWise ? 'Live pool reserve' : 'Smart Bazar ticket reserve'}</p>
                        <h2 
                            className="mt-[0.28rem] text-[clamp(1.95rem,9.6vw,3.6rem)] max-sm:text-[clamp(1.82rem,13vw,2.85rem)] font-[950] leading-[0.96] text-slate-50"
                            style={{ textShadow: '0 0 28px rgba(52, 211, 153, 0.22)' }}
                        >
                            {formatLotteryMoney(totalAmount, fallbackSymbol)}
                        </h2>
                    </div>
                    <div className="relative inline-flex min-h-8 shrink-0 items-center gap-[0.45rem] rounded-full border border-emerald-200/22 bg-[#022c22]/58 px-[0.7rem] text-[0.68rem] font-black uppercase tracking-[0.08em] text-emerald-100/90 max-sm:min-h-[1.8rem] max-sm:px-[0.55rem] max-sm:text-[0.62rem]" key={heartbeatId || 'idle'}>
                        <span className="relative block h-[0.48rem] w-[0.48rem] rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(134,239,172,0.7)]">
                            {heartbeatId ? (
                                <span 
                                    className="absolute inset-[-0.42rem] rounded-full border border-emerald-300/58"
                                    style={{ animation: 'lottery-pool-heartbeat 1100ms ease-out both' }}
                                />
                            ) : null}
                        </span>
                        <strong>Live</strong>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[0.78rem] text-slate-300/64">
                    <span>{totalTickets.toLocaleString()} ticket{totalTickets === 1 ? '' : 's'} joined</span>
                    {recentTicketCount > 0 ? (
                        <strong className="rounded-full bg-teal-500/14 px-[0.55rem] py-[0.28rem] text-[0.72rem] font-bold text-teal-100/95" key={`${boost?.id || lastActivity?.id || 'tickets'}-tickets`}>+{recentTicketCount} ticket{recentTicketCount === 1 ? '' : 's'} minted</strong>
                    ) : null}
                </div>
                {lastActivity ? (
                    <div 
                        className="flex min-w-0 flex-wrap items-center gap-[0.42rem] rounded-[0.82rem] border border-teal-300/14 bg-[#0f172a]/32 px-[0.68rem] py-[0.58rem] text-[0.78rem] text-slate-300/72" 
                        style={{ animation: 'lottery-pool-ticker-pop 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both' }}
                        key={lastActivity.id}
                    >
                        <span className="font-black text-white">{lastActivity.buyerName}</span>
                        <strong className="font-bold text-emerald-200">added +{formatLotteryMoney(lastActivity.amount, lastActivity.symbol)}</strong>
                        <em className="not-italic rounded-full bg-white/8 px-[0.42rem] py-[0.18rem] text-[0.68rem] font-black text-white/58">{lastActivity.quantity} ticket{lastActivity.quantity === 1 ? '' : 's'}</em>
                    </div>
                ) : null}
                <div className="grid gap-[0.55rem] max-h-[10.8rem] overflow-y-auto overscroll-contain pr-[0.15rem] [scrollbar-width:thin] [scrollbar-color:rgba(94,234,212,0.4)_transparent] min-[900px]:grid-cols-2 min-[900px]:max-h-none min-[900px]:overflow-visible">
                    {activeTiers.map((tier) => {
                        const pool = poolByTier[tier.tierId];
                        const amount = toFiniteLotteryAmount(pool?.totalAmount ?? tier.poolAmount);
                        const tickets = toFiniteLotteryAmount(pool?.ticketCount ?? tier.poolTicketCount);
                        const growth = tierGrowth[tier.tierId] || { amount: 0, tickets: 0 };
                        const progress = Math.max(4, Math.min(100, (Number(amount || 0) / maxTierAmount) * 100));
                        const isHot = computedHotTierId === tier.tierId && growth.amount > 0;
                        return (
                            <article 
                                key={tier.tierId} 
                                className={`grid grid-cols-[minmax(0,1fr)_auto] max-sm:grid-cols-1 items-center gap-[0.75rem] border rounded-[0.82rem] px-[0.72rem] py-[0.68rem] transition-all duration-300 ${
                                    isHot 
                                        ? 'border-amber-500/38 bg-gradient-to-r from-amber-500/12 to-transparent bg-[#0f172a]/40 shadow-[0_0_20px_rgba(245,158,11,0.06)]' 
                                        : 'border-slate-400/14 bg-[#0f172a]/38'
                                }`}
                            >
                                <div>
                                    <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-[0.8rem] font-black text-slate-50/92">
                                        {tier.label || `${tier.amount} ${tier.currencySymbol || fallbackSymbol}`}
                                        {isHot ? <span className="rounded-full bg-yellow-400 px-[0.38rem] py-[0.12rem] text-[0.58rem] font-[950] tracking-[0.08em] text-[#422006] uppercase">Hot</span> : null}
                                    </p>
                                    <p className="mt-[0.14rem] text-[0.68rem] text-slate-300/58">
                                        {tickets} ticket{tickets === 1 ? '' : 's'} · +{compactLotteryAmount(growth.amount)} {tier.currencySymbol || fallbackSymbol} last min
                                    </p>
                                    <div className="mt-2 h-[0.34rem] overflow-hidden rounded-full bg-white/8">
                                        <i 
                                            className="block h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-yellow-400 shadow-[0_0_16px_rgba(45,212,191,0.22)]"
                                            style={{ width: `${progress}%`, transition: 'width 520ms cubic-bezier(0.2, 0.9, 0.2, 1)' }} 
                                        />
                                    </div>
                                </div>
                                <strong className="shrink-0 text-[0.82rem] font-bold text-teal-100 whitespace-nowrap max-sm:justify-self-start">{compactLotteryAmount(amount)} {tier.currencySymbol || fallbackSymbol}</strong>
                            </article>
                        );
                    })}
                </div>
            </div>
            {portalTarget && cinema ? createPortal(cinema, portalTarget) : null}
        </section>
    );
}
