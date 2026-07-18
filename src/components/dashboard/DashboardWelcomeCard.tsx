'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import UserProfileImage from '@/components/ui/UserProfileImage';
import { APP_CONSTANTS } from '@/constants';

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
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const messages = [
    `Hi ${user.name || 'User'}! Ready to scale your network today? 🚀`,
    'Tip: Active referrals boost capping multiplier! 📈',
    'Browse the Smart Store to unlock premium packages! 🛒',
    `Time: ${localTime || '--:--'} — check pool deadlines! ⏰`,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [localTime, user.name]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full shimmer-placeholder shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded shimmer-placeholder" />
            <div className="h-5 w-36 rounded shimmer-placeholder" />
          </div>
        </div>
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
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--surface-elevated)] to-[var(--surface)] p-4 md:p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/25">
      {/* Decorative colorful logo-companion background spots */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Profile & Greetings wrapper */}
      <div className="flex items-center gap-3.5 sm:gap-6 min-w-0 z-10 flex-1">
        <div className="relative shrink-0">
          <UserProfileImage
            src={(user as any)?.profilePicture}
            alt={user.name}
            width={88}
            height={88}
            className="!w-[64px] !h-[64px] md:!w-[88px] md:!h-[88px] aspect-square rounded-full border-2 border-blue-500 dark:border-blue-400 p-0.5 bg-[var(--surface)] shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-transform duration-300 hover:scale-105"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border border-[var(--surface-elevated)] flex items-center justify-center shadow" title="Active Member">
            <ShieldCheck className="text-white" size={9} strokeWidth={3} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Top Line Badges - Desktop only */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">My Account</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
            <span className="text-[10px] font-extrabold text-[var(--muted-foreground)] tracking-wider">
              ID: <span className="font-mono text-blue-600 dark:text-blue-400">{user.userId || 'N/A'}</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
              Active Member
            </span>
          </div>
          
          {/* Main Greeting - Responsive sizing */}
          <h1 className="text-lg md:text-3xl font-black text-[var(--foreground)] tracking-tight leading-tight flex flex-wrap items-center gap-x-1.5">
            <span className="opacity-95">{greeting},</span> 
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 dark:from-blue-400 dark:via-purple-400 dark:to-rose-400 bg-clip-text text-transparent font-black">
              {user.name}
            </span>
          </h1>

          {/* Subtitle Badges - Mobile Only for clean vertical reduction */}
          <div className="flex md:hidden items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-extrabold text-[var(--muted-foreground)] tracking-wider">
              ID: <span className="font-mono text-blue-655 dark:text-blue-400">{user.userId || 'N/A'}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)] opacity-60" />
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              Active Member
            </span>
          </div>
          
          {/* Detailed Row - Desktop Only */}
          <div className="mt-2.5 hidden md:flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-[var(--muted-foreground)] text-xs flex items-center gap-1.5">
              <span>Sponsor:</span>
              <span className="font-semibold text-[var(--foreground)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">{sponsorName}</span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
              <Clock size={12} className="text-blue-500" />
              <span>Time: <span className="font-semibold text-[var(--foreground)] tabular-nums">{localTime || '--:--'}</span></span>
            </div>
          </div>

          {/* Sponsor text - Mobile Only (Simple line) */}
          <p className="text-[var(--muted-foreground)] text-[10px] mt-1 md:hidden truncate font-medium">
            Sponsor: <span className="text-[var(--foreground)] font-semibold">{sponsorName}</span>
          </p>
        </div>
      </div>

      {/* Desktop Mascot Section */}
      <div className="relative hidden md:flex items-end justify-end h-36 w-36 shrink-0 self-end z-20 -mr-2 -mb-4 overflow-visible">
        {/* Speech Bubble with clean fadeInLeft animation trigger */}
        <div key={msgIndex} className="absolute right-[9.5rem] bottom-10 bg-[var(--surface-elevated)] text-[10px] font-extrabold text-[var(--foreground)] px-3.5 py-2.5 rounded-2xl border border-blue-500/20 shadow-xl select-none w-36 leading-relaxed transition-all duration-300 animate-fade-in-left">
          {messages[msgIndex]}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[4px] rotate-45 w-2 h-2 bg-[var(--surface-elevated)] border-r border-t border-blue-500/20" />
        </div>

        {/* Circular Mascot Frame to contain white background */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500/20 bg-white shadow-xl flex items-center justify-center">
          <img
            src={APP_CONSTANTS.ASSETS.MASCOT}
            alt="Smart Bazar Guide"
            className="w-full h-full object-cover scale-125 translate-y-[6px]"
          />
        </div>
      </div>

      {/* Mobile Mascot Notification Banner (Horizontal, alert-style, no overlap) */}
      <div className="mt-2.5 flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] dark:bg-white/[0.01] border border-[var(--border)] md:hidden z-10 w-full shadow-inner">
        {/* Circular Mascot Frame for mobile */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-blue-500/20 bg-white shrink-0 shadow-sm flex items-center justify-center">
          <img
            src={APP_CONSTANTS.ASSETS.MASCOT}
            alt="Smart Bazar Guide"
            className="w-full h-full object-cover scale-125 translate-y-[2px]"
          />
        </div>
        <div key={`mob-${msgIndex}`} className="flex-1 min-w-0 text-[10.5px] font-bold text-[var(--foreground)] opacity-95 leading-normal animate-fade-in-left">
          {messages[msgIndex]}
        </div>
      </div>
    </div>
  );
}
