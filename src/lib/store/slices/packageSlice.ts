import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Package } from '@/types';

interface PackageState {
    packages: Package[];
    loading: boolean;
    error: string | null;
}

const initialState: PackageState = {
    packages: [],
    loading: false,
    error: null,
};

const packageSlice = createSlice({
    name: 'packages',
    initialState,
    reducers: {
        setPackages: (state, action: PayloadAction<Package[]>) => {
            state.packages = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setPackages, setLoading, setError } = packageSlice.actions;
export default packageSlice.reducer;
