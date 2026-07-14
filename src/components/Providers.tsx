'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi/config';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useEnsureProjectConfig } from '@/hooks/useProjectConfig';

const queryClient = new QueryClient();

function ProjectConfigLoader({ children }: { children: React.ReactNode }) {
    useEnsureProjectConfig();
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
        <Provider store={store}>
            <ProjectConfigLoader>
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={wagmiConfig} reconnectOnMount>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 4000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </WagmiProvider>
            </QueryClientProvider>
            </ProjectConfigLoader>
        </Provider>
        </ThemeProvider>
    );
}
