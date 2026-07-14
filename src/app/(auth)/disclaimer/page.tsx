import type { Metadata } from 'next';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';

export const metadata: Metadata = {
  title: `Disclaimer | ${APP_NAME}`,
  description: `Important disclaimers for ${APP_NAME} users and visitors.`,
};

export default function DisclaimerPage() {
  return (
    <MarketingDocShell
      title="Disclaimer"
      subtitle="General information only — not financial, legal, or tax advice."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">No guarantee of earnings</h2>
          <p>
            {APP_NAME} provides software and a business opportunity structure. Income depends on individual effort, team
            development, eligibility rules, and market conditions. We do not guarantee that you will earn any income. Past or
            hypothetical examples are not promises of future results.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Risk</h2>
          <p>
            Participation may involve financial risk, including possible loss of amounts paid for packages or deposits. Digital
            assets and payment methods can be volatile. You should only commit funds you can afford to lose and should seek
            independent professional advice where appropriate.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Not investment advice</h2>
          <p>
            Nothing on this website or in the application constitutes investment, legal, or tax advice. Regulatory treatment
            of MLM and digital assets varies by country; you are responsible for compliance with laws that apply to you.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Third parties</h2>
          <p>
            We may link to or integrate third-party services (e.g. payment or blockchain networks). We are not responsible for
            their availability, fees, or failures. Use of such services is at your own risk and subject to their terms.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Platform changes</h2>
          <p>
            Features, schedules, pool rules, and fees may change. Continued use after updates constitutes acceptance of
            revised terms and policies posted on the site.
          </p>
        </section>
      </div>
    </MarketingDocShell>
  );
}
