import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import packageReducer from './slices/packageSlice';
import projectReducer from './slices/projectSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        wallet: walletReducer,
        packages: packageReducer,
        project: projectReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
