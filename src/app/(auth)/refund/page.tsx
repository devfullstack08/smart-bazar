import type { Metadata } from 'next';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';

export const metadata: Metadata = {
  title: `Refund Policy | ${APP_NAME}`,
  description: `Refund and purchase policy for ${APP_NAME}.`,
};

export default function RefundPage() {
  return (
    <MarketingDocShell
      title="Refund policy"
      subtitle="How purchases, withdrawals, and exceptions are handled."
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Package purchases</h2>
          <p>
            Digital product and package purchases on {APP_NAME} are generally <strong className="text-[var(--foreground)]">final and non-refundable</strong> once
            confirmed, except where required by applicable law or explicitly approved by support in writing. Activation may
            unlock income features immediately; reversing completed benefits is often not feasible.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Withdrawals</h2>
          <p>
            Withdrawals are processed according to platform rules, minimum amounts, verification, and compliance checks.
            Approved payouts are sent to details you provide; incorrect wallet or bank information supplied by you may result in
            loss we cannot reverse. Fees charged by banks or blockchain networks may apply.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Chargebacks and disputes</h2>
          <p>
            Misuse of chargebacks or payment network disputes where a valid purchase was made may lead to account suspension and
            recovery of costs. Contact support before initiating a dispute so we can review your case.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Exceptional cases</h2>
          <p>
            In rare cases (e.g. duplicate charge, proven technical error attributable to us), we may offer a credit or refund at
            our discretion. Requests must be submitted through official support channels with complete details.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Contact</h2>
          <p>
            For refund-related questions:{' '}
            <a href={`mailto:support@${APP_NAME.toLowerCase()}.com`} className="text-[var(--pw-primary)] font-semibold hover:underline">
              support@{APP_NAME.toLowerCase()}.com
            </a>
            .
          </p>
        </section>
      </div>
    </MarketingDocShell>
  );
}
