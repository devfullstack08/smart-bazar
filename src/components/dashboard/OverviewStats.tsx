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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 min-w-0">
      {/* 1. Hero Available Balance Card - Blue/Indigo Accent */}
      <div 
        className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border p-5 relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group bg-gradient-to-br from-blue-500/5 via-[var(--surface-elevated)] to-[var(--surface-elevated)]"
        style={{ 
          borderColor: 'rgba(37, 99, 235, 0.22)'
        }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-blue-500/20 bg-blue-500/10">
            <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
          >
            Wallet <ArrowRight size={10} />
          </Link>
        </div>
        
        <div className="mt-2 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">
            Available Balance
          </p>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 truncate mt-0.5 tabular-nums">
            {formatCurrency(available)}
          </p>
          {locked > 0 ? (
            <p className="text-[8px] font-medium text-amber-600 dark:text-amber-500 mt-0.5 truncate flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Locked: {formatCurrency(locked)}
            </p>
          ) : (
            <p className="text-[8px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5 truncate flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Fully Unlocked
            </p>
          )}
        </div>
      </div>

      {/* 2. Map other MLM core stats */}
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.label}
            className={`col-span-1 rounded-2xl border p-5 relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-br ${item.bgTheme} via-[var(--surface-elevated)] to-[var(--surface-elevated)]`}
            style={{ 
              borderColor: item.borderColor
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-full blur-2xl pointer-events-none" />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <Icon size={16} className={item.textColor} />
            </div>
            
            <div className="min-w-0 mt-2">
              <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">
                {item.label}
              </p>
              <p className={`text-xl font-black ${item.textColor} truncate mt-0.5 tabular-nums`}>
                {item.value}
              </p>
              <p className="text-[8px] font-medium text-[var(--muted-foreground)] mt-0.5 truncate">
                {item.subtext}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
