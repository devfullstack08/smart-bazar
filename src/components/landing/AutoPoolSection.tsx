'use client';

import AnimatedSection from './AnimatedSection';
import { Users, DollarSign, ArrowDown, Wallet, RefreshCw } from 'lucide-react';

export default function AutoPoolSection() {
    return (
        <section id="autopool" className="py-12 md:py-20 gradient-section overflow-hidden">
            <div className="container-landing">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-8 md:mb-16">
                    <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs md:text-sm font-semibold mb-3 md:mb-4">
                        Passive Income System
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                        Global Auto-Pool Matrix
                    </h2>
                    <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Participate in our 3x2 matrix with just $10. Earn from 6 positions per cycle.
                    </p>
                </AnimatedSection>

                <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
                    {/* Matrix Visualization */}
                    <AnimatedSection animation="fade-left">
                        <div className="relative">
                            {/* Matrix Tree */}
                            <div className="bg-white dark:bg-[#12121a] rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-200 dark:border-gray-800">
                                <div className="flex flex-col items-center">
                                    {/* Level 0 - You */}
                                    <div className="relative">
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm md:text-lg shadow-lg">
                                            YOU
                                        </div>
                                        {/* Connecting lines */}
                                        <div className="absolute top-full left-1/2 w-0.5 h-4 md:h-8 bg-gradient-to-b from-indigo-500 to-purple-500" />
                                    </div>

                                    {/* Connector */}
                                    <div className="w-[120px] md:w-[200px] h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 mt-4 md:mt-8" />

                                    {/* Level 1 - 2 Members */}
                                    <div className="flex items-center gap-12 md:gap-24 mt-2 relative">
                                        <div className="absolute top-0 left-1/4 w-0.5 h-3 md:h-4 bg-gradient-to-b from-purple-500 to-indigo-500" style={{ transform: 'translateX(-50%)' }} />
                                        <div className="absolute top-0 right-1/4 w-0.5 h-3 md:h-4 bg-gradient-to-b from-purple-500 to-indigo-500" style={{ transform: 'translateX(50%)' }} />

                                        <div className="relative">
                                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                                <Users className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <div className="absolute top-full left-1/2 w-0.5 h-4 md:h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 -translate-x-1/2" />
                                            <div className="text-center mt-1 md:mt-2">
                                                <span className="text-xs md:text-sm font-semibold text-green-600">$3</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                                <Users className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <div className="absolute top-full left-1/2 w-0.5 h-4 md:h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 -translate-x-1/2" />
                                            <div className="text-center mt-1 md:mt-2">
                                                <span className="text-xs md:text-sm font-semibold text-green-600">$3</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Level 1 Label */}
                                    <div className="flex items-center gap-2 md:gap-4 my-3 md:my-4">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs md:text-sm font-medium whitespace-nowrap">
                                            L1: 2 × $3 = $6
                                        </span>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                    </div>

                                    {/* Level 2 Connector */}
                                    <div className="flex gap-6 md:gap-12">
                                        <div className="w-[50px] md:w-[80px] h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                                        <div className="w-[50px] md:w-[80px] h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />
                                    </div>

                                    {/* Level 2 - 4 Members */}
                                    <div className="flex items-center gap-2 md:gap-6 mt-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="relative">
                                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-md text-xs md:text-sm">
                                                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                                                </div>
                                                <div className="text-center mt-1 md:mt-2">
                                                    <span className="text-xs md:text-sm font-semibold text-green-600">$9</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Level 2 Label */}
                                    <div className="flex items-center gap-2 md:gap-4 mt-3 md:mt-4">
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full text-xs md:text-sm font-medium whitespace-nowrap">
                                            L2: 4 × $9 = $36
                                        </span>
                                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="mt-4 md:mt-8 p-3 md:p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-xl md:rounded-2xl border border-indigo-500/20">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Total Cycle Income</span>
                                        <span className="text-xl md:text-2xl font-bold gradient-text">$42</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Info Cards */}
                    <AnimatedSection animation="fade-right">
                        <div className="space-y-6">
                            {/* Entry Info */}
                            <div className="bg-white dark:bg-[#12121a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">$10 Entry</h3>
                                        <p className="text-gray-500">Global Package-1</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Join the auto-pool with just $10. Position yourself in the 3x2 matrix
                                    and earn from both levels automatically.
                                </p>
                            </div>

                            {/* Income Distribution */}
                            <div className="bg-white dark:bg-[#12121a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-indigo-600" />
                                    Income Distribution
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600 dark:text-gray-300">Main Wallet</span>
                                            <span className="font-bold text-indigo-600">60% = $25.20</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: '60%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600 dark:text-gray-300">Global Rebirth Wallet</span>
                                            <span className="font-bold text-cyan-600">25% = $10.50</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: '25%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600 dark:text-gray-300">Admin Fee</span>
                                            <span className="font-bold text-gray-500">15% = $6.30</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill bg-gray-400" style={{ width: '15%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auto Rebirth */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <RefreshCw className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Automatic Re-entry</h4>
                                        <p className="text-white/80">
                                            Global Rebirth Wallet automatically re-enters you in the $10 pool for continuous earnings.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Matrix Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-[#12121a] rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                                    <div className="text-3xl font-bold gradient-text mb-1">3x2</div>
                                    <div className="text-sm text-gray-500">Matrix Structure</div>
                                </div>
                                <div className="bg-white dark:bg-[#12121a] rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                                    <div className="text-3xl font-bold gradient-text mb-1">6</div>
                                    <div className="text-sm text-gray-500">Positions Per Cycle</div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </section>
    );
}
