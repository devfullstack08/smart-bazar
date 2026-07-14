'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
    ArrowLeftRight,
    Award,
    BadgeCheck,
    Clock3,
    Coins,
    Copy,
    Flame,
    HelpCircle,
    LayoutGrid,
    Loader2,
    Search,
    Share2,
    ShieldCheck,
    Sparkles,
    Ticket,
    TrendingUp,
    Trophy,
    Tv,
    Wallet,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    lotteryApi,
    isCouponLotteryEvent,
    LotteryEntry,
    LotteryEvent,
    LotteryDepositConfig,
    ExternalLotteryClaimRecord,
    ExternalLotteryStatus,
    LotteryPageConfig,
    LotteryPageMedia,
    LotteryWalletResponse,
    LotteryWalletTransferOptions,
    LotteryPoolUpdatePayload,
    LotteryWinner,
} from '@/lib/api/lotteryApi';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/utils/browserStorage';
import { useLotterySocket } from '@/hooks/useLotterySocket';
import { useLotteryParticipantPacing } from '@/hooks/useLotteryParticipantPacing';
import ParticipantPopup from '@/components/lottery/ParticipantPopup';
import LotteryPageLoading from '@/components/lottery/arena/LotteryPageLoading';
import LotteryWinnersRevealSection from '@/components/lottery/arena/LotteryWinnersRevealSection';
import {
    FALLBACK_WHEEL_TICKETS,
    formatRelativeTime,
    normalizePrizeConfigs,
    playerName,
} from '@/components/lottery/arena/lotteryArenaHelpers';
import LotteryArenaTopBar from '@/components/lottery/arena/LotteryArenaTopBar';
import LotteryArenaGuide from '@/components/lottery/arena/LotteryArenaGuide';
import { LotteryHelpModal as HelpModal, LotteryShareModal as ShareModal } from '@/components/lottery/arena/LotteryArenaModals';
import LotteryTicker, { TickerItem } from '@/components/lottery/LotteryTicker';
import MobileCta from '@/components/lottery/MobileCta';
import WinnersReel from '@/components/lottery/WinnersReel';
import { createLotteryAudioEngine } from '@/components/lottery/lotteryAudio';
import { getRankLabel, pad, rewardValueLabel } from '@/components/lottery/lotteryFormat';
import LotteryBannerSection from '@/components/lottery/LotteryBanner';
import LotteryPrizeLadder from '@/components/lottery/LotteryPrizeLadder';
import LotteryWheel from '@/components/lottery/LotteryWheel';
import LotteryActivityPanel from '@/components/lottery/LotteryActivityPanel';
import LotteryCouponCelebrate from '@/components/lottery/shop/LotteryCouponCelebrate';
import LotteryPrizeVault from '@/components/lottery/shop/LotteryPrizeVault';
import LotteryRoomPoolSummary from '@/components/lottery/LotteryRoomPoolSummary';
import { formatLotteryMoney, safeLotteryBuyerName } from '@/components/lottery/lotteryMoney';
import { getCouponPoolAmount, attachCouponPools, crossedPoolMilestone, lotteryErrorMessage, mergeLotteryWalletWithPageDeposit } from '@/components/lottery/lotteryPoolHelpers';
import { useAppSelector } from '@/lib/store/hooks';
import LotteryShopView from '@/components/lottery/shop';
import LotteryCouponPurchasePanel from '@/components/lottery/shop/LotteryCouponPurchasePanel';
import { readExternalLotteryClaims, saveExternalLotteryClaim } from '@/components/lottery/shop/externalClaimsStorage';
import { STORAGE_KEYS } from '@/constants';
import StickyCountdownPill from '@/components/lottery/StickyCountdownPill';
import MobileArenaTabView from '@/components/lottery/MobileArenaTabView';
import MyWinsBadge from '@/components/lottery/MyWinsBadge';
import DrawReminder from '@/components/lottery/DrawReminder';
import { useAnimatedCount } from '@/hooks/useAnimatedCount';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import LotteryLiveReactions from '@/components/lottery/arena/LotteryLiveReactions';
import MegaWinOverlay from '@/components/lottery/arena/MegaWinOverlay';

const COMPLETED_STICKY_MS = 24 * 60 * 60 * 1000;
const DRAW_WATCHDOG_MS = 8 * 1000;
const SPIN_BEFORE_REVEAL_MS = 1800;
const TICKET_EJECT_MS = 1150;
const WINNER_CELEBRATION_MS = 1600;
const BETWEEN_WINNER_SPINS_MS = 550;
const RECENT_COMPLETION_REPLAY_MS = 90 * 1000;
const POOL_CINEMA_MS = 6400;
const CONFETTI_COLORS = ['#fbbf24', '#34d399', '#38bdf8', '#f472b6', '#ffffff'];
const HISTORY_LIMIT = 5;
const RECENT_PARTICIPANT_LIMIT = 36;
const LOTTERY_SHARE_TRACKING_KEY = 'smart-bazar_lottery_share_actions_v1';

const LOTTERY_THEME = {
    panel: "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.36)] backdrop-blur-xl md:p-5",
    panelInnerGlow: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_52%)]",
    card: "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 shadow-[0_14px_46px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-amber-500/24 hover:bg-white/[0.065]",
    cardGlowTop: "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent opacity-60 transition-all duration-200 group-hover:opacity-100",
    buttonPrimary: "group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-6 py-3 text-sm font-black uppercase tracking-widest text-[#050508] shadow-[0_14px_40px_rgba(245,158,11,0.24)] transition-all hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
    buttonSecondary: "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/72 transition-all hover:border-amber-500/25 hover:bg-white/[0.09] hover:text-white",
    input: "min-h-[3rem] w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/32 transition-all focus:border-amber-500/45 focus:ring-1 focus:ring-amber-500/18",
    label: "text-[10px] font-black uppercase tracking-[0.15em] text-amber-400/72",
    stepHeader: "inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-amber-400/74",
    stepNumber: "grid h-6 w-6 place-items-center rounded-full bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/20",
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

type LotteryPoolBoost = {
    id: string;
    lotteryId: string;
    amount: number;
    symbol: string;
    quantity?: number;
    tierId?: string;
    tierLabel?: string;
    buyerName?: string;
    milestone?: number;
    totalAmount?: number;
};

type LotteryPoolBoostInput = Omit<LotteryPoolBoost, 'id'>;

type PoolTierGrowth = {
    amount: number;
    tickets: number;
};

type PoolActivity = {
    id: string;
    lotteryId: string;
    buyerName: string;
    amount: number;
    symbol: string;
    quantity: number;
    tierLabel?: string;
};

type PoolShareCard = {
    id: string;
    lotteryId: string;
    title: string;
    text: string;
    amount: number;
    symbol: string;
};

type LotteryWinnerRecord = LotteryWinner & {
    id?: string;
    lotteryId?: string;
};

type PurchaseRecord = {
    _id?: string;
    id?: string;
    ticketNumbers?: string[];
};



function trackLotteryShareAction(card: PoolShareCard, method: 'native' | 'copy') {
    try {
        const raw = safeLocalStorageGetItem(LOTTERY_SHARE_TRACKING_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const actions = Array.isArray(existing) ? existing : [];
        safeLocalStorageSetItem(
            LOTTERY_SHARE_TRACKING_KEY,
            JSON.stringify([
                {
                    id: `${card.id}:${method}:${Date.now()}`,
                    lotteryId: card.lotteryId,
                    method,
                    amount: card.amount,
                    symbol: card.symbol,
                    createdAt: new Date().toISOString(),
                },
                ...actions,
            ].slice(0, 100)),
        );
    } catch {
        /* Local analytics are best-effort only. */
    }
}

function winnerIdOf(winner: LotteryWinner) {
    const record = winner as LotteryWinnerRecord;
    return String(record._id || record.id || '');
}

function winnerLotteryIdOf(winner: LotteryWinner) {
    return String((winner as LotteryWinnerRecord).lotteryId || '');
}

function isExternalWinnerClaimable(winner: LotteryWinner) {
    return winner.participantType === 'external' && ['claimable', 'failed'].includes(String(winner.claimStatus || ''));
}

function getTotalParticipantCount(event: LotteryEvent | null | undefined) {
    return Number(event?.totalParticipantCount ?? event?.participantCount ?? 0);
}


function playPoolBoostChime(strong = false) {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        const context = new AudioCtor();
        const now = context.currentTime;
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(strong ? 0.09 : 0.055, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (strong ? 0.42 : 0.28));
        gain.connect(context.destination);

        const notes = strong ? [523.25, 659.25, 783.99] : [659.25, 880];
        notes.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, now + index * 0.085);
            oscillator.connect(gain);
            oscillator.start(now + index * 0.085);
            oscillator.stop(now + 0.24 + index * 0.085);
        });
        window.setTimeout(() => {
            void context.close().catch(() => undefined);
        }, strong ? 700 : 520);
    } catch {
        /* Browser may block audio until a user gesture. */
    }
}

function triggerPoolHaptic(strong = false) {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(strong ? [35, 45, 35, 45, 55] : [18, 28, 18]);
}

// mergeLotteryWalletWithPageDeposit is imported from lotteryPoolHelpers

function normalizeRevealWinners(winners: LotteryWinner[]) {
    const hasCouponTiers = winners.some((winner) => winner.couponTierId && winner.couponTierId !== 'default');
    if (!hasCouponTiers) return winners;

    return [...winners]
        .sort((a, b) => Number(a.couponAmount || 0) - Number(b.couponAmount || 0) || a.rank - b.rank)
        .map((winner, index) => ({
            ...winner,
            tierRank: winner.tierRank ?? winner.rank,
            rank: index + 1,
        }));
}

