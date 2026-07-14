import type { ProjectConfig } from '@/lib/store/slices/projectSlice';

export function isLotteryEnabledForProjectConfig(projectConfig: ProjectConfig | null | undefined): boolean {
    return Boolean(projectConfig?.config?.lottery?.enabled);
}
