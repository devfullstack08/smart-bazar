'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    ArrowRight,
    CalendarDays,
    CircleDot,
    Clock,
    Trophy,
} from 'lucide-react';
import { lotteryApi, LotteryEntry, LotteryEvent, isCouponLotteryEvent } from '@/lib/api/lotteryApi';
import { useLotteryFeatureGate } from '@/hooks/useLotteryFeatureGate';

const TICK_MS = 1000;
function formatCountdown(target: string) {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return null;
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function formatDrawTime(value: string) {
    return new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function DemoWheelPreview({ centerLabel }: { centerLabel: string }) {
    return (
        <div className="relative mx-auto flex h-[3.6rem] w-[3.6rem] items-center justify-center sm:h-[4.2rem] sm:w-[4.2rem] lg:h-[5rem] lg:w-[5rem]">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(0,229,160,0.18),transparent_64%)] blur-[8px]" />
            <div className="pointer-events-none absolute left-1/2 top-0 z-[2] h-0 w-0 -translate-x-1/2 border-x-[4px] border-b-[7px] border-x-transparent border-b-[var(--pw-primary)] drop-shadow-[0_0_6px_rgba(0,229,160,0.75)] sm:border-x-[5px] sm:border-b-[9px]" />
            <div
                className="relative h-full w-full rounded-full border-[2px] border-[var(--pw-primary)]/40 shadow-[0_0_0_1px_rgba(0,229,160,0.2),0_8px_18px_rgba(0,0,0,0.36),inset_0_0_14px_rgba(0,229,160,0.15)] sm:border-[3px]"
                style={{
                    background:
                        'conic-gradient(from -90deg, #12121a 0deg 90deg, #1a1a24 90deg 180deg, #0f0f15 180deg 270deg, #0c0c10 270deg 360deg)',
                    animation: 'spin 12s linear infinite',
                }}
            >
                <div className="absolute inset-[9%] rounded-full border border-[var(--pw-primary)]/20" />
                <div className="absolute inset-0 rounded-full opacity-60 [background:repeating-conic-gradient(from_-90deg,transparent_0deg_88deg,rgba(0,229,160,0.2)_88deg_90deg)]" />
                <div className="absolute inset-[28%] rounded-full border border-[var(--pw-primary)]/50 bg-[#0c0c10] shadow-[inset_0_0_10px_rgba(0,229,160,0.2)]">
                    <div className="flex h-full w-full flex-col items-center justify-center text-center">
                        <Trophy className="h-3 w-3 text-[var(--pw-primary)] sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                        <span className="mt-0.5 text-[0.28rem] font-black uppercase tracking-[0.14em] text-[#34F5B8] sm:text-[0.34rem] lg:text-[0.38rem]">
                            {centerLabel}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusShell({
    badge,
    headline,
    headlineAccent,
    subtitle,
    cta,
    href,
    disabled,
    eyebrow,
    countdown,
    chips,
    wheelCenterLabel,
    showTrophyOnCta,
    secondaryCta,
    secondaryHref,
}: {
    badge: string;
    headline: string;
    headlineAccent?: string;
    subtitle: string;
    cta: string;
    href: string;
    accent: 'amber' | 'emerald' | 'cyan';
    disabled?: boolean;
    eyebrow?: string;
    countdown?: string | null;
    chips?: Array<{ label: string; value: string }>;
    wheelCenterLabel?: string;
    showTrophyOnCta?: boolean;
    /** v2 coupon flow: second tap target (e.g. shop / wallet top-up) */
    secondaryCta?: string;
    secondaryHref?: string;
}) {
    const timeParts = countdown
        ? countdown.match(/\d+/g)?.slice(0, 3).map((part) => part.padStart(2, '0')) ?? null
        : null;
    const wheelLabel = wheelCenterLabel ?? 'Live';
    const primaryChip = chips?.[0];
    const secondaryChip = chips?.[1];
    const compactCountdown = timeParts && timeParts.length >= 3 ? `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}` : countdown;

    return (
        <section className="w-full relative z-10">
            <div className="relative w-full overflow-hidden rounded-2xl glass-card transition-ui hover-lift-sm border border-[var(--pw-primary)]/20 hover:border-[var(--pw-primary)]/40 hover:shadow-glow">
                {/* Background glow effects matching Smart Bazar vibes */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[var(--pw-primary)]/10 blur-[60px]" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-[var(--pw-secondary)]/10 blur-[60px]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--pw-primary)]/5 via-transparent to-[var(--pw-secondary)]/5" />

                <div className="relative px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
                    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-4 lg:grid-cols-[5.75rem_minmax(0,1fr)_auto]">
                        <div className="relative flex items-center justify-center">
                            <DemoWheelPreview centerLabel={wheelLabel} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pw-primary)]/30 bg-[var(--pw-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--pw-primary)] sm:px-2.5 sm:text-[10px]">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pw-primary)] shadow-[0_0_8px_var(--pw-primary)] animate-pulse" />
                                    <span>{badge}</span>
                                </span>
                                {eyebrow ? (
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-[10px]">
                                        {eyebrow}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-0.5">
                                <h3 className="text-[0.85rem] font-bold uppercase tracking-tight text-[var(--foreground)] sm:text-[1rem] lg:text-[1.1rem]">
                                    {headline}
                                </h3>
                                {headlineAccent ? (
                                    <span className="bg-gradient-to-r from-[var(--pw-primary)] to-[var(--pw-secondary)] bg-clip-text text-[0.7rem] font-bold uppercase tracking-wide text-transparent sm:text-[0.8rem] lg:text-[0.9rem]">
                                        {headlineAccent}
                                    </span>
                                ) : null}
                            </div>

                            <p className="mt-1 max-w-[42ch] truncate text-[9px] text-[var(--muted)] sm:text-[10px] lg:text-[11px]">
                                {subtitle}
                            </p>

                            <div className="mt-2.5 flex flex-wrap gap-2">
                                {primaryChip ? (
                                    <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/5 bg-[var(--surface)] px-2 py-1.5">
                                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--pw-secondary-light)]" />
                                        <div className="min-w-0">
                                            <div className="text-[6px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-[7px]">
                                                {primaryChip.label}
                                            </div>
                                            <div className="truncate text-[9px] font-semibold text-[var(--foreground)] sm:text-[10px]">
                                                {primaryChip.value}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {secondaryChip ? (
                                    <div className="hidden min-w-0 items-center gap-1.5 rounded-lg border border-white/5 bg-[var(--surface)] px-2 py-1.5 sm:inline-flex">
                                        <CircleDot className="h-3.5 w-3.5 shrink-0 text-[var(--pw-secondary-light)]" />
                                        <div className="min-w-0">
                                            <div className="text-[6px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-[7px]">
                                                {secondaryChip.label}
                                            </div>
                                            <div className="truncate text-[9px] font-semibold text-[var(--foreground)] sm:text-[10px]">
                                                {secondaryChip.value}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-[var(--pw-primary)]/20 bg-[var(--pw-primary)]/5 px-2 py-1.5">
                                    {compactCountdown ? (
                                        <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--pw-primary)]" />
                                    ) : (
                                        <Trophy className="h-3.5 w-3.5 shrink-0 text-[var(--pw-primary)]" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-[6px] font-medium uppercase tracking-wider text-[var(--pw-primary)] sm:text-[7px]">
                                            {compactCountdown ? 'Countdown' : 'Status'}
                                        </div>
                                        <div className="truncate text-[9px] font-bold text-[var(--foreground)] sm:text-[10px]">
                                            {compactCountdown || 'Results live'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-3 flex justify-stretch sm:col-span-1 sm:mt-0 sm:justify-end">
                            {disabled ? (
                                <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white/40 sm:w-auto sm:text-[10px]">
                                    {cta}
                                </span>
                            ) : (
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                                    <Link
                                        href={href}
                                        className="btn btn-primary w-full sm:w-auto px-4 py-2"
                                    >
                                        {showTrophyOnCta ? (
                                            <Trophy className="h-4 w-4 shrink-0" />
                                        ) : null}
                                        {cta}
                                        <ArrowRight className="h-4 w-4 shrink-0" />
                                    </Link>
                                    {secondaryCta && secondaryHref ? (
                                        <Link
                                            href={secondaryHref}
                                            className="btn btn-glass w-full sm:w-auto px-4 py-2"
                                        >
                                            {secondaryCta}
                                            <ArrowRight className="h-4 w-4 shrink-0" />
                                        </Link>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface LotteryStatusBannerProps {
    event?: LotteryEvent | null;
    entry?: LotteryEntry | null;
    autoLoad?: boolean;
}

export default function LotteryStatusBanner({ event: eventProp, entry: entryProp, autoLoad = true }: LotteryStatusBannerProps) {
    const { lotteryEnabled, loading: featureLoading } = useLotteryFeatureGate();
    const [loadedEvent, setLoadedEvent] = useState<LotteryEvent | null>(null);
    const [, forceTick] = useState(0);

    useEffect(() => {
        if (!lotteryEnabled || eventProp !== undefined || !autoLoad) return;
        let cancelled = false;
        lotteryApi
            .getActiveLottery()
            .then((lottery) => {
                if (cancelled) return;
                setLoadedEvent(lottery || null);
            })
            .catch(() => {
                if (cancelled) return;
                setLoadedEvent(null);
            });
        return () => {
            cancelled = true;
        };
    }, [autoLoad, eventProp, lotteryEnabled]);

    const event = lotteryEnabled
        ? eventProp !== undefined ? eventProp : loadedEvent
        : null;
    const entry = entryProp ?? null;

    useEffect(() => {
        if (!event) return;
        const id = window.setInterval(() => forceTick((t) => t + 1), TICK_MS);
        return () => window.clearInterval(id);
    }, [event]);

    if (featureLoading || !lotteryEnabled || !event) return null;

    const couponEvent = isCouponLotteryEvent(event);
    const lobbyHref = '/lottery';

    if (event.status === 'completed') {
        return (
            <StatusShell
                badge="Last Lottery"
                headline="Winners are live"
                headlineAccent="On the lottery page"
                subtitle={`Drawn at ${new Date(event.drawTime).toLocaleString()}. Visible for 24h.`}
                cta="Enter Lobby"
                href={lobbyHref}
                accent="amber"
                eyebrow="Sticky results"
                wheelCenterLabel="Winners"
                showTrophyOnCta
                chips={[
                    { label: 'Draw date', value: formatDrawTime(event.drawTime) },
                    { label: 'Status', value: 'Winners on stage' },
                ]}
            />
        );
    }

    if (event.status === 'upcoming') {
        const opensIn = formatCountdown(event.entryStartTime);
        return (
            <StatusShell
                badge="Upcoming Lottery"
                headline="Next draw incoming"
                headlineAccent={event.title}
                subtitle={
                    opensIn
                        ? couponEvent
                            ? `Doors open in ${opensIn} — the lobby will guide coupon and top-up actions.`
                            : `Doors open in ${opensIn} — the lobby will guide package-entry actions.`
                        : 'Warm-up — doors open shortly.'
                }
                cta="Enter Lobby"
                href={lobbyHref}
                accent="cyan"
                eyebrow="Warm-up window"
                countdown={opensIn}
                wheelCenterLabel="Soon"
                chips={[
                    { label: 'Entry opens', value: formatDrawTime(event.entryStartTime) },
                    { label: 'Draw time', value: formatDrawTime(event.drawTime) },
                ]}
            />
        );
    }

    if (entry) {
        return (
            <StatusShell
                badge="Tonight's Lottery"
                headline="You're in the draw"
                headlineAccent={`Ticket ${entry.lotteryNumber}`}
                subtitle={`Draw time: ${new Date(event.drawTime).toLocaleString()}`}
                cta="Enter Lobby"
                href={lobbyHref}
                accent="amber"
                eyebrow="Ticket locked"
                countdown={formatCountdown(event.drawTime)}
                wheelCenterLabel="In"
                showTrophyOnCta={false}
                chips={[
                    { label: 'Ticket', value: entry.lotteryNumber },
                    { label: 'Draw time', value: formatDrawTime(event.drawTime) },
                ]}
            />
        );
    }

    return (
        <StatusShell
            badge="Live Lottery"
            headline="Arena is open"
            headlineAccent={event.title}
            subtitle={
                couponEvent
                    ? `Draw at ${new Date(event.drawTime).toLocaleString()}. Enter the lobby to choose room or coupon/top-up.`
                    : `Draw at ${new Date(event.drawTime).toLocaleString()}. Enter the lobby for the package-entry room.`
            }
            cta="Enter Lobby"
            href={lobbyHref}
            accent="emerald"
            eyebrow="Arena open"
            countdown={formatCountdown(event.drawTime)}
            wheelCenterLabel="Live"
            chips={[
                { label: 'Draw time', value: formatDrawTime(event.drawTime) },
                { label: 'Entry mode', value: couponEvent ? 'Coupon tiers' : 'Package based' },
            ]}
        />
    );
}
