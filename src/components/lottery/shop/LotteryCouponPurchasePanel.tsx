'use client';

import { useCallback, useState, useMemo, useRef } from 'react';
import {
    ArrowLeftRight,
    Copy,
    Flame,
    ShieldCheck,
    Wallet,
    TrendingUp,
    Sparkles,
    Ticket,
    Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LotteryEvent,
    LotteryWalletResponse,
    LotteryWalletTransferOptions,
    LotteryEntry,
    LotteryDepositConfig
} from '@/lib/api/lotteryApi';
import { formatLotteryMoney } from '@/components/lottery/lotteryMoney';
import LotteryPrizeVault from './LotteryPrizeVault';
import { useLotteryShop } from './useLotteryShop';
import LotteryCouponCelebrate from './LotteryCouponCelebrate';
import { useAppSelector } from '@/lib/store/hooks';

export type LotteryPoolBoost = {
    id: string;
    lotteryId: string;
    amount: number;
    symbol: string;
    quantity?: number;
    tierId?: string;
    tierLabel?: string;
    buyerName?: string;
    maxPurchasesPerUser?: number;
    minDeposit?: number;
    milestone?: number;
    totalAmount?: number;
};

export type PoolTierGrowth = {
    amount: number;
    tickets: number;
};

export type PoolActivity = {
    id: string;
    lotteryId: string;
    buyerName: string;
    amount: number;
    symbol: string;
    quantity: number;
    tierLabel?: string;
};

export type PoolShareCard = {
    id: string;
    lotteryId: string;
    title: string;
    text: string;
    amount: number;
    symbol: string;
};

function useSoundEffects() {
    const playClick = useCallback(() => {
        try {
            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtor();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) { }
    }, []);

    const playWhoosh = useCallback(() => {
        try {
            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtor();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1.2);
        } catch (e) { }
    }, []);

    return { playClick, playWhoosh };
}

const BTN_NEON_BUY = "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-[#1c1201] font-black shadow-[0_0_15px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.65)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200";
const BTN_NEON_TOPUP = "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-[#1c1201] font-black shadow-[0_0_15px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.65)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200";

