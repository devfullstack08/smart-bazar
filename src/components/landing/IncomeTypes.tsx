'use client';

import AnimatedSection from './AnimatedSection';
import { Users, Zap, Award, Crown, TrendingUp, Trophy, Star } from 'lucide-react';

/* ─── Pool data ─────────────────────────────────────────────────────────────── */
const pools = [
    {
        icon: Users,
        tag: 'Instant',
        title: 'Direct Referral',
        rate: '20%',
        desc: 'Paid instantly when your sponsored referral purchases a store package. Get $200.00 cash rewards credited straight to your available balance.',
        pills: ['Instant cashout', 'Unlimited width', '20% commission'],
        accent: 'var(--pw-primary)',
        accentRgb: '249,115,22',
    },
    {
        icon: Zap,
        tag: 'Instant',
        title: 'Placement Spillover',
        rate: '5%',
        desc: 'Get rewarded when a user is placed under your binary tree nodes (left or right leg), even via upline spillover! Pays $50.00 instantly on package purchase.',
        pills: ['Auto spillover support', 'Left/Right placement', 'Instant payout'],
        accent: '#22C9B8',
        accentRgb: '34,201,184',
    },
    {
        icon: Award,
        tag: 'Instant / Cap',
        title: 'Binary Matching',
        rate: '25%',
        desc: 'Earn 25% matching bonus ($250.00) on pairs matching at 2:1 or 1:2 ratios on your weak leg. Capped at 40 pairs daily ($10,000.00/day max) for pool sustainability.',
        pills: ['Weak leg payout', '2:1 or 1:2 ratio', '40 pairs daily cap'],
        accent: 'var(--pw-secondary)',
        accentRgb: '139,92,246',
    },
    {
        icon: Crown,
        tag: 'Cycle Payout',
        title: 'Global Auto-Pool',
        rate: '10 levels',
        desc: 'Everyone automatically joins this shared global matrix on purchase. Payouts are made when cycles complete, sharing $50.00 per level up to 10 uplines sequentially.',
        pills: ['1*2 global matrix', 'Cycle-complete payout', 'Rebirth disabled'],
        accent: '#F59E0B',
        accentRgb: '245,158,11',
    },
];

const summaryStats = [
    { value: '20%',  label: 'Direct Referral' },
    { value: '25%',  label: 'Binary Matching' },
    { value: '5%',   label: 'Placement Income' },
    { value: '$500', label: 'Auto-Pool Entry' },
    { value: '10',   label: 'Upline Levels'   },
    { value: '40',   label: 'Daily Pairs Cap' },
];

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function PoolCard({ pool, index }: { pool: typeof pools[0]; index: number }) {
    const Icon = pool.icon;
    return (
        <AnimatedSection delay={index * 70}>
            <div
                className="group relative h-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
                {/* top accent bar — slides in on hover */}
                <div
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                    style={{ background: `linear-gradient(90deg, ${pool.accent}, transparent)` }}
                    aria-hidden
                />

                {/* subtle bg tint on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                    style={{ background: `rgba(${pool.accentRgb},0.05)` }}
                    aria-hidden
                />

                <div className="relative z-10 flex flex-col h-full">
                    {/* icon + tag row */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                                background: `rgba(${pool.accentRgb},0.1)`,
                                border: `1px solid rgba(${pool.accentRgb},0.25)`,
                            }}
                        >
                            <Icon className="w-5 h-5" style={{ color: pool.accent }} />
                        </div>
                        <span
                            className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border flex-shrink-0"
                            style={{
                                color: pool.accent,
                                borderColor: `rgba(${pool.accentRgb},0.3)`,
                                background: `rgba(${pool.accentRgb},0.08)`,
                            }}
                        >
                            {pool.tag}
                        </span>
                    </div>

                    {/* rate */}
                    <div
                        className="text-2xl font-black tracking-tight mb-1"
                        style={{ color: pool.accent }}
                    >
                        {pool.rate}
                    </div>

                    {/* title */}
                    <h3 className="text-base font-bold text-[var(--foreground)] mb-3">
                        {pool.title}
                    </h3>

                    {/* description */}
                    <p className="text-sm text-[var(--muted)] leading-relaxed mb-5 flex-1">
                        {pool.desc}
                    </p>

                    {/* pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {pool.pills.map((pill) => (
                            <span
                                key={pill}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
                            >
                                {pill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function IncomeTypes() {
    return (
        <section id="income" className="section bg-[var(--background)]">
            <div className="container-landing">

                {/* left-aligned header */}
                <AnimatedSection className="mb-14 max-w-2xl">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20 text-[var(--pw-primary)] text-xs font-bold tracking-widest uppercase mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-primary)] animate-pulse" />
                        Income Streams
                    </span>
                    <h2
                        className="heading-lg font-black text-[var(--foreground)] mb-4"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        7 ways to earn.<br />
                        <span className="gradient-text">One platform.</span>
                    </h2>
                    <p className="text-lg text-[var(--muted)] leading-relaxed">
                        Every active member earns from multiple streams simultaneously.
                        Your cap grows with referrals — no ceiling on what you can build.
                    </p>
                </AnimatedSection>

                {/* cards */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-14">
                    {pools.map((pool, i) => (
                        <PoolCard key={pool.title} pool={pool} index={i} />
                    ))}
                </div>

                {/* summary strip — no gradient blob, uses design system tokens */}
                <AnimatedSection>
                    <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(ellipse 50% 100% at 0% 50%, rgba(0,229,160,0.07), transparent),' +
                                    'radial-gradient(ellipse 40% 80% at 100% 50%, rgba(139,92,246,0.07), transparent)',
                            }}
                            aria-hidden
                        />
                        <div className="relative z-10 grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[var(--border)]">
                            {summaryStats.map((s) => (
                                <div key={s.label} className="flex flex-col items-center justify-center py-7 px-4 text-center">
                                    <span className="stat-value text-2xl md:text-3xl font-black mb-1">
                                        {s.value}
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--muted)]">
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>

            </div>
        </section>
    );
}