'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { STORAGE_KEYS } from '@/constants';

export default function LotteryShopGuide({
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
        const hasSeen = localStorage.getItem(STORAGE_KEYS.LOTTERY_SHOP_GUIDE_TOUR);
        if (trigger === 0 && hasSeen) return;

        let driverObj: any = null;

        // Wait a brief moment to ensure DOM is fully painted
        const timer = setTimeout(() => {
            const steps = [
                {
                    popover: {
                        title: 'Smart Bazar Ticket Shop',
                        description: 'Welcome! This is the ticket shop. Follow this quick tour to see how to buy tickets.',
                        side: 'bottom' as const,
                        align: 'start' as const,
                    },
                },
                {
                    element: '#shop-step-1',
                    popover: {
                        title: '1. Select a Ticket Package',
                        description: 'Choose from the available packages. You can swipe left and right on mobile!',
                        side: 'bottom' as const,
                        align: 'start' as const,
                    },
                },
                {
                    element: '#shop-step-2',
                    popover: {
                        title: '2. Your Wallet & Balance',
                        description: 'Check your available funds, or quickly Deposit / Transfer to buy tickets.',
                        side: 'top' as const,
                        align: 'start' as const,
                    },
                },
            ];

            if (document.getElementById('shop-step-3')) {
                steps.push({
                    element: '#shop-step-3',
                    popover: {
                        title: '3. Secured Ticket Vault',
                        description: 'Once you buy, your secure tickets will be listed here. They will update live at draw time!',
                        side: 'top' as const,
                        align: 'start' as const,
                    },
                });
            }

            driverObj = driver({
                popoverClass: 'smart-bazar-lottery-guide',
                showProgress: true,
                stagePadding: 8,
                stageRadius: 18,
                steps,
                onDestroyed: () => {
                    localStorage.setItem(STORAGE_KEYS.LOTTERY_SHOP_GUIDE_TOUR, 'true');
                    onCompleteRef.current?.();
                },
            });

            driverObj.drive();
        }, 800);

        return () => {
            clearTimeout(timer);
            if (driverObj) {
                driverObj.destroy();
            }
        };
    }, [trigger]);

    return null;
}
