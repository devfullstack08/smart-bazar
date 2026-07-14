'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowDownToLine, ArrowUpToLine, Users, MessageCircle } from 'lucide-react';

const ACTIONS = [
  { href: '/packages', icon: ShoppingCart,     label: 'Bazar Store', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
  { href: '/wallet',   icon: ArrowDownToLine,  label: 'Deposit',     bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  { href: '/wallet',   icon: ArrowUpToLine,    label: 'Withdraw',    bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },
  { href: '/team',     icon: Users,            label: 'My Team',     bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  { href: '/support',  icon: MessageCircle,    label: 'Support',     bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
] as const;

export default function QuickActions() {
  return (
    <div className="rounded-2xl premium-card p-4 sm:p-5 border border-[var(--border)] bg-[var(--surface-elevated)] w-full min-w-0">
      {/* Full-width 5-column grid on all breakpoints — avoids horizontal scroll gap on narrow screens */}
      <div className="grid w-full grid-cols-5 gap-1.5 sm:gap-2 min-w-0">
        {ACTIONS.map(({ href, icon: Icon, label, bg, color }) => (
          <Link
            key={label}
            href={href}
            className="group flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 py-2 rounded-xl
                       hover:bg-white/5 active:scale-95 touch-manipulation min-touch
                       transition-all duration-150 ease-out"
          >
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
                         shadow-sm group-hover:scale-105 group-hover:shadow-md
                         transition-all duration-200 shrink-0"
              style={{ backgroundColor: bg }}
            >
              <Icon size={18} className="sm:w-[22px] sm:h-[22px]" style={{ color }} strokeWidth={2} />
            </div>
            <span className="text-[10px] sm:text-[13px] font-medium text-center leading-tight text-[var(--foreground)] opacity-90 px-0.5">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}