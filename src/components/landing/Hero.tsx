'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Zap, Shield, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { APP_NAME } from '@/constants/env';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const duration = 2000;
                const start = performance.now();
                const tick = (now: number) => {
                    const p = Math.min((now - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - p, 4);
                    setValue(parseFloat((ease * to).toFixed(decimals)));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [to, decimals]);

    return <span ref={ref}>{decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}{suffix}</span>;
}

// ── Particle dot (pure CSS) ───────────────────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
    return (
        <span
            className="absolute rounded-full bg-[var(--pw-primary)] pointer-events-none"
            style={style}
            aria-hidden
        />
    );
}

// ── Pool income row ───────────────────────────────────────────────────────────
function PoolRow({ label, pct, amount, delay, color }: {
    label: string; pct: number; amount: string; delay: number; color: string;
}) {
    return (
        <div
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <span className="w-[88px] text-[11px] font-medium text-zinc-500 dark:text-white/40 shrink-0">{label}</span>
            <div className="flex-1 h-[3px] rounded-full bg-zinc-200/90 dark:bg-white/5 overflow-hidden">
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${pct}%`,
                        background: color,
                        boxShadow: `0 0 6px ${color}88`,
                    }}
                />
            </div>
            <span className="w-10 text-right text-[11px] font-bold shrink-0" style={{ color }}>{amount}</span>
        </div>
    );
}

// ── Live ROI card ─────────────────────────────────────────────────────────────
function ROICard() {
    const streams = [
        { label: 'Direct Sponsor', pct: 100, amount: '20%', color: 'var(--pw-primary)' },
        { label: 'Binary Match',   pct: 100, amount: '25%', color: '#3b82f6' },
        { label: 'Spillover Node',  pct: 100, amount: '5%', color: '#34d399' },
        { label: 'Auto-Pool',      pct: 100, amount: '$50', color: '#fbbf24' },
    ];

    return (
        <div
            className="relative rounded-2xl overflow-hidden animate-float border border-zinc-200/90 bg-white/95 text-zinc-900 shadow-xl shadow-zinc-300/40 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(0,0,0,0.04)] dark:border-[rgba(249,115,22,0.12)] dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-white/[0.02] dark:text-white dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{
                animationDuration: '7s',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Top glow line */}
            <div
                className="absolute top-0 left-6 right-6 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--pw-primary), transparent)', opacity: 0.6 }}
                aria-hidden
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 dark:text-white/30 mb-0.5">STORE MEMBERSHIP</p>
                        <div className="flex items-end gap-1.5">
                            <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">$1,000</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[var(--pw-primary)] bg-[var(--pw-primary)]/10 px-2.5 py-1 rounded-full border border-[var(--pw-primary)]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-primary)] animate-pulse" />
                            ACTIVE
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-white/30">100% Store Value</span>
                    </div>
                </div>

                {/* Pool bars */}
                <div className="space-y-2.5 mb-4">
                    {streams.map((p, i) => (
                        <PoolRow key={p.label} {...p} delay={i * 100} />
                    ))}
                </div>

                {/* Footer */}
                <div
                    className="flex justify-between items-center pt-3.5 border-t border-zinc-200/90 dark:border-white/10"
                >
                    <span className="text-[11px] text-zinc-500 dark:text-white/30 font-medium">Auto Pool Seed</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">$500.00</span>
                        <span className="text-[10px] text-[var(--pw-primary)] bg-[var(--pw-primary)]/10 px-1.5 py-0.5 rounded font-bold">Entered</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Capping card ──────────────────────────────────────────────────────────────
function CappingCard() {
    return (
        <div
            className="relative rounded-2xl overflow-hidden animate-float-slow border border-blue-200/90 bg-white/95 text-zinc-900 shadow-xl shadow-zinc-300/35 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(0,0,0,0.04)] dark:border-[rgba(59,130,246,0.15)] dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-blue-500/[0.06] dark:text-white dark:shadow-[0_24px_64px_rgba(0,0,0,0.4)] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)]"
            style={{
                animationDuration: '9s',
                animationDelay: '1.5s',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.8), transparent)' }} aria-hidden />

            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 dark:text-white/30">
                        Binary Pair Matching
                    </span>
                </div>

                <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">$250.00</span>
                    <span className="text-xs text-blue-400 font-semibold mb-0.5">Paid (Weak Leg)</span>
                </div>

                {/* Progress */}
                <div className="relative h-1.5 rounded-full bg-zinc-200/90 dark:bg-white/5 overflow-hidden mb-1.5">
                    <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                            width: '66%',
                            background: 'linear-gradient(90deg, #3b82f6, var(--pw-primary))',
                            boxShadow: '0 0 8px rgba(59,130,246,0.6)',
                        }}
                    />
                </div>
                <div className="flex justify-between mb-3">
                    <span className="text-[10px] text-zinc-500 dark:text-white/30">Left Leg: $2,000</span>
                    <span className="text-[10px] text-zinc-500 dark:text-white/30">Right Leg: $1,000</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-zinc-200/80 dark:border-white/5">
                    <ChevronRight className="w-3 h-3 text-blue-500 dark:text-blue-400 shrink-0" />
                    <p className="text-[10px] text-zinc-600 dark:text-white/40 leading-relaxed">
                        Ratio matched at 2:1. Next pair matching payout: $250.00.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip() {
    const stats = [
        { label: 'Direct Referral', value: 20, suffix: '%', decimals: 0 },
        { label: 'Binary Matching', value: 25, suffix: '%', decimals: 0 },
        { label: 'Placement Spill', value: 5, suffix: '%', decimals: 0 },
    ];

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-zinc-200/90 bg-white/90 text-zinc-900 shadow-lg shadow-zinc-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.025] dark:text-white dark:shadow-none"
            style={{
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className="grid grid-cols-3 divide-x divide-zinc-200/90 dark:divide-white/5">
                {stats.map((s, i) => (
                    <div key={s.label} className="text-center py-4 px-3">
                        <div
                            className="text-2xl font-black tracking-tight mb-1 bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#00b87a] bg-clip-text text-transparent dark:from-white dark:via-white dark:to-[var(--pw-primary)]"
                        >
                            <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
                        </div>
                        <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-500 dark:text-white/25">
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Pool income pill ──────────────────────────────────────────────────────────
function PoolPill({ label, amount, delay }: { label: string; amount: string; delay: number }) {
    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium animate-fade-in-up border border-[rgba(249,115,22,0.22)] bg-[rgba(249,115,22,0.08)] text-zinc-700 dark:border-[rgba(249,115,22,0.15)] dark:bg-[rgba(249,115,22,0.05)] dark:text-white/50"
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: 'both',
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pw-primary)] shrink-0" />
            {label}
            <span className="text-[var(--pw-primary)] font-bold ml-1">{amount}</span>
        </div>
    );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
export default function Hero() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Scattered particles
    const particles = [
        { width: 3, height: 3, top: '18%', left: '22%', opacity: 0.35, animation: 'float 6s ease-in-out infinite', animationDelay: '0s' },
        { width: 2, height: 2, top: '55%', left: '8%',  opacity: 0.2,  animation: 'float 8s ease-in-out infinite', animationDelay: '1s' },
        { width: 4, height: 4, top: '72%', left: '30%', opacity: 0.15, animation: 'float 11s ease-in-out infinite', animationDelay: '2s' },
        { width: 2, height: 2, top: '30%', left: '78%', opacity: 0.25, animation: 'float 7s ease-in-out infinite', animationDelay: '0.5s' },
        { width: 3, height: 3, top: '82%', left: '65%', opacity: 0.2,  animation: 'float 9s ease-in-out infinite', animationDelay: '3s' },
    ];

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[var(--background)] pt-16">

            {/* ── Dot-grid background ── */}
            <div
                className="absolute inset-0 pointer-events-none [background-image:radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)]"
                aria-hidden
                style={{
                    backgroundSize: '32px 32px',
                }}
            />

            {/* ── Gradient mesh ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{
                    background: `
                        radial-gradient(ellipse 70% 60% at 80% 10%, rgba(249,115,22,0.10) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 10% 80%, rgba(59,130,246,0.09) 0%, transparent 55%),
                        radial-gradient(ellipse 40% 40% at 50% 50%, rgba(249,115,22,0.04) 0%, transparent 70%)
                    `,
                }}
            />

            {/* ── Particles ── */}
            {mounted && particles.map((p, i) => (
                <Particle
                    key={i}
                    style={{
                        width: p.width,
                        height: p.height,
                        top: p.top,
                        left: p.left,
                        opacity: p.opacity,
                        animation: p.animation,
                        animationDelay: p.animationDelay,
                    }}
                />
            ))}

            {/* ── Horizontal scan line ── */}
            <div
                className="absolute left-0 right-0 h-px pointer-events-none"
                aria-hidden
                style={{
                    top: '38%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.08) 30%, rgba(249,115,22,0.12) 50%, rgba(249,115,22,0.08) 70%, transparent 100%)',
                }}
            />

            {/* ── Main layout ── */}
            <div className="container-landing relative z-10 w-full py-16 lg:py-24">
                <div className="grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-12 lg:gap-16 xl:gap-24 items-center">

                    {/* ── LEFT ── */}
                    <div className="w-full">

                        {/* Eyebrow */}
                        <div
                            className="inline-flex items-center gap-2.5 mb-5 px-3.5 py-1.5 rounded-full animate-fade-in-up"
                            style={{
                                animationDelay: '100ms',
                                animationFillMode: 'both',
                                background: 'rgba(249,115,22,0.07)',
                                border: '1px solid rgba(249,115,22,0.2)',
                            }}
                        >
                            <Zap className="w-3 h-3 text-[var(--pw-primary)]" />
                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--pw-primary)]">
                                Premium Affiliate Store
                            </span>
                        </div>

                        {/* Headline */}
                        <h1
                            className="mb-5 animate-fade-in-up"
                            style={{
                                animationDelay: '200ms',
                                animationFillMode: 'both',
                                fontSize: 'clamp(2.6rem, 6vw, 4.2rem)',
                                fontWeight: 900,
                                lineHeight: 1.04,
                                letterSpacing: '-0.035em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            <span className="text-zinc-900 dark:text-white block">Shop, Share</span>
                            <span
                                className="block"
                                style={{
                                    background: 'linear-gradient(135deg, var(--pw-primary) 0%, var(--pw-primary-light) 40%, var(--pw-accent) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 40px rgba(249,115,22,0.3))',
                                }}
                            >
                                & Earn.
                            </span>
                            <span className="text-zinc-800 dark:text-white/90 block">Uncapped Rewards.</span>
                        </h1>

                        {/* Sub */}
                        <p
                            className="text-[1.05rem] leading-relaxed mb-8 animate-fade-in-up text-zinc-600 dark:text-white/45 max-w-[500px]"
                            style={{
                                animationDelay: '300ms',
                                animationFillMode: 'both',
                            }}
                        >
                            Unlock a premium e-commerce package. Earn 20% direct referral, 25% binary matching, and 5% placement spillover with our global auto-pool.{' '}
                            <strong className="font-semibold text-zinc-800 dark:text-white/75">
                                Uncapped potential.
                            </strong>
                        </p>

                        {/* CTAs */}
                        <div
                            className="flex flex-wrap gap-3 mb-8 animate-fade-in-up"
                            style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                        >
                            <Link
                                href="/register"
                                className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-[#ffffff] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, var(--pw-primary) 0%, var(--pw-primary-dark) 100%)',
                                    boxShadow: '0 0 0 1px rgba(249,115,22,0.4), 0 8px 32px rgba(249,115,22,0.25)',
                                }}
                            >
                                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, var(--pw-primary-light) 0%, var(--pw-primary) 100%)' }} />
                                <span className="relative">Start Earning</span>
                                <ArrowRight className="relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </Link>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-zinc-300/90 bg-zinc-100/90 text-zinc-800 shadow-sm hover:bg-zinc-200/90 dark:border-white/12 dark:bg-white/[0.05] dark:text-white/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Trust bar */}
                        <div
                            className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 animate-fade-in-up"
                            style={{ animationDelay: '500ms', animationFillMode: 'both' }}
                        >
                            {[
                                { icon: Shield, label: 'Verified platform' },
                                { icon: Users, label: 'Active shopper network' },
                                { icon: TrendingUp, label: 'Uncapped matching pathways' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5 text-[var(--pw-primary)]" />
                                    <span className="text-xs font-medium text-zinc-500 dark:text-white/35">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pool pills */}
                        <div
                            className="flex flex-wrap gap-2 animate-fade-in-up"
                            style={{ animationDelay: '600ms', animationFillMode: 'both' }}
                        >
                            <PoolPill label="Direct Referral" amount="20%" delay={600} />
                            <PoolPill label="Binary Matching" amount="25%" delay={680} />
                            <PoolPill label="Placement Spill" amount="5%" delay={760} />
                            <PoolPill label="Global Auto-Pool" amount="$50/level" delay={840} />
                        </div>
                    </div>

                    {/* ── RIGHT: Cards ── */}
                    {mounted && (
                        <div className="relative hidden lg:flex flex-col gap-3">

                            {/* Corner accent */}
                            <div
                                className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
                                aria-hidden
                                style={{
                                    background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
                                    filter: 'blur(2px)',
                                }}
                            />

                            {/* Product Frame Showcase */}
                            <div
                                className="relative rounded-2xl overflow-hidden border border-primary/25 bg-[var(--surface-elevated)] p-4 shadow-2xl shadow-black/40 animate-fade-in-right"
                                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                            >
                                {/* Top gold accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                                
                                <div className="space-y-4">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black/10">
                                        <img 
                                            src="/assets/images/smart_bazar_product_box.jpg" 
                                            alt="Smart Bazar Premium Curation Box" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-3 left-3 bg-primary text-black font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Premium Box
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-bold text-sm text-[var(--foreground)]">Smart Bazar Luxury Curation</h4>
                                            <span className="font-serif font-black text-lg text-primary">$1,000</span>
                                        </div>
                                        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                                            A bespoke retail collection of premium curations, activating full affiliate membership benefits.
                                        </p>
                                    </div>

                                    {/* Action button */}
                                    <Link 
                                        href="/register" 
                                        className="btn btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                                    >
                                        Activate Curation Box <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>

                            {/* Stats strip below */}
                            <div
                                className="animate-fade-in-right"
                                style={{ animationDelay: '600ms', animationFillMode: 'both' }}
                            >
                                <StatsStrip />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom fade ── */}
            <div
                className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
                aria-hidden
                style={{ background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)' }}
            />
        </section>
    );
}