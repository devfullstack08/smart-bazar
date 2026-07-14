'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount, usePublicClient, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { formatEther, parseEther, maxUint256, type Address, createWalletClient, custom, createPublicClient, http } from 'viem';
import toast from 'react-hot-toast';
import { paymentApi, userApi, walletApi } from '@/lib/api/services';
import { IPaymentConfig } from '@/types/paymentConfig';
import type { WalletState } from '@/types';
import { TokenFaucet } from './TokenFaucet';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useAppSelector } from '@/lib/store/hooks';
import { getChainFromWeb3Config, getContractAbiFromConfig, getEffectiveWeb3Config, getErc20AbiFromConfig, getNativeSymbol, isWeb3ConfigComplete } from '@/lib/utils/web3Helpers';
import { getPurposeWallet, getWalletLabel } from '@/lib/wallets';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { WithdrawalAllowanceHelpDialog } from './withdrawal/WithdrawalAllowanceHelpDialog';

type Mode = 'deposit' | 'withdraw';
type AllowanceDisplayStatus = 'synced' | 'needs_refresh' | 'unavailable';

const allowanceBadgeClass: Record<AllowanceDisplayStatus, string> = {
    synced: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    needs_refresh: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    unavailable: 'border-white/10 bg-white/5 text-text-muted',
};

const allowanceBadgeLabel: Record<AllowanceDisplayStatus, string> = {
    synced: 'Synced',
    needs_refresh: 'Needs refresh',
    unavailable: 'Unavailable',
};

