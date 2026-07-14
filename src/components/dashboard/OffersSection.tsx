'use client';

import { Award } from 'lucide-react';
import { OfferCard } from '@/components/ui/OfferCard';
import type { Offer } from '@/types';

export interface OffersSectionProps {
  offers: Offer[];
  loading?: boolean;
}

/** Offers block: section header + grid of OfferCard. */
export default function OffersSection({ offers, loading = false }: OffersSectionProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="h-6 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--pw-primary)]/15 flex items-center justify-center text-[var(--pw-primary)] shrink-0">
          <Award size={20} />
        </div>
        <div>
          <h2
            className="text-lg font-semibold text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Offers
          </h2>
          <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400">
            View your eligible offers
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {offers.map((offer) => (
          <OfferCard key={offer._id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
