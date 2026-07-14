'use client';

import { BadgeCheck, LockKeyhole, Trophy, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { LotteryWinner } from '@/lib/api/lotteryApi';
import TicketEjection from './TicketEjection';
import { getRankLabel, playerDisplayName } from './lotteryFormat';

type LotteryPhase = 'idle' | 'tumbling' | 'ejecting' | 'completed';

interface LotteryWheelProps {
    isDrawingPhase: boolean;
    wheelSlices: { key: string; ticket: string; flipped: boolean; angle: number }[];
    centerWheelLabel: string;
    lockTitle: string;
    lockDescription: string;
    activeWinner: LotteryWinner | null;
    completedWinner?: LotteryWinner | null;
    phase: LotteryPhase;
    totalParticipants?: number;
    isConnected?: boolean;
}

function LotteryWheel({ 
    isDrawingPhase, 
    wheelSlices, 
    centerWheelLabel, 
    lockTitle, 
    lockDescription, 
    activeWinner, 
    completedWinner = null,
    phase,
    totalParticipants = 0,
    isConnected = false
}: LotteryWheelProps) {
    const showEjection = activeWinner && phase === 'ejecting';
    const spotlightWinner = activeWinner || (phase === 'completed' ? completedWinner : null);
    const showSpotlight = Boolean(spotlightWinner) && !showEjection;
    const resolvedSpotlightWinner = showSpotlight ? spotlightWinner : null;
    const showCeremonyAura = phase === 'tumbling' || phase === 'ejecting';

    // Haptic feedback on phase transitions (mobile slot-machine feel)
    const prevPhaseRef = useRef(phase);
    useEffect(() => {
        if (prevPhaseRef.current === phase) return;
        prevPhaseRef.current = phase;
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;
        try {
            if (phase === 'tumbling') {
                navigator.vibrate(50);
            } else if (phase === 'ejecting') {
                navigator.vibrate([100, 50, 200]);
            } else if (phase === 'completed') {
                navigator.vibrate([80, 40, 80]);
            }
        } catch {
            // vibrate not available on all devices
        }
    }, [phase]);

    const getStatusText = () => {
        switch (phase) {
            case 'tumbling':
                return 'Drawing…';
            case 'ejecting':
                return activeWinner ? `Revealing ${activeWinner.lotteryNumber}` : 'Ejecting';
            case 'completed':
                return completedWinner ? `${getRankLabel(completedWinner.rank)} revealed` : 'Results visible';
            default:
                return totalParticipants > 0 ? `${totalParticipants} entries` : 'Stand by';
        }
    };

    return (
        <div className="relative min-h-[600px] sm:min-h-[640px] lg:min-h-[700px] w-full p-3 sm:p-5 pb-[160px] sm:pb-[180px] flex flex-col justify-between">
            {/* 1. Header: Live draw floor title & Live Sync badge */}
            <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100/60">Live draw floor</p>
                <h2 className="mt-1 text-lg sm:text-2xl font-black text-white">{centerWheelLabel}</h2>
            </div>
            
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/74">
                {isConnected ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-rose-300" />}
                {isConnected ? 'Live sync' : 'Reconnecting'}
            </div>

            {/* 2. Casino Presenter Hostess (Visible on all screens) */}
            <div className="absolute top-[32%] sm:top-[26%] md:top-auto bottom-auto md:bottom-0 left-[-10px] sm:left-0 lg:left-4 z-10 w-[115px] sm:w-[160px] md:w-[220px] lg:w-[245px] pointer-events-none">
                <img
                    src="/assets/images/lottery/lucky-spin-hostess.png"
                    alt="Lobby Hostess"
                    className="w-full h-auto object-contain object-bottom brightness-110 contrast-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] md:[mask-image:none]"
                />
            </div>

            {/* 3. Spin Wheel Zone (Absolute positioned to match reference image) */}
            <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 lg:right-6 top-[18%] md:top-[12%] z-0 flex flex-col items-center">
                
                {/* Background gold/amber glow effect */}
                <div className="absolute left-1/2 top-[8%] h-[320px] w-[320px] lg:h-[360px] lg:w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.12),transparent_64%)] blur-[18px] z-0" />
                {showCeremonyAura ? (
                    <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center z-0">
                        <div className="lottery-ceremony-ring h-56 w-56 rounded-full border border-amber-200/20 bg-[radial-gradient(circle,rgba(250,204,21,0.12),transparent_62%)] blur-[2px]" />
                    </div>
                ) : null}

                {/* Wheel pin: SVG updated with luxury gold/amber gradients to fit roulette colors */}
                <div className="pointer-events-none absolute left-1/2 top-[-1.5rem] z-20 w-14 lg:w-16 -translate-x-1/2 drop-shadow-[0_12px_22px_rgba(217,119,6,0.34)]">
                    <svg viewBox="0 0 64 82" className="h-auto w-full" aria-hidden>
                        <defs>
                            <radialGradient id="lottery-pin-glow" cx="34%" cy="24%" r="72%">
                                <stop offset="0%" stopColor="#fffbeb" />
                                <stop offset="42%" stopColor="#fde047" />
                                <stop offset="78%" stopColor="#d97706" />
                                <stop offset="100%" stopColor="#78350f" />
                            </radialGradient>
                        </defs>
                        <path
                            d="M32 4C19.28 4 9 14.08 9 26.55C9 44.43 32 75 32 75C32 75 55 44.43 55 26.55C55 14.08 44.72 4 32 4Z"
                            fill="url(#lottery-pin-glow)"
                            stroke="#fef3c7"
                            strokeWidth="3"
                        />
                        <circle cx="32" cy="26" r="8.5" fill="#451a03" stroke="#fef3c7" strokeWidth="3" />
                        <path d="M19 13C23.4 9.4 29.8 8.2 36 9.6" fill="none" stroke="#fffbeb" strokeLinecap="round" strokeWidth="4" opacity="0.58" />
                    </svg>
                </div>

                {/* Main wheel container */}
                <div className="lottery-wheel-shell relative w-[min(420px,82vw)] lg:w-[460px] xl:w-[490px] aspect-square isolate drop-shadow-[0_34px_52px_rgba(0,0,0,0.62)] z-[2]">
                    <div className={`lottery-spin-wheel ${isDrawingPhase ? 'is-spinning' : ''}`}>
                        {wheelSlices.map((slice) => (
                            <span
                                key={slice.key}
                                className="absolute inset-0 z-[2] flex justify-center pt-[8.8%] pointer-events-none"
                                style={{ transform: `rotate(${slice.angle}deg)` } as CSSProperties}
                            >
                                <span className={`block min-w-[5.8rem] text-white/95 text-[clamp(0.62rem,1.32vw,0.92rem)] font-black tracking-[0.035em] text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.82),0_0_14px_rgba(255,255,255,0.18)] whitespace-nowrap transition-transform duration-300 ${slice.flipped ? 'rotate-180' : ''}`}>
                                    {slice.ticket}
                                </span>
                            </span>
                        ))}
                    </div>
                    <div className="lottery-wheel-winner-zone" aria-hidden />
                    <div className="lottery-wheel-center">
                        {centerWheelLabel.split(' ').map((word, idx) => (
                            <span key={idx}>{word}</span>
                        ))}
                    </div>
                </div>

            </div>

            {/* 4. Overlay & Alerts at the bottom-center (Spotlight & Status Card) */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[40] w-[min(96%,440px)] flex flex-col gap-2 sm:gap-2.5 items-center">
                
                {/* Spotlight Winner Display */}
                {resolvedSpotlightWinner ? (
                    <div className="lottery-reveal-spotlight w-full flex items-center gap-3.5 rounded-2xl border border-amber-400/40 bg-[linear-gradient(145deg,rgba(251,191,36,0.18),rgba(10,10,14,0.96)_35%,rgba(5,5,8,0.98))] p-3.5 shadow-[0_16px_40px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_0_20px_rgba(251,191,36,0.05)] backdrop-blur-xl">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                            <Trophy className="h-6 w-6" />
                            <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-ping [animation-duration:3s]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/90">
                                {activeWinner ? 'Stage Winner' : 'Winning Ticket'}
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                                    {getRankLabel(resolvedSpotlightWinner.rank)}
                                </span>
                            </div>
                            <div className="mt-0.5 truncate text-lg sm:text-xl font-black text-white drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                                {playerDisplayName(resolvedSpotlightWinner)}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 truncate text-xs font-black text-white/70">
                                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-amber-100">#{resolvedSpotlightWinner.lotteryNumber}</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Status card */}
                <div className={`flex w-full items-center gap-3 sm:gap-4 rounded-2xl border border-amber-100/20 bg-[linear-gradient(135deg,rgba(27,21,16,0.9),rgba(9,9,11,0.94))] px-3 py-2.5 sm:px-5 sm:py-4 shadow-[0_22px_64px_rgba(0,0,0,0.5),0_0_34px_rgba(217,119,6,0.12)] backdrop-blur-xl transition-all duration-300 ${showEjection ? 'scale-[0.97] opacity-35' : ''} ${showCeremonyAura ? 'lottery-status-ceremony' : ''}`}>
                    <div className="grid h-10 w-10 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-xl sm:rounded-2xl border border-amber-100/20 bg-amber-300/10 text-amber-100">
                        {showCeremonyAura ? <BadgeCheck className="h-5 w-5 sm:h-7 sm:w-7" /> : <LockKeyhole className="h-5 w-5 sm:h-7 sm:w-7" />}
                    </div>
                    <section className="flex-1">
                        <h3 className="text-sm sm:text-lg font-black uppercase text-amber-50">{lockTitle}</h3>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-white/75 line-clamp-1 sm:line-clamp-none">{lockDescription}</p>
                    </section>
                    {phase !== 'idle' && phase !== 'completed' && (
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-wider text-amber-200/80">
                                {phase === 'tumbling' ? 'SPINNING' : phase === 'ejecting' ? 'EJECTING' : ''}
                            </div>
                            <div className="text-sm font-mono text-white/60">{getStatusText()}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket ejection animation - ROOT LEVEL TO AVOID Z-INDEX CLIPPING */}
            {showEjection && (
                <div className="absolute top-[40%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex w-[min(94vw,400px)] flex-col items-center justify-center pointer-events-none drop-shadow-[0_24px_50px_rgba(251,191,36,0.4)]">
                    <TicketEjection winner={activeWinner} animating={phase === 'ejecting'} />
                </div>
            )}

        </div>
    );
}

export default LotteryWheel;
