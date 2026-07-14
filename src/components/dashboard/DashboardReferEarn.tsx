'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Share2, Users, Check, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import ReferralQRCode from './ReferralQRCode';
import toast from 'react-hot-toast';

function TeamStatSkeleton({ loading, children, skeletonClassName }: { loading: boolean; children: React.ReactNode; skeletonClassName?: string }) {
  if (loading) {
    return <span className={`inline-block animate-pulse rounded bg-gray-200 dark:bg-white/20 ${skeletonClassName ?? 'h-5 w-12'}`} aria-hidden="true" />;
  }
  return <>{children}</>;
}

interface DashboardUser {
  userId: string;
  sponsorId?: string | { name?: string } | null;
}

interface IncomeByType {
  type: string;
  totalAmount?: number;
}

export default function DashboardReferEarn({
  referralLink,
  dashboardUser,
  downlineCount,
  incomeByType,
  teamLoading = false,
}: {
  referralLink: string;
  dashboardUser: DashboardUser;
  downlineCount: number;
  incomeByType: IncomeByType[];
  teamLoading?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me!', text: `Join using my referral link: ${referralLink}`, url: referralLink });
      } catch { copyReferralLink(); }
    } else { copyReferralLink(); }
  };

  const sponsorName =
    dashboardUser.sponsorId && typeof dashboardUser.sponsorId === 'object' && 'name' in dashboardUser.sponsorId
      ? dashboardUser.sponsorId.name
      : typeof dashboardUser.sponsorId === 'string' && dashboardUser.sponsorId
      ? dashboardUser.sponsorId
      : 'Direct';

  const referralIncome = incomeByType
    .filter(i => i.type.toLowerCase().includes('referral'))
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,229,160,0.12)' }}>
          <Sparkles size={17} style={{ color: 'var(--pw-primary)' }} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Refer & Earn
          </h2>
          <p className="text-[11px] opacity-40 text-[var(--foreground)] mt-0.5">
            Share your link — earn when they join
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-px bg-[var(--border)] rounded-xl overflow-hidden">
          <div className="bg-[var(--background)] px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] font-semibold">Referrals</p>
            <TeamStatSkeleton loading={teamLoading} skeletonClassName="h-7 w-14 bg-[var(--surface-elevated)]">
              <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pw-primary)' }}>{downlineCount || 0}</p>
            </TeamStatSkeleton>
          </div>
          <div className="bg-[var(--background)] px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] font-semibold">User ID</p>
            <p className="text-sm font-bold text-[var(--foreground)] truncate">{dashboardUser.userId}</p>
          </div>
          <div className="bg-[var(--background)] px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide opacity-40 text-[var(--foreground)] font-semibold">Sponsor</p>
            <p className="text-sm font-bold text-[var(--foreground)] truncate">{sponsorName}</p>
          </div>
        </div>

        {/* Referral income highlight */}
        {referralIncome > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>
            <TrendingUp size={16} style={{ color: 'var(--pw-primary)' }} />
            <p className="text-sm text-[var(--foreground)] opacity-70">Referral income earned</p>
            <p className="ml-auto text-sm font-bold tabular-nums" style={{ color: 'var(--pw-primary)' }}>
              {formatCurrency(referralIncome)}
            </p>
          </div>
        )}

        {/* ── QR + link row ─────────────────────────────────────── */}
        <div className="flex gap-4 items-start">

          {/* QR code */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="p-2.5 rounded-xl border border-[var(--border)] bg-white">
              <ReferralQRCode value={referralLink} size={100} />
            </div>
            <p className="text-[10px] opacity-40 text-[var(--foreground)]">Scan to join</p>
          </div>

          {/* Link + buttons */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {/* Link input */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <p className="text-xs text-[var(--foreground)] opacity-50 truncate flex-1 min-w-0">
                {referralLink}
              </p>
            </div>

            {/* Copy button */}
            <button
              onClick={copyReferralLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: copied ? 'rgba(0,229,160,0.15)' : 'var(--pw-primary)',
                color: copied ? 'var(--pw-primary)' : '#050508',
                border: copied ? '1px solid rgba(0,229,160,0.4)' : 'none',
              }}
            >
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
            </button>

            {/* Share + Team */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareReferralLink}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(0,229,160,0.12)', color: 'var(--pw-primary)' }}
              >
                <Share2 size={13} /> Share
              </button>
              <Link
                href="/team"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
              >
                <Users size={13} /> My Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}