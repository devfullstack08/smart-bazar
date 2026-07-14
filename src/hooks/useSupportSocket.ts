'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/constants/env';

export function useSupportSocket(
    token: string | null,
    handlers: {
        onMessageNew?: (payload: unknown) => void;
        onMessagesRead?: (payload: unknown) => void;
        onTicketUpdated?: (payload: unknown) => void;
        onInboxRefresh?: (payload: unknown) => void;
        onTicketCreated?: (payload: unknown) => void;
        onTyping?: (payload: unknown) => void;
    },
) {
    const socketRef = useRef<Socket | null>(null);
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!token || !WS_URL) return;

        const socket = io(WS_URL, {
            path: '/socket.io',
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        const h = handlersRef.current;
        const onNew = (p: unknown) => h.onMessageNew?.(p);
        const onRead = (p: unknown) => h.onMessagesRead?.(p);
        const onUpd = (p: unknown) => h.onTicketUpdated?.(p);
        const onInbox = (p: unknown) => h.onInboxRefresh?.(p);
        const onCreated = (p: unknown) => h.onTicketCreated?.(p);
        const onTyping = (p: unknown) => h.onTyping?.(p);

        socket.on('support:message:new', onNew);
        socket.on('support:messages:read', onRead);
        socket.on('support:ticket:updated', onUpd);
        socket.on('support:inbox:refresh', onInbox);
        socket.on('support:ticket:created', onCreated);
        socket.on('support:typing', onTyping);

        return () => {
            socket.off('support:message:new', onNew);
            socket.off('support:messages:read', onRead);
            socket.off('support:ticket:updated', onUpd);
            socket.off('support:inbox:refresh', onInbox);
            socket.off('support:ticket:created', onCreated);
            socket.off('support:typing', onTyping);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    const joinTicket = useCallback((ticketId: string) => {
        socketRef.current?.emit('support:join-ticket', { ticketId });
    }, []);

    const leaveTicket = useCallback((ticketId: string) => {
        socketRef.current?.emit('support:leave-ticket', { ticketId });
    }, []);

    const emitTyping = useCallback((ticketId: string, typing: boolean) => {
        socketRef.current?.emit('support:typing', { ticketId, typing });
    }, []);

    return { joinTicket, leaveTicket, emitTyping, socket: socketRef };
}
