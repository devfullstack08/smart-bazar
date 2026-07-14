'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function MegaWinOverlay({
    winnerName,
    rewardLabel,
    onComplete
}: {
    winnerName: string;
    rewardLabel: string;
    onComplete?: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        // Haptic feedback (aggressive)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
        }

        // Generate coins
        const newCoins = Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}vw`,
            delay: `${Math.random() * 2}s`,
            duration: `${Math.random() * 1.5 + 2}s`,
            scale: Math.random() * 0.8 + 0.5,
            rotate: `${Math.random() * 360}deg`,
        }));
        setCoins(newCoins);

        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none overflow-hidden [animation:megawin-fade-in_0.5s_ease-out]">
            {/* Spotlight */}
            <div className="absolute top-[-20%] w-[150vw] h-[150vh] bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.3)_0%,transparent_60%)] animate-pulse" />

            {/* Coins */}
            {coins.map(c => (
                <div
                    key={c.id}
                    className="absolute -top-[10%] w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-amber-300"
                    style={{
                        left: c.left,
                        transform: `scale(${c.scale}) rotate(${c.rotate})`,
                        animation: `megawin-coin-drop ${c.duration} linear ${c.delay} forwards`,
                    }}
                >
                    <div className="absolute inset-[15%] rounded-full border border-amber-500/50 flex items-center justify-center text-[10px] font-bold text-amber-700/50">$</div>
                </div>
            ))}

            {/* Text */}
            <div className="relative z-10 flex flex-col items-center [animation:megawin-bounce-in_0.8s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#fffce5] via-[#ffd35a] to-[#ff922e] drop-shadow-[0_15px_40px_rgba(251,191,36,0.5)] [text-shadow:0_4px_0_#d97706,0_8px_0_#92400e]">
                    MEGA WIN!
                </h1>
                <div className="mt-4 flex flex-col items-center bg-black/50 backdrop-blur-md border border-amber-500/30 rounded-3xl px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <span className="text-sm sm:text-lg font-bold text-amber-200 uppercase tracking-[0.2em]">{winnerName} won</span>
                    <span className="text-3xl sm:text-5xl font-black text-white mt-1 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{rewardLabel}</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes megawin-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes megawin-bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                @keyframes megawin-coin-drop {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
                }
            `}} />
        </div>,
        document.body
    );
}
