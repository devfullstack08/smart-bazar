'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { Address, parseEther, formatEther } from 'viem';
import toast from 'react-hot-toast';

interface TokenFaucetProps {
    tokenAddress: Address;
    expectedChainId?: number;
    erc20Abi: any[];
    isMainnet?: boolean;
    onSuccess?: () => void;
}

/**
 * Token Faucet Component
 * Allows users to get test tokens on localhost/testnet environments
 * Only shows on non-mainnet networks
 */
export function TokenFaucet({ tokenAddress, expectedChainId, erc20Abi, isMainnet = false, onSuccess }: TokenFaucetProps) {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();
    const [minting, setMinting] = useState(false);
    const [balance, setBalance] = useState<string>('0');

    // Check network mismatch (ensure this is a strict boolean)
    const isWrongNetwork = !!expectedChainId && chainId !== expectedChainId;

    const loadBalance = async () => {
        if (!publicClient || !address) return;
        
        // Don't try to load balance if on wrong network
        if (isWrongNetwork) {
            setBalance('0');
            return;
        }
        
        try {
            // First check if contract exists at this address
            const bytecode = await publicClient.getBytecode({ address: tokenAddress }).catch(() => null);
            if (!bytecode || bytecode === '0x') {
                console.warn('Token contract not found at address:', tokenAddress);
                setBalance('0');
                return;
            }

            const balance = await publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address],
            }).catch((error: any) => {
                // Check if it's a "returned no data" error (contract not found)
                if (error?.message?.includes('returned no data') || error?.message?.includes('0x')) {
                    console.warn('Token contract not found or invalid at address:', tokenAddress);
                } else {
                    console.error('Error reading token balance:', error);
                }
                // Return null to indicate error
                return null;
            });

            if (balance !== null) {
                setBalance(formatEther(balance as bigint));
            } else {
                setBalance('0');
            }
        } catch (error: any) {
            console.error('Error loading balance:', error);
            // Don't show error toast here - it's handled in parent component
            setBalance('0');
        }
    };

    const mintTokens = async () => {
        if (!walletClient || !address) {
            toast.error('Please connect your wallet first');
            return;
        }

        setMinting(true);
        try {
            // Try to call a mint function (common in test tokens)
            // Adjust function name based on your token contract
            const hash = await walletClient.writeContract({
                address: tokenAddress,
                abi: [
                    {
                        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
                        name: 'mint',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ] as any,
                functionName: 'mint',
                args: [parseEther('1000')], // Mint 1000 tokens
                account: address as Address,
            });

            toast.success('Minting tokens... Waiting for confirmation');
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            
            if (receipt?.status === 'success') {
                toast.success('Tokens minted successfully!');
                await loadBalance();
                onSuccess?.();
            } else {
                toast.error('Token minting failed');
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to mint tokens';
            
            // If mint function doesn't exist, try other common methods
            if (errorMessage.includes('function') || errorMessage.includes('not found')) {
                toast.error(
                    'Mint function not available. Please get tokens from a faucet or deployer.',
                    { duration: 5000 }
                );
            } else if (errorMessage.toLowerCase().includes('reject')) {
                toast.error('Transaction rejected');
            } else {
                toast.error(`Minting failed: ${errorMessage}`);
            }
        } finally {
            setMinting(false);
        }
    };

    // Load balance on mount and when chainId changes
    useEffect(() => {
        if (!isMainnet && erc20Abi?.length && isConnected && address) {
            loadBalance();
        }
    }, [isMainnet, erc20Abi, isConnected, address, chainId]);

    if (isMainnet || !erc20Abi?.length) {
        return null;
    }

    if (!isConnected) {
        return null;
    }

    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {isWrongNetwork && expectedChainId && (
                <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
                    ⚠️ Please switch to the correct network (Chain ID: {expectedChainId}) to use the token faucet.
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-sm font-semibold text-gray-900">Test Token Faucet</p>
                    <p className="text-xs text-gray-600 mt-1">
                        Current Balance: <span className="font-mono">{parseFloat(balance).toFixed(4)}</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={mintTokens}
                    disabled={minting || isWrongNetwork}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {minting ? 'Minting...' : 'Get Test Tokens'}
                </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
                💡 This faucet is only available on test networks. Click to mint 1000 test tokens.
            </p>
        </div>
    );
}
