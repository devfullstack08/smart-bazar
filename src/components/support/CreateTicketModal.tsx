'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import type { SupportCategory } from '@/types/support';

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { subject: string; message: string; category: SupportCategory }) => Promise<void>;
};

const categories: { id: SupportCategory; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' },
    { id: 'billing', label: 'Billing' },
    { id: 'technical', label: 'Technical' },
    { id: 'other', label: 'Other' },
];

export function CreateTicketModal({ open, onClose, onSubmit }: Props) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState<SupportCategory>('general');
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (subject.trim().length < 3 || !message.trim()) return;
        setLoading(true);
        try {
            await onSubmit({ subject: subject.trim(), message: message.trim(), category });
            setSubject('');
            setMessage('');
            setCategory('general');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">New support ticket</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as SupportCategory)}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Subject</label>
                        <input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-primary/50"
                            placeholder="What do you need help with?"
                            maxLength={500}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-primary/50"
                            placeholder="Describe your issue in detail..."
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || subject.trim().length < 3}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary py-3 text-sm font-bold text-zinc-950 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {loading ? (
                            'Sending...'
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Create ticket
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
