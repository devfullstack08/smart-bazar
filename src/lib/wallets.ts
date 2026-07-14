type WalletTypeCode = string;

type WalletBalance = {
    walletTypeCode?: WalletTypeCode;
    isDefault?: boolean;
    balance: number;
    availableBalance: number;
    lockedBalance?: number;
    totalDeposited?: number;
    totalWithdrawn?: number;
    totalEarned?: number;
};

type WalletRouting = {
    deposit?: WalletTypeCode;
    package_purchase?: WalletTypeCode;
    income?: WalletTypeCode;
    withdrawal?: WalletTypeCode;
    hasFundWallet?: boolean;
};

type WalletLookupState = {
    wallet?: WalletBalance;
    wallets?: WalletBalance[];
    walletRouting?: WalletRouting;
};

export const WALLET_TYPES = {
    MAIN: 'MAIN_WALLET',
    FUND: 'FUND_WALLET',
} as const;

export function normalizeWalletTypeCode(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
}

const WALLET_LABELS: Record<string, string> = {
    MAIN_WALLET: 'Main Wallet',
    FUND_WALLET: 'Fund Wallet',
    LOTTERY_WALLET: 'Lottery Wallet',
};

export function getWalletLabel(walletTypeCode?: WalletTypeCode): string {
    if (!walletTypeCode) return 'Wallet';
    return WALLET_LABELS[walletTypeCode] ?? walletTypeCode
        .toLowerCase()
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function getWalletByType(wallets: WalletBalance[] | undefined, walletTypeCode?: WalletTypeCode): WalletBalance | undefined {
    if (!walletTypeCode) return undefined;
    const normalized = normalizeWalletTypeCode(walletTypeCode);
    return wallets?.find((wallet) => normalizeWalletTypeCode(wallet.walletTypeCode) === normalized);
}

export function getDefaultWallet(state?: WalletLookupState | null): WalletBalance | undefined {
    return state?.wallets?.find((wallet) => wallet.isDefault) ?? state?.wallet;
}

export function getMainWallet(state?: WalletLookupState | null): WalletBalance | undefined {
    return getWalletByType(state?.wallets, WALLET_TYPES.MAIN) ?? getDefaultWallet(state);
}

export function getFundWallet(state?: WalletLookupState | null): WalletBalance | undefined {
    return getWalletByType(state?.wallets, state?.walletRouting?.deposit)
        ?? getWalletByType(state?.wallets, WALLET_TYPES.FUND);
}

export function getPurposeWallet(
    state: WalletLookupState | null | undefined,
    purpose: keyof WalletRouting
): WalletBalance | undefined {
    const walletTypeCode = state?.walletRouting?.[purpose];
    return getWalletByType(state?.wallets, typeof walletTypeCode === 'string' ? walletTypeCode : undefined)
        ?? getDefaultWallet(state);
}

export function hasFundWallet(state?: WalletLookupState | null): boolean {
    return state?.walletRouting?.hasFundWallet === true
        || !!getWalletByType(state?.wallets, WALLET_TYPES.FUND);
}
