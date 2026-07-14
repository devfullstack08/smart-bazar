'use client';

import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SupportTicketDto } from '@/types/support';
import { TicketStatusBadge } from './TicketStatusBadge';

export function TicketListCard({ ticket }: { ticket: SupportTicketDto }) {
    const updated = ticket.updatedAt || ticket.lastMessageAt;
    const rel = updated ? formatDistanceToNow(new Date(updated), { addSuffix: true }) : '';

    return (
        <Link
            href={`/support/${ticket.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--pw-primary)]/40 hover:bg-[var(--surface-elevated)]"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--pw-primary)]/15">
                <MessageCircle className="h-6 w-6 text-[var(--pw-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--pw-primary)]">{ticket.ticketNumber}</span>
                    <TicketStatusBadge status={ticket.status} />
                    {ticket.unreadForUser > 0 && (
                        <span className="rounded-full bg-[var(--pw-primary)] px-2 py-0.5 text-[10px] font-bold text-black">
                            {ticket.unreadForUser} new
                        </span>
                    )}
                </div>
                <p className="mt-1 truncate font-medium text-[var(--foreground)]">{ticket.subject}</p>
                {ticket.lastMessagePreview && (
                    <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">{ticket.lastMessagePreview}</p>
                )}
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{rel}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]" />
        </Link>
    );
}
