'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Flame, Tv, Wallet } from 'lucide-react';
import type { LotteryEvent } from '@/lib/api/lotteryApi';
import { isCouponLotteryEvent } from '@/lib/api/lotteryApi';

export function formatDrawLabel(value: string) {
    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function pad(n: number) {
    return String(n).padStart(2, '0');
}

export function countdownLabel(event: LotteryEvent) {
    const ms = new Date(event.drawTime).getTime() - Date.now();
    if (ms <= 0) return event.status === 'drawing' ? 'Drawing now' : 'Draw time reached';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function eventTicketCount(event: LotteryEvent) {
    return Number(event.totalParticipantCount ?? event.participantCount ?? 0);
}

export function eventPoolAmount(event: LotteryEvent) {
    if (isCouponLotteryEvent(event)) {
        const hasPoolWiseTier = eventHasPoolWiseTier(event);
        const pool = Number(event.couponPools?.totalAmount ?? (event.couponTiers || []).reduce((sum, tier) => sum + Number(tier.poolAmount || 0), 0));
        if (hasPoolWiseTier) return Number.isFinite(pool) ? pool : 0;
        if (pool > 0) return pool;
    }
    let total = 0;
    for (const r of event.rewards || []) {
        const match = r.label?.match(/[\d.,]+/);
        if (match) total += parseFloat(match[0].replace(/,/g, ''));
    }
    return total;
}

export function eventHasPoolWiseTier(event: LotteryEvent) {
    return isCouponLotteryEvent(event) && (event.couponTiers || []).some((tier) => tier.prizeMode === 'pool_percentage');
}

export function shouldShowEventPoolAmount(event: LotteryEvent) {
    if (!eventHasPoolWiseTier(event)) return true;
    return eventPoolAmount(event) > 0;
}

export function eventPoolLabel(event: LotteryEvent) {
    return eventHasPoolWiseTier(event) ? 'Live Coupon Pool' : "Tonight's Guaranteed Prize";
}

export function eventPoolSymbol(event: LotteryEvent) {
    if (isCouponLotteryEvent(event)) {
        return event.couponTiers?.find((tier) => tier.currencySymbol)?.currencySymbol || 'USDT';
    }
    const firstLabel = event.rewards?.[0]?.label || '';
    const symMatch = firstLabel.match(/([A-Za-z$€£]+)/);
    return symMatch ? symMatch[1] : 'USDT';
}

export function moneyLabel(value: number, symbol: string) {
    if (value === 0 && symbol !== 'USDT') return 'Hidden Prize';

    const isPrefix = ['$', '€', '£'].includes(symbol);
    const formatStr = (numStr: string) => isPrefix ? `${symbol}${numStr}` : `${numStr} ${symbol}`;

    if (value >= 1000000) return formatStr((value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M');
    if (value >= 1000) return formatStr((value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'k');
    return formatStr(value.toLocaleString(undefined, { maximumFractionDigits: 2 }));
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        const duration = 1000;
        const start = display;
        const end = value;
        if (start === end) return;
        let startTime: number | null = null;
        let animationFrameId: number;

        const tick = (now: number) => {
            if (!startTime) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setDisplay(start + (end - start) * ease);
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(tick);
            } else {
                setDisplay(end);
            }
        };
        animationFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value, display]);

    const isPrefix = ['$', '€', '£'].includes(suffix.trim());
    const valString = display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (isPrefix) {
        return <>{prefix}{suffix.trim()}{valString}</>;
    }
    return <>{prefix}{valString}{suffix}</>;
}

export function useSoundEffects() {
    const playClick = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
            
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {}
    }, []);

    const playWhoosh = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        } catch (e) {}
    }, []);

    return { playClick, playWhoosh };
}

