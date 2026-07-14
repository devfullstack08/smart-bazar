import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import { APP_NAME } from '@/constants/env';

export const metadata: Metadata = {
  title: `FAQ | ${APP_NAME}`,
  description: `Frequently asked questions about ${APP_NAME} pools, capping, and rewards.`,
};

export default function FaqPage() {
  return (
    <MarketingDocShell
      title="Frequently asked questions"
      subtitle={`Clear answers about how ${APP_NAME} works. For legal terms, see our Terms of Service and Disclaimer.`}
    >
      <div className="space-y-10">
        <FaqAccordion />
        <div className="text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <p className="text-[var(--foreground)] font-semibold mb-2">Still need help?</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Visit the home page FAQ section or contact support.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/#faq" className="text-sm font-semibold text-[var(--pw-primary)] hover:underline min-h-[44px] inline-flex items-center">
              View on homepage
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-[var(--pw-primary)] hover:underline min-h-[44px] inline-flex items-center">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </MarketingDocShell>
  );
}
