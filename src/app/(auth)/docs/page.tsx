import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';
import { BookOpen, FileText, HelpCircle, LifeBuoy } from 'lucide-react';

export const metadata: Metadata = {
  title: `Documentation | ${APP_NAME}`,
  description: `Help resources and documentation for ${APP_NAME}.`,
};

const links = [
  {
    href: '/faq',
    title: 'FAQ',
    desc: 'Answers about pools, capping, and eligibility.',
    icon: HelpCircle,
  },
  {
    href: '/#features',
    title: 'Product overview',
    desc: 'How features work on the public homepage.',
    icon: BookOpen,
  },
  {
    href: '/terms',
    title: 'Terms of Service',
    desc: 'Rules of use, income disclaimers, and policies.',
    icon: FileText,
  },
  {
    href: '/support',
    title: 'Support',
    desc: 'Get help when you are logged in.',
    icon: LifeBuoy,
  },
];

export default function DocsPage() {
  return (
    <MarketingDocShell
      title="Documentation"
      subtitle="Quick links to help content and policies. Deep technical API docs are not published here; member guides live in the dashboard and FAQ."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {links.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--pw-primary)]/35 transition-colors min-h-[44px]"
          >
            <Icon className="w-5 h-5 text-[var(--pw-primary)] shrink-0" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">{title}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mt-8">
        {APP_NAME} may add downloadable guides or video walkthroughs over time. Check announcements in your dashboard.
      </p>
    </MarketingDocShell>
  );
}
