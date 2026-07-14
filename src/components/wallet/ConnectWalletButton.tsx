'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Connector } from 'wagmi';
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi';
import { Wallet, ChevronDown, LogOut, Smartphone, Scan, Shield, Copy, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';

type Variant = 'default' | 'compact';

interface ConnectWalletButtonProps {
    /** Optional: show compact style (e.g. in header) */
    variant?: Variant;
    /** Optional: full width when true */
    fullWidth?: boolean;
    /** Optional: extra class for the button */
    className?: string;
}

const CONNECTOR_LABELS: Record<string, string> = {
    injected: 'Browser Wallet',
    metamask: 'MetaMask',
    trust: 'Trust Wallet',
    coinbasewallet: 'Coinbase Wallet',
    coinbase: 'Coinbase Wallet',
    walletconnect: 'WalletConnect',
};

/** Local wallet icon paths (public/assets/wallets) */
const CONNECTOR_ICON_URLS: Record<string, string> = {
    injected: '/assets/wallets/metamask.svg',
    metamask: '/assets/wallets/metamask.svg',
    trust: '/assets/wallets/trustwallet.svg',
    coinbasewallet: '/assets/wallets/coinbase-logo-icon.svg',
    coinbase: '/assets/wallets/coinbase-logo-icon.svg',
    walletconnect: '/assets/wallets/walletconnect.svg',
};

const CONNECTOR_ICONS: Record<string, LucideIcon> = {
    injected: Smartphone,
    metamask: Wallet,
    trust: Shield,
    coinbasewallet: Wallet,
    coinbase: Wallet,
    walletconnect: Scan,
};

function getConnectorLabel(connector: Connector): string {
    const id = (connector.id ?? connector.type ?? '').toLowerCase();
    return CONNECTOR_LABELS[id] ?? connector.name ?? connector.id ?? 'Connect';
}

function getConnectorIconUrl(connector: Connector): string | null {
    const icon = (connector as { icon?: string }).icon;
    if (icon && typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('data:'))) {
        return icon;
    }
    const id = (connector.id ?? connector.type ?? '').toLowerCase().replace(/\s+/g, '');
    return CONNECTOR_ICON_URLS[id] ?? null;
}

function getConnectorIcon(connector: Connector): LucideIcon {
    const id = (connector.id ?? connector.type ?? '').toLowerCase().replace(/\s+/g, '');
    return CONNECTOR_ICONS[id] ?? Wallet;
}

export function ConnectWalletButton({ variant = 'default', fullWidth = false, className = '' }: ConnectWalletButtonProps) {
    const { address, isConnected } = useAccount();
    const { connectAsync, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const connectors = useConnectors();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const panelWidth = 260;
        const panelHeight = 320;
        const padding = 8;
        let left = rect.left;
        let top = rect.bottom + padding;
        // Stay in viewport
        if (left + panelWidth > window.innerWidth) left = window.innerWidth - panelWidth - padding;
        if (left < padding) left = padding;
        if (top + panelHeight > window.innerHeight - padding) {
            top = rect.top - panelHeight - padding;
        }
        setPosition({ top, left });
    }, []);

    useLayoutEffect(() => {
        if (dropdownOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [dropdownOpen, updatePosition]);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        const target = e.target as Node;
        if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
        setDropdownOpen(false);
    }, []);

    useEffect(() => {
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [dropdownOpen, handleClickOutside]);

    const handleConnect = async (connector: Connector) => {
        try {
            await connectAsync({ connector });
            toast.success('Wallet connected');
            setDropdownOpen(false);
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to connect';
            if (!msg.includes('already pending') && !msg.includes('32002')) {
                toast.error(msg);
            }
        }
    };

    const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
    const copyAddress = () => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success('Address copied');
        setTimeout(() => setCopied(false), 1500);
    };

    const renderPanel = () => {
        if (!dropdownOpen || typeof document === 'undefined') return null;
        const panelContent = isConnected && address ? (
            <div
                ref={panelRef}
                className="fixed min-w-[224px] w-56 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-xl shadow-black/20 dark:shadow-black/60 backdrop-blur-sm overflow-hidden z-[9999]"
                style={{ top: position.top, left: position.left }}
            >
                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Connected</p>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-900 dark:text-white truncate">{truncatedAddress}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyAddress(); }}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Copy address"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        disconnect();
                        setDropdownOpen(false);
                        toast.success('Wallet disconnected');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                        <LogOut size={14} />
                    </div>
                    Disconnect
                </button>
            </div>
        ) : (
            <div
                ref={panelRef}
                className="fixed min-w-[260px] rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-xl shadow-black/20 dark:shadow-black/60 backdrop-blur-sm overflow-hidden z-[9999]"
                style={{ top: position.top, left: position.left }}
            >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connect a wallet</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose your preferred wallet to connect</p>
                </div>
                <div className="p-2 max-h-[280px] overflow-y-auto">
                    {connectors.map((connector) => {
                        const iconUrl = getConnectorIconUrl(connector);
                        const Icon = getConnectorIcon(connector);
                        return (
                            <button
                                key={connector.uid}
                                type="button"
                                onClick={() => handleConnect(connector)}
                                disabled={isPending}
                                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors overflow-hidden">
                                    {iconUrl ? (
                                        <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />
                                    ) : (
                                        <Icon size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                    )}
                                </div>
                                <span>{getConnectorLabel(connector)}</span>
                            </button>
                        );
                    })}
                </div>
                {connectors.length === 0 && (
                    <div className="px-4 py-6 text-center">
                        <Wallet size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No wallets available</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Install MetaMask or another Web3 wallet</p>
                    </div>
                )}
            </div>
        );
        return createPortal(panelContent, document.body);
    };

    if (isConnected && address) {
        return (
            <>
                <div className={`relative flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}>
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => { setDropdownOpen(!dropdownOpen); if (!dropdownOpen) updatePosition(); }}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border shadow-sm hover:shadow-md ${
                        variant === 'compact'
                            ? 'px-3 py-1.5 text-sm'
                            : 'px-4 py-2.5 sm:py-3 text-sm sm:text-base'
                    } ${fullWidth ? 'w-full' : ''} bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20`}
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 dark:bg-emerald-500/30">
                        <Wallet size={variant === 'compact' ? 14 : 16} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-mono truncate">{truncatedAddress}</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                </div>
                {renderPanel()}
            </>
        );
    }

    return (
        <>
            <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => { setDropdownOpen(!dropdownOpen); if (!dropdownOpen) updatePosition(); }}
                    disabled={isPending}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border shadow-sm hover:shadow-md disabled:hover:shadow-sm ${
                        variant === 'compact'
                            ? 'px-3 py-1.5 text-sm'
                            : 'px-4 py-2.5 sm:py-3 text-sm sm:text-base'
                    } ${fullWidth ? 'w-full' : ''} bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <Wallet size={variant === 'compact' ? 14 : 16} />
                    </div>
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {renderPanel()}
        </>
    );
}
