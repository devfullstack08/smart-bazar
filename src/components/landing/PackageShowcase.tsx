'use client';

import Link from 'next/link';
import AnimatedSection from './AnimatedSection';
import {
    Check, ArrowRight, TrendingUp, Shield, Zap,
    Users, Award, Crown, Trophy, Star
} from 'lucide-react';
import { APP_NAME } from '@/constants';

/* ─── Package data ──────────────────────────────────────────────────────────── */
const pkg = {
    price: 1000,
    referralPct: 20,
    binaryMatchingPct: 25,
    placementPct: 5,
    autoPoolFee: 500,
    maxReturn: 2000,
};

/* What this package unlocks */
const streams = [
    { icon: Users,    label: 'Direct Referral',   value: '20% ($200)', note: 'Paid instantly',       accentRgb: '249,115,22'   },
    { icon: Zap,      label: 'Placement Income',  value: '5% ($50)',   note: 'Automated spillover', accentRgb: '34,201,184'  },
    { icon: Award,    label: 'Binary Matching',   value: '25% ($250)', note: 'Paid on matched pairs', accentRgb: '139,92,246'  },
    { icon: Crown,    label: 'Global Auto-Pool',  value: '$50/level',  note: 'Pays up to 10 levels', accentRgb: '245,158,11'  },
];

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function PackageShowcase() {
    return (
        <section id="packages" className="section bg-[var(--surface)]">
            <div className="container-landing">

                {/* ── Header ── */}
                <AnimatedSection className="mb-14 max-w-2xl">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20 text-[var(--pw-primary)] text-xs font-bold tracking-widest uppercase mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-primary)] animate-pulse" />
                        Investment Plan
                    </span>
                    <h2
                        className="heading-lg font-black text-[var(--foreground)] mb-4"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        One membership.<br />
                        <span className="gradient-text">Infinite potential.</span>
                    </h2>
                    <p className="text-lg text-[var(--muted)] leading-relaxed">
                        A single $1,000 package activates your available store credits and instantly places you in the binary matching tree and the global auto-pool.
                    </p>
                </AnimatedSection>

                {/* ── Main layout: big card left, streams right ── */}
                <div className="grid lg:grid-cols-[400px_1fr] gap-6 mb-12">

                    {/* Package card */}
                    <AnimatedSection>
                        <div className="relative h-full rounded-2xl border border-[var(--pw-primary)]/30 bg-[var(--surface-elevated)] overflow-hidden">
                            {/* top gradient bar */}
                            <div
                                className="h-1 w-full"
                                style={{ background: 'linear-gradient(90deg, var(--pw-primary), var(--pw-secondary))' }}
                                aria-hidden
                            />

                            {/* glow */}
                            <div
                                className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)' }}
                                aria-hidden
                            />

                            <div className="relative z-10 p-8">
                                {/* badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20 mb-6">
                                    <Shield className="w-3.5 h-3.5 text-[var(--pw-primary)]" />
                                    <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--pw-primary)]">
                                        {APP_NAME} Membership
                                    </span>
                                </div>

                                {/* price */}
                                <div className="mb-1">
                                    <span className="text-5xl font-black text-[var(--foreground)] tracking-tight">
                                        $1,000
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--muted)] mb-8">One-time purchase · All incomes activated</p>

                                {/* key stats */}
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    {[
                                        { label: 'Direct Ref.',   value: '20%',     sub: '$200.00 instant' },
                                        { label: 'Binary Match',  value: '25%',     sub: '$250.00 / pair' },
                                        { label: 'Placement',     value: '5%',      sub: '$50.00 spillover'},
                                        { label: 'Global Pool',   value: '10 levels', sub: '$50.00 / level'  },
                                    ].map((s) => (
                                        <div
                                            key={s.label}
                                            className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3"
                                        >
                                            <div className="stat-value text-xl font-black mb-0.5">{s.value}</div>
                                            <div className="text-[10px] font-bold tracking-widest uppercase text-[var(--muted)]">{s.label}</div>
                                            <div className="text-[11px] text-[var(--muted)] mt-0.5">{s.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* checklist */}
                                <ul className="space-y-2.5 mb-8">
                                    {[
                                        '20% direct referral bonus ($200.00)',
                                        '25% binary matching bonus ($250.00)',
                                        '5% placement spillover bonus ($50.00)',
                                        'Global 1*2 auto-pool entry ($500.00 fee)',
                                        'Payout of $50.00 shared up to 10 levels',
                                        '40 pairs daily cap ($10,000.00 matching limit)',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--muted)]">
                                            <Check className="w-4 h-4 text-[var(--pw-primary)] flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/register" className="btn btn-primary w-full py-3.5 rounded-xl glow">
                                    Start Earning
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Income streams grid */}
                    <div className="grid sm:grid-cols-2 gap-3 content-start">
                        {streams.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <AnimatedSection key={s.label} delay={i * 60}>
                                    <div className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--accent-rgb),0.4)]">
                                        {/* icon */}
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: `rgba(${s.accentRgb},0.1)`,
                                                border: `1px solid rgba(${s.accentRgb},0.2)`,
                                            }}
                                        >
                                            <Icon className="w-4.5 h-4.5" style={{ color: `rgb(${s.accentRgb})` }} />
                                        </div>

                                        {/* text */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-[var(--foreground)] truncate">{s.label}</div>
                                            <div className="text-xs text-[var(--muted)]">{s.note}</div>
                                        </div>

                                        {/* value */}
                                        <div
                                            className="text-sm font-black flex-shrink-0"
                                            style={{ color: `rgb(${s.accentRgb})` }}
                                        >
                                            {s.value}
                                        </div>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}