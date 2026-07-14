'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LotteryEntry } from '@/lib/api/lotteryApi';

export interface ParticipantCard {
    id: string;
    displayUserId: string;
    userName: string;
    lotteryNumber: string;
}

interface UseLotteryParticipantPacingOptions {
    /**
     * Initial participants returned by REST. They are queued (not displayed all at once),
     * so opening the page during a packed event does NOT dump 100+ toasts on mount.
     */
    initialParticipants?: LotteryEntry[];
    /** Admin-configured `participantRevealIntervalSeconds`. Min clamped to 1s. */
    intervalSec?: number;
    /** Stop pacing when the draw is over (status === 'completed' / 'cancelled'). */
    enabled?: boolean;
    /** How long each card stays visible before it's hidden. Defaults to 1.4s. */
    visibleMs?: number;
}

const fallbackKey = (entry: LotteryEntry) =>
    entry._id || `${entry.userId || entry.userName}-${entry.lotteryNumber}`;

const toCard = (entry: LotteryEntry): ParticipantCard => ({
    id: fallbackKey(entry),
    displayUserId: entry.displayUserId || entry.userId || entry.userName,
    userName: entry.userName,
    lotteryNumber: entry.lotteryNumber,
});

/**
 * Single-FIFO pacing for lottery participant pop-ups.
 *
 * - `initialParticipants` and live `append()` calls feed the same queue.
 * - Reveals one card every `intervalSec` seconds, hides it after `visibleMs`.
 * - De-duplicates by entry id so a re-fetch / socket echo doesn't double-fire.
 *
 * Returns the currently visible card, the queue size, and an `append` callback
 * that orchestrators wire to `lottery:participant-joined`.
 */
export function useLotteryParticipantPacing({
    initialParticipants,
    intervalSec = 4,
    enabled = true,
    visibleMs = 1400,
}: UseLotteryParticipantPacingOptions) {
    const [latestPopup, setLatestPopup] = useState<ParticipantCard | null>(null);
    const [queueSize, setQueueSize] = useState(0);

    const queueRef = useRef<ParticipantCard[]>([]);
    const seenRef = useRef<Set<string>>(new Set());
    const tickTimerRef = useRef<number | null>(null);
    const hideTimerRef = useRef<number | null>(null);

    const enqueue = useCallback((card: ParticipantCard) => {
        if (seenRef.current.has(card.id)) return;
        seenRef.current.add(card.id);
        queueRef.current.push(card);
        setQueueSize(queueRef.current.length);
    }, []);

    useEffect(() => {
        if (!initialParticipants?.length) return;
        for (const entry of initialParticipants) enqueue(toCard(entry));
    }, [initialParticipants, enqueue]);

    const append = useCallback(
        (entry: LotteryEntry) => {
            enqueue(toCard(entry));
        },
        [enqueue]
    );

    const reset = useCallback(() => {
        queueRef.current = [];
        seenRef.current = new Set();
        setQueueSize(0);
        setLatestPopup(null);
        if (tickTimerRef.current) {
            window.clearTimeout(tickTimerRef.current);
            tickTimerRef.current = null;
        }
        if (hideTimerRef.current) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const intervalMs = Math.max(1, intervalSec) * 1000;

        const showNext = () => {
            const next = queueRef.current.shift();
            if (!next) {
                tickTimerRef.current = window.setTimeout(showNext, intervalMs);
                return;
            }
            setQueueSize(queueRef.current.length);
            setLatestPopup(next);

            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = window.setTimeout(() => {
                setLatestPopup((current) => (current?.id === next.id ? null : current));
            }, visibleMs);

            tickTimerRef.current = window.setTimeout(showNext, intervalMs);
        };

        tickTimerRef.current = window.setTimeout(showNext, intervalMs);

        return () => {
            if (tickTimerRef.current) {
                window.clearTimeout(tickTimerRef.current);
                tickTimerRef.current = null;
            }
            if (hideTimerRef.current) {
                window.clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }
        };
    }, [enabled, intervalSec, visibleMs]);

    return useMemo(
        () => ({ latestPopup, queueSize, append, reset }),
        [latestPopup, queueSize, append, reset]
    );
}
