'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { STORAGE_KEYS } from '@/constants';

export default function LotteryArenaGuide({
    trigger,
    onComplete,
}: {
    trigger: number;
    onComplete: () => void;
}) {
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEYS.LOTTERY_ARENA_GUIDE_TOUR);
        if (trigger === 0 && hasSeen) return;

        let driverObj: any = null;

        const timer = setTimeout(() => {
            const steps: any[] = [
                {
                    popover: {
                        title: 'Welcome to the Arena',
                        description: 'This is your live lottery draw room. Follow this quick tour to see how everything works.',
                        side: 'bottom' as const,
                        align: 'start' as const,
                    },
                },
                {
                    element: '.lottery-info-card',
                    popover: {
                        title: '1. Event Info & Stats',
                        description: 'View the draw countdown, room size, top prize, and your entry status at a glance.',
                        side: 'bottom' as const,
                        align: 'start' as const,
                    },
                },
                {
                    element: '.lottery-live-stage',
                    popover: {
                        title: '2. Live Spin Wheel',
                        description: 'Watch the real-time draw here. When the draw begins, tickets spin and winners are ejected live!',
                        side: 'top' as const,
                        align: 'center' as const,
                    },
                },
            ];

            // Prize ladder (only visible on xl)
            if (document.querySelector('[class*="LotteryPrizeLadder"], aside header')) {
                steps.push({
                    element: 'aside',
                    popover: {
                        title: '3. Winner Ladder',
                        description: 'See all prize tiers, rewards, and revealed winners for this draw.',
                        side: 'right' as const,
                        align: 'start' as const,
                    },
                });
            }

            steps.push({
                popover: {
                    title: "You're All Set!",
                    description: 'Stay in the room until draw time. You can tap the ❓ icon in the top bar anytime to revisit this guide.',
                    side: 'bottom' as const,
                    align: 'center' as const,
                },
            });

            driverObj = driver({
                popoverClass: 'smart-bazar-lottery-guide',
                showProgress: true,
                stagePadding: 8,
                stageRadius: 18,
                steps,
                onDestroyed: () => {
                    localStorage.setItem(STORAGE_KEYS.LOTTERY_ARENA_GUIDE_TOUR, 'true');
                    onCompleteRef.current?.();
                },
            });

            driverObj.drive();
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (driverObj) {
                driverObj.destroy();
            }
        };
    }, [trigger]);

    return null;
}
