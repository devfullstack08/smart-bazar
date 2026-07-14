'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, HelpCircle, LayoutGrid, Volume2, VolumeX } from 'lucide-react';
import type { LotteryEvent } from '@/lib/api/lotteryApi';
import { APP_NAME } from '@/constants/env';
import { shortDrawId } from '@/components/lottery/arena/lotteryArenaHelpers';

export default function LotteryArenaTopBar({
    event,
    isMuted,
    onToggleMute,
    onOpenHelp,
    variant = 'arena',
    lobbyHref,
}: {
    event: LotteryEvent | null;
    isMuted: boolean;
    onToggleMute: () => void;
    onOpenHelp: () => void;
    /** Hub landing strips audio controls; arena is full chrome. */
    variant?: 'arena' | 'hub';
    /** v2 coupon flow: return to the room / shop chooser without using browser history. */
    lobbyHref?: string | null;
}) {
    const router = useRouter();
    const appTitle = APP_NAME.replace(/\s+/g, '').toUpperCase();
    const buttonClass =
        'inline-flex items-center justify-center border border-teal-200/20 bg-[#071314]/78 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px] transition hover:-translate-y-0.5 hover:border-teal-100/45 hover:bg-teal-300/10';

    return (
        <header className="relative z-50 mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-2 pt-3 sm:grid-cols-[minmax(88px,1fr)_minmax(0,auto)_minmax(88px,1fr)] sm:gap-4 sm:px-4 sm:pb-3 sm:pt-5">
            {/* Left: Back + Lobby */}
            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className={`${buttonClass} h-9 w-9 rounded-xl sm:min-h-12 sm:w-auto sm:gap-2 sm:rounded-2xl sm:px-4`}
                    aria-label="Go back"
                >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline font-extrabold">Back</span>
                </button>
                {lobbyHref ? (
                    <Link
                        href={lobbyHref}
                        className={`${buttonClass} h-9 w-9 rounded-xl sm:min-h-12 sm:w-auto sm:gap-2 sm:rounded-2xl sm:px-3.5`}
                    >
                        <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline text-sm font-extrabold">Lobby</span>
                    </Link>
                ) : null}
            </div>

            {/* Center: Title + Draw ID */}
            <div className="min-w-0 text-center">
                <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[clamp(0.95rem,3vw,2.35rem)] font-black uppercase leading-none tracking-[0.04em] drop-shadow-[0_3px_24px_rgba(255,255,255,0.22)] sm:gap-x-3 sm:gap-y-2">
                    <span className="hidden sm:inline">{appTitle}</span>
                    <span className="bg-[linear-gradient(90deg,#ecfeff,#99f6e4,#5eead4,#fde68a)] bg-clip-text text-transparent">
                        Lottery Arena
                    </span>
                </h1>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/25 bg-[#071c1c]/82 px-3 py-1 text-[9px] font-extrabold uppercase text-white/90 shadow-[0_14px_42px_rgba(0,0,0,0.28)] sm:mt-3 sm:gap-2 sm:px-5 sm:py-2 sm:text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)] sm:h-2 sm:w-2" />
                    <span className="hidden min-[420px]:inline">Live draw id:</span>
                    <strong className="text-teal-100">{shortDrawId(event)}</strong>
                </div>
            </div>

            {/* Right: Mute + Help */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-3">
                {variant === 'arena' ? (
                    <button
                        type="button"
                        onClick={onToggleMute}
                        className={`${buttonClass} h-9 w-9 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl`}
                        aria-label={isMuted ? 'Turn sound on' : 'Mute sound'}
                    >
                        {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={onOpenHelp}
                    className={`${buttonClass} h-9 w-9 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl`}
                    aria-label="How the lottery works"
                >
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>
        </header>
    );
}
