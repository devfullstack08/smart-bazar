'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { supportApi } from '@/lib/api/supportApi';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import type { SupportTicketDto } from '@/types/support';
import { CreateTicketModal } from '@/components/support/CreateTicketModal';
import { TicketListCard } from '@/components/support/TicketListCard';

export default function SupportPage() {
    const router = useRouter();
    const { token, isAuthenticated } = useAppSelector((s) => s.auth);
    const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await supportApi.listTickets({ limit: 50 });
            setTickets(r.items);
        } catch {
            toast.error('Could not load tickets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        load();
    }, [isAuthenticated, router, load]);

    useSupportSocket(token, {
        onInboxRefresh: () => {
            load();
        },
        onTicketCreated: () => load(),
    });

    const totalUnread = tickets.reduce((a, t) => a + (t.unreadForUser || 0), 0);

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--pw-primary)]/25 bg-[var(--pw-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--pw-primary)]">
                        <Headphones className="h-3.5 w-3.5" />
                        Help center
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">Support</h1>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Create a ticket to request changes (for example primary wallet updates) or get help from our team.
                        {totalUnread > 0 && (
                            <span className="ml-2 text-[var(--pw-primary)]">
                                {totalUnread} unread message{totalUnread === 1 ? '' : 's'}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pw-primary)] px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-95"
                >
                    <Plus className="h-4 w-4" />
                    New ticket
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
                    <Headphones className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
                    <p className="mt-4 text-[var(--muted-foreground)]">No tickets yet</p>
                    <button
                        type="button"
                        onClick={() => setModal(true)}
                        className="mt-4 text-sm font-medium text-[var(--pw-primary)] hover:underline"
                    >
                        Open your first ticket
                    </button>
                </div>
            ) : (
                <ul className="space-y-3">
                    {tickets.map((t) => (
                        <li key={t.id}>
                            <TicketListCard ticket={t} />
                        </li>
                    ))}
                </ul>
            )}

            <CreateTicketModal
                open={modal}
                onClose={() => setModal(false)}
                onSubmit={async (data) => {
                    const r = await supportApi.createTicket(data);
                    toast.success('Ticket created');
                    setTickets((prev) => [r.ticket, ...prev]);
                    router.push(`/support/${r.ticket.id}`);
                }}
            />
        </div>
    );
}
