'use client';

/**
 * Single loading shell for the lottery route: same layout whether the gate is
 * project-config (page.tsx) or lottery data fetch (LotteryPage in dashboard).
 * Full Tailwind — matches the live arena background (#03040a + soft glows).
 */
export default function LotteryPageLoading({ subtitle }: { subtitle: string }) {
    return (
        <div className="min-h-dvh overflow-x-hidden bg-transparent text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-amber-500/12 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-amber-600/8 blur-[90px]" />
                <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-amber-950/30 blur-[90px]" />
            </div>
            <div className="relative z-10 flex min-h-dvh items-center justify-center px-6">
                <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-black/35 px-8 py-10 text-center backdrop-blur-xl">
                    <div
                        className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500 shadow-[0_0_36px_rgba(245,158,11,0.35)]"
                        aria-hidden
                    />
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/95">Preparing lottery arena</p>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}
