'use client';

import Link from 'next/link';
import { Zap, Mail, MapPin, Phone, Twitter, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { APP_NAME } from '@/constants/env';
import { APP_CONSTANTS } from '@/constants/app';

const footerSections: { title: string; links: { name: string; href: string }[] }[] = [
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/#features' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Income',
    links: [
      { name: 'Direct Referral', href: '/#income' },
      { name: 'Single-Leg Pool', href: '/#income' },
      { name: 'Club & Salary', href: '/#income' },
      { name: 'Leaderboard & Royalty', href: '/#income' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Support', href: '/support' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Refund Policy', href: '/refund' },
      { name: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'X / Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] text-[var(--muted-foreground)]">
      {/* Main Footer */}
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand & Description - wider on large screens */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex shrink-0 items-center gap-2 mb-6 group w-fit">
              <img
                src={APP_CONSTANTS.APP_LOGO_URL}
                alt={APP_NAME}
                className="h-16 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <p className="text-base leading-relaxed mb-8 max-w-md">
              Dynamic pool-based earnings with intelligent capping. Unlock six powerful reward streams and 5% lifetime direct referrals.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[var(--pw-primary)]" />
                <a href="mailto:support@yourdomain.com" className="hover:text-[var(--pw-primary)] transition-colors">
                  support@{APP_NAME.toLowerCase()}.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[var(--pw-primary)]" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[var(--pw-primary)]" />
                <span>Global • Remote-first</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[var(--foreground)] font-semibold mb-5 text-base">
                {section.title}
              </h4>
              <ul className="space-y-3.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="hover:text-[var(--pw-primary)] transition-colors hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border)] bg-[var(--surface-elevated)]/50">
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-sm">
            <p className="text-[var(--muted-foreground)]">
              © {currentYear} {APP_NAME}. All rights reserved.
            </p>

            <div className="flex items-center gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-[var(--surface)] hover:bg-[var(--pw-primary)]/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--pw-primary)] hover:scale-110 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}