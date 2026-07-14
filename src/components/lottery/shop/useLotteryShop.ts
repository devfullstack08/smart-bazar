'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { 
    lotteryApi,
    LotteryEvent, 
    LotteryWalletResponse, 
    LotteryWalletTransferOptions, 
    LotteryEntry,
    LotteryDepositConfig,
    LotteryPoolUpdatePayload,
    ExternalLotteryClaimRecord
} from '@/lib/api/lotteryApi';
import { useLotterySocket } from '@/hooks/useLotterySocket';
import { 
    getCouponPoolAmount, 
    attachCouponPools, 
    crossedPoolMilestone,
    lotteryErrorMessage,
    mergeLotteryWalletWithPageDeposit
} from '@/components/lottery/lotteryPoolHelpers';
import { formatLotteryMoney, safeLotteryBuyerName } from '@/components/lottery/lotteryMoney';
import { saveExternalLotteryClaim } from './externalClaimsStorage';
import type { 
    LotteryPoolBoost, 
    PoolTierGrowth, 
    PoolActivity, 
    PoolShareCard 
} from './LotteryCouponPurchasePanel';

const LOTTERY_REFERRAL_CODE_KEY = 'bloomx_lottery_referral_code_v1';

export interface UseLotteryShopOptions {
    event: LotteryEvent | null;
    pageDepositConfig?: LotteryDepositConfig;
    onPurchaseSuccess: (info: {
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
    enabled?: boolean;
    enableSocket?: boolean;
}

export function useLotteryShop({
    event,
    pageDepositConfig,
    onPurchaseSuccess,
    enabled = true,
    enableSocket = true,
}: UseLotteryShopOptions) {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    
    const [lotteryWallet, setLotteryWallet] = useState<LotteryWalletResponse | null>(null);
    const [lotteryTransferOptions, setLotteryTransferOptions] = useState<LotteryWalletTransferOptions | null>(null);
    const [couponPanelEntries, setCouponPanelEntries] = useState<LotteryEntry[]>([]);
    const [couponBusy, setCouponBusy] = useState(false);

    const [localDepositConfig, setLocalDepositConfig] = useState<LotteryDepositConfig | undefined>(pageDepositConfig);
    const [lotteryReferralCode, setLotteryReferralCode] = useState('');

    useEffect(() => {
        if (pageDepositConfig) {
            setLocalDepositConfig(pageDepositConfig);
        }
    }, [pageDepositConfig]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const urlReferralCode = String(params.get('ref') || params.get('sponsor') || '').trim();
        if (urlReferralCode) {
            window.localStorage.setItem(LOTTERY_REFERRAL_CODE_KEY, urlReferralCode);
            setLotteryReferralCode(urlReferralCode);
            return;
        }
        setLotteryReferralCode(String(window.localStorage.getItem(LOTTERY_REFERRAL_CODE_KEY) || '').trim());
    }, []);

    /**
     * Autonomous states for managing local socket broadcasts and real-time updates:
     * - localEvent: Active lottery event overridden with live socket statistics.
     * - poolBoost: Real-time piggy-bank animations/notifications when another player bets.
     * - poolTierGrowth: Short-lived ticket quantity and amount growth counter for each tier.
     * - poolActivityByEvent: Quick activity alerts for recent purchases in the room.
     * - poolHeartbeatByEvent: Heartbeat indicator triggering pulses on the live badge when updates arrive.
     * - poolShareCard: Modal configuration to share pool boosts on social networks.
     */
    const [localEvent, setLocalEvent] = useState<LotteryEvent | null>(event);
    const [poolBoost, setPoolBoost] = useState<LotteryPoolBoost | null>(null);
    const [poolTierGrowth, setPoolTierGrowth] = useState<Record<string, Record<string, PoolTierGrowth>>>({});
    const [poolActivityByEvent, setPoolActivityByEvent] = useState<Record<string, PoolActivity | null>>({});
    const [poolHeartbeatByEvent, setPoolHeartbeatByEvent] = useState<Record<string, string>>({});
    const [poolShareCard, setPoolShareCard] = useState<PoolShareCard | null>(null);

    // References to prevent race conditions and track user-initiated boosts
    const recentManualPoolBoostRef = useRef<{ lotteryId: string; until: number } | null>(null);
    const localEventRef = useRef<LotteryEvent | null>(null);

    // Keep local event state in sync with parent component's event prop
    useEffect(() => {
        setLocalEvent(event);
    }, [event]);

    // Keep ref in sync so asynchronous socket handlers always read current values
    useEffect(() => {
        localEventRef.current = localEvent;
    }, [localEvent]);

    const onDismissPoolShareCard = useCallback(() => {
        setPoolShareCard(null);
    }, []);

    /**
     * Tracks growth inside a ticket tier's prize pool.
     * Incrementally updates the amount/ticket count on incoming socket messages,
     * and sets a 60-second decay timer to roll back that specific increment.
     */
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

        // Decays/clears this specific growth amount after 60 seconds
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

    /**
     * Triggers the piggy-bank animation, activity feed, and live heartbeat pulses
     * when another player purchases tickets.
     */
    const triggerPoolBoost = useCallback((input: any, options?: { markManual?: boolean; share?: boolean }) => {
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
    }, []);

    /**
     * Primary event handler for the useLotterySocket subscription.
     * Calculates size delta of incoming updates, updates states, and registers pool milestones.
     */
    const handlePoolUpdated = useCallback((data: LotteryPoolUpdatePayload) => {
        if (!data?.lotteryId || !data.couponPools) return;
        
        const sourceEvent = localEventRef.current;
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

        setLocalEvent((prev) => {
            if (prev && prev._id === data.lotteryId) {
                return attachCouponPools(prev, data.couponPools);
            }
            return prev;
        });
    }, [registerPoolGrowth, triggerPoolBoost]);

    // Setup active WebSocket room listener for real-time pool updates
    useLotterySocket({
        lotteryId: enableSocket && event?._id ? event._id : undefined,
        onPoolUpdated: handlePoolUpdated,
    });

    /**
     * Load wallet options, balances, previous tickets, and deposit configuration schemas on mount
     */
    useEffect(() => {
        if (!enabled || !isAuthenticated) {
            setLotteryWallet(null);
            setLotteryTransferOptions(null);
            setCouponPanelEntries([]);
            return;
        }

        let cancelled = false;
        async function loadData() {
            try {
                const targetId = event?._id;
                const [walletRaw, transferOpts, entriesRaw, pageConfig] = await Promise.all([
                    lotteryApi.getLotteryWallet().catch(() => null),
                    lotteryApi.getLotteryWalletTransferOptions().catch(() => null),
                    targetId
                        ? lotteryApi.getMyEntries(targetId).catch(() => ({ entries: [] as LotteryEntry[] }))
                        : Promise.resolve({ entries: [] as LotteryEntry[] }),
                    pageDepositConfig ? Promise.resolve(null) : lotteryApi.getPageConfig().catch(() => null),
                ]);
                if (cancelled) return;
                const activeConfig = pageDepositConfig || pageConfig?.depositConfig || undefined;
                if (activeConfig) {
                    setLocalDepositConfig(activeConfig);
                }
                setLotteryWallet(walletRaw ? mergeLotteryWalletWithPageDeposit(walletRaw, activeConfig) : null);
                setLotteryTransferOptions(transferOpts);
                setCouponPanelEntries(entriesRaw.entries || []);
            } catch (e) {}
        }

        void loadData();

        return () => {
            cancelled = true;
        };
    }, [enabled, isAuthenticated, pageDepositConfig, event?._id]);

    /**
     * Handler: Verify and register direct cryptocurrency blockchain deposits to top up the lottery wallet.
     */
    const handleLotteryDeposit = useCallback(async (amount: number, transactionHash: string) => {
        if (!isAuthenticated) {
            toast.error('Sign in to use the lottery wallet');
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error('Enter a valid deposit amount');
            return;
        }
        if (!transactionHash.trim()) {
            toast.error('Enter transaction hash');
            return;
        }
        setCouponBusy(true);
        try {
            const result = await lotteryApi.depositLotteryWallet({ amount, transactionHash: transactionHash.trim() });
            setLotteryWallet((prev) => {
                const withWallet = prev
                    ? { ...prev, wallet: result.wallet }
                    : mergeLotteryWalletWithPageDeposit(
                        {
                            walletTypeCode: localDepositConfig?.walletTypeCode || 'LOTTERY_WALLET',
                            wallet: result.wallet,
                            depositConfig: localDepositConfig ?? { enabled: false },
                        },
                        localDepositConfig,
                    );
                return mergeLotteryWalletWithPageDeposit(withWallet, localDepositConfig);
            });
            toast.success('Lottery wallet credited');
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'Failed to verify lottery deposit'));
        } finally {
            setCouponBusy(false);
        }
    }, [isAuthenticated, localDepositConfig]);

    /**
     * Handler: Performs internal balance transfers from main/income wallets to the lottery wallet.
     */
    const handleLotteryWalletTransfer = useCallback(async (fromWalletTypeCode: string, toWalletTypeCode: string, amount: number) => {
        if (!isAuthenticated) {
            toast.error('Sign in to transfer lottery wallet funds');
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error('Enter a valid transfer amount');
            return;
        }
        setCouponBusy(true);
        try {
            const result = await lotteryApi.transferLotteryWallet({ fromWalletTypeCode, toWalletTypeCode, amount });
            setLotteryWallet((prev) =>
                mergeLotteryWalletWithPageDeposit(
                    prev
                        ? { ...prev, wallet: result.lotteryWallet }
                        : {
                            walletTypeCode: localDepositConfig?.walletTypeCode || 'LOTTERY_WALLET',
                            wallet: result.lotteryWallet,
                            depositConfig: localDepositConfig ?? { enabled: false },
                        },
                    localDepositConfig,
                ),
            );
            const transferOptions = await lotteryApi.getLotteryWalletTransferOptions().catch(() => null);
            setLotteryTransferOptions(transferOptions);
            toast.success('Wallet transfer completed');
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'Failed to transfer funds'));
        } finally {
            setCouponBusy(false);
        }
    }, [isAuthenticated, localDepositConfig]);

    /**
     * Handler: Guest Bet checkout flow (purchase via external direct hash submission, not using internal wallet).
     */
    const handleExternalCouponPurchase = useCallback(async (
        tierId: string,
        quantity: number,
        input: { name: string; email: string; walletAddress: string; amount: number; transactionHash: string },
    ) => {
        const lotteryId = event?._id;
        if (!lotteryId) return;
        setCouponBusy(true);
        try {
            const result = await lotteryApi.purchaseExternalCoupon(lotteryId, tierId, {
                ...input,
                quantity,
                referralCode: lotteryReferralCode || undefined,
            });
            const purchaseRecord = result.purchase as { ticketNumbers?: string[] | number[] } | undefined;
            const newTickets = Array.from(new Set([
                ...(result.entries || []).map((e) => String(e.lotteryNumber)),
                ...(purchaseRecord?.ticketNumbers || []).map(String)
            ])).filter(Boolean);
            const purchasedTier = event?.couponTiers?.find((tier) => tier.tierId === tierId);
            const purchasedQuantity = result.entries?.length || quantity;
            const purchasedSymbol = purchasedTier?.currencySymbol || localDepositConfig?.tokenSymbol || 'USDT';
            
            setCouponPanelEntries((prev) => [...prev, ...(result.entries || [])]);
            
            if (result.claimAccessToken && input.email && input.walletAddress && input.transactionHash) {
                const record: ExternalLotteryClaimRecord = {
                    lotteryId,
                    purchaseId: String(input.transactionHash),
                    participantUserId: String(result.participant?.userId || ''),
                    name: input.name.trim(),
                    email: input.email,
                    walletAddress: input.walletAddress,
                    transactionHash: input.transactionHash.trim(),
                    claimAccessToken: result.claimAccessToken,
                    ticketNumbers: newTickets,
                    createdAt: new Date().toISOString(),
                };
                saveExternalLotteryClaim(record);
            }

            onPurchaseSuccess({
                lotteryId,
                buyerName: input.name,
                isExternal: true,
                amount: Number(result.purchase?.poolContributionAmount ?? (Number(purchasedTier?.amount || 0) * purchasedQuantity)),
                quantity: purchasedQuantity,
                tierId,
                couponLabel: purchasedTier?.label,
                currencySymbol: purchasedSymbol,
                ticketNumbers: newTickets,
                entries: result.entries || [],
                couponPools: result.couponPools,
                email: result.participant?.email,
                walletAddress: result.participant?.walletAddress,
                transactionHash: input.transactionHash.trim(),
                claimAccessToken: result.claimAccessToken,
                participantUserId: result.participant?.userId,
            });
            
            toast.success(`${result.entries?.length || quantity} external ticket${quantity === 1 ? '' : 's'} confirmed`);
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'Failed to join lottery externally'));
        } finally {
            setCouponBusy(false);
        }
    }, [event, localDepositConfig, lotteryReferralCode, onPurchaseSuccess]);

    /**
     * Handler: Internal wallet checkout flow (purchases tickets directly using lottery wallet balance).
     */
    const handleCouponPurchase = useCallback(async (tierId: string, quantity: number) => {
        if (!isAuthenticated) {
            toast.error('Sign in to buy coupon tickets');
            return;
        }
        const lotteryId = event?._id;
        if (!lotteryId) return;
        setCouponBusy(true);
        try {
            const result = await lotteryApi.purchaseCoupon(lotteryId, tierId, quantity);
            const purchaseRecord = (result as any).purchase as { ticketNumbers?: string[] | number[] } | undefined;
            const newTickets = Array.from(new Set([
                ...(result.entries || []).map((e) => String(e.lotteryNumber)),
                ...(purchaseRecord?.ticketNumbers || []).map(String)
            ])).filter(Boolean);
            const purchasedTier = event?.couponTiers?.find((tier) => tier.tierId === tierId);
            const purchasedQuantity = result.entries?.length || quantity;
            const purchasedSymbol = purchasedTier?.currencySymbol || localDepositConfig?.tokenSymbol || 'USDT';
            
            setCouponPanelEntries((prev) => [...prev, ...(result.entries || [])]);
            setLotteryWallet((prev) =>
                mergeLotteryWalletWithPageDeposit(
                    prev
                        ? { ...prev, wallet: result.wallet }
                        : {
                            walletTypeCode: localDepositConfig?.walletTypeCode || 'LOTTERY_WALLET',
                            wallet: result.wallet,
                            depositConfig: localDepositConfig ?? { enabled: false },
                        },
                    localDepositConfig,
                ),
            );
            
            onPurchaseSuccess({
                lotteryId,
                buyerName: 'You',
                isExternal: false,
                amount: Number(result.purchase?.poolContributionAmount ?? (Number(purchasedTier?.amount || 0) * purchasedQuantity)),
                quantity: purchasedQuantity,
                tierId,
                couponLabel: purchasedTier?.label,
                currencySymbol: purchasedSymbol,
                ticketNumbers: newTickets,
                entries: result.entries || [],
                couponPools: result.couponPools,
            });
            
            toast.success(`${result.entries?.length || quantity} lottery ticket${quantity === 1 ? '' : 's'} purchased`);
        } catch (error: unknown) {
            toast.error(lotteryErrorMessage(error, 'Failed to buy lottery coupon'));
        } finally {
            setCouponBusy(false);
        }
    }, [isAuthenticated, event, localDepositConfig, onPurchaseSuccess]);

    return {
        lotteryWallet,
        lotteryTransferOptions,
        couponPanelEntries,
        couponBusy,
        handleLotteryDeposit,
        handleLotteryWalletTransfer,
        handleExternalCouponPurchase,
        handleCouponPurchase,
        // live socket overrides and properties
        event: localEvent,
        poolBoost,
        poolTierGrowth: event?._id ? poolTierGrowth[event._id] || {} : {},
        poolActivity: event?._id ? poolActivityByEvent[event._id] || null : null,
        poolHeartbeatId: event?._id ? poolHeartbeatByEvent[event._id] || null : null,
        poolShareCard,
        onDismissPoolShareCard,
        pageDepositConfig: localDepositConfig,
        lotteryReferralCode,
    };
}
