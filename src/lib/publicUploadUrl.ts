import { API_URL } from '@/constants/env';

/** Turn `/uploads/...` path from API into absolute URL (static files are served from API origin, not `/api/v1`). */
export function publicUploadUrl(path: string | undefined | null): string | undefined {
    if (!path || typeof path !== 'string' || !path.startsWith('/uploads/')) return undefined;
    const origin = API_URL.replace(/\/api\/v1\/?$/i, '');
    return `${origin}${path}`;
}
