import type { Metadata } from 'next';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';
import { APP_NAME } from '@/constants/env';

export const metadata: Metadata = {
  title: `About Us | ${APP_NAME}`,
  description: `Learn about ${APP_NAME}, our mission, and pool-based rewards.`,
};

export default function AboutPage() {
  return (
    <MarketingDocShell
      title="About us"
      subtitle={`${APP_NAME} is a pool-based rewards platform built for clarity, fairness, and long-term growth.`}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Our mission</h2>
          <p>
            We help members build sustainable income through transparent pool distributions, direct referral rewards, and
            dynamic capping that grows with your team—so your potential isn&apos;t fixed on day one.
          </p>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">What we offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Multiple global pools (Single-Leg, Booster, Club, Salary, Leaderboard, Royalty)</li>
            <li>Direct referral rewards and a clear eligibility model</li>
            <li>Dashboard tools to track income, teams, and pool status</li>
            <li>Support channels for account and platform questions</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">How we operate</h2>
          <p>
            {APP_NAME} runs as a software platform operated by the project team. Features, schedules, and eligibility rules may
            be configured per project policy. Always review the latest Terms of Service, Disclaimer, and income documentation
            before making decisions.
          </p>
        </section>
      </div>
    </MarketingDocShell>
  );
}
