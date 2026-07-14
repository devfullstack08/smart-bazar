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
            className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 transition hover:border-primary/25 hover:shadow-md"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        #{ticket.ticketNumber}
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                    {ticket.unreadForUser > 0 && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            {ticket.unreadForUser} new
                        </span>
                    )}
                </div>
                <p className="mt-2 text-xs sm:text-sm font-bold text-[var(--foreground)] truncate group-hover:text-primary transition-colors">
                    {ticket.subject}
                </p>
                {ticket.lastMessagePreview && (
                    <p className="mt-1 truncate text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {ticket.lastMessagePreview}
                    </p>
                )}
                <p className="mt-2 text-[9px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">{rel}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]" />
        </Link>
    );
}
