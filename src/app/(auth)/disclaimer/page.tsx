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
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Direct Selling & Anti-Money Circulation Disclosure (India)</h2>
          <p>
            {APP_NAME} operates in compliance with the Consumer Protection (Direct Selling) Rules, 2021. The platform does NOT operate a pyramid scheme, Ponzi scheme, or money circulation scheme prohibited under the Prize Chits and Money Circulation Schemes (Banning) Act, 1978. All commissions and rewards are linked strictly to direct performance, package subscriptions, and sales metrics.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Virtual Digital Assets (VDA) & Indian Tax Regulations</h2>
          <p>
            For users residing in India, Web3 and cryptocurrency transactions (USDT/Tokens) fall under Virtual Digital Asset (VDA) regulations governed by Section 115BBH and Section 194S of the Income Tax Act, 1961. Users are solely responsible for declaring VDA earnings, deducting applicable Tax Deducted at Source (TDS), and paying flat 30% tax on crypto gains as mandated by the Government of India.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Risk Acknowledgment</h2>
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
            of MLM and digital assets varies by country; you are responsible for compliance with laws that apply to your local jurisdiction.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Grievance Redressal & Support (India IT Rules 2021)</h2>
          <p className="mb-3">
            In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, users in India can contact our designated Grievance Redressal Officer for any concerns:
          </p>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1 text-sm">
            <p><strong>Grievance Officer:</strong> Legal & Compliance Team</p>
            <p><strong>Email:</strong> grievance@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.com</p>
            <p><strong>Acknowledgment SLA:</strong> Within 48 Hours | <strong>Resolution SLA:</strong> Within 15 Days</p>
          </div>
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
