'use client';

import Link from 'next/link';
import { Wallet, TrendingUp, Package, Users, GitBranch, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

interface OverviewStatsProps {
  wallet: {
    availableBalance?: number;
    balance?: number;
    totalEarned: number;
    totalDeposited?: number;
    totalWithdrawn: number;
  };
  income: {
    todayIncome?: number;
    yesterdayIncome?: number;
  };
  activePackageValue?: number;
  directCount?: number;
  teamCount?: number;
  loading?: boolean;
}

export default function OverviewStats({
  wallet,
  income,
  activePackageValue = 0,
  directCount = 0,
  teamCount = 0,
  loading = false
}: OverviewStatsProps) {
  const available = wallet.availableBalance ?? wallet.balance ?? 0;
  const locked = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 space-y-3 shimmer-placeholder h-32" />
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 space-y-3 shimmer-placeholder h-32" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Earnings",
      value: formatCurrency(wallet.totalEarned),
      subtext: `Today: ${formatCurrency(income.todayIncome ?? 0)}`,
      icon: TrendingUp,
      glowColor: 'rgba(16, 185, 129, 0.05)', // Emerald Green
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      bgTheme: 'from-emerald-500/5',
      href: '/income'
    },
    {
      label: 'Active Packages',
      value: formatCurrency(activePackageValue),
      subtext: activePackageValue > 0 ? 'Staked & Earning' : 'No Active Packages',
      icon: Package,
      glowColor: 'rgba(245, 158, 11, 0.05)', // Amber Yellow
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      bgTheme: 'from-amber-500/5',
      href: '/packages'
    },
    {
      label: 'Direct Partners',
      value: String(directCount),
      subtext: 'Personally Sponsored',
      icon: Users,
      glowColor: 'rgba(139, 92, 246, 0.05)', // Violet Purple
      textColor: 'text-violet-600 dark:text-violet-400',
      borderColor: 'rgba(139, 92, 246, 0.2)',
      bgTheme: 'from-violet-500/5',
      href: '/team'
    },
    {
      label: 'Total Downlines',
      value: String(teamCount),
      subtext: 'Whole Network Size',
      icon: GitBranch,
      glowColor: 'rgba(244, 63, 94, 0.05)', // Rose Red
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'rgba(244, 63, 94, 0.2)',
      bgTheme: 'from-rose-500/5',
      href: '/genealogy'
    }
  ];

  return (
    <div className="space-y-4 min-w-0">
      {/* 1. Hero Available Balance Banner Card */}
      <div 
        className="rounded-2xl border p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-blue-600/10 via-[var(--surface-elevated)] to-indigo-600/10"
        style={{ 
          borderColor: 'rgba(37, 99, 235, 0.25)'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 min-w-0 z-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
            <Wallet size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">
                Available Wallet Balance
              </span>
              {locked > 0 ? (
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Locked: {formatCurrency(locked)}
                </span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Fully Available
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 truncate mt-0.5 tabular-nums">
              {formatCurrency(available)}
            </p>
          </div>
        </div>

        {/* Action Buttons inside Balance Hero Card */}
        <div className="flex items-center gap-2.5 sm:gap-3 z-10 shrink-0">
          <Link
            href="/wallet?tab=deposit"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-[0.98] min-h-[40px]"
          >
            Deposit Funds <ArrowRight size={13} />
          </Link>
          <Link
            href="/wallet?tab=withdraw"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--foreground)] transition-all min-h-[40px]"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* 2. 4-Grid Core MLM Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.label}
              className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-br ${item.bgTheme} via-[var(--surface-elevated)] to-[var(--surface-elevated)] group`}
              style={{ 
                borderColor: item.borderColor
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                  <Icon size={16} className={item.textColor} />
                </div>
                <ArrowRight size={12} className="text-[var(--muted-foreground)] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              
              <div className="min-w-0 mt-2">
                <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold truncate">
                  {item.label}
                </p>
                <p className={`text-lg sm:text-2xl font-black ${item.textColor} truncate mt-0.5 tabular-nums`}>
                  {item.value}
                </p>
                <p className="text-[9px] font-medium text-[var(--muted-foreground)] mt-0.5 truncate">
                  {item.subtext}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
