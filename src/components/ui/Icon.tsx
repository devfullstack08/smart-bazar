'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';

const sizeClasses = {
  16: 'w-4 h-4',
  20: 'w-5 h-5',
  24: 'w-6 h-6',
  32: 'w-8 h-8',
} as const;

type IconSize = keyof typeof sizeClasses;

export interface IconProps {
  /** Icon element (e.g. Lucide icon). */
  children: ReactNode;
  /** Line (stroke, default) or gradient filled. */
  variant?: 'line' | 'gradient';
  /** Size in px. Use 16, 20, 24, or 32 for 8px grid. */
  size?: IconSize;
  /** Extra class names for the wrapper. */
  className?: string;
}

/**
 * Wrapper for consistent iconography: line (default) or gradient filled.
 * Use line for nav/lists; use gradient for primary actions and hero icons.
 * Design system: §7.6 (DESIGN_SYSTEM.md).
 * Gradient uses global defs #brand-icon-gradient (see globals.css).
 */
export default function Icon({
  children,
  variant = 'line',
  size = 20,
  className = '',
}: IconProps) {
  const sizeClass = sizeClasses[size];
  const baseClass = `inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`;

  if (variant === 'line') {
    return (
      <span
        className={`${baseClass} text-[var(--muted-foreground)] [&_svg]:w-full [&_svg]:h-full [&_svg]:stroke-[1.5]`}
        style={{ color: 'var(--muted-foreground)' }}
      >
        {children}
      </span>
    );
  }

  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: 'icon-gradient-svg [&_svg]:w-full [&_svg]:h-full [&_svg]:stroke-[1.5]',
      })
    : children;

  return <span className={`${baseClass} icon-gradient`}>{child}</span>;
}
