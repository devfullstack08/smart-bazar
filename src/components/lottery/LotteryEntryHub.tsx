'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Clock3, Ticket, Tv, Wallet } from 'lucide-react';
import { lotteryApi, isCouponLotteryEvent, type LotteryEvent, type LotteryWalletResponse } from '@/lib/api/lotteryApi';
import LotteryArenaTopBar from '@/components/lottery/arena/LotteryArenaTopBar';
import { LotteryHelpModal } from '@/components/lottery/arena/LotteryArenaModals';

function pad(n: number) {
    return String(n).padStart(2, '0');
}

function shell(children: React.ReactNode) {
    return (
        <div className="relative min-h-dvh overflow-hidden bg-transparent text-white px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-none fixed inset-0 z-0 opacity-40 [background:radial-gradient(circle,rgba(0,229,160,0.4)_0_2px,transparent_3px)_4%_7%/92px_92px,radial-gradient(circle,rgba(139,92,246,0.4)_0_2px,transparent_3px)_18%_16%/128px_128px,radial-gradient(circle,rgba(0,229,160,0.4)_0_2px,transparent_3px)_80%_8%/116px_116px,radial-gradient(circle,rgba(139,92,246,0.4)_0_2px,transparent_3px)_72%_24%/138px_138px]" />
            {children}
        </div>
    );
}

export default function LotteryEntryHub({ event }: { event: LotteryEvent }) {
    const [wallet, setWallet] = useState<LotteryWalletResponse | null>(null);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [helpOpen, setHelpOpen] = useState(false);
    const [clock, setClock] = useState(() => Date.now());
    const router = useRouter();

    useEffect(() => {
        if (
            !isCouponLotteryEvent(event) ||
            event.status === 'completed' ||
            event.status === 'cancelled'
        ) {
            router.replace('/lottery');
        }
    }, [event, router]);

    useEffect(() => {
        const id = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        let cancelled = false;
        lotteryApi
            .getLotteryWallet()
            .then((w) => {
                if (!cancelled) setWallet(w);
            })
            .catch(() => {
                if (!cancelled) setWallet(null);
            })
            .finally(() => {
                if (!cancelled) setLoadingWallet(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const countdown = useMemo(() => {
        if (!event.drawTime) return null;
        const ms = new Date(event.drawTime).getTime() - clock;
        if (ms <= 0) return { h: 0, m: 0, s: 0, expired: true as const };
        return {
            h: Math.floor(ms / (1000 * 60 * 60)),
            m: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
            s: Math.floor((ms % (1000 * 60)) / 1000),
            expired: false as const,
        };
    }, [clock, event.drawTime]);
    const tiers = (event.couponTiers || []).filter((t) => t.enabled !== false);
    const sym =
        wallet?.depositConfig?.tokenSymbol ||
        tiers[0]?.currencySymbol ||
        'USDT';
    const balance = wallet?.wallet?.availableBalance ?? null;

    const tierPreview = useMemo(() => {
        if (!tiers.length) return 'Tier pricing is being configured.';
        const labels = tiers.slice(0, 4).map((t) => t.label || `${t.amount} ${t.currencySymbol || sym}`);
        const extra = tiers.length > 4 ? ` +${tiers.length - 4} more` : '';
        return `${labels.join(' · ')}${extra}`;
    }, [sym, tiers]);

    if (!isCouponLotteryEvent(event)) {
        return null;
    }

    return shell(
        <>
            <LotteryArenaTopBar
                event={event}
                variant="hub"
                isMuted={false}
                onToggleMute={() => {}}
                onOpenHelp={() => setHelpOpen(true)}
            />
            <main className="relative z-[1] mx-auto w-[min(900px,calc(100%_-_2rem))] pb-16 pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                    <Ticket className="h-3.5 w-3.5" />
                    Lottery access
                </div>
                <h1 className="mt-4 text-[clamp(1.65rem,4vw,2.4rem)] font-black leading-tight tracking-tight text-white">
                    {event.title}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                    Choose the live draw room to watch the wheel, or open coupons to top up your lottery wallet and buy ticket tiers.{' '}
                    <span className="text-white/45">(This lobby is only for coupon lotteries. Package-based draws use the main arena after you buy a package.)</span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5">
                        <Clock3 className="h-4 w-4 text-cyan-300" />
                        {event.status === 'upcoming' && countdown && !countdown.expired
                            ? `Draw in ${pad(countdown.h)}:${pad(countdown.m)}:${pad(countdown.s)}`
                            : event.status === 'upcoming' && countdown?.expired
                                ? 'Draw time reached — open the room'
                                : event.status === 'active'
                                    ? 'Entries open — draw time scheduled'
                                    : event.status === 'drawing'
                                        ? 'Draw running now'
                                        : '—'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5">
                        Lottery wallet:{' '}
                        {loadingWallet ? (
                            <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/10" />
                        ) : balance !== null ? (
                            <strong className="text-amber-200">
                                {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {sym}
                            </strong>
                        ) : (
                            '—'
                        )}
                    </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/lottery?view=room"
                        className="group relative overflow-hidden rounded-[1.35rem] border border-fuchsia-400/35 bg-[linear-gradient(145deg,rgba(110,50,200,0.35),rgba(8,10,26,0.92))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:border-fuchsia-300/55"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-100">
                                <Tv className="h-6 w-6" />
                            </div>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                                {event.status === 'drawing' ? 'Live' : event.status === 'active' ? 'Open' : 'Arena'}
                            </span>
                        </div>
                        <h2 className="mt-4 text-xl font-black text-white">Enter lottery room</h2>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                            Countdown, wheel, winner reveal, and fairness proof — same arena experience as before.
                        </p>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-amber-200 group-hover:text-amber-100">
                            Open room →
                        </span>
                    </Link>

                    <Link
                        href="/lottery?view=shop"
                        className="group relative overflow-hidden rounded-[1.35rem] border border-amber-300/45 bg-[radial-gradient(circle_at_20%_20%,rgba(255,211,90,0.2),transparent_40%),linear-gradient(145deg,rgba(92,45,5,0.5),rgba(12,8,18,0.94))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:border-amber-200/65"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/50 bg-amber-300/15 text-amber-100">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/90">
                                Coupons
                            </span>
                        </div>
                        <h2 className="mt-4 text-xl font-black text-white">Buy coupons & top up</h2>
                        <p className="mt-2 text-sm leading-6 text-white/65">
                            Send funds to the deposit address (with verification), then purchase one or more tier tickets.{' '}
                            <span className="font-semibold text-amber-100/90">{tierPreview}</span>
                        </p>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-amber-100 group-hover:text-white">
                            Open purchase →
                        </span>
                    </Link>
                </div>
            </main>
            {helpOpen ? <LotteryHelpModal onClose={() => setHelpOpen(false)} /> : null}
        </>,
    );
}
