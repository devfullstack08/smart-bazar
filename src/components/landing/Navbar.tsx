'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Zap, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/constants/env';
import { APP_CONSTANTS } from '@/constants/app';
import { ThemeToggle } from '../ui/ThemeToggle';

const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Income', href: '#income' },
    { name: 'Packages', href: '#packages' },
    { name: 'FAQ', href: '#faq' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeLink, setActiveLink] = useState('');

    /* scroll state */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* lock body when mobile menu is open */
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const handleNavClick = (href: string) => {
        setMobileOpen(false);
        setActiveLink(href);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            {/* ── Desktop / scrolled nav ── */}
            <nav
                className={`navbar transition-all duration-300 ${scrolled
                    ? 'bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)]'
                    : 'bg-transparent'
                    }`}
            >
                <div className="container-landing">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex shrink-0 items-center gap-2 min-w-0"
                            aria-label={APP_NAME}
                        >
                            <img
                                src={APP_CONSTANTS.APP_LOGO_URL}
                                alt={APP_NAME}
                                className="h-11 sm:h-14 w-auto object-contain transition-transform hover:scale-105"
                            />
                        </Link>

                        {/* Desktop links */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => handleNavClick(link.href)}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus-ring
                                        ${activeLink === link.href
                                            ? 'text-[var(--pw-primary)] bg-[var(--pw-primary)]/8'
                                            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                                        }`}
                                >
                                    {link.name}
                                    {activeLink === link.href && (
                                        <span
                                            className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                                            style={{ background: 'var(--pw-primary)' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center gap-2">
                            <ThemeToggle />
                            {/* Desktop CTAs */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors focus-ring rounded-lg"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="btn btn-primary px-5 py-2.5 text-sm rounded-xl"
                                >
                                    Get Started
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>



                        {/* Mobile hamburger */}
                        <div className="lg:hidden flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] transition-colors hover:border-[var(--pw-primary)]/40 focus-ring"
                                aria-label="Toggle menu"
                                aria-expanded={mobileOpen}
                            >
                                {mobileOpen
                                    ? <X className="w-5 h-5" />
                                    : <Menu className="w-5 h-5" />
                                }
                            </button>
                        </div>

                    </div>
                </div>
            </nav>

            {/* ── Mobile menu ── */}
            <div
                className={`mobile-menu ${mobileOpen ? 'open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* nav links */}
                <nav className="flex flex-col gap-1 mb-8">
                    {navLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => handleNavClick(link.href)}
                            className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200
                                ${activeLink === link.href
                                    ? 'bg-[var(--pw-primary)]/10 text-[var(--pw-primary)]'
                                    : 'text-[var(--foreground)] hover:bg-[var(--surface)] hover:text-[var(--pw-primary)]'
                                }`}
                        >
                            {link.name}
                        </button>
                    ))}
                </nav>

                {/* CTAs */}
                <div className="flex flex-col gap-3 px-0">
                    <Link
                        href="/login"
                        className="btn btn-secondary w-full py-3.5 rounded-xl text-base"
                        onClick={() => setMobileOpen(false)}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="btn btn-primary w-full py-3.5 rounded-xl text-base"
                        onClick={() => setMobileOpen(false)}
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* bottom note */}
                <p className="absolute bottom-8 left-0 right-0 text-center text-xs text-[var(--muted)]">
                    Web3 pool-based rewards · Dynamic capping
                </p>
            </div>
        </>
    );
}