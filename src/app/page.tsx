import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE } from '@/constants/env';
import {
  Navbar,
  Hero,
  Features,
  IncomeTypes,
  PackageShowcase,
  Testimonials,
  FAQ,
  CTASection,
  Footer,
} from '@/components/landing';

export const metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: `Join ${APP_NAME}: earn 20% direct referral, 25% binary matching, 5% binary placement, and upline global auto-pool cycle payouts. Activate your premium store membership package today.`,
  keywords: `${APP_NAME}, e-commerce MLM, direct referral, binary matching, global auto-pool, spillover, store package`,
  openGraph: {
    title: `${APP_NAME} - ${APP_TAGLINE}`,
    description: `Earn 20% direct referral, 25% binary matching, and 5% placement spillover, along with cycle complete upline global auto-pool payouts.`,
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <IncomeTypes />
      <PackageShowcase />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
