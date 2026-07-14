'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { publicUploadUrl } from '@/lib/publicUploadUrl';
import type { PopupContentItem, ProjectPopup } from '@/types';

interface DashboardPopupProps {
    popup: ProjectPopup | null;
    loading?: boolean;
}

const POPUP_DISMISS_STORAGE_KEY = 'dashboard_popup_dismissed_until';

function normalizePopupItems(items: PopupContentItem[] | undefined) {
    if (!Array.isArray(items)) return [];
    return [...items]
        .map((item) => ({
            ...item,
            url: item.url ?? item.file,
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .filter((item) => item?.type === 'text' || item?.type === 'image' || item?.type === 'video');
}

function getMediaUrl(path: string | undefined) {
    if (!path) return '';
    return publicUploadUrl(path) || path;
}

export default function DashboardPopup({ popup, loading = false }: DashboardPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const items = useMemo(() => normalizePopupItems(popup?.contents), [popup?.contents]);

    useEffect(() => {
        if (loading || !popup || !popup.isActive || items.length === 0) {
            setIsOpen(false);
            return;
        }

        const now = Date.now();
        const start = new Date(popup.startAt).getTime();
        const end = new Date(popup.endAt).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || now < start || now > end) {
            setIsOpen(false);
            return;
        }

        const dismissedUntilRaw = localStorage.getItem(POPUP_DISMISS_STORAGE_KEY);
        const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
        if (Number.isFinite(dismissedUntil) && dismissedUntil > now) {
            setIsOpen(false);
            return;
        }

        setIndex(0);
        setIsOpen(true);
    }, [loading, popup, items.length]);

    const closePopup = () => {
        setIsOpen(false);
        if (!popup?.endAt) return;
        const end = new Date(popup.endAt).getTime();
        if (Number.isFinite(end)) {
            localStorage.setItem(POPUP_DISMISS_STORAGE_KEY, String(end));
        }
    };

    const showNavigation = items.length > 1;
    const currentItem = items[index];

    const goPrev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);
    const goNext = () => setIndex((prev) => (prev + 1) % items.length);

    if (!popup || items.length === 0) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={closePopup}
            title={popup.title || popup.name}
            size="xl"
        >
            <div className="space-y-4">
                {popup.description ? (
                    <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
                        {popup.description}
                    </p>
                ) : null}

                <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
                    {currentItem?.type === 'text' && (
                        <div className="min-h-[180px] sm:min-h-[240px] flex items-center justify-center rounded-xl bg-[var(--surface-elevated)] px-4 py-6">
                            <p className="max-w-3xl text-center text-base sm:text-lg leading-relaxed text-[var(--foreground)] whitespace-pre-wrap break-words">
                                {currentItem.text || ''}
                            </p>
                        </div>
                    )}

                    {currentItem?.type === 'image' && (
                        <div className="overflow-hidden rounded-xl">
                            <img
                                src={getMediaUrl(currentItem.url)}
                                alt={popup.title || popup.name || 'Popup image'}
                                className="w-full max-h-[65vh] object-contain bg-black/5"
                            />
                        </div>
                    )}

                    {currentItem?.type === 'video' && (
                        <div className="overflow-hidden rounded-xl bg-black">
                            <video
                                src={getMediaUrl(currentItem.url)}
                                poster={getMediaUrl(currentItem.poster)}
                                controls
                                playsInline
                                className="w-full max-h-[65vh]"
                            />
                        </div>
                    )}

                    {showNavigation && (
                        <>
                            <button
                                type="button"
                                onClick={goPrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/30 bg-black/45 text-white hover:bg-black/60 transition-colors flex items-center justify-center"
                                aria-label="Previous content"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/30 bg-black/45 text-white hover:bg-black/60 transition-colors flex items-center justify-center"
                                aria-label="Next content"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {showNavigation ? (
                    <div className="flex items-center justify-center gap-2">
                        {items.map((item, dotIndex) => (
                            <button
                                key={`${item.id || item.url || item.text || item.type}-${dotIndex}`}
                                type="button"
                                onClick={() => setIndex(dotIndex)}
                                className={`h-2.5 rounded-full transition-all ${dotIndex === index ? 'w-7 bg-[var(--pw-primary)]' : 'w-2.5 bg-[var(--border)]'}`}
                                aria-label={`Show content ${dotIndex + 1}`}
                            />
                        ))}
                    </div>
                ) : null}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={closePopup}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
