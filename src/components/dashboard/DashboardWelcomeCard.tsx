'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import UserProfileImage from '@/components/ui/UserProfileImage';

interface DashboardUser {
  name: string;
  userId?: string;
  sponsorId?: string | { name?: string; userId?: string; email?: string } | null;
}

export interface DashboardWelcomeCardProps {
  user: DashboardUser;
  loading?: boolean;
}

export default function DashboardWelcomeCard({ user, loading = false }: DashboardWelcomeCardProps) {
  const [greeting, setGreeting] = useState('Welcome back');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full shimmer-placeholder shrink-0" />
          <div className="space-y-2">
            <div className="h-3 w-28 rounded shimmer-placeholder" />
            <div className="h-7 w-48 rounded shimmer-placeholder" />
          </div>
        </div>
        <div className="h-10 w-40 rounded-xl shimmer-placeholder shrink-0" />
      </div>
    );
  }

  const sponsorName =
    user.sponsorId && typeof user.sponsorId === 'object' && 'name' in user.sponsorId
      ? user.sponsorId.name
      : typeof user.sponsorId === 'string' && user.sponsorId
      ? user.sponsorId
      : 'Direct Sponsor';

  return (
    <div className="rounded-2xl border border-white/10 welcome-card-banner p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-2xl hover:border-[var(--primary)]/30">
      {/* Decorative luxury background elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--primary)]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Profile & Greetings */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0 z-10">
        <div className="relative shrink-0">
          <UserProfileImage
            src={(user as any)?.profilePicture}
            alt={user.name}
            width={72}
            height={72}
            className="rounded-2xl border-2 border-[var(--primary)]/30 p-0.5 bg-black/40 shadow-inner shadow-black/80 transition-transform duration-300 hover:scale-105"
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--surface-elevated)] flex items-center justify-center shadow-lg" title="Active Node">
            <ShieldCheck className="text-white" size={11} strokeWidth={3} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">My Account</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-extrabold text-white/90 tracking-wider">
              ID: <span className="font-mono text-[var(--primary-light)]">{user.userId || 'N/A'}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Active Node
            </span>
          </div>
          
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-2 flex flex-wrap items-center gap-x-2">
            <span>{greeting},</span> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-light)] via-white to-[var(--primary-light)] filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]">
              {user.name}
            </span>
          </h1>
          
          <p className="text-white/60 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
            <span>Sponsor:</span>
            <span className="font-semibold text-white/90 bg-white/5 px-2 py-0.5 rounded border border-white/5">{sponsorName}</span>
          </p>
        </div>
      </div>

      {/* Clock and Verification badge */}
      <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 z-10 self-stretch justify-between md:justify-end">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/10 shrink-0 shadow-lg">
            <Clock size={18} className="text-[var(--primary)] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-extrabold">Local Time</span>
            <p className="text-lg font-black text-white tracking-tight mt-0.5 tabular-nums">
              {localTime || '--:--'}
            </p>
        </div>
      </div>
    </div>
  </div>
  );
}
