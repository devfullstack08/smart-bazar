'use client';

import Link from 'next/link';
import { ShoppingBag, Star, Shield, ArrowRight, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';

export default function BazarStorePreview() {
  const products = [
    {
      id: 'luxury-box',
      name: 'Smart Bazar Luxury Curations Box',
      price: 1000,
      image: '/assets/images/smart_bazar_product_box.jpg',
      badge: 'Best Seller',
      rating: 4.9,
      reviews: 142,
      description: 'The ultimate store membership pack. Activates 100% store credit and unlocks all binary matching and auto-pool income streams.',
      features: [
        '20% Direct Referral Payouts ($200)',
        '25% Binary Pair Matching ($250)',
        '5% Placement Spillover ($50)',
        '10-Level Upline Auto-Pool',
      ],
      active: true,
      buttonText: 'Buy Now & Activate',
    },
    {
      id: 'voucher-pack',
      name: 'Bazar Shopping Voucher Pack',
      price: 500,
      badge: 'Coming Soon',
      rating: 4.6,
      reviews: 38,
      description: 'Starter credits for premium retail catalog shopping. Perfect for beginning your affiliate pathway.',
      features: [
        '500 Shopping Credits',
        'Partial Referral commissions',
      ],
      active: false,
      buttonText: 'Locked',
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
            <ShoppingBag size={17} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
              Featured Curations
            </h2>
            <p className="text-[11px] text-[var(--muted)]">Premium store package deals to activate your memberships</p>
          </div>
        </div>
        <Link href="/packages" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors">
          Bazar Store <ArrowRight size={12} />
        </Link>
      </div>

      {/* Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <div 
            key={p.id} 
            className={`group rounded-xl border border-[var(--border)] overflow-hidden transition-all duration-300 ${
              p.active 
                ? 'hover:border-primary/45 hover:shadow-lg dark:hover:shadow-primary/5' 
                : 'opacity-65'
            }`}
          >
            {/* Image section */}
            <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              {p.image ? (
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)] bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <ShoppingBag size={48} strokeWidth={1} />
                </div>
              )}
              {p.badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-primary text-black z-10">
                  {p.badge}
                </span>
              )}
              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/60 transition-colors z-10">
                <Heart size={14} />
              </button>
            </div>

            {/* Content section */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                  <Star size={12} fill="currentColor" />
                  <span>{p.rating}</span>
                  <span className="text-[var(--muted)]">({p.reviews} reviews)</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)] group-hover:text-primary transition-colors leading-snug">
                  {p.name}
                </h3>
              </div>

              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {p.description}
              </p>

              {/* Price & Features */}
              <div className="pt-3 border-t border-[var(--border)] flex justify-between items-baseline">
                <span className="text-xs text-[var(--muted)]">Package Price</span>
                <span className="text-xl font-black text-[var(--foreground)] font-serif" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatCurrency(p.price)}
                </span>
              </div>

              <ul className="space-y-1.5 py-1.5">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <Shield size={12} className="text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {p.active ? (
                <Link 
                  href="/packages" 
                  className="btn btn-primary w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 mt-2 transition-all duration-300"
                >
                  <ShoppingBag size={14} />
                  {p.buttonText}
                </Link>
              ) : (
                <button 
                  disabled 
                  className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] font-semibold text-xs cursor-not-allowed mt-2 bg-[var(--surface)]"
                >
                  {p.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
