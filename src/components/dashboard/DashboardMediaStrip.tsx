'use client';

import type { DashboardMedia } from '@/types';
import { publicUploadUrl } from '@/lib/publicUploadUrl';
import { Play } from 'lucide-react';

interface DashboardMediaStripProps {
    items: DashboardMedia[];
    loading?: boolean;
}

function getMediaUrl(path: string): string {
    return publicUploadUrl(path) || path;
}

export default function DashboardMediaStrip({ items, loading = false }: DashboardMediaStripProps) {
    if (loading) {
        return (
            <section className="space-y-3">
                <div className="w-full aspect-[16/9] rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((k) => (
                        <div key={k} className="aspect-video rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    if (!items.length) return null;

    const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const featured = sorted[0];
    const rest = sorted.slice(1);
    const featuredSrc = getMediaUrl(featured.file);
    const featuredIsVideo = featured.mimeType?.startsWith('video/');

    return (
        <section className="space-y-3">
            <div className="group relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black">
                {featuredIsVideo ? (
                    <video
                        src={featuredSrc}
                        controls
                        playsInline
                        className="w-full aspect-[16/9] object-cover"
                    />
                ) : (
                    <img
                        src={featuredSrc}
                        alt="Dashboard media"
                        className="w-full aspect-[16/9] object-cover"
                    />
                )}
                {!featuredIsVideo ? (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                ) : null}
            </div>

            {rest.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {rest.map((item) => {
                        const src = getMediaUrl(item.file);
                        const isVideo = item.mimeType?.startsWith('video/');
                        return (
                            <div
                                key={item._id}
                                className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-black"
                            >
                                {isVideo ? (
                                    <>
                                        <video
                                            src={src}
                                            muted
                                            playsInline
                                            preload="metadata"
                                            className="w-full aspect-video object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />
                                        <span className="absolute left-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white border border-white/30">
                                            <Play size={14} fill="currentColor" />
                                        </span>
                                    </>
                                ) : (
                                    <img
                                        src={src}
                                        alt="Dashboard media thumbnail"
                                        className="w-full aspect-video object-cover"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
}