function formatRelativeTime(value?: string | null): string {
    if (!value) return 'Never';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} day ago`;
}

interface WalletWeb3CryptoProps {
    mode: Mode;
    paymentMethods: IPaymentConfig;
    availableBalance: number;
    onSuccess?: () => void;
    onClose?: () => void;
}

export function WalletWeb3Crypto({
    mode,
    paymentMethods,
    availableBalance,
    onSuccess,
    onClose,
}: WalletWeb3CryptoProps) {
    const web3Config = useMemo(
        () => getEffectiveWeb3Config(paymentMethods, mode === 'deposit' ? 'deposit' : 'withdrawal') ?? paymentMethods.web3,
        [paymentMethods, mode]
    );
    const chainConfig = useMemo(() => getChainFromWeb3Config(web3Config), [web3Config]);
    const contractAbi = useMemo(
        () => (web3Config?.contractAddress ? getContractAbiFromConfig(web3Config, web3Config.contractAddress) : null),
        [web3Config]
    );
    const erc20Abi = useMemo(() => getErc20AbiFromConfig(web3Config), [web3Config]);
    const configComplete = isWeb3ConfigComplete(web3Config);

    const { address, isConnected, connector } = useAccount();
    const reduxPrimaryWallet = useAppSelector((state) => state.auth.user?.walletAddress?.trim());
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    // Get wallet client - supports both MetaMask (window.ethereum) and WalletConnect
    const getWalletClient = async () => {
        if (typeof window === 'undefined' || !address) {
            return null;
        }

        const expectedChainId = web3Config?.chainId;
        if (!expectedChainId) {
            console.warn('getWalletClient: web3Config.chainId not available');
            return null;
        }

        // 1. Try wagmi's walletClient FIRST - works for both MetaMask and WalletConnect (mobile)
        // WalletConnect does NOT inject window.ethereum, so we must not require it here
        if (walletClient && walletClient.chain?.id === expectedChainId) {
            return walletClient;
        }

        // 1.5. Try to get provider directly from the active connector (Best for WalletConnect)
        if (connector) {
            try {
                const provider = await connector.getProvider({ chainId: expectedChainId }).catch(() => null) 
                              || await connector.getProvider().catch(() => null);
                if (provider) {
                    const client = createWalletClient({
                        chain: chainConfig || undefined,
                        transport: custom(provider as any),
                        account: address as Address,
                    });
                    return client;
                }
            } catch (error) {
                console.error('Error getting provider from connector:', error);
            }
        }

        // 2. If we have window.ethereum (MetaMask/external wallet), create client with API chain config
        const chain = chainConfig;
        const hasEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;
        if (chain && hasEthereum) {
            try {
                const client = createWalletClient({
                    chain,
                    transport: custom((window as any).ethereum),
                    account: address as Address,
                });
                return client;
            } catch (error) {
                console.error('Error creating wallet client from ethereum provider:', error);
                // Fall through to other options
            }
        }

        // 3. Use wagmi's walletClient even if on wrong chain - validateNetwork will have prompted switch
        // Some wallets (e.g. WalletConnect) may lag in updating chain; tx will fail if wrong chain
        if (walletClient) {
            return walletClient;
        }

        // 4. Fallback: use publicClient chain or API chainConfig (no window.ethereum = WalletConnect only)
        const pubChain = publicClient?.chain;
        const chainToUse = (pubChain?.id === expectedChainId) ? pubChain : chain ?? pubChain;
        if (chainToUse && hasEthereum) {
            try {
                const client = createWalletClient({
                    chain: chainToUse,
                    transport: custom((window as any).ethereum),
                    account: address as Address,
                });
                return client;
            } catch (error) {
                console.error('Error creating fallback wallet client:', error);
            }
        }

        return null;
    };

    const [amount, setAmount] = useState('');
    const [walletTokenBalance, setWalletTokenBalance] = useState('0');
    const [walletEthBalance, setWalletEthBalance] = useState('0');
    const [tokenSymbol, setTokenSymbol] = useState<string>('Token');
    const [onChainWithdrawable, setOnChainWithdrawable] = useState<string>('0');
    /** When contractType is bloomx: user's balance of the custom token (e.g. BLMX) */
    const [customTokenBalance, setCustomTokenBalance] = useState<string>('0');
    const [allowance, setAllowance] = useState('0');
    const [isUnlimitedAllowance, setIsUnlimitedAllowance] = useState(false);
    const [loadingBalances, setLoadingBalances] = useState(false);
    const [approving, setApproving] = useState(false);
    const [depositing, setDepositing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [refreshingAllowance, setRefreshingAllowance] = useState(false);
    const [allowanceCooldownUntil, setAllowanceCooldownUntil] = useState(0);
    const [allowanceCooldownSeconds, setAllowanceCooldownSeconds] = useState(0);
    const [allowanceRefreshStatus, setAllowanceRefreshStatus] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);
    const [walletState, setWalletState] = useState<WalletState | null>(null);
    const [allowanceStatus, setAllowanceStatus] = useState<{
        status: AllowanceDisplayStatus;
        lastRefreshedAt: string | null;
    } | null>(null);
    const [showAllowanceHelp, setShowAllowanceHelp] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [lastWithdrawalTxHash, setLastWithdrawalTxHash] = useState<string | null>(null);
    const [lastWithdrawalBackendStatus, setLastWithdrawalBackendStatus] = useState<string | null>(null);
    // Pending withdrawal lock — prevents double-submission when user refreshes mid-transaction
    const [pendingTx, setPendingTx] = useState<{ txHash: string; amount: number; walletAddress?: string; submittedAt: number } | null>(null);
    const [profileWallet, setProfileWallet] = useState<string | undefined | 'pending'>('pending');

    const web3DepositConfig = paymentMethods?.deposit?.web3;
    const web3WithdrawalConfig = paymentMethods?.withdrawal?.web3;
    const contractAddress = (web3Config?.contractAddress ?? '') as Address;
    const tokenAddress = (web3Config?.tokenAddress ?? '') as Address;
    const network = web3Config?.network;
    const nativeSymbol = getNativeSymbol(web3Config?.chainId);
    const primaryWallet =
        (profileWallet !== 'pending' ? profileWallet ?? reduxPrimaryWallet : reduxPrimaryWallet) || undefined;
    const normalizeWallet = (value?: string | null) => String(value || '').trim().toLowerCase();
    const connectedWalletMatchesPrimary =
        !!address && !!primaryWallet && normalizeWallet(address) === normalizeWallet(primaryWallet);
    const minWithdraw = web3WithdrawalConfig?.minAmount ?? 0;
    // maxAmount of 0 means unlimited, so we use a very large number or check for 0 explicitly
    const maxWithdraw = web3WithdrawalConfig?.maxAmount && web3WithdrawalConfig.maxAmount > 0
        ? web3WithdrawalConfig.maxAmount
        : 0; // 0 means unlimited
    const withdrawalWallet = getPurposeWallet(walletState, 'withdrawal');
    const withdrawalWalletName = getWalletLabel(withdrawalWallet?.walletTypeCode);
    const withdrawalWalletBalance = withdrawalWallet?.availableBalance ?? availableBalance;
    const allowanceDisplayStatus: AllowanceDisplayStatus = allowanceStatus?.status ?? 'unavailable';

    const getExplorerTxUrl = (txHash: string) => {
        const base = web3Config.blockExplorerUrl;
        if (!base) return null;
        return `${String(base).replace(/\/+$/, '')}/tx/${txHash}`;
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Copied');
        } catch {
            toast.error('Failed to copy');
        }
    };

    useEffect(() => {
        let cancelled = false;
        userApi
            .getProfile()
            .then((profile) => {
                if (!cancelled) setProfileWallet(profile?.walletAddress?.trim() || undefined);
            })
            .catch(() => {
                if (!cancelled) setProfileWallet(undefined);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const pollSelfWithdrawalStatus = async (txHash: string) => {
        // Poll payment history for this tx hash until backend marks confirmed/failed
        for (let i = 0; i < 20; i++) {
            try {
                const history = await paymentApi.getPaymentHistory({
                    type: 'withdrawal',
                    limit: 50,
                    skip: 0,
                });
                const match = history.requests.find((r) => (r as any).transactionHash?.toLowerCase?.() === txHash.toLowerCase());
                if (match?.status) {
                    setLastWithdrawalBackendStatus(match.status);
                    if (match.status === 'confirmed') {
                        toast.success('Withdrawal confirmed by backend. Wallet updated.');
                        onSuccess?.();
                        onClose?.();
                        return;
                    }
                    if (match.status === 'failed') {
                        toast.error('Withdrawal failed verification on backend.');
                        return;
                    }
                }
            } catch {
                // ignore transient errors
            }
            await new Promise((r) => setTimeout(r, 3000));
        }
    };

    const loadBalances = async () => {
        if (!address || !contractAbi || !erc20Abi) {
            return;
        }

        // Create a custom publicClient that explicitly uses the localhost RPC URL
        // This ensures we're querying the correct network, not MetaMask's provider
        const expectedRpcUrl = web3Config.rpcUrl;
        const expectedChainId = web3Config.chainId;

        // Use custom publicClient with API RPC to ensure correct network
        const customPublicClient = chainConfig
            ? createPublicClient({
                chain: chainConfig,
                transport: http(web3Config.rpcUrl),
            })
            : publicClient;

        if (!customPublicClient) {
            console.warn('Cannot load balances: publicClient not available');
            return;
        }

        console.log('Loading balances:', {
            address,
            tokenAddress,
            contractAddress,
            expectedRpcUrl,
            expectedChainId,
            usingCustomClient: expectedChainId === 31337,
            publicClientChain: customPublicClient.chain?.id,
        });

        setLoadingBalances(true);
        try {
            // 🔥 Network Mismatch Detection (VERY IMPORTANT)
            // Check if user is on the correct network before checking contracts
            const expectedChainId = web3Config.chainId;

            // Get current chain ID directly from MetaMask (more reliable than wagmi's chainId)
            let currentChainId = chainId;
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
                    currentChainId = parseInt(chainIdHex, 16);
                } catch {
                    // Fallback to wagmi's chainId
                }
            }

            console.log("expectedChainId", expectedChainId, "currentChainId", currentChainId);

            if (expectedChainId && currentChainId !== expectedChainId) {
                const networkNames: Record<number, string> = {
                    31337: 'Localhost',
                    97: 'BSC Testnet',
                    56: 'BSC Mainnet',
                    1: 'Ethereum Mainnet',
                    11155111: 'Ethereum Sepolia',
                    5: 'Ethereum Goerli',
                };

                const currentNetworkName = networkNames[currentChainId] || `Chain ID ${currentChainId}`;
                const expectedNetworkName = networkNames[expectedChainId] || `Chain ID ${expectedChainId}`;

                toast.error(
                    `Network mismatch detected! You are on ${currentNetworkName}, but the app expects ${expectedNetworkName}. ` +
                    `Please switch your wallet to ${expectedNetworkName} (Chain ID: ${expectedChainId}).`,
                    { duration: 8000 }
                );
                setLoadingBalances(false);
                return;
            }


            console.log("tokenAddress", tokenAddress);

            // Check if contracts exist at the addresses
            // Use customPublicClient to ensure we're querying localhost RPC
            const [tokenCode, contractCode] = await Promise.all([
                customPublicClient.getBytecode({ address: tokenAddress }).catch((err) => {
                    console.error('Error getting token bytecode:', err);
                    return null;
                }),
                customPublicClient.getBytecode({ address: contractAddress }).catch((err) => {
                    console.error('Error getting contract bytecode:', err);
                    return null;
                }),
            ]);

            console.log("tokenCode", tokenCode, "contractCode", contractCode);
            if (!tokenCode || tokenCode === '0x') {
                const networkNames: Record<number, string> = {
                    31337: 'Localhost',
                    97: 'BSC Testnet',
                    56: 'BSC Mainnet',
                };
                const networkName = networkNames[expectedChainId] || `Chain ${expectedChainId}`;
                toast.error(
                    `Token contract not found at the specified address. ` +
                    `Please check: 1) You're on the correct network (${networkName}, Chain ID: ${expectedChainId}), ` +
                    `2) The token contract is deployed at ${tokenAddress}, 3) Your Hardhat node is running on ${web3Config.rpcUrl}.`,
                    { duration: 10000 }
                );
                console.error('Token contract bytecode:', tokenCode);
                console.error('Token address:', tokenAddress);
                console.error('Current network chainId:', currentChainId);
                setLoadingBalances(false);
                return;
            }

            if (!contractCode || contractCode === '0x') {
                const networkNames: Record<number, string> = {
                    31337: 'Localhost',
                    97: 'BSC Testnet',
                    56: 'BSC Mainnet',
                };
                const networkName = networkNames[expectedChainId] || `Chain ${expectedChainId}`;
                toast.error(
                    `Deposit contract not found at the specified address. ` +
                    `Please check: 1) You're on the correct network (${networkName}, Chain ID: ${expectedChainId}), ` +
                    `2) The contract is deployed at ${contractAddress}, 3) Your Hardhat node is running on ${web3Config.rpcUrl}.`,
                    { duration: 10000 }
                );
                console.error('Deposit contract bytecode:', contractCode);
                console.error('Contract address:', contractAddress);
                console.error('Current network chainId:', currentChainId);
                setLoadingBalances(false);
                return;
            }

            // Get ETH balance first - use customPublicClient
            const ethBalance = await customPublicClient.getBalance({ address }).catch((err) => {
                console.error('Error reading ETH balance:', err);
                console.error('Address:', address);
                console.error('PublicClient chain:', customPublicClient.chain);
                console.error('Expected RPC:', web3Config.rpcUrl);
                return BigInt(0);
            });
            console.log(`${nativeSymbol} Balance (wei):`, ethBalance.toString());
            setWalletEthBalance(formatEther(ethBalance));

            const [wb, dep, all, sym] = await Promise.all([
                customPublicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi!,
                    functionName: 'balanceOf',
                    args: [address],
                }).catch((err: any) => {
                    // Check if it's a contract not found error
                    if (err?.message?.includes('returned no data') || err?.message?.includes('0x')) {
                        console.error('Token contract not found or invalid at address:', tokenAddress);
                        // Don't show error here - network validation already handled it
                    } else {
                        console.error('Error reading token balance:', err);
                    }
                    return BigInt(0) as bigint;
                }),
                customPublicClient.readContract({
                    address: contractAddress,
                    abi: contractAbi!,
                    // Withdrawable = deposit + earnings (per contract)
                    functionName: 'getUserWithdrawable',
                    args: [address],
                }).catch((err: any) => {
                    // Check if it's a contract not found error
                    if (err?.message?.includes('returned no data') || err?.message?.includes('0x')) {
                        console.error('Deposit contract not found or invalid at address:', contractAddress);
                    } else {
                        console.error('Error reading withdrawable balance:', err);
                    }
                    return BigInt(0) as bigint;
                }),
                customPublicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi!,
                    functionName: 'allowance',
                    args: [address, contractAddress],
                }).catch((err: any) => {
                    // Check if it's a contract not found error
                    if (err?.message?.includes('returned no data') || err?.message?.includes('0x')) {
                        console.error('Token contract not found or invalid at address:', tokenAddress);
                    } else {
                        console.error('Error reading allowance:', err);
                    }
                    return BigInt(0) as bigint;
                }),
                customPublicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi!,
                    functionName: 'symbol',
                    args: [],
                }).catch(() => null) as Promise<string | null>,
            ]);

            const unlimited = await customPublicClient.readContract({
                address: contractAddress,
                abi: contractAbi!,
                functionName: 'hasUnlimitedAllowance',
                args: [address],
            }).catch((err) => {
                console.error('Error reading unlimited allowance:', err);
                return false;
            });

            console.log("wb", wb);

            const wbValue = (wb as bigint) || BigInt(0);
            const depValue = (dep as bigint) || BigInt(0);
            const allValue = (all as bigint) || BigInt(0);

            setWalletTokenBalance(formatEther(wbValue));
            setOnChainWithdrawable(formatEther(depValue));
            setAllowance(formatEther(allValue));
            setIsUnlimitedAllowance(Boolean(unlimited));
            if (sym != null) {
                const s = typeof sym === 'string' ? sym : (typeof (sym as any)?.toString === 'function' ? (sym as any).toString() : 'Token');
                setTokenSymbol(s.length > 0 ? s : 'Token');
            }

            // Dual-token (e.g. Smart Bazar): fetch custom token balance when configured
            const customAddr = web3Config?.details?.customTokenAddress;
            if (web3Config?.contractType === 'bloomx' && customAddr && erc20Abi) {
                const customBal = await customPublicClient.readContract({
                    address: customAddr as Address,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [address],
                }).catch(() => BigInt(0));
                setCustomTokenBalance(formatEther((customBal as bigint) || BigInt(0)));
            } else {
                setCustomTokenBalance('0');
            }

            console.log('Token Balance:', formatEther(wbValue));
            console.log('Native Balance:', formatEther(ethBalance));
            console.log('Withdrawable Balance:', formatEther(depValue));
        } catch (e: any) {
            console.error('Error loading balances:', e);
            const errorMessage = e?.message || 'Failed to load balances';

            // Provide more specific error messages
            if (errorMessage.includes('contract') || errorMessage.includes('0x')) {
                toast.error('Contract not found. Please ensure you are connected to the correct network.');
            } else if (errorMessage.includes('network') || errorMessage.includes('chain')) {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error(`Failed to load balances: ${errorMessage}`);
            }
        } finally {
            setLoadingBalances(false);
        }
    };

    useEffect(() => {
        if (isConnected && address && contractAddress && tokenAddress) {
            // Check network and switch if needed before loading balances
            const expectedChainId = web3Config.chainId;

            // Get current chain ID directly from MetaMask for more reliable check
            const checkAndSwitchNetwork = async () => {
                if (!expectedChainId) {
                    loadBalances();
                    return;
                }

                let currentChainId = chainId;
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                    try {
                        const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
                        currentChainId = parseInt(chainIdHex, 16);
                    } catch {
                        // Fallback to wagmi's chainId
                    }
                }

                if (currentChainId !== expectedChainId) {
                    // Network mismatch - try to switch first
                    const switched = await switchToCorrectNetwork(expectedChainId);
                    if (switched) {
                        // Wait a bit for chainId to update, then load balances
                        setTimeout(() => {
                            loadBalances();
                        }, 1000);
                    } else {
                        // Still try to load balances even if switch failed (might show errors)
                        loadBalances();
                    }
                } else {
                    loadBalances();
                }
            };

            checkAndSwitchNetwork();
        }
    }, [isConnected, address, contractAddress, tokenAddress, publicClient, chainId]);

    useEffect(() => {
        if (mode !== 'withdraw') return;
        walletApi.getWalletState()
            .then(setWalletState)
            .catch(() => null);
        walletApi.getWithdrawalAllowanceStatus()
            .then((status) => setAllowanceStatus({
                status: status.status,
                lastRefreshedAt: status.lastRefreshedAt,
            }))
            .catch(() => setAllowanceStatus(null));
    }, [mode]);

    useEffect(() => {
        if (mode !== 'withdraw' || allowanceCooldownUntil <= 0) {
            setAllowanceCooldownSeconds(0);
            return;
        }

        const updateCooldown = () => {
            const seconds = Math.max(0, Math.ceil((allowanceCooldownUntil - Date.now()) / 1000));
            setAllowanceCooldownSeconds(seconds);
            if (seconds <= 0) setAllowanceCooldownUntil(0);
        };

        updateCooldown();
        const interval = window.setInterval(updateCooldown, 1000);
        return () => window.clearInterval(interval);
    }, [mode, allowanceCooldownUntil]);

    // On mount / address change: restore any pending withdrawal lock from previous session
    useEffect(() => {
        if (!address || typeof window === 'undefined') return;
        const key = `mlm_wd_pending_${address}`;
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
            const p = JSON.parse(raw) as { txHash: string; amount: number; walletAddress?: string; submittedAt: number };
            if (Date.now() - p.submittedAt < 30 * 60 * 1000) {
                setPendingTx(p);
            } else {
                localStorage.removeItem(key);
            }
        } catch {
            localStorage.removeItem(key);
        }
    }, [address]);

    useEffect(() => {
        if (!address || typeof window === 'undefined' || profileWallet === 'pending' || !pendingTx) return;
        if (!primaryWallet || !connectedWalletMatchesPrimary) {
            localStorage.removeItem(`mlm_wd_pending_${address}`);
            setPendingTx(null);
        }
    }, [address, connectedWalletMatchesPrimary, pendingTx, primaryWallet, profileWallet]);

    const addNetworkToMetaMask = async (chainId: number, rpcUrl: string, networkName: string) => {
        if (typeof window === 'undefined' || !(window as any).ethereum) return false;
        const nativeSym = getNativeSymbol(chainId);
        const nativeName = nativeSym === 'BNB' ? 'BNB' : nativeSym === 'ETH' ? 'Ethereum' : nativeSym;
        try {
            await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${chainId.toString(16)}`,
                    chainName: networkName,
                    nativeCurrency: {
                        name: nativeName,
                        symbol: nativeSym,
                        decimals: 18,
                    },
                    rpcUrls: [rpcUrl],
                }],
            });
            return true;
        } catch (error: any) {
            // Network might already be added, or user rejected
            if (error.code === 4902) {
                // Chain not added, but we tried
                return false;
            }
            return false;
        }
    };

    // Helper function to switch to the correct network
    const switchToCorrectNetwork = async (expectedChainId: number) => {
        if (!expectedChainId) return true;

        if (typeof window === 'undefined' || !(window as any).ethereum) {
            return false;
        }

        try {
            // Get current chain ID from MetaMask directly (most reliable)
            let currentChainId: number;
            try {
                const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
                currentChainId = parseInt(chainIdHex, 16);
            } catch {
                // Fallback to wagmi's chainId
                currentChainId = chainId;
            }

            // Check if we're already on the correct network
            if (currentChainId === expectedChainId) {
                return true;
            }

            console.log(`Switching from Chain ID ${currentChainId} to ${expectedChainId}`);

            // Try direct MetaMask switch first (most reliable)
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
                });
                // Wait for the switch to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Network switched successfully via MetaMask API');
                return true;
            } catch (directError: any) {
                // If chain not found (4902), try to add it first
                if (directError.code === 4902) {
                    console.log('Chain not found, adding it to MetaMask...');
                    const networkNames: Record<number, string> = {
                        31337: 'Localhost',
                        97: 'BSC Testnet',
                        56: 'BSC Mainnet',
                    };

                    const networkName = networkNames[expectedChainId] || `Chain ${expectedChainId}`;
                    const rpcUrl = web3Config.rpcUrl;

                    toast.loading(`Adding ${networkName} to MetaMask...`, { id: 'add-network' });
                    const added = await addNetworkToMetaMask(expectedChainId, rpcUrl, networkName);

                    if (added) {
                        toast.dismiss('add-network');
                        // Try switching again after adding
                        try {
                            await (window as any).ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
                            });
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            toast.success('Network switched successfully');
                            console.log('Network switched successfully after adding');
                            return true;
                        } catch (retryError: any) {
                            console.error('Failed to switch after adding:', retryError);
                            toast.error(`Please switch to ${networkName} manually in MetaMask.`, { id: 'add-network' });
                            return false;
                        }
                    } else {
                        toast.error(`Please add ${networkName} (Chain ID: ${expectedChainId}) to MetaMask manually.`, { id: 'add-network' });
                        return false;
                    }
                } else if (directError.code === 4001) {
                    console.log('Network switch rejected by user');
                    toast.error('Network switch rejected by user');
                    return false;
                } else {
                    // Try wagmi's switchChain as fallback
                    console.log('Direct switch failed, trying wagmi switchChain...', directError);
                    try {
                        await switchChain({ chainId: expectedChainId });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        toast.success('Network switched successfully');
                        console.log('Network switched successfully via wagmi');
                        return true;
                    } catch (wagmiError: any) {
                        console.error('Wagmi switch also failed:', wagmiError);
                        toast.error(`Failed to switch network: ${directError.message || wagmiError.message || 'Unknown error'}`);
                        return false;
                    }
                }
            }
        } catch (error: any) {
            console.error('Error switching network:', error);
            toast.error('Failed to switch network');
            return false;
        }
    };

    // Helper function to validate network
    const validateNetwork = async (): Promise<boolean> => {
        const expectedChainId = web3Config.chainId;
        if (!expectedChainId) return true; // Skip validation if chainId not configured

        // Get current chain ID directly from MetaMask (more reliable than wagmi's chainId)
        let currentChainId = chainId;
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
                currentChainId = parseInt(chainIdHex, 16);
                console.log('validateNetwork - MetaMask chainId:', currentChainId, 'wagmi chainId:', chainId, 'expected:', expectedChainId);
            } catch (error) {
                console.error('Error getting chainId from MetaMask:', error);
                // Fallback to wagmi's chainId
            }
        } else {
            console.log('validateNetwork - No window.ethereum, using wagmi chainId:', chainId, 'expected:', expectedChainId);
        }

        if (currentChainId !== expectedChainId) {
            console.warn('Network mismatch in validateNetwork:', { currentChainId, expectedChainId, wagmiChainId: chainId });
            const networkNames: Record<number, string> = {
                31337: 'Localhost',
                97: 'BSC Testnet',
                56: 'BSC Mainnet',
                1: 'Ethereum Mainnet',
                11155111: 'Ethereum Sepolia',
                5: 'Ethereum Goerli',
            };

            const currentNetworkName = networkNames[currentChainId] || `Chain ID ${currentChainId}`;
            const expectedNetworkName = networkNames[expectedChainId] || `Chain ID ${expectedChainId}`;

            toast.error(
                `Network mismatch! You are on ${currentNetworkName}, but the app expects ${expectedNetworkName}. ` +
                `Please switch your wallet to ${expectedNetworkName} (Chain ID: ${expectedChainId}).`,
                { duration: 8000 }
            );
            return false;
        }
        return true;
    };

    const approveAllowance = async (): Promise<boolean> => {
        if (!address) {
            toast.error('Connect your wallet first');
            return false;
        }

        // 🔥 Network validation before any transaction
        const isValidNetwork = await validateNetwork();
        if (!isValidNetwork) {
            return false;
        }

        const client = await getWalletClient();
        if (!client) {
            toast.error('Wallet client not available. Please reconnect your wallet.');
            return false;
        }

        setApproving(true);
        try {
            const hash = await client.writeContract({
                address: tokenAddress,
                abi: erc20Abi!,
                functionName: 'approve',
                args: [contractAddress, maxUint256],
                account: address as Address,
            });
            toast.success('Approval submitted. Waiting for confirmation…');

            const customPublicClient = chainConfig
                ? createPublicClient({
                    chain: chainConfig,
                    transport: http(web3Config.rpcUrl),
                })
                : publicClient;

            if (!customPublicClient) {
                toast.error('Public client not available');
                return false;
            }

            const receipt = await customPublicClient.waitForTransactionReceipt({ hash });

            // Set approving to false immediately after receipt is received
            setApproving(false);

            if (receipt?.status === 'success') {
                toast.success('Allowance approved');
                // Reload balances to update allowance state (don't await - let it run in background)
                loadBalances().catch(console.error);
                setNeedsApproval(false);
                return true;
            } else {
                toast.error('Approval failed');
                return false;
            }
        } catch (e: unknown) {
            // Set approving to false immediately on error
            setApproving(false);

            const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Approval failed';
            if (msg.toLowerCase().includes('reject')) {
                toast.error('Transaction rejected');
            } else {
                toast.error(msg);
            }
            return false;
        }
    };

    const handleDeposit = async () => {
        if (!address) {
            toast.error('Connect your wallet first');
            return;
        }
        if (!primaryWallet) {
            toast.error('Set your primary wallet address in Profile before making a Web3 deposit.');
            return;
        }

        // 🔥 Network validation before any transaction
        const isValidNetwork = await validateNetwork();
        if (!isValidNetwork) {
            return;
        }

        const client = await getWalletClient();
        if (!client) {
            toast.error('Wallet client not available. Please reconnect your wallet.');
            return;
        }

        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        if (num > parseFloat(walletTokenBalance)) {
            toast.error(
                `Insufficient token balance. Available: ${walletTokenBalance} ${tokenSymbol}. ` +
                `You have ${parseFloat(walletEthBalance).toFixed(6)} ${nativeSymbol} but need ${tokenSymbol} to deposit.`
            );
            return;
        }

        // Check if approval is needed
        if (!isUnlimitedAllowance && parseFloat(allowance) < num) {
            // Automatically trigger approval popup
            setNeedsApproval(true);
            const approved = await approveAllowance();
            if (!approved) {
                setNeedsApproval(false); // Reset if approval failed/rejected
                return; // User rejected or approval failed
            }
            // Approval succeeded - needsApproval will be set to false in approveAllowance
        }

        setDepositing(true);
        try {
            const amountInWei = parseEther(amount);
            console.log('Depositing amount:', { amount, amountInWei: amountInWei.toString(), num });

            const hash = await client.writeContract({
                address: contractAddress,
                abi: contractAbi!,
                functionName: 'deposit',
                args: [amountInWei],
                account: address as Address,
            });
            console.log('Deposit transaction hash:', hash);
            toast.success(
                `Deposit submitted: ${num} ${tokenSymbol}. ` +
                `Note: MetaMask may show "0 ${nativeSymbol}" because ${tokenSymbol} is transferred via contract call. ` +
                `Waiting for confirmation…`,
                { duration: 6000 }
            );

            const customPublicClient = chainConfig
                ? createPublicClient({
                    chain: chainConfig,
                    transport: http(web3Config.rpcUrl),
                })
                : publicClient;

            if (!customPublicClient) {
                toast.error('Public client not available');
                setDepositing(false);
                return;
            }

            const receipt = await customPublicClient.waitForTransactionReceipt({ hash });

            // Set depositing to false immediately after receipt is received
            setDepositing(false);

            if (receipt?.status === 'success') {
                try {
                    await paymentApi.createWeb3Deposit({
                        method: 'web3',
                        amount: num,
                        web3Details: {
                            transactionHash: receipt.transactionHash,
                            walletAddress: address as string,
                            network: network as 'localhost' | 'testnet' | 'mainnet',
                            chainId: web3Config.chainId,
                            status: receipt.status === 'success' ? 'confirmed' : 'pending',
                        },
                    });
                } catch {
                    /* backend notify optional */
                }
                toast.success(`Deposit successful! ${num} tokens deposited.`);
                setAmount('');
                // Reload balances in background (don't await to avoid blocking UI)
                loadBalances().catch(console.error);
                onSuccess?.();
            } else {
                toast.error('Deposit failed');
            }
        } catch (e: unknown) {
            // Set depositing to false immediately on error
            setDepositing(false);

            const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Deposit failed';
            if (msg.toLowerCase().includes('reject')) {
                toast.error('Transaction rejected');
            } else {
                toast.error(msg);
            }
        }
    };

    const handleRefreshWithdrawalAllowance = async () => {
        if (!primaryWallet) {
            const message = 'Set your primary wallet address in Profile first.';
            setAllowanceRefreshStatus({ type: 'error', message });
            toast.error(message);
            return;
        }
        if (!connectedWalletMatchesPrimary) {
            const message = 'Connect your primary wallet address first.';
            setAllowanceRefreshStatus({ type: 'error', message });
            toast.error(message);
            return;
        }
        if (allowanceCooldownSeconds > 0) {
            const message = `Please wait ${allowanceCooldownSeconds}s before refreshing again.`;
            setAllowanceRefreshStatus({ type: 'info', message });
            toast.error(message);
            return;
        }

        setRefreshingAllowance(true);
        setAllowanceRefreshStatus({ type: 'info', message: 'Refreshing withdrawal allowance...' });
        try {
            const result = await walletApi.refreshWithdrawalAllowance();
            setAllowanceCooldownUntil(new Date(result.nextRefreshAt).getTime());
            await Promise.all([
                loadBalances(),
                walletApi.getWalletState().then(setWalletState).catch(() => null),
                walletApi.getWithdrawalAllowanceStatus().then((status) => setAllowanceStatus({
                    status: status.status,
                    lastRefreshedAt: status.lastRefreshedAt,
                })).catch(() => null),
            ]);

            const sync = result.sync;
            let message = 'Withdrawal allowance refreshed.';
            if (sync.skipped) {
                message = 'Withdrawal allowance already up to date.';
            } else if (sync.deltaApproved) {
                message = `Withdrawal allowance increased by ${parseFloat(sync.deltaApproved).toFixed(6)}.`;
            } else if (sync.deltaRevoked) {
                message = `Withdrawal allowance reduced by ${parseFloat(sync.deltaRevoked).toFixed(6)}.`;
            }
            setAllowanceRefreshStatus({ type: 'success', message });
            toast.success(message);
            onSuccess?.();
        } catch (e: unknown) {
            const err = e as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        error?: string;
                        retryAfterSeconds?: number;
                    };
                };
                message?: string;
            };
            const retryAfterSeconds = Number(err?.response?.data?.retryAfterSeconds || 0);
            if (err?.response?.status === 429 && retryAfterSeconds > 0) {
                setAllowanceCooldownUntil(Date.now() + retryAfterSeconds * 1000);
                const message = `Please wait ${retryAfterSeconds}s before refreshing again.`;
                setAllowanceRefreshStatus({ type: 'info', message });
                toast.error(message);
                return;
            }
            const message = 'Withdrawal allowance refresh failed. Please try again later or contact admin support.';
            setAllowanceRefreshStatus({ type: 'error', message });
            toast.error(message);
        } finally {
            setRefreshingAllowance(false);
        }
    };

    const handleWithdraw = async () => {
        if (!isConnected || !address) {
            toast.error('Connect your wallet first');
            return;
        }
        if (!primaryWallet) {
            toast.error('Set your primary wallet address in Profile before using self-withdrawal.');
            return;
        }
        if (!connectedWalletMatchesPrimary) {
            toast.error('Connect your primary wallet address before using self-withdrawal.');
            return;
        }
        // Prevent double-submission on page refresh
        if (pendingTx) {
            toast.error(`A withdrawal is already pending (tx: ${pendingTx.txHash.slice(0, 10)}...). Please wait or contact support.`);
            return;
        }
        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        if (num < minWithdraw) {
            toast.error(`Minimum withdrawal amount is ${minWithdraw}`);
            return;
        }
        if (maxWithdraw > 0 && num > maxWithdraw) {
            toast.error(`Maximum withdrawal amount is ${maxWithdraw}`);
            return;
        }
        // DB withdrawal wallet is source of truth.
        if (num > withdrawalWalletBalance) {
            toast.error(`Insufficient ${withdrawalWalletName} balance. You can withdraw up to ${withdrawalWalletBalance.toLocaleString()}.`);
            return;
        }
        if (num > parseFloat(onChainWithdrawable)) {
            toast.error(`Insufficient withdrawable balance. Available on-chain: ${onChainWithdrawable}`);
            return;
        }
        const isValidNetwork = await validateNetwork();
        if (!isValidNetwork) return;
        const client = await getWalletClient();
        if (!client) {
            toast.error('Wallet client not available. Please reconnect your wallet.');
            return;
        }
        setWithdrawing(true);
        try {
            const amountInWei = parseEther(amount);
            const customPublicClient = chainConfig
                ? createPublicClient({
                    chain: chainConfig,
                    transport: http(web3Config.rpcUrl),
                })
                : publicClient;

            if (!customPublicClient) {
                toast.error('Public client not available');
                setWithdrawing(false);
                return;
            }

            // Simulate first to get a sane gas estimate (avoids MetaMask gas cap error)
            const { request } = await customPublicClient.simulateContract({
                address: contractAddress,
                abi: contractAbi!,
                functionName: 'withdraw',
                args: [amountInWei],
                account: address as Address,
            });

            const hash = await client.writeContract(request as any);

            // ── IMMEDIATELY after tx lands on chain ───────────────────────
            // 1. Save pending lock so refresh can't trigger a second withdrawal
            const pendingKey = `mlm_wd_pending_${address}`;
            const pendingData = { txHash: hash, amount: num, walletAddress: address as string, submittedAt: Date.now() };
            localStorage.setItem(pendingKey, JSON.stringify(pendingData));
            setPendingTx(pendingData);

            toast.success('Withdrawal submitted. Waiting for confirmation…');

            // 2. Register with backend immediately — cron will also verify
            try {
                await walletApi.withdrawSelf({ transactionHash: hash, amount: num, walletAddress: address as string });
            } catch {
                // Non-fatal: backend Web3WithdrawalVerificationService cron handles confirmation
            }
            // ─────────────────────────────────────────────────────────────

            const receipt = await customPublicClient.waitForTransactionReceipt({ hash });
            setWithdrawing(false);

            // Clear the pending lock regardless of outcome
            localStorage.removeItem(pendingKey);
            setPendingTx(null);

            if (receipt?.status !== 'success') {
                toast.error('Withdrawal transaction failed on-chain');
                return;
            }
            setLastWithdrawalTxHash(receipt.transactionHash);
            // Re-call withdrawSelf with receipt hash to get confirmed status (idempotent)
            const res = await walletApi.withdrawSelf({
                transactionHash: receipt.transactionHash,
                amount: num,
                walletAddress: address as string,
            });
            setLastWithdrawalBackendStatus(res?.status ?? 'pending');
            toast.success(
                res?.status === 'confirmed'
                    ? 'Withdrawal confirmed and wallet updated.'
                    : 'Withdrawal submitted to backend (pending). Wallet will update shortly.'
            );
            setAmount('');
            loadBalances().catch(console.error);
            // If backend is pending, poll until confirmed/failed
            if (res?.status === 'pending') {
                pollSelfWithdrawalStatus(receipt.transactionHash);
            } else {
                onSuccess?.();
                onClose?.();
            }
        } catch (e: unknown) {
            setWithdrawing(false);
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            const msg = err?.response?.data?.message || err?.message || 'Withdrawal failed';
            if (typeof msg === 'string' && msg.toLowerCase().includes('reject')) {
                toast.error('Transaction rejected');
            } else {
                toast.error(msg);
            }
        }
    };

    const setMax = () => {
        if (mode === 'deposit') {
            setAmount(walletTokenBalance);
            return;
        }

        // For withdraw, the effective max is limited by BOTH:
        // - DB withdrawal wallet balance
        // - On-chain withdrawable balance (onChainWithdrawable = getUserWithdrawable)
        const onChain = parseFloat(onChainWithdrawable) || 0;
        const db = Number.isFinite(withdrawalWalletBalance) ? withdrawalWalletBalance : 0;
        setAmount(String(Math.min(db, onChain)));
    };

    const busy = approving || depositing || withdrawing || refreshingAllowance;
    const min = mode === 'withdraw' ? minWithdraw : 0;
    const max = mode === 'withdraw' ? maxWithdraw : 0;

    if (!paymentMethods || !configComplete) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">Config is missing, please try later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Connect Wallet */}
            {!isConnected ? (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect your wallet to {mode} via crypto. MetaMask, Trust Wallet, WalletConnect supported.</p>
                    <ConnectWalletButton fullWidth variant="default" />
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Connected wallet</p>
                        <ConnectWalletButton fullWidth variant="default" />
                    </div>

                    {profileWallet === 'pending' && !reduxPrimaryWallet ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">Loading primary wallet...</p>
                        </div>
                    ) : !primaryWallet ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                            <p className="text-sm font-medium text-amber-800">Primary wallet required</p>
                            <p className="text-xs text-amber-700">
                                Set your primary wallet in Profile before using Web3 deposits or self-withdrawal.
                            </p>
                            <Link href="/profile" className="inline-flex text-xs font-semibold text-amber-700 underline">
                                Open profile
                            </Link>
                        </div>
                    ) : mode === 'withdraw' && !connectedWalletMatchesPrimary ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                            <p className="text-sm font-medium text-amber-800">Connect primary wallet</p>
                            <p className="text-xs text-amber-700 break-all">
                                Self-withdrawal is only allowed from your primary wallet: {primaryWallet}
                            </p>
                        </div>
                    ) : null}

                    {mode === 'deposit' && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Allowance Status</p>
                                    <p className="text-xs text-gray-500">
                                        {isUnlimitedAllowance ? 'Unlimited ✓' : `Current: ${parseFloat(allowance).toFixed(6)}`}
                                    </p>
                                </div>
                                {approving && (
                                    <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                                        Approving…
                                    </div>
                                )}
                            </div>
                            {needsApproval && !approving && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    Approval required. Please confirm the transaction in your wallet.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Balance Display */}
                    {mode === 'deposit' && (
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{nativeSymbol} Balance:</span>
                                    <span className="text-sm font-semibold text-gray-900">{parseFloat(walletEthBalance).toFixed(6)} {nativeSymbol}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{tokenSymbol} Balance:</span>
                                    <span className="text-sm font-semibold text-gray-900">{parseFloat(walletTokenBalance).toFixed(6)} {tokenSymbol}</span>
                                </div>
                                {web3Config?.contractType === 'bloomx' && web3Config?.details?.customTokenAddress && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{web3Config.details.customTokenSymbol ?? 'Custom'} Balance:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {loadingBalances ? '…' : `${parseFloat(customTokenBalance).toFixed(6)} ${web3Config.details.customTokenSymbol ?? 'Token'}`}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const addr = web3Config.details?.customTokenAddress;
                                                const sym = web3Config.details?.customTokenSymbol ?? 'CUSTOM';
                                                if (typeof window === 'undefined' || !(window as any).ethereum || !addr) return;
                                                try {
                                                    await (window as any).ethereum.request({
                                                        method: 'wallet_watchAsset',
                                                        params: {
                                                            type: 'ERC20',
                                                            options: { address: addr, symbol: sym, decimals: 18 },
                                                        },
                                                    });
                                                    toast.success(`Added ${sym} to wallet`);
                                                } catch (e: any) {
                                                    if (e?.code === 4001) return; // User rejected
                                                    const msg = e?.message ?? '';
                                                    const isSpamBlock = /spam|blocked|filter/i.test(msg);
                                                    if (isSpamBlock) {
                                                        toast.error(
                                                            'Your wallet blocked adding this token. Add it manually: in your wallet open "Add token" or "Import token", then paste the token address (copied for you).',
                                                            { duration: 6000 }
                                                        );
                                                        try {
                                                            await navigator.clipboard.writeText(addr);
                                                            toast.success('Token address copied to clipboard');
                                                        } catch {
                                                            toast(addr, { duration: 8000 });
                                                        }
                                                    } else {
                                                        toast.error(msg || 'Failed to add token');
                                                    }
                                                }
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Add {web3Config.details?.customTokenSymbol ?? 'Token'} to wallet
                                        </button>
                                    </>
                                )}
                                {parseFloat(walletTokenBalance) === 0 && (
                                    <p className="text-xs text-amber-700 mt-1">
                                        ⚠️ You need {tokenSymbol} to deposit. Your {nativeSymbol} balance is {parseFloat(walletEthBalance).toFixed(6)} {nativeSymbol}.
                                    </p>
                                )}
                            </div>

                            {/* Token Faucet - Only shows on test networks */}
                            {parseFloat(walletTokenBalance) === 0 && erc20Abi && (
                                <TokenFaucet
                                    tokenAddress={tokenAddress}
                                    expectedChainId={web3Config?.chainId}
                                    erc20Abi={erc20Abi}
                                    isMainnet={web3Config?.network === 'mainnet'}
                                    onSuccess={loadBalances}
                                />
                            )}
                        </div>
                    )}

                    {/* Pending withdrawal warning — prevents double submission */}
                    {mode === 'withdraw' && pendingTx && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                            <p className="text-sm font-semibold text-amber-200">Withdrawal In Progress</p>
                            <p className="text-xs text-amber-100/80">
                                A withdrawal of <strong>{pendingTx.amount}</strong> was submitted and is awaiting on-chain confirmation.
                                Do not submit another withdrawal until this one completes.
                            </p>
                            <p className="text-xs font-mono text-amber-100/70 break-all">{pendingTx.txHash}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (address) localStorage.removeItem(`mlm_wd_pending_${address}`);
                                    setPendingTx(null);
                                }}
                                className="text-xs text-amber-200 underline hover:text-amber-100"
                            >
                                Clear (only if you are sure the transaction failed)
                            </button>
                        </div>
                    )}

                    {mode === 'withdraw' && (
                        <div className="rounded-xl border border-white/10 bg-white/5 glass-panel overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                <div className="p-3.5 min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Withdrawal Wallet</p>
                                    <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{withdrawalWalletName}</p>
                                    <p className="mt-2 text-2xl font-bold leading-tight text-foreground">{withdrawalWalletBalance.toLocaleString()}</p>
                                    <p className="mt-0.5 text-xs text-text-muted">Available balance</p>
                                </div>
                                <div className="p-3.5 min-w-0">
                                    <div className="flex h-full flex-col gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Withdrawal Allowance</p>
                                            <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${allowanceBadgeClass[allowanceDisplayStatus]}`}>
                                                {allowanceBadgeLabel[allowanceDisplayStatus]}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllowanceHelp(true)}
                                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                                                title="What is withdrawal allowance?"
                                            >
                                                <HelpCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-end justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-2xl font-bold leading-tight text-foreground">{(parseFloat(onChainWithdrawable) || 0).toFixed(6)}</p>
                                                <p className="mt-0.5 text-xs text-text-muted">Current allowance</p>
                                                <p className="mt-0.5 text-[11px] text-text-muted">Last refreshed: {formatRelativeTime(allowanceStatus?.lastRefreshedAt)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRefreshWithdrawalAllowance}
                                                disabled={
                                                    refreshingAllowance ||
                                                    allowanceCooldownSeconds > 0 ||
                                                    !primaryWallet ||
                                                    !connectedWalletMatchesPrimary
                                                }
                                                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Refresh withdrawal allowance"
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${refreshingAllowance ? 'animate-spin' : ''}`} />
                                                <span>
                                                    {refreshingAllowance
                                                        ? 'Refreshing'
                                                        : allowanceCooldownSeconds > 0
                                                            ? `${allowanceCooldownSeconds}s`
                                                            : 'Refresh'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {(allowanceRefreshStatus || web3Config?.contractType === 'bloomx' || (withdrawalWalletBalance > 0 && (parseFloat(onChainWithdrawable) || 0) <= 0)) && (
                                <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
                                    {allowanceRefreshStatus && (
                                        <p
                                            className={`text-xs ${
                                                allowanceRefreshStatus.type === 'success'
                                                    ? 'text-emerald-300'
                                                    : allowanceRefreshStatus.type === 'error'
                                                        ? 'text-red-300'
                                                        : 'text-text-muted'
                                            }`}
                                        >
                                            {allowanceRefreshStatus.message}
                                        </p>
                                    )}
                                    {web3Config?.contractType === 'bloomx' && (
                                        <p className="text-xs text-text-muted">
                                            Payout: USDT + {web3Config?.details?.customTokenSymbol ?? 'BLMX'} split by contract ratio.
                                        </p>
                                    )}
                                    {withdrawalWalletBalance > 0 && (parseFloat(onChainWithdrawable) || 0) <= 0 && (
                                        <p className="text-xs text-amber-300">
                                            Your wallet has balance, but current allowance is 0. Refresh allowance before self-withdrawal.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'withdraw' && lastWithdrawalTxHash && (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Last withdrawal tx</span>
                                <span className="text-xs font-semibold text-text-muted">
                                    Status: {lastWithdrawalBackendStatus ?? 'pending'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono text-text-muted break-all">
                                    {lastWithdrawalTxHash}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(lastWithdrawalTxHash)}
                                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-foreground hover:bg-white/10"
                                    >
                                        Copy
                                    </button>
                                    {getExplorerTxUrl(lastWithdrawalTxHash) && (
                                        <a
                                            href={getExplorerTxUrl(lastWithdrawalTxHash) as string}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-foreground hover:bg-white/10"
                                        >
                                            Explorer
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.000001"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="0.0"
                            />
                            <button
                                type="button"
                                onClick={setMax}
                                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                MAX
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            {mode === 'deposit' && `${tokenSymbol} Balance: ${parseFloat(walletTokenBalance).toFixed(6)}`}
                            {mode === 'withdraw' && (
                                <>
                                    {min > 0 || max > 0 ? `Min: ${min} · Max: ${max > 0 ? max : 'Unlimited'} · ` : ''}
                                    {withdrawalWalletName}: {withdrawalWalletBalance.toLocaleString()} · Withdrawal Allowance: {(parseFloat(onChainWithdrawable) || 0).toFixed(6)}
                                </>
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
                        disabled={
                            busy ||
                            !amount ||
                            parseFloat(amount) <= 0
                        }
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {approving ? 'Approving…' : depositing || withdrawing ? 'Processing…' : mode === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </button>

                    <WithdrawalAllowanceHelpDialog
                        open={showAllowanceHelp}
                        onClose={() => setShowAllowanceHelp(false)}
                    />
                </>
            )}
        </div>
    );
}
