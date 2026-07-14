import { createSlice, PayloadAction } from '@reduxjs/toolkit';

    interface ProjectOwner {
    name: string;
    email: string;
    phone: string;
}

interface ProjectFeatures {
    binaryIncome: boolean;
    levelIncome: boolean;
    roiIncome: boolean;
    referralBonus: boolean;
    autoWithdrawal: boolean;
    kycVerification: boolean;
    rankAchievement: boolean;
    eWallet: boolean;
    cryptoPayment: boolean;
    multiCurrency: boolean;
}

interface ProjectConfigData {
    currency: string;
    timezone: string;
    maxUsers: number;
    allowedDomains: string[];
}

interface ProjectMetadata {
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    hasDatabase: boolean;
}

interface ProjectConfig {
    projectId: string;
    name: string;
    databaseName?: string;
    status: 'active' | 'inactive' | 'suspended';
    owner?: ProjectOwner;
    config: ProjectConfigData;
    features: ProjectFeatures;
    metadata: ProjectMetadata;
}

interface IncomeConfig {
    directReferral: {
        enabled: boolean;
        percentage: number;
        description: string;
    };
    dailyROI: {
        enabled: boolean;
        percentage: number;
        description: string;
    };
    levelROI: {
        enabled: boolean;
        levels: Array<{ level: number; percentage: number }>;
    };
    rankIncome: {
        enabled: boolean;
        ranks: Array<{
            name: string;
            requirement: string;
            monthlyReward: number;
        }>;
    };
    globalAutoPool: {
        enabled: boolean;
        description: string;
    };
}

interface ProjectState {
    config: ProjectConfig | null;
    incomeConfig: IncomeConfig | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null; // Timestamp when data was last fetched
    cacheExpiry: number; // Cache expiry time in milliseconds (default: 1 hour)
}

const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

const initialState: ProjectState = {
    config: null,
    incomeConfig: null,
    loading: false,
    error: null,
    lastFetched: null,
    cacheExpiry: CACHE_EXPIRY_TIME,
};

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setProjectConfig: (state, action: PayloadAction<ProjectConfig>) => {
            state.config = action.payload;
            state.lastFetched = Date.now();
        },
        setIncomeConfig: (state, action: PayloadAction<IncomeConfig>) => {
            state.incomeConfig = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setCacheExpiry: (state, action: PayloadAction<number>) => {
            state.cacheExpiry = action.payload;
        },
        clearProjectData: (state) => {
            state.config = null;
            state.incomeConfig = null;
            state.lastFetched = null;
            state.error = null;
        },
    },
});

export const { setProjectConfig, setIncomeConfig, setLoading, setError, setCacheExpiry, clearProjectData } = projectSlice.actions;

// Export types for use in other parts of the app
export type { ProjectConfig, ProjectOwner, ProjectFeatures, ProjectConfigData, ProjectMetadata, ProjectState, IncomeConfig };

// Selector to check if cache is expired
export const isCacheExpired = (state: { project: ProjectState }): boolean => {
    const { lastFetched, cacheExpiry } = state.project;
    if (!lastFetched) return true;
    return Date.now() - lastFetched > cacheExpiry;
};

// Selector to check if project data needs to be fetched
export const shouldFetchProject = (state: { project: ProjectState }): boolean => {
    return !state.project.config || isCacheExpired(state);
};

export default projectSlice.reducer;
