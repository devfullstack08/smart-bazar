import { PROJECT_ID } from '@/constants/env';
import { safeLocalStorageGetItem } from '@/lib/utils/browserStorage';

/**
 * Resolves X-Project-ID for tenant APIs. Prefer logged-in user's projectId
 * when env NEXT_PUBLIC_PROJECT_ID is missing or wrong.
 */
export function getProjectIdForRequest(): string {
    if (typeof window !== 'undefined') {
        try {
            const raw = safeLocalStorageGetItem('user');
            if (raw) {
                const u = JSON.parse(raw) as { projectId?: string };
                if (u?.projectId && String(u.projectId).trim()) {
                    return String(u.projectId).trim();
                }
            }
        } catch {
            /* ignore */
        }
    }
    return (PROJECT_ID || '').trim();
}

/** Headers for GET /users/banners, /users/dashboard-media, etc. */
export function projectIdHeaders(): Record<string, string> {
    const id = getProjectIdForRequest();
    if (!id) return {};
    return { 'x-project-id': id };
}
