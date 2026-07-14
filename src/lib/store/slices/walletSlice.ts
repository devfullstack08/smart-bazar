import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Wallet } from '@/types';

interface WalletState {
    wallet: Wallet | null;
    loading: boolean;
    error: string | null;
}

const initialState: WalletState = {
    wallet: null,
    loading: false,
    error: null,
};

const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        setWallet: (state, action: PayloadAction<Wallet>) => {
            state.wallet = action.payload;
        },
        updateBalance: (state, action: PayloadAction<{ main?: number; rebirth?: number }>) => {
            if (state.wallet) {
                if (action.payload.main !== undefined) {
                    state.wallet.mainBalance = action.payload.main;
                }
                if (action.payload.rebirth !== undefined) {
                    state.wallet.rebirthBalance = action.payload.rebirth;
                }
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setWallet, updateBalance, setLoading, setError } = walletSlice.actions;
export default walletSlice.reducer;
