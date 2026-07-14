import { APP_NAME } from '@/constants/env';
import MarketingDocShell from '@/components/marketing/MarketingDocShell';

export default function TermsPage() {
    return (
        <MarketingDocShell title="Terms of Service" subtitle="Please read these terms carefully before using the platform.">
                <div className="max-w-none space-y-6 text-[var(--muted-foreground)]">
                    {/* 1. Agreement to Terms */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">1. Agreement to Terms</h2>
                        <p>
                            By accessing and using {APP_NAME} MLM platform (&quot;Service&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;).
                            If you disagree with any part of these terms, you may not access the Service.
                        </p>
                    </section>

                    {/* 2. Eligibility */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">2. Eligibility</h2>
                        <p>You must meet the following requirements to use our Service:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                            <li>Have the legal capacity to enter into a binding contract</li>
                            <li>Not be prohibited from using the Service under applicable laws</li>
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain the security of your account credentials</li>
                        </ul>
                    </section>

                    {/* 3. MLM Business Opportunity */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">3. MLM Business Opportunity</h2>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">3.1 Income Disclaimer</h3>
                            <p>
                                {APP_NAME} provides a business opportunity through a multi-level marketing structure. Your income depends on
                                your efforts, team building, and market conditions. We make no guarantees of income or earnings.
                            </p>

                            <h3 className="text-lg font-semibold text-[var(--foreground)]">3.2 Package Purchase</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>All package purchases are final and non-refundable</li>
                                <li>Packages are valid for the duration specified in the package details</li>
                                <li>Daily ROI is subject to capping limits as specified in your package</li>
                                <li>Income is calculated based on active packages and team performance</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-[var(--foreground)]">3.3 Binary System</h3>
                            <p>
                                {APP_NAME} operates on a binary MLM structure. You must place new referrals on either the left or right leg.
                                Income calculations are based on the weaker leg performance and matching bonuses.
                            </p>
                        </div>
                    </section>

                    {/* 4. Income Types */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">4. Income Types</h2>
                        <p>The following income types are available based on your package and performance:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Direct Referral Income:</strong> Earned when you directly refer new members</li>
                            <li><strong>Daily ROI:</strong> 1% daily return on your staking package amount</li>
                            <li><strong>Level ROI:</strong> Percentage-based income from your downline's daily ROI (up to 15 levels)</li>
                            <li><strong>Rank Income:</strong> Monthly rewards based on achieving specific ranks</li>
                            <li><strong>Global Auto-Pool:</strong> Share of global pool distribution</li>
                        </ul>
                        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                            <strong>Note:</strong> All income is subject to capping limits. Once your total earnings reach 2x your package value,
                            daily ROI will stop. You must purchase a new package to continue earning.
                        </p>
                    </section>

                    {/* 5. Wallet and Withdrawals */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">5. Wallet and Withdrawals</h2>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">5.1 Wallet Types</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Main Wallet:</strong> Withdrawable balance from your earnings</li>
                                <li><strong>Rebirth Wallet:</strong> Auto-pool and bonus income (may have specific withdrawal conditions)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-[var(--foreground)]">5.2 Withdrawal Policy</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Minimum withdrawal amount: $10 USD</li>
                                <li>Withdrawal requests are processed within 24-72 hours</li>
                                <li>You are responsible for any transaction fees charged by payment processors</li>
                                <li>We reserve the right to verify your identity before processing withdrawals</li>
                                <li>Suspicious activity may result in withdrawal delays or account suspension</li>
                            </ul>
                        </div>
                    </section>

                    {/* 6. Prohibited Activities */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">6. Prohibited Activities</h2>
                        <p>You agree NOT to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Create multiple accounts or use fake identities</li>
                            <li>Manipulate the system through fraudulent means</li>
                            <li>Use automated bots or scripts to interact with the platform</li>
                            <li>Make false or misleading income claims to recruit others</li>
                            <li>Engage in any illegal activities or money laundering</li>
                            <li>Share your account credentials with others</li>
                            <li>Reverse engineer or attempt to hack the platform</li>
                        </ul>
                    </section>

                    {/* 7. Account Termination */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">7. Account Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your account at any time for violation of these Terms,
                            fraudulent activity, or any other reason we deem necessary. Upon termination:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your access to the platform will be immediately revoked</li>
                            <li>Pending withdrawals may be processed or forfeited based on the violation</li>
                            <li>You will not be entitled to any refunds for purchased packages</li>
                            <li>Your downline structure may be reassigned or dissolved</li>
                        </ul>
                    </section>

                    {/* 8. Limitation of Liability */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">8. Limitation of Liability</h2>
                        <p>
                            {APP_NAME} and its operators shall not be liable for any indirect, incidental, special, consequential,
                            or punitive damages resulting from your use of the Service. This includes but is not limited to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Loss of profits or income</li>
                            <li>Loss of data or business opportunities</li>
                            <li>Service interruptions or technical issues</li>
                            <li>Third-party payment processor failures</li>
                            <li>Market fluctuations or cryptocurrency value changes</li>
                        </ul>
                    </section>

                    {/* 9. Risk Acknowledgment */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">9. Risk Acknowledgment</h2>
                        <div className="bg-amber-50 dark:bg-amber-950/35 border-l-4 border-amber-500 p-4 my-4 rounded-r-lg">
                            <p className="font-semibold text-amber-900 dark:text-amber-200">Important Risk Disclosure:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2 text-amber-800 dark:text-amber-300">
                                <li>MLM business involves financial risk and is not suitable for everyone</li>
                                <li>Past performance does not guarantee future results</li>
                                <li>You may lose your entire investment</li>
                                <li>Success depends on your efforts, market conditions, and team performance</li>
                                <li>Cryptocurrency and digital assets are highly volatile</li>
                            </ul>
                        </div>
                    </section>

                    {/* 10. Modifications */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">10. Modifications to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.
                            Your continued use of the Service after changes constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    {/* 11. Governing Law */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">11. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                            {APP_NAME} is registered, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    {/* 12. Contact Information */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3">12. Contact Information</h2>
                        <p>
                            For questions about these Terms, please contact us at:
                        </p>
                        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-lg mt-3">
                            <p><strong className="text-[var(--foreground)]">Email:</strong> support@{APP_NAME}.com</p>
                            <p><strong>Support Portal:</strong> Available in your dashboard</p>
                        </div>
                    </section>

                    {/* Acceptance */}
                    <section className="border-t pt-6 mt-8">
                        <div className="bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 p-4 rounded-r-lg">
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                By checking the "I accept the Terms and Conditions" box during registration, you acknowledge that you have
                                read, understood, and agree to be bound by these Terms.
                            </p>
                        </div>
                    </section>
                </div>
        </MarketingDocShell>
    );
}
