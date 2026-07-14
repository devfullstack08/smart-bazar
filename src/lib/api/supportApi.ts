import apiClient from '@/lib/api/axios';
import type { SupportCategory, SupportMessageDto, SupportTicketDto, SupportTicketStatus } from '@/types/support';

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

function unwrap<T>(r: { data: ApiEnvelope<T> }): T {
    return r.data.data;
}

export const supportApi = {
    listTickets: async (params?: {
        status?: SupportTicketStatus;
        search?: string;
        page?: number;
        limit?: number;
    }) => {
        const res = await apiClient.get<ApiEnvelope<{ items: SupportTicketDto[]; pagination: unknown }>>(
            '/support/tickets',
            { params },
        );
        return unwrap(res);
    },

    createTicket: async (body: { subject: string; message: string; category?: SupportCategory }) => {
        const res = await apiClient.post<
            ApiEnvelope<{ ticket: SupportTicketDto; firstMessage: SupportMessageDto }>
        >('/support/tickets', body);
        return unwrap(res);
    },

    getTicket: async (ticketId: string) => {
        const res = await apiClient.get<
            ApiEnvelope<{
                ticket: SupportTicketDto;
                messages: SupportMessageDto[];
                messagesHasMoreOlder?: boolean;
            }>
        >(`/support/tickets/${ticketId}`);
        return unwrap(res);
    },

    getOlderMessages: async (ticketId: string, before: string, limit = 40) => {
        const res = await apiClient.get<ApiEnvelope<{ messages: SupportMessageDto[]; hasMore: boolean }>>(
            `/support/tickets/${ticketId}/messages`,
            {
                params: { before, limit },
            },
        );
        return unwrap(res);
    },

    sendMessage: async (ticketId: string, message: string) => {
        const res = await apiClient.post<ApiEnvelope<{ message: SupportMessageDto }>>(
            `/support/tickets/${ticketId}/messages`,
            { message },
        );
        return unwrap(res);
    },

    sendMessageWithImage: async (ticketId: string, file: File, caption?: string) => {
        const fd = new FormData();
        fd.append('image', file);
        const c = caption?.trim();
        if (c) fd.append('message', c);
        const res = await apiClient.post<ApiEnvelope<{ message: SupportMessageDto }>>(
            `/support/tickets/${ticketId}/messages/image`,
            fd,
        );
        return unwrap(res);
    },

    markRead: async (ticketId: string) => {
        const res = await apiClient.post<ApiEnvelope<{ cleared: number; ticket: SupportTicketDto }>>(
            `/support/tickets/${ticketId}/read`,
        );
        return unwrap(res);
    },

    markCompleted: async (
        ticketId: string,
        opts?: { csatRating?: number; csatComment?: string },
    ) => {
        const body: { status: 'completed'; csatRating?: number; csatComment?: string } = {
            status: 'completed',
        };
        if (opts?.csatRating != null) body.csatRating = opts.csatRating;
        if (opts?.csatComment?.trim()) body.csatComment = opts.csatComment.trim();
        const res = await apiClient.patch<ApiEnvelope<{ ticket: SupportTicketDto }>>(
            `/support/tickets/${ticketId}`,
            body,
        );
        return unwrap(res);
    },
};
