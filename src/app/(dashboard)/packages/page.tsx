'use client';

import { useEffect, useState } from 'react';
import { Package as PackageType } from '@/types';
import { packageApi } from '@/lib/api/services';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { CheckCircle2, TrendingUp, Zap, Package, Calendar, Award, ShoppingCart, Percent, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';

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

    const handlePurchase = async (pkg: PackageType) => {
        const packageId = pkg.id || (pkg as any)._id;
        
        if (!packageId) {
            toast.error('Package ID is missing. Please contact support.');
            return;
        }
        
        setPurchasing(packageId);

        try {
            const result = await packageApi.purchase(packageId);
            toast.success(`Successfully purchased ${pkg.name}! Reference: ${result.reference}`);
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
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto min-w-0">
            {/* Header — Editorial Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                          <Package size={24} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight leading-tight">
                                Bazar Memberships
                            </h1>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-2 max-w-xl leading-relaxed">
                                Acquire a premium membership node to authorize smart referrals, release global pool shared commissions, and activate binary placements compensation structures.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Active Memberships (Staked Nodes) ───────────────── */}
            {activePackages.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 rounded bg-primary" />
                        <h2 className="text-lg font-black tracking-tight text-[var(--foreground)]">Active Staked Nodes ({activePackages.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activePackages.map((activePkg, index) => {
                            // Calculate percentage progress toward maturity capping
                            const earnPercent = activePkg.cappingLimit > 0 
                                ? Math.min(100, (activePkg.totalEarned / activePkg.cappingLimit) * 100) 
                                : 0;
                            return (
                                <div
                                    key={`${activePkg.packageId}-${activePkg.purchaseDate}-${index}`}
                                    className="rounded-2xl p-6 border border-[var(--primary)]/15 bg-[var(--surface-elevated)] space-y-4 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.02) 0%, transparent 60%)' }}
                                >
                                    <div className="flex items-start justify-between min-w-0">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Membership Node</p>
                                            <h3 className="text-lg font-black text-[var(--foreground)] mt-0.5">Package #{activePkg.packageNumber}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                                            Active
                                        </span>
                                    </div>

                                    {/* Capping Progress Meter */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)]">
                                            <span>Maturity Yield Limit (200% Cap)</span>
                                            <span className="text-primary tabular-nums">{earnPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-black/20 overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-[#c87a53] transition-all duration-500"
                                                style={{ width: `${earnPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 border-t border-[var(--border)] pt-4 text-xs">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Staked Value</p>
                                            <p className="text-sm font-black text-[var(--foreground)] mt-0.5 tabular-nums">{formatCurrency(activePkg.totalValue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Profit</p>
                                            <p className="text-sm font-black text-primary mt-0.5 tabular-nums">{formatCurrency(activePkg.totalEarned)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Remaining Yield</p>
                                            <p className="text-sm font-black text-[var(--foreground)] mt-0.5 tabular-nums">{formatCurrency(activePkg.remainingCapping)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Staked On</p>
                                            <p className="text-sm font-bold text-[var(--foreground)] mt-0.5">{formatDate(activePkg.purchaseDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Available Packages Store Grid ───────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded bg-primary" />
                    <h2 className="text-lg font-black tracking-tight text-[var(--foreground)]">Store Purchase Tiers</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-80 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                                <div className="h-28 shimmer-placeholder" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 w-24 rounded shimmer-placeholder" />
                                    <div className="h-8 w-44 rounded shimmer-placeholder" />
                                    <div className="space-y-2 pt-2">
                                        <div className="h-3 w-full rounded shimmer-placeholder" />
                                        <div className="h-3 w-full rounded shimmer-placeholder" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg, index) => {
                            const packageId = pkg.id || (pkg as any)._id || `package-${index}`;
                            
                            // Calculate dynamic reward caps based on package value
                            const directReward = pkg.totalValue * 0.2;
                            const binaryReward = pkg.totalValue * 0.25;
                            const spilloverReward = pkg.totalValue * 0.05;

                            return (
                                <div
                                    key={packageId}
                                    className="rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 bg-[var(--surface-elevated)] overflow-hidden flex flex-col shadow-sm transition-all duration-200 group hover:-translate-y-0.5"
                                >
                                    {/* Package Header Banner */}
                                    <div className="px-6 py-6 border-b border-[var(--border)] relative"
                                        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 60%)' }}>
                                        <div className="absolute top-4 right-4 bg-[var(--primary)]/10 text-primary border border-[var(--primary)]/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                            Store Tier
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Package #{pkg.packageNumber}</p>
                                        <h3 className="text-xl font-black text-[var(--foreground)] mt-0.5">{pkg.name}</h3>
                                        <div className="mt-4">
                                            <p className="text-3xl font-black text-primary tabular-nums" style={{ fontFamily: 'var(--font-sans)' }}>
                                                {formatCurrency(pkg.totalValue)}
                                            </p>
                                            <p className="text-[10px] text-[var(--muted-foreground)] font-bold mt-1 uppercase tracking-wider">Total Node Value</p>
                                        </div>
                                    </div>

                                    {/* Package Details */}
                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                                        <div className="space-y-3.5">
                                            {/* Details list */}
                                            <div className="space-y-2 border-b border-[var(--border)] pb-4 text-xs">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-[var(--muted-foreground)]">Store Credits (USDT):</span>
                                                    <span className="font-bold text-[var(--foreground)] tabular-nums">{formatCurrency(pkg.stakingPackage)}</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-[var(--muted-foreground)]">Admin Processing Fee:</span>
                                                    <span className="font-bold text-[var(--foreground)] tabular-nums">{formatCurrency(pkg.adminPackage ?? 0)}</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-[var(--muted-foreground)]">Global Shares Contribution:</span>
                                                    <span className="font-bold text-[var(--foreground)] tabular-nums">{formatCurrency(pkg.globalPackage ?? 0)}</span>
                                                </div>
                                            </div>

                                            {/* Commission Rates details */}
                                            <div className="rounded-xl border border-white/5 bg-black/10 dark:bg-black/15 p-4 space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <TrendingUp className="text-primary shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Direct Commissions</p>
                                                        <p className="text-sm font-black text-primary tabular-nums mt-0.5">
                                                            20% ({formatCurrency(directReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <Zap className="text-[#c87a53] shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Binary Matching Payout</p>
                                                        <p className="text-sm font-black text-[var(--foreground)] tabular-nums mt-0.5">
                                                            25% ({formatCurrency(binaryReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <Award className="text-[var(--muted-foreground)] shrink-0 mt-0.5" size={14} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Placement Spillover</p>
                                                        <p className="text-sm font-black text-[var(--muted-foreground)] tabular-nums mt-0.5">
                                                            5% ({formatCurrency(spilloverReward)})
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handlePurchase(pkg)}
                                            disabled={purchasing === packageId}
                                            className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all premium-btn-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98] shadow-sm shrink-0"
                                        >
                                            <ShoppingCart size={14} />
                                            {purchasing === packageId ? 'Executing Smart Checkout...' : 'Acquire Package'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
