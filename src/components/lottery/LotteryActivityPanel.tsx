'use client';

import { Radio, ShoppingCart, Ticket, UserRound, Zap } from 'lucide-react';

const panelClass =
    'rounded-[1.25rem] border border-amber-100/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.06),rgba(250,204,21,0.015)),rgba(9,9,11,0.95)] p-4 shadow-[0_22px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl';

const activityIconClasses = [
    'border-amber-200/28 bg-amber-300/12 text-amber-100',
    'border-teal-200/24 bg-teal-300/12 text-teal-100',
    'border-sky-200/22 bg-sky-300/10 text-sky-100',
];

function LotteryActivityPanel(
    { activityItems }: { activityItems: { id: string; name: string; action: string; lotteryNumber: string; time: string; icon: number }[] }
) {
    return (
        <aside className={panelClass}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/22 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                        <Radio className="h-4 w-4" />
                        Live feed
                    </div>
                    <h3 className="mt-3 text-[1.12rem] font-black text-white">
                        Room activity
                    </h3>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
                    <Zap className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 max-h-[min(340px,52vh)] overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable]">
                <div className="grid gap-2.5">
                {activityItems.length > 0 ? (
                    activityItems.map((activity, i) => (
                        <article
                            key={`${activity.id}-${i}`}
                            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"
                        >
                            <div className={`grid h-11 w-11 place-items-center rounded-xl border ${activityIconClasses[activity.icon] || activityIconClasses[0]}`}>
                                {activity.icon === 0 ? <ShoppingCart className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                                <h4 className="truncate text-sm font-black text-white">{activity.name}</h4>
                                <p className="mt-0.5 truncate text-xs font-medium text-white/75">{activity.action}</p>
                                <strong className="mt-0.5 block truncate text-xs font-black text-amber-200/90">
                                    {activity.lotteryNumber}
                                </strong>
                            </div>
                            <span className="text-[0.68rem] font-bold text-white/55">{activity.time}</span>
                        </article>
                    ))
                ) : (
                    <div className="grid min-h-[170px] place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-center">
                        <Ticket className="h-8 w-8 text-amber-200" />
                        <p className="mt-3 text-sm font-semibold text-white/70">
                            Activity appears here as tickets enter the room.
                        </p>
                    </div>
                )}
                </div>
            </div>
        </aside>
    );
}

export default LotteryActivityPanel;
