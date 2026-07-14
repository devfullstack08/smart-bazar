import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, TeamStats } from '@/types';

interface UserState {
    dashboardStats: DashboardStats | null;
    teamStats: TeamStats | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    dashboardStats: null,
    teamStats: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
            state.dashboardStats = action.payload;
        },
        setTeamStats: (state, action: PayloadAction<TeamStats>) => {
            state.teamStats = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setDashboardStats, setTeamStats, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;
