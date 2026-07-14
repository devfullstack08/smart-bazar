import { API_URL } from "@/constants";

const getServerBaseUrl = (): string => {
    const apiUrl = API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    return baseUrl || 'http://localhost:5001';
};

export const getFileUrl = (filePath: string | null | undefined): string => {
    if (!filePath) {
        return '';
    }

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    const serverBaseUrl = getServerBaseUrl();
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

    return `${serverBaseUrl}${normalizedPath}`;
};