'use client';

import { useState, useRef, useCallback, type ReactNode, type TouchEvent } from 'react';

interface Tab {
    id: string;
    icon: ReactNode;
    label: string;
    content: ReactNode;
}

interface MobileArenaTabViewProps {
    tabs: Tab[];
    /** Class applied to the content panel */
    panelClassName?: string;
}

/**
 * Mobile-only swipeable tab view. On `xl:` and above, this renders nothing —
 * the parent should render the desktop grid layout alongside.
 *
 * Only renders the active tab to prevent horizontal overflow.
 */
export default function MobileArenaTabView({ tabs, panelClassName = '' }: MobileArenaTabViewProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);
    const isSwiping = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
        isSwiping.current = true;
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isSwiping.current) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!isSwiping.current) return;
        isSwiping.current = false;
        const threshold = 50;
        if (touchDeltaX.current < -threshold && activeIndex < tabs.length - 1) {
            setActiveIndex((prev) => prev + 1);
        } else if (touchDeltaX.current > threshold && activeIndex > 0) {
            setActiveIndex((prev) => prev - 1);
        }
        touchDeltaX.current = 0;
    }, [activeIndex, tabs.length]);

    if (!tabs.length) return null;

    return (
        <div className="xl:hidden">
            {/* Tab bar — premium glassmorphism style */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-[linear-gradient(135deg,rgba(10,10,14,0.95),rgba(18,12,8,0.9))] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                <div className="flex items-center gap-1">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all duration-300 ${
                                index === activeIndex
                                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/8 text-amber-200 shadow-[0_4px_18px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]'
                                    : 'text-white/40 hover:text-white/65'
                            }`}
                        >
                            {/* Active indicator glow */}
                            {index === activeIndex && (
                                <span className="pointer-events-none absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                            )}
                            {tab.icon}
                            <span className="hidden min-[380px]:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content panel — render only active tab (no overflow issues) */}
            <div
                className={`mt-3 ${panelClassName}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {tabs[activeIndex]?.content}
            </div>

            {/* Swipe indicator dots */}
            <div className="mt-2.5 flex justify-center gap-1.5">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        type="button"
                        aria-label={`Go to ${tab.label}`}
                        onClick={() => setActiveIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === activeIndex
                                ? 'w-6 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                : 'w-1.5 bg-white/15 hover:bg-white/30'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
