'use client';

import '@/lib/wagmi/patch-node-localstorage';
import type { Chain } from 'viem';
import { createConfig, createStorage, http, injected, noopStorage } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { APP_DESCRIPTION, APP_NAME, APP_URL, NETWORK_ENV, WALLET_CONNECT_PROJECT_ID } from '@/constants/env';
import { localhost, getNetworkConfig } from '@/constants/networks';
import { walletConnect } from 'wagmi/connectors';

type SmartBazarWagmiConfig = ReturnType<typeof createConfig>;
type SmartBazarWalletConnectConnector = ReturnType<typeof walletConnect>;

declare global {
  // Keep WalletConnect stable across Next.js route reloads/HMR. Creating it
  // repeatedly logs "WalletConnect Core is already initialized" and can break sessions.
  var __bloomoraWagmiConfig: SmartBazarWagmiConfig | undefined;
  var __bloomoraWalletConnectConnector: SmartBazarWalletConnectConnector | undefined;
}

const networkEnv = NETWORK_ENV;
const networkConfig = getNetworkConfig();

// Build chains array based on environment
const chains: Chain[] = [];
const transports: Record<number, ReturnType<typeof http>> = {};

if (networkEnv === 'localhost') {
  chains.push(localhost);
  transports[localhost.id] = http('http://127.0.0.1:8545');
}

// Always include BSC Testnet and Mainnet for flexibility
chains.push(bscTestnet, bsc);
transports[bscTestnet.id] = http();
transports[bsc.id] = http();

// Determine default chain based on environment
const getDefaultChain = () => {
  switch (networkEnv) {
    case 'localhost':
      return localhost;
    case 'testnet':
      return bscTestnet;
    case 'mainnet':
      return bsc;
    default:
      return bscTestnet;
  }
};

// Get default chain based on environment
const defaultChain = getDefaultChain();

/** Avoid real localStorage during SSR/SSG and when Node exposes a broken experimental localStorage. */
function createSafeWagmiStorage() {
  if (typeof window === 'undefined') {
    return createStorage({ storage: noopStorage });
  }
  try {
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== 'function') {
      return createStorage({ storage: noopStorage });
    }
    return createStorage({ storage: ls });
  } catch {
    return createStorage({ storage: noopStorage });
  }
}

function getWalletConnectConnector() {
  if (!globalThis.__bloomoraWalletConnectConnector) {
    globalThis.__bloomoraWalletConnectConnector = walletConnect({
      projectId: WALLET_CONNECT_PROJECT_ID,
      metadata: {
        name: APP_NAME,
        description: APP_DESCRIPTION,
        url: APP_URL,
        icons: ["https://yourdomain.com/logo.png"]
      }
    });
  }

  return globalThis.__bloomoraWalletConnectConnector;
}

function createSmartBazarWagmiConfig() {
  const configuredChains = chains as [Chain, ...Chain[]];

  return createConfig({
    chains: configuredChains,
    connectors: [
      injected(),
      getWalletConnectConnector(),
    ],
    transports,
    storage: createSafeWagmiStorage(),
    ssr: true,
  });
}

export const wagmiConfig = globalThis.__bloomoraWagmiConfig ??= createSmartBazarWagmiConfig();
