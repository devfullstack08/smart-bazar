'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
    /** Callback fired when the user completes a pull-to-refresh gesture */
    onRefresh: () => Promise<void> | void;
    /** Minimum pull distance in px to trigger refresh (default 80) */
    threshold?: number;
    /** Disable the gesture entirely */
    disabled?: boolean;
}

interface UsePullToRefreshResult {
    /** Whether the refresh is currently in progress */
    isRefreshing: boolean;
    /** Current pull distance in px (0 when not pulling) */
    pullDistance: number;
    /** Ref to attach to the scrollable container */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Mobile pull-to-refresh gesture hook.
 * Attach `containerRef` to the main scrollable container.
 * Shows a visual indicator and triggers `onRefresh` when pulled past threshold.
 */
export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled || isRefreshing) return;
            const container = containerRef.current;
            // Only activate if at the very top of the page
            if (!container || window.scrollY > 5) return;
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        },
        [disabled, isRefreshing],
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isPulling.current || disabled || isRefreshing) return;
            const delta = e.touches[0].clientY - touchStartY.current;
            if (delta > 0) {
                // Apply resistance (diminishing returns)
                const resisted = Math.min(delta * 0.42, 140);
                setPullDistance(resisted);
            } else {
                setPullDistance(0);
            }
        },
        [disabled, isRefreshing],
    );

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold * 0.5); // Hold at midway during refresh
            try {
                await onRefresh();
            } catch {
                // ignore
            }
            setIsRefreshing(false);
        }
        setPullDistance(0);
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        if (disabled) return;
        const el = containerRef.current || document;
        el.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
        el.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
        el.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
        return () => {
            el.removeEventListener('touchstart', handleTouchStart as EventListener);
            el.removeEventListener('touchmove', handleTouchMove as EventListener);
            el.removeEventListener('touchend', handleTouchEnd as EventListener);
        };
    }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { isRefreshing, pullDistance, containerRef };
}
