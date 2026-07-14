'use client';

import Link from 'next/link';
import Image from 'next/image';
import { APP_CONSTANTS } from '@/constants';

const ACTIONS = [
  { href: '/packages', img: APP_CONSTANTS.ASSETS.QUICK_STORE,     label: 'Bazar Store' },
  { href: '/wallet',   img: APP_CONSTANTS.ASSETS.QUICK_DEPOSIT,   label: 'Deposit' },
  { href: '/wallet',   img: APP_CONSTANTS.ASSETS.QUICK_WITHDRAW,  label: 'Withdraw' },
  { href: '/team',     img: APP_CONSTANTS.ASSETS.QUICK_TEAM,      label: 'My Team' },
  { href: '/support',  img: APP_CONSTANTS.ASSETS.QUICK_SUPPORT,   label: 'Support' },
] as const;

export default function QuickActions() {
  return (
    <div className="w-full min-w-0 py-1 lg:py-5 lg:px-4 lg:rounded-2xl lg:border lg:border-[var(--border)] lg:bg-[var(--surface-elevated)] lg:shadow-md lg:backdrop-blur-sm transition-all duration-300">
      {/* 5-Column Grid: Completely borderless and transparent background, industry-grade styling */}
      <div className="grid w-full grid-cols-5 gap-1.5 sm:gap-2.5 min-w-0">
        {ACTIONS.map(({ href, img, label }) => (
          <Link
            key={label}
            href={href}
            className="group flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 py-2 rounded-2xl
                       hover:bg-white/[0.03] active:scale-95 touch-manipulation min-touch
                       transition-all duration-200 ease-out"
          >
            {/* Minimalist Borderless Icon wrapper */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 relative">
              <Image
                src={img}
                alt={label}
                width={48}
                height={48}
                unoptimized
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight text-[var(--foreground)] opacity-85 group-hover:opacity-100 transition-opacity px-0.5">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}