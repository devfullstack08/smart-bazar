/**
 * Browser storage helpers safe for SSR, SSG, and Node's experimental / partial localStorage
 * (where `localStorage` exists but `getItem` is not a function — breaks Next prerender).
 */
export function getLocalStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
        const ls = window.localStorage;
        if (!ls || typeof ls.getItem !== 'function') return null;
        return ls;
    } catch {
        return null;
    }
}

export function storageGetItem(key: string): string | null {
    return getLocalStorage()?.getItem(key) ?? null;
}

export function storageSetItem(key: string, value: string): void {
    try {
        getLocalStorage()?.setItem(key, value);
    } catch {
        /* ignore quota / private mode */
    }
}

export function storageRemoveItem(key: string): void {
    try {
        getLocalStorage()?.removeItem(key);
    } catch {
        /* ignore */
    }
}
