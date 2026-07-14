// src/constants/storageKey.ts
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN: 'token',
    USER_KEY: 'user',
    WALLET_DISCONNECT_KEY: 'rcoin_wallet_disconnected',
    REMEMBER_ME_KEY: 'rememberedEmail',
    ADMIN_USER: 'admin_user',
    ADMIN_TOKEN: 'rcoin_admin_token',
    SLIPPAGE: 'rcoin_slippage',
    LAST_NETWORK: 'rcoin_last_network',
    // lottery
    LOTTERY_SHOP_GUIDE_TOUR: 'bloomx_has_seen_lottery_shop_tour',
    LOTTERY_ARENA_GUIDE_TOUR: 'bloomx_has_seen_lottery_arena_tour'
} as const;
