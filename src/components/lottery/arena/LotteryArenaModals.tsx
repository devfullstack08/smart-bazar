'use client';

import { useCallback, useState } from 'react';
import type { ComponentType } from 'react';
import { Check, Copy, Link2, Mail, MessageCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/constants/env';
import type { LotteryEvent } from '@/lib/api/lotteryApi';

interface ShareTarget {
    id: string;
    label: string;
    href?: string;
    icon: ComponentType<{ className?: string }>;
}

const backdropClass =
    'fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-md';
const modalClass =
    'relative w-full max-w-[560px] overflow-hidden rounded-[1.4rem] border border-amber-500/25 bg-[linear-gradient(180deg,rgba(26,20,7,0.97),rgba(5,5,8,0.97))] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.08)]';
const closeClass =
    'absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-amber-500/55 hover:bg-amber-500/10';
const optionClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/10';

/** X glyph — lucide-react dropped `Twitter` from typings. */
function XLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export function LotteryHelpModal({ onClose, event }: { onClose: () => void; event?: LotteryEvent | null }) {
    const isCoupon = event?.entryTrigger === 'coupon_purchase' || Number(event?.version || 1) === 2;
    const couponTiers = (event?.couponTiers || []).filter((tier) => tier.enabled !== false);
    const poolWiseTiers = couponTiers.filter((tier) => tier.prizeMode === 'pool_percentage');
    const hasPoolWise = poolWiseTiers.length > 0;
    const isMultiTier = couponTiers.length > 1;
    const drawStatus = event?.status;
    const drawTime = event?.drawTime
        ? new Date(event.drawTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null;
    const steps = isCoupon
        ? [
            isMultiTier
                ? `Choose a coupon tier first. This draw has ${couponTiers.length} active coupon tiers, and each tier creates its own ticket group.`
                : `Choose your ticket quantity. Each coupon costs ${couponTiers[0]?.amount || ''} ${couponTiers[0]?.currencySymbol || 'USDT'} and creates one ticket.`,
            'Logged-in users buy from the lottery wallet. Guest users send the exact coupon total, then enter name, email, payout wallet, and transaction hash.',
            hasPoolWise
                ? 'Pool-wise prize mode is active: when coupons are bought, that tier pool increases live. Winners in that tier are paid from that tier pool using the admin percentage split.'
                : 'Prize mode is fixed for this draw: winners receive the configured prize, not a pool-percentage share.',
            'At draw time the server locks tickets and selects winners. Winners are revealed by rank, and external winners claim to the same payout wallet used at purchase.',
        ]
        : [
            'This is a package-entry lottery. Buy or hold the qualifying package during the entry window to receive lottery tickets.',
            'Tickets appear in the live room as participants join. Watch the arena until the draw is ready.',
            'At draw time the server locks entries and selects winners according to the admin winner method for this event.',
            'Winners stay visible after the draw. If token payout is enabled, eligible winners claim to their profile wallet.',
        ];
    const tierSummary = hasPoolWise
        ? poolWiseTiers.map((tier) => tier.label || `${tier.amount} ${tier.currencySymbol || 'USDT'}`).join(', ')
        : '';
    return (
        <div className={backdropClass} role="dialog" aria-modal="true" onClick={onClose}>
            <div className={modalClass} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={closeClass} onClick={onClose} aria-label="Close">
                    <X className="h-4 w-4" />
                </button>
                <h3 className="pr-10 text-2xl font-black text-white">How this lottery works</h3>
                <p className="mt-2 text-sm font-medium text-white/70">
                    {event?.title || 'Quick rules for the selected draw.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-amber-500/24 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">
                        {isCoupon ? 'Coupon entry' : 'Package entry'}
                    </span>
                    {drawStatus ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/65">
                            {drawStatus}
                        </span>
                    ) : null}
                    {drawTime ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/65">
                            Draw {drawTime}
                        </span>
                    ) : null}
                </div>
                {tierSummary ? (
                    <p className="mt-3 rounded-xl border border-amber-500/16 bg-amber-500/[0.08] px-3 py-2 text-xs font-semibold leading-relaxed text-amber-400/75">
                        Pool-wise tiers: {tierSummary}
                    </p>
                ) : null}
                <div className="mt-5 grid gap-3">
                    {steps.map((text, index) => (
                        <div key={index} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                            <strong className="grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-sm font-black text-[#050508]">
                                {index + 1}
                            </strong>
                            <p className="text-sm leading-relaxed text-white/78">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function LotteryShareModal({ onClose, eventTitle }: { onClose: () => void; eventTitle: string }) {
    const [copied, setCopied] = useState(false);
    const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

    const message = `Join me at ${APP_NAME} Lottery Arena — live draw of ${eventTitle}!`;
    const encodedMsg = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareUrl || '');

    const copyLink = useCallback(async () => {
        if (!shareUrl) return;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                const ta = document.createElement('textarea');
                ta.value = shareUrl;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            toast.success('Lottery link copied');
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.error('Unable to copy. Please copy the link manually.');
        }
    }, [shareUrl]);

    const targets: ShareTarget[] = [
        { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodedMsg}%20${encodedUrl}`, icon: MessageCircle },
        { id: 'twitter', label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`, icon: XLogo },
        { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`, icon: Send },
        { id: 'email', label: 'Email', href: `mailto:?subject=${encodeURIComponent(`${APP_NAME} Lottery Arena`)}&body=${encodedMsg}%0A%0A${encodedUrl}`, icon: Mail },
    ];

    return (
        <div className={backdropClass} role="dialog" aria-modal="true" onClick={onClose}>
            <div className={modalClass} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={closeClass} onClick={onClose} aria-label="Close share menu">
                    <X className="h-4 w-4" />
                </button>
                <h3 className="pr-10 text-2xl font-black text-white">Share & Invite</h3>
                <p className="mt-2 text-sm font-medium text-white/70">
                    Pick a channel and invite friends to watch the live draw with you.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {targets.map((target) => {
                        const Icon = target.icon;
                        return (
                            <a
                                key={target.id}
                                href={target.href}
                                target="_blank"
                                rel="noreferrer"
                                className={optionClass}
                                onClick={onClose}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{target.label}</span>
                            </a>
                        );
                    })}
                    <button type="button" className={optionClass} onClick={copyLink}>
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        <span>{copied ? 'Copied!' : 'Copy link'}</span>
                    </button>
                    <a href={shareUrl || '#'} target="_blank" rel="noreferrer" className={optionClass} onClick={onClose}>
                        <Link2 className="h-5 w-5" />
                        <span>Open in new tab</span>
                    </a>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/60">
                    {shareUrl || 'Loading link...'}
                </div>
            </div>
        </div>
    );
}