function LotteryArenaShell({ children }: { children: ReactNode }) {
    const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        animationDuration: `${Math.random() * 12 + 12}s`,
        animationDelay: `${Math.random() * -12}s`,
    })), []);

    return (
        <div className="smart-bazar-lottery-shell relative min-h-dvh overflow-hidden text-white">
            <div className="smart-bazar-lottery-shell__grid pointer-events-none fixed inset-0 z-0" />
            <div className="smart-bazar-lottery-shell__light pointer-events-none fixed inset-0 z-0" />

            {/* Ambient dust particles */}
            <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-50 pointer-events-none z-0">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes float-up {
                        0% { transform: translateY(0) scale(1); opacity: 0; }
                        30% { opacity: 0.8; }
                        70% { opacity: 0.8; }
                        100% { transform: translateY(-100vh) scale(1.5); opacity: 0; }
                    }
                `}} />
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-[radial-gradient(circle,#f59e0b_0%,transparent_80%)]"
                        style={{ ...p, animation: `float-up ${p.animationDuration} linear infinite`, animationDelay: p.animationDelay }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}

function useCountdown(target: string | undefined) {
    const [diff, setDiff] = useState<number | null>(null);
    useEffect(() => {
        if (!target) return;
        const tick = () => {
            const ms = new Date(target).getTime() - Date.now();
            setDiff(ms);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [target]);
    if (!target) return null;
    if (diff === null) return null;
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        totalMs: diff,
    };
}

function shouldReplayCompletedReveal(drawTime: string | Date | undefined, hasSeenLivePhase: boolean) {
    if (hasSeenLivePhase) return true;
    if (!drawTime) return false;
    const completedAt = new Date(drawTime).getTime();
    if (!Number.isFinite(completedAt)) return false;
    return Date.now() - completedAt <= RECENT_COMPLETION_REPLAY_MS;
}

function LotteryPoolShareCard({

    card,
    onDismiss,
}: {
    card: PoolShareCard;
    onDismiss: () => void;
}) {
    const share = useCallback(async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: card.title,
                    text: card.text,
                    url: window.location.href,
                });
                trackLotteryShareAction(card, 'native');
                return;
            }
            await navigator.clipboard.writeText(`${card.text} ${window.location.href}`);
            trackLotteryShareAction(card, 'copy');
            toast.success('Share text copied');
        } catch {
            /* User cancelled the native share sheet. */
        }
    }, [card]);

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(`${card.text} ${window.location.href}`);
        trackLotteryShareAction(card, 'copy');
        toast.success('Share text copied');
    }, [card]);

    return (
        <aside className="pool-share-card mt-3 rounded-[1rem] border border-amber-500/22 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(217,119,6,0.08)_48%,rgba(255,255,255,0.05))] p-3 text-white shadow-[0_16px_48px_rgba(0,0,0,0.28)] sm:mt-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/82">Pool boost shared</p>
                <p className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">{card.text}</p>
                <p className="mt-1 text-xs text-white/52">Invite more buyers while this tier is heating up.</p>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2 sm:mt-0 sm:flex sm:shrink-0">
                <button
                    type="button"
                    onClick={share}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 text-xs font-black uppercase tracking-wide text-amber-950 transition hover:bg-amber-300"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
                <button
                    type="button"
                    onClick={copy}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/75 transition hover:border-amber-500/35 hover:text-white"
                    aria-label="Copy share text"
                >
                    <Copy className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/65 transition hover:border-white/20 hover:text-white"
                    aria-label="Dismiss share card"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </aside>
    );
}

export function ExternalTicketStatusDialog({
    open,
    onClose,
    storedClaims,
    onWinnerPatch,
}: {
    open: boolean;
    onClose: () => void;
    storedClaims: ExternalLotteryClaimRecord[];
    onWinnerPatch: (winnerId: string, patch: Partial<LotteryWinner>) => void;
}) {
    const latest = storedClaims[0];
    const [email, setEmail] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [status, setStatus] = useState<ExternalLotteryStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [claimingWinnerId, setClaimingWinnerId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setEmail((prev) => prev || latest?.email || '');
        setWalletAddress((prev) => prev || latest?.walletAddress || '');
        setVerificationCode((prev) => prev || latest?.transactionHash || latest?.claimAccessToken || '');
    }, [latest, open]);

    const lookupStatus = useCallback(async () => {
        if (!email.trim() || !walletAddress.trim() || !verificationCode.trim()) {
            toast.error('Enter email, payout wallet, and transaction hash or claim token');
            return;
        }
        setLoading(true);
        try {
            const result = await lotteryApi.getExternalLotteryStatus({
                email: email.trim(),
                walletAddress: walletAddress.trim(),
                transactionHash: verificationCode.trim(),
                claimAccessToken: verificationCode.trim(),
            });
            setStatus(result);
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'Ticket status lookup failed'));
        } finally {
            setLoading(false);
        }
    }, [verificationCode, email, walletAddress]);

    const claimWinner = useCallback(async (winner: LotteryWinner) => {
        const winnerId = winnerIdOf(winner);
        if (!winnerId) return;
        const purchase = status?.purchases.find((item) => (
            item.lotteryId === winnerLotteryIdOf(winner) &&
            (item.ticketNumbers || []).map(String).includes(String(winner.lotteryNumber || ''))
        ));
        const claimEmail = status?.participant.email || email.trim();
        const claimWallet = status?.participant.walletAddress || walletAddress.trim();
        const claimHash = verificationCode.trim() || purchase?.transactionHash || '';
        const claimToken = verificationCode.trim();
        if (!claimEmail || !claimWallet || (!claimHash && !claimToken)) {
            toast.error('Ticket verification details are required before claim');
            return;
        }
        setClaimingWinnerId(winnerId);
        try {
            const result = await lotteryApi.claimExternalReward(winnerId, {
                email: claimEmail,
                walletAddress: claimWallet,
                transactionHash: claimHash || undefined,
                claimAccessToken: claimToken || undefined,
            });
            const patch: Partial<LotteryWinner> = { claimStatus: result.claimStatus || 'processing' };
            onWinnerPatch(winnerId, patch);
            setStatus((prev) => prev
                ? {
                    ...prev,
                    winners: prev.winners.map((item) => winnerIdOf(item) === winnerId ? { ...item, ...patch, canClaim: false } : item),
                }
                : prev);
            toast.success('External payout claim queued');
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'External claim failed'));
        } finally {
            setClaimingWinnerId(null);
        }
    }, [verificationCode, email, onWinnerPatch, status, walletAddress]);

    if (!open) return null;

    const eventById = new Map((status?.events || []).map((event) => [event.id, event]));
    const verifiedTicketCount = status?.purchases.reduce((sum, purchase) => sum + (purchase.ticketNumbers?.length || purchase.quantity || 0), 0) || 0;
    const claimableWinnerCount = status?.winners.filter((winner) => winner.canClaim || isExternalWinnerClaimable(winner)).length || 0;
    const recoverySteps = [
        { label: 'Verify', active: true, done: Boolean(status), icon: ShieldCheck },
        { label: 'Tickets', active: Boolean(status?.purchases.length), done: verifiedTicketCount > 0, icon: Ticket },
        { label: 'Claim', active: Boolean(status?.winners.length), done: claimableWinnerCount > 0, icon: Trophy },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-5">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/20 bg-[#090704] text-white shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                            <Search className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-black uppercase tracking-[0.08em] text-white">Check Ticket Status</h2>
                            <p className="mt-0.5 truncate text-xs text-amber-400/55">Verify guest tickets and claim announced winnings.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close ticket status"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-white/20 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[calc(92vh-68px)] overflow-y-auto px-4 py-4 sm:px-5">
                    <div className="mb-4 grid grid-cols-3 gap-2">
                        {recoverySteps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.label}
                                    className={`rounded-2xl border p-2.5 ${step.active
                                            ? 'border-amber-500/28 bg-amber-500/10 text-amber-400'
                                            : 'border-white/10 bg-white/[0.035] text-white/42'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span className="font-mono text-[10px] font-black">0{index + 1}</span>
                                    </div>
                                    <p className="mt-2 truncate text-xs font-black uppercase tracking-[0.12em]">{step.label}</p>
                                    <p className="mt-1 text-[10px] font-semibold text-white/45">
                                        {step.done ? 'Ready' : step.active ? 'Current' : 'Next'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr]">
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used at purchase" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-500/45" />
                        <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Payout wallet address" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-500/45" />
                        <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Transaction hash or claim token" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-500/45" />
                    </div>
                    <button
                        type="button"
                        onClick={lookupStatus}
                        disabled={loading}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 text-sm font-black uppercase tracking-[0.08em] text-amber-400 transition hover:border-amber-500/50 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                        Verify ticket
                    </button>

                    {status ? (
                        <div className="mt-5 space-y-4">
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="rounded-2xl border border-amber-500/18 bg-amber-500/10 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-400/72">Guest profile</p>
                                    <p className="mt-2 truncate text-sm font-black text-white">{status.participant.email}</p>
                                    <p className="mt-1 truncate font-mono text-[11px] text-white/52">{status.participant.walletAddress}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Tickets found</p>
                                    <p className="mt-2 text-2xl font-black text-white">{verifiedTicketCount}</p>
                                    <p className="mt-1 text-xs text-white/50">{status.purchases.length} purchase{status.purchases.length === 1 ? '' : 's'} verified</p>
                                </div>
                                <div className="rounded-2xl border border-amber-200/18 bg-amber-300/10 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100/72">Claim state</p>
                                    <p className="mt-2 text-2xl font-black text-white">{claimableWinnerCount}</p>
                                    <p className="mt-1 text-xs text-white/50">winner{claimableWinnerCount === 1 ? '' : 's'} ready to claim</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-amber-500/18 bg-white/[0.04] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-400/80">Ticket list</div>
                                    <span className="rounded-full border border-amber-500/18 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-400">Recovered</span>
                                </div>
                                <div className="mt-3 grid gap-3">
                                    {status.purchases.map((purchase) => (
                                        <div key={purchase.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <strong className="text-sm text-white">{purchase.couponLabel || `${purchase.couponAmount} ticket`}</strong>
                                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-400">{purchase.quantity} ticket{purchase.quantity === 1 ? '' : 's'}</span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {(purchase.ticketNumbers || []).map((ticket) => (
                                                    <span key={ticket} className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-white/75">#{ticket}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-amber-500/18 bg-white/[0.04] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-400/80">Winner and claim status</div>
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/58">{status.winners.length || 'No'} result{status.winners.length === 1 ? '' : 's'}</span>
                                </div>
                                {status.winners.length ? (
                                    <div className="mt-3 grid gap-3">
                                        {status.winners.map((winner) => {
                                            const winnerId = winnerIdOf(winner);
                                            const eventTitle = eventById.get(winnerLotteryIdOf(winner))?.title || 'Lottery draw';
                                            const canClaim = Boolean(winner.canClaim || isExternalWinnerClaimable(winner));
                                            return (
                                                <div key={winnerId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-black text-white">{eventTitle}</div>
                                                            <div className="mt-1 text-xs text-white/58">Ticket #{winner.lotteryNumber} · Rank {winner.rank}</div>
                                                            <div className="mt-2 text-sm font-semibold text-amber-400">{rewardValueLabel(winner.reward)}</div>
                                                        </div>
                                                        {canClaim ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => claimWinner(winner)}
                                                                disabled={claimingWinnerId === winnerId}
                                                                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/15 px-3 text-xs font-black uppercase tracking-wide text-amber-400 transition hover:border-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {claimingWinnerId === winnerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                                                                Claim
                                                            </button>
                                                        ) : (
                                                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/58">{winner.claimStatus || 'not claimable'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm text-white/58">Tickets are verified. Winner details will appear here after the draw.</p>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ExternalStatusLauncher({
    onOpen,
    claimCount = 0,
}: {
    onOpen: () => void;
    claimCount?: number;
}) {
    return (
        <div className="relative z-[2] mx-auto flex w-full max-w-[1248px] justify-end px-4 pb-1">
            <button
                type="button"
                onClick={onOpen}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-500/24 bg-[#1c1407]/80 px-3.5 text-xs font-black uppercase tracking-[0.08em] text-amber-400 shadow-[0_14px_38px_rgba(0,0,0,0.28)] backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-500/45 hover:bg-amber-500/12"
            >
                <Search className="h-4 w-4" />
                <span>Check Ticket Status</span>
                {claimCount > 0 ? (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-[#050508]">{claimCount}</span>
                ) : null}
            </button>
        </div>
    );
}



export type TLotteryPhase = 'idle' | 'tumbling' | 'ejecting' | 'completed';

export type LotteryArenaMode = 'full' | 'room' | 'shop';


export default function LotteryPage({
    focusPurchaseOnMount = false,
    arenaMode = 'full',
}: {
    focusPurchaseOnMount?: boolean;
    /** `room` = live arena only; `shop` = wallet + coupons only; `full` = legacy combined layout for deep links. */
    arenaMode?: LotteryArenaMode;
}) {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const searchParams = useSearchParams();
    const selectedEventParam = searchParams.get('event');
    const [event, setEvent] = useState<LotteryEvent | null>(null);
    const [pageMedia, setPageMedia] = useState<LotteryPageMedia[]>([]);
    const [pageDepositConfig, setPageDepositConfig] = useState<LotteryDepositConfig | undefined>(undefined);
    const [couponCelebrateTickets, setCouponCelebrateTickets] = useState<string[] | null>(null);
    const [pastEvents, setPastEvents] = useState<Array<LotteryEvent & { winners: LotteryWinner[] }>>([]);
    const [myEntry, setMyEntry] = useState<LotteryEntry | null>(null);
    const [myEntries, setMyEntries] = useState<LotteryEntry[]>([]);
    const [participants, setParticipants] = useState<LotteryEntry[]>([]);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [winners, setWinners] = useState<LotteryWinner[]>([]);
    const [revealedRanks, setRevealedRanks] = useState<number[]>([]);
    const [activeWinner, setActiveWinner] = useState<LotteryWinner | null>(null);
    const [phase, setPhase] = useState<TLotteryPhase>('idle');
    const [confettiBursts, setConfettiBursts] = useState<Array<{ id: string; pieces: Array<{ id: string; left: number; delay: number; duration: number; rotate: number; color: string; size: number }> }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [arenaTourTrigger, setArenaTourTrigger] = useState(0);
    const [activeBannerSlide, setActiveBannerSlide] = useState(0);
    const [externalStatusOpen, setExternalStatusOpen] = useState(false);
    const [externalClaimRecords, setExternalClaimRecords] = useState<ExternalLotteryClaimRecord[]>(() => readExternalLotteryClaims());
    const [externalClaimingWinnerId, setExternalClaimingWinnerId] = useState<string | null>(null);
    const [poolBoost, setPoolBoost] = useState<LotteryPoolBoost | null>(null);
    const [poolTierGrowth, setPoolTierGrowth] = useState<Record<string, Record<string, PoolTierGrowth>>>({});
    const [poolActivityByEvent, setPoolActivityByEvent] = useState<Record<string, PoolActivity | null>>({});
    const [poolHeartbeatByEvent, setPoolHeartbeatByEvent] = useState<Record<string, string>>({});
    const [poolShareCard, setPoolShareCard] = useState<PoolShareCard | null>(null);

    const audioEngine = useMemo(() => createLotteryAudioEngine(), []);
    const revealedWinnersIdRef = useRef<string>('');
    const revealInProgressRef = useRef(false);
    const hasSeenLivePhaseRef = useRef(false);
    const recentManualPoolBoostRef = useRef<{ lotteryId: string; until: number } | null>(null);
    const eventRef = useRef<LotteryEvent | null>(null);
    const couponCelebrateDelayRef = useRef<number | null>(null);
    const heroSectionRef = useRef<HTMLElement | null>(null);
    const animatedParticipants = useAnimatedCount(totalParticipants, 800);
    const handlePullRefresh = useCallback(async () => {
        if (!event?._id) return;
        try {
            const [freshEvent, freshParticipantsRes] = await Promise.all([
                lotteryApi.getLotteryEvent(event._id),
                lotteryApi.getParticipants(event._id, 1, 50),
            ]);
            if (freshEvent) setEvent(freshEvent);
            if (freshParticipantsRes?.data) {
                setParticipants(freshParticipantsRes.data);
                setTotalParticipants(freshParticipantsRes.data.length);
            }
            toast.success('Room data refreshed');
        } catch {
            toast.error('Could not refresh');
        }
    }, [event?._id]);
    const { isRefreshing, pullDistance, containerRef: pullRefreshRef } = usePullToRefresh({ onRefresh: handlePullRefresh });

    const isCompletedSticky = event?.status === 'completed';
    const isPreEvent = event?.status === 'upcoming';
    const isLiveDraw = event?.status === 'active' || event?.status === 'drawing';
    const isCouponEvent = isCouponLotteryEvent(event);





    useEffect(() => {
        eventRef.current = event;
    }, [event]);



    useEffect(() => {
        if (event?.status === 'upcoming' || event?.status === 'active' || event?.status === 'drawing') {
            hasSeenLivePhaseRef.current = true;
        }
    }, [event?.status]);

    /** While the event is sticky-completed, count down to its 24h expiry, otherwise to drawTime. */
    const stickyExpiresAt = useMemo(() => {
        if (!isCompletedSticky || !event) return undefined;
        return new Date(new Date(event.drawTime).getTime() + COMPLETED_STICKY_MS).toISOString();
    }, [event, isCompletedSticky]);


    const drawCountdown = useCountdown(isLiveDraw || isPreEvent ? event?.drawTime : undefined);
    const stickyCountdown = useCountdown(stickyExpiresAt);
    const shouldShowParticipantPopups = Boolean(
        event &&
        phase === 'idle' &&
        (event.status === 'upcoming' || event.status === 'active') &&
        drawCountdown &&
        drawCountdown.totalMs > 0
    );

    const pacing = useLotteryParticipantPacing({
        initialParticipants: participants,
        intervalSec: event?.participantRevealIntervalSeconds || 4,
        enabled: shouldShowParticipantPopups,
    });

    const fireConfetti = useCallback(() => {
        const burst = {
            id: `confetti-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            pieces: Array.from({ length: 28 }, (_, index) => ({
                id: `piece-${index}-${Math.random().toString(36).slice(2, 6)}`,
                left: Math.random() * 100,
                delay: Math.random() * 220,
                duration: 1800 + Math.random() * 1400,
                rotate: -180 + Math.random() * 360,
                color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                size: 8 + Math.round(Math.random() * 8),
            })),
        };
        setConfettiBursts((prev) => [...prev, burst]);
        window.setTimeout(() => {
            setConfettiBursts((prev) => prev.filter((item) => item.id !== burst.id));
        }, 3600);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const unlock = () => setHasInteracted(true);
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    useEffect(() => {
        setExternalClaimRecords(readExternalLotteryClaims());
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadAll = async () => {
            try {
                const [selectedEvent, fallbackActiveEvent, pageConfig, history] = await Promise.all([
                    selectedEventParam ? lotteryApi.getLotteryEvent(selectedEventParam).catch(() => null) : Promise.resolve(null),
                    selectedEventParam ? Promise.resolve(null) : lotteryApi.getActiveLottery(),
                    lotteryApi.getPageConfig().catch((): LotteryPageConfig => ({ projectId: '', media: [] })),
                    lotteryApi.getHistory(1, HISTORY_LIMIT).catch(() => ({ data: [] as Array<LotteryEvent & { winners: LotteryWinner[] }> })),
                ]);
                if (cancelled) return;

                const activeEvent = selectedEvent || fallbackActiveEvent;
                const depositCfg = pageConfig?.depositConfig;
                setPageMedia(pageConfig?.media || []);
                setPageDepositConfig(depositCfg);
                setPastEvents(history?.data || []);

                if (!activeEvent) {
                    setEvent(null);
                    setMyEntry(null);
                    setMyEntries([]);
                    setParticipants([]);
                    setTotalParticipants(0);
                    setWinners([]);
                    setRevealedRanks([]);
                    setActiveWinner(null);
                    setPhase('idle');
                    return;
                }

                setEvent(activeEvent);
                setTotalParticipants(getTotalParticipantCount(activeEvent));

                if (activeEvent.status === 'completed') {
                    const stickyWinners = activeEvent.winners?.length
                        ? activeEvent.winners
                        : await lotteryApi.getWinners(activeEvent._id).catch(() => []);
                    if (cancelled) return;
                    const shouldReplayReveal =
                        (stickyWinners || []).length > 0 &&
                        shouldReplayCompletedReveal(activeEvent.drawTime, hasSeenLivePhaseRef.current);
                    setWinners(normalizeRevealWinners(stickyWinners || []));
                    if (shouldReplayReveal) {
                        setRevealedRanks([]);
                        setActiveWinner(null);
                        setPhase('tumbling');
                    } else {
                        setRevealedRanks((stickyWinners || []).map((w) => w.rank));
                        setPhase('completed');
                    }
                    return;
                }

                const isCoupon = isCouponLotteryEvent(activeEvent);
                const [entry, entries, parts] = await Promise.all([
                    isAuthenticated ? lotteryApi.getMyEntry(activeEvent._id).catch(() => null) : Promise.resolve(null),
                    isAuthenticated && isCoupon ? lotteryApi.getMyEntries(activeEvent._id).catch(() => ({ entries: [] as LotteryEntry[], byTier: {} })) : Promise.resolve({ entries: [] as LotteryEntry[], byTier: {} }),
                    lotteryApi.getParticipants(activeEvent._id, 1, RECENT_PARTICIPANT_LIMIT, 'newest'),
                ]);
                if (cancelled) return;

                setMyEntry(entry);
                setMyEntries(entries.entries || []);
                if (parts?.data) setParticipants(parts.data);

                if (activeEvent.status === 'drawing') setPhase('tumbling');
                else setPhase('idle');
            } catch (err: unknown) {
                console.error('Failed to load lottery:', err);
                toast.error(lotteryErrorMessage(err, 'Unable to load lottery room'));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void loadAll();
        return () => {
            cancelled = true;
        };
    }, [arenaMode, isAuthenticated, selectedEventParam]);

    const handleParticipantJoined = useCallback(
        (data: { entry: LotteryEntry; totalCount: number }) => {
            setParticipants((prev) => {
                if (prev.some((item) => item._id === data.entry._id)) return prev;
                return [data.entry, ...prev].slice(0, RECENT_PARTICIPANT_LIMIT);
            });
            setTotalParticipants(data.totalCount);
            if (shouldShowParticipantPopups) {
                pacing.append(data.entry);
            }
        },
        [pacing, shouldShowParticipantPopups]
    );

    const refetchActiveEvent = useCallback(async () => {
        try {
            const next = selectedEventParam
                ? await lotteryApi.getLotteryEvent(selectedEventParam)
                : await lotteryApi.getActiveLottery();
            const currentEventDrawTimeMs = event ? new Date(event.drawTime).getTime() : NaN;
            const isCurrentEventOverdue = Boolean(
                event &&
                event.status !== 'completed' &&
                event.status !== 'cancelled' &&
                Number.isFinite(currentEventDrawTimeMs) &&
                currentEventDrawTimeMs <= Date.now(),
            );
            const isCeremonyLocked = Boolean(
                event &&
                (
                    isCurrentEventOverdue ||
                    event.status === 'drawing' ||
                    phase === 'tumbling' ||
                    phase === 'ejecting' ||
                    revealInProgressRef.current ||
                    activeWinner ||
                    (winners.length > 0 && revealedRanks.length < winners.length)
                ),
            );
            const isLocalRevealInProgress = Boolean(
                event &&
                (
                    revealInProgressRef.current ||
                    activeWinner ||
                    (winners.length > 0 && revealedRanks.length < winners.length)
                ),
            );

            if (!next) {
                if (isCeremonyLocked) {
                    if (isCurrentEventOverdue && phase === 'idle') {
                        setPhase('tumbling');
                    }
                    return;
                }
                revealInProgressRef.current = false;
                revealedWinnersIdRef.current = '';
                setEvent(null);
                setMyEntry(null);
                setMyEntries([]);
                setParticipants([]);
                setTotalParticipants(0);
                setWinners([]);
                setRevealedRanks([]);
                setActiveWinner(null);
                setPhase('idle');
                return;
            }

            const isNewEvent = next._id !== event?._id;
            const shouldHoldCurrentEvent = isNewEvent && isCeremonyLocked;

            if (shouldHoldCurrentEvent) {
                if (isCurrentEventOverdue && phase === 'idle') {
                    setPhase('tumbling');
                    setEvent((prev) => (prev ? { ...prev, status: 'drawing' } : prev));
                }
                return;
            }

            if (!isNewEvent && next.status === 'completed' && isLocalRevealInProgress) {
                return;
            }

            setEvent(next);
            setTotalParticipants(getTotalParticipantCount(next));

            if (next.status === 'completed') {
                const stickyWinners = next.winners?.length
                    ? next.winners
                    : await lotteryApi.getWinners(next._id).catch(() => []);
                revealInProgressRef.current = false;
                setWinners(normalizeRevealWinners(stickyWinners || []));
                const shouldReplayReveal =
                    (stickyWinners || []).length > 0 &&
                    shouldReplayCompletedReveal(next.drawTime, hasSeenLivePhaseRef.current);
                if (shouldReplayReveal) {
                    setRevealedRanks([]);
                    setActiveWinner(null);
                    setPhase('tumbling');
                } else {
                    setRevealedRanks((stickyWinners || []).map((winner) => winner.rank));
                    setActiveWinner(null);
                    setPhase('completed');
                }
                return;
            }

            const isCoupon = isCouponLotteryEvent(next);
            const [entry, entries, parts] = await Promise.all([
                isAuthenticated ? lotteryApi.getMyEntry(next._id).catch(() => null) : Promise.resolve(null),
                isAuthenticated && isCoupon ? lotteryApi.getMyEntries(next._id).catch(() => ({ entries: [] as LotteryEntry[], byTier: {} })) : Promise.resolve({ entries: [] as LotteryEntry[], byTier: {} }),
                lotteryApi.getParticipants(next._id, 1, RECENT_PARTICIPANT_LIMIT, 'newest').catch(() => null),
            ]);
            setMyEntry(entry);
            setMyEntries(entries.entries || []);
            if (parts?.data) {
                setParticipants(parts.data);
            }

            if (isNewEvent) {
                revealInProgressRef.current = false;
                revealedWinnersIdRef.current = '';
                setWinners([]);
                setRevealedRanks([]);
                setActiveWinner(null);
                setPhase(next.status === 'drawing' ? 'tumbling' : 'idle');
                return;
            }

            if (next.status === 'drawing') {
                setPhase('tumbling');
            }
        } catch {
            /* swallow — page will retry on next user interaction */
        }
    }, [activeWinner, arenaMode, event, isAuthenticated, pageDepositConfig, phase, revealedRanks.length, selectedEventParam, winners.length]);

    const handleDrawStart = useCallback(() => {
        revealInProgressRef.current = false;
        setEvent((prev) => (prev ? { ...prev, status: 'drawing' } : prev));
        setPhase('tumbling');
        setRevealedRanks([]);
        setActiveWinner(null);
        toast('The wheel is spinning!', { icon: '🎰' });
        if (hasInteracted && !isMuted) audioEngine.playSpinStart();
    }, [audioEngine, hasInteracted, isMuted]);

    const handleWinners = useCallback((data: { winners: LotteryWinner[]; fairnessProof?: LotteryEvent['fairnessProof'] | null }) => {
        const nextWinners = normalizeRevealWinners(data.winners || []);
        setWinners(nextWinners);
        setEvent((prev) => (prev ? {
            ...prev,
            status: 'completed',
            fairnessProof: data.fairnessProof ?? prev.fairnessProof,
        } : prev));
        if (nextWinners.length === 0) {
            setPhase('completed');
        }
    }, []);

    const handleDrawFailed = useCallback((data: { message: string }) => {
        revealInProgressRef.current = false;
        setPhase('idle');
        setActiveWinner(null);
        toast.error(data?.message || 'Draw was rolled back, retrying shortly…');
        void refetchActiveEvent();
    }, [refetchActiveEvent]);

    const registerPoolGrowth = useCallback((lotteryId: string, tierId: string | undefined, amount: number, tickets: number) => {
        if (!tierId || (!amount && !tickets)) return;
        const cleanAmount = Math.max(0, Number(amount || 0));
        const cleanTickets = Math.max(0, Number(tickets || 0));
        if (!cleanAmount && !cleanTickets) return;

        setPoolTierGrowth((prev) => {
            const eventGrowth = prev[lotteryId] || {};
            const current = eventGrowth[tierId] || { amount: 0, tickets: 0 };
            return {
                ...prev,
                [lotteryId]: {
                    ...eventGrowth,
                    [tierId]: {
                        amount: Number((current.amount + cleanAmount).toFixed(8)),
                        tickets: current.tickets + cleanTickets,
                    },
                },
            };
        });

        window.setTimeout(() => {
            setPoolTierGrowth((prev) => {
                const eventGrowth = prev[lotteryId];
                const current = eventGrowth?.[tierId];
                if (!eventGrowth || !current) return prev;
                const nextAmount = Math.max(0, Number((current.amount - cleanAmount).toFixed(8)));
                const nextTickets = Math.max(0, current.tickets - cleanTickets);
                const nextEventGrowth = { ...eventGrowth };
                if (nextAmount === 0 && nextTickets === 0) {
                    delete nextEventGrowth[tierId];
                } else {
                    nextEventGrowth[tierId] = { amount: nextAmount, tickets: nextTickets };
                }
                if (Object.keys(nextEventGrowth).length === 0) {
                    const next = { ...prev };
                    delete next[lotteryId];
                    return next;
                }
                return {
                    ...prev,
                    [lotteryId]: nextEventGrowth,
                };
            });
        }, 60_000);
    }, []);

    const triggerPoolBoost = useCallback((input: LotteryPoolBoostInput, options?: { markManual?: boolean; share?: boolean }) => {
        const amount = Number(input.amount || 0);
        if (!input.lotteryId || !Number.isFinite(amount) || amount <= 0) return;
        const boost: LotteryPoolBoost = {
            ...input,
            id: `pool-${input.lotteryId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            amount: Number(amount.toFixed(8)),
            quantity: Math.max(0, Number(input.quantity || 0)),
            buyerName: safeLotteryBuyerName(input.buyerName),
        };
        if (options?.markManual) {
            recentManualPoolBoostRef.current = { lotteryId: input.lotteryId, until: Date.now() + 1200 };
        }
        setPoolBoost(boost);
        setPoolHeartbeatByEvent((prev) => ({ ...prev, [input.lotteryId]: boost.id }));
        setPoolActivityByEvent((prev) => ({
            ...prev,
            [input.lotteryId]: {
                id: boost.id,
                lotteryId: input.lotteryId,
                buyerName: boost.buyerName || 'Someone',
                amount: boost.amount,
                symbol: boost.symbol,
                quantity: boost.quantity || 1,
                tierLabel: boost.tierLabel,
            },
        }));
        triggerPoolHaptic(Boolean(input.milestone));
        if (hasInteracted && !isMuted) {
            playPoolBoostChime(Boolean(input.milestone));
        }
        if (options?.share && input.totalAmount) {
            setPoolShareCard({
                id: boost.id,
                lotteryId: input.lotteryId,
                title: 'Smart Bazar lottery pool',
                text: `I just pushed the Smart Bazar pool to ${formatLotteryMoney(input.totalAmount, input.symbol)}.`,
                amount: input.totalAmount,
                symbol: input.symbol,
            });
        }
        window.setTimeout(() => {
            setPoolBoost((current) => current?.id === boost.id ? null : current);
        }, 6200);
        window.setTimeout(() => {
            setPoolHeartbeatByEvent((prev) => {
                if (prev[input.lotteryId] !== boost.id) return prev;
                const next = { ...prev };
                delete next[input.lotteryId];
                return next;
            });
        }, 2600);
    }, [hasInteracted, isMuted]);

    const handlePoolUpdated = useCallback((data: LotteryPoolUpdatePayload) => {
        if (!data?.lotteryId || !data.couponPools) return;
        const sourceEvent = eventRef.current?._id === data.lotteryId
            ? eventRef.current
            : null;
        const previousTotal = getCouponPoolAmount(sourceEvent);
        const nextTotal = Number(data.couponPools.totalAmount || 0);
        const sourceTiers = sourceEvent?.couponTiers || data.couponTiers || [];
        const isPoolWise = sourceTiers.some((tier) => tier.prizeMode === 'pool_percentage');
        let tierId = data.purchase?.couponTierId;
        let tierAmountDelta = 0;
        let ticketDelta = Number(data.purchase?.quantity || data.purchase?.ticketNumbers?.length || 0);

        const tierDeltas = Object.values(data.couponPools.byTier || {}).map((pool) => {
            const prevPool = sourceEvent?.couponPools?.byTier?.[pool.tierId];
            const prevTier = sourceEvent?.couponTiers?.find((item) => item.tierId === pool.tierId);
            const previousAmount = Number(prevPool?.totalAmount ?? prevTier?.poolAmount ?? 0);
            const previousTickets = Number(prevPool?.ticketCount ?? prevTier?.poolTicketCount ?? 0);
            return {
                tierId: pool.tierId,
                amount: Math.max(0, Number(pool.totalAmount || 0) - previousAmount),
                tickets: Math.max(0, Number(pool.ticketCount || 0) - previousTickets),
            };
        });
        const strongestTier = tierDeltas.reduce((best, item) => item.amount > best.amount ? item : best, { tierId: tierId || '', amount: 0, tickets: 0 });
        if (!tierId) tierId = strongestTier.tierId;
        tierAmountDelta = Number(data.purchase?.amount || 0) || strongestTier.amount || Math.max(0, nextTotal - previousTotal);
        if (!ticketDelta) ticketDelta = strongestTier.tickets || 1;

        const tier = sourceTiers.find((item) => item.tierId === tierId);
        const symbol = data.purchase?.currencySymbol || tier?.currencySymbol || sourceTiers[0]?.currencySymbol || 'USDT';
        const buyerName = safeLotteryBuyerName(data.purchase?.buyerName);
        const milestone = crossedPoolMilestone(previousTotal, nextTotal);

        if (isPoolWise && tierAmountDelta > 0) {
            registerPoolGrowth(data.lotteryId, tierId, tierAmountDelta, ticketDelta);
            const recentlyBoosted = recentManualPoolBoostRef.current?.lotteryId === data.lotteryId && Date.now() < recentManualPoolBoostRef.current.until;
            if (!recentlyBoosted) {
                triggerPoolBoost({
                    lotteryId: data.lotteryId,
                    amount: tierAmountDelta,
                    symbol,
                    quantity: ticketDelta,
                    tierId,
                    tierLabel: data.purchase?.couponLabel || tier?.label,
                    buyerName,
                    milestone,
                    totalAmount: nextTotal,
                });
            }
        }

        setEvent((prev) => (prev && prev._id === data.lotteryId ? attachCouponPools(prev, data.couponPools) : prev));
    }, [registerPoolGrowth, triggerPoolBoost]);

    useEffect(() => {
        if (phase !== 'tumbling' || !event?._id || revealInProgressRef.current || winners.length > 0) return;
        const id = window.setTimeout(async () => {
            const currentEventId = event._id;
            const currentWinners = await lotteryApi.getWinners(currentEventId).catch(() => []);

            if (currentWinners?.length) {
                setEvent((prev) => (prev && prev._id === currentEventId
                    ? { ...prev, status: 'completed' }
                    : prev));
                setWinners(normalizeRevealWinners(currentWinners));
                return;
            }

            const next = selectedEventParam
                ? await lotteryApi.getLotteryEvent(currentEventId).catch(() => null)
                : await lotteryApi.getActiveLottery().catch(() => null);
            if (!next) {
                return;
            }

            if (next._id === currentEventId) {
                if (next.status === 'active' || next.status === 'upcoming') {
                    setPhase('idle');
                    setEvent(next);
                } else if (next.status === 'completed') {
                    const w = await lotteryApi.getWinners(currentEventId).catch(() => []);
                    setEvent(next);
                    if (w?.length) {
                        setWinners(normalizeRevealWinners(w));
                    } else {
                        setPhase('completed');
                        setWinners([]);
                    }
                }
            }
        }, DRAW_WATCHDOG_MS);
        return () => window.clearTimeout(id);
    }, [phase, event?._id, refetchActiveEvent, selectedEventParam, winners.length]);

    /**
     * Sequential reveal choreography:
     * wheel spin → stop on winning ticket → ticket reveal → confetti → next rank.
     *
     * Backend sends all winners in one socket event. The frontend owns the show,
     * so we replay one reveal moment per winner instead of dumping the full batch.
     */
    useEffect(() => {
        if (!winners.length) return;

        const shouldReplayCompletedRevealState = Boolean(
            event &&
            event.status === 'completed' &&
            shouldReplayCompletedReveal(event.drawTime, hasSeenLivePhaseRef.current)
        );
        if (isCompletedSticky && !shouldReplayCompletedRevealState) return;

        const winnersId = [...winners]
            .sort((a, b) => a.rank - b.rank)
            .map((w) => `${w._id}:${w.rank}`)
            .join('|');
        if (revealedWinnersIdRef.current === winnersId) return;
        revealedWinnersIdRef.current = winnersId;

        let cancelled = false;
        let completedAll = false;

        const run = async () => {
            revealInProgressRef.current = true;
            setRevealedRanks([]);
            setActiveWinner(null);

            try {
                for (const winner of [...winners].sort((a, b) => a.rank - b.rank)) {
                    if (cancelled) return;

                    setPhase('tumbling');
                    setActiveWinner(null);
                    if (hasInteracted && !isMuted) audioEngine.playSpinStart();
                    await wait(SPIN_BEFORE_REVEAL_MS);
                    if (cancelled) return;

                    setActiveWinner(winner);
                    setPhase('ejecting');
                    await wait(TICKET_EJECT_MS);
                    if (cancelled) return;

                    setRevealedRanks((prev) => (prev.includes(winner.rank) ? prev : [...prev, winner.rank]));
                    fireConfetti();
                    if (hasInteracted && !isMuted) audioEngine.playReveal(winner.rank);

                    await wait(WINNER_CELEBRATION_MS);
                    if (cancelled) return;

                    setActiveWinner(null);
                    await wait(BETWEEN_WINNER_SPINS_MS);
                }

                if (cancelled) return;
                completedAll = true;
                setPhase('completed');
                setEvent((prev) => (prev ? { ...prev, status: 'completed' } : prev));
                toast.success('Winners have been revealed!');
            } finally {
                revealInProgressRef.current = false;
                if (!completedAll) {
                    revealedWinnersIdRef.current = '';
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [winners, isCompletedSticky, event, audioEngine, fireConfetti, hasInteracted, isMuted]);

    const socketLotteryId = arenaMode === 'shop' ? undefined : event?._id;

    const { isConnected } = useLotterySocket({
        lotteryId: socketLotteryId,
        onParticipantJoined: handleParticipantJoined,
        onDrawStart: handleDrawStart,
        onWinners: handleWinners,
        onDrawFailed: handleDrawFailed,
        onPoolUpdated: handlePoolUpdated,
    });

    useEffect(() => {
        if (!shouldShowParticipantPopups) {
            pacing.reset();
        }
    }, [pacing, shouldShowParticipantPopups]);

    const prizeConfigs = useMemo(() => normalizePrizeConfigs(event), [event]);
    const topPrize = prizeConfigs[0] || null;
    const lastWinner = useMemo<LotteryWinner | null>(() => {
        for (const ev of pastEvents) {
            for (const winner of ev.winners || []) {
                if (winner.rank === 1) return winner;
            }
            const fallback = (ev.winners || [])[0];
            if (fallback) return fallback;
        }
        return null;
    }, [pastEvents]);

    const activityItems = useMemo(() => {
        const seen = new Set<string>();
        const unique = participants.filter((e) => {
            const id = e._id ? String(e._id) : '';
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        const latest = unique.slice(0, 60);
        return latest.map((entry, index) => ({
            id: String(entry._id || `idx-${index}`),
            name: playerName(entry),
            action: entry.couponTierId ? 'just bought a lottery coupon' : index % 2 === 0 ? 'just bought a package' : 'just joined the arena',
            lotteryNumber: entry.lotteryNumber,
            time: formatRelativeTime(entry.createdAt),
            icon: index % 3,
        }));
    }, [participants]);

    const wheelTickets = useMemo(() => {
        const participantTickets = participants.map((entry) => entry.lotteryNumber).filter(Boolean);
        const activeTicket = activeWinner?.lotteryNumber;
        const tickets = activeTicket
            ? [activeTicket, ...participantTickets.filter((ticket) => ticket !== activeTicket)]
            : participantTickets;
        return Array.from({ length: 12 }, (_, index) => tickets[index] || FALLBACK_WHEEL_TICKETS[index]);
    }, [activeWinner?.lotteryNumber, participants]);

    const isDrawingPhase = phase === 'tumbling';
    const isRevealPhase = phase === 'tumbling' || phase === 'ejecting';
    const shouldPresentStickyResults = isCompletedSticky && !isRevealPhase && phase === 'completed';
    const isAwaitingDrawSync = Boolean(
        event &&
        !shouldPresentStickyResults &&
        !isRevealPhase &&
        (event.status === 'active' || event.status === 'upcoming') &&
        drawCountdown &&
        drawCountdown.totalMs <= 0
    );
    const hideCouponPanelForCeremony =
        shouldPresentStickyResults || isRevealPhase || isAwaitingDrawSync;
    const showCouponPurchase =
        arenaMode === 'shop'
            ? false
            : arenaMode === 'room'
                ? false
                : isCouponEvent && (focusPurchaseOnMount || !hideCouponPanelForCeremony);
    const countdown = shouldPresentStickyResults ? stickyCountdown : drawCountdown;

    const bannerMediaItems = useMemo<LotteryPageMedia[]>(() => {
        const uploadedMedia = [...(pageMedia || []), ...(event?.lotteryPageMedia || [])];
        const seen = new Set<string>();
        const uniqueMedia = uploadedMedia.filter((media) => {
            if (!media?.value) return false;
            const key = `${media.type}:${media.value}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (uniqueMedia.length > 0) return uniqueMedia.slice(0, 12);
        if ((topPrize?.reward.type === 'image' || topPrize?.reward.type === 'video') && topPrize.reward.value) {
            return [{
                type: topPrize.reward.type,
                value: topPrize.reward.value,
                label: topPrize.reward.label || rewardValueLabel(topPrize.reward),
            }];
        }
        return [];
    }, [event?.lotteryPageMedia, pageMedia, topPrize]);
    const bannerSlideCount = 1 + bannerMediaItems.length;
    const currentRevealedWinners = useMemo(() => {
        return winners
            .filter((winner) => shouldPresentStickyResults || phase === 'completed' || revealedRanks.includes(winner.rank))
            .sort((a, b) => a.rank - b.rank);
    }, [winners, shouldPresentStickyResults, phase, revealedRanks]);
    const completedWinner = useMemo(
        () =>
            currentRevealedWinners.find((winner) => winner.rank === 1) ||
            currentRevealedWinners[0] ||
            winners.find((winner) => winner.rank === 1) ||
            winners[0] ||
            null,
        [currentRevealedWinners, winners]
    );
    const countdownLabel = shouldPresentStickyResults
        ? 'Results reset in'
        : isRevealPhase
            ? 'Draw in progress'
            : isAwaitingDrawSync
                ? 'Entries closed'
                : isPreEvent
                    ? 'Entries close in'
                    : 'Draw starts in';
    const arenaStatus = isRevealPhase
        ? 'Draw In Progress'
        : phase === 'completed' || shouldPresentStickyResults
            ? 'Final Results'
            : isAwaitingDrawSync
                ? 'Entries Closed'
                : isPreEvent
                    ? 'Entries Open'
                    : 'Live Room';
    const centerWheelLabel = activeWinner
        ? 'Winner'
        : isDrawingPhase
            ? 'Drawing'
            : phase === 'completed' || shouldPresentStickyResults
                ? 'Winners'
                : isAwaitingDrawSync
                    ? 'Syncing'
                    : 'Lucky Spin';
    const lockTitle = isRevealPhase
        ? 'Entries locked for draw'
        : phase === 'completed' || shouldPresentStickyResults
            ? 'Final results'
            : isAwaitingDrawSync
                ? 'Entries closed'
                : myEntry || (isCouponEvent && myEntries.length > 0)
                    ? 'Your ticket is confirmed'
                    : 'Entry window open';
    const lockDescription = activeWinner
        ? `${getRankLabel(activeWinner.rank)} revealing: ${activeWinner.lotteryNumber}`
        : phase === 'completed' || shouldPresentStickyResults
            ? completedWinner
                ? `${playerName(completedWinner)} won ${completedWinner.lotteryNumber}. Final results are visible below.`
                : 'Final results are now visible.'
            : isAwaitingDrawSync
                ? 'The entry window is closed and the draw is syncing with the server.'
                : myEntry || (isCouponEvent && myEntries.length > 0)
                    ? isCouponEvent && myEntries.length > 1
                        ? `${myEntries.length} tickets secured for this draw`
                        : `Ticket ${myEntry?.lotteryNumber || myEntries[0]?.lotteryNumber} is secured for the draw`
                    : isCouponEvent
                        ? 'Top up your lottery wallet and buy coupon tiers before the draw closes'
                        : 'Buy a qualifying package before the draw closes';
    const drawDate = event ? new Date(event.drawTime) : null;

    const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);
    const openShare = useCallback(() => setShareOpen(true), []);
    const openHelp = useCallback(() => setArenaTourTrigger((prev) => prev + 1), []);
    const replayWinnerCeremony = useCallback(() => {
        if (!winners.length || revealInProgressRef.current) return;
        hasSeenLivePhaseRef.current = true;
        revealedWinnersIdRef.current = '';
        setActiveWinner(null);
        setRevealedRanks([]);
        setPhase('tumbling');
        setWinners((prev) => [...prev]);
    }, [winners.length]);
    const activeEventId = event?._id ?? null;

    useEffect(() => {
        if (!event?._id) return;
        if (typeof window === 'undefined') return;
        const hashShop = window.location.hash === '#lottery-coupons';
        if (!focusPurchaseOnMount && !hashShop) return;

        let cancelled = false;
        let frameId = 0;
        let attempts = 0;

        const run = () => {
            if (cancelled) return;
            const el = document.getElementById('lottery-coupons');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            attempts += 1;
            if (attempts < 45) {
                frameId = window.requestAnimationFrame(run);
            }
        };

        const timeoutId = window.setTimeout(run, 120);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
            window.cancelAnimationFrame(frameId);
        };
    }, [event?._id, focusPurchaseOnMount, showCouponPurchase]);

    // Auto-show arena guide on first visit
    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEYS.LOTTERY_ARENA_GUIDE_TOUR);
        if (!hasSeen && event) {
            setArenaTourTrigger((prev) => prev + 1);
        }
    }, [event?._id]);

    const queueCouponCelebrateTickets = useCallback((tickets: string[], delayMs = 0) => {
        console.log('Lottery Debug - queueCouponCelebrateTickets called:', tickets, delayMs);
        if (!tickets.length) return;
        if (couponCelebrateDelayRef.current) {
            window.clearTimeout(couponCelebrateDelayRef.current);
            couponCelebrateDelayRef.current = null;
        }
        if (delayMs <= 0) {
            setCouponCelebrateTickets(tickets);
            return;
        }
        setCouponCelebrateTickets(null);
        couponCelebrateDelayRef.current = window.setTimeout(() => {
            setCouponCelebrateTickets(tickets);
            couponCelebrateDelayRef.current = null;
        }, delayMs);
    }, []);

    useEffect(() => {
        return () => {
            if (couponCelebrateDelayRef.current) {
                window.clearTimeout(couponCelebrateDelayRef.current);
            }
        };
    }, []);

    const clearCouponCelebrate = useCallback(() => setCouponCelebrateTickets(null), []);

    const handleShopPurchaseSuccess = useCallback((info: {
        lotteryId: string;
        buyerName: string;
        isExternal: boolean;
        amount: number;
        quantity: number;
        tierId: string;
        couponLabel?: string;
        currencySymbol: string;
        ticketNumbers: string[];
        entries: LotteryEntry[];
        couponPools?: any;
        email?: string;
        walletAddress?: string;
        transactionHash?: string;
        claimAccessToken?: string;
        participantUserId?: string;
    }) => {
        const sourceEvent = event;
        const previousPoolTotal = getCouponPoolAmount(sourceEvent);
        const nextPoolTotal = info.couponPools?.totalAmount ?? (previousPoolTotal + info.amount);
        const milestone = crossedPoolMilestone(previousPoolTotal, nextPoolTotal);
        const purchasedTier = sourceEvent?.couponTiers?.find((tier) => tier.tierId === info.tierId);
        
        if (purchasedTier?.prizeMode === 'pool_percentage') {
            triggerPoolBoost({
                lotteryId: info.lotteryId,
                amount: info.amount,
                symbol: info.currencySymbol,
                quantity: info.quantity,
                tierId: info.tierId,
                tierLabel: info.couponLabel,
                buyerName: info.buyerName,
                milestone,
                totalAmount: nextPoolTotal,
            }, { markManual: true, share: true });
        }
        
        if (arenaMode !== 'shop') {
            setMyEntries((prev) => [...prev, ...info.entries]);
        }
        
        setParticipants((prev) => {
            const incoming = info.entries;
            const merged = [...incoming, ...prev];
            const seen = new Set<string>();
            return merged
                .filter((entry) => {
                    const id = entry._id ? String(entry._id) : '';
                    if (!id || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                })
                .slice(0, RECENT_PARTICIPANT_LIMIT);
        });
        
        setTotalParticipants((prev) => prev + info.entries.length);
        
        if (info.isExternal && info.claimAccessToken && info.email && info.walletAddress && info.transactionHash) {
            const record: ExternalLotteryClaimRecord = {
                lotteryId: info.lotteryId,
                purchaseId: String(info.transactionHash),
                participantUserId: String(info.participantUserId || ''),
                name: info.buyerName.trim(),
                email: info.email,
                walletAddress: info.walletAddress,
                transactionHash: info.transactionHash.trim(),
                claimAccessToken: info.claimAccessToken,
                ticketNumbers: info.ticketNumbers,
                createdAt: new Date().toISOString(),
            };
            setExternalClaimRecords(saveExternalLotteryClaim(record));
        }
        
        if (info.couponPools) {
            handlePoolUpdated({
                lotteryId: info.lotteryId,
                couponPools: info.couponPools,
                purchase: {
                    buyerName: info.buyerName,
                    participantType: info.isExternal ? 'external' : 'project_user',
                    amount: info.amount,
                    quantity: info.quantity,
                    couponTierId: info.tierId,
                    couponLabel: info.couponLabel,
                    currencySymbol: info.currencySymbol,
                    ticketNumbers: info.ticketNumbers,
                },
            });
        }
        
        if (info.ticketNumbers.length) {
            queueCouponCelebrateTickets(info.ticketNumbers, POOL_CINEMA_MS);
        }
    }, [arenaMode, event, handlePoolUpdated, queueCouponCelebrateTickets, triggerPoolBoost]);



    const patchLotteryWinner = useCallback((winnerId: string, patch: Partial<LotteryWinner>) => {
        setWinners((prev) => prev.map((winner) => winnerIdOf(winner) === winnerId ? { ...winner, ...patch } : winner));
        setPastEvents((prev) => prev.map((lotteryEvent) => ({
            ...lotteryEvent,
            winners: (lotteryEvent.winners || []).map((winner) => winnerIdOf(winner) === winnerId ? { ...winner, ...patch } : winner),
        })));
    }, []);

    const externalClaimTargets = useMemo(() => {
        if (!event?._id || !winners.length || !externalClaimRecords.length) return [];
        return winners
            .map((winner) => {
                if (!isExternalWinnerClaimable(winner)) return null;
                const record = externalClaimRecords.find((item) => (
                    item.lotteryId === event._id &&
                    item.ticketNumbers.map(String).includes(String(winner.lotteryNumber || '')) &&
                    (!winner.externalEmail || winner.externalEmail.toLowerCase() === item.email.toLowerCase()) &&
                    (!winner.externalWalletAddress || winner.externalWalletAddress.toLowerCase() === item.walletAddress.toLowerCase())
                ));
                return record ? { winner, record } : null;
            })
            .filter(Boolean) as Array<{ winner: LotteryWinner; record: ExternalLotteryClaimRecord }>;
    }, [event?._id, externalClaimRecords, winners]);

    const claimExternalWinnerFromRecord = useCallback(async (winner: LotteryWinner, record: ExternalLotteryClaimRecord) => {
        const winnerId = winnerIdOf(winner);
        if (!winnerId) return;
        setExternalClaimingWinnerId(winnerId);
        try {
            const result = await lotteryApi.claimExternalReward(winnerId, {
                email: record.email,
                walletAddress: record.walletAddress,
                transactionHash: record.transactionHash,
                claimAccessToken: record.claimAccessToken,
            });
            patchLotteryWinner(winnerId, { claimStatus: result.claimStatus || 'processing', canClaim: false });
            toast.success('External payout claim queued');
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'External claim failed'));
        } finally {
            setExternalClaimingWinnerId(null);
        }
    }, [patchLotteryWinner]);

    /**
     * "Draw starting in 10-1": only highlight a digit when the live countdown
     * actually enters the last 10 seconds, otherwise the rail just sits idle.
     * Avoids the buggy "always 10 active" state.
     */
    const drawStartingIn = useMemo(() => {
        if (!drawCountdown || drawCountdown.totalMs <= 0 || drawCountdown.totalMs > 10_000) return null;
        return Math.max(1, Math.min(10, Math.ceil(drawCountdown.totalMs / 1000)));
    }, [drawCountdown]);
    const startingRailLabel = phase === 'completed' || shouldPresentStickyResults
        ? 'Final results are visible'
        : drawStartingIn !== null
            ? 'Draw starting in'
            : 'Countdown rail';

    const wheelSlices = useMemo(() => {
        return wheelTickets.map((ticket, index) => {
            const angle = index * 30;
            // Bottom-half slices are visually upside-down after rotation; flip the
            // text 180° so every label reads correctly to the viewer.
            const flipped = angle > 90 && angle < 270;
            return { ticket, angle, flipped, key: `${ticket}-${index}` };
        });
    }, [wheelTickets]);

    /**
     * One-line evergreen ticker. We always show the room state plus whichever
     * pieces of context are real — no "—" placeholders, no fake numbers.
     */
    const tickerItems = useMemo<TickerItem[]>(() => {
        const items: TickerItem[] = [];
        if (event) {
            const liveLabel = isPreEvent
                ? 'Entries Open'
                : phase === 'tumbling' || phase === 'ejecting'
                    ? 'Draw In Progress'
                    : phase === 'completed'
                        ? 'Final Results'
                        : isAwaitingDrawSync
                            ? 'Entries Closed'
                            : 'Counting Down';
            items.push({
                id: 'status',
                icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" />,
                label: liveLabel,
                accent: '#fbbf24',
            });
        }
        if (totalParticipants > 0) {
            items.push({
                id: 'tickets',
                icon: <Ticket className="h-3.5 w-3.5 text-amber-400" />,
                label: `${totalParticipants} ${totalParticipants === 1 ? 'ticket' : 'tickets'} in the wheel`,
            });
        }
        if (drawCountdown && drawCountdown.totalMs > 0) {
            items.push({
                id: 'countdown',
                icon: <Clock3 className="h-3.5 w-3.5 text-amber-400" />,
                label: `Draw in ${pad(drawCountdown.hours)}:${pad(drawCountdown.minutes)}:${pad(drawCountdown.seconds)}`,
            });
        }
        if (topPrize) {
            items.push({
                id: 'top-prize',
                icon: <Award className="h-3.5 w-3.5 text-amber-400" />,
                label: `Top Prize · ${rewardValueLabel(topPrize.reward)}`,
                accent: '#fde68a',
            });
        }
        if (lastWinner) {
            items.push({
                id: 'last-winner',
                icon: <Trophy className="h-3.5 w-3.5 text-amber-400" />,
                label: `Last winner · ${playerName(lastWinner)} (${rewardValueLabel(lastWinner.reward)})`,
                accent: '#fde68a',
            });
        }
        return items;
    }, [event, isPreEvent, phase, isAwaitingDrawSync, totalParticipants, drawCountdown, topPrize, lastWinner]);

    useEffect(() => {
        setActiveBannerSlide(0);
        if (bannerSlideCount <= 1) return;

        const id = window.setInterval(() => {
            setActiveBannerSlide((prev) => (prev + 1) % bannerSlideCount);
        }, 4800);

        return () => window.clearInterval(id);
    }, [bannerSlideCount, event?._id]);

    useEffect(() => {
        if (!isAwaitingDrawSync) return;
        void refetchActiveEvent();
        const id = window.setInterval(() => {
            void refetchActiveEvent();
        }, 5000);
        return () => window.clearInterval(id);
    }, [isAwaitingDrawSync, refetchActiveEvent]);

    useEffect(() => {
        if (!activeEventId || shouldPresentStickyResults || revealInProgressRef.current) return;
        const id = window.setInterval(() => {
            if (!revealInProgressRef.current) {
                void refetchActiveEvent();
            }
        }, 10000);
        return () => window.clearInterval(id);
    }, [activeEventId, shouldPresentStickyResults, refetchActiveEvent]);

    if (isLoading) {
        return <LotteryPageLoading subtitle="Checking live room, tickets, rewards, and winners." />;
    }

    if (!event) {
        return (
            <LotteryArenaShell>
                <LotteryArenaTopBar event={null} isMuted={isMuted} onToggleMute={toggleMute} onOpenHelp={openHelp} />
                {!isAuthenticated && (
                    <ExternalStatusLauncher onOpen={() => setExternalStatusOpen(true)} claimCount={externalClaimTargets.length} />
                )}
                <main className="relative z-[1] mx-auto w-full max-w-[1248px] px-3 pb-8 pt-3 sm:px-5 lg:px-6">
                    <section className="relative isolate overflow-hidden rounded-[1.35rem] border border-teal-300/16 bg-[radial-gradient(circle_at_18%_14%,rgba(45,212,191,0.16),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(251,191,36,0.18),transparent_24%),linear-gradient(135deg,rgba(7,13,18,0.96),rgba(5,5,8,0.98)_52%,rgba(17,13,6,0.96))] p-4 shadow-[0_24px_78px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[18px] sm:rounded-[1.75rem] sm:p-5 lg:grid lg:min-h-[520px] lg:grid-cols-[minmax(0,0.94fr)_minmax(390px,1.06fr)] lg:items-center lg:gap-5 lg:p-7">
                        <div className="pointer-events-none absolute inset-0 opacity-45 [background:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px]" />
                        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent" />
                        <div className="relative z-[2] mx-auto max-w-xl py-3 text-center lg:mx-0 lg:max-w-none lg:py-0 lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 sm:text-xs">
                                <Sparkles className="h-4 w-4" />
                                Next draw being scheduled
                            </div>
                            <h2 className="mt-4 text-[clamp(2.15rem,10vw,4.4rem)] font-black leading-[0.92] tracking-[-0.055em] text-white">
                                Lock in your seat for the next live draw
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/68 sm:text-base sm:leading-7 lg:mx-0">
                                The arena floor is getting ready. Buy or hold a qualifying package now and your ticket will be ready when the next room opens.
                            </p>
                            <div className="mt-5 grid grid-cols-2 gap-2 text-left text-[11px] font-black uppercase tracking-[0.12em] text-white/72 sm:mx-auto sm:max-w-md sm:grid-cols-3 lg:mx-0">
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <span className="block text-amber-200">Status</span>
                                    Standby
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <span className="block text-teal-200">Room</span>
                                    Preparing
                                </div>
                                <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:col-span-1">
                                    <span className="block text-cyan-200">Ticket</span>
                                    Package based
                                </div>
                            </div>
                            <Link
                                href="/packages"
                                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[0.9rem] border border-amber-100/70 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#150d00] shadow-[0_16px_38px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-fit sm:px-6"
                            >
                                <Ticket className="h-4 w-4" />
                                Buy package now
                            </Link>
                        </div>

                        <div className="relative z-[1] mt-5 min-h-[310px] overflow-hidden rounded-[1.15rem] border border-amber-300/16 bg-[radial-gradient(circle_at_55%_54%,rgba(251,191,36,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(0,0,0,0.24))] p-3 sm:min-h-[390px] sm:rounded-[1.45rem] sm:p-5 lg:mt-0 lg:min-h-[460px]">
                            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
                            <div className="pointer-events-none absolute bottom-0 left-0 z-[2] w-[118px] sm:w-[165px] md:w-[190px] lg:w-[220px]">
                                <img
                                    src="/assets/images/lottery/lucky-spin-hostess.png"
                                    alt="Lottery hostess"
                                    className="h-auto w-full object-contain object-bottom brightness-110 contrast-105 drop-shadow-[0_18px_36px_rgba(0,0,0,0.78)] [mask-image:linear-gradient(to_bottom,black_76%,transparent_100%)]"
                                />
                            </div>
                            <div className="absolute right-3 top-3 z-[3] inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-teal-100">
                                <Wifi className="h-3.5 w-3.5 text-emerald-300" />
                                Wheel standby
                            </div>
                            <div className="absolute left-[52%] top-[54%] z-[1] w-[min(360px,74vw)] -translate-x-1/2 -translate-y-1/2 sm:left-[58%] sm:w-[min(460px,64vw)] lg:left-[61%] lg:w-[min(520px,36vw)]">
                                <div className="lottery-wheel-shell relative aspect-square isolate drop-shadow-[0_34px_54px_rgba(0,0,0,0.65)]">
                                <div className="lottery-spin-wheel">
                                    {FALLBACK_WHEEL_TICKETS.map((ticket, index) => (
                                        <span
                                            key={ticket}
                                            className="absolute inset-0 z-[2] flex justify-center pt-[8.8%] pointer-events-none"
                                            style={{ transform: `rotate(${index * 30}deg)` }}
                                        >
                                            <span className="block min-w-[5.8rem] text-white/95 text-[clamp(0.62rem,1.32vw,0.92rem)] font-black tracking-[0.035em] text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.82),0_0_14px_rgba(255,255,255,0.18)] whitespace-nowrap">
                                                {ticket}
                                            </span>
                                        </span>
                                    ))}
                                    <div className="lottery-wheel-center">Standby</div>
                                </div>
                                </div>
                            </div>
                            <div className="absolute bottom-3 right-3 z-[3] rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-right text-[10px] font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur sm:text-xs">
                                <span className="block text-amber-200">Hostess ready</span>
                                Draw floor opening soon
                            </div>
                        </div>
                    </section>

                    {pastEvents.length > 0 && <WinnersReel events={pastEvents} />}
                </main>
                <ExternalTicketStatusDialog
                    open={externalStatusOpen}
                    onClose={() => setExternalStatusOpen(false)}
                    storedClaims={externalClaimRecords}
                    onWinnerPatch={patchLotteryWinner}
                />
                {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} event={null} />}
                {shareOpen && <ShareModal onClose={() => setShareOpen(false)} eventTitle="next draw" />}
            </LotteryArenaShell>
        );
    }

    if (arenaMode === 'shop') {
        return (
            <LotteryArenaShell>
                <LotteryShopView
                    event={event}
                    selectedEventParam={selectedEventParam}
                    claimCount={externalClaimTargets.length}
                    onOpenStatus={() => setExternalStatusOpen(true)}
                />
                <ExternalTicketStatusDialog
                    open={externalStatusOpen}
                    onClose={() => setExternalStatusOpen(false)}
                    storedClaims={externalClaimRecords}
                    onWinnerPatch={patchLotteryWinner}
                />
            </LotteryArenaShell>
        );
    }

    return (
        <LotteryArenaShell>
            <LotteryArenaTopBar
                event={event}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                onOpenHelp={openHelp}
                lobbyHref={isCouponEvent ? '/lottery' : undefined}
            />
            {!isAuthenticated && (
                <ExternalStatusLauncher onOpen={() => setExternalStatusOpen(true)} claimCount={externalClaimTargets.length} />
            )}
            {tickerItems.length > 0 ? <LotteryTicker items={tickerItems} /> : null}
            {externalClaimTargets.length > 0 ? (
                <div className="relative z-[2] mx-auto mt-2 w-full max-w-[1248px] px-4">
                    <div className="rounded-2xl border border-amber-500/24 bg-[#1c1407]/85 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-400/80">External winner detected</div>
                            <p className="mt-1 text-sm text-white/66">A winning ticket saved on this device is ready to claim.</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                            {externalClaimTargets.slice(0, 3).map(({ winner, record }) => {
                                const winnerId = winnerIdOf(winner);
                                return (
                                    <button
                                        key={`${winnerId}:${record.purchaseId}`}
                                        type="button"
                                        onClick={() => claimExternalWinnerFromRecord(winner, record)}
                                        disabled={externalClaimingWinnerId === winnerId}
                                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/15 px-3 text-xs font-black uppercase tracking-wide text-amber-400 transition hover:border-amber-500/55 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {externalClaimingWinnerId === winnerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                                        Claim #{winner.lotteryNumber}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}
            <main ref={pullRefreshRef} className="relative z-[1] mx-auto w-full max-w-[1360px] px-3 pb-20 pt-3 sm:px-4 lg:px-6 lg:pb-8">
                {/* Pull-to-refresh indicator */}
                <div
                    className={`pointer-events-none mx-auto mb-1 flex justify-center overflow-hidden transition-all duration-200 lg:hidden ${pullDistance > 0 || isRefreshing ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}
                    style={{ height: pullDistance > 0 ? `${Math.min(pullDistance, 48)}px` : isRefreshing ? '36px' : '0px' }}
                >
                    <div className={`flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 ${isRefreshing ? 'animate-pulse' : ''}`}>
                        <Loader2 className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing…' : 'Pull to refresh'}
                    </div>
                </div>
                <div className="grid gap-4 sm:gap-5">
                    <section ref={heroSectionRef} className="lottery-info-card relative overflow-hidden rounded-[1.55rem] border p-3 sm:p-4 lg:p-5">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/55 to-transparent" />
                        <div className="relative grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.5fr)] lg:items-stretch">
                            <div className="flex min-w-0 flex-col justify-between gap-3 sm:gap-5">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/22 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                                            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]' : 'bg-rose-300 shadow-[0_0_14px_rgba(253,164,175,0.78)]'}`} />
                                            {arenaStatus}
                                        </span>
                                        {isCouponEvent ? (
                                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                                                <Ticket className="h-3.5 w-3.5" />
                                                Coupon room
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Package entry
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="mt-2 sm:mt-4 max-w-4xl break-words text-[clamp(1.5rem,5.5vw,5.6rem)] font-black leading-[0.9] text-white">
                                        {event.title}
                                    </h1>
                                    <p className="mt-2 sm:mt-4 max-w-2xl text-sm font-medium leading-6 text-white/68 line-clamp-2 sm:line-clamp-none sm:text-base sm:leading-7">
                                        {lockDescription}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    {isCouponEvent ? (
                                        <Link
                                            href={`/lottery?view=shop${event?._id ? `&event=${encodeURIComponent(event._id)}` : ''}`}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200/45 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 px-4 text-sm font-black text-[#050508] shadow-[0_16px_34px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:brightness-105"
                                        >
                                            <Wallet className="h-4 w-4" />
                                            Buy coupons
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/packages"
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200/45 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 px-4 text-sm font-black text-[#050508] shadow-[0_16px_34px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:brightness-105"
                                        >
                                            <Ticket className="h-4 w-4" />
                                            Get entry
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={openShare}
                                        className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/[0.09] sm:inline-flex"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        Share room
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openHelp}
                                        className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-black text-white/82 transition hover:-translate-y-0.5 hover:border-white/22 hover:text-white sm:inline-flex"
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                        How it works
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 overflow-x-auto snap-x pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-1">
                                <article className={`shrink-0 w-[72vw] snap-start rounded-[1.2rem] border p-3 sm:w-auto sm:p-4 transition-all duration-500 ${
                                    countdown && countdown.totalMs > 0 && countdown.totalMs <= 60_000
                                        ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-[shake_0.5s_ease-in-out_infinite]'
                                        : countdown && countdown.totalMs > 0 && countdown.totalMs <= 5 * 60_000
                                            ? 'border-red-400/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.12)] animate-pulse'
                                            : 'border-white/10 bg-black/24'
                                }`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{countdownLabel}</span>
                                        <Clock3 className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <strong className="mt-2 block whitespace-nowrap text-[clamp(1.75rem,7vw,2.7rem)] font-black leading-none text-white">
                                        {countdown && countdown.totalMs > 0 ? `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}` : shouldPresentStickyResults ? 'Results' : '00:00:00'}
                                    </strong>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-bold text-white/55">
                                            Draw {drawDate?.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <DrawReminder drawTime={event?.drawTime} eventTitle={event?.title} />
                                    </div>
                                </article>
                                <article className="shrink-0 w-[72vw] snap-start rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-3 sm:w-auto sm:p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Room size</span>
                                        <Flame className="h-4 w-4 text-amber-200" />
                                    </div>
                                    <strong className="mt-2 block text-[clamp(1.75rem,7vw,2.7rem)] font-black leading-none text-white">
                                        {animatedParticipants.toLocaleString()}
                                    </strong>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                        <span
                                            className="block h-full rounded-full bg-[linear-gradient(90deg,#fbbf24,#d97706)]"
                                            style={{
                                                width: `${event.minParticipants ? Math.max(6, Math.min(100, (totalParticipants / event.minParticipants) * 100)) : 100}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-2 truncate text-xs font-bold text-white/55">
                                        {event.minParticipants ? `${Math.max(event.minParticipants - totalParticipants, 0)} needed for target` : 'Entries syncing live'}
                                    </p>
                                </article>
                                <article className="shrink-0 w-[72vw] snap-start rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-3 sm:col-span-2 sm:w-auto sm:p-4 lg:col-span-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Top prize</span>
                                        <Trophy className="h-4 w-4 text-amber-200" />
                                    </div>
                                    <strong className="mt-2 block truncate text-xl font-black text-white">
                                        {topPrize ? rewardValueLabel(topPrize.reward) : 'Prize loading'}
                                    </strong>
                                    <p className="mt-2 truncate text-xs font-bold text-white/55">
                                        {topPrize ? getRankLabel(topPrize.rank) : 'Reward desk will update soon'}
                                    </p>
                                </article>
                            </div>
                        </div>
                    </section>

                    {isCouponEvent ? (
                        <LotteryRoomPoolSummary
                            event={event}
                            tierGrowth={poolTierGrowth[event._id] || {}}
                            poolActivity={poolActivityByEvent[event._id] || null}
                            heartbeatId={poolHeartbeatByEvent[event._id] || null}
                        />
                    ) : null}

                    {/* ── Mobile Tabbed View ── */}
                    <MobileArenaTabView
                        tabs={[
                            {
                                id: 'wheel',
                                icon: <Sparkles className="h-3.5 w-3.5" />,
                                label: 'Live Wheel',
                                content: (
                                    <section className="lottery-live-stage rounded-[1.55rem] border">
                                        <LotteryWheel
                                            isDrawingPhase={isDrawingPhase}
                                            wheelSlices={wheelSlices}
                                            centerWheelLabel={centerWheelLabel}
                                            lockTitle={lockTitle}
                                            lockDescription={lockDescription}
                                            activeWinner={activeWinner}
                                            completedWinner={completedWinner}
                                            phase={phase}
                                            totalParticipants={totalParticipants}
                                            isConnected={isConnected}
                                        />
                                        {drawStartingIn !== null ? (
                                            <div className="mx-4 mb-4 rounded-2xl border border-amber-200/24 bg-amber-300/10 p-3 text-center">
                                                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                                                    {startingRailLabel}
                                                </h3>
                                                <div className="mt-3 grid grid-cols-10 gap-1.5">
                                                    {Array.from({ length: 10 }, (_, index) => 10 - index).map((number) => (
                                                        <span
                                                            key={number}
                                                            className={`grid aspect-square min-h-8 place-items-center rounded-full border text-sm font-black transition ${drawStartingIn === number
                                                                    ? 'scale-110 border-amber-100 bg-amber-200 text-[#261606] shadow-[0_0_26px_rgba(251,191,36,0.45)]'
                                                                    : 'border-white/12 bg-black/20 text-white/60'
                                                                }`}
                                                        >
                                                            {number}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                        {/* Feature 7: Quick-Glance Ticket Badge */}
                                        {(myEntry || (isCouponEvent && myEntries.length > 0)) && (
                                            <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/8 px-3 py-2 xl:hidden">
                                                <Ticket className="h-4 w-4 shrink-0 text-emerald-300" />
                                                <span className="text-xs font-black text-emerald-200">
                                                    {isCouponEvent && myEntries.length > 0
                                                        ? `${myEntries.length} ticket${myEntries.length === 1 ? '' : 's'} secured`
                                                        : `Ticket ${myEntry?.lotteryNumber}`}
                                                </span>
                                            </div>
                                        )}
                                    </section>
                                ),
                            },
                            {
                                id: 'prizes',
                                icon: <Trophy className="h-3.5 w-3.5" />,
                                label: 'Prizes',
                                content: (
                                    <LotteryPrizeLadder
                                        prizeConfigs={prizeConfigs}
                                        winners={winners}
                                        revealedRanks={revealedRanks}
                                        phase={phase}
                                        isCompletedSticky={shouldPresentStickyResults}
                                        event={event}
                                        activeWinner={activeWinner}
                                    />
                                ),
                            },
                            {
                                id: 'activity',
                                icon: <Wifi className="h-3.5 w-3.5" />,
                                label: 'Activity',
                                content: <LotteryActivityPanel activityItems={activityItems} />,
                            },
                        ]}
                    />

                    {/* ── Desktop Grid Layout (hidden on mobile, shown on xl) ── */}
                    <section className="hidden items-start gap-4 xl:grid xl:grid-cols-[minmax(250px,0.74fr)_minmax(420px,1.22fr)_minmax(260px,0.82fr)]">
                        <div className="grid gap-4">
                            <LotteryPrizeLadder
                                prizeConfigs={prizeConfigs}
                                winners={winners}
                                revealedRanks={revealedRanks}
                                phase={phase}
                                isCompletedSticky={shouldPresentStickyResults}
                                event={event}
                                activeWinner={activeWinner}
                            />
                            <section className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.025)),rgba(5,14,16,0.82)] p-3 shadow-[0_20px_58px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Your pass</p>
                                        <h3 className="mt-2 truncate text-lg font-black text-white">
                                            {isCouponEvent && myEntries.length > 0
                                                ? `${myEntries.length} coupon${myEntries.length === 1 ? '' : 's'} secured`
                                                : myEntry
                                                    ? `Ticket ${myEntry.lotteryNumber}`
                                                    : 'No ticket found yet'}
                                        </h3>
                                    </div>
                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                        <Ticket className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-white/62 line-clamp-1 sm:mt-3 sm:line-clamp-none">
                                    {isCouponEvent
                                        ? myEntries.length > 0
                                            ? 'Your coupons are locked into this draw. Keep this room open for the reveal.'
                                            : 'Buy coupons or check an external ticket to join the reveal.'
                                        : myEntry
                                            ? 'Your qualifying entry is ready for the draw.'
                                            : 'Buy a package before entries close to get your room pass.'}
                                </p>
                                <div className="mt-3 grid gap-2">
                                    {isCouponEvent ? (
                                        <Link
                                            href={`/lottery?view=shop${event?._id ? `&event=${encodeURIComponent(event._id)}` : ''}`}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 text-sm font-black text-amber-400 transition hover:border-amber-500/45 hover:bg-amber-500/16"
                                        >
                                            <Wallet className="h-4 w-4" />
                                            Open coupon shop
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/packages"
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 text-sm font-black text-amber-400 transition hover:border-amber-500/45 hover:bg-amber-500/16"
                                        >
                                            <Ticket className="h-4 w-4" />
                                            View packages
                                        </Link>
                                    )}
                                    {!isAuthenticated && (
                                        <button
                                            type="button"
                                            onClick={() => setExternalStatusOpen(true)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white/78 transition hover:border-white/20 hover:text-white"
                                        >
                                            <Search className="h-4 w-4" />
                                            Check ticket status
                                        </button>
                                    )}
                                </div>
                            </section>
                        </div>

                        <section className="lottery-live-stage rounded-[1.55rem] border">
                            <LotteryWheel
                                isDrawingPhase={isDrawingPhase}
                                wheelSlices={wheelSlices}
                                centerWheelLabel={centerWheelLabel}
                                lockTitle={lockTitle}
                                lockDescription={lockDescription}
                                activeWinner={activeWinner}
                                completedWinner={completedWinner}
                                phase={phase}
                                totalParticipants={totalParticipants}
                                isConnected={isConnected}
                            />
                            {drawStartingIn !== null ? (
                                <div className="mx-4 mb-4 rounded-2xl border border-amber-200/24 bg-amber-300/10 p-3 text-center sm:mx-5">
                                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                                        {startingRailLabel}
                                    </h3>
                                    <div className="mt-3 grid grid-cols-10 gap-1.5">
                                        {Array.from({ length: 10 }, (_, index) => 10 - index).map((number) => (
                                            <span
                                                key={number}
                                                className={`grid aspect-square min-h-8 place-items-center rounded-full border text-sm font-black transition sm:min-h-10 sm:text-base ${drawStartingIn === number
                                                        ? 'scale-110 border-amber-100 bg-amber-200 text-[#261606] shadow-[0_0_26px_rgba(251,191,36,0.45)]'
                                                        : 'border-white/12 bg-black/20 text-white/60'
                                                    }`}
                                            >
                                                {number}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </section>

                        <div className="grid gap-4">
                            <LotteryActivityPanel activityItems={activityItems} />
                            <section className="hidden rounded-[1.25rem] border border-amber-100/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.06),rgba(250,204,21,0.015)),rgba(9,9,11,0.95)] p-4 shadow-[0_22px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl xl:block">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Room signal</p>
                                        <h3 className="mt-2 text-lg font-black text-white">{isConnected ? 'Connected' : 'Reconnecting'}</h3>
                                    </div>
                                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${isConnected ? 'border-emerald-200/22 bg-emerald-300/10 text-emerald-100' : 'border-rose-200/22 bg-rose-300/10 text-rose-100'}`}>
                                        {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                                    </div>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-white/62">
                                    {isConnected ? 'Pool updates, tickets, and winner reveals are streaming in real time.' : 'We are restoring live updates. The draw state will refresh automatically.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={openShare}
                                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200/25 bg-amber-300/10 px-3 text-sm font-black text-amber-50 transition hover:border-amber-100/45 hover:bg-amber-300/16"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Invite friends
                                </button>
                            </section>
                        </div>
                    </section>

                    {winners.length > 0 && (currentRevealedWinners.length > 0 || activeWinner || shouldPresentStickyResults || phase === 'completed') && (
                        <LotteryWinnersRevealSection
                            winners={winners}
                            revealedRanks={revealedRanks}
                            revealAll={shouldPresentStickyResults || phase === 'completed'}
                            isStickyCompleted={shouldPresentStickyResults}
                            fairnessProof={event.fairnessProof || null}
                            canReplay={phase === 'completed' && !activeWinner}
                            onReplay={replayWinnerCeremony}
                        />
                    )}

                    <WinnersReel events={pastEvents} limit={10} />
                </div>
            </main>

            <MobileCta
                hidden={shouldPresentStickyResults || isAwaitingDrawSync || isRevealPhase}
                countdown={
                    countdown && countdown.totalMs > 0
                        ? {
                            hours: countdown.hours,
                            minutes: countdown.minutes,
                            seconds: countdown.seconds,
                            totalMs: countdown.totalMs,
                        }
                        : undefined
                }
                countdownLabel={countdownLabel}
                href={isCouponEvent ? (arenaMode === 'room' ? `/lottery?view=shop${event?._id ? `&event=${encodeURIComponent(event._id)}` : ''}` : '#lottery-coupons') : '/packages'}
                ctaLabel={isCouponEvent ? 'Buy coupons' : 'Buy package'}
                existingTicket={
                    isCouponEvent && myEntries.length > 0
                        ? myEntries.length === 1
                            ? myEntries[0].lotteryNumber
                            : `${myEntries.length} tickets`
                        : myEntry?.lotteryNumber ?? undefined
                }
            />

            <StickyCountdownPill
                countdown={countdown && countdown.totalMs > 0 ? { hours: countdown.hours, minutes: countdown.minutes, seconds: countdown.seconds, totalMs: countdown.totalMs } : null}
                countdownLabel={countdownLabel}
                ticketNumber={isCouponEvent && myEntries.length > 0 ? `${myEntries.length} tickets` : myEntry?.lotteryNumber ?? null}
                heroRef={heroSectionRef}
            />

            <ParticipantPopup card={pacing.latestPopup} queueSize={pacing.queueSize} />

            <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
                {confettiBursts.map((burst) => (
                    <div key={burst.id} className="absolute inset-0">
                        {burst.pieces.map((piece) => (
                            <span
                                key={piece.id}
                                className="lottery-confetti-piece"
                                style={{
                                    left: `${piece.left}%`,
                                    animationDelay: `${piece.delay}ms`,
                                    animationDuration: `${piece.duration}ms`,
                                    background: piece.color,
                                    width: `${piece.size}px`,
                                    height: `${Math.max(8, Math.round(piece.size * 1.6))}px`,
                                    ['--drift' as string]: `${Math.round(-40 + Math.random() * 80)}px`,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {couponCelebrateTickets?.length ? (
                <LotteryCouponCelebrate ticketNumbers={couponCelebrateTickets} onComplete={clearCouponCelebrate} />
            ) : null}

            <ExternalTicketStatusDialog
                open={externalStatusOpen}
                onClose={() => setExternalStatusOpen(false)}
                storedClaims={externalClaimRecords}
                onWinnerPatch={patchLotteryWinner}
            />
            {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} event={event} />}
            {shareOpen && <ShareModal onClose={() => setShareOpen(false)} eventTitle={event?.title || 'next draw'} />}
            <LotteryArenaGuide trigger={arenaTourTrigger} onComplete={() => {}} />
            <MyWinsBadge />
            <LotteryLiveReactions />
            {isRevealPhase && activeWinner?.rank === 1 && (
                <MegaWinOverlay 
                    winnerName={playerName(activeWinner)} 
                    rewardLabel={rewardValueLabel(activeWinner.reward)} 
                />
            )}
        </LotteryArenaShell>
    );
}
