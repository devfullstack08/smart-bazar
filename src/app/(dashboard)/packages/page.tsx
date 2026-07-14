'use client';

import { useEffect, useState } from 'react';
import { Package as PackageType } from '@/types';
import { packageApi } from '@/lib/api/services';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { CheckCircle2, TrendingUp, Zap, Package, Calendar, Award, ShoppingCart, Percent, AlertCircle, ShieldCheck, X, Receipt, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { APP_CONSTANTS } from '@/constants/app';
import { APP_NAME } from '@/constants/env';

type UserActivePackage = {
    packageId: string;
    packageNumber: number;
    totalValue: number;
    totalEarned: number;
    cappingLimit: number;
    remainingCapping: number;
    purchaseDate: string;
    lastROIDate?: string;
    status: 'active' | 'cap_reached' | 'expired';
    isActive: boolean;
};

export default function PackagesPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [packages, setPackages] = useState<PackageType[]>([]);
    const [activePackages, setActivePackages] = useState<UserActivePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingActive, setLoadingActive] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [checkoutPkg, setCheckoutPkg] = useState<PackageType | null>(null);

    useEffect(() => {
        fetchPackages();
        fetchActivePackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const data = await packageApi.getAll();
            setPackages(data);
        } catch (error) {
            console.error('Failed to fetch packages:', error);
            toast.error('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivePackages = async () => {
        try {
            const data = await packageApi.getMyPackages();
            setActivePackages(data.packages.items.filter((p) => p.isActive));
        } catch (error) {
            console.error('Failed to fetch active packages:', error);
        } finally {
            setLoadingActive(false);
        }
    };

    const handlePurchase = async () => {
        if (!checkoutPkg) return;
        const packageId = checkoutPkg.id || (checkoutPkg as any)._id;
        
        if (!packageId) {
            toast.error('Package ID is missing. Please contact support.');
            return;
        }
        
        setPurchasing(packageId);

        try {
            const result = await packageApi.purchase(packageId);
            toast.success(`Successfully purchased ${checkoutPkg.name}! Reference: ${result.reference}`);
            setCheckoutPkg(null);
            fetchPackages();
            fetchActivePackages();
        } catch (error: any) {
            console.error('Purchase error:', error);
            const message = error.response?.data?.message || error.message || 'Purchase failed';
            toast.error(message);
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto min-w-0 pb-12">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <Package size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Membership Store</h1>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">Acquire network nodes to authorize placement match commission plans</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Nodes List */}
            {activePackages.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">My Active Staked Nodes ({activePackages.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activePackages.map((activePkg, index) => {
                            const earnPercent = activePkg.cappingLimit > 0 
                                ? Math.min(100, (activePkg.totalEarned / activePkg.cappingLimit) * 100) 
                                : 0;
                            return (
                                <div
                                    key={`${activePkg.packageId}-${activePkg.purchaseDate}-${index}`}
                                    className="rounded-2xl p-6 border border-primary/20 bg-[var(--surface-elevated)] shadow-sm relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, var(--surface-elevated) 100%)' }}
                                >
                                    <div className="flex items-start justify-between min-w-0">
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Active Staked Node</p>
                                            <h3 className="text-base font-black text-[var(--foreground)] mt-1">Package #{activePkg.packageNumber}</h3>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 uppercase tracking-wider shrink-0">
                                            Active
                                        </span>
                                    </div>

                                    {/* Yield progress bar */}
                                    <div className="mt-4 space-y-1">
                                        <div className="flex justify-between text-[10px] font-extrabold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            <span>Maturity progress (200% limit)</span>
                                            <span className="text-primary font-mono">{earnPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-black/30 overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                                                style={{ width: `${earnPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-[var(--border)] pt-4 mt-4 text-xs">
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Staked Value</p>
                                            <p className="text-sm font-black text-[var(--foreground)] font-mono tabular-nums mt-0.5">{formatCurrency(activePkg.totalValue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Profit Yield</p>
                                            <p className="text-sm font-black text-primary font-mono tabular-nums mt-0.5">{formatCurrency(activePkg.totalEarned)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Remaining Yield</p>
                                            <p className="text-sm font-black text-[var(--foreground)] font-mono tabular-nums mt-0.5">{formatCurrency(activePkg.remainingCapping)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Purchase Date</p>
                                            <p className="text-xs font-semibold text-[var(--foreground)] mt-0.5">{formatDate(activePkg.purchaseDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Store Grid Tiers */}
            <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Membership packages & purchase tiers</h3>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-96 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg, index) => {
                            const packageId = pkg.id || (pkg as any)._id || `package-${index}`;
                            const directReward = pkg.totalValue * 0.2;
                            const binaryReward = pkg.totalValue * 0.25;
                            const spilloverReward = pkg.totalValue * 0.05;

                            return (
                                <div
                                    key={packageId}
                                    className="rounded-2xl border border-[var(--border)] hover:border-primary/25 bg-[var(--surface-elevated)] overflow-hidden flex flex-col shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-md"
                                >
                                    {/* Image with gradient mask overlay */}
                                    <div className="relative h-40 w-full overflow-hidden border-b border-[var(--border)] bg-zinc-950/45">
                                        <img
                                            src={APP_CONSTANTS.ASSETS.PRODUCT_BOX}
                                            alt={pkg.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-elevated)] via-transparent to-transparent" />
                                        <span className="absolute top-4 right-4 bg-primary text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                                            Product Bundle
                                        </span>
                                    </div>

                                    {/* Content Card Body */}
                                    <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Membership Tier</p>
                                                <h3 className="text-lg font-black text-[var(--foreground)] mt-0.5 tracking-tight group-hover:text-primary transition-colors">
                                                    {pkg.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-baseline gap-1 font-mono">
                                                <span className="text-xl sm:text-2xl font-black text-primary tracking-tight tabular-nums">
                                                    {formatCurrency(pkg.totalValue)}
                                                </span>
                                                <span className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">USDT</span>
                                            </div>

                                            {/* Details Breakdown list */}
                                            <div className="space-y-2 border-t border-[var(--border)] pt-4 text-xs font-semibold">
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--muted-foreground)]">Shopping Credits:</span>
                                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(pkg.stakingPackage)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--muted-foreground)]">SetUp Administration Fee:</span>
                                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(pkg.adminPackage ?? 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--muted-foreground)]">Global Pool Share:</span>
                                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(pkg.globalPackage ?? 0)}</span>
                                                </div>
                                            </div>

                                            {/* Referral rate rules */}
                                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <TrendingUp className="text-primary shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">Direct Commissions</p>
                                                        <p className="text-xs font-black text-primary mt-0.5 font-mono tabular-nums">
                                                            20% ({formatCurrency(directReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <Zap className="text-amber-500 shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">Binary Matching Yield</p>
                                                        <p className="text-xs font-black text-[var(--foreground)] mt-0.5 font-mono tabular-nums">
                                                            25% ({formatCurrency(binaryReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <Award className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">Spillover Placement</p>
                                                        <p className="text-xs font-black text-[var(--muted-foreground)] mt-0.5 font-mono tabular-nums">
                                                            5% ({formatCurrency(spilloverReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setCheckoutPkg(pkg)}
                                            className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-primary hover:bg-primary/95 text-black active:scale-[0.98] shadow-sm shrink-0"
                                        >
                                            <ShoppingCart size={13} />
                                            Acquire Package
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Smart Checkout Receipt Modal */}
            {checkoutPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-[var(--surface-elevated)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col max-w-md w-full relative overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Decorative background glows */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Receipt size={18} />
                                <h3 className="text-sm font-black tracking-tight text-[var(--foreground)] uppercase tracking-wider">Checkout Receipt</h3>
                            </div>
                            <button 
                                onClick={() => setCheckoutPkg(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors focus:outline-none"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="py-6 space-y-5">
                            {/* Product summary voucher */}
                            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
                                <img
                                    src={APP_CONSTANTS.ASSETS.PRODUCT_BOX}
                                    alt={checkoutPkg.name}
                                    className="w-14 h-14 object-cover rounded-lg border border-[var(--border)]"
                                />
                                <div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary">Membership Node Tier</span>
                                    <h4 className="text-xs sm:text-sm font-black text-[var(--foreground)] mt-0.5">{checkoutPkg.name}</h4>
                                    <p className="text-xs font-black text-primary font-mono mt-1 tabular-nums">{formatCurrency(checkoutPkg.totalValue)}</p>
                                </div>
                            </div>

                            {/* Cost breakdowns */}
                            <div className="space-y-2.5 text-xs border-b border-[var(--border)] pb-5 font-semibold">
                                <div className="flex justify-between text-[var(--muted-foreground)]">
                                    <span>Shopping Credits</span>
                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(checkoutPkg.stakingPackage)}</span>
                                </div>
                                <div className="flex justify-between text-[var(--muted-foreground)]">
                                    <span>Setup Fee</span>
                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(checkoutPkg.adminPackage ?? 0)}</span>
                                </div>
                                <div className="flex justify-between text-[var(--muted-foreground)]">
                                    <span>Global Pool Share Fund</span>
                                    <span className="text-[var(--foreground)] font-mono tabular-nums">{formatCurrency(checkoutPkg.globalPackage ?? 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-[var(--foreground)] pt-2.5 border-t border-dashed border-[var(--border)]">
                                    <span>Total Payment Amount</span>
                                    <span className="text-primary font-mono tabular-nums">{formatCurrency(checkoutPkg.totalValue)}</span>
                                </div>
                            </div>

                            {/* Unlock node privileges details */}
                            <div className="space-y-2.5 text-xs">
                                <p className="font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] text-[9px]">Authorization Privileges Unlocked</p>
                                <div className="grid grid-cols-1 gap-2 pt-1 font-semibold">
                                    <div className="flex items-center gap-2 text-[var(--foreground)]">
                                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                        <span>200% capping limits yield payout eligibility</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--foreground)]">
                                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                        <span>Authorize binary placements hierarchy matching</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--foreground)]">
                                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                        <span>Enables global pool matching shared payouts</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCheckoutPkg(null)}
                                className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] font-bold text-xs text-[var(--foreground)] transition-colors focus:outline-none"
                            >
                                Cancel Order
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={purchasing !== null}
                                className="flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-primary hover:bg-primary/95 text-black disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-sm"
                            >
                                <ShoppingCart size={13} />
                                {purchasing !== null ? 'Confirming Order...' : 'Confirm & Buy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
