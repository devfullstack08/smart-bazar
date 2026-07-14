'use client';

import Link from 'next/link';
import AnimatedSection from './AnimatedSection';
import { APP_NAME } from '@/constants/env';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="section bg-[var(--background)]">
      <div className="container-landing">
        <AnimatedSection>
          <div className="
            relative overflow-hidden rounded-2xl sm:rounded-3xl
            bg-[var(--surface-elevated)]
            border border-[var(--border)]
            shadow-xl shadow-black/5 dark:shadow-black/40
            mx-2 sm:mx-0
          ">
            {/* Subtle top accent line */}
            <div className="h-px w-20 sm:w-24 mx-auto bg-[var(--pw-primary)]/30" aria-hidden />

            <div className="px-5 py-12 sm:px-8 md:px-12 lg:px-16 py-14 md:py-20 text-center">
              {/* Badge */}
              <div className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-full
                bg-[var(--pw-primary)]/10 text-[var(--pw-primary)]
                text-sm font-medium mb-5 sm:mb-6
              ">
                <Sparkles className="w-4 h-4" />
                <span>Join the Pools</span>
              </div>

              {/* Headline - scales better */}
              <h2
                className="
                  text-3xl sm:text-4xl md:text-5xl lg:text-5xl
                  font-bold text-[var(--foreground)]
                  leading-tight sm:leading-snug
                  mb-5 sm:mb-6
                "
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ready to Earn From
                <br className="sm:hidden" />
                Six Reward Pools?
              </h2>

              {/* Description */}
              <p className="
                text-base sm:text-lg md:text-xl
                text-[var(--muted-foreground)]
                mb-8 sm:mb-10
                max-w-xl lg:max-w-2xl mx-auto
                leading-relaxed px-2 sm:px-0
              ">
                Join thousands of members already earning through 5% direct referrals,
                Single-Leg pass-up, Booster, Club, Salary, Leaderboard & Royalty pools.
                Your earning cap grows as your team grows with {APP_NAME}.
              </p>

              {/* Stats - more compact on mobile */}
              <div className="
                grid grid-cols-2 sm:flex sm:flex-wrap
                justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12
                mb-8 sm:mb-10
              ">
                {[
                  { value: '$2.5M+', label: 'Total Payouts' },
                  { value: '50K+', label: 'Active Members' },
                  { value: '100+', label: 'Countries' },
                  { value: '24/7', label: 'Support' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="
                      text-2xl sm:text-3xl md:text-4xl
                      font-bold text-[var(--foreground)]
                    ">
                      {stat.value}
                    </div>
                    <div className="
                      text-xs sm:text-sm
                      text-[var(--muted-foreground)] mt-1
                    ">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="
                flex flex-col sm:flex-row
                items-center justify-center
                gap-4 sm:gap-5 md:gap-6
                px-4 sm:px-0
              ">
                <Link
                  href="/register"
                  className="
                    inline-flex items-center justify-center gap-2
                    w-full sm:w-auto min-w-[220px]
                    bg-[var(--pw-primary)] text-[var(--background)]
                    hover:opacity-90 active:opacity-80
                    text-base sm:text-lg
                    px-8 sm:px-10 py-3.5 sm:py-4
                    rounded-xl font-semibold
                    transition-all duration-300
                    hover:shadow-[var(--shadow-glow)]
                    hover:-translate-y-0.5
                    shadow-md shadow-black/10
                  "
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/login"
                  className="
                    inline-flex items-center justify-center
                    w-full sm:w-auto min-w-[220px]
                    border border-[var(--border)]
                    text-[var(--foreground)]
                    hover:bg-[var(--surface)]
                    hover:border-[var(--pw-primary)]
                    active:opacity-80
                    text-base sm:text-lg
                    px-8 sm:px-10 py-3.5 sm:py-4
                    rounded-xl font-medium
                    transition-all duration-300
                  "
                >
                  Sign In
                </Link>
              </div>

        
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}