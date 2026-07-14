'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ReferralQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function ReferralQRCode({ value, size = 180, className="" }: ReferralQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    import('qrcode')
      .then((mod) => {
        const QRCode = (mod as { default?: { toDataURL: (t: string, o?: object) => Promise<string> }; toDataURL?: (t: string, o?: object) => Promise<string> }).default ?? mod;
        return QRCode?.toDataURL?.(value, {
          width: size,
          margin: 2,
          color: { dark: '#050508', light: '#ffffff' },
        });
      })
      .then((url) => {
        if (!cancelled && url) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) return null;
  if (!dataUrl) {
    return (
      <div
        className={cn('animate-pulse rounded-xl bg-[var(--surface)]', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code for referral link"
      className={cn('rounded-xl border border-[var(--border)] bg-white', className)}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
