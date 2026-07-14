'use client';

import Link from 'next/link';
import { Wallet, ArrowDownToLine, ArrowUpToLine, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
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
  loading?: boolean;
}

export default function OverviewStats({ wallet, income, loading = false }: OverviewStatsProps) {
  const available = wallet.availableBalance ?? wallet.balance ?? 0;
  const locked = Math.max(0, (wallet.balance ?? 0) - (wallet.availableBalance ?? wallet.balance ?? 0));

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 space-y-3 shimmer-placeholder h-32" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Today\'s Earnings',
      value: formatCurrency(income.todayIncome ?? 0),
      icon: DollarSign,
      glowColor: 'rgba(16, 185, 129, 0.04)', // emerald
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderStyle: 'border-[var(--border)]'
    },
    {
      label: 'Total Profit',
      value: formatCurrency(wallet.totalEarned),
      icon: TrendingUp,
      glowColor: 'rgba(59, 130, 246, 0.04)', // blue
      textColor: 'text-blue-600 dark:text-blue-400',
      borderStyle: 'border-[var(--border)]'
    },
    {
      label: 'Total Deposited',
      value: formatCurrency(wallet.totalDeposited ?? 0),
      icon: ArrowDownToLine,
      glowColor: 'rgba(245, 158, 11, 0.04)', // amber
      textColor: 'text-amber-600 dark:text-amber-400',
      borderStyle: 'border-[var(--border)]'
    },
    {
      label: 'Total Withdrawn',
      value: formatCurrency(wallet.totalWithdrawn),
      icon: ArrowUpToLine,
      glowColor: 'rgba(107, 114, 128, 0.04)', // gray
      textColor: 'text-zinc-500 dark:text-gray-400',
      borderStyle: 'border-[var(--border)]'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 min-w-0">
      {/* Hero Available Balance Card */}
      <div 
        className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group"
        style={{ 
          background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, var(--surface-elevated) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.25)'
        }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
            <Wallet size={16} className="text-primary" />
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-primary hover:bg-[var(--surface)]/80 transition-all shadow-sm"
          >
            Wallet <ArrowRight size={10} />
          </Link>
        </div>
        
        <div className="mt-2 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">
            Available Balance
          </p>
          <p className="text-xl sm:text-2xl font-black text-primary truncate mt-0.5 tabular-nums">
            {formatCurrency(available)}
          </p>
          {locked > 0 && (
            <p className="text-[8px] font-medium text-amber-600 dark:text-amber-500 mt-0.5 truncate flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Locked: {formatCurrency(locked)}
            </p>
          )}
        </div>
      </div>

      {/* Grid for other stats */}
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div 
            key={item.label}
            className={`col-span-1 sm:col-span-2 lg:col-span-1 rounded-2xl border ${item.borderStyle} bg-[var(--surface-elevated)] p-5 relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
            style={{ background: `linear-gradient(135deg, ${item.glowColor} 0%, var(--surface-elevated) 100%)` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)]">
              <Icon size={16} className={item.textColor} />
            </div>
            
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-extrabold">
                {item.label}
              </p>
              <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] truncate mt-0.5 tabular-nums">
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
