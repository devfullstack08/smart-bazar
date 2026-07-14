import type { Metadata } from 'next';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';
import { Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: `Blog | ${APP_NAME}`,
  description: `News and updates from ${APP_NAME}.`,
};

export default function BlogPage() {
  return (
    <MarketingDocShell
      title="Blog"
      subtitle="Stories, updates, and education — coming soon."
    >
      <div className="flex flex-col items-center text-center py-8 md:py-12 px-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60">
        <div className="w-14 h-14 rounded-2xl bg-[var(--pw-primary)]/10 flex items-center justify-center mb-4">
          <Newspaper className="w-7 h-7 text-[var(--pw-primary)]" />
        </div>
        <p className="text-[var(--foreground)] font-semibold text-lg mb-2">No posts yet</p>
        <p className="text-[var(--muted-foreground)] max-w-md leading-relaxed">
          We are preparing articles on product updates, pool mechanics, and best practices. Follow announcements in your
          dashboard or check back here later.
        </p>
      </div>
    </MarketingDocShell>
  );
}
