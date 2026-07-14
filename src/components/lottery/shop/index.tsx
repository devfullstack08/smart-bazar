'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Clock3 } from 'lucide-react';
import LotteryShopHeader from './LotteryShopHeader';
import LotteryShopGuide from './LotteryShopGuide';
import LotteryCouponPurchasePanel from './LotteryCouponPurchasePanel';
import { STORAGE_KEYS } from '@/constants';
import { 
    lotteryApi,
    isCouponLotteryEvent,
    LotteryEvent
} from '@/lib/api/lotteryApi';

export interface LotteryShopViewProps {
    event: LotteryEvent | null;
    selectedEventParam: string | null;
    claimCount: number;
    onOpenStatus: () => void;
}

export default function LotteryShopView({
    event,
    selectedEventParam,
    claimCount,
    onOpenStatus,
}: LotteryShopViewProps) {
    const [tourTrigger, setTourTrigger] = useState(0);
    const [openCouponEvents, setOpenCouponEvents] = useState<LotteryEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load of open coupon draws
    useEffect(() => {
        let cancelled = false;
        async function fetchOpenCoupons() {
            try {
                const openLotteries = await lotteryApi.getOpenLotteries();
                if (cancelled) return;
                const openCoupons = openLotteries.filter((ev) => isCouponLotteryEvent(ev));
                setOpenCouponEvents(openCoupons);
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        void fetchOpenCoupons();
        return () => {
            cancelled = true;
        };
    }, []);

    // Sort coupon draws by drawTime
    const sortedOpenCoupons = useMemo(() => {
        return [...openCouponEvents].sort(
            (a, b) => new Date(a.drawTime).getTime() - new Date(b.drawTime).getTime(),
        );
    }, [openCouponEvents]);

    // Select focused draw
    const shopFocusEvent = useMemo(() => {
        if (!sortedOpenCoupons.length) return null;
        if (selectedEventParam) {
            const found = sortedOpenCoupons.find((ev) => ev._id === selectedEventParam);
            if (found) return found;
        }
        return sortedOpenCoupons[0];
    }, [selectedEventParam, sortedOpenCoupons]);

    const shopHeroEvent = shopFocusEvent ?? event;

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEYS.LOTTERY_SHOP_GUIDE_TOUR);
        if (!hasSeen) {
            setTourTrigger((prev) => prev + 1);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <>
            <LotteryShopHeader
                event={shopHeroEvent}
                claimCount={claimCount}
                onOpenStatus={onOpenStatus}
                onOpenHelp={() => setTourTrigger(prev => prev + 1)}
            />
            <main className="relative z-[1] mx-auto w-full max-w-[1360px] px-3 pb-[max(5rem,env(safe-area-inset-top,0px))] pt-2 sm:px-4 sm:pb-14 sm:pt-3 lg:px-6">

                {/* Choose a draw */}
                {sortedOpenCoupons.length > 1 ? (
                    <div className="mb-6 overflow-hidden rounded-[24px] border border-amber-500/15 bg-[#08080c]/90 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative backdrop-blur-xl">
                        {/* Background noise and glows */}
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />
                        
                        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse shrink-0" />
                                <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-amber-400">Active Draw Center</h2>
                            </div>
                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-white/30">
                                {sortedOpenCoupons.length} draws open
                            </span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-color:rgba(245,158,11,0.25)_transparent] [scrollbar-width:thin] sm:flex-wrap relative z-10">
                            {sortedOpenCoupons.map((ev) => {
                                const active = shopFocusEvent?._id === ev._id;
                                const isDrawing = ev.status === 'drawing' || ev.status === 'active';
                                return (
                                    <Link
                                        key={ev._id}
                                        href={`/lottery?view=shop&event=${encodeURIComponent(ev._id)}`}
                                        className={`group relative shrink-0 flex flex-col justify-between rounded-2xl border p-4 text-left transition duration-300 w-[240px] ${
                                            active
                                                ? 'border-amber-500/40 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1)_0%,transparent_60%),#0c0c11] shadow-[0_10px_30px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]'
                                                : 'border-white/5 bg-white/[0.015] hover:border-amber-500/35 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {/* Top dynamic line for active card */}
                                        <div className={`absolute inset-x-0 top-0 h-[2px] transition-all duration-300 ${
                                            active ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-60 group-hover:bg-amber-500/50'
                                        }`} />

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between w-full mb-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                                active
                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    : 'bg-white/5 border-white/10 text-white/50'
                                            }`}>
                                                <span className={`h-1 w-1 rounded-full ${isDrawing ? 'bg-amber-500 animate-pulse' : 'bg-amber-400'}`} />
                                                {isDrawing ? 'Live Now' : 'Upcoming'}
                                            </span>
                                            {active && (
                                                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-amber-400/60 bg-amber-500/5 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Stats */}
                                        <div className="space-y-1 mb-4">
                                            <h3 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors truncate">
                                                {ev.title}
                                            </h3>
                                            <p className="text-[9px] font-mono text-white/40 font-bold uppercase tracking-wider">
                                                Pool: <span className="text-white/80">{ev.couponTiers?.length || 0} packages</span>
                                            </p>
                                        </div>

                                        {/* Footer timing info */}
                                        <div className="border-t border-dashed border-white/10 pt-2.5 flex items-center justify-between text-[9px] font-bold text-white/50 font-mono">
                                            <div className="flex items-center gap-1">
                                                <Clock3 className="h-3 w-3 text-amber-400" />
                                                <span>DRAW TIME</span>
                                            </div>
                                            <span className="text-white/70 lowercase">
                                                {new Date(ev.drawTime).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: undefined,
                                                })}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {selectedEventParam && sortedOpenCoupons.length > 0 && !sortedOpenCoupons.some((ev) => ev._id === selectedEventParam) ? (
                    <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-400">
                        That draw isn&apos;t open for new tickets; showing the next available event instead.
                    </p>
                ) : null}

                <LotteryCouponPurchasePanel
                    event={shopHeroEvent}
                />
            </main>
            <LotteryShopGuide trigger={tourTrigger} onComplete={() => {}} />

            {/* Mobile sticky quick-buy CTA */}
            {shopHeroEvent && (
                <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:hidden">
                    <button
                        type="button"
                        onClick={() => {
                            const el = document.getElementById('shop-step-1');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] py-3.5 text-xs font-black uppercase tracking-widest text-[#050508] shadow-[0_-4px_24px_rgba(245,158,11,0.25),0_8px_20px_rgba(245,158,11,0.2)] active:scale-[0.97] transition-transform"
                    >
                        Buy Tickets Now →
                    </button>
                </div>
            )}
        </>
    );
}
