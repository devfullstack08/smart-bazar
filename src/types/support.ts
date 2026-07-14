export type SupportTicketStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export type SupportCategory = 'general' | 'account' | 'billing' | 'technical' | 'other';

export type SupportCloseReason = 'resolved' | 'duplicate' | 'spam' | 'no_response' | 'other';

export interface SupportTicketDto {
    id: string;
    ticketNumber: string;
    projectId: string;
    userId: string;
    subject: string;
    category: SupportCategory;
    status: SupportTicketStatus;
    unreadForUser: number;
    unreadForAdmin: number;
    lastMessageAt?: string;
    lastMessagePreview?: string;
    firstAdminReplyAt?: string;
    closedAt?: string;
    completedAt?: string;
    csatRating?: number;
    csatComment?: string;
    csatSubmittedAt?: string;
    closeReason?: SupportCloseReason;
    closeNote?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SupportMessageDto {
    id: string;
    ticketId: string;
    senderRole: 'user' | 'admin';
    senderUserId?: string;
    body: string;
    imageUrl?: string;
    imageMime?: string;
    readByUser: boolean;
    readByAdmin: boolean;
    createdAt?: string;
}
