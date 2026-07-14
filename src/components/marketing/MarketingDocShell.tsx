import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const FOOTER_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/contact', label: 'Contact' },
] as const;

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function MarketingDocShell({ title, subtitle, children }: Props) {
  return (
    <div className="w-full flex-1 min-h-0 bg-transparent py-5 sm:py-8 md:py-10">
      <article className="max-w-4xl mx-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg shadow-black/5 dark:shadow-black/30 overflow-hidden">
        <header className="px-5 sm:px-8 md:px-12 pt-8 sm:pt-10 pb-5 sm:pb-6 border-b border-[var(--border)] bg-[var(--surface)]/50">
          <h1
            className="text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-sm md:text-base text-[var(--muted-foreground)] leading-relaxed">{subtitle}</p>
          ) : null}
        </header>

        <div className="px-5 sm:px-8 md:px-12 py-7 md:py-9 text-[var(--muted-foreground)] leading-relaxed">{children}</div>

        <footer className="px-5 sm:px-8 md:px-12 py-5 sm:py-6 border-t border-[var(--border)] bg-[var(--surface)]/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pw-primary)] hover:underline min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" /> Back to home
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Legal and contact">
              {FOOTER_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className="text-[var(--muted-foreground)] hover:text-[var(--pw-primary)] transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </article>
    </div>
  );
}
