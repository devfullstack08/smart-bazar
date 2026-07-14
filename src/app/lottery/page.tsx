'use client';

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { restoreAuth } from '@/lib/store/slices/authSlice';
import { safeLocalStorageGetItem } from '@/lib/utils/browserStorage';
import { STORAGE_KEYS } from '@/constants';
import { getProjectIdForRequest } from '@/lib/api/projectHeaders';
import { lotteryApi, isCouponLotteryEvent, type LotteryEvent } from '@/lib/api/lotteryApi';
import LotteryPage from '@/app/(dashboard)/lottery/index';
import LotteryPageLoading from '@/components/lottery/arena/LotteryPageLoading';

type LotteryGateState =
    | { kind: 'loading' }
    | { kind: 'lobby'; events: LotteryEvent[] }
    | { kind: 'arena' };

type LotteryFeatureGateState =
    | { kind: 'loading' }
    | { kind: 'enabled' }
    | { kind: 'disabled' }
    | { kind: 'error' };

import LotteryLobbyFloor from '@/components/lottery/arena/LotteryLobbyFloor';

function LotteryEntrySwitch({ view, eventId }: { view: string | null; eventId: string | null }) {
    const [gate, setGate] = useState<LotteryGateState>({ kind: 'loading' });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (view || eventId) {
                setGate({ kind: 'arena' });
                return;
            }
            const [openEvents, active] = await Promise.all([
                lotteryApi.getOpenLotteries().catch(() => [] as LotteryEvent[]),
                lotteryApi.getActiveLottery().catch(() => null),
            ]);
            if (cancelled) return;
            const lobbyEvents = openEvents.length
                ? openEvents
                : active && ['drawing', 'active', 'upcoming'].includes(active.status)
                    ? [active]
                    : [];
            if (lobbyEvents.length) {
                setGate({ kind: 'lobby', events: lobbyEvents });
            } else {
                setGate({ kind: 'arena' });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [eventId, view]);

    if (gate.kind === 'loading') {
        return <LotteryPageLoading subtitle="Preparing lottery access…" />;
    }
    if (gate.kind === 'lobby') {
        return <LotteryLobbyFloor events={gate.events} />;
    }
    const arenaMode = view === 'room' ? 'room' : view === 'shop' ? 'shop' : 'full';
    return <LotteryPage arenaMode={arenaMode} focusPurchaseOnMount={view === 'shop'} />;
}

function LotterySuspenseGate() {
    const searchParams = useSearchParams();
    const view = searchParams.get('view');
    const eventId = searchParams.get('event');
    return <LotteryEntrySwitch key={`${view ?? 'default'}:${eventId ?? 'lobby'}`} view={view} eventId={eventId} />;
}

function subscribeNoop() {
    return () => {};
}

export default function LotteryArenaPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const [featureGate, setFeatureGate] = useState<LotteryFeatureGateState>({ kind: 'loading' });
    const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

    const waitingSubtitle = useMemo(() => {
        if (!isClient) {
            return 'Checking project access and loading the live room.';
        }
        const hasToken = Boolean(
            safeLocalStorageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || safeLocalStorageGetItem(STORAGE_KEYS.TOKEN)
        );
        const projectId = getProjectIdForRequest().trim();

        if (hasToken && !user) {
            return 'Restoring your session from this browser…';
        }
        if (!projectId) {
            return 'We need a project id (signed-in user or NEXT_PUBLIC_PROJECT_ID) to load settings.';
        }
        if (featureGate.kind === 'loading') {
            return 'Loading lottery settings and confirming access...';
        }
        if (featureGate.kind === 'error') {
            return 'We could not confirm lottery access. Refresh once or return to the dashboard.';
        }
        if (featureGate.kind === 'disabled') {
            return 'Lottery is turned off in project settings. Redirecting to the dashboard…';
        }
        return 'Almost there - opening the live room.';
    }, [featureGate.kind, isClient, user]);

    const hasStoredSession = useMemo(() => {
        if (!isClient) return false;
        const accessToken = safeLocalStorageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || safeLocalStorageGetItem(STORAGE_KEYS.TOKEN);
        const userStr = safeLocalStorageGetItem(STORAGE_KEYS.USER_KEY);
        return Boolean(accessToken && userStr);
    }, [isClient]);

    useEffect(() => {
        if (hasStoredSession && (!isAuthenticated || !user)) {
            dispatch(restoreAuth());
        }
    }, [dispatch, hasStoredSession, isAuthenticated, router, user]);

    useEffect(() => {
        const projectId = getProjectIdForRequest().trim();
        let cancelled = false;
        if (!projectId) {
            Promise.resolve().then(() => {
                if (!cancelled) setFeatureGate({ kind: 'error' });
            });
            return () => {
                cancelled = true;
            };
        }

        lotteryApi
            .getPageConfig()
            .then((config) => {
                if (cancelled) return;
                setFeatureGate(config.featureEnabled ? { kind: 'enabled' } : { kind: 'disabled' });
            })
            .catch(() => {
                if (cancelled) return;
                setFeatureGate({ kind: 'error' });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (featureGate.kind === 'disabled') {
            router.replace('/dashboard');
        }
    }, [featureGate.kind, router]);

    if (featureGate.kind === 'error') {
        return (
            <div className="min-h-dvh overflow-x-hidden bg-[#03040a] text-white">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="dash-aurora" aria-hidden />
                    <div className="dash-mesh" aria-hidden />
                </div>
                <div className="relative z-10 flex min-h-dvh items-center justify-center px-4">
                    <div className="w-full max-w-[16rem] overflow-hidden rounded-2xl border border-teal-200/20 bg-slate-950/76 px-4 py-5 text-center shadow-[0_20px_64px_rgba(0,0,0,0.36)] backdrop-blur sm:max-w-[22rem] sm:px-5">
                        <p className="text-[10px] font-black uppercase leading-5 tracking-[0.12em] text-teal-100 sm:text-sm sm:tracking-[0.22em]">Lottery access unavailable</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            We couldn&apos;t confirm this project&apos;s lottery settings yet. Refresh once or return to the dashboard and try again.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (featureGate.kind !== 'enabled') {
        return <LotteryPageLoading subtitle={waitingSubtitle} />;
    }

    return (
        <div className="min-h-dvh overflow-x-hidden bg-[#03040a] text-white">
            <Suspense fallback={<LotteryPageLoading subtitle="Opening lottery…" />}>
                <LotterySuspenseGate />
            </Suspense>
        </div>
    );
}
