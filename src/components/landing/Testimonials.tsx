'use client';

import AnimatedSection from './AnimatedSection';
import { APP_NAME } from '@/constants/env';
import { Star, Quote } from 'lucide-react';

const getTestimonials = () => [
    {
        name: 'Sarah J.',
        role: 'Club Platinum-2',
        avatar: 'SJ',
        rating: 5,
        text: `With ${APP_NAME} I earn from direct referral, Single-Leg pass-up, and Club pool every month. My cap kept growing as my team grew — no other platform does that.`,
    },
    {
        name: 'Michael C.',
        role: 'Salary Elite',
        avatar: 'MC',
        rating: 5,
        text: 'The six pools make it clear where earnings come from. Booster and Leaderboard rewards land on the 1st; Club on the 8th, Salary on the 16th. Predictable and transparent.',
    },
    {
        name: 'Emily R.',
        role: 'Top 100 Leaderboard',
        avatar: 'ER',
        rating: 5,
        text: 'I track all my pool earnings in one dashboard — direct referral, Single-Leg, Booster, Club, Salary. The dynamic capping means my limit grows with every referral who joins.',
    },
    {
        name: 'David K.',
        role: 'Diamond-2 Club',
        avatar: 'DK',
        rating: 5,
        text: `${APP_NAME} stands out with pool-based rewards and fair capping. Club and Salary tiers are based on real metrics. Support helped me understand eligibility for each pool.`,
    },
];

export default function Testimonials() {
    const testimonials = getTestimonials();
    return (
        <section className="py-12 md:py-20 gradient-section">
            <div className="container-landing">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-8 md:mb-16">
                    <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs md:text-sm font-semibold mb-3 md:mb-4">
                        Success Stories
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                        What Our Members Say
                    </h2>
                    <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Hear from members earning across six pools and direct referral with {APP_NAME}.
                    </p>
                </AnimatedSection>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <AnimatedSection key={testimonial.name} delay={index * 100}>
                            <div className="bg-white dark:bg-[#12121a] rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-gray-800 h-full">
                                {/* Quote Icon */}
                                <Quote className="w-8 h-8 md:w-10 md:h-10 text-[var(--pw-primary)]/20 mb-3 md:mb-4" />

                                {/* Rating */}
                                <div className="flex gap-0.5 md:gap-1 mb-3 md:mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>

                                {/* Testimonial Text */}
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6 leading-relaxed">
                                    &ldquo;{testimonial.text}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[var(--pw-primary)] to-[#00B87A] flex items-center justify-center text-[#050508] font-bold text-sm md:text-base">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-xs md:text-sm text-[#00B87A] dark:text-[var(--pw-primary)]">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
