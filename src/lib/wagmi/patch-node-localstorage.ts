/**
 * Must load before `wagmi/connectors` (WalletConnect) — WC's keyvaluestorage binds
 * `globalThis.localStorage`; Node's experimental storage breaks `getItem` during `next build`.
 */
if (typeof globalThis !== 'undefined') {
    try {
        const ls = (globalThis as unknown as { localStorage?: unknown }).localStorage;
        if (ls != null && typeof (ls as Storage).getItem !== 'function') {
            Reflect.deleteProperty(globalThis, 'localStorage');
        }
    } catch {
        /* ignore */
    }
}

export {};
