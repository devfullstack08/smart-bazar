'use client';

import AnimatedSection from './AnimatedSection';
import { APP_NAME } from '@/constants/env';
import { Shield, Zap, Globe, Clock, Headphones, TrendingUp } from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const features = [
    {
        icon: TrendingUp,
        title: '20% Direct Referrals',
        description: 'Earn $200.00 instantly on every direct sponsor purchase of the $1,000 Smart Bazar Package. Build your front line and unlock immediate rewards.',
        accentRgb: '249,115,22',
        accent: 'var(--pw-primary)',
    },
    {
        icon: Zap,
        title: '5% Placement Spillover',
        description: 'Every user is placed in a binary tree. Our auto spillover puts members in your downline automatically, giving you 5% ($50) placement income.',
        accentRgb: '34,201,184',
        accent: '#22C9B8',
    },
    {
        icon: Shield,
        title: '25% Binary Matching',
        description: 'Get rewarded for building balanced teams. Earn 25% ($250) on matched pairs on your weak leg at a 2:1 or 1:2 ratio.',
        accentRgb: '139,92,246',
        accent: 'var(--pw-secondary)',
    },
    {
        icon: Globe,
        title: 'Global 1*2 Auto-Pool',
        description: 'A shared global network matrix. $500 of every package enters the auto-pool, paying $50.00 per level up to 10 levels of uplines upon cycle completion.',
        accentRgb: '167,139,250',
        accent: 'var(--pw-secondary-light)',
    },
    {
        icon: Clock,
        title: 'Daily Matching Cap',
        description: 'To ensure long-term platform stability, binary matching is capped at 40 pairs daily. Any extra matching pairs on a day are flushed.',
        accentRgb: '245,158,11',
        accent: '#F59E0B',
    },
    {
        icon: Headphones,
        title: 'Qualified Release Rules',
        description: 'Releasing matching income requires only two active direct referrals (one placed on the left, one on the right), making it simple to unlock your full earnings.',
        accentRgb: '255,107,53',
        accent: '#FF6B35',
    },
];

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function FeatureCard({
    feature,
    index,
}: {
    feature: typeof features[0];
    index: number;
}) {
    const Icon = feature.icon;
    return (
        <AnimatedSection delay={index * 80}>
            <div className="group relative h-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                {/* left accent line */}
                <div
                    className="absolute top-6 bottom-6 left-0 w-[3px] rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-400 origin-top"
                    style={{ background: feature.accent }}
                    aria-hidden
                />

                {/* bg tint */}
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `rgba(${feature.accentRgb},0.04)` }}
                    aria-hidden
                />

                <div className="relative z-10">
                    {/* icon */}
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                        style={{
                            background: `rgba(${feature.accentRgb},0.1)`,
                            border: `1px solid rgba(${feature.accentRgb},0.2)`,
                        }}
                    >
                        <Icon className="w-5 h-5" style={{ color: feature.accent }} />
                    </div>

                    <h3 className="text-base font-bold text-[var(--foreground)] mb-2.5">
                        {feature.title}
                    </h3>

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        {feature.description}
                    </p>
                </div>
            </div>
        </AnimatedSection>
    );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Features() {
    return (
        <section id="features" className="section bg-[var(--surface)]">
            <div className="container-landing">

                {/* header — split layout: left title, right desc */}
                <AnimatedSection className="mb-14">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/20 text-[var(--pw-primary)] text-xs font-bold tracking-widest uppercase mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-primary)] animate-pulse" />
                                Why {APP_NAME}
                            </span>
                            <h2
                                className="heading-lg font-black text-[var(--foreground)]"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                Built different.<br />
                                <span className="gradient-text">Built to pay.</span>
                            </h2>
                        </div>
                        <p className="text-base text-[var(--muted)] max-w-sm leading-relaxed md:text-right md:pb-1">
                            Six income streams, dynamic capping, and on-chain transparency —
                            designed to reward every level of the network.
                        </p>
                    </div>
                </AnimatedSection>

                {/* features grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>

            </div>
        </section>
    );
}