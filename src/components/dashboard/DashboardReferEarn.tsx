'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Share2, Users, Check, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import ReferralQRCode from './ReferralQRCode';
import toast from 'react-hot-toast';

function TeamStatSkeleton({ loading, children, skeletonClassName }: { loading: boolean; children: React.ReactNode; skeletonClassName?: string }) {
  if (loading) {
    return <span className={`inline-block animate-pulse rounded bg-[var(--border)] ${skeletonClassName ?? 'h-5 w-12'}`} aria-hidden="true" />;
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10">
          <Sparkles size={18} className="text-primary" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Refer & Earn
          </h2>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            Share your link — earn direct referral commissions
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/20 hover:bg-[var(--surface)]/70 transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">Referrals</p>
            <TeamStatSkeleton loading={teamLoading} skeletonClassName="h-5 w-12 bg-[var(--border)] mt-1">
              <p className="text-base font-black text-primary tabular-nums mt-0.5">{downlineCount || 0}</p>
            </TeamStatSkeleton>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/20 hover:bg-[var(--surface)]/70 transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">User ID</p>
            <p className="text-xs font-black text-[var(--foreground)] mt-1 truncate">{dashboardUser.userId}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 flex flex-col gap-0.5 hover:border-[var(--primary)]/20 hover:bg-[var(--surface)]/70 transition-all duration-200">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold">Sponsor</p>
            <p className="text-xs font-black text-[var(--foreground)] mt-1 truncate">{sponsorName}</p>
          </div>
        </div>

        {/* Binary Node Placements Diagram */}
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] text-center">Referral Placements Node</p>
          
          <div className="flex flex-col items-center relative">
            {/* Root Node (You) */}
            <div className="w-12 h-12 rounded-full border border-primary/30 bg-[var(--surface-elevated)] shadow-sm shadow-primary/10 flex items-center justify-center text-primary font-bold text-xs z-10">
              YOU
            </div>
            
            {/* SVG Connecting Tree Lines */}
            <div className="absolute top-6 w-full h-8 flex justify-center pointer-events-none">
              <svg className="w-1/2 h-full" viewBox="0 0 100 40" fill="none">
                <path d="M50 0 L15 35" stroke="var(--border)" strokeWidth="2" strokeDasharray="3,3" />
                <path d="M50 0 L85 35" stroke="var(--border)" strokeWidth="2" strokeDasharray="3,3" />
              </svg>
            </div>
            
            {/* Placements Leaves Grid */}
            <div className="grid grid-cols-2 gap-8 w-full mt-4">
              {/* Left Leaf Card */}
              <div className="flex flex-col items-center p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-center shadow-inner hover:border-primary/10 transition-colors">
                <p className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider font-bold">Left Placements</p>
                <p className="text-sm font-black text-primary tabular-nums mt-1">{leftCount} Directs</p>
              </div>
              {/* Right Leaf Card */}
              <div className="flex flex-col items-center p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-center shadow-inner hover:border-primary/10 transition-colors">
                <p className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider font-bold">Right Placements</p>
                <p className="text-sm font-black text-primary tabular-nums mt-1">{rightCount} Directs</p>
              </div>
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all btn btn-primary shadow-sm"
            >
              {copied ? <><Check size={14} /> Link Copied!</> : <><Copy size={14} /> Copy Sponsor Link</>}
            </button>

            {/* Share + Team */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareReferralLink}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--foreground)] transition-colors"
              >
                <Share2 size={12} /> Share
              </button>
              <Link
                href="/team"
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
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