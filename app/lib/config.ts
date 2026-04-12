// Shared configuration utility for admin-managed settings
// Uses localStorage as cache + Supabase as persistent backend

// ========== TYPE DEFINITIONS ==========

export interface RACIRow {
    activity: string;
    values: Record<string, string>; // roleKey -> 'R' | 'A' | 'C' | 'I' | 'R/A'
}

export interface RACIConfig {
    columns: { key: string; label: string }[];
    rows: RACIRow[];
}

export interface BudgetItem {
    category: string;
    amount: number;
    date: string;
    description: string;
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
    period: string;
    status: 'Active' | 'Ended' | 'Planned';
    leads: number;
    participants: number;
    conversion: number;
}

export interface RevenueItem {
    subProduct: string;
    quarter: string; // NEW
    actual: number;
    target: number;
    achievement: number;
}

export interface PipelineItem {
    client: string;
    industry?: string;
    stage: string;
    value: number;
    action: string;
    eta: string;
}

export interface ProjectItem {
    name: string;
    phase: string;
    progress: number;
    issue?: string;
}

export interface DocItem {
    title: string;
    desc: string;
    link: string;
    format: 'Doc' | 'Sheet' | 'Folder';
    category: string;
}

export interface TrendPoint {
    category: string;  // e.g. "Month", "Quarter", "Year"
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

export interface AcademyItem {
    program: string;
    batch: string;
    registrants: number;
    converted: number;
}

export interface BIData {
    socials: SocialItem[];
    campaigns: CampaignItem[];
    revenue: RevenueItem[];
    pipeline: PipelineItem[];
    projects: ProjectItem[];
    docs: DocItem[];
    userGrowth: UserGrowthItem[];
    trends: TrendPoint[];
    academy: AcademyItem[];
    budget: BudgetItem[];
}

export interface KanbanProjectItem {
    id: string;
    client: string;
    projectName: string;
    pseId: string;
    stage: string;
    progress: number;
    priority: string;
    notes?: string;
}

export interface KanbanLeadItem {
    id: string;
    name: string;
    pseId: string;
    stage: string;
    isClosed: boolean;
    progress?: number;
    priority?: string;
    notes?: string;
}

export interface KanbanPartnerItem {
    id: string;
    name: string;
    pseId: string;
    type: string;
    isActive: boolean;
    stage: string;
    progress?: number;
    priority?: string;
    notes?: string;
}

export interface KanbanPSEWorkload {
    pseId: string;
    name: string;
    activeProjects: number;
    activeLeads: number;
    activePartners: number;
    totalPoints: number;
    maxCapacity: number;
    loadScore: number;
    loadPercentage: number;
    isActive?: boolean;
    isExisting?: boolean;
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
        Academy: boolean;
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

    // BI Data (override database data when set from admin)
    biData: BIData | null;

