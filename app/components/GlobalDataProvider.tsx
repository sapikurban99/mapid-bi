'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DinoGame from './DinoGame';
import { setConfig, getConfig } from '../lib/config';

interface DataContextType {
    isHovering: boolean; // Just a dummy property, the real data lives in config.ts, but we use context to trigger syncs
    syncData: () => void;
    isLoading: boolean;
}

const GlobalDataContext = createContext<DataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const syncData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/gas');
            const json = await res.json();

            if (json && !json.isError && !json.error) {
                // Determine if we merge or use fallback
                const adminBiData = getConfig().biData;
                const fallbackData = json.adminConfig?.biData || adminBiData || {};

                const mergedData = { ...json };
                mergedData.socials = mergedData.socials?.length ? mergedData.socials : fallbackData.socials || [];
                mergedData.campaigns = mergedData.campaigns?.length ? mergedData.campaigns : fallbackData.campaigns || [];
                mergedData.revenue = mergedData.revenue?.length ? mergedData.revenue : fallbackData.revenue || [];
                mergedData.pipeline = mergedData.pipeline?.length ? mergedData.pipeline : fallbackData.pipeline || [];
                mergedData.projects = mergedData.projects?.length ? mergedData.projects : fallbackData.projects || [];
                mergedData.trends = mergedData.trends?.length ? mergedData.trends : fallbackData.trends || [];
                mergedData.userGrowth = mergedData.userGrowth?.length ? mergedData.userGrowth : fallbackData.userGrowth || [];
                mergedData.academy = mergedData.academy?.length ? mergedData.academy : fallbackData.academy || [];
                mergedData.docs = mergedData.docs?.length ? mergedData.docs : fallbackData.docs || [];
                mergedData.disbursement = mergedData.disbursement?.length ? mergedData.disbursement : fallbackData.disbursement || [];

                // Store inside central config
                setConfig({ biData: mergedData });
            }
        } catch (error) {
            console.error('Failed to sync global data:', error);
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    };

    // Auto-fetch ONLY on initial load for protected routes
    useEffect(() => {
        if (pathname !== '/login' && !hasFetched) {
            syncData();
        }
    }, [pathname, hasFetched]);

    return (
        <GlobalDataContext.Provider value={{ isHovering: false, syncData, isLoading }}>
            {pathname !== '/login' && isLoading && <DinoGame isFetching={isLoading} />}
            {children}
        </GlobalDataContext.Provider>
    );
}

export function useGlobalData() {
    const context = useContext(GlobalDataContext);
    if (!context) {
        throw new Error('useGlobalData must be used within a GlobalDataProvider');
    }
    return context;
}
