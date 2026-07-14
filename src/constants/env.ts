export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api/v1';
/** Same origin as API for Socket.IO (no /api/v1 path). */
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';
export const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? '';
export const NETWORK_ENV = process.env.NEXT_PUBLIC_NETWORK_ENV ?? 'testnet';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Smart Bazar';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? 'Pool-based earnings with dynamic capping, single-leg, club, salary, leaderboard & royalty rewards.';
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE ?? 'Pool-Based Earnings & Rewards';
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';