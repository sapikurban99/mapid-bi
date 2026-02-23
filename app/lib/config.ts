// Shared configuration utility for admin-managed settings
// Uses localStorage as cache + Google Apps Script as persistent backend

// ========== TYPE DEFINITIONS ==========

export interface RACIRow {
    activity: string;
    values: Record<string, string>; // roleKey -> 'R' | 'A' | 'C' | 'I' | 'R/A'
}

export interface RACIConfig {
    columns: { key: string; label: string }[];
    rows: RACIRow[];
}

export interface SocialItem {
    month: string;
    week: string;
    platform: string;
    metric: string;
    value: number;
}

export interface CampaignItem {
    name: string;
    status: 'Active' | 'Ended' | 'Planned';
    leads: number;
    participants: number;
    conversion: number;
}

export interface RevenueItem {
    subProduct: string;
    actual: number;
    target: number;
    achievement: number;
}

export interface PipelineItem {
    client: string;
    stage: string;
    value: number;
    action: string;
    eta: string;
}

export interface ProjectItem {
    name: string;
    phase: string;
    progress: number;
}

export interface DocItem {
    title: string;
    desc: string;
    link: string;
    format: 'Doc' | 'Sheet' | 'Folder';
    category: string;
}

export interface TrendPoint {
    label: string;
    revenue: number;
    dealSize: number;
}

export interface UserGrowthItem {
    month: string;
    week: string;
    newRegist: number;
    activeGeoUsers: number;
    conversion: number;
}

export interface BIData {
    socials: SocialItem[];
    campaigns: CampaignItem[];
    revenue: RevenueItem[];
    pipeline: PipelineItem[];
    projects: ProjectItem[];
    docs: DocItem[];
    userGrowth: UserGrowthItem[];
    trends: {
        month: TrendPoint[];
        quarter: TrendPoint[];
        year: TrendPoint[];
    };
}

export interface SiteConfig {
    // Branding
    sidebarTitle: string;
    siteTitle: string;

    // Home page
    heroTitle: string;
    heroSubtitle: string;
    objectiveTitle: string;
    objectiveText: string;
    vibeTitle: string;
    vibeText: string;

    // BI Dashboard
    biPassword: string;
    tabsVisible: {
        Trends: boolean;
        B2C: boolean;
        B2B: boolean;
        UserGrowth: boolean;
        Gallery: boolean;
    };

    // Role details
    roles: Record<string, {
        title: string;
        focus: string;
        responsibilities: string[];
        dos: string[];
        donts: string[];
    }>;

    // RACI Matrix
    raci: RACIConfig;

    // BI Data (override GAS data when set from admin)
    biData: BIData | null;
}

// ========== DEFAULT VALUES ==========

export const DEFAULT_RACI: RACIConfig = {
    columns: [
        { key: 'hob', label: 'HoB' },
        { key: 'ent_lead', label: 'Ent. Lead' },
        { key: 'dwi', label: 'Grwth (Dwi)' },
        { key: 'wina', label: 'Actv (Wina)' },
        { key: 'annisa', label: 'Dsgn (Annisa)' },
        { key: 'fariz', label: 'Acdm (Fariz)' },
        { key: 'pse', label: 'PSE' },
        { key: 'sales', label: 'Sales' },
    ],
    rows: [
        { activity: 'Content Execution & Socmed', values: { hob: 'I', ent_lead: 'I', dwi: 'A', wina: 'R', annisa: 'C', fariz: 'I', pse: 'C', sales: 'I' } },
        { activity: 'Paid Ads & Funnel Analytics', values: { hob: 'I', ent_lead: 'I', dwi: 'R/A', wina: 'I', annisa: 'I', fariz: 'I', pse: 'I', sales: 'I' } },
        { activity: 'Visual Assets & Brand Drc.', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'C', annisa: 'R/A', fariz: 'I', pse: 'I', sales: 'I' } },
        { activity: 'Academy Curriculum & LMS', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'C', annisa: 'C', fariz: 'R/A', pse: 'C', sales: 'I' } },
        { activity: 'Solution Design & SDLC', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'I', annisa: 'I', fariz: 'I', pse: 'R/A', sales: 'C' } },
        { activity: 'Enterprise Lead Acquisition', values: { hob: 'I', ent_lead: 'A', dwi: 'I', wina: 'I', annisa: 'I', fariz: 'I', pse: 'C', sales: 'R' } },
    ],
};