export default function LotteryCouponPurchasePanel({
    event,
    poolBoost,
    poolTierGrowth,
    poolActivity,
    poolHeartbeatId,
    poolShareCard,
    onDismissPoolShareCard,
    pageDepositConfig,
    onPurchaseSuccess,
}: {
    event: LotteryEvent | null;
    poolBoost?: LotteryPoolBoost | null;
    poolTierGrowth?: Record<string, PoolTierGrowth>;
    poolActivity?: PoolActivity | null;
    poolHeartbeatId?: string | null;
    poolShareCard?: PoolShareCard | null;
    onDismissPoolShareCard?: () => void;
    pageDepositConfig?: LotteryDepositConfig;
    onPurchaseSuccess?: (info: {
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
    }) => void;
}) {

    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const authUser = useAppSelector((state) => state.auth.user);

    const [couponCelebrateTickets, setCouponCelebrateTickets] = useState<string[] | null>(null);
    const couponCelebrateDelayRef = useRef<number | null>(null);

    const handlePurchaseSuccess = useCallback((info: any) => {
        if (info.ticketNumbers?.length) {
            if (couponCelebrateDelayRef.current) {
                window.clearTimeout(couponCelebrateDelayRef.current);
            }
            couponCelebrateDelayRef.current = window.setTimeout(() => {
                setCouponCelebrateTickets(info.ticketNumbers);
                couponCelebrateDelayRef.current = null;
            }, 6400);
        }
        if (onPurchaseSuccess) {
            onPurchaseSuccess(info);
        }
    }, [onPurchaseSuccess]);

    // We only enable socket subscription in useLotteryShop if the parent did NOT pass pool states
    const enableSocket = poolBoost === undefined;
    const shop = useLotteryShop({
        event,
        pageDepositConfig,
        onPurchaseSuccess: handlePurchaseSuccess,
        enabled: true,
        enableSocket,
    });

    const activeEvent = shop.event || event;
    const lotteryReferralLink = useMemo(() => {
        if (!authUser?.userId || typeof window === 'undefined') return '';
        return `${window.location.origin}/lottery?ref=${encodeURIComponent(authUser.userId)}`;
    }, [authUser?.userId]);
    const resolvedPoolBoost = poolBoost !== undefined ? poolBoost : shop.poolBoost;
    const resolvedPoolTierGrowth = poolTierGrowth !== undefined ? poolTierGrowth : (shop.poolTierGrowth || {});
    const resolvedPoolActivity = poolActivity !== undefined ? poolActivity : shop.poolActivity;
    const resolvedPoolHeartbeatId = poolHeartbeatId !== undefined ? poolHeartbeatId : shop.poolHeartbeatId;

    const wallet = shop.lotteryWallet;
    const transferOptions = shop.lotteryTransferOptions;
    const myEntries = shop.couponPanelEntries;
    const onDeposit = shop.handleLotteryDeposit;
    const onTransfer = shop.handleLotteryWalletTransfer;
    const onExternalPurchase = shop.handleExternalCouponPurchase;
    const onPurchase = shop.handleCouponPurchase;
    const isBusy = shop.couponBusy;
    const { playClick, playWhoosh } = useSoundEffects();
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Wallet action UI state
    const [walletAction, setWalletAction] = useState<'none' | 'deposit' | 'transfer' | 'guest'>('none');
    const [copiedAddress, setCopiedAddress] = useState(false);

    // Manual Deposit form state
    const [depositAmount, setDepositAmount] = useState('');
    const [depositHash, setDepositHash] = useState('');

    // Wallet Transfer form state
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDirection, setTransferDirection] = useState<'to_lottery' | 'from_lottery'>('to_lottery');
    const [selectedTransferWallet, setSelectedTransferWallet] = useState('');

    // Guest checkout state
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestWallet, setGuestWallet] = useState('');
    const [guestTx, setGuestTx] = useState('');
    const [selectedGuestTierId, setSelectedGuestTierId] = useState<string>('');
    const [selectedGuestQty, setSelectedGuestQty] = useState<number>(1);

    // References to credit scoreboard for auto-scrolling
    const walletRef = useRef<HTMLDivElement>(null);

    const copyTextSafely = (text: string, successMessage: string, markAddressCopied = false) => {
        if (!text) return;
        const onSuccess = () => {
            if (markAddressCopied) {
                setCopiedAddress(true);
                setTimeout(() => setCopiedAddress(false), 2000);
            }
            toast.success(successMessage);
        };

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopyText(text, onSuccess));
            return;
        }

        fallbackCopyText(text, onSuccess);
    };

    const handleCopyAddress = () => {
        copyTextSafely(qrValue, 'Address copied to clipboard', true);
    };

    const fallbackCopyText = (text: string, onSuccess: () => void) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                onSuccess();
            } else {
                toast.error('Failed to copy. Please copy manually.');
            }
        } catch (err) {
            toast.error('Failed to copy. Please copy manually.');
        }
    };

    const tiers = activeEvent ? (activeEvent.couponTiers || []).filter((tier) => tier.enabled !== false) : [];
    const walletBalance = wallet?.wallet?.availableBalance ?? 0;
    const depositConfig = wallet?.depositConfig || shop.pageDepositConfig || pageDepositConfig;
    const transferConfig = transferOptions?.lotteryWalletTransferConfig || wallet?.lotteryWalletTransferConfig;
    const transferWallets = transferOptions?.wallets || [];
    const selectableTransferWallets = transferWallets.filter((item) => item.walletTypeCode !== 'LOTTERY_WALLET');

    const activeTransferWallet = selectedTransferWallet || selectableTransferWallets[0]?.walletTypeCode || '';
    const walletSymbol = depositConfig?.tokenSymbol || tiers[0]?.currencySymbol || 'USDT';
    const qrValue = depositConfig?.depositAddress || '';
    const transferFeeMode = transferConfig?.feeDeductionMode || 'none';

    const transferFeeValueLabel = transferConfig?.feeValue
        ? transferConfig.feeType === 'percentage'
            ? `${transferConfig.feeValue}%`
            : `${transferConfig.feeValue} ${walletSymbol}`
        : '';
    const transferFeeLabel = transferFeeMode === 'none' || !transferFeeValueLabel
        ? 'No transfer fee'
        : transferFeeMode === 'extra'
            ? `${transferFeeValueLabel} fee added`
            : `${transferFeeValueLabel} fee included`;

    const activeTransferWalletInfo = selectableTransferWallets.find((item) => item.walletTypeCode === activeTransferWallet);
    const transferInputAmount = Number(transferAmount);
    const hasTransferInput = Number.isFinite(transferInputAmount) && transferInputAmount > 0;
    const rawTransferFeeAmount = hasTransferInput && transferConfig?.feeValue && transferFeeMode !== 'none'
        ? Number((transferConfig.feeType === 'percentage'
            ? (transferInputAmount * Number(transferConfig.feeValue || 0)) / 100
            : Number(transferConfig.feeValue || 0)).toFixed(8))
        : 0;
    const previewFeeAmount = Number.isFinite(rawTransferFeeAmount) ? rawTransferFeeAmount : 0;

    const previewDebitAmount = hasTransferInput
        ? Number((transferFeeMode === 'extra' ? transferInputAmount + previewFeeAmount : transferInputAmount).toFixed(8))
        : 0;
    const previewCreditAmount = hasTransferInput
        ? Number((transferFeeMode === 'included' ? Math.max(0, transferInputAmount - previewFeeAmount) : transferInputAmount).toFixed(8))
        : 0;

    const previewFromWallet = transferDirection === 'to_lottery' ? activeTransferWallet : 'LOTTERY_WALLET';
    const previewToWallet = transferDirection === 'to_lottery' ? 'LOTTERY_WALLET' : activeTransferWallet;
    const previewSourceBalance = transferDirection === 'to_lottery'
        ? Number(activeTransferWalletInfo?.wallet?.availableBalance || 0)
        : walletBalance;
    const previewFeeTooHigh = hasTransferInput && transferFeeMode === 'included' && previewFeeAmount >= transferInputAmount;
    const previewInsufficient = hasTransferInput && previewDebitAmount > previewSourceBalance;

    const entriesByTier = useMemo(() => {
        return myEntries.reduce<Record<string, LotteryEntry[]>>((acc, entry) => {
            const key = entry.couponTierId || 'default';
            if (!acc[key]) acc[key] = [];
            acc[key].push(entry);
            return acc;
        }, {});
    }, [myEntries]);

    const hotTierId = useMemo(() => {
        return Object.entries(poolTierGrowth || {}).reduce((best, [tierId, growth]) => {
            return Number(growth.amount || 0) > Number(best.amount || 0) ? { tierId, amount: Number(growth.amount || 0) } : best;
        }, { tierId: '', amount: 0 }).tierId;
    }, [poolTierGrowth]);

    // Best value = tier with most tickets sold (most popular among buyers)
    const bestValueTierId = useMemo(() => {
        if (tiers.length <= 1) return '';
        const poolByTier = activeEvent?.couponPools?.byTier || {};
        return tiers.reduce((best, tier) => {
            const tickets = Number(poolByTier[tier.tierId]?.ticketCount ?? tier.poolTicketCount ?? 0);
            return tickets > best.tickets ? { tierId: tier.tierId, tickets } : best;
        }, { tierId: '', tickets: 0 }).tierId;
    }, [tiers, activeEvent?.couponPools?.byTier]);

    const handleConfirmPurchase = (tierId: string) => {
        const tier = tiers.find((t) => t.tierId === tierId);
        if (!tier) return;
        const qty = quantities[tierId] || 1;
        const price = Number(tier.amount || 0);
        const total = price * qty;

        if (!isAuthenticated) {
            playClick();
            setSelectedGuestTierId(tierId);
            setSelectedGuestQty(qty);
            setWalletAction('guest');
            toast.success('Fill in details below to place guest bet');
            walletRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (total > walletBalance) {
            // Prompt top-up
            toast.error('Insufficient credits. Select a top-up option below.');
            setWalletAction('deposit');
            walletRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        playWhoosh();
        onPurchase(tierId, qty);
    };

    const handleToggleWalletAction = (action: 'deposit' | 'transfer' | 'guest') => {
        playClick();
        setWalletAction((prev) => (prev === action ? 'none' : action));
    };

    return (
        <section id="lottery-coupons" className="flex w-full flex-col gap-4 sm:gap-6 px-0 sm:px-4 py-3 sm:py-5 rounded-none sm:rounded-3xl bg-transparent border-none">
            {/* LOBBY WALLET CARD (fully wallet-like view) */}
            <div id="shop-step-2" ref={walletRef} className="rounded-[24px] border border-amber-500/20 bg-[#0c0a09]/95 overflow-hidden relative shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                {/* Background noise and glow */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                {/* Available balance - hero card wrapper */}
                <div className="p-4 sm:p-6 border-b border-white/10 relative overflow-hidden"
                    style={{ background: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.06) 0%, transparent 60%)' }}>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {/* Digital Card Layout */}
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 shrink-0 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                    <Wallet size={20} className="text-amber-400" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 font-black">
                                        {isAuthenticated ? 'Lottery Wallet' : 'Guest Checkout'}
                                    </p>
                                </div>
                            </div>

                            {isAuthenticated ? (
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-[0.15em] text-white/40 font-bold">Available Balance</span>
                                    <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight flex items-baseline gap-1.5 drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                                        <span className="text-amber-400">{formatLotteryMoney(walletBalance, walletSymbol)}</span>
                                    </div>
                                    {lotteryReferralLink ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                copyTextSafely(lotteryReferralLink, 'Lottery referral link copied');
                                            }}
                                            className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-400/15"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Share lottery link
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="space-y-1 max-w-lg">
                                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-black">Anonymous Mode Active</span>
                                    <p className="text-xs text-white/70 font-semibold leading-relaxed">
                                        Welcome, Guest! You can participate in this draw directly without logging in. Just choose a coupon below, set your quantity, and click play to begin checkout.
                                    </p>
                                    {shop.lotteryReferralCode ? (
                                        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                                            Referred by {shop.lotteryReferralCode}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Small sub-balances */}
                            {isAuthenticated && (
                                <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold pt-1 font-mono">
                                    <div>
                                        <span>Total Balance: </span>
                                        <span className="text-white/70">{formatLotteryMoney(wallet?.wallet?.balance ?? walletBalance, walletSymbol)}</span>
                                    </div>
                                    {wallet?.wallet?.balance !== undefined && wallet.wallet.balance > walletBalance && (
                                        <div className="flex items-center gap-1 text-amber-400">
                                            <span>Locked: </span>
                                            <span>{formatLotteryMoney(wallet.wallet.balance - walletBalance, walletSymbol)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                            {isAuthenticated ? (
                                <>
                                    {depositConfig?.enabled && depositConfig.depositAddress && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleWalletAction('deposit')}
                                            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1 px-2 py-1.5 sm:px-4 sm:py-2.5 text-[9px] min-[375px]:text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all border duration-200 ${walletAction === 'deposit'
                                                    ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <Plus size={11} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} />
                                            Deposit
                                        </button>
                                    )}
                                    {transferConfig?.enabled && selectableTransferWallets.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleWalletAction('transfer')}
                                            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1 px-2 py-1.5 sm:px-4 sm:py-2.5 text-[9px] min-[375px]:text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all border duration-200 ${walletAction === 'transfer'
                                                    ? 'bg-amber-500 text-[#050508] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-amber-500/30'
                                                }`}
                                        >
                                            <ArrowLeftRight size={11} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                                            Transfer
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleToggleWalletAction('guest')}
                                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 sm:px-5 sm:py-3 text-[9px] min-[375px]:text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all border duration-200 ${walletAction === 'guest'
                                            ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                        }`}
                                >
                                    <Ticket size={11} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} />
                                    Guest Form
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stat row - beautifully redesigned in a compact single-line flex row */}
                {isAuthenticated && (
                    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#07070a]/60 border-t border-white/5 text-xs font-bold text-white/60 relative z-10">
                        <div className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <TrendingUp size={12} className="text-amber-400" />
                            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">Deposited:</span>
                            <span className="font-mono text-white/90">{formatLotteryMoney(wallet?.wallet?.totalDeposit ?? 0, walletSymbol)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <ArrowLeftRight size={12} className="text-rose-400" />
                            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">Withdrawn:</span>
                            <span className="font-mono text-white/90">{formatLotteryMoney(wallet?.wallet?.totalWithdraw ?? 0, walletSymbol)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors hover:text-white">
                            <Sparkles size={12} className="text-amber-400" />
                            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">Income:</span>
                            <span className="font-mono text-white/90">{formatLotteryMoney(wallet?.wallet?.totalIncome ?? 0, walletSymbol)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* WALLET ACTIONS DRAWERS */}
            {walletAction !== 'none' && (
                <div className="mt-2 pt-2 animate-[lottery-popup-in_220ms_ease-out]">
                    {walletAction === 'deposit' && (
                        <div className="rounded-[20px] bg-[#0c0a09]/95 border border-amber-500/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] p-4 sm:p-5 space-y-4 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.06),transparent_50%)] pointer-events-none" />
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                            <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                                <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">Add Fund To Your Lottery Wallet</div>
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[9px] font-mono font-black uppercase tracking-wider text-amber-400">
                                    Network: USDT {depositConfig?.network || 'TRC-20'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center relative z-10">
                                <div className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl bg-white p-1.5 flex items-center justify-center mx-auto sm:mx-0 shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-amber-500/30 transition-transform duration-300 hover:scale-105">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrValue)}`}
                                        alt="Deposit QR"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
                                    <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed font-medium">
                                        Transfer standard {walletSymbol} tokens to the address below. Your balance updates automatically after block validation.
                                    </p>

                                    <div className="relative flex items-center max-w-md mx-auto sm:mx-0">
                                        <input
                                            readOnly
                                            onClick={handleCopyAddress}
                                            value={qrValue}
                                            title="Click to copy address"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/45 pl-3 pr-20 text-[11px] font-mono text-white/95 cursor-pointer outline-none hover:border-amber-500/30 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopyAddress}
                                            className={`absolute right-1 top-1 bottom-1 px-4 rounded-lg border transition-all duration-200 active:scale-95 text-[9px] font-black uppercase tracking-wider ${copiedAddress
                                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-300'
                                                }`}
                                        >
                                            {copiedAddress ? 'COPIED ✓' : 'COPY'}
                                        </button>
                                    </div>
                                    {depositConfig?.minDeposit && (
                                        <p className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest pl-0.5">
                                            Minimum Deposit: <span className="font-mono">{depositConfig.minDeposit}</span> {walletSymbol}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2.5 border-t border-white/5 pt-3.5 sm:pt-4 relative z-10">
                                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Verify manual transaction</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Amount</label>
                                        <input
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            placeholder={`Amount (${walletSymbol})`}
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3.5 text-xs text-white font-mono outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">TxID / Hash</label>
                                        <input
                                            value={depositHash}
                                            onChange={(e) => setDepositHash(e.target.value)}
                                            placeholder="Transaction Hash"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-[#0c0c0c] px-3.5 text-xs text-white font-mono outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={isBusy || !depositAmount || !depositHash}
                                    onClick={() => {
                                        playWhoosh();
                                        onDeposit(Number(depositAmount), depositHash).then(() => {
                                            setDepositAmount('');
                                            setDepositHash('');
                                            setWalletAction('none');
                                        });
                                    }}
                                    className="w-full h-10 sm:h-11 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-xs font-black uppercase tracking-widest text-[#050508] shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.4)] transition-all disabled:opacity-40"
                                >
                                    Verify Deposit
                                </button>
                            </div>
                        </div>
                    )}

                    {walletAction === 'transfer' && (
                        <div className="rounded-[20px] bg-[#0c0a09]/95 border border-amber-500/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] p-4 sm:p-5 space-y-4 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.06),transparent_50%)] pointer-events-none" />
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400 relative z-10">Wallet transfer console</div>
                            <div className="grid grid-cols-2 gap-2 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setTransferDirection('to_lottery'); }}
                                    className={`rounded-lg py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${transferDirection === 'to_lottery'
                                            ? 'border-amber-500/40 bg-amber-500/10 text-white'
                                            : 'border-white/5 bg-black/20 text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    To Lottery
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { playClick(); setTransferDirection('from_lottery'); }}
                                    className={`rounded-lg py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${transferDirection === 'from_lottery'
                                            ? 'border-amber-500/40 bg-amber-500/10 text-white'
                                            : 'border-white/5 bg-black/20 text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    From Lottery
                                </button>
                            </div>
                            <div className="space-y-2.5 relative z-10">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block pl-1">Source Account</label>
                                <div className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none]">
                                    {selectableTransferWallets.map((item) => {
                                        const isActive = activeTransferWallet === item.walletTypeCode;
                                        return (
                                            <button
                                                key={item.walletTypeCode}
                                                type="button"
                                                onClick={() => { playClick(); setSelectedTransferWallet(item.walletTypeCode); }}
                                                className={`flex flex-col items-start min-w-[130px] rounded-xl border p-2.5 text-left transition-all ${isActive
                                                        ? 'border-amber-500/50 bg-amber-500/5 text-white shadow-[0_0_15px_rgba(251,191,36,0.08)]'
                                                        : 'border-white/10 bg-black/30 text-white/60 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-wider text-white/40">{item.walletTypeCode}</span>
                                                <strong className="text-xs font-mono font-black text-white mt-1">
                                                    {formatLotteryMoney(item.wallet.availableBalance, walletSymbol)}
                                                </strong>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Transfer amount</label>
                                    <input
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        placeholder={`Transfer Amount (${walletSymbol})`}
                                        className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3.5 text-xs text-white font-mono outline-none focus:border-amber-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {activeTransferWallet && hasTransferInput && (
                                <div className="rounded-xl border border-white/[0.04] bg-black/50 p-3 text-[10px] space-y-1.5 text-white/60 font-mono relative z-10">
                                    <div className="flex justify-between">
                                        <span>Pathway:</span>
                                        <strong className="text-white font-mono">{previewFromWallet} → {previewToWallet}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Debit:</span>
                                        <strong className="text-white">{formatLotteryMoney(previewDebitAmount, walletSymbol)}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Credit:</span>
                                        <strong className="text-amber-400 font-black">{formatLotteryMoney(previewCreditAmount, walletSymbol)}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Handling Fee:</span>
                                        <strong className="text-white">{formatLotteryMoney(previewFeeAmount, walletSymbol)} ({transferFeeLabel})</strong>
                                    </div>
                                    {previewFeeTooHigh ? (
                                        <p className="mt-1 text-[9px] text-rose-400 font-bold">Transfer must exceed the fee.</p>
                                    ) : previewInsufficient ? (
                                        <p className="mt-1 text-[9px] text-rose-400 font-bold">Insufficient balance in source wallet.</p>
                                    ) : null}
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={isBusy || !activeTransferWallet || !hasTransferInput || previewFeeTooHigh || previewInsufficient}
                                onClick={() => {
                                    playWhoosh();
                                    const fromWalletTypeCode = transferDirection === 'to_lottery' ? activeTransferWallet : 'LOTTERY_WALLET';
                                    const toWalletTypeCode = transferDirection === 'to_lottery' ? 'LOTTERY_WALLET' : activeTransferWallet;
                                    return onTransfer(fromWalletTypeCode, toWalletTypeCode, Number(transferAmount)).then(() => {
                                        setTransferAmount('');
                                        setWalletAction('none');
                                    });
                                }}
                                className="w-full h-10 sm:h-11 relative z-10 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-xs font-black uppercase tracking-widest text-[#050508] shadow-[0_8px_20px_rgba(245,158,11,0.2)] disabled:opacity-40"
                            >
                                Transfer Instant Credits
                            </button>
                        </div>
                    )}

                    {walletAction === 'guest' && (
                        <div className="rounded-[20px] bg-[#0c0c10]/95 border border-amber-500/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] p-4 sm:p-5 space-y-4 relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none" />
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                            <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                                <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">Guest Checkout Details</div>
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[9px] font-mono font-black uppercase tracking-wider text-amber-400">
                                    Network: USDT {depositConfig?.network || 'TRC-20'}
                                </span>
                            </div>

                            {/* Show selected tier & quantity details */}
                            {selectedGuestTierId ? (
                                <div className="space-y-2 relative z-10">
                                    <div className="rounded-xl border border-white/10 bg-black/45 p-3 flex flex-wrap justify-between items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Ticket size={16} className="text-amber-400" />
                                            <div className="text-left">
                                                <p className="text-xs font-black text-white">
                                                    {tiers.find(t => t.tierId === selectedGuestTierId)?.label || 'Standard Stake'}
                                                </p>
                                                <p className="text-[10px] text-white/50">
                                                    Quantity: {selectedGuestQty}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-white/40 tracking-wider font-bold">Total Stake</p>
                                            <p className="text-sm font-mono font-black text-amber-400">
                                                {formatLotteryMoney(
                                                    Number(tiers.find(t => t.tierId === selectedGuestTierId)?.amount || 0) * selectedGuestQty,
                                                    tiers.find(t => t.tierId === selectedGuestTierId)?.currencySymbol || walletSymbol
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-amber-400/70 italic pl-1 font-semibold">
                                        * Only one coupon tier is allowed per transaction. Selecting a different coupon below switches your checkout choice.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-amber-500/25 bg-amber-500/5 p-4 text-center relative z-10">
                                    <p className="text-xs text-amber-400 font-black uppercase tracking-wider mb-1">
                                        ⚠️ Step 1: Select a Coupon
                                    </p>
                                    <p className="text-[11px] text-white/60 leading-normal max-w-sm mx-auto">
                                        Please select an available coupon from the options below and choose your quantity first to enable checkout.
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center border-t border-white/5 pt-3.5 relative z-10">
                                <div className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl bg-white p-1.5 flex items-center justify-center mx-auto sm:mx-0 shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-amber-500/30 transition-transform duration-300 hover:scale-105">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrValue)}`}
                                        alt="Deposit QR"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
                                    <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed font-medium">
                                        Send the exact total stake amount in standard {walletSymbol} tokens to the address below. Fill in your details below to complete your checkout.
                                    </p>

                                    <div className="relative flex items-center max-w-md mx-auto sm:mx-0">
                                        <input
                                            readOnly
                                            onClick={handleCopyAddress}
                                            value={qrValue}
                                            title="Click to copy address"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/45 pl-3 pr-20 text-[11px] font-mono text-white/95 cursor-pointer outline-none hover:border-amber-500/30 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCopyAddress}
                                            className={`absolute right-1 top-1 bottom-1 px-4 rounded-lg border transition-all duration-200 active:scale-95 text-[9px] font-black uppercase tracking-wider ${copiedAddress
                                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-400'
                                                }`}
                                        >
                                            {copiedAddress ? 'COPIED ✓' : 'COPY'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3.5 border-t border-white/5 pt-3.5 relative z-10">
                                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Guest Account & Payment Verification</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Nickname / Alias</label>
                                        <input
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="Nickname"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3.5 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Notification Email</label>
                                        <input
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            placeholder="Email"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3.5 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Payout Wallet Address</label>
                                        <input
                                            value={guestWallet}
                                            onChange={(e) => setGuestWallet(e.target.value)}
                                            placeholder="Payout Wallet Address"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3.5 text-xs text-white font-mono outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Deposit TxID / Hash</label>
                                        <input
                                            value={guestTx}
                                            onChange={(e) => setGuestTx(e.target.value)}
                                            placeholder="Transaction Hash"
                                            className="w-full h-10 rounded-xl border border-white/10 bg-[#0c0c10] px-3.5 text-xs text-white font-mono outline-none focus:border-amber-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={isBusy || !guestName.trim() || !guestEmail.trim() || !guestWallet.trim() || !guestTx.trim() || !selectedGuestTierId}
                                    onClick={() => {
                                        const tier = tiers.find(t => t.tierId === selectedGuestTierId);
                                        if (!tier) return;
                                        const price = Number(tier.amount || 0);
                                        const total = price * selectedGuestQty;
                                        playWhoosh();
                                        onExternalPurchase(selectedGuestTierId, selectedGuestQty, {
                                            name: guestName.trim(),
                                            email: guestEmail.trim(),
                                            walletAddress: guestWallet.trim(),
                                            amount: total,
                                            transactionHash: guestTx.trim(),
                                        }).then(() => {
                                            setGuestTx('');
                                            setWalletAction('none');
                                            setSelectedGuestTierId('');
                                        });
                                    }}
                                    className="w-full h-10 sm:h-11 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-xs font-black uppercase tracking-widest text-[#050508] shadow-[0_8px_20px_rgba(245,158,11,0.2)] disabled:opacity-40"
                                >
                                    {!selectedGuestTierId
                                        ? 'Select a Coupon Below'
                                        : isBusy
                                            ? 'Verifying...'
                                            : 'Verify Deposit & Place Guest Bet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {activeEvent && (
                <LotteryPrizeVault
                    tiers={tiers}
                    couponPools={activeEvent.couponPools}
                    boost={resolvedPoolBoost}
                    tierGrowth={resolvedPoolTierGrowth}
                    hotTierId={hotTierId}
                    lastActivity={resolvedPoolActivity}
                    heartbeatId={resolvedPoolHeartbeatId}
                />
            )}
            {/* STAKES TABLE */}
            <div id="shop-step-1" className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse shrink-0" />
                    <h2 className="text-xs min-[375px]:text-sm sm:text-base font-black uppercase tracking-wider text-amber-400/85 truncate whitespace-nowrap">Available Coupons For Purchase</h2>
                </div>

                <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory gap-4 sm:gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-2 lg:grid-cols-3 [scrollbar-width:none]">
                    {tiers.map((tier) => {
                        const tierId = tier.tierId;
                        const owned = entriesByTier[tierId]?.length || 0;
                        const qty = quantities[tierId] || 1;
                        const total = Number(tier.amount || 0) * qty;

                        const isInsufficient = isAuthenticated && total > walletBalance;

                        const tierMaxAffordable = tier.amount ? Math.floor(walletBalance / Number(tier.amount)) : 0;
                        const tierCapLimit = tier.maxPurchasesPerUser || 999;
                        const tierRemainingCap = Math.max(0, tierCapLimit - owned);
                        const tierMaxQty = isAuthenticated ? Math.min(tierRemainingCap, Math.max(1, tierMaxAffordable)) : tierRemainingCap;

                        const setTierQty = (val: number) => {
                            playClick();
                            setQuantities(prev => ({ ...prev, [tierId]: Math.max(1, val) }));
                        };

                        const tierGrowth = poolTierGrowth?.[tierId] || { amount: 0, tickets: 0 };
                        const isHotTier = hotTierId === tierId && Number(tierGrowth.amount || 0) > 0;

                        return (
                            <div
                                key={tierId}
                                className={`relative flex flex-col justify-between rounded-[24px] p-4 sm:p-5 transition-all duration-300 bg-gradient-to-b from-[#0c0c10]/95 to-[#050508]/98 shadow-[0_20px_50px_rgba(0,0,0,0.65)] border backdrop-blur-2xl shrink-0 w-[280px] sm:w-auto snap-center ${isHotTier
                                        ? 'border-amber-400/40 shadow-[0_15px_45px_rgba(245,158,11,0.15)]'
                                        : 'border-white/10'
                                    }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex w-full items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400/80">
                                            {tier.label || 'Standard Stake'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {bestValueTierId === tierId && (
                                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                                                    <Sparkles className="h-2.5 w-2.5" /> Most popular
                                                </span>
                                            )}
                                            {isHotTier && (
                                                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/20">
                                                    <Flame className="h-3 w-3 animate-pulse text-amber-400" /> Hot
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-3xl sm:text-4xl font-mono font-black text-white flex items-baseline gap-1.5 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                            {formatLotteryMoney(tier.amount, tier.currencySymbol || walletSymbol)}
                                        </div>
                                        {owned > 0 && (
                                            <span className="mt-2 inline-block rounded-md bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-mono font-black tracking-widest text-amber-400 uppercase">
                                                Owned: {owned} {owned === 1 ? 'ticket' : 'tickets'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Dashed ticket divider with notches */}
                                    <div className="relative my-4">
                                        <div className="absolute left-[-23px] sm:left-[-27px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#030408] border-r z-10" style={{ borderColor: isHotTier ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)' }} />
                                        <div className="absolute right-[-23px] sm:right-[-27px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#030408] border-l z-10" style={{ borderColor: isHotTier ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)' }} />
                                        <div className="border-t border-dashed border-white/15 w-full h-px" />
                                    </div>

                                    {/* QUANTITY CONSOLE */}
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-[9px] font-black tracking-widest text-white/30 uppercase">
                                            <span>Quantity & Presets</span>
                                            <span className="font-mono text-white/50">Total: {formatLotteryMoney(total, tier.currencySymbol || walletSymbol)}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            {/* Quantity Stepper */}
                                            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/45 p-1 w-full sm:w-28 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        playClick();
                                                        setQuantities(prev => ({ ...prev, [tierId]: Math.max(1, qty - 1) }));
                                                    }}
                                                    className="flex h-7 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-xs font-black text-white hover:bg-white/[0.08] active:scale-95 transition-all"
                                                >−</button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={qty}
                                                    onChange={(e) => {
                                                        playClick();
                                                        setQuantities(prev => ({ ...prev, [tierId]: Math.max(1, Number(e.target.value) || 1) }));
                                                    }}
                                                    className="h-7 min-w-0 flex-1 bg-transparent text-center text-xs font-mono font-black text-amber-400 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        playClick();
                                                        setQuantities(prev => ({ ...prev, [tierId]: qty + 1 }));
                                                    }}
                                                    className="flex h-7 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-xs font-black text-white hover:bg-white/[0.08] active:scale-95 transition-all"
                                                >+</button>
                                            </div>

                                            {/* Presets */}
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                {[1, 5, 10].map((val) => {
                                                    const isValOverCap = val > tierRemainingCap;
                                                    const isValDisabled = isValOverCap;
                                                    return (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            disabled={isValDisabled}
                                                            onClick={() => setTierQty(val)}
                                                            className={`flex-1 rounded-lg py-1 text-[9px] font-black uppercase border transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed ${qty === val
                                                                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                                                    : 'border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.04] hover:text-white'
                                                                }`}
                                                        >
                                                            {val}x
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    disabled={tierMaxQty <= 0}
                                                    onClick={() => setTierQty(tierMaxQty > 0 ? tierMaxQty : 1)}
                                                    className={`flex-1 rounded-lg py-1 text-[9px] font-black uppercase border transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed ${qty === tierMaxQty
                                                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                                            : 'border-white/10 bg-black/20 text-amber-400/60 hover:bg-white/[0.04] hover:text-amber-400'
                                                        }`}
                                                >
                                                    MAX
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleConfirmPurchase(tierId)}
                                        className={`w-full rounded-2xl py-3 px-3.5 text-xs font-black tracking-widest uppercase transition-all duration-200 active:scale-95 disabled:opacity-50 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-[#050508] shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.4)] hover:brightness-110`}
                                    >
                                        {isInsufficient
                                            ? '💰 TOP UP BALANCE'
                                            : !isAuthenticated
                                                ? 'BUY AS GUEST'
                                                : `BUY TICKETS · ${formatLotteryMoney(total, tier.currencySymbol || walletSymbol)}`}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECURED TICKET VAULT */}
            {Object.keys(entriesByTier).length > 0 && (
                <div id="shop-step-3" className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                                                            <ShieldCheck className="h-5 w-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0" />
                                                            <h2 className="text-xs min-[375px]:text-sm sm:text-base font-black uppercase tracking-wider text-amber-400 truncate whitespace-nowrap">Secured Ticket Vault</h2>
                                                        </div>
                                                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] whitespace-nowrap">
                                                            Secured
                                                        </span>
                                                    </div>

                                                    <div className="max-h-[380px] overflow-y-auto pr-1 [scrollbar-color:rgba(245,158,11,0.25)_transparent] [scrollbar-width:thin] overscroll-contain">
                                                        <div className="flex flex-col gap-4">
                                                            {tiers.map((tier) => {
                                                                const owned = entriesByTier[tier.tierId]?.length || 0;
                                                                if (owned === 0) return null;
                                                                return (
                                                                    <div key={tier.tierId} className="rounded-xl border p-4 shadow-inner bg-[radial-gradient(circle_at_top,rgba(26,20,7,0.95)_0%,rgba(3,4,8,0.99)_100%)] border-amber-500/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                                                        <div className="mb-3 flex items-center justify-between border-b border-dashed border-white/10 pb-2">
                                                                            <p className="text-xs font-black uppercase tracking-wider text-white">
                                                                                {tier.label || `${tier.amount} ${tier.currencySymbol || walletSymbol}`}
                                                                            </p>
                                                                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono font-black tracking-widest text-amber-400 uppercase">
                                                                                {owned} {owned === 1 ? 'Ticket' : 'Tickets'}
                                                                            </span>
                                                                        </div>

                                                                        <div 
                                                                             className={`grid gap-2 ${owned > 12 ? 'max-h-36 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(245,158,11,0.3)_transparent] [scrollbar-width:thin]' : ''}`}
                                                                             style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
                                                                         >
                                                                            {(entriesByTier[tier.tierId] || []).map((entry) => (
                                                                                <div
                                                                                    key={entry._id}
                                                                                    onClick={() => {
                                                                                        copyTextSafely(String(entry.lotteryNumber), `Copied ticket #${entry.lotteryNumber}`);
                                                                                    }}
                                                                                    className="relative aspect-[4/3] rounded-lg border border-amber-500/25 bg-gradient-to-b from-black/60 to-black/90 flex flex-col items-center justify-center font-mono text-[11px] font-black tabular-nums text-amber-400 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] hover:border-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                                                    title="Click to copy ticket number"
                                                                                >
                                                                                    <span className="text-[7px] text-white/30 uppercase tracking-[0.2em] absolute top-1">TIX</span>
                                                                                    <span className="mt-2 text-[10px] tracking-wider">{entry.lotteryNumber}</span>
                                                                                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {couponCelebrateTickets?.length ? (
                <LotteryCouponCelebrate ticketNumbers={couponCelebrateTickets} onComplete={() => setCouponCelebrateTickets(null)} />
            ) : null}
        </section>
    );
}
