'use client';

import { useEffect, useState } from 'react';
import { APP_NAME } from '@/constants/env';
import { Package as PackageType } from '@/types';
import { packageApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import { CheckCircle2, TrendingUp, Zap, Package, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
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
        // Check if package ID is valid - support both id and _id fields
        const packageId = pkg.id || (pkg as any)._id;
        
        if (!packageId) {
            console.error('Package object:', pkg); // Debug log to see what we're getting
            console.error('Package keys:', Object.keys(pkg)); // Debug log to see available keys
            toast.error('Package ID is missing. Please contact support.');
            return;
        }

        // Note: User authentication is handled by the dashboard layout
        // The purchase API endpoint doesn't require userId in the request body
        // It uses the authenticated user from the token
        
        setPurchasing(packageId);

        try {
            // Call new API endpoint - uses wallet balance automatically
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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-primary/20 text-primary shrink-0">
                        <Package size={24} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Bazar Membership Store</h1>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Unlock exclusive shopping deals, 20% direct referrals, and 25% binary matching with our premium store packages.</p>
                    </div>
                </div>
            </div>

            {/* Active Packages Section - PWA compact */}
            {activePackages.length > 0 && (
                <div className="card rounded-lg sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 via-emerald-600 to-indigo-700 p-2.5 sm:p-6 text-white">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="icon-container icon-container-sm shrink-0">
                                <Package className="text-white" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-xl md:text-2xl font-bold truncate">Active Packages ({activePackages.length})</h2>
                                <p className="text-indigo-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Your currently active investments</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2.5 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                            {activePackages.map((activePkg, index) => (
                                <div
                                    key={`${activePkg.packageId}-${activePkg.purchaseDate}-${index}`}
                                    className="rounded-lg sm:rounded-2xl p-2.5 sm:p-6 border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-indigo-50/80 dark:from-emerald-500/10 dark:to-indigo-500/10"
                                >
                                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                                        <div className="min-w-0">
                                            <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Package #{activePkg.packageNumber}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Value: {formatCurrency(activePkg.totalValue)}</p>
                                        </div>
                                        <div className="icon-container icon-container-sm shrink-0">
                                            <CheckCircle2 className="text-white" size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-3">
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1"><DollarSign size={12} /> Total Earned:</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(activePkg.totalEarned)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Capping Limit:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(activePkg.cappingLimit)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(activePkg.remainingCapping)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1"><Calendar size={12} /> Purchased:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatDate(activePkg.purchaseDate)}</span>
                                        </div>
                                        {activePkg.lastROIDate && (
                                            <div className="flex justify-between text-xs sm:text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Last ROI:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatDate(activePkg.lastROIDate)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Packages Grid - PWA compact */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                    {packages.map((pkg, index) => {
                        const packageId = pkg.id || (pkg as any)._id || `package-${index}`;
                        return (
                        <div
                            key={packageId}
                            className="card rounded-lg sm:rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#12121a] group hover:shadow-lg sm:hover:shadow-xl transition-all"
                        >
                            {/* Package Header */}
                            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 p-2.5 sm:p-6 text-white">
                                <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-xl md:text-2xl font-bold truncate">{pkg.name}</h3>
                                        <p className="text-orange-100 text-xs sm:text-sm">Package #{pkg.packageNumber}</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/20 shrink-0">
                                        <span className="text-[9px] sm:text-xs font-semibold">Store Best Seller</span>
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4">
                                    <p className="text-xl sm:text-3xl md:text-4xl font-bold leading-tight">{formatCurrency(pkg.totalValue)}</p>
                                    <p className="text-orange-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Package Price</p>
                                </div>
                            </div>

                            {/* Package Details */}
                            <div className="p-2.5 sm:p-6 space-y-2 sm:space-y-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Store Credits:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(pkg.stakingPackage)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Admin Fee:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(pkg.adminPackage ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Global Pool Fee:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(pkg.globalPackage ?? 0)}</span>
                                    </div>
                                </div>

                                <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-orange-200/60 dark:border-orange-500/20 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-500/10 dark:to-amber-500/10 space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <TrendingUp className="text-orange-600 dark:text-orange-400 shrink-0" size={16} />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Direct Referral Bonus</p>
                                            <p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                                                20% ($200.00)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Zap className="text-blue-600 dark:text-blue-400 shrink-0" size={16} />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Binary Matching Bonus</p>
                                            <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                                                25% ($250.00)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={16} />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Placement Spillover</p>
                                            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                                5% ($50.00)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={purchasing === packageId}
                                    className="btn btn-primary w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
                                >
                                    <ShoppingCart size={18} />
                                    {purchasing === packageId ? 'Processing...' : 'Buy Now & Checkout'}
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
