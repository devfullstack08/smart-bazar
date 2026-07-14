'use client';

import { useState, useEffect } from 'react';
import { Banner } from '@/types';
import { getBannerUrl } from '@/lib/utils/banner';

const AUTO_ROTATE_INTERVAL = 5000;

interface BannerCarouselProps {
    banners: Banner[];
    loading?: boolean;
    className?: string;
}

export function BannerCarousel({
    banners,
    loading = false,
    className = ''
}: BannerCarouselProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (loading || !banners?.length || banners.length <= 1) return;

        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % banners.length);
        }, AUTO_ROTATE_INTERVAL);

        return () => clearInterval(timer);
    }, [loading, banners?.length]);

    if (loading) {
        return (
            <div className={`w-full h-[180px] sm:h-[250px] md:h-[350px] lg:h-[450px] rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse ${className}`} />
        );
    }

    if (!banners?.length) return null;

    return (
        <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
            
            {/* Responsive height container */}
            <div className="relative w-full h-[180px] sm:h-[250px] md:h-[350px] lg:h-[450px]">
                
                {banners.map((banner, i) => (
                    <img
                        key={banner._id}
                        src={getBannerUrl(banner.image)}
                        alt={`Banner ${i + 1}`}
                        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                            i === index
                                ? 'opacity-100 scale-100 z-10'
                                : 'opacity-0 scale-105 z-0'
                        }`}
                        style={{
                            objectFit: 'cover', // change to 'contain' if banner must be fully visible
                        }}
                    />
                ))}
            </div>

            {/* Dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                                i === index
                                    ? 'bg-white scale-110'
                                    : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}