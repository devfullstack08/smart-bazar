'use client';

interface DashboardUser {
  name: string;
  sponsorId?: string | { name?: string; userId?: string; email?: string } | null;
}

export interface DashboardWelcomeCardProps {
  user: DashboardUser;
  loading?: boolean;
}

/** Welcome block: "Welcome back, {name}" and sponsor info. */
export default function DashboardWelcomeCard({ user, loading = false }: DashboardWelcomeCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-3" />
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
        <div className="h-4 w-80 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-4" />
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
        Your dashboard
      </p>
      <h1
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Welcome back, {user.name}
      </h1>
      <p className="text-[var(--muted-foreground)] text-sm sm:text-base mb-4">
        Here&apos;s what&apos;s happening with your account today.
      </p>
      <p className="text-sm text-[var(--muted-foreground)]">
        <span className="font-medium text-[var(--foreground)]">Sponsor:</span>{' '}
        {user.sponsorId && typeof user.sponsorId === 'object' && 'name' in user.sponsorId ? (
          <span>
            {user.sponsorId.name}{' '}
            <span className="text-[var(--muted-foreground)]">({user.sponsorId.userId})</span>
          </span>
        ) : typeof user.sponsorId === 'string' && user.sponsorId ? (
          <span>{user.sponsorId}</span>
        ) : (
          <span>Direct</span>
        )}
      </p>
    </div>
  );
}
