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
  directReferrals = [],
  incomeByType,
  teamLoading = false,
}: {
  referralLink: string;
  dashboardUser: DashboardUser;
  downlineCount: number;
  directReferrals?: any[];
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

  // Compute binary node distribution
  const leftCount = directReferrals.filter(d => d.placement?.position === 'left').length;
  const rightCount = directReferrals.filter(d => d.placement?.position === 'right').length;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20"
          style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
          <Sparkles size={18} className="text-primary" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-base font-black text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-sans)' }}>
            Refer & Earn
          </h2>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
            Share your link — earn direct referral commissions
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/10 hover:bg-white/[0.04] transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">Referrals</p>
            <TeamStatSkeleton loading={teamLoading} skeletonClassName="h-5 w-12 bg-white/5 shimmer-placeholder mt-1">
              <p className="text-base font-black text-primary tabular-nums mt-0.5">{downlineCount || 0}</p>
            </TeamStatSkeleton>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/10 hover:bg-white/[0.04] transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">User ID</p>
            <p className="text-xs font-black text-[var(--foreground)] mt-1 truncate">{dashboardUser.userId}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/10 hover:bg-white/[0.04] transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">Sponsor</p>
            <p className="text-xs font-black text-[var(--foreground)] mt-1 truncate">{sponsorName}</p>
          </div>
        </div>

        {/* Binary Node Placements */}
        <div className="border border-[var(--border)] rounded-xl bg-black/5 dark:bg-black/15 p-3.5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Binary Placements Node</p>
          <div className="flex items-center gap-4">
            {/* Left Node */}
            <div className="flex-1 rounded-lg border border-white/5 bg-[var(--surface)] p-2 text-center">
              <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-bold">Left Node</p>
              <p className="text-base font-black text-primary tabular-nums mt-0.5">{leftCount} Directs</p>
            </div>
            <div className="h-6 w-px bg-[var(--border)]" />
            {/* Right Node */}
            <div className="flex-1 rounded-lg border border-white/5 bg-[var(--surface)] p-2 text-center">
              <p className="text-[9px] text-[var(--muted-foreground)] uppercase font-bold">Right Node</p>
              <p className="text-base font-black text-primary tabular-nums mt-0.5">{rightCount} Directs</p>
            </div>
          </div>
        </div>

        {/* Referral income highlight */}
        {referralIncome > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--primary)]/15"
            style={{ backgroundColor: 'rgba(212,175,55,0.06)' }}>
            <TrendingUp size={16} className="text-primary" />
            <p className="text-xs text-[var(--foreground)] opacity-70">Referral Commissions</p>
            <p className="ml-auto text-sm font-black tabular-nums text-primary">
              {formatCurrency(referralIncome)}
            </p>
          </div>
        )}

        {/* ── QR + link row ─────────────────────────────────────── */}
        <div className="flex gap-4 items-start">

          {/* QR code */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-inner">
              <ReferralQRCode value={referralLink} size={80} className="border-0 bg-transparent p-0" />
            </div>
            <p className="text-[9px] text-[var(--muted-foreground)] font-bold">Scan to register</p>
          </div>

          {/* Link + buttons */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {/* Link input */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-black/5 dark:bg-black/15">
              <p className="text-xs text-[var(--foreground)] opacity-50 truncate flex-1 min-w-0 font-mono">
                {referralLink}
              </p>
            </div>

            {/* Copy button */}
            <button
              onClick={copyReferralLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border border-[var(--primary)]/20 text-primary bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 shadow-sm"
            >
              {copied ? <><Check size={14} /> Link Copied!</> : <><Copy size={14} /> Copy Sponsor Link</>}
            </button>

            {/* Share + Team */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareReferralLink}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border border-white/5 bg-white/5 hover:bg-white/10 text-[var(--foreground)] transition-colors"
              >
                <Share2 size={12} /> Share
              </button>
              <Link
                href="/team"
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--border)] text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
              >
                <Users size={12} /> Directs List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}