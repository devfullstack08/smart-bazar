'use client';

import { useEffect, useState } from 'react';
import { userApi, walletApi, packageApi, incomeApi, teamApi, dashboardApi, projectApi } from '@/lib/api/services';
import type { DashboardData, CappingTrackingData, Banner, PoolBalance, Offer, ProjectPopup, DashboardMedia } from '@/types';
import { BannerCarousel } from '@/components/ui/BannerCarousel';
import DashboardWelcomeCard from '@/components/dashboard/DashboardWelcomeCard';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardIncomeOverview from '@/components/dashboard/DashboardIncomeOverview';
import DashboardPoolStatus from '@/components/dashboard/DashboardPoolStatus';
import DashboardGlobalPools from '@/components/dashboard/DashboardGlobalPools';
import OverviewStats from '@/components/dashboard/OverviewStats';
import DashboardCappingTracker from '@/components/dashboard/DashboardCappingTracker';
import DashboardRoyaltyTracker from '@/components/dashboard/DashboardRoyaltyTracker';
import DashboardReferEarn from '@/components/dashboard/DashboardReferEarn';
import DashboardPackages from '@/components/dashboard/DashboardPackages';
import OffersSection from '@/components/dashboard/OffersSection';
import DashboardPopup from '@/components/dashboard/DashboardPopup';
import DashboardMediaStrip from '@/components/dashboard/DashboardMediaStrip';

