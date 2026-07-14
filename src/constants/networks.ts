import { defineChain } from 'viem';
import { NETWORK_ENV } from './env';

// Localhost/Hardhat Network
export const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

// Network Environment Configuration
export type NetworkEnvironment = 'localhost' | 'testnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer?: string;
  isTestnet: boolean;
}

export const getNetworkConfig = (): NetworkConfig => {
  const env = NETWORK_ENV as NetworkEnvironment;

  switch (env) {
    case 'localhost':
      return {
        name: 'Localhost',
        chainId: 31337,
        rpcUrl: 'http://127.0.0.1:8545',
        blockExplorer: undefined,
        isTestnet: true,
      };
    case 'testnet':
      return {
        name: 'BSC Testnet',
        chainId: 97,
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        blockExplorer: 'https://testnet.bscscan.com',
        isTestnet: true,
      };
    case 'mainnet':
      return {
        name: 'BSC Mainnet',
        chainId: 56,
        rpcUrl: 'https://bsc-dataseed.binance.org',
        blockExplorer: 'https://bscscan.com',
        isTestnet: false,
      };
    default:
      return {
        name: 'BSC Testnet',
        chainId: 97,
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        blockExplorer: 'https://testnet.bscscan.com',
        isTestnet: true,
      };
  }
};

export const getCurrentNetworkEnv = (): NetworkEnvironment => {
  return NETWORK_ENV as NetworkEnvironment;
};

/** Public RPC fallback URLs per chain ID (used when API does not provide rpcUrl) */
export const FALLBACK_RPC: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  5: 'https://rpc.ankr.com/eth_goerli',
  56: 'https://bsc-dataseed.binance.org',
  97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  11155111: 'https://rpc.ankr.com/eth_sepolia',
  31337: 'http://127.0.0.1:8545',
};

/** Native currency symbol per chain ID */
export const NATIVE_SYMBOLS: Record<number, string> = {
  1: 'ETH',
  5: 'ETH',
  11155111: 'ETH',
  31337: 'ETH',
  56: 'BNB',
  97: 'BNB',
};
