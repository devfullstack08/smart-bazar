import { defineChain } from 'viem';
import { IPaymentConfig, IWeb3Config } from '@/types/paymentConfig';
import { NATIVE_SYMBOLS } from '@/constants/networks';

/**
 * Create a viem chain config from API web3 config.
 * For localhost (chainId 31337), rpcUrl defaults to http://127.0.0.1:8545 when empty.
 */
export function getChainFromWeb3Config(web3: IWeb3Config | null | undefined) {
    if (!web3?.chainId) return null;
    const rpcUrl = (web3.rpcUrl && web3.rpcUrl.trim()) || (web3.chainId === 31337 ? 'http://127.0.0.1:8545' : '');
    if (!rpcUrl) return null;
    const nativeSymbol = getNativeSymbol(web3.chainId);
    const nativeName = nativeSymbol === 'BNB' ? 'BNB' : nativeSymbol === 'ETH' ? 'Ethereum' : nativeSymbol;
    return defineChain({
        id: web3.chainId,
        name: web3.network ? `${web3.network}` : `Chain ${web3.chainId}`,
        nativeCurrency: {
            decimals: 18,
            name: nativeName,
            symbol: nativeSymbol,
        },
        rpcUrls: {
            default: {
                http: [rpcUrl],
            },
        },
        blockExplorers: web3.blockExplorerUrl
            ? {
                default: {
                    name: 'Explorer',
                    url: web3.blockExplorerUrl,
                },
            }
            : undefined,
    });
}

/**
 * Get contract ABI from payment methods web3.abis (keyed by contract address only).
 */
export function getContractAbiFromConfig(
    web3: IWeb3Config | null | undefined,
    contractAddress: string
): any[] | null {
    if (!web3?.abis || !contractAddress) return null;
    const key = contractAddress.trim().toLowerCase();
    const abi = web3.abis[key];
    return Array.isArray(abi) && abi.length > 0 ? abi : null;
}

/**
 * Get ERC20 ABI from payment methods web3.erc20Abi.
 */
export function getErc20AbiFromConfig(web3: IWeb3Config | null | undefined): any[] | null {
    if (!web3?.erc20Abi || !Array.isArray(web3.erc20Abi) || web3.erc20Abi.length === 0) {
        return null;
    }
    return web3.erc20Abi;
}

/**
 * Native currency symbol by chainId (for display only).
 * localhost = ETH, BSC = BNB, Ethereum = ETH, etc.
 */
export function getNativeSymbol(chainId: number | undefined | null): string {
    if (chainId == null) return 'ETH';
    return NATIVE_SYMBOLS[chainId] ?? 'ETH';
}

/**
 * Check if Web3 config has everything needed for contract deposit/withdraw.
 */
export function isWeb3ConfigComplete(web3: IWeb3Config | null | undefined): boolean {
    if (!web3) return false;
    const hasAddresses = !!(web3.contractAddress && web3.tokenAddress);
    // chainId required; rpcUrl optional for localhost (31337) so UI can use default
    const hasChain = !!(web3.chainId && (web3.rpcUrl || web3.chainId === 31337));
    const contractAbi = getContractAbiFromConfig(web3, web3.contractAddress || '');
    const erc20Abi = getErc20AbiFromConfig(web3);
    const hasAbis = !!(contractAbi && contractAbi.length > 0 && erc20Abi && erc20Abi.length > 0);
    return hasAddresses && hasChain && hasAbis;
}

export function getEffectiveWeb3Config(
    paymentMethods: IPaymentConfig | null | undefined,
    mode: 'deposit' | 'withdrawal'
): IWeb3Config | null {
    const web3 = paymentMethods?.web3;
    if (!web3) return null;
    const details = mode === 'deposit'
        ? paymentMethods?.deposit?.web3?.details
        : paymentMethods?.withdrawal?.web3?.details;
    const contractAddress = details?.contractAddress?.trim() || web3.contractAddress;
    const tokenAddress = details?.tokenAddress?.trim() || web3.tokenAddress;
    return {
        ...web3,
        contractAddress,
        tokenAddress,
    };
}

/**
 * Check if EOA deposit is available (depositAddress configured).
 */
export function isWeb3EOADepositReady(
    depositWeb3: { enabled?: boolean; details?: { address?: string } } | null | undefined,
    web3Config: IWeb3Config | null | undefined
): boolean {
    if (!depositWeb3?.enabled || !web3Config?.chainId || !web3Config?.tokenAddress) return false;
    const depositAddress = depositWeb3.details?.address;
    return !!(depositAddress && depositAddress.length >= 40);
}

/**
 * Check if contract deposit is available (contractAddress + tokenAddress).
 */
export function isWeb3ContractDepositReady(
    depositWeb3: { enabled?: boolean; details?: { contractAddress?: string; tokenAddress?: string } } | null | undefined,
    web3Config: IWeb3Config | null | undefined
): boolean {
    if (!depositWeb3?.enabled) return false;
    const contractAddress = depositWeb3.details?.contractAddress ?? web3Config?.contractAddress;
    const tokenAddress = depositWeb3.details?.tokenAddress ?? web3Config?.tokenAddress;
    return !!(contractAddress && tokenAddress);
}
