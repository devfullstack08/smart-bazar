'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Send, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { dedupeMessagesById } from '@/lib/utils/supportThread';
import toast from 'react-hot-toast';
import type { SupportMessageDto, SupportTicketDto } from '@/types/support';
import { MessageBubble } from './MessageBubble';
import { TicketStatusBadge } from './TicketStatusBadge';

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
                <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="csat-title">
                    <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={() => setCsatOpen(false)} />
                    <div className="relative z-10 m-4 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                        <h2 id="csat-title" className="text-sm font-semibold text-[var(--foreground)]">
                            Mark as completed
                        </h2>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">How was your experience? (optional)</p>
                        <div className="mt-3 flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCsatRating(n)}
                                    className={`rounded px-1.5 py-1 text-2xl leading-none transition ${
                                        csatRating != null && n <= csatRating ? 'text-amber-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
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
                            placeholder="Any comments? (optional)"
                            rows={2}
                            className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                        />
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => submitMarkComplete(true)}
                                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)]"
                            >
                                Skip feedback
                            </button>
                            <button
                                type="button"
                                onClick={() => submitMarkComplete(false)}
                                className="rounded-lg bg-[var(--pw-primary)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--pw-primary)]">{ticket.ticketNumber}</span>
                    <TicketStatusBadge status={ticket.status} />
                </div>
                <h1 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{ticket.subject}</h1>
                {canComplete && (
                    <button
                        type="button"
                        onClick={() => setCsatOpen(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--pw-primary)]/40 bg-[var(--pw-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--pw-primary)] transition hover:bg-[var(--pw-primary)]/20"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as completed
                    </button>
                )}
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="support-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5"
            >
                {loadingOlder && (
                    <p className="text-center text-xs text-[var(--muted-foreground)]" aria-live="polite">
                        Loading older messages…
                    </p>
                )}
                {displayMessages.map((m) => (
                    <MessageBubble key={m.id} message={m} isMine={m.senderRole === 'user'} />
                ))}
                {peerTyping && (
                    <p className="text-xs italic text-[var(--pw-primary)]" aria-live="polite">
                        Support is typing…
                    </p>
                )}
            </div>

            <form onSubmit={handleSend} className="shrink-0 border-t border-[var(--border)] p-3 sm:p-4">
                {ticket.status === 'closed' ? (
                    <p className="text-center text-sm text-[var(--muted-foreground)]">This ticket is closed.</p>
                ) : ticket.status === 'completed' ? (
                    <p className="text-center text-sm text-[var(--muted-foreground)]">
                        You marked this as completed. Our team may still reply if needed.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {pendingImage && imagePreviewUrl && (
                            <div className="relative inline-block max-w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imagePreviewUrl} alt="" className="max-h-32 rounded-lg border border-[var(--border)] object-contain" />
                                <button
                                    type="button"
                                    onClick={clearPendingImage}
                                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow ring-1 ring-[var(--border)]"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
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
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-elevated)] disabled:opacity-30"
                                aria-label="Attach image"
                            >
                                <ImagePlus className="h-5 w-5" />
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
                                placeholder={pendingImage ? 'Add a caption (optional)…' : 'Type your message...'}
                                className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--pw-primary)]/40 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={sending || (!pendingImage && !text.trim()) || (!!pendingImage && !onSendImage)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pw-primary)] text-black transition hover:opacity-90 disabled:opacity-40"
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
