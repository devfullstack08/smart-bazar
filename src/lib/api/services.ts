import { API_URL, PROJECT_ID } from '@/constants/env';
import { STORAGE_KEYS } from '@/constants/storageKey';
import { storageGetItem } from '@/lib/safe-storage';
import { IPaymentConfig } from '@/types/paymentConfig';
import apiClient from './axios';
import {
    AuthResponse,
    Banner,
    DashboardMedia,
    ProjectPopup,
    Offer,
    Package,
    DashboardStats,
    DashboardData,
    Income,
    IncomeSummary,
    IncomeOverview,
    IncomeTransaction,
    IncomeTransactionsResponse,
    TeamStats,
    TeamStatsData,
    TeamMember,
    GenealogyNode,
    GenealogyData,
    GenealogyTreeNode,
    AutoPoolMatrixData,
    Wallet,
    WalletData,
    WalletState,
    WalletTransaction,
    WalletTransactionsResponse,
    WalletTransactionsFilters,
    Transaction,
    User,
    UserPackage,
    PaymentRequest,
    PaymentHistoryResponse,
    Web3ABIs,
    CappingTrackingData,
    RankStatusData,
    PoolBalance,
    PoolStatusData
} from '@/types';
import { adminPopupApi } from './adminPopupApi';

const projectId = PROJECT_ID;

// Helper to add projectId header
const withProjectId = () => ({
    headers: { projectId }
});

