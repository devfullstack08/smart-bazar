'use client';

import { useEffect, useState } from 'react';
import { lotteryApi } from '@/lib/api/lotteryApi';
import { getProjectIdForRequest } from '@/lib/api/projectHeaders';

type LotteryFeatureStatus = 'loading' | 'enabled' | 'disabled' | 'error';
type ResolvedLotteryFeatureStatus = Exclude<LotteryFeatureStatus, 'loading'>;

let cachedStatus: ResolvedLotteryFeatureStatus | null = null;
let pendingStatus: Promise<ResolvedLotteryFeatureStatus> | null = null;

function loadLotteryFeatureStatus(): Promise<ResolvedLotteryFeatureStatus> {
    if (cachedStatus) return Promise.resolve(cachedStatus);
    if (pendingStatus) return pendingStatus;

    const projectId = getProjectIdForRequest().trim();
    if (!projectId) return Promise.resolve('error');

    const request = lotteryApi
        .getPageConfig()
        .then<ResolvedLotteryFeatureStatus>((config) => (config.featureEnabled ? 'enabled' : 'disabled'))
        .catch<ResolvedLotteryFeatureStatus>(() => 'error');

    pendingStatus = request
        .then((status) => {
            cachedStatus = status;
            pendingStatus = null;
            return status;
        });

    return pendingStatus;
}

export function useLotteryFeatureGate() {
    const [status, setStatus] = useState<LotteryFeatureStatus>(cachedStatus ?? 'loading');

    useEffect(() => {
        let cancelled = false;
        loadLotteryFeatureStatus().then((nextStatus) => {
            if (!cancelled) setStatus(nextStatus);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return {
        status,
        lotteryEnabled: status === 'enabled',
        loading: status === 'loading',
        error: status === 'error',
    };
}
