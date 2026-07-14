import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';
import { Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Contact | ${APP_NAME}`,
  description: `Contact ${APP_NAME} support and business inquiries.`,
};

const supportEmail = (local: string) => `${local}@${APP_NAME.toLowerCase()}.com`;

export default function ContactPage() {
  return (
    <MarketingDocShell
      title="Contact"
      subtitle="Reach the team for support, partnerships, or general questions."
    >
      <div className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href={`mailto:${supportEmail('support')}`}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--pw-primary)]/40 transition-colors min-h-[44px]"
          >
            <Mail className="w-5 h-5 text-[var(--pw-primary)] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">Support</p>
              <p className="text-sm text-[var(--pw-primary)] break-all">{supportEmail('support')}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Account, withdrawals, and technical help</p>
            </div>
          </a>
          <a
            href={`mailto:${supportEmail('hello')}`}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--pw-primary)]/40 transition-colors min-h-[44px]"
          >
            <MessageCircle className="w-5 h-5 text-[var(--pw-primary)] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">General</p>
              <p className="text-sm text-[var(--pw-primary)] break-all">{supportEmail('hello')}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Press, partnerships, and other inquiries</p>
            </div>
          </a>
        </div>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">Signed-in members</h2>
          <p className="mb-4">
            For faster help with tickets and account-specific issues, log in and use the Support area from your dashboard when
            available.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--pw-primary)]/15 text-[var(--pw-primary)] font-semibold px-5 py-2.5 min-h-[44px] hover:bg-[var(--pw-primary)]/25 transition-colors"
          >
            Open Support
          </Link>
        </section>

        <p className="text-sm text-[var(--muted-foreground)]">
          Typical response time is a few business days. Do not share passwords or wallet seed phrases by email.
        </p>
      </div>
    </MarketingDocShell>
  );
}
