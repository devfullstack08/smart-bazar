import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE } from "@/constants/env";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: APP_DESCRIPTION || `Join ${APP_NAME} and earn from pooled rewards, direct referral, and dynamic capping.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        {/* Global SVG gradient for iconography (Icon variant="gradient") */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient id="brand-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--pw-primary)" />
              <stop offset="100%" stopColor="var(--pw-secondary)" />
            </linearGradient>
          </defs>
        </svg>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