function CinematicIntro({ event, onComplete }: { event: LotteryEvent; onComplete: () => void }) {
    const [phase, setPhase] = useState<'dark' | 'spotlight' | 'hostess' | 'cards' | 'exit'>('dark');
    const showPoolAmount = shouldShowEventPoolAmount(event);

    useEffect(() => {
        // Lock body scrolling while intro is active
        document.body.style.overflow = 'hidden';

        const t1 = setTimeout(() => setPhase('spotlight'), 400);
        const t2 = setTimeout(() => setPhase('hostess'), 1400);
        const t3 = setTimeout(() => setPhase('cards'), 2000);

        return () => {
            document.body.style.overflow = '';
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050508] overflow-hidden touch-none overscroll-none transition-opacity duration-700 ease-in-out ${phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Skip Button */}
            <button
                onClick={() => { setPhase('exit'); setTimeout(onComplete, 800); }}
                className="absolute top-6 right-6 md:top-8 md:right-8 z-[60] rounded-full border border-white/10 bg-white/5 px-4 md:px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
                Skip Intro
            </button>

            {/* Stage Floor Glow */}
            <div className={`absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[120vw] h-[300px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] blur-2xl transition-opacity duration-1000 ${phase === 'dark' ? 'opacity-0' : 'opacity-100'}`} />

            {/* Spotlight Cone */}
            <div className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150vw] md:w-[1000px] h-[120vh] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15)_0%,transparent_60%)] transition-opacity duration-1000 ${phase === 'dark' ? 'opacity-0' : 'opacity-100'}`} style={{ clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0% 100%)' }} />

            {/* Dust Particles */}
            <div className={`absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay transition-opacity duration-1000 pointer-events-none ${phase === 'dark' ? 'opacity-0' : 'opacity-100'}`} />

            {/* Main Stage Content Container */}
            <div className="relative w-full max-w-[1400px] h-full mx-auto flex items-center justify-center perspective-[1000px]">

                {showPoolAmount ? (
                    <div className={`absolute top-[15%] md:top-[18%] left-1/2 -translate-x-1/2 text-center transition-all duration-1000 ease-out w-[95%] md:w-full px-2 md:px-4 z-30 ${phase === 'dark' ? 'opacity-0 translate-y-10 scale-90' : 'opacity-100 translate-y-0 scale-100'}`}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 md:px-4 md:py-1.5 mb-3 md:mb-6 backdrop-blur-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"></div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">{eventPoolLabel(event)}</span>
                        </div>
                        <div className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-[0_10px_40px_rgba(245,158,11,0.4)] whitespace-nowrap md:whitespace-normal">
                            {moneyLabel(eventPoolAmount(event), eventPoolSymbol(event))}
                        </div>
                    </div>
                ) : null}

                {/* Hostess (Background Left on Mobile, Foreground Left on Desktop) */}
                <div
                    className={`absolute bottom-0 -left-[15%] sm:-left-[5%] md:left-[0%] lg:left-[5%] w-[120vw] sm:w-[500px] md:w-[650px] lg:w-[800px] transition-all duration-1000 ease-out mix-blend-screen pointer-events-none z-10 md:z-20 ${['dark', 'spotlight'].includes(phase) ? 'opacity-0 -translate-x-10 md:-translate-x-20' : 'opacity-100 translate-x-0'}`}
                >
                    <img src="/assets/images/lottery/cinematic-hostess.png" alt="Hostess" className="w-full h-auto object-contain object-bottom brightness-110 contrast-110" />
                </div>

                {/* Event Card (Center on Mobile, Right on Desktop) */}
                <div className={`absolute bottom-[20%] md:bottom-auto md:top-[45%] left-1/2 md:left-auto right-auto md:right-[5%] lg:right-[15%] w-[90vw] max-w-[340px] md:max-w-none md:w-[380px] -translate-x-1/2 md:translate-x-0 transition-all duration-1000 ease-out z-40 ${['dark', 'spotlight', 'hostess'].includes(phase) ? 'opacity-0 md:translate-x-20 translate-y-10 md:translate-y-0 rotate-y-[20deg] scale-95 md:scale-90' : 'opacity-100 md:translate-x-0 translate-y-0 rotate-y-[0deg] md:rotate-y-[-10deg] scale-100'}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="rounded-[20px] md:rounded-[32px] border border-amber-500/40 bg-gradient-to-br from-[var(--surface)]/95 to-[var(--background)]/95 p-5 md:p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(245,158,11,0.25)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]"></div>
                        <div className="relative z-10">
                            <div className="text-[9px] md:text-xs font-black uppercase tracking-widest text-amber-400 mb-2 md:mb-3 flex items-center gap-2">
                                <Flame className="w-3 h-3 md:w-4 md:h-4" />
                                Featured Event
                            </div>
                            <div className="text-lg md:text-3xl font-bold text-white mb-4 md:mb-8 line-clamp-2 leading-tight">{event.title}</div>

                            <div className="rounded-xl md:rounded-2xl bg-black/40 p-3 md:p-4 border border-white/5">
                                <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-400 mb-1">Live Draw In</div>
                                <div className="text-xl md:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">{countdownLabel(event)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Button (Bottom Center) */}
                <div className={`absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-1000 delay-500 ${phase === 'cards' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'}`}>
                    <button
                        onClick={() => { setPhase('exit'); setTimeout(onComplete, 800); }}
                        className="group relative inline-flex items-center justify-center gap-2 md:gap-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-6 py-3 md:px-10 md:py-5 text-xs md:text-sm font-black uppercase tracking-widest text-[#050508] shadow-[0_10px_40px_rgba(245,158,11,0.4)] transition-all hover:scale-105 hover:shadow-[0_15px_60px_rgba(245,158,11,0.6)] hover:brightness-110"
                    >
                        <span>Enter Arena</span>
                        <svg className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LotteryLobbyFloor({ events }: { events: LotteryEvent[] }) {
    const [, setClock] = useState(() => Date.now());
    const [introState, setIntroState] = useState<'initial' | 'playing' | 'done'>('initial');

    useEffect(() => {
        const id = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const sortedEvents = useMemo(() => {
        const statusOrder: Record<string, number> = { drawing: 0, active: 1, upcoming: 2 };
        return [...events].sort((left, right) => {
            const leftOrder = statusOrder[left.status] ?? 9;
            const rightOrder = statusOrder[right.status] ?? 9;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            return new Date(left.drawTime).getTime() - new Date(right.drawTime).getTime();
        });
    }, [events]);

    const featured = sortedEvents[0];
    const others = sortedEvents.slice(1);

    useEffect(() => {
        const hasSeen = sessionStorage.getItem('hasSeenLobbyIntro');
        if (!hasSeen && featured) {
            setIntroState('playing');
        } else {
            setIntroState('done');
        }
    }, [featured]);

    const { playWhoosh, playClick } = useSoundEffects();

    const handleIntroComplete = useCallback(() => {
        sessionStorage.setItem('hasSeenLobbyIntro', 'true');
        setIntroState('done');
        playWhoosh();
    }, [playWhoosh]);

    // Generate floating particles for the entire lobby
    const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        animationDuration: `${Math.random() * 10 + 10}s`,
        animationDelay: `${Math.random() * -10}s`, // Negative so they start immediately
    })), []);

    return (
        <div className="relative min-h-dvh bg-[#030408] overflow-x-hidden text-white">
            {/* Unified Stage Lighting Background for the entire Lobby */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Stage Floor Glow */}
                <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[120vw] h-[300px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)] blur-2xl" />
                {/* Spotlight Cone */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150vw] md:w-[1000px] h-[120vh] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.1)_0%,transparent_60%)]" style={{ clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0% 100%)' }} />
                
                {/* Floating Dust Particles */}
                <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-60">
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes float-up {
                            0% { transform: translateY(0) scale(1); opacity: 0; }
                            30% { opacity: 1; }
                            70% { opacity: 1; }
                            100% { transform: translateY(-100vh) scale(2); opacity: 0; }
                        }
                    `}} />
                    {particles.map((p, i) => (
                        <div 
                            key={i} 
                            className="absolute rounded-full bg-[radial-gradient(circle,#f59e0b_0%,transparent_80%)]" 
                            style={{...p, animation: `float-up ${p.animationDuration} linear infinite`, animationDelay: p.animationDelay}} 
                        />
                    ))}
                </div>

                {/* Noise */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            </div>

            {introState !== 'done' && featured && (
                <CinematicIntro event={featured} onComplete={handleIntroComplete} />
            )}

            <div className={`relative w-full px-4 pb-20 pt-16 sm:px-6 lg:px-8 max-w-[1400px] mx-auto z-10 transition-all duration-1000 ${introState === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Header */}
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="bg-gradient-to-br from-white to-slate-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            Lottery <span className="text-amber-400">Arena</span>
                        </h1>
                        <p className="mt-2 font-medium text-slate-400">Step onto the floor, grab your tickets, and win massive prizes.</p>
                    </div>
                </div>

                {/* Featured Event VIP Stage */}
                {featured && (
                    <div className="relative mb-16 overflow-hidden rounded-[32px] border border-[var(--pw-primary)]/40 bg-gradient-to-br from-[#0c0c10]/95 to-[#050508]/95 p-6 md:p-0 shadow-[0_30px_100px_rgba(0,229,160,0.2)] transition-transform hover:scale-[1.01] duration-500 group flex flex-col md:flex-row items-center backdrop-blur-3xl">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,229,160,0.15),transparent_60%)]"></div>

                        {/* The Hostess (Absolute bottom-right on mobile, relative left on desktop) */}
                        <div className="absolute md:relative bottom-0 right-[-5%] sm:right-0 md:right-auto w-[220px] sm:w-[280px] md:w-full md:max-w-[480px] lg:max-w-[550px] shrink-0 md:block md:self-end md:-mb-10 lg:ml-8 pointer-events-none z-0 md:z-20">
                            {/* We add a fade mask on mobile so her hard cropped edge blends into the card smoothly */}
                            <div className="w-full h-full md:[mask-image:none] [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
                                <img src="/assets/images/lottery/cinematic-hostess.png" alt="Hostess" className="w-full h-auto mix-blend-screen drop-shadow-[0_0_30px_rgba(245,158,11,0.4)] brightness-110 opacity-70 sm:opacity-90 md:opacity-100" />
                            </div>
                        </div>

                        {/* VIP Stage Content */}
                        <div className="relative z-10 flex-1 w-full flex flex-col gap-6 md:gap-8 md:p-12 lg:p-16">
                            {/* Status Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--pw-primary)]/30 bg-[var(--pw-primary)]/10 px-4 py-2 w-fit backdrop-blur-md shadow-[0_0_20px_rgba(0,229,160,0.2)]">
                                <Flame className="h-4 w-4 text-[var(--pw-primary)] animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--pw-primary)]">{featured.status === 'drawing' ? 'Live Draw' : 'Featured Event'}</span>
                            </div>

                            <div>
                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 line-clamp-2">{featured.title}</h2>
                                {shouldShowEventPoolAmount(featured) ? (
                                    <>
                                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--pw-primary)] mb-2">{eventPoolLabel(featured)}</div>
                                        <div className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 drop-shadow-[0_0_40px_rgba(0,229,160,0.5)]">
                                            <AnimatedNumber value={eventPoolAmount(featured)} suffix={` ${eventPoolSymbol(featured)}`} />
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 border border-white/10 shadow-inner">
                                        <Tv className="h-6 w-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Live Draw In</div>
                                        <div className="text-2xl font-mono font-black text-white">{countdownLabel(featured)}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <Link
                                        href={`/lottery?view=arena&event=${featured._id}`}
                                        onMouseEnter={playClick}
                                        className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-2xl bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 border border-white/10"
                                    >
                                        Enter Room
                                    </Link>
                                    {isCouponLotteryEvent(featured) && (
                                        <Link
                                            href={`/lottery?view=shop&event=${featured._id}`}
                                            onMouseEnter={playClick}
                                            className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-8 py-4 text-sm font-black uppercase tracking-widest text-[#050508] shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105 hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)]"
                                        >
                                            Buy Tickets
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Events */}
                {others.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Upcoming Draws</h3>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {others.map((event) => {
                                const isCoupon = isCouponLotteryEvent(event);
                                const encodedId = encodeURIComponent(event._id);

                                return (
                                    <div key={event._id} className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-[var(--surface)]/80 to-[var(--background)]/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-2 hover:border-amber-500/40 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)]">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 shadow-[0_0_15px_#f59e0b]"></div>

                                        <div className="p-6 pb-20 sm:pb-6 relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-md">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${event.status === 'drawing' ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-slate-400'}`}></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                        {event.status === 'drawing' ? 'Drawing' : 'Open'}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-500 font-mono">
                                                    {formatDrawLabel(event.drawTime)}
                                                </div>
                                            </div>

                                            <div className="mb-6 space-y-1">
                                                <h4 className="text-lg font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">{event.title}</h4>
                                                {shouldShowEventPoolAmount(event) ? (
                                                    <>
                                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm">
                                                            {moneyLabel(eventPoolAmount(event), eventPoolSymbol(event))}
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">Prize Pool</div>
                                                    </>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                <div className="font-mono text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                                                    {countdownLabel(event)}
                                                </div>
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Left</div>
                                            </div>
                                        </div>

                                        {/* Hover Actions Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 z-20 flex sm:translate-y-full items-center justify-center gap-2 bg-[#0c0c10]/95 p-4 backdrop-blur-2xl transition-transform duration-300 sm:group-hover:translate-y-0 border-t border-amber-500/20">
                                            <Link
                                                href={`/lottery?view=arena&event=${encodedId}`}
                                                onMouseEnter={playClick}
                                                className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/20 border border-white/5"
                                            >
                                                Room
                                            </Link>
                                            {isCoupon && (
                                                <Link
                                                    href={`/lottery?view=shop&event=${encodedId}`}
                                                    onMouseEnter={playClick}
                                                    className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#050508] shadow-[0_10px_20px_rgba(245,158,11,0.2)] transition-all hover:brightness-110"
                                                >
                                                    Tickets
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}
