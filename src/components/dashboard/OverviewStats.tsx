'use client';

import Link from 'next/link';
import { Wallet, TrendingUp, Package, Users, GitBranch, ArrowUpRight, PlusCircle, ArrowDownLeft } from 'lucide-react';
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
  loading = false,
}: OverviewStatsProps) {
  const available = wallet.availableBalance ?? wallet.balance ?? 0;
  const locked = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 h-36 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Earnings',
      value: formatCurrency(wallet.totalEarned),
      subtext: `Today: +${formatCurrency(income.todayIncome ?? 0)}`,
      icon: TrendingUp,
      accentColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/10',
      href: '/income',
    },
    {
      label: 'Active Packages',
      value: formatCurrency(activePackageValue),
      subtext: activePackageValue > 0 ? 'Staked & Earning ROI' : 'No Active Package',
      icon: Package,
      accentColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/10',
      href: '/packages',
    },
    {
      label: 'Direct Partners',
      value: `${directCount} Directs`,
      subtext: 'Personally Sponsored',
      icon: Users,
      accentColor: 'text-purple-500',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/10',
      href: '/team',
    },
    {
      label: 'Total Network',
      value: `${teamCount} Downlines`,
      subtext: 'Full Binary Team',
      icon: GitBranch,
      accentColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/10',
      href: '/genealogy',
    },
  ];

  return (
    <div className="space-y-4 min-w-0">
      {/* 1. Ultra-Luxurious Hero Digital Vault Card */}
      <div className="rounded-3xl border border-blue-500/25 bg-gradient-to-r from-blue-900/40 via-[var(--surface-elevated)] to-indigo-950/30 p-6 sm:p-7 relative overflow-hidden shadow-xl transition-all duration-300 hover:shadow-[0_15px_40px_rgba(59,130,246,0.15)] group">
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Balance info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-105">
              <Wallet size={28} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                  Available Wallet Vault
                </span>
                {locked > 0 ? (
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Locked: {formatCurrency(locked)}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    100% Unlocked
                  </span>
                )}
              </div>
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-cyan-300 dark:to-emerald-400 font-mono tracking-tight mt-0.5 tabular-nums">
                {formatCurrency(available)}
              </p>
            </div>
          </div>

          {/* Quick CTAs inside Vault Banner */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/wallet?tab=deposit"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] min-h-[44px]"
            >
              <PlusCircle size={15} /> Instant Deposit
            </Link>
            <Link
              href="/wallet?tab=withdraw"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--foreground)] transition-all active:scale-[0.98] min-h-[44px]"
            >
              <ArrowDownLeft size={15} /> Withdraw
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 4-Grid Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.label}
              className={`rounded-3xl border border-[var(--border)] bg-gradient-to-br ${item.glow} via-[var(--surface-elevated)] to-[var(--surface-elevated)] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between h-36 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
            >
              <div className="flex items-center justify-between z-10">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-inner">
                  <Icon size={18} className={item.accentColor} />
                </div>
                <div className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ArrowUpRight size={12} />
                </div>
              </div>

              <div className="min-w-0 mt-3 z-10">
                <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold truncate">
                  {item.label}
                </p>
                <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] truncate mt-0.5 font-mono tabular-nums">
                  {item.value}
                </p>
                <p className="text-[10px] font-semibold text-[var(--muted-foreground)] mt-0.5 truncate opacity-80">
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
