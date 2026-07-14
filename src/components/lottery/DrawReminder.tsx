'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface DrawReminderProps {
    /** Draw time ISO string */
    drawTime: string | null | undefined;
    /** Event title for the notification */
    eventTitle?: string;
}

/**
 * One-tap "Remind me" button that schedules a browser notification
 * 5 minutes before draw time. Persists reminder via setTimeout.
 */
export default function DrawReminder({ drawTime, eventTitle = 'Lottery Draw' }: DrawReminderProps) {
    const [isSet, setIsSet] = useState(false);
    const [permDenied, setPermDenied] = useState(false);
    const timerRef = useRef<number | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const scheduleReminder = useCallback(async () => {
        if (!drawTime) return;
        
        try {
            if (!('Notification' in window) || !window.Notification) {
                toast.error('Notifications are not supported on this browser.');
                return;
            }

            // Request permission
            let perm = Notification.permission;
            if (perm === 'default') {
                // Some older mobile browsers don't return a promise
                const permPromise = Notification.requestPermission();
                if (permPromise && typeof permPromise.then === 'function') {
                    perm = await permPromise;
                } else {
                    toast.error('Please manually enable notifications for this site.');
                    return;
                }
            }
            if (perm === 'denied') {
                setPermDenied(true);
                toast.error('Notification permission denied.');
                return;
            }

            const drawMs = new Date(drawTime).getTime();
            const notifyAt = drawMs - 5 * 60 * 1000; // 5 min before
            const delay = notifyAt - Date.now();

            if (delay <= 0) {
                // Draw is less than 5 min away or already passed
                new Notification(`${eventTitle} — Starting now!`, {
                    body: 'The draw is about to begin. Head to the arena!',
                    icon: '/favicon.ico',
                    tag: 'lottery-draw-reminder',
                });
                setIsSet(true);
                toast.success('Reminder set!');
                return;
            }

            // Schedule future notification
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                try {
                    new Notification(`${eventTitle} — 5 minutes!`, {
                        body: 'The draw starts in 5 minutes. Get ready!',
                        icon: '/favicon.ico',
                        tag: 'lottery-draw-reminder',
                    });
                } catch (e) {
                    console.warn('Failed to fire notification', e);
                }
            }, delay);

            setIsSet(true);
            toast.success('Reminder set! We will notify you 5 minutes before.');
        } catch (error) {
            console.error('Notification API Error:', error);
            toast.error('Could not schedule reminder on this device.');
        }
    }, [drawTime, eventTitle]);

    const cancelReminder = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsSet(false);
    }, []);

    if (!drawTime) return null;
    if (permDenied) return null;

    return (
        <button
            type="button"
            onClick={isSet ? cancelReminder : scheduleReminder}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                isSet
                    ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/8 text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/15'
            }`}
        >
            {isSet ? (
                <>
                    <Check className="h-3.5 w-3.5" />
                    Reminder set
                </>
            ) : (
                <>
                    <Bell className="h-3.5 w-3.5" />
                    Remind me
                </>
            )}
        </button>
    );
}