export const DEFAULT_CONFIG: SiteConfig = {
    sidebarTitle: 'BUSINESS MAPID',
    siteTitle: 'MAPID BI & Strategy',

    heroTitle: 'STRATEGY',
    heroSubtitle: 'REPORT.',
    objectiveTitle: 'Main Objective',
    objectiveText: 'Scale Enterprise B2B & Dominate Academy Market to achieve aggressive 2026 targets.',
    vibeTitle: 'Current Vibe',
    vibeText: 'Aggressive growth with high achievement targets across all operational pillars.',

    biPassword: 'MAPID2026',
    tabsVisible: {
        Trends: true,
        B2C: true,
        B2B: true,
        UserGrowth: true,
        Gallery: true,
    },

    roles: {
        'dwi': { title: 'Growth Marketing (Dwi)', focus: 'Planning Conversion Funnels, Data Analytics.', responsibilities: ['Analyze user data & manage paid channels.', 'Temporary Admin (Q1).', 'Final Quality Control (QC) for content.'], dos: ['Focus on CPL and Conversion Rates.'], donts: ['Do not execute content creation.'] },
        'wina': { title: 'Activation (Wina)', focus: 'Full Content Execution & Community Leadership.', responsibilities: ['Plan & Execute ALL social media content.', 'Manage community freelancers.', 'Lead brainstorming with PSE.'], dos: ['Translate complex tech jargon.'], donts: ['Do not wait for ideas (You are the engine).'] },
        'annisa': { title: 'Design (Annisa)', focus: 'Brand Awareness & Art Direction.', responsibilities: ['Create visual assets.', 'Manage freelance designers.', 'Maintain Brand Guidelines.'], dos: ['Ensure visual consistency.'], donts: ['Do not compromise brand guidelines.'] },
        'fariz': { title: 'Academy Ops (Fariz)', focus: 'Curriculum Architecture.', responsibilities: ['Draft curriculum & update LMS.', 'Manage thematic classes.', 'Ensure product readiness.'], dos: ['Focus on curriculum quality.'], donts: ['Do not handle PR/Humas.'] },
        'pse_team': { title: 'PSE Team', focus: 'Technical PM & Solution Design.', responsibilities: ['Manage SDLC.', 'Technical proposals.', 'Handover Validation.', 'Technical support.'], dos: ['Reject incomplete handovers.'], donts: ['NO commercial negotiation.'] },
        'sales_enterprise': { title: 'Enterprise Sales', focus: 'New Lead Acquisition.', responsibilities: ['Acquire new accounts.', 'Draft commercial proposals.', 'Target: 20 Proposals / Month.'], dos: ['Hit proposal volume.'], donts: ['Do not promise unvalidated tech features.'] },
        'hob': { title: 'Head of Business', focus: 'Growth Engine & P&L Management.', responsibilities: ['Oversee P&L.', 'Manage Marketing & PSE.', 'Coordinate strategy.'], dos: ['Ensure smooth operations.'], donts: ['Do not micromanage daily sales.'] },
        'enterprise_lead': { title: 'Enterprise Lead', focus: 'Commercial Engine.', responsibilities: ['Lead Sales Team.', 'C-Level negotiations.', 'Report pipeline.'], dos: ['Focus on big-ticket deals.'], donts: ['Do not over-commit tech resources.'] },
    },

    raci: DEFAULT_RACI,
    biData: null, // null = use GAS data, non-null = admin override
};

// ========== STORAGE ==========

const STORAGE_KEY = 'mapid-bi-config';

export function getConfig(): SiteConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return deepMerge(DEFAULT_CONFIG, parsed) as SiteConfig;
        }
    } catch {
        // Fallback to defaults
    }
    return DEFAULT_CONFIG;
}

export function setConfig(config: Partial<SiteConfig>): void {
    if (typeof window === 'undefined') return;

    const current = getConfig();
    const merged = deepMerge(current, config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function resetConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// ========== GAS INTEGRATION ==========

export async function saveConfigToGAS(config: SiteConfig): Promise<{ success: boolean; message: string }> {
    try {
        const res = await fetch('/api/gas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveConfig', data: config }),
        });
        const json = await res.json();
        if (json.success) {
            // Also update localStorage cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            return { success: true, message: 'Config saved to Google Sheets!' };
        }
        return { success: false, message: json.message || 'Failed to save to GAS' };
    } catch (err: any) {
        // Fallback: save to localStorage only
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return { success: false, message: `GAS unreachable, saved locally only. (${err.message})` };
    }
}

export async function loadConfigFromGAS(): Promise<SiteConfig> {
    try {
        const res = await fetch('/api/gas?includeConfig=true');
        const json = await res.json();
        if (json.adminConfig) {
            const merged = deepMerge(DEFAULT_CONFIG, json.adminConfig) as SiteConfig;
            // Cache to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
        }
    } catch {
        // Fallback to localStorage
    }
    return getConfig();
}

// ========== UTIL ==========

function deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key of Object.keys(source)) {
        if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
        ) {
            output[key] = deepMerge(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
}
