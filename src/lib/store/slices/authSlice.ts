import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthResponse } from '@/types';
import { STORAGE_KEYS } from '@/constants/storageKey';
import { getLocalStorage, storageGetItem, storageRemoveItem, storageSetItem } from '@/lib/safe-storage';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
}

// Initialize state from localStorage if available (for page refreshes)
const getInitialState = (): AuthState => {
    if (!getLocalStorage()) {
        return {
            isAuthenticated: false,
            token: null,
            user: null,
            loading: false,
            error: null,
        };
    }

    const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || storageGetItem(STORAGE_KEYS.TOKEN);
    const userStr = storageGetItem(STORAGE_KEYS.USER_KEY);
    
    let user: User | null = null;
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
        }
    }

    return {
        isAuthenticated: !!accessToken && !!user,
        token: accessToken,
        user: user,
        loading: false,
        error: null,
    };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
            state.isAuthenticated = true;
            state.token = action.payload.data.accessToken; // Store accessToken as token for backward compatibility
            state.user = action.payload.data.user;
            state.loading = false;
            state.error = null;

            storageSetItem(STORAGE_KEYS.ACCESS_TOKEN, action.payload.data.accessToken);
            storageSetItem(STORAGE_KEYS.REFRESH_TOKEN, action.payload.data.refreshToken);
            storageSetItem(STORAGE_KEYS.TOKEN, action.payload.data.accessToken);
            storageSetItem(STORAGE_KEYS.USER_KEY, JSON.stringify(action.payload.data.user));
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.token = null;
            state.user = null;
            state.loading = false;
            state.error = null;

            storageRemoveItem(STORAGE_KEYS.ACCESS_TOKEN);
            storageRemoveItem(STORAGE_KEYS.REFRESH_TOKEN);
            storageRemoveItem(STORAGE_KEYS.TOKEN);
            storageRemoveItem(STORAGE_KEYS.USER_KEY);
            storageRemoveItem(STORAGE_KEYS.REMEMBER_ME_KEY);
        },
        updateUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            // If user is updated and we have a token, mark as authenticated
            if (action.payload && state.token) {
                state.isAuthenticated = true;
            }
            storageSetItem(STORAGE_KEYS.USER_KEY, JSON.stringify(action.payload));
        },
        restoreAuth: (state) => {
            const accessToken = storageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || storageGetItem(STORAGE_KEYS.TOKEN);
            const userStr = storageGetItem(STORAGE_KEYS.USER_KEY);

            if (accessToken && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    state.isAuthenticated = true;
                    state.token = accessToken;
                    state.user = user;
                } catch (error) {
                    console.error('Failed to restore auth from localStorage:', error);
                }
            }
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
