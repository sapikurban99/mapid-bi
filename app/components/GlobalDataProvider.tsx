'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DinoGame from './DinoGame';
import GlobalLoadingOverlay from './GlobalLoadingOverlay';
import InactivityPrompt from './InactivityPrompt';
import { setConfig, getConfig } from '../lib/config';

const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes in ms

interface DataContextType {
    isHovering: boolean; // Just a dummy property, the real data lives in config.ts, but we use context to trigger syncs
    syncData: (options?: { silent?: boolean }) => void;
    isLoading: boolean;
}

const GlobalDataContext = createContext<DataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [lastFocusTime, setLastFocusTime] = useState<number | null>(null);

    const syncData = async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        
        // Prevent overlapping syncs if one is already in progress
        if (isLoading && silent) return;

        if (!silent) setIsLoading(true);
        try {
            console.log(`[GlobalSync] ${new Date().toLocaleTimeString()} - Syncing data...`);
            const res = await fetch('/api/bi', {
                // Increased sync timeout to 60 seconds to prevent timeout on slower networks/loads
                signal: AbortSignal.timeout(60000) 
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
            }

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
                mergedData.budget = mergedData.budget?.length ? mergedData.budget : fallbackData.budget || [];

                // Store inside central config
                setConfig({ 
                    biData: mergedData, 
                    kanbanProjects: mergedData.kanbanProjects || [], 
                    kanbanLeads: mergedData.kanbanLeads || [],
                    kanbanPartners: mergedData.kanbanPartners || [],
                    pseWorkloads: mergedData.pseWorkloads || [] 
                });
                
                console.log(`[GlobalSync] ${new Date().toLocaleTimeString()} - Sync successful.`);
            } else {
                console.warn('[GlobalSync] Sync returned errors:', json.message || json.error || 'Unknown error');
            }
        } catch (error: any) {
            if (error.name === 'TimeoutError') {
                console.error('[GlobalSync] Sync timed out after 60s');
            } else {
                console.error('[GlobalSync] Failed to sync global data:', error.message || error);
            }
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    };

    // Auto-fetch on initial load
    useEffect(() => {
        if (pathname !== '/login' && !hasFetched) {
            syncData();
        }
    }, [pathname, hasFetched]);

    // Periodic Background Sync (Seamless)
    useEffect(() => {
        if (pathname === '/login' || !hasFetched) return;

        const interval = setInterval(() => {
            syncData({ silent: true });
        }, 60000); // Sync every 60 seconds

        return () => clearInterval(interval);
    }, [pathname, hasFetched]);

    // Inactivity Tracker
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setLastFocusTime(Date.now());
            } else {
                if (lastFocusTime && (Date.now() - lastFocusTime > INACTIVITY_THRESHOLD)) {
                    setShowInactivityModal(true);
                }
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [lastFocusTime]);


    return (
        <GlobalDataContext.Provider value={{ isHovering: false, syncData, isLoading }}>
            {pathname !== '/login' && isLoading && !hasFetched && <DinoGame isFetching={isLoading} />}
            {/* Removed GlobalLoadingOverlay for a more seamless, non-intrusive experience */}
            <InactivityPrompt show={showInactivityModal} />
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
