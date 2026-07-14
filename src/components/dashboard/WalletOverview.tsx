'use client';

import { Wallet as WalletIcon, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import { getPoolLabel } from '@/lib/utils/incomeLabel';
import type { DashboardData } from '@/types';
import type { PoolBalance } from '@/types';
import { APP_NAME } from '@/constants';

export interface WalletOverviewProps {
  wallet: DashboardData['wallet'];
  packages: DashboardData['packages'];
  investment: DashboardData['investment'];
  income: DashboardData['income'];
  network: DashboardData['network'];
  poolBalances?: PoolBalance[];
}

/** Wallet, Investment, and Income cards + optional Smart Bazar Pools. */
export default function WalletOverview({
  wallet,
  packages,
  investment,
  income,
  network,
  poolBalances = [],
}: WalletOverviewProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Wallet */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)] shrink-0">
              <WalletIcon size={20} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Wallet
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Balance & transactions</p>
            </div>
          </div>
          {Math.max(0, wallet.balance - (wallet.availableBalance ?? wallet.balance)) > 0 && (
            <div className="mb-2 rounded-xl border border-amber-200/80 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-2.5">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {formatCurrency(Math.max(0, wallet.balance - (wallet.availableBalance ?? wallet.balance)))} is locked due to pending withdrawal request(s).
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2 flex-1">
            {[
              { label: 'Balance', value: formatCurrency(wallet.balance) },
              { label: 'Available', value: formatCurrency(wallet.availableBalance ?? wallet.balance) },
              { label: 'Total Deposited', value: formatCurrency(wallet.totalDeposited ?? 0) },
              { label: 'Total Withdrawn', value: formatCurrency(wallet.totalWithdrawn) },
              { label: 'Total Earned', value: formatCurrency(wallet.totalEarned) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums truncate ml-2">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Investment */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)] shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Investment
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Packages & capping</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {[
              { label: 'Total Investment', value: formatCurrency(investment.totalInvestment) },
              { label: 'Today', value: formatCurrency(investment.todayInvestment ?? 0) },
              { label: 'Yesterday', value: formatCurrency(investment.yesterdayInvestment ?? 0) },
              { label: 'Earned from Packages', value: formatCurrency(investment.totalEarnedFromPackages) },
              { label: 'Capping Limit', value: formatCurrency(investment.totalCappingLimit) },
              { label: 'Remaining Capping', value: formatCurrency(investment.totalRemainingCapping) },
              { label: 'Active Packages', value: `${packages.active}/${packages.total}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums truncate ml-2">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Income */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)] shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Income
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Commissions</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {[
              { label: 'Total Earned', value: formatCurrency(income.totalEarned) },
              { label: 'Today', value: formatCurrency(income.todayIncome ?? 0) },
              { label: 'Yesterday', value: formatCurrency(income.yesterdayIncome ?? 0) },
              { label: 'Pending', value: formatCurrency(income.totalPending) },
              { label: 'Approved', value: formatCurrency(income.totalApproved) },
              { label: 'Paid', value: formatCurrency(income.totalPaid) },
              { label: 'Downline Count', value: network.downlineCount },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums truncate ml-2">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Bazar Pools — show when pools exist */}
      {poolBalances.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)] shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {APP_NAME} Pools
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Current pool balances</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {poolBalances.map((pool) => (
              <div
                key={pool.key}
                className="flex flex-col py-3 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <span className="text-xs text-[var(--muted-foreground)]">{getPoolLabel(pool.key)}</span>
                <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums mt-1">
                  {formatCurrency(pool.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
