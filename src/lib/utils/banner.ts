import { API_URL } from '@/constants/env';

const API_BASE = API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5001';

/**
 * Build full URL for upload image (banners, offers, etc).
 * Values are relative paths (e.g. /uploads/banners/{projectId}/{filename}).
 * Base URL = API server without /api/v1
 */
export function getBannerUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE}${path}`;
}

/**
 * Build full URL for offer image.
 * Same logic as getBannerUrl - for /uploads/offers/{projectId}/{filename}
 */
export function getOfferImageUrl(imagePath: string | undefined): string {
    return getBannerUrl(imagePath);
}
