import type { Metadata } from 'next';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';

export const metadata: Metadata = {
  title: `Careers | ${APP_NAME}`,
  description: `Careers at ${APP_NAME} — we are not hiring for fixed roles right now, but we welcome standout talent.`,
};

export default function CareersPage() {
  return (
    <MarketingDocShell
      title="Careers"
      subtitle="We are not actively hiring for specific open roles at the moment."
    >
      <div className="space-y-8">
        <p className="text-[var(--foreground)] font-medium">
          {APP_NAME} is focused on delivering a stable product and experience for our members. We do not have a public job
          board or fixed vacancies right now.
        </p>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Open to the right people</h2>
          <p>
            We may still connect with exceptional engineers, designers, community managers, or compliance-minded operators
            when there is a clear fit. If you believe your background could strengthen the platform, you are welcome to send a
            short introduction and portfolio or résumé.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">How to reach us</h2>
          <p>
            Email{' '}
            <a href={`mailto:careers@${APP_NAME.toLowerCase()}.com`} className="text-[var(--pw-primary)] font-semibold hover:underline">
              careers@{APP_NAME.toLowerCase()}.com
            </a>{' '}
            with the subject line &quot;General inquiry — [your field]&quot;. We cannot respond to every message, but we review
            serious notes periodically.
          </p>
        </section>
        <p className="text-sm text-[var(--muted-foreground)]">
          {APP_NAME} is an equal-opportunity environment. No fee is ever required to apply or participate in our business
          opportunity as a member; this careers channel is for potential team roles only.
        </p>
      </div>
    </MarketingDocShell>
  );
}
