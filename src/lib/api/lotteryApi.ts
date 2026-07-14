import apiClient from './axios';
import { projectIdHeaders } from './projectHeaders';

const withProjectId = () => ({ headers: projectIdHeaders() });

export const createLotteryIdempotencyKey = (scope: string) =>
    `${scope}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

const withLotteryIdempotency = (idempotencyKey: string) => ({
    headers: {
        ...projectIdHeaders(),
        'Idempotency-Key': idempotencyKey,
    },
});

export interface LotteryReward {
    rank: number;
    type: 'text' | 'image' | 'video';
    value: string;
    label?: string;
    rewardMode?: 'display' | 'token_payout';
    poolSharePercent?: number;
    payout?: {
        amount: string;
        tokenSymbol: string;
        tokenAddress: string;
        tokenDecimals: number;
        chainId: number;
    };
}

export interface LotteryWinnerConfig {
    rank: number;
    selectionType: 'random' | 'selected' | 'dummy';
    preselectedUserId?: string;
    preselectedUserName?: string;
    dummyName?: string;
    reward: LotteryReward;
}

export interface LotteryPageMedia {
    _id?: string;
    type: 'image' | 'video';
    value: string;
    label?: string;
}

export interface LotteryPageConfig {
    projectId: string;
    featureEnabled?: boolean;
    media: LotteryPageMedia[];
    depositConfig?: LotteryDepositConfig;
    lotteryWalletTransferConfig?: LotteryWalletTransferConfig;
}

export interface LotteryReferralConfig {
    enabled: boolean;
    totalPercent: number;
    maxLevels: number;
    distributionMode: 'equal' | 'custom';
    levelPercentages?: number[];
    requireActiveUser?: boolean;
    requireActivePackage?: boolean;
    fallbackGlobalWalletKey?: string;
}

export interface LotteryDepositConfig {
    enabled: boolean;
    depositAddress?: string;
    tokenSymbol?: string;
    tokenAddress?: string;
    tokenDecimals?: number;
    chainId?: number;
    network?: string;
    rpcUrl?: string;
    minDeposit?: string;
    maxDeposit?: string;
    walletTypeCode?: string;
}

export interface LotteryFairnessProof {
    algorithm: string;
    commitHash: string;
    participantSnapshotHash: string;
    winnerOrderHash?: string | null;
    committedAt?: string | null;
    revealedAt?: string | null;
    entryCount: number;
    lastTicketNumber: number;
    serverSeed?: string | null;
}

export interface LotteryPagination {
    page: number;
    limit: number;
    total: number;
    sort?: 'oldest' | 'newest';
    hasMore?: boolean;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
}

export interface LotteryClaimResponse {
    winnerId: string;
    claimStatus: 'not_claimable' | 'claimable' | 'processing' | 'claimed' | 'failed' | 'blocked';
    claimAttemptCount?: number;
    claimRequestedAt?: string | null;
    payoutJobId?: string;
    claimTxHash?: string | null;
}

export interface LotteryEvent {
    _id: string;
    title: string;
    description?: string;
    status: 'upcoming' | 'active' | 'drawing' | 'completed' | 'cancelled';
    entryStartTime: string;
    drawTime: string;
    winnerCount: number;
    minParticipants?: number;
    rewards: LotteryReward[];
    winnerConfigs?: LotteryWinnerConfig[];
    version?: 1 | 2;
    entryTrigger?: 'package_purchase' | 'coupon_purchase' | 'manual';
    couponTiers?: LotteryCouponTier[];
    couponPools?: LotteryCouponPoolSummary;
    lotteryReferralConfig?: LotteryReferralConfig;
    lotteryPageMedia?: LotteryPageMedia[];
    participantCount: number;
    totalParticipantCount?: number;
    realParticipantCount?: number;
    dummyParticipantCount?: number;
    participantRevealIntervalSeconds?: number;
    fairnessProof?: LotteryFairnessProof | null;
    /**
     * Populated by the backend only when status === 'completed'
     * (24h sticky window). Saves a second round-trip on the lottery page.
     */
    winners?: LotteryWinner[];
}

export interface LotteryCouponTier {
    tierId: string;
    label?: string;
    amount: number;
    currencySymbol?: string;
    enabled: boolean;
    prizeMode?: 'fixed' | 'pool_percentage';
    poolPayoutWalletTypeCode?: string;
    poolAmount?: number;
    poolTicketCount?: number;
    poolPurchaseCount?: number;
    poolBuyerCount?: number;
    maxPurchasesPerUser?: number;
    minParticipants?: number;
    onePrizePerUser?: boolean;
    winnerConfigs: LotteryWinnerConfig[];
    claimFee?: {
        enabled: boolean;
        feeType: 'flat' | 'percentage';
        value: number;
        amount?: string;
        tokenSymbol?: string;
    };
}

export interface LotteryCouponPoolTier {
    tierId: string;
    label?: string;
    amount: number;
    currencySymbol?: string;
    totalAmount: number;
    ticketCount: number;
    purchaseCount: number;
    buyerCount: number;
}

export interface LotteryCouponPoolSummary {
    totalAmount: number;
    totalTickets: number;
    totalPurchases: number;
    totalBuyers: number;
    byTier: Record<string, LotteryCouponPoolTier>;
    tiers: LotteryCouponPoolTier[];
}

export interface LotteryPoolUpdatePurchase {
    buyerName?: string;
    participantType?: 'project_user' | 'external';
    amount?: number;
    quantity?: number;
    couponTierId?: string;
    couponLabel?: string;
    currencySymbol?: string;
    ticketNumbers?: string[];
}

export interface LotteryPoolUpdatePayload {
    lotteryId: string;
    couponPools: LotteryCouponPoolSummary;
    couponTiers?: LotteryCouponTier[];
    purchase?: LotteryPoolUpdatePurchase;
}

export interface LotteryEntry {
    _id: string;
    userId?: string;
    displayUserId?: string;
    userName: string;
    lotteryNumber: string;
    couponTierId?: string;
    couponAmount?: number;
    createdAt: string;
}

export interface LotteryWinnerClaimFee {
    enabled: boolean;
    feeType: 'flat' | 'percentage';
    value: number;
    amount?: string;
    tokenSymbol?: string;
    deductedFrom?: 'payout';
}

export interface LotteryWinner {
    _id: string;
    userName: string;
    lotteryNumber: string;
    couponTierId?: string;
    couponAmount?: number;
    couponLabel?: string;
    rank: number;
    tierRank?: number;
    reward: LotteryReward;
    drawnAt: string;
    userId?: string;
    participantType?: 'project_user' | 'external';
    externalEmail?: string;
    externalWalletAddress?: string;
    claimStatus?: 'not_claimable' | 'claimable' | 'processing' | 'claimed' | 'failed' | 'blocked';
    claimTxHash?: string;
    claimFailureReason?: string;
    claimFee?: LotteryWinnerClaimFee | null;
    grossPayoutAmount?: string | null;
    netPayoutAmount?: string | null;
    poolPrize?: {
        enabled: boolean;
        poolAmount: string;
        sharePercent: number;
        grossAmount: string;
        walletTypeCode?: string;
        creditStatus?: 'not_applicable' | 'credited' | 'skipped' | 'failed';
        creditedAmount?: string;
        creditedAt?: string | null;
        failureReason?: string | null;
    } | null;
    canClaim?: boolean;
}

export interface ExternalLotteryPurchase {
    _id?: string;
    id: string;
    lotteryId: string;
    couponTierId: string;
    couponAmount: number;
    couponLabel?: string;
    userId: string;
    userName: string;
    participantType: 'external';
    externalEmail: string;
    externalWalletAddress: string;
    transactionHash: string;
    quantity: number;
    totalAmount: number;
    poolContributionAmount?: number;
    referralBudgetAmount?: number;
    referralPaidAmount?: number;
    referralFallbackAmount?: number;
    referralSponsorUserId?: string;
    referralCode?: string;
    ticketNumbers: string[];
    status: string;
    createdAt?: string;
}

export interface ExternalLotteryStatus {
    participant: {
        userId: string;
        participantType: 'external';
        email: string;
        walletAddress: string;
    };
    purchases: ExternalLotteryPurchase[];
    events: Array<{
        id: string;
        title: string;
        slug?: string;
        status: LotteryEvent['status'];
        entryStartTime: string;
        drawTime: string;
        entryTrigger?: LotteryEvent['entryTrigger'];
        version?: LotteryEvent['version'];
        selectedWinnerType?: string;
    }>;
    winners: LotteryWinner[];
}

export interface ExternalLotteryClaimRecord {
    lotteryId: string;
    purchaseId: string;
    participantUserId: string;
    name: string;
    email: string;
    walletAddress: string;
    transactionHash: string;
    claimAccessToken: string;
    ticketNumbers: string[];
    createdAt: string;
}

export interface LotteryRecentWinner extends LotteryWinner {
    lotteryId: string;
    eventTitle: string;
    eventDrawTime: string;
    eventStatus?: LotteryEvent['status'];
    eventVersion?: LotteryEvent['version'];
    eventEntryTrigger?: LotteryEvent['entryTrigger'];
}

/** v2 coupon flow: separate tier pricing and lottery wallet purchases */
export function isCouponLotteryEvent(event: LotteryEvent | null | undefined): boolean {
    if (!event) return false;
    return event.entryTrigger === 'coupon_purchase' || Number(event.version || 1) === 2;
}

export interface LotteryWalletResponse {
    walletTypeCode: string;
    wallet: {
        balance: number;
        availableBalance: number;
        totalDeposit: number;
        totalWithdraw: number;
        totalIncome: number;
    };
    depositConfig: LotteryDepositConfig;
    lotteryWalletTransferConfig?: LotteryWalletTransferConfig;
}

export interface LotteryWalletTransferConfig {
    enabled: boolean;
    walletTypeCodes: string[];
    feeDeductionMode?: 'none' | 'extra' | 'included';
    feeType: 'flat' | 'percentage';
    feeValue: number;
    minAmount?: string;
    maxAmount?: string;
}

export interface LotteryWalletTransferOptions {
    lotteryWalletTypeCode: string;
    lotteryWalletTransferConfig: LotteryWalletTransferConfig;
    wallets: Array<{
        walletTypeCode: string;
        wallet: LotteryWalletResponse['wallet'];
    }>;
}

export const lotteryApi = {
    /** Get the currently active or next upcoming lottery */
    getActiveLottery: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryEvent | null }>(
            '/lottery/active',
            withProjectId()
        );
        return response.data.data;
    },

    getPageConfig: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryPageConfig }>(
            '/lottery/page-config',
            withProjectId()
        );
        return response.data.data;
    },

    /** User-facing lobby list: all active/drawing/upcoming package and coupon lotteries. */
    getOpenLotteries: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryEvent[] }>(
            '/lottery/events/open',
            withProjectId()
        );
        return response.data.data || [];
    },

    /** Get one lottery event by id, used when a user selects a specific parallel draw. */
    getLotteryEvent: async (lotteryId: string) => {
        const response = await apiClient.get<{ success: boolean; data: LotteryEvent | null }>(
            `/lottery/events/${lotteryId}`,
            withProjectId()
        );
        return response.data.data;
    },

    /** Coupon v2 draws that are still open for purchases (parallel events). */
    getOpenCouponLotteries: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryEvent[] }>(
            '/lottery/coupon-events/open',
            withProjectId()
        );
        return response.data.data || [];
    },

    /** Get participant list for a lottery */
    getParticipants: async (
        lotteryId: string,
        page: number = 1,
        limit: number = 50,
        sort: 'oldest' | 'newest' = 'oldest',
    ) => {
        const response = await apiClient.get<{
            success: boolean;
            data: LotteryEntry[];
            pagination: LotteryPagination;
        }>(`/lottery/${lotteryId}/participants?page=${page}&limit=${limit}&sort=${sort}`, withProjectId());
        return response.data;
    },

    /** Get winners for a completed lottery */
    getWinners: async (lotteryId: string) => {
        const response = await apiClient.get<{ success: boolean; data: LotteryWinner[] }>(
            `/lottery/${lotteryId}/winners`,
            withProjectId()
        );
        return response.data.data;
    },

    /** Check if current user has an entry */
    getMyEntry: async (lotteryId: string) => {
        const response = await apiClient.get<{ success: boolean; data: LotteryEntry | null }>(
            `/lottery/${lotteryId}/my-entry`,
            withProjectId()
        );
        return response.data.data;
    },

    getMyEntries: async (lotteryId: string) => {
        const response = await apiClient.get<{ success: boolean; data: { entries: LotteryEntry[]; byTier: Record<string, LotteryEntry[]> } }>(
            `/lottery/${lotteryId}/my-entries`,
            withProjectId()
        );
        return response.data.data;
    },

    getLotteryWallet: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryWalletResponse }>(
            '/lottery/wallet',
            withProjectId()
        );
        return response.data.data;
    },

    depositLotteryWallet: async (data: { amount: number; transactionHash: string; walletAddress?: string }) => {
        const response = await apiClient.post<{ success: boolean; data: { wallet: LotteryWalletResponse['wallet']; amount: number; status: string; transactionHash: string } }>(
            '/lottery/wallet/deposit',
            data,
            withProjectId()
        );
        return response.data.data;
    },

    getLotteryWalletTransferOptions: async () => {
        const response = await apiClient.get<{ success: boolean; data: LotteryWalletTransferOptions }>(
            '/lottery/wallet/transfer-options',
            withProjectId()
        );
        return response.data.data;
    },

    transferLotteryWallet: async (data: { fromWalletTypeCode: string; toWalletTypeCode: string; amount: number; idempotencyKey?: string }) => {
        const idempotencyKey = data.idempotencyKey || createLotteryIdempotencyKey(`wallet-transfer:${data.fromWalletTypeCode}:${data.toWalletTypeCode}:${data.amount}`);
        const response = await apiClient.post<{
            success: boolean;
            data: {
                reference: string;
                amount: number;
                debitAmount?: number;
                creditAmount?: number;
                feeAmount: number;
                feeDeductionMode?: 'none' | 'extra' | 'included';
                fromWalletTypeCode: string;
                toWalletTypeCode: string;
                fromWallet: LotteryWalletResponse['wallet'];
                toWallet: LotteryWalletResponse['wallet'];
                lotteryWallet: LotteryWalletResponse['wallet'];
            };
        }>(
            '/lottery/wallet/transfer',
            data,
            withLotteryIdempotency(idempotencyKey)
        );
        return response.data.data;
    },

    purchaseExternalCoupon: async (
        lotteryId: string,
        tierId: string,
        data: {
            name: string;
            email: string;
            walletAddress: string;
            amount: number;
            transactionHash: string;
            quantity: number;
            idempotencyKey?: string;
            referralCode?: string;
        },
    ) => {
        const idempotencyKey =
            data.idempotencyKey ||
            `external-coupon:${lotteryId}:${tierId}:${String(data.transactionHash || '').trim().toLowerCase()}:${data.quantity}`;
        const response = await apiClient.post<{
            success: boolean;
            data: {
                purchase?: ExternalLotteryPurchase;
                paymentRequestId?: string;
                claimAccessToken?: string;
                entries: LotteryEntry[];
                couponPools?: LotteryCouponPoolSummary;
                participant?: {
                    userId: string;
                    userName: string;
                    participantType: 'external';
                    email: string;
                    walletAddress: string;
                };
            };
        }>(
            `/lottery/public/${lotteryId}/coupons/${tierId}/purchase`,
            data,
            withLotteryIdempotency(idempotencyKey)
        );
        return response.data.data;
    },

    getExternalLotteryStatus: async (data: {
        email: string;
        walletAddress: string;
        transactionHash?: string;
        claimAccessToken?: string;
    }) => {
        const response = await apiClient.post<{ success: boolean; data: ExternalLotteryStatus }>(
            '/lottery/public/external/status',
            data,
            withProjectId()
        );
        return response.data.data;
    },

    claimExternalReward: async (winnerId: string, data: {
        email: string;
        walletAddress: string;
        transactionHash?: string;
        claimAccessToken?: string;
        idempotencyKey?: string;
    }) => {
        const idempotencyKey =
            data.idempotencyKey ||
            `external-claim:${winnerId}:${String(data.claimAccessToken || data.transactionHash || '').trim().toLowerCase()}:${String(data.walletAddress || '').trim().toLowerCase()}`;
        const response = await apiClient.post<{ success: boolean; data: LotteryClaimResponse }>(
            `/lottery/public/winners/${winnerId}/claim`,
            data,
            withLotteryIdempotency(idempotencyKey)
        );
        return response.data.data;
    },

    purchaseCoupon: async (lotteryId: string, tierId: string, quantity: number) => {
        const idempotencyKey = createLotteryIdempotencyKey(`coupon:${lotteryId}:${tierId}:${quantity}`);
        const response = await apiClient.post<{ success: boolean; data: { purchase?: ExternalLotteryPurchase; entries: LotteryEntry[]; wallet: LotteryWalletResponse['wallet']; couponPools?: LotteryCouponPoolSummary; referralSummary?: any } }>(
            `/lottery/${lotteryId}/coupons/${tierId}/purchase`,
            {
                quantity,
                idempotencyKey,
            },
            withLotteryIdempotency(idempotencyKey)
        );
        return response.data.data;
    },

    /** Get lottery history */
    getHistory: async (page: number = 1, limit: number = 10) => {
        const response = await apiClient.get<{
            success: boolean;
            data: (LotteryEvent & { winners: LotteryWinner[] })[];
            pagination: LotteryPagination;
        }>(`/lottery/history?page=${page}&limit=${limit}`, withProjectId());
        return response.data;
    },

    /** Paginated winner feed for the horizontal previous-winners reel */
    getRecentWinners: async (page: number = 1, limit: number = 20) => {
        const response = await apiClient.get<{
            success: boolean;
            data: LotteryRecentWinner[];
            pagination: LotteryPagination;
        }>(`/lottery/winners/recent?page=${page}&limit=${limit}`, withProjectId());
        return response.data;
    },

    /** Current user's lottery wins, latest first */
    getMyWinners: async (page: number = 1, limit: number = 20) => {
        const response = await apiClient.get<{
            success: boolean;
            data: LotteryRecentWinner[];
            pagination: LotteryPagination;
        }>(`/lottery/winners/my?page=${page}&limit=${limit}`, withProjectId());
        return response.data;
    },

    /** Claim token payout for a winner record */
    claimReward: async (winnerId: string) => {
        const idempotencyKey = createLotteryIdempotencyKey(`winner-claim:${winnerId}`);
        const response = await apiClient.post<{ success: boolean; data: LotteryClaimResponse }>(
            `/lottery/winners/${winnerId}/claim`,
            { idempotencyKey },
            withLotteryIdempotency(idempotencyKey)
        );
        return response.data;
    },
};
