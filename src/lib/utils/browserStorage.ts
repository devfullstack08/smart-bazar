type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): StorageLike | null {
    if (typeof window === 'undefined') return null;

    const storage = window.localStorage;
    if (
        !storage ||
        typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' ||
        typeof storage.removeItem !== 'function'
    ) {
        return null;
    }

    return storage;
}

export function safeLocalStorageGetItem(key: string): string | null {
    try {
        return getStorage()?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

export function safeLocalStorageSetItem(key: string, value: string): void {
    try {
        getStorage()?.setItem(key, value);
    } catch {
        // Ignore storage failures in restricted runtimes.
    }
}

export function safeLocalStorageRemoveItem(key: string): void {
    try {
        getStorage()?.removeItem(key);
    } catch {
        // Ignore storage failures in restricted runtimes.
    }
}
