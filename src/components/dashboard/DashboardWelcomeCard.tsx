'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Sparkles, Copy, ArrowUpRight, Zap, Check, Award } from 'lucide-react';
import UserProfileImage from '@/components/ui/UserProfileImage';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface DashboardUser {
  name: string;
  userId?: string;
  rank?: string;
  sponsorId?: string | { name?: string; userId?: string; email?: string } | null;
}

export interface DashboardWelcomeCardProps {
  user: DashboardUser;
  loading?: boolean;
}

export default function DashboardWelcomeCard({ user, loading = false }: DashboardWelcomeCardProps) {
  const [greeting, setGreeting] = useState('Welcome back');
  const [localTime, setLocalTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const sponsorName =
    user.sponsorId && typeof user.sponsorId === 'object' && 'name' in user.sponsorId
      ? user.sponsorId.name
      : typeof user.sponsorId === 'string' && user.sponsorId
      ? user.sponsorId
      : 'Direct Sponsor';

  const copySponsorId = () => {
    if (!user.userId) return;
    navigator.clipboard.writeText(user.userId);
    setCopied(true);
    toast.success(`User ID ${user.userId} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8 animate-pulse shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[var(--surface)] shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-4 w-32 bg-[var(--surface)] rounded-md" />
            <div className="h-8 w-60 bg-[var(--surface)] rounded-lg" />
            <div className="h-4 w-44 bg-[var(--surface)] rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#12192c] via-[#1a233b] to-[#0f172a] p-6 sm:p-8 relative overflow-hidden text-white shadow-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] group">
      {/* Luxurious Glowing Mesh Background Orbs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      {/* Card Header Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Profile Avatar & Greeting Information */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
          {/* Avatar with Metallic Golden Glow */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-600 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-105">
              <UserProfileImage
                src={(user as any)?.profilePicture}
                alt={user.name}
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-full border-2 border-[#12192c] bg-[#12192c]"
              />
            </div>
            <span
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#12192c] flex items-center justify-center shadow-lg"
              title="Active Member"
            >
              <ShieldCheck className="text-white" size={13} strokeWidth={3} />
            </span>
          </div>

          {/* Text Information */}
          <div className="min-w-0 flex-1">
            {/* Rank & ID Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                <Sparkles size={11} className="text-amber-400" />
                {user.rank || 'MEMBER RANK'}
              </span>
              <button
                type="button"
                onClick={copySponsorId}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-colors"
                title="Click to copy User ID"
              >
                <span>ID: <span className="font-mono text-amber-300 font-bold">{user.userId || 'N/A'}</span></span>
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={10} className="opacity-70" />}
              </button>
            </div>

            {/* Main Greeting */}
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight flex flex-wrap items-center gap-x-2 text-white">
              <span className="opacity-90">{greeting},</span>
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-black drop-shadow-sm">
                {user.name || 'Partner'}
              </span>
            </h1>

            {/* Subtitle Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="opacity-60">Sponsor:</span>
                <span className="font-bold text-amber-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  {sponsorName}
                </span>
              </span>
              {localTime && (
                <span className="flex items-center gap-1 opacity-75">
                  <Clock size={12} className="text-amber-400" />
                  <span className="font-mono tabular-nums">{localTime}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action CTA Group inside Hero Header */}
        <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <Link
            href="/packages"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-600 shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Zap size={14} className="fill-slate-950" /> Upgrade Package
          </Link>
          <Link
            href="/genealogy"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md transition-all active:scale-[0.98] min-h-[44px]"
          >
            My Tree <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