export default function DashboardPage() {
    const [dashboardUser, setDashboardUser] = useState<DashboardData['user']>({
        userId: '',
        name: '',
        email: '',
        phone: '',
        status: 'active',
        rank: '',
        sponsorId: undefined,
        joinedAt: '',
        kyc: { verified: false, documentsCount: 0 },
    });
    const [wallet, setWallet] = useState<DashboardData['wallet']>({
        balance: 0,
        availableBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalEarned: 0,
    });
    const [packages, setPackages] = useState<DashboardData['packages']>({
        active: 0,
        total: 0,
        activePackages: [],
    });
    const [income, setIncome] = useState<DashboardData['income']>({
        totalEarned: 0,
        todayIncome: 0,
        yesterdayIncome: 0,
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        byType: [],
    });
    const [network, setNetwork] = useState<DashboardData['network']>({
        downlineCount: 0,
        sponsorId: undefined,
    });
    const [cappingData, setCappingData] = useState<CappingTrackingData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [loadingIncome, setLoadingIncome] = useState(true);
    const [loadingCapping, setLoadingCapping] = useState(true);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [loadingGlobalWallets, setLoadingGlobalWallets] = useState(true);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [loadingPoolStatus, setLoadingPoolStatus] = useState(true);
    const [loadingPopup, setLoadingPopup] = useState(true);
    const [loadingDashboardMedia, setLoadingDashboardMedia] = useState(true);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [globalWallets, setGlobalWallets] = useState<PoolBalance[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [dashboardPopup, setDashboardPopup] = useState<ProjectPopup | null>(null);
    const [dashboardMedia, setDashboardMedia] = useState<DashboardMedia[]>([]);
    const [poolStatus, setPoolStatus] = useState<Parameters<typeof DashboardPoolStatus>[0]['poolStatus'] | null>(null);
    const [incomeConfig, setIncomeConfig] = useState<Record<string, any> | null>(null);
    const [loadingTeamStats, setLoadingTeamStats] = useState(true);
    const [directReferrals, setDirectReferrals] = useState<any[]>([]);
    const [siteOrigin, setSiteOrigin] = useState('');

    useEffect(() => {
        setSiteOrigin(window.location.origin);
        fetchProfile();
        fetchWallet();
        fetchPackages();
        fetchIncome();
        fetchTeamStats();
        fetchCappingTracking();
        (async () => {
            try {
                const data = await dashboardApi.getGlobalWallets();
                setGlobalWallets(Array.isArray(data) ? data : []);
            } catch {
                setGlobalWallets([]);
            } finally {
                setLoadingGlobalWallets(false);
            }
        })();
        (async () => {
            try {
                const data = await userApi.getBanners();
                setBanners(data || []);
            } catch {
                // Optional
            } finally {
                setLoadingBanners(false);
            }
        })();
        (async () => {
            try {
                const data = await userApi.getOffers();
                setOffers(Array.isArray(data) ? data : []);
            } catch {
                setOffers([]);
            } finally {
                setLoadingOffers(false);
            }
        })();
        (async () => {
            try {
                const data = await userApi.getDashboardMedia();
                setDashboardMedia(Array.isArray(data) ? data : []);
            } catch {
                setDashboardMedia([]);
            } finally {
                setLoadingDashboardMedia(false);
            }
        })();
        (async () => {
            try {
                const data = await userApi.getProjectPopups();
                if (Array.isArray(data) && data.length > 0) {
                    const activePopup = [...data]
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .find((popup) => popup.isActive);
                    setDashboardPopup(activePopup ?? null);
                } else {
                    setDashboardPopup(null);
                }
            } catch {
                setDashboardPopup(null);
            } finally {
                setLoadingPopup(false);
            }
        })();
        (async () => {
            try {
                const data = await dashboardApi.getPoolStatus();
                setPoolStatus(data ?? null);
            } catch {
                setPoolStatus(null);
            } finally {
                setLoadingPoolStatus(false);
            }
        })();
        (async () => {
            try {
                const cfg = await projectApi.getIncomeConfig();
                setIncomeConfig((cfg as any)?.data ?? cfg ?? null);
            } catch {
                setIncomeConfig(null);
            }
        })();
    }, []);

    const fetchProfile = async () => {
        try {
            const profileRes = await userApi.getProfile();
            if (!profileRes) return;
            setDashboardUser((prev) => ({
                ...prev,
                userId: profileRes.userId,
                name: profileRes.name || profileRes.fullName || '',
                email: profileRes.email,
                phone: profileRes.phone || '',
                status: profileRes.status,
                rank: profileRes.rank,
                sponsorId: profileRes.sponsorId,
                joinedAt: profileRes.joinedAt || profileRes.joinDate || '',
            }));
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchWallet = async () => {
        try {
            const walletRes = await walletApi.getWalletState();
            if (!walletRes) return;
            setWallet({
                balance: walletRes.wallet.balance,
                availableBalance: walletRes.wallet.availableBalance,
                totalDeposited: walletRes.wallet.totalDeposited ?? walletRes.summary.totalDeposit ?? 0,
                totalWithdrawn: walletRes.wallet.totalWithdrawn,
                totalEarned: walletRes.wallet.totalEarned,
            });
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setLoadingWallet(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const packagesRes = await packageApi.getMyPackages();
            if (!packagesRes) return;
            setPackages({
                active: packagesRes.packages.active,
                total: packagesRes.packages.total,
                activePackages: packagesRes.packages.items,
            });
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        } finally {
            setLoadingPackages(false);
        }
    };

    const fetchIncome = async () => {
        try {
            const incomeRes = await incomeApi.getIncomeOverview();
            if (!incomeRes) return;
            setIncome({
                totalEarned: incomeRes.totalEarned,
                todayIncome: incomeRes.todayIncome,
                yesterdayIncome: incomeRes.yesterdayIncome,
                totalPending: incomeRes.overview.overall.totalPending,
                totalApproved: incomeRes.overview.overall.totalApproved,
                totalPaid: incomeRes.overview.overall.totalPaid,
                byType: [
                    ...incomeRes.overview.commissions.byType,
                    ...incomeRes.overview.transactions.byType.map((t) => ({
                        type: t.type,
                        totalAmount: t.totalAmount,
                        count: t.count,
                        pendingAmount: t.pendingAmount,
                        approvedAmount: t.processedAmount,
                        paidAmount: t.processedAmount,
                    })),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch income:', error);
        } finally {
            setLoadingIncome(false);
        }
    };

    const fetchTeamStats = async () => {
        try {
            const teamRes = await teamApi.getTeamStats();
            setNetwork({
                downlineCount: teamRes?.stats?.directReferrals ?? 0,
                sponsorId: teamRes?.sponsorId,
            });
            if (teamRes?.directReferrals) {
                setDirectReferrals(teamRes.directReferrals);
            }
        } catch (error) {
            console.error('Failed to fetch team stats:', error);
        } finally {
            setLoadingTeamStats(false);
        }
    };

    const fetchCappingTracking = async () => {
        try {
            const data = await userApi.getCappingTracking();
            setCappingData(data);
        } catch (error) {
            console.error('Failed to fetch capping tracking:', error);
        } finally {
            setLoadingCapping(false);
        }
    };

    const referralLink = `${siteOrigin}/register?sponsor=${dashboardUser?.userId || ''}`;

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8 sm:pb-12 lg:pb-16 overflow-x-hidden min-w-0">
            <DashboardPopup popup={dashboardPopup} loading={loadingPopup} />

            {/* Keep banners at very top */}
            <BannerCarousel banners={banners} loading={loadingBanners} className="w-full rounded-2xl overflow-hidden" />

            {/* Dashboard media uploaded from project-admin settings */}
            <DashboardMediaStrip items={dashboardMedia} loading={loadingDashboardMedia} />

            {/* 1. Welcome Header (Grows full width) */}
            <DashboardWelcomeCard user={dashboardUser} loading={loadingProfile} />

            {/* 2. Overview Stats Row (Grows full width) */}
            <OverviewStats wallet={wallet} income={income} loading={loadingWallet || loadingIncome} />

            {/* Quick Actions at the top for Mobile viewports */}
            <div className="block lg:hidden mt-2">
                <QuickActions />
            </div>

            {/* Main 12-Column Responsive Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
                {/* Left Area - Main Analytics & Staking Metrics (Col span 8) */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    <DashboardIncomeOverview income={income} cappingData={cappingData} loading={loadingIncome} />
                    
                    <DashboardCappingTracker cappingData={cappingData} loading={loadingCapping} />
                    
                    <DashboardRoyaltyTracker poolStatus={poolStatus} incomeConfig={incomeConfig} loading={loadingPoolStatus} />
                    
                    <DashboardGlobalPools globalWallets={globalWallets} loading={loadingGlobalWallets} />
                    
                    <DashboardPoolStatus poolStatus={poolStatus} loading={loadingPoolStatus} incomeConfig={incomeConfig} />
                </div>

                {/* Right Area - Operational Panels & Sponsor Actions (Col span 4) */}
                <div className="lg:col-span-4 space-y-6 min-w-0">
                    {/* Desktop-only Quick Actions in sidebar */}
                    <div className="hidden lg:block">
                        <QuickActions />
                    </div>
                    
                    <DashboardReferEarn
                        referralLink={referralLink}
                        dashboardUser={dashboardUser}
                        downlineCount={network.downlineCount ?? 0}
                        directReferrals={directReferrals}
                        incomeByType={income.byType}
                        teamLoading={loadingTeamStats}
                    />
                    
                    <DashboardPackages activePackages={packages.activePackages} loading={loadingPackages} />
                    
                    <OffersSection offers={offers} loading={loadingOffers} />
                </div>
            </div>
        </div>
    );
}
