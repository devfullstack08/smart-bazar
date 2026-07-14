'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/lib/store/hooks';
import { supportApi } from '@/lib/api/supportApi';
import { dedupeMessagesById } from '@/lib/utils/supportThread';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import type { SupportMessageDto, SupportTicketDto } from '@/types/support';
import { SupportChat } from '@/components/support/SupportChat';

export default function SupportTicketPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.ticketId as string;
    const { token, isAuthenticated } = useAppSelector((s) => s.auth);

    const [ticket, setTicket] = useState<SupportTicketDto | null>(null);
    const [messages, setMessages] = useState<SupportMessageDto[]>([]);
    const [hasMoreOlder, setHasMoreOlder] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [supportTyping, setSupportTyping] = useState(false);
    const peerTypingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messagesRef = useRef<SupportMessageDto[]>([]);
    messagesRef.current = messages;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await supportApi.getTicket(ticketId);
            setTicket(r.ticket);
            setMessages(dedupeMessagesById(r.messages));
            setHasMoreOlder(r.messagesHasMoreOlder ?? false);
        } catch {
            toast.error('Ticket not found');
            router.push('/support');
        } finally {
            setLoading(false);
        }
    }, [ticketId, router]);

    const refreshThread = useCallback(async () => {
        try {
            const r = await supportApi.getTicket(ticketId);
            setTicket(r.ticket);
            const lenBefore = messagesRef.current.length;
            setMessages((prev) => {
                const apiMap = new Map(r.messages.map((m) => [m.id, m]));
                return dedupeMessagesById(prev.map((m) => apiMap.get(m.id) ?? m));
            });
            setHasMoreOlder((h) => (lenBefore > r.messages.length ? h : r.messagesHasMoreOlder ?? false));
        } catch {
            /* ignore */
        }
    }, [ticketId]);

    const loadOlder = useCallback(async () => {
        if (loadingOlder || !hasMoreOlder) return;
        const prev = messagesRef.current;
        const before = prev[0]?.id;
        if (!before) return;
        setLoadingOlder(true);
        try {
            const { messages: older, hasMore } = await supportApi.getOlderMessages(ticketId, before, 40);
            if (older.length) {
                setMessages((cur) => {
                    const seen = new Set(cur.map((m) => m.id));
                    const merged = [...older.filter((m) => !seen.has(m.id)), ...cur];
                    return dedupeMessagesById(merged);
                });
            }
            setHasMoreOlder(hasMore);
        } finally {
            setLoadingOlder(false);
        }
    }, [ticketId, loadingOlder, hasMoreOlder]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        load();
    }, [isAuthenticated, router, load]);

    const { joinTicket, leaveTicket, emitTyping } = useSupportSocket(token, {
        onMessageNew: (payload: unknown) => {
            const p = payload as { message?: SupportMessageDto; ticket?: SupportTicketDto };
            if (p?.message && p.message.ticketId === ticketId) {
                setMessages((prev) => dedupeMessagesById([...prev, p.message!]));
            }
            if (p?.ticket?.id === ticketId) setTicket(p.ticket);
        },
        onMessagesRead: (payload: unknown) => {
            const p = payload as { ticket?: SupportTicketDto; ticketId?: string };
            if (p?.ticketId === ticketId || p?.ticket?.id === ticketId) {
                if (p.ticket) setTicket(p.ticket);
                void refreshThread();
            }
        },
        onTicketUpdated: (payload: unknown) => {
            const p = payload as { ticket?: SupportTicketDto };
            if (p?.ticket?.id === ticketId) setTicket(p.ticket);
        },
        onInboxRefresh: () => {
            load();
        },
        onTyping: (raw) => {
            const p = raw as { ticketId?: string; typing?: boolean; fromRole?: string };
            if (p.ticketId !== ticketId || p.fromRole !== 'admin') return;
            if (p.typing) {
                setSupportTyping(true);
                if (peerTypingHideRef.current) clearTimeout(peerTypingHideRef.current);
                peerTypingHideRef.current = setTimeout(() => setSupportTyping(false), 3500);
            } else {
                setSupportTyping(false);
            }
        },
    });

    useEffect(() => {
        if (!ticketId || !token) return;
        joinTicket(ticketId);
        supportApi.markRead(ticketId).catch(() => {});
        return () => {
            emitTyping(ticketId, false);
            leaveTicket(ticketId);
        };
    }, [ticketId, token, joinTicket, leaveTicket, emitTyping]);

    useEffect(() => {
        return () => {
            if (peerTypingHideRef.current) clearTimeout(peerTypingHideRef.current);
        };
    }, []);

    if (loading || !ticket) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface)]" />
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-[calc(100dvh-10.5rem)] min-h-[min(360px,70svh)] max-w-3xl flex-col px-4 pb-6 pt-2 sm:h-[calc(100dvh-9.5rem)] sm:px-6">
            <Link
                href="/support"
                className="mb-3 inline-flex shrink-0 items-center gap-2 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to tickets
            </Link>

            <SupportChat
                className="min-h-0 flex-1"
                ticket={ticket}
                messages={messages}
                sending={sending}
                hasMoreOlder={hasMoreOlder}
                loadingOlder={loadingOlder}
                onLoadOlder={loadOlder}
                emitTyping={(typing) => emitTyping(ticketId, typing)}
                peerTyping={supportTyping}
                onSendImage={async (file, caption) => {
                    setSending(true);
                    try {
                        const lenBefore = messagesRef.current.length;
                        const r = await supportApi.sendMessageWithImage(ticketId, file, caption);
                        setMessages((prev) => dedupeMessagesById([...prev, r.message]));
                        const t2 = await supportApi.getTicket(ticketId);
                        setTicket(t2.ticket);
                        setHasMoreOlder((h) =>
                            lenBefore + 1 > t2.messages.length ? h : t2.messagesHasMoreOlder ?? false,
                        );
                    } finally {
                        setSending(false);
                    }
                }}
                onSend={async (text) => {
                    setSending(true);
                    try {
                        const lenBefore = messagesRef.current.length;
                        const r = await supportApi.sendMessage(ticketId, text);
                        setMessages((prev) => dedupeMessagesById([...prev, r.message]));
                        const t2 = await supportApi.getTicket(ticketId);
                        setTicket(t2.ticket);
                        setHasMoreOlder((h) =>
                            lenBefore + 1 > t2.messages.length ? h : t2.messagesHasMoreOlder ?? false,
                        );
                    } finally {
                        setSending(false);
                    }
                }}
                onMarkComplete={async (opts) => {
                    setSending(true);
                    try {
                        const r = await supportApi.markCompleted(ticketId, opts);
                        setTicket(r.ticket);
                        toast.success('Marked as completed');
                    } finally {
                        setSending(false);
                    }
                }}
            />
        </div>
    );
}