// ==================== AUTH APIs ====================
export const authApi = {
    register: async (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        walletAddress?: string; // Web3 Wallet Address
        sponsorId?: string; // Optional
        placement?: {
            position: 'left' | 'right';
            parentId?: string; // Optional
        };
    }) => {
        const payload = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            ...(data.walletAddress && { walletAddress: data.walletAddress }),
            ...(data.sponsorId && { sponsorId: data.sponsorId }),
            ...(data.placement && { placement: data.placement }),
            ...(projectId && { projectId }),
        };
        const response = await apiClient.post('/users/register', payload, {
            headers: { 'x-project-id': projectId || '' },
        });
        return response.data;
    },

    login: async (emailOrUserId: string, password: string) => {
        const response = await apiClient.post<AuthResponse>(
            '/users/login',
            { emailOrUserId, password },
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    loginWithPin: async (emailOrUserId: string, pin: string) => {
        const response = await apiClient.post<AuthResponse>(
            '/users/login/pin',
            { emailOrUserId, pin },
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    getPasskeyLoginOptions: async (emailOrUserId: string) => {
        const response = await apiClient.post(
            '/users/passkey/login/options',
            { emailOrUserId },
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    verifyPasskeyLogin: async (emailOrUserId: string, assertionResponse: any) => {
        const response = await apiClient.post<AuthResponse>(
            '/users/passkey/login/verify',
            { emailOrUserId, assertionResponse },
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    getDiscoverPasskeyOptions: async () => {
        const response = await apiClient.post(
            '/users/passkey/discover/options',
            {},
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    verifyDiscoverPasskey: async (assertionResponse: any) => {
        const response = await apiClient.post<AuthResponse>(
            '/users/passkey/discover/verify',
            { assertionResponse },
            { headers: { 'x-project-id': projectId || '' } }
        );
        return response.data;
    },

    refreshToken: async (refreshToken: string) => {
        const response = await apiClient.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    validateSponsor: async (sponsorId: string) => {
        const response = await apiClient.get(`/users/validate-sponsor/${sponsorId}`, withProjectId());
        return response.data;
    },

    /** Check if user exists by email or userId - for two-step login. Returns { exists: boolean, name?: string, hasPinSet?: boolean, hasPasskey?: boolean }. */
    checkUser: async (emailOrUserId: string) => {
        const encoded = encodeURIComponent(emailOrUserId.trim());
        const response = await apiClient.get<{ exists: boolean; name?: string; hasPinSet?: boolean; hasPasskey?: boolean; data?: { exists: boolean; name?: string; hasPinSet?: boolean; hasPasskey?: boolean } }>(
            `/users/check-user/${encoded}`,
            withProjectId()
        );
        const data = response.data as any;
        return {
            exists: data?.exists ?? data?.data?.exists ?? false,
            name: data?.name ?? data?.data?.name ?? '',
            hasPinSet: data?.hasPinSet ?? data?.data?.hasPinSet ?? false,
            hasPasskey: data?.hasPasskey ?? data?.data?.hasPasskey ?? false,
        };
    },

    logout: async () => {
        const response = await apiClient.post('/users/logout');
        return response.data;
    },

    /** Verify vault key (User ID + Vault Key). Returns { resetToken } for password reset. */
    verifyVault: async (userId: string, vaultKey: string) => {
        const response = await apiClient.post<{ data?: { resetToken: string }; resetToken?: string }>(
            '/users/verify-vault',
            { userId, vaultKey },
            withProjectId()
        );
        const d = response.data as Record<string, unknown>;
        return { resetToken: String(d?.resetToken ?? (d?.data as { resetToken?: string })?.resetToken ?? '') };
    },

    /** Reset password using resetToken from verifyVault. Returns { accessToken, refreshToken, user }. */
    resetPassword: async (resetToken: string, newPassword: string) => {
        const response = await apiClient.post<AuthResponse & { message?: string }>(
            '/users/reset-password',
            { resetToken, newPassword },
            withProjectId()
        );
        return response.data;
    },

    /** Reveal/regenerate vault key. Requires current password. Returns { vaultUserId, vaultKey } once. */
    revealVaultKey: async (currentPassword: string) => {
        const response = await apiClient.post(
            '/users/reveal-vault-key',
            { currentPassword },
            withProjectId()
        );
        const res = response.data as { data?: { vaultUserId?: string; vaultKey?: string }; vaultUserId?: string; vaultKey?: string };
        const creds = res?.data ?? res;
        return {
            vaultUserId: String(creds?.vaultUserId ?? res?.vaultUserId ?? ''),
            vaultKey: String(creds?.vaultKey ?? res?.vaultKey ?? ''),
        };
    },
};

// ==================== PROJECT APIs ====================
export const projectApi = {
    getDetails: async (projectIdParam?: string) => {
        const pid = projectIdParam || projectId;
        const response = await apiClient.get(`projects/${pid}`);
        return response.data;
    },

    getIncomeConfig: async () => {
        const response = await apiClient.get('/income/config', withProjectId());
        return response.data;
    },
};

// ==================== PACKAGE APIs ====================
export const packageApi = {
    getAll: async () => {
        const response = await apiClient.get<{ success: boolean; data: Package[] }>(
            '/packages',
            withProjectId()
        );
        // Map packages to ensure id field exists (backend may return _id)
        const packages = response.data.data.map((pkg: any) => ({
            ...pkg,
            id: pkg.id || pkg._id, // Use id if available, otherwise use _id
        }));
        return packages;
    },

    getUserPackages: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: UserPackage[] }>(
            `/packages/user/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    /**
     * Get authenticated user's own packages and investment statistics.
     * Single-responsibility endpoint for package and investment data.
     * 
     */
    getMyPackages: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: {
                userId: string;
                packages: {
                    active: number;
                    total: number;
                    items: Array<{
                        packageId: string;
                        packageNumber: number;
                        totalValue: number;
                        stakingPackage?: string;
                        totalEarned: number;
                        cappingLimit: number;
                        remainingCapping: number;
                        purchaseDate: string;
                        expiryDate?: string;
                        lastROIDate?: string;
                        isActive: boolean;
                        status: 'active' | 'cap_reached' | 'expired';
                    }>;
                };
                investment: {
                    totalInvestment: number;
                    todayInvestment: number;
                    yesterdayInvestment: number;
                    totalEarnedFromPackages: number;
                    totalCappingLimit: number;
                    totalRemainingCapping: number;
                };
            };
        }>('/users/packages', withProjectId());
        return response.data.data;
    },

    // Purchase Package (new endpoint - uses wallet balance)
    purchase: async (packageId: string) => {
        if (!packageId || packageId.trim() === '') {
            throw new Error('Package ID is required');
        }

        // Ensure both packageId and projectId are in the request body
        const requestBody = {
            packageId: packageId.trim(),
            projectId: projectId,
        };


        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: {
                package: UserPackage;
                wallet: {
                    balance: number;
                    totalEarned: number;
                    totalWithdrawn: number;
                };
                reference: string;
            };
        }>(
            '/users/packages/purchase',
            requestBody,
            withProjectId()
        );
        return response.data.data;
    },

    // Legacy purchase method (kept for backward compatibility)
    purchaseLegacy: async (userId: string, packageId: string, paymentMethod: 'wallet' | 'external' = 'wallet') => {
        const response = await apiClient.post(
            '/packages/purchase',
            {
                userId,
                packageId,
                paymentMethod,
            },
            withProjectId()
        );
        return response.data;
    },
};

// ==================== INCOME APIs ====================
export const incomeApi = {
    /** Get income type labels (admin-provided display names from project config) */
    getIncomeRegistry: async () => {
        const response = await apiClient.get<{
            success: boolean;
            data: Array<{ code: string; label: string }>;
        }>('/income/registry/labels', withProjectId());
        return response.data.data;
    },

    // Get Income Overview (new endpoint)
    getIncomeOverview: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: IncomeOverview;
        }>('/users/income/overview', withProjectId());
        return response.data.data;
    },

    // Get Income Transactions (new endpoint with filters)
    getIncomeTransactions: async (filters?: {
        type?: string;
        status?: string;
        limit?: number;
        page?: number;
        skip?: number;
        startDate?: string;
        endDate?: string;
    }) => {
        const limit = filters?.limit ?? 20;
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        params.append('limit', limit.toString());
        if (filters?.page != null) params.append('page', filters.page.toString());
        else if (filters?.skip != null) params.append('skip', filters.skip.toString());
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const queryString = params.toString();
        const url = `/users/income/transactions${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: IncomeTransaction[] | IncomeTransactionsResponse;
            pagination?: any;
        }>(url, withProjectId());
        const body = response.data;
        const transactions = Array.isArray(body.data) ? body.data : (body.data?.transactions ?? []);
        const rawPagination = body.pagination ?? (Array.isArray(body.data) ? undefined : body.data?.pagination);
        const total = rawPagination?.total ?? transactions.length;
        const page = rawPagination?.page ?? (rawPagination?.skip != null ? Math.floor(rawPagination.skip / limit) + 1 : (filters?.page ?? 1));
        const totalPages = rawPagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
        const pagination = {
            total,
            page,
            limit: rawPagination?.limit ?? limit,
            hasMore: rawPagination?.hasMore ?? (rawPagination?.hasNextPage ?? page < totalPages),
            totalPages,
            hasNextPage: rawPagination?.hasNextPage ?? page < totalPages,
            hasPrevPage: rawPagination?.hasPrevPage ?? page > 1,
            skip: rawPagination?.skip,
            totalCommissions: (rawPagination as any)?.totalCommissions ?? 0,
            totalTransactions: (rawPagination as any)?.totalTransactions ?? total,
        };
        return { transactions, pagination };
    },

    // Legacy endpoints (kept for backward compatibility)
    getUserSummary: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: IncomeSummary }>(
            `/income/user/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    getTransactions: async (page: number = 1, limit: number = 20) => {
        const response = await apiClient.get<{
            success: boolean;
            data: {
                transactions: Income[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    pages: number;
                };
            };
        }>(`/income/transactions?page=${page}&limit=${limit}`, withProjectId());
        return response.data.data;
    },

    getRules: async (filters?: {
        ruleType?: 'binary' | 'level' | 'roi' | 'referral';
        isActive?: boolean;
    }) => {
        const params = new URLSearchParams();
        if (filters?.ruleType) params.append('ruleType', filters.ruleType);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const queryString = params.toString();
        const url = `/income/rules${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<{
            success: boolean;
            data: Array<{
                _id: string;
                ruleType: string;
                name: string;
                isActive: boolean;
                config: any;
                createdAt: string;
            }>;
        }>(url, withProjectId());
        return response.data.data;
    },
};

// ==================== DASHBOARD APIs ====================
export const dashboardApi = {
    getStats: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: DashboardStats }>(
            `/dashboard/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },
    // Get capping tracking information
    getCappingTracking: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: CappingTrackingData;
        }>('/users/capping/tracking', withProjectId());
        return response.data.data;
    },

    /** Get all global wallets and balances for project (one API — same as admin list, no hardcoded keys) */
    getGlobalWallets: async (): Promise<PoolBalance[]> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: PoolBalance[];
        }>('/users/global-wallets', withProjectId());
        return response.data.data ?? [];
    },

    /** Get current user's pool status (all pools + income received this month + eligibility status per pool) */
    getPoolStatus: async (): Promise<{ year: number; month: number; pools: Array<{ incomeTypeCode: string; label: string; scheduleSummary: string; receivedThisMonth: number; eligibilityStatus?: { isEligible: boolean; message: string; current?: number; required?: number; unit?: string } }> }> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: { year: number; month: number; pools: Array<{ incomeTypeCode: string; label: string; scheduleSummary: string; receivedThisMonth: number; eligibilityStatus?: { isEligible: boolean; message: string; current?: number; required?: number; unit?: string } }> };
        }>('/users/income/pool-status', withProjectId());
        return response.data.data ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1, pools: [] };
    },

    /** Get full pool status details for one pool (requirement, progress, member list). Query: incomeTypeCode, year?, month? */
    getPoolStatusDetails: async (incomeTypeCode: string, year?: number, month?: number): Promise<{
        incomeTypeCode: string;
        label: string;
        requirementText: string;
        requiredCount: number;
        currentCount: number;
        rewardDescription: string;
        scheduleSummary: string;
        members: Array<{ userId: string; name?: string; position?: number; note?: string; joinCount?: number; directCount?: number; joinedAt?: string }>;
        /** Leaderboard only: current user's rank in top 100 (1-based), or undefined if not in top */
        currentUserRank?: number;
    } | null> => {
        const params = new URLSearchParams();
        if (year != null) params.set('year', String(year));
        if (month != null) params.set('month', String(month));
        const qs = params.toString();
        const url = `/users/income/pool-status/${encodeURIComponent(incomeTypeCode)}/details${qs ? `?${qs}` : ''}`;
        const response = await apiClient.get<{
            success: boolean;
            data: {
                incomeTypeCode: string;
                label: string;
                requirementText: string;
                requiredCount: number;
                currentCount: number;
                rewardDescription: string;
                scheduleSummary: string;
                members: Array<{ userId: string; name?: string; position?: number; note?: string; joinCount?: number; directCount?: number; joinedAt?: string }>;
                currentUserRank?: number;
            };
        }>(url, withProjectId());
        return response.data?.data ?? null;
    },
};

// ==================== TEAM APIs ====================
export const teamApi = {
    // Get comprehensive team statistics (new endpoint)
    getTeamStats: async (maxDepth?: number) => {
        const params = new URLSearchParams();
        if (Number.isFinite(maxDepth as number) && (maxDepth as number) > 0) {
            params.set('maxDepth', String(Math.floor(maxDepth as number)));
        }
        const query = params.toString();
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: TeamStatsData;
        }>(`/users/team/stats${query ? `?${query}` : ''}`, withProjectId());
        return response.data.data;
    },

    // Legacy endpoints (kept for backward compatibility)
    getStats: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: TeamStats }>(
            `/team/stats/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    getMembers: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: TeamMember[] }>(
            `/team/members/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    // Get Genealogy (new endpoint - uses authenticated user)
    getGenealogy: async (depth: number = 3) => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: GenealogyData;
        }>(`/users/genealogy?depth=${depth}`, withProjectId());
        return response.data.data;
    },

    // Legacy getGenealogy (kept for backward compatibility)
    getGenealogyLegacy: async (userId: string, depth: number = 15) => {
        const response = await apiClient.get<{ success: boolean; data: GenealogyNode }>(
            `/users/genealogy/${userId}?depth=${depth}`,
            withProjectId()
        );
        return response.data.data;
    },

    // Get Auto Pool Matrix Data
    getAutoPoolMatrix: async () => {
        const response = await apiClient.get('/users/autopool/matrix', withProjectId());
        return response.data;
    },
};

// ==================== WALLET APIs ====================
export const walletApi = {
    /**
     * Get wallet state (balance, summary, statistics). No pagination.
     * Use this for overview; cache and refresh after deposit/withdrawal/income.
     */
    getWalletState: async (): Promise<WalletState> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: WalletState;
        }>('/users/wallet', withProjectId());
        return response.data.data;
    },

    refreshWithdrawalAllowance: async (): Promise<{
        cooldownSeconds: number;
        nextRefreshAt: string;
        sync: {
            success: boolean;
            skipped?: boolean;
            reason?: string;
            deltaApproved?: string;
            deltaRevoked?: string;
            targetAllowanceHuman?: string;
            currentAllowanceHuman?: string;
            policyWithdrawableHuman?: string;
            onChainBucketWithoutAllowanceHuman?: string;
        };
    }> => {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: {
                cooldownSeconds: number;
                nextRefreshAt: string;
                sync: {
                    success: boolean;
                    skipped?: boolean;
                    reason?: string;
                    deltaApproved?: string;
                    deltaRevoked?: string;
                    targetAllowanceHuman?: string;
                    currentAllowanceHuman?: string;
                    policyWithdrawableHuman?: string;
                    onChainBucketWithoutAllowanceHuman?: string;
                };
            };
        }>('/users/wallet/withdrawal-allowance/refresh', {}, withProjectId());
        return response.data.data;
    },

    getWithdrawalAllowanceStatus: async (): Promise<{
        available: boolean;
        status: 'synced' | 'needs_refresh' | 'unavailable';
        walletAddress: string | null;
        withdrawalAllowanceHuman: string;
        currentAllowanceHuman: string;
        policyWithdrawableHuman: string;
        onChainBucketWithoutAllowanceHuman: string;
        lastRefreshedAt: string | null;
    }> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: {
                available: boolean;
                status: 'synced' | 'needs_refresh' | 'unavailable';
                walletAddress: string | null;
                withdrawalAllowanceHuman: string;
                currentAllowanceHuman: string;
                policyWithdrawableHuman: string;
                onChainBucketWithoutAllowanceHuman: string;
                lastRefreshedAt: string | null;
            };
        }>('/users/wallet/withdrawal-allowance/status', withProjectId());
        return response.data.data;
    },

    /**
     * Get wallet transactions with pagination and filters.
     * Use when displaying transaction history.
     */
    getWalletTransactions: async (
        filters?: WalletTransactionsFilters
    ): Promise<WalletTransactionsResponse> => {
        const limit = filters?.limit ?? 20;
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if ((filters as any)?.page != null) params.append('page', (filters as any).page.toString());
        else if (filters?.skip != null) params.append('skip', filters.skip.toString());
        if (filters?.category) params.append('category', filters.category);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const queryString = params.toString();
        const url = `/users/wallet/transactions${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: WalletTransaction[] | WalletTransactionsResponse;
            pagination?: any;
        }>(url, withProjectId());
        const body = response.data;
        const transactions = Array.isArray(body.data) ? body.data : (body.data?.transactions ?? []);
        const rawPagination = body.pagination ?? (Array.isArray(body.data) ? undefined : body.data?.pagination);
        const total = rawPagination?.total ?? transactions.length;
        const page = rawPagination?.page ?? (rawPagination?.skip != null ? Math.floor(rawPagination.skip / limit) + 1 : ((filters as any)?.page ?? 1));
        const totalPages = rawPagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
        const pagination = {
            total,
            page,
            limit: rawPagination?.limit ?? limit,
            hasMore: rawPagination?.hasMore ?? (rawPagination?.hasNextPage ?? page < totalPages),
            totalPages,
            hasNextPage: rawPagination?.hasNextPage ?? page < totalPages,
            hasPrevPage: rawPagination?.hasPrevPage ?? page > 1,
            skip: rawPagination?.skip,
        };
        return { transactions, pagination };
    },

    /** @deprecated Use getWalletState() + getWalletTransactions() for better performance */
    getWallet: async (filters?: WalletTransactionsFilters): Promise<WalletData> => {
        const [state, txResponse] = await Promise.all([
            walletApi.getWalletState(),
            walletApi.getWalletTransactions({ limit: filters?.limit ?? 20, skip: filters?.skip ?? 0, category: filters?.category, startDate: filters?.startDate, endDate: filters?.endDate }),
        ]);
        return {
            ...state,
            transactions: {
                list: txResponse.transactions,
                pagination: txResponse.pagination,
            },
        };
    },

    // Legacy endpoints (kept for backward compatibility)
    getBalance: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: Wallet }>(
            `/wallet/balance/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    getTransactions: async (limit: number = 20) => {
        const response = await apiClient.get<{ success: boolean; data: Transaction[] }>(
            `/wallet/transactions?limit=${limit}`,
            withProjectId()
        );
        return response.data.data;
    },

    /**
     * Create withdrawal request (admin-approved: bank, UPI, or special cases).
     * Do NOT use for Web3 self-withdrawal; use withdrawSelf() instead.
     */
    withdraw: async (data: {
        method: 'bank_transfer' | 'upi' | 'web3' | 'withdrawal_request' | 'wallet_address';
        amount: number;
        withdrawalDetails?: {
            bankAccount?: string;
            upiId?: string;
            walletAddress?: string;
        };
        description?: string;
        twoFactorToken?: string;
    }) => {
        const headers: any = { ...withProjectId().headers };
        if (data.twoFactorToken) {
            headers['x-2fa-token'] = data.twoFactorToken;
        }

        if (data.method === 'wallet_address') {
            const response = await apiClient.post<{
                success: boolean;
                message: string;
                data: PaymentRequest;
            }>('/users/payment/withdrawal/wallet-address', {
                amount: data.amount,
                walletAddress: data.withdrawalDetails?.walletAddress,
                description: data.description,
                twoFactorToken: data.twoFactorToken,
            }, { headers });
            return response.data.data;
        }

        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: PaymentRequest;
        }>('/users/payment/withdrawal', data, { headers });
        return response.data.data;
    },

    /**
     * Web3 self-withdrawal: submit tx hash after user has called contract.withdraw(amount).
     * Backend verifies tx and updates DB wallet when confirmed.
     */
    withdrawSelf: async (data: { transactionHash: string; amount: number; walletAddress: string }) => {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: { requestId: string; reference: string; amount: number; transactionHash: string; status: string };
        }>('/users/payment/withdrawal/self', data, withProjectId());
        return response.data.data;
    },

    // Legacy withdraw method (kept for backward compatibility)
    withdrawLegacy: async (data: {
        amount: number;
        method: string;
        accountDetails: any;
    }) => {
        const response = await apiClient.post('/wallet/withdraw', data, withProjectId());
        return response.data;
    },
};

// ==================== PASSBOOK APIs ====================
export interface PassbookEntry {
    _id?: string;
    createdAt: string;
    description: string;
    type: 'credit' | 'debit';
    category?: string;
    amount: number;
    balanceAfter: number;
    balanceBefore?: number;
}

export interface PassbookSummary {
    totalCredited: number;
    totalDebited: number;
    netBalance: number;
    entryCount: number;
    lastActivity: string | null;
}

export interface PassbookListFilters {
    category?: string;
    type?: 'credit' | 'debit';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export const passbookApi = {
    getSummary: async (): Promise<PassbookSummary> => {
        const response = await apiClient.get<{ success: boolean; data: PassbookSummary }>(
            '/users/passbook/summary',
            withProjectId()
        );
        return response.data.data;
    },

    getPassbook: async (filters?: PassbookListFilters) => {
        const params = new URLSearchParams();
        if (filters?.page != null) params.set('page', String(filters.page));
        if (filters?.limit != null) params.set('limit', String(filters.limit));
        if (filters?.category) params.set('category', filters.category);
        if (filters?.type) params.set('type', filters.type);
        if (filters?.from) params.set('from', filters.from);
        if (filters?.to) params.set('to', filters.to);
        const qs = params.toString();
        const url = `/users/passbook${qs ? `?${qs}` : ''}`;
        const response = await apiClient.get<{
            success: boolean;
            data: PassbookEntry[];
            pagination: { page: number; limit: number; total: number; pages: number };
        }>(url, withProjectId());
        return {
            entries: response.data.data,
            pagination: response.data.pagination,
        };
    },

    exportPassbook: async (
        format: 'csv' | 'pdf',
        filters?: { from?: string; to?: string }
    ): Promise<Blob> => {
        const params = new URLSearchParams();
        params.set('format', format);
        if (filters?.from) params.set('from', filters.from);
        if (filters?.to) params.set('to', filters.to);
        const response = await apiClient.get(`/users/passbook/export?${params.toString()}`, {
            ...withProjectId(),
            responseType: 'blob',
        });
        return response.data;
    },
};

// ==================== PAYMENT APIs ====================
export const paymentApi = {
    // Get Payment Methods
    getPaymentMethods: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: IPaymentConfig;
        }>('/users/payment/methods', withProjectId());
        return response.data.data;
    },

    // Create Deposit Request
    createDeposit: async (data: {
        method: 'bank_transfer' | 'upi' | 'web3';
        amount: number;
        proof: File;
        description?: string;
    }) => {
        const formData = new FormData();
        formData.append('method', data.method);
        formData.append('amount', data.amount.toString());
        formData.append('proof', data.proof);
        if (data.description) {
            formData.append('description', data.description);
        }

        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN);

        const headers: Record<string, string> = { 'X-Project-ID': projectId ?? '' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch(`${API_URL}/users/payment/deposit`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Deposit request failed' }));
            throw new Error(error.error || error.message || 'Deposit request failed');
        }

        const result = await response.json();
        return result.data;
    },

    // Update Deposit Proof
    updateDepositProof: async (requestId: string, proof: File, oldProofImage?: string) => {
        const formData = new FormData();
        formData.append('proof', proof);
        if (oldProofImage) {
            formData.append('oldProofImage', oldProofImage);
        }

        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN);

        const headers: Record<string, string> = { 'X-Project-ID': projectId ?? '' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch(`${API_URL}/users/payment/deposit/${requestId}`, {
            method: 'PATCH',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Update failed' }));
            throw new Error(error.error || error.message || 'Update failed');
        }

        const result = await response.json();
        return result.data;
    },

    // Get Payment History
    getPaymentHistory: async (filters?: {
        type?: 'deposit' | 'withdrawal';
        status?: string;
        method?: string;
        limit?: number;
        skip?: number;
    }) => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.method) params.append('method', filters.method);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.skip) params.append('skip', filters.skip.toString());

        const queryString = params.toString();
        const url = `/users/payment/history${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: PaymentHistoryResponse;
        }>(url, withProjectId());
        return response.data.data;
    },

    /** Create deposit record after on-chain Web3 deposit */
    createWeb3Deposit: async (data: {
        method: 'web3';
        amount: number;
        web3Details: {
            transactionHash: string;
            walletAddress: string;
            network: 'localhost' | 'testnet' | 'mainnet';
            chainId: number;
            status?: 'pending' | 'confirmed';
        };
    }) => {
        const response = await apiClient.post<{ success: boolean; message: string; data: unknown }>(
            '/users/payment/deposit',
            data,
            withProjectId()
        );
        return response.data.data;
    },
};

// ==================== 2FA APIs ====================
export const twoFactorApi = {
    setup: async () => {
        const response = await apiClient.post('/2fa/setup', {}, withProjectId());
        return response.data.data; // { qrCodeDataURL, secret }
    },
    verifySetup: async (token: string) => {
        const response = await apiClient.post('/2fa/verify-setup', { token }, withProjectId());
        return response.data;
    },
    verifyAction: async (token: string, action: string) => {
        const response = await apiClient.post('/2fa/verify', { token, action }, withProjectId());
        return response.data;
    },
    validateAction: async (action: string) => {
        const response = await apiClient.get<{
            success: boolean;
            data: { require2FA: boolean; verified: boolean; projectEnabled?: boolean };
        }>(`/2fa/validate?action=${action}`, withProjectId());
        return response.data.data;
    }
};


// ==================== WEB3 APIs ====================
export const web3Api = {
    /**
     * Get Project ABIs
     * Public endpoint (no authentication required for user tenant)
     * @param projectIdParam - Optional project ID, defaults to env variable
     */
    getProjectABIs: async (projectIdParam?: string): Promise<Web3ABIs> => {
        const pid = projectIdParam || projectId;
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: Web3ABIs;
        }>(`/admin/web3/abis/${pid}`);
        return response.data.data;
    },
};

// ==================== USER APIs ====================
export const userApi = {
    // Get project banners (public, no auth required)
    getBanners: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: Banner[];
        }>('/users/banners', withProjectId());
        return response.data.data;
    },

    // Get dashboard media (video/gif/image promo blocks)
    getDashboardMedia: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: DashboardMedia[];
        }>('/users/dashboard-media', withProjectId());
        return Array.isArray(response.data.data) ? response.data.data : [];
    },

    // Get user offers with eligibility status (authenticated)
    getOffers: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: Offer[];
        }>('/users/offers', withProjectId());
        return response.data.data;
    },

    // Get project dashboard popup(s)
    getProjectPopups: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ProjectPopup[];
        }>('/users/popups', withProjectId());
        return Array.isArray(response.data.data)
            ? response.data.data.map((popup) => adminPopupApi.normalizePopup(popup))
            : [];
    },

    // Get authenticated user's profile (uses token, no userId needed)
    getProfile: async () => {
        const response = await apiClient.get<{
            success: boolean;
            data: User & {
                name?: string;
                joinedAt?: string;
            }
        }>(
            '/users/profile',
            withProjectId()
        );
        // Map API response to User type (normalize name -> fullName, joinedAt -> joinDate)
        const profileData = response.data.data;
        return {
            ...profileData,
            fullName: profileData.name || profileData.fullName || '',
            joinDate: profileData.joinedAt || profileData.joinDate || '',
        } as User;
    },

    // Get profile by userId (for backward compatibility or admin use)
    getProfileById: async (userId: string) => {
        const response = await apiClient.get<{ success: boolean; data: User }>(
            `/users/${userId}`,
            withProjectId()
        );
        return response.data.data;
    },

    // Update authenticated user's profile (uses token, no userId needed)
    updateProfile: async (data: {
        name?: string;
        email?: string;
        phone?: string;
        walletAddress?: string;
    }) => {
        const response = await apiClient.patch<{
            success: boolean;
            data: User & {
                name?: string;
                joinedAt?: string;
            }
        }>(
            '/users/profile',
            data,
            withProjectId()
        );
        // Map API response to User type (normalize name -> fullName, joinedAt -> joinDate)
        const profileData = response.data.data;
        return {
            ...profileData,
            fullName: profileData.name || profileData.fullName || '',
            joinDate: profileData.joinedAt || profileData.joinDate || '',
        } as User;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}/users/profile/picture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                'x-project-id': projectId || '',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Profile picture upload failed' }));
            throw new Error(error.error || error.message || 'Profile picture upload failed');
        }

        const resData = await response.json();
        return resData?.data?.profilePicture || resData?.profilePicture || resData?.data?.url || resData?.url || '';
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            '/users/change-password',
            { currentPassword, newPassword },
            withProjectId()
        );
        return response.data;
    },

    getCommissions: async (
        userId: string,
        filters?: {
            ruleType?: 'binary' | 'level' | 'roi' | 'referral';
            status?: 'pending' | 'approved' | 'paid' | 'rejected';
            limit?: number;
            skip?: number;
        }
    ) => {
        const params = new URLSearchParams();
        if (filters?.ruleType) params.append('ruleType', filters.ruleType);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.skip) params.append('skip', filters.skip.toString());

        const queryString = params.toString();
        const url = `/users/${userId}/commissions${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<{
            success: boolean;
            data: {
                commissions: any[];
                pagination: {
                    total: number;
                    limit: number;
                    skip: number;
                    hasMore: boolean;
                };
            };
        }>(url, withProjectId());
        return response.data.data;
    },

    getIncomeStats: async (userId: string) => {
        const response = await apiClient.get<{
            success: boolean;
            data: {
                totalEarned: number;
                byType: Array<{
                    type: string;
                    amount: number;
                    count: number;
                }>;
            };
        }>(`/users/${userId}/income-stats`, withProjectId());
        return response.data.data;
    },

    // KYC Management
    uploadKYC: async (file: File, type: string) => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);

        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN);

        const headers: Record<string, string> = { 'X-Project-ID': projectId ?? '' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch(`${API_URL}/users/kyc/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.error || error.message || 'Upload failed');
        }

        const data = await response.json();
        return data.data;
    },

    getKYCStatus: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: {
                userId: string;
                email: string;
                kyc: {
                    verified: boolean;
                    documents: Array<{
                        documentId?: string;
                        _id?: string;
                        type: string;
                        url: string;
                        status: 'pending' | 'approved' | 'rejected';
                        rejectionReason?: string | null;
                        rejectionCount?: number;
                        rejectionHistory?: Array<{
                            reason: string;
                            rejectedBy: string;
                            rejectedAt: string;
                        }>;
                        uploadedAt: string;
                        reviewedAt?: string | null;
                    }>;
                };
            };
        }>('/users/kyc/status', withProjectId());
        return response.data.data;
    },

    // Update rejected KYC document
    updateKYCDocument: async (documentId: string, file: File) => {
        const formData = new FormData();
        formData.append('document', file);

        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN);

        const headers: Record<string, string> = { 'X-Project-ID': projectId ?? '' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const response = await fetch(`${API_URL}/users/kyc/${documentId}`, {
            method: 'PATCH',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Update failed' }));
            throw new Error(error.message || 'Update failed');
        }

        const data = await response.json();
        return data.data;
    },

    // Get capping tracking information
    getCappingTracking: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: CappingTrackingData;
        }>('/users/capping/tracking', withProjectId());
        return response.data.data;
    },

    /** Get all global wallets and balances for project */
    getGlobalWallets: async (): Promise<PoolBalance[]> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: PoolBalance[];
        }>('/users/global-wallets', withProjectId());
        return response.data.data ?? [];
    },

    /** Get user's pool eligibility status for all Smart Bazar pools */
    getMyPoolStatus: async (year?: number, month?: number) => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());
        const queryString = params.toString();
        const url = `/income/bloomx-pools/my-status${queryString ? `?${queryString}` : ''}`;
        
        const response = await apiClient.get<{
            success: boolean;
            data: {
                single_leg_pool: PoolStatusData;
                booster_pool: PoolStatusData;
                club_pool: PoolStatusData;
                salary_pool: PoolStatusData;
                leaderboard_pool: PoolStatusData;
                royalty_pool: PoolStatusData;
            };
        }>(url, withProjectId());
        return response.data.data;
    },

    /** Get current user's pool status (all pools + income received this month + eligibility status per pool) */
    getPoolStatus: async (): Promise<{
        year: number;
        month: number;
        pools: Array<{
            incomeTypeCode: string;
            label: string;
            scheduleSummary: string;
            receivedThisMonth: number;
            eligibilityStatus?: { isEligible: boolean; message: string; current?: number; required?: number; unit?: string };
        }>;
    }> => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: { year: number; month: number; pools: Array<{ incomeTypeCode: string; label: string; scheduleSummary: string; receivedThisMonth: number; eligibilityStatus?: { isEligible: boolean; message: string; current?: number; required?: number; unit?: string } }> };
        }>('/users/income/pool-status', withProjectId());
        return response.data.data ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1, pools: [] };
    },
};
