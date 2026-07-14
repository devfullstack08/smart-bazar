'use client';

import AnimatedSection from './AnimatedSection';
import { Star, Check, ArrowRight } from 'lucide-react';

const ranks = [
    { name: 'Star-1', selfBiz: '$100', direct: 5, teamBiz: '$5,000', reward: '$15' },
    { name: 'Star-2', selfBiz: '$200', direct: 10, teamBiz: '$10,000', reward: '$30' },
    { name: 'Star-3', selfBiz: '$500', direct: 10, teamBiz: '$15,000', reward: '$45' },
    { name: 'Star-4', selfBiz: '$1,000', direct: 10, teamBiz: '$25,000', reward: '$75' },
    { name: 'Star-5', selfBiz: '$1,500', direct: 15, teamBiz: '$50,000', reward: '$150' },
    { name: 'Star-6', selfBiz: '$2,500', direct: 15, teamBiz: '$75,000', reward: '$225' },
    { name: 'Star-7', selfBiz: '$2,500', direct: 15, teamBiz: '$100,000', reward: '$300' },
    { name: 'Star-8', selfBiz: '$2,500', direct: 15, teamBiz: '$125,000', reward: '$375' },
    { name: 'Star-9', selfBiz: '$2,500', direct: 15, teamBiz: '$150,000', reward: '$450' },
    { name: 'Star-10', selfBiz: '$2,500', direct: 15, teamBiz: '$200,000', reward: '$600' },
];

export default function RankSystem() {
    return (
        <section className="section gradient-section overflow-hidden">
            <div className="container-landing">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-4">
                        Achievement System
                    </span>
                    <h2 className="heading-lg text-gray-900 dark:text-white mb-4">
                        10 Ranks to Greatness
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Climb the ranks from Star-1 to Star-10 and earn monthly rewards for 12 months.
                        Each rank unlocks higher rewards and recognition.
                    </p>
                </AnimatedSection>

                {/* Highlighted Top Ranks */}
                <AnimatedSection className="mb-8 md:mb-12">
                    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                        {/* Star-1 Entry */}
                        <div className="card p-4 md:p-6">
                            <div className="flex items-center gap-3 mb-3 md:mb-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Star-1</h3>
                                    <p className="text-xs md:text-sm text-gray-500">Entry Level</p>
                                </div>
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">$15</div>
                            <div className="text-sm text-gray-500 mb-3 md:mb-4">Monthly Reward</div>
                            <div className="space-y-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>Self Business: $100</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>Direct Referrals: 5</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>Team Business: $5,000</span>
                                </div>
                            </div>
                        </div>

                        {/* Star-5 Popular */}
                        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-xl md:scale-105 z-10">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-block px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-lg">
                                    POPULAR
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-3 md:mb-4 pt-2">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm md:text-base">Star-5</h3>
                                    <p className="text-xs md:text-sm text-white/70">Mid Tier</p>
                                </div>
                            </div>
                            <div className="text-3xl md:text-4xl font-bold mb-1">$150</div>
                            <div className="text-sm text-white/70 mb-3 md:mb-4">Monthly Reward</div>
                            <div className="space-y-2 text-xs md:text-sm">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    <span>Self Business: $1,500</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    <span>Direct Referrals: 15</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    <span>Team Business: $50,000</span>
                                </div>
                            </div>
                        </div>

                        {/* Star-10 Top */}
                        <div className="card p-4 md:p-6 border-amber-500/50">
                            <div className="flex items-center gap-3 mb-3 md:mb-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Star-10</h3>
                                    <p className="text-xs md:text-sm text-amber-600">Top Achiever</p>
                                </div>
                            </div>
                            <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">$600</div>
                            <div className="text-sm text-gray-500 mb-3 md:mb-4">Monthly Reward</div>
                            <div className="space-y-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <span>Self Business: $2,500</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <span>Direct Referrals: 15</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <span>Team Business: $200,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Full Rank Table */}
                <AnimatedSection>
                    <div className="bg-white dark:bg-[#12121a] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="heading-sm text-gray-900 dark:text-white">Complete Rank Structure</h3>
                            <p className="text-gray-500">All rewards distributed monthly for 12 months</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#0a0a0f] text-left">
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Rank</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Self Business</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Direct Team</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Team Business</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Monthly Reward</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranks.map((rank, index) => (
                                        <tr
                                            key={rank.name}
                                            className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Star className={`w-4 h-4 ${index >= 7 ? 'text-amber-500' : 'text-gray-400'}`} />
                                                    <span className="font-semibold text-gray-900 dark:text-white">{rank.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{rank.selfBiz}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{rank.direct}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{rank.teamBiz}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${index >= 7 ? 'gradient-text' : 'text-gray-900 dark:text-white'}`}>
                                                    {rank.reward}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Info Banner */}
                <AnimatedSection className="mt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Star className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Rank Income Rules</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    If multiple ranks achieved, only the higher reward is given. Rewards paid on the 1st of each month.
                                </p>
                            </div>
                        </div>
                        <button className="btn btn-primary whitespace-nowrap">
                            Start Your Journey
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
