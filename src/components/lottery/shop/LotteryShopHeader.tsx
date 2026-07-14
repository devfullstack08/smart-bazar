'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LayoutGrid, HelpCircle, Tv, Search, Clock3 } from 'lucide-react';
import type { LotteryEvent } from '@/lib/api/lotteryApi';

export default function LotteryShopHeader({
    event,
    claimCount,
    onOpenStatus,
    onOpenHelp,
}: {
    event: LotteryEvent | null;
    claimCount: number;
    onOpenStatus: () => void;
    onOpenHelp: () => void;
}) {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-[3] mx-auto w-full max-w-[1360px] px-3 pb-2 pt-[max(0.85rem,env(safe-area-inset-top,0px))] sm:px-4 lg:px-6">
            <div className="rounded-[24px] border border-amber-500/20 bg-[#0c0c10]/95 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl relative overflow-hidden group">
                {/* Background glow overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
                
                <div className="relative flex items-center justify-between gap-2 z-10">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-white/70 transition-all hover:border-amber-500/30 hover:bg-white/[0.09] hover:text-white w-10 h-10"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="h-[18px] w-[18px]" />
                        </button>
                        <Link
                            href="/lottery"
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-white/70 transition-all hover:border-amber-500/30 hover:bg-white/[0.09] hover:text-white w-10 h-10"
                            aria-label="Open lottery lobby"
                        >
                            <LayoutGrid className="h-[18px] w-[18px]" />
                        </Link>
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">Coupon Shop</p>
                        <h1 className="truncate text-sm font-black text-white sm:text-base">{event?.title || 'Lottery coupons'}</h1>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenHelp}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition-all hover:border-amber-500/30 hover:bg-white/[0.09] hover:text-white !w-10 !h-10 !p-0"
                        aria-label="How the lottery works"
                    >
                        <HelpCircle className="h-[18px] w-[18px]" />
                    </button>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 relative.5 z-10">
                    <Link
                        href={`/lottery?view=room${event?._id ? `&event=${encodeURIComponent(event._id)}` : ''}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 text-xs font-black uppercase tracking-widest text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)] transition hover:border-amber-500/50 hover:bg-amber-500/15"
                    >
                        <Tv className="h-4 w-4" />
                        Live room
                    </Link>
                    <button
                        type="button"
                        onClick={onOpenStatus}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70 transition-all hover:border-amber-500/30 hover:bg-white/[0.09] hover:text-white !min-h-10"
                    >
                        <Search className="h-4 w-4" />
                        Status
                        {claimCount > 0 ? (
                            <span className="font-mono font-black rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] leading-none text-[#050508] shadow-[0_0_8px_rgba(245,158,11,0.4)]">{claimCount}</span>
                        ) : null}
                    </button>
                </div>

                {event?.drawTime ? (
                    <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 relative z-10">
                        <Clock3 className="h-3.5 w-3.5 text-amber-400/70" />
                        <span className="truncate">
                            Draw:{' '}
                            <span className="font-mono text-[11px] font-bold text-white/80 lowercase">
                                {new Date(event.drawTime).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                             </span>
                        </span>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
