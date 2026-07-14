import axios from 'axios';
import { API_URL, PROJECT_ID } from '@/constants/env';
import { store } from '@/lib/store/store';
import { logout } from '@/lib/store/slices/authSlice';
import { STORAGE_KEYS } from '@/constants/storageKey';
import { storageGetItem, storageSetItem } from '@/lib/safe-storage';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const getProjectId = () => PROJECT_ID;

// Request interceptor to add auth token and projectId to all requests
apiClient.interceptors.request.use(
    (config) => {
        // Add access token if available (use 'accessToken' key)
        const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Always add projectId header to all requests
        // Backend expects 'x-project-id' header (lowercase with hyphens)
        const projectId = getProjectId();
        if (projectId && config.headers) {
            config.headers['x-project-id'] = projectId;
        }

        // For POST/PUT/PATCH requests, also add projectId to body if data exists
        if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
            if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
                // Only add if not already present in body (check both ProjectId and projectId)
                // Preserve all existing data when adding projectId
                if (!config.data.ProjectId && !config.data.projectId) {
                    // Preserve all existing fields (like packageId) when adding projectId
                    config.data = {
                        ...config.data, // This preserves packageId and all other fields
                        projectId: projectId,
                    };
                }
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper function to handle logout on 401 error
const handleUnauthorized = () => {
    // Dispatch logout action to update Redux state
    store.dispatch(logout());
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
        // Use setTimeout to ensure Redux state is updated before redirect
        setTimeout(() => {
            window.location.href = '/login';
        }, 100);
    }
};

// Response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors (Unauthorized)
        if (error.response?.status === 401) {
            // Skip token refresh for login and refresh endpoints to avoid infinite loops
            const isAuthEndpoint = originalRequest?.url?.includes('/login') || 
                                  originalRequest?.url?.includes('/auth/refresh') ||
                                  originalRequest?.url?.includes('/register');

            // If it's an auth endpoint, just reject (don't try to refresh)
            if (isAuthEndpoint) {
                return Promise.reject(error);
            }

            // If we haven't retried yet, try to refresh token
            if (!originalRequest._retry) {
                originalRequest._retry = true;

                const refreshToken = storageGetItem(STORAGE_KEYS.REFRESH_TOKEN);
                
                if (refreshToken) {
                    try {
                        // Use direct axios call to avoid interceptor loop for refresh endpoint
                        const refreshResponse = await axios.post(
                            `${API_URL}/auth/refresh`,
                            { refreshToken },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-project-id': getProjectId(),
                                },
                            }
                        );

                        if (refreshResponse.data.success && refreshResponse.data.data?.accessToken) {
                            const newAccessToken = refreshResponse.data.data.accessToken;
                            
                            // Save new access token
                            storageSetItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
                            storageSetItem(STORAGE_KEYS.TOKEN, newAccessToken);
                            
                            // Retry original request with new token
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return apiClient(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed - logout user
                        console.error('Token refresh failed, logging out user:', refreshError);
                        handleUnauthorized();
                        return Promise.reject(refreshError);
                    }
                }
                
                // No refresh token available - logout user
                console.log('No refresh token available, logging out user');
                handleUnauthorized();
            } else {
                // Already retried, logout user
                console.log('Token refresh already attempted, logging out user');
                handleUnauthorized();
            }
        }
        
        // For all other errors (not 401), just reject normally
        return Promise.reject(error);
    }
);

export default apiClient;
