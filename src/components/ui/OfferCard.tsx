'use client';

import { Offer } from '@/types';
import { getOfferImageUrl } from '@/lib/utils/banner';
import { Award, Users, UserPlus, Package } from 'lucide-react';

interface OfferCardProps {
    offer: Offer;
}

export function OfferCard({ offer }: OfferCardProps) {
    const { name, teamReqCount, directReqCount, selfPackage, images, eligible, userStats } = offer;
    const imageUrl = images?.[0] ? getOfferImageUrl(images[0]) : null;

    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30">
            <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shrink-0"
                    />
                ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{name}</h3>
                    <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 space-x-1">
                        <span className="inline-flex items-center gap-0.5">
                            <Users size={12} className="shrink-0" />
                            {teamReqCount} team
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                            <UserPlus size={12} className="shrink-0" />
                            {directReqCount} direct
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                            <Package size={12} className="shrink-0" />
                            {selfPackage} pkg
                        </span>
                    </p>
                    {userStats && (
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Your progress: {userStats.directCount}/{directReqCount} direct · {userStats.teamCount}/{teamReqCount} team · {userStats.selfPackageCount}/{selfPackage} pkg
                        </p>
                    )}
                    <span
                        className={`inline-block mt-1.5 sm:mt-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            eligible
                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                        }`}
                    >
                        {eligible ? 'Eligible for claim' : 'Not eligible'}
                    </span>
                </div>
            </div>
        </div>
    );
}
