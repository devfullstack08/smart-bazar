'use client';

import { Award, Clock3, Flame, Sparkles, Ticket, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { LotteryPageMedia, LotteryReward, LotteryWinnerConfig } from '@/lib/api/lotteryApi';
import { pad, rewardValueLabel } from '@/components/lottery/lotteryFormat';
import { getFileUrl } from '@/lib/utils/file';

export interface LotteryBannerCountdown {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
}

interface BannerMediaItem {
    type: string;
    value: string;
    label?: string;
}

interface LotteryBannerSectionProps {
    event?: { description?: string };
    countdown?: LotteryBannerCountdown | null;
    countdownLabel?: string;
    topPrize?: (LotteryWinnerConfig & { reward: LotteryReward }) | null;
    activeBannerSlide: number;
    bannerMediaItems: BannerMediaItem[];
    isEntryLocked?: boolean;
}

const formatCountdown = (cd: LotteryBannerCountdown) =>
    `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;

const truncatePrize = (label: string) =>
    label.length > 36 ? `${label.slice(0, 33)}…` : label;


export function BannerMediaSlide({ media, index }: { media: LotteryPageMedia; index: number }) {
    const label = media.label || `Lottery media ${index + 1}`;

    if (media.type === 'video') {
        return (
            <video
                src={getFileUrl(media.value)}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={label}
                className="h-full w-full object-cover"
            />
        );
    }

    return <img src={getFileUrl(media.value)} alt={label} className="h-full w-full object-cover" />;
}


export default function LotteryBannerSection({
    event,
    countdown,
    countdownLabel = 'Draw closes in',
    topPrize,
    activeBannerSlide,
    bannerMediaItems,
    isEntryLocked = false,
}: LotteryBannerSectionProps) {
    const showCountdown = countdown && countdown.totalMs > 0;
    const introIsActive = activeBannerSlide === 0;
    const slideBase =
        'absolute inset-0 z-[1] pointer-events-none scale-[1.025] opacity-0 transition-[opacity,transform] duration-700 ease-out';
    const slideActive = 'pointer-events-auto scale-100 opacity-100';
    const urgencyBadge = showCountdown
        ? countdown!.totalMs <= 10 * 60 * 1000
            ? 'Final minutes'
            : countdown!.totalMs <= 60 * 60 * 1000
                ? 'Closing this hour'
                : 'Live jackpot window'
        : isEntryLocked
            ? 'Winner stage live'
            : 'Next room loading';

    return (
        <section className="relative min-h-[300px] overflow-hidden rounded-[1.9rem] border border-amber-300/25 bg-[radial-gradient(circle_at_15%_22%,rgba(255,138,31,0.26),transparent_24%),radial-gradient(circle_at_24%_30%,rgba(184,44,255,0.5),transparent_38%),radial-gradient(circle_at_84%_18%,rgba(255,211,90,0.22),transparent_20%),linear-gradient(102deg,rgba(32,12,0,0.96),rgba(30,8,53,0.96)_34%,rgba(13,8,32,0.98)_62%,rgba(58,12,77,0.98))] shadow-[0_36px_120px_rgba(0,0,0,0.52),inset_0_0_44px_rgba(255,211,90,0.09)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-6 left-6 w-px bg-gradient-to-b from-transparent via-amber-200/35 to-transparent" />
                <div className="absolute inset-y-6 right-6 w-px bg-gradient-to-b from-transparent via-amber-200/20 to-transparent" />
                <div className="absolute inset-0 opacity-65 [background:radial-gradient(circle,rgba(255,211,90,0.9)_0_4px,transparent_5px)_74%_30%/86px_86px,radial-gradient(circle,rgba(255,138,31,0.9)_0_4px,transparent_5px)_54%_16%/74px_74px,radial-gradient(circle,rgba(255,255,255,0.75)_0_1px,transparent_2px)_36%_30%/42px_42px]" />
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/85 to-transparent" />
                <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />
                <div className="absolute -bottom-[120%] -right-[12%] aspect-square w-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,211,90,0.36),transparent_62%)] blur-[8px]" />
                <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
                    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-rose-200/30 bg-[linear-gradient(135deg,rgba(255,112,79,0.2),rgba(91,0,20,0.55))] px-3 py-1.5 shadow-[0_18px_48px_-30px_rgba(255,112,79,0.7)] backdrop-blur">
                        <Flame className="h-4 w-4 text-amber-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                            {urgencyBadge}
                        </span>
                    </div>
                    {topPrize ? (
                        <div className="pointer-events-auto inline-flex max-w-[80vw] items-center gap-2 rounded-full border border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.24),rgba(0,0,0,0.68))] px-3 py-1.5 shadow-[0_18px_48px_-30px_rgba(251,191,36,0.7)] backdrop-blur sm:max-w-none">
                            <Award className="h-4 w-4 text-amber-200" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100">
                                Grand Prize
                            </span>
                            <span className="truncate text-xs font-black text-white sm:text-sm">
                                {truncatePrize(rewardValueLabel(topPrize.reward))}
                            </span>
                        </div>
                    ) : null}

                    {showCountdown ? (
                        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 backdrop-blur">
                            <Clock3 className="h-4 w-4 text-cyan-300" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-200">
                                {countdownLabel}
                            </span>
                            <span className="font-mono text-xs font-black text-white sm:text-sm">
                                {formatCountdown(countdown!)}
                            </span>
                        </div>
                    ) : isEntryLocked ? (
                        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-amber-100 backdrop-blur">
                            <Clock3 className="h-4 w-4 text-amber-200" />
                            <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                                {countdownLabel}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>

            <article
                className={`${slideBase} grid grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] items-center gap-[clamp(1rem,3vw,3rem)] bg-[radial-gradient(circle_at_74%_52%,rgba(255,211,90,0.26),transparent_24%),radial-gradient(circle_at_24%_30%,rgba(184,44,255,0.5),transparent_38%),linear-gradient(102deg,rgba(32,12,0,0.96),rgba(30,8,53,0.96)_34%,rgba(13,8,32,0.98)_62%,rgba(58,12,77,0.98))] p-[clamp(1.55rem,4vw,3.4rem)] max-md:grid-cols-1 ${introIsActive ? slideActive : ''}`}
            >
                <div className="relative z-[1] flex flex-col justify-center">
                    <div className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_both]' : ''} inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100`}>
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        Live jackpot arena
                    </div>
                    <span className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_80ms_both]' : ''} mt-5 block text-[clamp(0.98rem,1.8vw,1.35rem)] font-black uppercase leading-none tracking-[0.32em] text-white/72`}>
                        Exclusive draw night
                    </span>
                    <h2 className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_140ms_both]' : ''} mt-2 bg-[linear-gradient(180deg,#fffce5_0%,#ffe89a_18%,#ffd35a_44%,#ff922e_100%)] bg-clip-text text-[clamp(2.95rem,6.8vw,5.8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em] text-transparent drop-shadow-[0_12px_34px_rgba(255,138,31,0.22)]`}>
                        Golden Jackpot
                        <span className="block mt-2 text-[clamp(1.1rem,2vw,1.6rem)] font-semibold tracking-normal">
                      Your Golden Opportunity Starts Now!</span>
                    </h2>
                    <p className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_240ms_both]' : ''} mt-4 max-w-xl text-[clamp(0.96rem,1.45vw,1.14rem)] font-medium leading-7 text-white/74`}>
                        {event?.description || 'Step into the VIP winner arena, lock your ticket, and compete for premium rewards staged like a headline event.'}
                    </p>
                    <div className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_320ms_both]' : ''} mt-7 flex flex-wrap gap-3 text-sm font-black uppercase`}>
                        <span className="rounded-full border border-amber-300/35 bg-amber-300/12 px-3 py-1.5 text-amber-100">
                            Real winners
                        </span>
                        <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
                            Live countdown
                        </span>
                        <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 px-3 py-1.5 text-fuchsia-100">
                            Premium rewards
                        </span>
                    </div>
                </div>
                <div className={`${introIsActive ? '[animation:lottery-banner-copy-in_720ms_cubic-bezier(0.2,0.9,0.2,1)_360ms_both]' : ''} relative z-[1] justify-self-end overflow-hidden rounded-[1.6rem] border border-amber-200/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur max-md:justify-self-start`}>
                    <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/75 to-transparent" />
                    <div className="grid gap-4">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/44">
                                VIP room promise
                            </div>
                            <div className="mt-2 text-2xl font-black leading-tight text-white">
                                Every ticket earns
                                <span className="block text-amber-200">front-row attention</span>
                            </div>
                        </div>
                        <div className="grid gap-2 text-sm font-semibold text-white/72">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-300" />
                                Signature winner ceremony
                            </div>
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-cyan-300" />
                                Luxury reward showcase
                            </div>
                        </div>
                        {isEntryLocked ? (
                            <span className="inline-flex w-fit items-center justify-center gap-2 rounded-[0.95rem] border border-amber-200/40 bg-amber-200/10 px-6 py-3.5 text-sm font-black uppercase text-amber-100 shadow-[0_14px_34px_rgba(255,138,31,0.12)]">
                                <Ticket className="h-4 w-4" />
                                Entries locked
                            </span>
                        ) : (
                            <Link
                                href="/packages"
                                className="[animation:lottery-banner-cta-pulse_2.4s_ease-in-out_1.2s_infinite] inline-flex w-fit items-center justify-center gap-2 rounded-[0.95rem] border border-white/70 bg-[linear-gradient(180deg,#fff26e,#ffb83e_45%,#ff7a18)] px-6 py-3.5 text-sm font-black uppercase text-[#1f1200] shadow-[0_14px_34px_rgba(255,138,31,0.34),inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:-translate-y-0.5 hover:brightness-105"
                            >
                                <Ticket className="h-4 w-4" />
                                Secure my ticket
                            </Link>
                        )}
                    </div>
                </div>
            </article>

            {bannerMediaItems.map((media, index) => (
                <article
                    key={`${media.type}-${media.value}`}
                    className={`${slideBase} overflow-hidden bg-[#080717] ${activeBannerSlide === index + 1 ? slideActive : ''}`}
                >
                    <BannerMediaSlide media={media as LotteryPageMedia} index={index} />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,2,21,0.22),transparent_32%,rgba(7,2,21,0.22)),linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.34))]" />
                    {media.label ? (
                        <div className="absolute bottom-4 left-5 z-[2] max-w-[min(520px,calc(100%_-_2.4rem))] rounded-full border border-amber-300/35 bg-[#070814]/65 px-3.5 py-2 text-xs font-black uppercase text-amber-100 backdrop-blur-xl">
                            {media.label}
                        </div>
                    ) : null}
                </article>
            ))}
        </section>
    );
}
