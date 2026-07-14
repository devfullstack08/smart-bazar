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
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 pb-12">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8 mb-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-primary shrink-0">
                            <Headphones size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">Help Center & Account Desk</h1>
                                {totalUnread > 0 && (
                                    <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                                        {totalUnread} New
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                Submit support tickets for account requests, Web3 link audits, or profile modifications
                            </p>
                        </div>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-black px-5 py-3 text-xs font-bold shadow-lg hover:bg-primary/95 transition-all shrink-0 self-start sm:self-center"
                    >
                        <Plus className="h-4 w-4" />
                        Create Ticket
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]" />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] px-6 py-16 text-center space-y-4 shadow-sm">
                    <Headphones className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
                    <div className="max-w-xs mx-auto space-y-1">
                        <p className="text-sm font-bold text-[var(--foreground)]">No active tickets</p>
                        <p className="text-xs text-[var(--muted-foreground)]">All queries are locked and processed. Create a ticket if you need client help.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModal(true)}
                        className="text-xs font-extrabold uppercase tracking-widest text-primary hover:underline"
                    >
                        Open your first ticket
                    </button>
                </div>
            ) : (
                <ul className="space-y-4">
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
