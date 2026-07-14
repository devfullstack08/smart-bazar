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
    <main className="min-h-screen bg-[var(--background)] overflow-x-hidden relative">
      {/* Premium Radial Ambient Glows & Grid Mesh for Landing */}
      <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-[var(--primary)]/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[65%] h-[65%] bg-indigo-500/[0.04] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.012)_1px,transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />

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
