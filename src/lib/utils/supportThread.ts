/** Keep first occurrence per id (chronological order preserved). */
export function dedupeMessagesById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const m of items) {
        if (!m.id || seen.has(m.id)) continue;
        seen.add(m.id);
        out.push(m);
    }
    return out;
}
