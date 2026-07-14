'use client';

import { format } from 'date-fns';
import { Check } from 'lucide-react';
import type { SupportMessageDto } from '@/types/support';
import { publicUploadUrl } from '@/lib/publicUploadUrl';

export function MessageBubble({ message, isMine }: { message: SupportMessageDto; isMine: boolean }) {
    const time = message.createdAt ? format(new Date(message.createdAt), 'MMM d, h:mm a') : '';

    const seenBySupport = isMine && message.readByAdmin;
    const imgSrc = publicUploadUrl(message.imageUrl);

    return (
        <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg ${
                    isMine
                        ? 'rounded-br-md bg-gradient-to-br from-primary to-primary-dark text-zinc-950'
                        : 'rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
                }`}
            >
                {!isMine && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Support
                    </p>
                )}
                {imgSrc && (
                    <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="mb-2 block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc} alt="" className="max-h-64 w-full max-w-sm rounded-lg object-contain" />
                    </a>
                )}
                {message.body ? (
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                ) : imgSrc ? null : (
                    <p className="text-sm opacity-80">Image</p>
                )}
                <div
                    className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] ${
                        isMine ? 'text-black/70' : 'text-[var(--muted-foreground)]'
                    }`}
                >
                    <span>{time}</span>
                    {seenBySupport && (
                        <span
                            className="inline-flex items-center gap-0.5 font-medium text-emerald-900/90"
                            title="Support has seen this message"
                        >
                            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                            Seen
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
