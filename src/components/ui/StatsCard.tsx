import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
}

export function StatsCard({ title, value, icon, trend, trendUp = true }: StatsCardProps) {
    return (
        <div className="premium-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg border border-[var(--border)] bg-[var(--surface-elevated)]">
            <div className="flex justify-between items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[var(--muted-foreground)] text-xs sm:text-sm font-medium mb-1 sm:mb-2">{title}</p>
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-[var(--foreground)] mb-0 sm:mb-1 text-[var(--pw-primary)] truncate leading-tight">
                        {value}
                    </p>
                    {trend && (
                        <p className={`text-xs sm:text-sm font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trend}
                        </p>
                    )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] flex-shrink-0 overflow-hidden">
                    <div className="text-white flex items-center justify-center scale-75 sm:scale-100 origin-center">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}
