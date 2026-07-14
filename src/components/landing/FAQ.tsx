'use client';

import { useState } from 'react';
import AnimatedSection from './AnimatedSection';
import { APP_NAME } from '@/constants/env';
import { MARKETING_FAQS } from '@/constants/faq';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = MARKETING_FAQS;

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-12 md:py-20 bg-gray-50 dark:bg-[#0a0a0f]">
            <div className="container-landing">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-8 md:mb-16">
                    <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs md:text-sm font-semibold mb-3 md:mb-4">
                        Got Questions?
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Everything you need to know about {APP_NAME}.
                    </p>
                </AnimatedSection>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-3 md:space-y-4">
                        {faqs.map((faq, index) => (
                            <AnimatedSection key={index} delay={index * 50}>
                                <div
                                    className={`bg-white dark:bg-[#12121a] rounded-xl md:rounded-2xl border transition-all ${openIndex === index ? 'border-[var(--pw-primary)]/50' : 'border-gray-200 dark:border-gray-800'}`}
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                                    >
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <HelpCircle className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${openIndex === index ? 'text-[var(--pw-primary)]' : 'text-gray-400'}`} />
                                            <span className={`text-sm md:text-base font-medium ${openIndex === index ? 'text-[var(--pw-primary)]' : 'text-gray-900 dark:text-white'}`}>
                                                {faq.question}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180 text-[var(--pw-primary)]' : 'text-gray-400'}`} />
                                    </button>
                                    {openIndex === index && (
                                        <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
                                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 pl-6 md:pl-8">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>

                {/* Contact CTA */}
                <AnimatedSection className="mt-8 md:mt-12">
                    <div className="max-w-3xl mx-auto text-center p-6 md:p-8 bg-white dark:bg-[#12121a] rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6">
                            Can&apos;t find the answer? Contact our support team.
                        </p>
                        <a
                            href={`mailto:support@${APP_NAME}.com`}
                            className="btn btn-primary text-sm md:text-base p-2.5"
                        >
                            Contact Support
                        </a>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
