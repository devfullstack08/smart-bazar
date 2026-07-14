import { API_URL, PROJECT_ID } from '@/constants/env';
import { STORAGE_KEYS } from '@/constants/storageKey';
import { storageGetItem } from '@/lib/safe-storage';
import type { ProjectPopup } from '@/types';
import apiClient from './axios';

export type PopupPayload = {
    name: string;
    title?: string;
    description?: string;
    contents: Array<{
        id?: string;
        type: 'text' | 'image' | 'video';
        order?: number;
        text?: string;
        file?: string;
        mimeType?: string;
        url?: string;
        poster?: string;
    }>;
    order?: number;
    showOn?: 'dashboard';
    isActive: boolean;
    startAt: string;
    endAt: string;
};

export const adminPopupApi = {
    normalizePopup: (popup: ProjectPopup): ProjectPopup => ({
        ...popup,
        contents: Array.isArray(popup.contents)
            ? popup.contents.map((item) => {
                const file = item.file ?? item.url ?? '';
                return {
                    ...item,
                    file,
                    url: item.url ?? file,
                };
            })
            : [],
    }),

    list: async () => {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ProjectPopup[];
        }>('/admin/popups', {
            headers: { projectId: PROJECT_ID },
        });
        return Array.isArray(response.data.data) ? response.data.data.map(adminPopupApi.normalizePopup) : [];
    },

    create: async (payload: PopupPayload) => {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: ProjectPopup;
        }>('/admin/popups', payload, {
            headers: { projectId: PROJECT_ID },
        });
        return adminPopupApi.normalizePopup(response.data.data);
    },

    update: async (popupId: string, payload: Partial<PopupPayload>) => {
        const response = await apiClient.patch<{
            success: boolean;
            message: string;
            data: ProjectPopup;
        }>(`/admin/popups/${popupId}`, payload, {
            headers: { projectId: PROJECT_ID },
        });
        return adminPopupApi.normalizePopup(response.data.data);
    },

    remove: async (popupId: string) => {
        const response = await apiClient.delete<{ success: boolean; message: string }>(
            `/admin/popups/${popupId}`,
            {
                headers: { projectId: PROJECT_ID },
            }
        );
        return response.data;
    },

    uploadMedia: async (file: File, type?: 'image' | 'video') => {
        const formData = new FormData();
        formData.append('file', file);
        if (type) {
            formData.append('type', type);
        }

        const headers: Record<string, string> = {
            'X-Project-ID': PROJECT_ID ?? '',
        };

        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || storageGetItem(STORAGE_KEYS.TOKEN);
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_URL}/admin/popups/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(err?.error || err?.message || 'Upload failed');
        }

        const data = await response.json();
        const uploaded = data?.data as { file?: string; mimeType?: string; url?: string; poster?: string };
        const resolvedUrl = uploaded?.file ?? uploaded?.url ?? '';
        return {
            ...uploaded,
            file: resolvedUrl,
            url: resolvedUrl,
        };
    },
};