    // Kanban extensions
    kanbanProjects?: KanbanProjectItem[];
    kanbanLeads?: KanbanLeadItem[];
    kanbanPartners?: KanbanPartnerItem[];
    pseWorkloads?: KanbanPSEWorkload[];
}

// ========== DEFAULT VALUES ==========

export const DEFAULT_RACI: RACIConfig = {
    columns: [
        { key: 'hob', label: 'HoB' },
        { key: 'ent_lead', label: 'Ent. Lead' },
        { key: 'dwi', label: 'Growth (Dwi)' },
        { key: 'wina', label: 'Activation (Wina)' },
        { key: 'annisa', label: 'Design (Annisa)' },
        { key: 'fariz', label: 'Academy (Fariz)' },
        { key: 'pse_team', label: 'PSE (Technical)' },
        { key: 'sales', label: 'Sales' },
    ],
    rows: [
        { activity: 'Content Execution & Socmed', values: { hob: 'I', ent_lead: 'I', dwi: 'A', wina: 'R', annisa: 'C', fariz: 'I', pse_team: 'C', sales: 'I' } },
        { activity: 'Paid Ads & Funnel Analytics', values: { hob: 'I', ent_lead: 'I', dwi: 'R/A', wina: 'I', annisa: 'I', fariz: 'I', pse_team: 'I', sales: 'I' } },
        { activity: 'Visual Assets & Brand Drc.', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'C', annisa: 'R/A', fariz: 'I', pse_team: 'I', sales: 'I' } },
        { activity: 'Academy Curriculum & LMS', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'C', annisa: 'C', fariz: 'R/A', pse_team: 'C', sales: 'I' } },
        { activity: 'Solution Design & SDLC', values: { hob: 'I', ent_lead: 'I', dwi: 'I', wina: 'I', annisa: 'I', fariz: 'I', pse_team: 'R/A', sales: 'C' } },
        { activity: 'Enterprise Lead Acquisition', values: { hob: 'I', ent_lead: 'A', dwi: 'I', wina: 'I', annisa: 'I', fariz: 'I', pse_team: 'C', sales: 'R' } },
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
        Academy: true,
        UserGrowth: true,
        Gallery: true,
    },

    roles: {
        'dwi': { 
            title: 'Growth Marketing (Dwi)', 
            focus: 'Ensuring the B2C engine runs effectively, interconnected, and aligned with goals.', 
            responsibilities: [
                'Define direction, priorities, and trade-offs for the B2C team.',
                'Ensure every role works according to objectives.',
                'Maintain the rhythm of weekly meetings, planning, and evaluation.',
                'Oversee the end-to-end funnel: acquisition, activation, conversion, and retention.',
                'Act as the primary decision-maker for campaign priorities and effort allocation.',
                'Identify cross-role bottlenecks and drive their resolution.'
            ], 
            dos: ['Focus on ROI and cross-role synergy.'], 
            donts: ['Do not micromanage execution details if the rhythm is established.'] 
        },
        'wina': { 
            title: 'Activation Specialist (Wina)', 
            focus: 'Driving the top funnel and conversation layer to ensure leads enter, are processed, and remain fresh.', 
            responsibilities: [
                'Community activation.',
                'Social media coordination and execution support.',
                'Customer service and inquiry handling.',
                'Lead follow-up discipline.',
                'Tracking incoming leads and inquiry sources.'
            ], 
            dos: ['Maintain high responsiveness to inquiries.'], 
            donts: ['Do not let leads go cold without follow-up.'] 
        },
        'annisa': { 
            title: 'Graphic Designer & Video Editor (Annisa)', 
            focus: 'Ensuring all visual and content assets are ready on time, consistent, and support the funnel.', 
            responsibilities: [
                'Creative asset production for campaigns.',
                'Video editing for social and product content.',
                'Visual consistency across MAPID and MAPID Academy.',
                'Supporting campaign readiness with timely asset delivery.',
                'Helping maintain discipline in request flow and creative timeline.'
            ], 
            dos: ['Maintain creative discipline and schedule.'], 
            donts: ['Do not compromise brand consistency for speed.'] 
        },
        'fariz': { 
            title: 'Learning Operation (Fariz)', 
            focus: 'Ensuring MAPID Academy products are market-ready, run smoothly, and continuously improve in delivery and quality.', 
            responsibilities: [
                'Product strategy for MAPID Academy.',
                'Operational readiness and batch planning.',
                'Curriculum and class flow improvement.',
                'Mentor coordination and class quality.',
                'Evaluation of learner experience and product enhancement.',
                'Documentation of feedback into concrete improvement.'
            ], 
            dos: ['Prioritize learner experience and curriculum relevance.'], 
            donts: ['Do not neglect post-class feedback loops.'] 
        },
        'pse_team': { 
            title: 'Product Solutions Engineer', 
            focus: 'Technical solution owner across presales and delivery stages.', 
            responsibilities: [
                'Acts as the technical solution owner across both presales (Leads Support stages) and delivery (Projects Kanban stages), ensuring end‑to‑end consistency from Discovery Meeting to Value Review.',
                'Supports presales by joining Discovery Meetings, translating MoM & BRD into feasible solution designs, performing Feasibility Checks, producing Solution Design & FRD, and leading Validation & Demo sessions.',
                'Collaborates with sales during Commercial Negotiation to confirm technical scope, assumptions, and risks, so that what is committed in proposals can be realistically delivered.',
                'Leads the technical flow after Technical Handover in Projects: Feasibility & Design, Demo/POC (if required), Development & Data, Internal Testing, UAT with Client, and supports Training & Go Live.',
                'Ensures solution quality by coordinating with data, product, and engineering teams, minimizing rework between Internal Testing and UAT with Client.',
                'Drives Value Review with clients by helping quantify outcomes and surfacing expansion opportunities back into the Leads Support pipeline.'
            ], 
            dos: ['Reject incomplete handovers.', 'Verify technical feasibility before commitment.'], 
            donts: ['NO commercial negotiation without sales alignment.'] 
        },
        'sales_enterprise': { title: 'Enterprise Sales', focus: 'New Lead Acquisition.', responsibilities: ['Acquire new accounts.', 'Draft commercial proposals.', 'Target: 20 Proposals / Month.'], dos: ['Hit proposal volume.'], donts: ['Do not promise unvalidated tech features.'] },
        'hob': { title: 'Head of Business', focus: 'Growth Engine & P&L Management.', responsibilities: ['Oversee P&L.', 'Manage Marketing & PSE.', 'Coordinate strategy.'], dos: ['Ensure smooth operations.'], donts: ['Do not micromanage daily sales.'] },
        'enterprise_lead': { title: 'Enterprise Lead', focus: 'Commercial Engine.', responsibilities: ['Lead Sales Team.', 'C-Level negotiations.', 'Report pipeline.'], dos: ['Focus on big-ticket deals.'], donts: ['Do not over-commit tech resources.'] },
    },

    raci: DEFAULT_RACI,
    biData: null, // null = use database data, non-null = admin override
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

// ========== SUPABASE INTEGRATION ==========

export async function saveConfigToSupabase(config: SiteConfig): Promise<{ success: boolean; message: string }> {
    try {
        const res = await fetch('/api/bi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveConfig', data: config }),
        });
        const json = await res.json();
        if (json.success) {
            // Also update localStorage cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            return { success: true, message: 'Config saved to Supabase!' };
        }
        return { success: false, message: json.message || 'Failed to save to Supabase' };
    } catch (err: any) {
        // Fallback: save to localStorage only
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return { success: false, message: `Supabase unreachable, saved locally only. (${err.message})` };
    }
}

export async function loadConfigFromSupabase(): Promise<SiteConfig> {
    try {
        const res = await fetch('/api/bi?includeConfig=true');
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
