'use client';

import { APP_NAME } from '@/constants/env';

export interface AppBrandProps {
  /** Optional logo URL (for future use). When set, shown before/above the name. */
  logoUrl?: string | null;
  /** Size: affects text size and optional logo. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional class for the wrapper. */
  className?: string;
  /** If true, render as a link to home (e.g. on auth pages). */
  asLink?: boolean;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

/**
 * Single source for app name (and future logo). Use everywhere we display "Smart Bazar"
 * so branding can be updated in one place.
 */
export default function AppBrand({
  logoUrl,
  size = 'md',
  className = '',
  asLink = false,
}: AppBrandProps) {
  const textClass = `font-bold tracking-tight text-[var(--foreground)] ${sizeClasses[size]}`;
  const style = { fontFamily: 'var(--font-display)' } as React.CSSProperties;

  const content = (
    <>
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="h-8 w-auto object-contain mr-2"
          width={32}
          height={32}
        />
      )}
      <span style={style}>{APP_NAME}</span>
    </>
  );

  if (asLink) {
    return (
      <a
        href="/"
        className={`inline-flex items-center ${textClass} hover:opacity-90 transition-opacity ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <span className={`inline-flex items-center ${textClass} ${className}`}>
      {content}
    </span>
  );
}
