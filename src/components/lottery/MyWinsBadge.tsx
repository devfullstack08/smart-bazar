'use client';

import { useEffect, useState } from 'react';
import { Trophy, ChevronUp, ChevronDown } from 'lucide-react';
import { lotteryApi, type LotteryRecentWinner } from '@/lib/api/lotteryApi';
import { rewardValueLabel } from '@/components/lottery/lotteryFormat';

/**
 * Floating "My Wins" badge — shows win count + recent wins for the logged-in user.
 * Collapsed by default as a small badge; expands to show a compact win list.
 */
export default function MyWinsBadge() {
    const [myWins, setMyWins] = useState<LotteryRecentWinner[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await lotteryApi.getMyWinners(1, 10);
                if (!cancelled && res?.data?.length) {
                    setMyWins(res.data);
                }
            } catch {
                // silently fail — user may not be logged in
            } finally {
                if (!cancelled) setLoaded(true);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, []);

    if (!loaded || !myWins.length) return null;

    const totalRewardText = myWins.reduce((sum, w) => {
        const payout = Number(w.netPayoutAmount || w.grossPayoutAmount || 0);
        return sum + payout;
    }, 0);
    const hasPayouts = totalRewardText > 0;

    return (
        <div className="fixed bottom-24 left-3 z-40 sm:left-4 lg:bottom-5">
            {/* Expanded panel */}
            {expanded && (
                <div className="mb-2 w-[min(80vw,300px)] animate-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(17,17,20,0.97),rgba(8,8,10,0.98))] shadow-[0_22px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                    <div className="border-b border-white/8 px-3 py-2.5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                            Your wins ({myWins.length})
                        </h3>
                        {hasPayouts && (
                            <p className="mt-0.5 text-[10px] font-bold text-white/50">
                                Total earned: <span className="text-emerald-300">${totalRewardText.toFixed(2)}</span>
                            </p>
                        )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-2">
                        {myWins.slice(0, 5).map((win, i) => (
                            <div
                                key={`${win._id}-${i}`}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/5"
                            >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-amber-500/10 text-[9px] font-black text-amber-300">
                                    #{win.rank}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold text-white">{win.eventTitle || 'Draw'}</p>
                                    <p className="truncate text-[9px] text-white/45">{rewardValueLabel(win.reward)}</p>
                                </div>
                                <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-black text-amber-200">
                                    {win.lotteryNumber}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Collapsed badge */}
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="group flex items-center gap-2 rounded-full border border-amber-500/25 bg-[linear-gradient(135deg,rgba(17,17,20,0.96),rgba(8,8,10,0.98))] px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_16px_rgba(245,158,11,0.08)] backdrop-blur-xl transition hover:border-amber-500/45"
            >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-black text-amber-200">{myWins.length} win{myWins.length === 1 ? '' : 's'}</span>
                {expanded ? <ChevronDown className="h-3 w-3 text-white/50" /> : <ChevronUp className="h-3 w-3 text-white/50" />}
            </button>
        </div>
    );
}
