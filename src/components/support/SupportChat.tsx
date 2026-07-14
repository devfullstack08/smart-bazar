'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Send, CheckCircle2, ImagePlus, X, Headphones, UserCheck, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { dedupeMessagesById } from '@/lib/utils/supportThread';
import toast from 'react-hot-toast';
import type { SupportMessageDto, SupportTicketDto } from '@/types/support';
import { MessageBubble } from './MessageBubble';
import { TicketStatusBadge } from './TicketStatusBadge';
import { APP_NAME } from '@/constants/env';

export type SupportCsatPayload = { csatRating?: number; csatComment?: string };

type Props = {
    ticket: SupportTicketDto;
    messages: SupportMessageDto[];
    sending: boolean;
    onSend: (text: string) => Promise<void>;
    onMarkComplete: (opts?: SupportCsatPayload) => Promise<void>;
    emitTyping?: (typing: boolean) => void;
    peerTyping?: boolean;
    onSendImage?: (file: File, caption: string) => Promise<void>;
    hasMoreOlder?: boolean;
    loadingOlder?: boolean;
    onLoadOlder?: () => Promise<void>;
    className?: string;
};

export function SupportChat({
    ticket,
    messages,
    sending,
    onSend,
    onMarkComplete,
    emitTyping,
    peerTyping,
    onSendImage,
    hasMoreOlder,
    loadingOlder,
    onLoadOlder,
    className,
}: Props) {
    const [text, setText] = useState('');
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const loadOlderAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
    const lastMessageIdRef = useRef<string | undefined>(undefined);
    const restoreFocusAfterSendRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [csatOpen, setCsatOpen] = useState(false);
    const [csatRating, setCsatRating] = useState<number | null>(null);
    const [csatComment, setCsatComment] = useState('');

    const displayMessages = useMemo(() => dedupeMessagesById(messages), [messages]);

    const scrollThreadToBottom = (behavior: ScrollBehavior = 'auto') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
    };

    const focusComposer = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                inputRef.current?.focus({ preventScroll: true });
            });
        });
    }, []);

    useEffect(() => {
        const lastId = displayMessages[displayMessages.length - 1]?.id;
        if (lastId !== lastMessageIdRef.current) {
            lastMessageIdRef.current = lastId;
            scrollThreadToBottom('auto');
        }
        if (restoreFocusAfterSendRef.current) {
            restoreFocusAfterSendRef.current = false;
            focusComposer();
        }
    }, [displayMessages, focusComposer]);

    useEffect(() => {
        scrollThreadToBottom('auto');
    }, [peerTyping]);

    useLayoutEffect(() => {
        if (!loadOlderAnchorRef.current) return;
        const { scrollHeight: prevH, scrollTop: prevTop } = loadOlderAnchorRef.current;
        loadOlderAnchorRef.current = null;
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight - prevH + prevTop;
    }, [displayMessages]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el || !onLoadOlder || !hasMoreOlder || loadingOlder) return;
        if (el.scrollTop > 72) return;
        loadOlderAnchorRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
        void (async () => {
            try {
                await onLoadOlder();
            } catch {
                loadOlderAnchorRef.current = null;
            }
        })();
    };

    useEffect(() => {
        return () => {
            if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    const canComplete = ticket.status !== 'completed' && ticket.status !== 'closed';

    const submitMarkComplete = async (skipFeedback: boolean) => {
        try {
            if (skipFeedback) {
                await onMarkComplete();
            } else {
                await onMarkComplete({
                    ...(csatRating != null ? { csatRating } : {}),
                    ...(csatComment.trim() ? { csatComment: csatComment.trim() } : {}),
                });
            }
            setCsatOpen(false);
            setCsatRating(null);
            setCsatComment('');
        } catch {
            toast.error('Could not update');
        }
    };

    const clearPendingImage = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setPendingImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (ticket.status === 'closed' || sending) return;

        if (pendingImage && onSendImage) {
            try {
                emitTyping?.(false);
                if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
                const cap = text.trim();
                await onSendImage(pendingImage, cap);
                clearPendingImage();
                setText('');
                restoreFocusAfterSendRef.current = true;
            } catch {
                toast.error('Failed to send image');
            }
            return;
        }

        const t = text.trim();
        if (!t) return;
        setText('');
        try {
            emitTyping?.(false);
            if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
            await onSend(t);
            restoreFocusAfterSendRef.current = true;
        } catch {
            setText(t);
            toast.error('Failed to send');
            focusComposer();
        }
    };

    return (
        <div
            className={cn(
                'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]',
                className ?? '',
            )}
        >
            {csatOpen && (
                <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="csat-title">
                    <button type="button" className="absolute inset-0 w-full h-full bg-transparent focus:outline-none" aria-label="Close" onClick={() => setCsatOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-2xl space-y-4">
                        <div>
                            <h2 id="csat-title" className="text-sm font-black text-[var(--foreground)] tracking-tight">
                                Mark as Completed
                            </h2>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">How would you rate our support support chat?</p>
                        </div>
                        <div className="flex justify-center gap-1.5 py-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCsatRating(n)}
                                    className={`rounded-lg p-2 text-2xl leading-none transition-transform active:scale-95 focus:outline-none ${
                                        csatRating != null && n <= csatRating ? 'text-amber-400' : 'text-[var(--muted-foreground)] hover:text-amber-400'
                                    }`}
                                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={csatComment}
                            onChange={(e) => setCsatComment(e.target.value)}
                            placeholder="Any optional feedback comments?"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-primary/45"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => submitMarkComplete(true)}
                                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                            >
                                Skip Feedback
                            </button>
                            <button
                                type="button"
                                onClick={() => submitMarkComplete(false)}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-md"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Chat header bar */}
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-4 sm:px-6 bg-[var(--surface)]/30 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-primary/20 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                #{ticket.ticketNumber}
                            </span>
                            <TicketStatusBadge status={ticket.status} />
                        </div>
                        <h1 className="mt-1 text-xs sm:text-sm font-bold text-[var(--foreground)] truncate max-w-[200px] sm:max-w-xs">{ticket.subject}</h1>
                    </div>
                </div>
                {canComplete && (
                    <button
                        type="button"
                        onClick={() => setCsatOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-primary transition hover:bg-primary/20"
                    >
                        <CheckCircle2 size={12} />
                        Mark Completed
                    </button>
                )}
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="support-chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 bg-white dark:bg-transparent"
            >
                {loadingOlder && (
                    <p className="text-center text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider" aria-live="polite">
                        Loading archived entries…
                    </p>
                )}
                {displayMessages.map((m) => (
                    <MessageBubble key={m.id} message={m} isMine={m.senderRole === 'user'} />
                ))}
                {peerTyping && (
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-primary italic" aria-live="polite">
                        <Loader2 size={10} className="animate-spin" />
                        <span>Support representative is typing…</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="shrink-0 border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--surface)]/10">
                {ticket.status === 'closed' ? (
                    <p className="text-center text-xs text-[var(--muted-foreground)] font-semibold py-2">This support session has been closed.</p>
                ) : ticket.status === 'completed' ? (
                    <p className="text-center text-xs text-[var(--muted-foreground)] font-semibold py-2">
                        Ticket marked as completed. Our team will resolve any final queries.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {pendingImage && imagePreviewUrl && (
                            <div className="relative inline-block max-w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imagePreviewUrl} alt="" className="max-h-24 rounded-lg border border-[var(--border)] object-contain" />
                                <button
                                    type="button"
                                    onClick={clearPendingImage}
                                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-sm focus:outline-none"
                                    aria-label="Remove image"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 5 * 1024 * 1024) {
                                        toast.error('Image must be 5MB or smaller');
                                        return;
                                    }
                                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                                    setPendingImage(f);
                                    setImagePreviewUrl(URL.createObjectURL(f));
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending || !onSendImage}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-elevated)] disabled:opacity-30 focus:outline-none"
                                aria-label="Attach image"
                            >
                                <ImagePlus className="h-5 w-5 text-[var(--muted-foreground)]" />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                enterKeyHint="send"
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    emitTyping?.(true);
                                    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
                                    typingIdleRef.current = setTimeout(() => emitTyping?.(false), 2000);
                                }}
                                onBlur={() => {
                                    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
                                    emitTyping?.(false);
                                }}
                                placeholder={pendingImage ? 'Add attachment caption…' : 'Type your client query here...'}
                                className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-primary/45"
                            />
                            <button
                                type="submit"
                                disabled={sending || (!pendingImage && !text.trim()) || (!!pendingImage && !onSendImage)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-black transition shadow-md disabled:opacity-40 focus:outline-none"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
