'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';

type FlyingEmoji = {
    id: number;
    emoji: string;
    xOffset: number;
    size: number;
    duration: number;
};

const EMOJI_OPTIONS = ['🔥', '🚀', '💸', '🤑'];

// This event allows other components to dispatch an emoji burst
export const dispatchHypeBurst = (emoji: string = '🚀', count: number = 5) => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('lottery-hype-burst', { detail: { emoji, count } });
        window.dispatchEvent(event);
    }
};

const LotteryLiveReactions = memo(function LotteryLiveReactions() {
    const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);

    const spawnEmoji = useCallback((emoji: string, count: number = 1) => {
        const newEmojis = Array.from({ length: count }).map(() => ({
            id: Date.now() + Math.random(),
            emoji,
            xOffset: (Math.random() - 0.5) * 60, // -30px to +30px
            size: Math.random() * 10 + 20, // 20px to 30px
            duration: Math.random() * 1.5 + 2, // 2s to 3.5s
        }));

        setFlyingEmojis((current) => [...current, ...newEmojis].slice(-40)); // Keep max 40 on screen
        
        // Cleanup
        newEmojis.forEach((e) => {
            setTimeout(() => {
                setFlyingEmojis((current) => current.filter((item) => item.id !== e.id));
            }, e.duration * 1000);
        });
    }, []);

    useEffect(() => {
        const handleBurst = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { emoji, count } = customEvent.detail;
            spawnEmoji(emoji, count);
        };
        window.addEventListener('lottery-hype-burst', handleBurst);
        return () => window.removeEventListener('lottery-hype-burst', handleBurst);
    }, [spawnEmoji]);

    return (
        <div className="fixed bottom-[120px] sm:bottom-8 right-2 sm:right-6 z-[60] flex flex-col items-center gap-4 pointer-events-none">
            {/* Flying Canvas */}
            <div className="relative w-16 h-[60vh] flex flex-col justify-end items-center pointer-events-none">
                {flyingEmojis.map((e) => (
                    <div
                        key={e.id}
                        className="absolute bottom-0 select-none pointer-events-none will-change-transform"
                        style={{
                            fontSize: `${e.size}px`,
                            left: `calc(50% + ${e.xOffset}px)`,
                            transform: 'translateX(-50%)',
                            animation: `floatUp ${e.duration}s cubic-bezier(0.2, 1, 0.3, 1) forwards`,
                        }}
                    >
                        {e.emoji}
                    </div>
                ))}
            </div>

            {/* Reaction Buttons */}
            <div className="flex flex-col gap-2 p-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {EMOJI_OPTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => spawnEmoji(emoji, 1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/5 border border-white/5 hover:bg-white/20 hover:scale-110 active:scale-90 transition-all shadow-inner"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes floatUp {
                    0% {
                        transform: translate(-50%, 0) scale(0.5);
                        opacity: 0;
                    }
                    10% {
                        transform: translate(-50%, -20px) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + ${Math.random() > 0.5 ? '20px' : '-20px'}), -400px) scale(1);
                        opacity: 0;
                    }
                }
            `}} />
        </div>
    );
});

export default LotteryLiveReactions;
