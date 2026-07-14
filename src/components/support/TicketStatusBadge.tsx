'use client';

import type { SupportTicketStatus } from '@/types/support';

const styles: Record<SupportTicketStatus, string> = {
    open: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    in_progress: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    completed: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const labels: Record<SupportTicketStatus, string> = {
    open: 'Open',
    in_progress: 'In progress',
    completed: 'Completed',
    closed: 'Closed',
};

export function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}
