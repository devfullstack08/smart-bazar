import { APP_NAME } from '@/constants/env';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';

export default function PrivacyPage() {
    return (
        <MarketingDocShell title="Privacy Policy" subtitle="Last updated: January 18, 2026">
                <div className="max-w-none space-y-6 text-[var(--muted-foreground)]">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">Introduction</h2>
                        <p>
                            {APP_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we
                            collect, use, disclose, and safeguard your information when you use our MLM platform and services.
                        </p>
                        <p className="mt-3">
                            By using {APP_NAME}, you agree to the collection and use of information in accordance with this policy.
                        </p>
                    </section>

                    {/* 1. Information We Collect */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">1. Information We Collect</h2>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">1.1 Personal Information</h3>
                        <p>When you register and use our platform, we collect:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Full name, email address, phone number, country</li>
                            <li><strong>MLM Information:</strong> Sponsor ID, placement position, user ID, rank</li>
                            <li><strong>Financial Information:</strong> Wallet addresses, bank account details (for withdrawals), transaction history</li>
                            <li><strong>Identity Verification:</strong> Government-issued ID, proof of address (for KYC compliance)</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">1.2 Automatically Collected Information</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                            <li><strong>Usage Data:</strong> Pages visited, time spent, features used</li>
                            <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
                            <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">1.3 Information from Third Parties</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payment processor information (for deposits and withdrawals)</li>
                            <li>KYC verification service data</li>
                            <li>Analytics and advertising partners</li>
                        </ul>
                    </section>

                    {/* 2. How We Use Your Information */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">2. How We Use Your Information</h2>
                        <p>We use the collected information for the following purposes:</p>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">2.1 Service Provision</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Create and manage your account</li>
                            <li>Process package purchases and withdrawals</li>
                            <li>Calculate and distribute income (ROI, referral, level, rank, auto-pool)</li>
                            <li>Maintain your genealogy tree and team structure</li>
                            <li>Provide customer support</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">2.2 Security and Compliance</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Verify your identity (KYC/AML compliance)</li>
                            <li>Prevent fraud and unauthorized access</li>
                            <li>Comply with legal obligations and regulations</li>
                            <li>Detect and prevent prohibited activities</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">2.3 Communication</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Send transactional emails (income notifications, withdrawal confirmations)</li>
                            <li>Provide platform updates and announcements</li>
                            <li>Send promotional materials (you can opt-out)</li>
                            <li>Respond to your inquiries and support requests</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">2.4 Analytics and Improvement</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Analyze platform usage and user behavior</li>
                            <li>Improve our services and user experience</li>
                            <li>Develop new features and functionality</li>
                            <li>Monitor platform performance and security</li>
                        </ul>
                    </section>

                    {/* 3. Information Sharing */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">3. Information Sharing and Disclosure</h2>
                        <p>We may share your information in the following circumstances:</p>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">3.1 Within Your Network</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your sponsor can see your basic information (name, user ID, package, status)</li>
                            <li>Your downline members are visible in your genealogy tree</li>
                            <li>Team statistics are shared with upline members</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">3.2 Service Providers</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payment processors (for deposits and withdrawals)</li>
                            <li>KYC/AML verification services</li>
                            <li>Email service providers</li>
                            <li>Cloud hosting and storage providers</li>
                            <li>Analytics and monitoring tools</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">3.3 Legal Requirements</h3>
                        <p>We may disclose your information if required by law or in response to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Court orders or legal processes</li>
                            <li>Government or regulatory requests</li>
                            <li>Law enforcement investigations</li>
                            <li>Protection of our rights and safety</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">3.4 Business Transfers</h3>
                        <p>
                            In the event of a merger, acquisition, or sale of assets, your information may be transferred to the
                            acquiring entity.
                        </p>
                    </section>

                    {/* 4. Data Security */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">4. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your information:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                            <li><strong>Access Controls:</strong> Role-based access and authentication</li>
                            <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                            <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
                            <li><strong>Monitoring:</strong> 24/7 system monitoring for suspicious activity</li>
                        </ul>
                        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                            <strong>Note:</strong> While we strive to protect your information, no method of transmission over the internet
                            is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
                        </p>
                    </section>

                    {/* 5. Your Rights */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">5. Your Privacy Rights & DPDP Act (India) Compliance</h2>
                        <p>Under the Digital Personal Data Protection (DPDP) Act, 2023 (India) and international privacy laws, you have the following rights regarding your personal information:</p>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">5.1 Access and Portability</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Request a summary of your personal data processed by our platform</li>
                            <li>Download your account information and transaction history</li>
                            <li>Access your data through your user profile dashboard</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">5.2 Correction and Update</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Update your profile information (name, phone, country)</li>
                            <li>Correct inaccurate or incomplete data</li>
                            <li>Update your payment and withdrawal preferences</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">5.3 Data Erasure & Withdrawal of Consent</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Request erasure of personal data when no longer needed for processing</li>
                            <li>Withdraw consent previously granted for optional data processing</li>
                            <li>Note: Necessary financial data and KYC records may be retained as mandated by Prevention of Money Laundering Act (PMLA) regulations</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-4">5.4 Opt-Out</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Unsubscribe from promotional emails</li>
                            <li>Disable non-essential cookies</li>
                            <li>Opt-out of certain data collection (may limit functionality)</li>
                        </ul>
                    </section>

                    {/* 6. Cookies and Tracking */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">6. Cookies and Tracking Technologies</h2>
                        <p>We use cookies and similar technologies for:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Essential Cookies:</strong> Required for platform functionality (login, session management)</li>
                            <li><strong>Performance Cookies:</strong> Analytics and usage statistics</li>
                            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                            <li><strong>Advertising Cookies:</strong> Deliver relevant advertisements (if applicable)</li>
                        </ul>
                        <p className="mt-3">
                            You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality.
                        </p>
                    </section>

                    {/* 7. International Data Transfers */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">7. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and processed in countries other than your country of residence.
                            We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                        </p>
                    </section>

                    {/* 8. Children's Privacy */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">8. Children's Privacy</h2>
                        <p>
                            Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal
                            information from children. If you believe we have collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    {/* 9. Data Retention */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">9. Data Retention</h2>
                        <p>We retain your information for as long as necessary to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide our services and maintain your account</li>
                            <li>Comply with legal and regulatory requirements</li>
                            <li>Resolve disputes and enforce our agreements</li>
                            <li>Maintain business records and analytics</li>
                        </ul>
                        <p className="mt-3">
                            After account deletion, we may retain certain information for legal compliance and record-keeping purposes.
                        </p>
                    </section>

                    {/* 10. Changes to Privacy Policy */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">10. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
                            "Last Updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    {/* 11. Contact Us & Grievance Redressal (India) */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">11. Contact Us & Grievance Redressal Officer</h2>
                        <p>
                            If you have questions about this Privacy Policy or wish to exercise your privacy rights under DPDP Act 2023 or IT Rules 2021, please contact our Grievance Redressal Mechanism:
                        </p>
                        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl mt-3 space-y-1">
                            <p><strong className="text-[var(--foreground)]">Email:</strong> privacy@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.com</p>
                            <p><strong className="text-[var(--foreground)]">Grievance Officer:</strong> grievance@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.com</p>
                            <p><strong>Response Timeline:</strong> Acknowledgment within 48 hours, Resolution within 15 days as mandated by IT Rules 2021.</p>
                        </div>
                    </section>

                    {/* Acceptance */}
                    <section className="border-t pt-6 mt-8">
                        <div className="bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 p-4 rounded-r-lg">
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                By using {APP_NAME}, you acknowledge that you have read and understood this Privacy Policy and agree to
                                the collection, use, and disclosure of your information as described herein.
                            </p>
                        </div>
                    </section>
                </div>
        </MarketingDocShell>
    );
}
