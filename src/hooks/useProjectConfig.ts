'use client';

import { useEffect, useRef } from 'react';
import { projectApi } from '@/lib/api/services';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
    setError,
    setLoading,
    setProjectConfig,
    type ProjectConfig,
} from '@/lib/store/slices/projectSlice';
import { getProjectIdForRequest } from '@/lib/api/projectHeaders';

export function useEnsureProjectConfig(options?: { force?: boolean }) {
    const dispatch = useAppDispatch();
    const projectConfig = useAppSelector((state) => state.project.config);
    const loading = useAppSelector((state) => state.project.loading);
    const lastFetched = useAppSelector((state) => state.project.lastFetched);
    const cacheExpiry = useAppSelector((state) => state.project.cacheExpiry);
    const error = useAppSelector((state) => state.project.error);
    const forcedOnceRef = useRef(false);
    const force = options?.force === true;

    // After logout / clearProjectData, allow a new forced project fetch (e.g. re-login).
    useEffect(() => {
        if (!projectConfig) {
            forcedOnceRef.current = false;
        }
    }, [projectConfig]);

    useEffect(() => {
        const projectId = getProjectIdForRequest();
        const isExpired = !lastFetched || Date.now() - lastFetched > cacheExpiry;
        const canUseCache = !force && projectConfig && !isExpired;
        const shouldPauseAfterError = !force && error && !projectConfig;

        if (!projectId || loading || canUseCache || shouldPauseAfterError) return;
        // For `force: true`, a single successful load is enough. Do
        // not also require `projectConfig` in this guard — a separate hook instance’s
        // ref is reset on remount, and requiring `projectConfig` caused re-fetch
        // loops with `lastFetched` / `loading` dependency churn. Ref alone is
        // cleared when `projectConfig` is nulled (see effect above).
        if (force && forcedOnceRef.current) return;

        let cancelled = false;
        dispatch(setLoading(true));
        dispatch(setError(null));

        projectApi
            .getDetails()
            .then((response) => {
                if (cancelled) return;
                const raw = response as ProjectConfig & { data?: ProjectConfig };
                const data = (raw?.data ?? raw) as ProjectConfig | null;
                if (data?.projectId) {
                    dispatch(setProjectConfig(data));
                    if (data.config?.currency) {
                        localStorage.setItem('project_currency', data.config.currency);
                        if (typeof window !== 'undefined') {
                            (window as any).__projectCurrency = data.config.currency;
                        }
                    }
                    if (force) {
                        forcedOnceRef.current = true;
                    }
                }
            })
            .catch((err) => {
                if (cancelled) return;
                dispatch(setError(err?.message || 'Failed to load project config'));
            })
            .finally(() => {
                // Always clear loading when this request finishes — if we skip
                // `setLoading(false)` on cancel (Strict Mode / fast re-run), global
                // `loading` stays true forever and the effect bails on
                // `if (loading)` with no in-flight fetch.
                dispatch(setLoading(false));
            });

        return () => {
            cancelled = true;
        };
        // Intentionally omit `loading` from deps: it flips true→false on every
        // fetch and was re-bounding this effect, re-triggering fetches. We read
        // `loading` in the guard above from the latest render when other deps
        // change, and the force ref prevents duplicate / infinite GETs.
    }, [cacheExpiry, dispatch, error, force, lastFetched, projectConfig]);

    return {
        projectConfig,
        loading,
        error,
    };
}
