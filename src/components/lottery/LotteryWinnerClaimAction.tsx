'use client';

import { ExternalLink, Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { lotteryApi, LotteryWinner } from '@/lib/api/lotteryApi';
import { useAppSelector } from '@/lib/store/hooks';
import { getErrorMessage } from '@/lib/utils/error';
import { claimFeeSummary } from '@/components/lottery/lotteryFormat';

interface LotteryWinnerClaimActionProps {
    winner: LotteryWinner;
    compact?: boolean;
    /** Stack fee + controls full width (narrow carousel cards, mobile). */
    fullWidth?: boolean;
    onWinnerUpdate?: (winnerId: string, patch: Partial<LotteryWinner>) => void;
}

export default function LotteryWinnerClaimAction({
    winner,
    compact = false,
    fullWidth = false,
    onWinnerUpdate,
}: LotteryWinnerClaimActionProps) {
    const { user } = useAppSelector((state) => state.auth);
    const [claiming, setClaiming] = useState(false);

    const currentUserIds = [user?.userId, user?.id]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
    const winnerUserId = String(winner.userId || '').trim();
    const isClaimOwner =
        !!winnerUserId &&
        currentUserIds.includes(winnerUserId) &&
        winner.reward.rewardMode === 'token_payout';

    if (!isClaimOwner) return null;

    const updateWinner = (patch: Partial<LotteryWinner>) => {
        onWinnerUpdate?.(winner._id, patch);
    };

    const handleClaim = async () => {
        try {
            setClaiming(true);
            const response = await lotteryApi.claimReward(winner._id);
            updateWinner({
                claimStatus: response.data.claimStatus,
                claimTxHash: response.data.claimTxHash || winner.claimTxHash,
            });
            toast.success('Payout claim queued successfully.');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to claim reward'));
        } finally {
            setClaiming(false);
        }
    };

    const stretch = fullWidth ? ' w-full min-w-0' : '';
    const btnStretch = fullWidth ? ' w-full justify-center' : '';

    const buttonClass = compact
        ? `inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300/60 bg-[linear-gradient(180deg,#fcd34d,#fbbf24)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#2b1500] shadow-[0_4px_14px_rgba(251,191,36,0.2)] transition hover:brightness-110 disabled:opacity-50${btnStretch}`
        : `inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-[linear-gradient(180deg,#fcd34d,#fbbf24)] px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#2b1500] shadow-[0_6px_18px_rgba(251,191,36,0.24)] transition hover:brightness-110 disabled:opacity-50${btnStretch}`;

    const pillClass = compact
        ? `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]${btnStretch}`
        : `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em]${btnStretch}`;

    const feeLine = claimFeeSummary(winner.claimFee, winner.reward.payout?.tokenSymbol);
    const netHint =
        winner.netPayoutAmount && winner.grossPayoutAmount
            ? `Gross ${winner.grossPayoutAmount} → net ${winner.netPayoutAmount} ${winner.reward.payout?.tokenSymbol || ''}`.trim()
            : null;

    if (winner.claimStatus === 'claimable' || winner.claimStatus === 'failed') {
        return (
            <div className={`flex flex-col items-stretch gap-2.5${stretch}`}>
                {feeLine ? (
                    <p
                        className={`text-[11px] font-medium leading-relaxed text-amber-100/85 ${fullWidth ? 'text-left' : compact ? '' : 'text-center sm:text-left'} break-words`}
                    >
                        <span className="font-bold text-amber-200/95">Claim fee:</span> {feeLine}
                        {netHint ? (
                            <>
                                <span className="mx-1 text-white/35" aria-hidden>
                                    ·
                                </span>
                                <span className="text-white/80">{netHint}</span>
                            </>
                        ) : null}
                    </p>
                ) : null}
                <button type="button" onClick={handleClaim} disabled={claiming} className={buttonClass}>
                    {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                    {claiming ? 'Claiming...' : winner.claimStatus === 'failed' ? 'Retry claim' : 'Claim payout'}
                </button>
            </div>
        );
    }

    if (winner.claimStatus === 'processing') {
        return (
            <div className={fullWidth ? 'w-full min-w-0' : undefined}>
                <div className={`${pillClass} w-full border-white/10 bg-white/5 text-amber-200`}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing
                </div>
            </div>
        );
    }

    if (winner.claimStatus === 'claimed') {
        return (
            <div className={`flex flex-col gap-1.5${stretch}`}>
                <div
                    className={`${pillClass} border-amber-500/30 bg-amber-500/5 text-emerald-400 ${fullWidth ? 'w-full justify-center' : ''}`}
                >
                    Claimed
                </div>
                {winner.claimTxHash ? (
                    <a
                        href={`https://bscscan.com/tx/${winner.claimTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400/85 hover:text-emerald-300 ${fullWidth ? 'justify-center' : ''}`}
                    >
                        View TX <ExternalLink className="h-3 w-3" />
                    </a>
                ) : null}
            </div>
        );
    }

    if (winner.claimStatus === 'blocked') {
        return (
            <div className={fullWidth ? 'w-full min-w-0' : undefined}>
                <div className={`${pillClass} w-full border-red-500/30 bg-red-500/10 text-red-400`}>
                    Claim blocked
                </div>
            </div>
        );
    }

    return null;
}
