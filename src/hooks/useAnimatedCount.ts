'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns an animated number that smoothly counts up/down to the target value.
 * Uses requestAnimationFrame with easeOutExpo easing.
 *
 * @param target - The target value to animate to
 * @param duration - Animation duration in ms (default 800)
 */
export function useAnimatedCount(target: number, duration = 800): number {
    const [display, setDisplay] = useState(target);
    const prevTarget = useRef(target);

    useEffect(() => {
        const from = prevTarget.current;
        const to = target;
        prevTarget.current = target;

        if (from === to) return;

        let startTime: number | null = null;
        let raf: number;

        const tick = (now: number) => {
            if (!startTime) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            // easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.round(from + (to - from) * ease);
            setDisplay(current);
            if (progress < 1) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return display;
}
