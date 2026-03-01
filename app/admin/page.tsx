'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Settings, Save, RotateCcw, Lock, Eye, EyeOff, Search,
    ChevronDown, ChevronRight, ChevronLeft, Check, X, Plus, Trash2, Edit2,
    Home, Users, BarChart3, Palette, Shield, Table2, Database,
    Loader2, AlertCircle, Globe, TrendingUp
} from 'lucide-react';
import {
    getConfig, setConfig, resetConfig, saveConfigToGAS, loadConfigFromGAS,
    DEFAULT_CONFIG, DEFAULT_RACI, SiteConfig,
    RACIRow, SocialItem, CampaignItem, RevenueItem, PipelineItem, ProjectItem, DocItem, TrendPoint, BIData
} from '../lib/config';
import LoadingProgress from '../components/LoadingProgress';

const RACI_OPTIONS = ['R', 'A', 'C', 'I', 'R/A'];
const RACI_COLORS: Record<string, string> = {
    'R': 'bg-blue-100 text-blue-700 border-blue-200',
    'A': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'C': 'bg-amber-100 text-amber-700 border-amber-200',
    'I': 'bg-zinc-100 text-zinc-400 border-zinc-200',
    'R/A': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

// Generic UI Components
const InputField = ({ label, value, onChange, type = 'text', placeholder = '', mono = false, disabled = false }: any) => (
    <div>
        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            value={value ?? (type === 'number' ? 0 : '')}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none text-zinc-900 focus:ring-2 focus:ring-zinc-900 ${mono ? 'font-mono' : 'font-bold'} transition ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-200' : ''}`}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-bold transition"
        >
            {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
    </div>
);

// BI SECTION CONFIGURATION (Mendefinisikan Form dan Tabel secara Dinamis)
const BI_CONFIG: Record<string, any> = {
    socials: {
        title: 'Social Media & Community',
        empty: { month: '', week: '', platform: '', metric: '', value: 0, trend: 'up', growth: '0%' },
        cols: [{ key: 'platform', label: 'Platform' }, { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }, { key: 'month', label: 'Month' }],
        fields: [
            { key: 'month', label: 'Month', type: 'text', placeholder: 'Feb 2026' }, { key: 'week', label: 'Week', type: 'text' },
            { key: 'platform', label: 'Platform', type: 'text' }, { key: 'metric', label: 'Metric', type: 'text' },
            { key: 'value', label: 'Value', type: 'number' },
            { key: 'trend', label: 'Trend Indicator', type: 'select', options: ['up', 'down'] }, { key: 'growth', label: 'Growth %', type: 'text', placeholder: '+5%' }
        ]
    },
    campaigns: {
        title: 'Campaign Data',
        empty: { name: '', period: '', status: 'Active', leads: 0, participants: 0, conversion: 0 },
        cols: [{ key: 'name', label: 'Campaign Name' }, { key: 'status', label: 'Status' }, { key: 'leads', label: 'Leads' }, { key: 'conversion', label: 'Conv %' }],
        fields: [
            { key: 'name', label: 'Name', type: 'text' }, { key: 'period', label: 'Period', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Ended', 'Planned'] },
            { key: 'leads', label: 'Leads', type: 'number' }, { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'conversion', label: 'Conversion (%)', type: 'number', disabled: true }
        ]
    },
    revenue: {
        title: 'Revenue Data',
        empty: { subProduct: '', quarter: '', actual: 0, target: 0, achievement: 0 },
        cols: [{ key: 'subProduct', label: 'Product' }, { key: 'quarter', label: 'Quarter' }, { key: 'actual', label: 'Actual (IDR)' }, { key: 'achievement', label: 'Achv %' }],
        fields: [
            { key: 'subProduct', label: 'Product Name', type: 'text' }, { key: 'quarter', label: 'Quarter', type: 'text' },
            { key: 'target', label: 'Target (Rp)', type: 'number' }, { key: 'actual', label: 'Actual (Rp)', type: 'number' },
            { key: 'achievement', label: 'Achievement (%)', type: 'number', disabled: true }
        ]
    },
    pipeline: {
        title: 'Enterprise Pipeline',
        empty: { client: '', industry: '', stage: 'Prospect', value: 0, action: '', eta: '' },
        cols: [{ key: 'client', label: 'Client' }, { key: 'stage', label: 'Stage' }, { key: 'value', label: 'Est. Value' }, { key: 'eta', label: 'ETA' }],
        fields: [
            { key: 'client', label: 'Client / Lead Name', type: 'text' }, { key: 'industry', label: 'Industry', type: 'text' },
            { key: 'stage', label: 'Stage', type: 'select', options: ['Prospect', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
            { key: 'value', label: 'Est. Value (Rp)', type: 'number' }, { key: 'eta', label: 'ETA Date', type: 'text', placeholder: 'YYYY-MM-DD' },
            { key: 'action', label: 'Next Action', type: 'text' }
        ]
    },
    projects: {
        title: 'Project Delivery',
        empty: { name: '', phase: '', progress: 0, issue: '' },
        cols: [{ key: 'name', label: 'Project Name' }, { key: 'phase', label: 'Phase' }, { key: 'progress', label: 'Progress %' }],
        fields: [
            { key: 'name', label: 'Project Name', type: 'text' }, { key: 'phase', label: 'Current Phase', type: 'text' },
            { key: 'progress', label: 'Progress (%)', type: 'number' }, { key: 'issue', label: 'Issue / Notes', type: 'text' }
        ]
    },
    docs: {
        title: 'Gallery & Docs',
        empty: { title: '', desc: '', link: '', format: 'Doc', category: '' },
        cols: [{ key: 'title', label: 'Document Title' }, { key: 'format', label: 'Format' }, { key: 'category', label: 'Category' }],
        fields: [
            { key: 'title', label: 'Title', type: 'text' }, { key: 'format', label: 'Format', type: 'select', options: ['Doc', 'Sheet', 'Folder', 'PDF'] },
            { key: 'category', label: 'Category Tag', type: 'text' }, { key: 'desc', label: 'Description', type: 'text' },
            { key: 'link', label: 'File URL Link', type: 'text' }
        ]
    },
    userGrowth: {
        title: 'User Growth',
        empty: { month: '', week: '', newRegist: 0, activeGeoUsers: 0, conversion: 0 },
        cols: [{ key: 'month', label: 'Month' }, { key: 'week', label: 'Week' }, { key: 'newRegist', label: 'New Regist' }, { key: 'conversion', label: 'Conv %' }],
        fields: [
            { key: 'month', label: 'Month', type: 'text' }, { key: 'week', label: 'Week', type: 'text' },
            { key: 'newRegist', label: 'New Registrations', type: 'number' }, { key: 'activeGeoUsers', label: 'Paid/Active Users', type: 'number' },
            { key: 'conversion', label: 'Conversion Rate (%)', type: 'number', disabled: true }
        ]
    },
    academy: {
        title: 'Academy',
        empty: { program: '', batch: '', registrants: 0, converted: 0, conversion: 0 },
        cols: [{ key: 'program', label: 'Program' }, { key: 'batch', label: 'Batch' }, { key: 'registrants', label: 'Registrants' }, { key: 'conversion', label: 'Conv %' }],
        fields: [
            { key: 'program', label: 'Program Name', type: 'text' }, { key: 'batch', label: 'Batch Label', type: 'text' },
            { key: 'registrants', label: 'Registrants', type: 'number' }, { key: 'converted', label: 'Converted to Paid', type: 'number' },
            { key: 'conversion', label: 'Conversion (%)', type: 'number', disabled: true }
        ]
    },
    trends: {
        title: 'Historical Trends',
        empty: { category: 'Month', label: '', revenue: 0, dealSize: 0 },
        cols: [{ key: 'category', label: 'View Type' }, { key: 'label', label: 'Label/Time' }, { key: 'revenue', label: 'Revenue (M)' }, { key: 'dealSize', label: 'Avg Deal (M)' }],
        fields: [
            { key: 'category', label: 'Timeframe Category', type: 'select', options: ['Month', 'Quarter', 'Year'] },
            { key: 'label', label: 'Label (e.g. Q1 2026)', type: 'text' },
            { key: 'revenue', label: 'Revenue (in Millions)', type: 'number' }, { key: 'dealSize', label: 'Avg Deal Size (in Millions)', type: 'number' }
        ]
    }
};

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [config, setLocalConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
    const [activeSection, setActiveSection] = useState('home');

    // BI Tab State
    const [biSubTab, setBiSubTab] = useState('socials');
    const [biSearch, setBiSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [modal, setModal] = useState<{ isOpen: boolean; section: string; index: number; data: any }>({
        isOpen: false, section: '', index: -1, data: null
    });

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [editingRaci, setEditingRaci] = useState<{ row: number; col: string } | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [biLoadMsg, setBiLoadMsg] = useState('');
    const [configFetchDone, setConfigFetchDone] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('bi_admin_auth') === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    // Load from GAS on auth
    useEffect(() => {
        if (isAuthorized) {
            setLoadingConfig(true);
            setConfigFetchDone(false);
            loadConfigFromGAS().then(cfg => {
                setLocalConfig(cfg);
                setConfigFetchDone(true);
            }).catch(() => {
                setConfigFetchDone(true);
            });
        }
    }, [isAuthorized]);

    // Reset pagination when subtab changes
    useEffect(() => {
        setCurrentPage(1);
        setBiSearch('');
    }, [biSubTab]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'MAPIDBOSS2026') {
            setIsAuthorized(true);
            sessionStorage.setItem('bi_admin_auth', 'true');
        } else {
            alert('Admin access denied!');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        setConfig(config);
        const result = await saveConfigToGAS(config);
        setSaving(false);
        setSaved(true);
        setSaveMsg(result.message);
        setTimeout(() => { setSaved(false); setSaveMsg(''); }, 3000);
    };

    const handleReset = () => {
        if (confirm('Reset semua settings ke default? Perubahan yang sudah disimpan akan hilang.')) {
            resetConfig();
            setLocalConfig(DEFAULT_CONFIG);
        }
    };

    // --- Config Updaters ---
    const updateConfig = (path: string, value: any) => {
        setLocalConfig(prev => {
            const newConfig = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj = newConfig;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = value;
            return newConfig;
        });
    };

    const updateRoleField = (roleKey: string, field: string, value: any) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.roles[roleKey][field] = value;
            return n;
        });
    };

    const updateRoleArrayItem = (roleKey: string, field: string, index: number, value: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.roles[roleKey][field][index] = value;
            return n;
        });
    };

    const addRoleArrayItem = (roleKey: string, field: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.roles[roleKey][field].push('');
            return n;
        });
    };

    const removeRoleArrayItem = (roleKey: string, field: string, index: number) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.roles[roleKey][field].splice(index, 1);
            return n;
        });
    };

    // --- RACI Updaters ---
    const updateRaciCell = (rowIdx: number, colKey: string, value: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.raci.rows[rowIdx].values[colKey] = value;
            return n;
        });
        setEditingRaci(null);
    };

    const addRaciRow = () => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            const emptyValues: Record<string, string> = {};
            n.raci.columns.forEach((c: any) => { emptyValues[c.key] = 'I'; });
            n.raci.rows.push({ activity: 'New Activity', values: emptyValues });
            return n;
        });
    };

    const removeRaciRow = (idx: number) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.raci.rows.splice(idx, 1);
            return n;
        });
    };

    const updateRaciActivity = (idx: number, value: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.raci.rows[idx].activity = value;
            return n;
        });
    };

    const updateRaciColumnLabel = (idx: number, value: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            n.raci.columns[idx].label = value;
            return n;
        });
    };

    // --- MODAL BI DATA HANDLERS ---
    const openModal = (section: string, index: number = -1) => {
        const sourceData = config.biData?.[section as keyof BIData] as any[];
        const initialData = index >= 0 && sourceData ? { ...sourceData[index] } : { ...BI_CONFIG[section].empty };
        setModal({ isOpen: true, section, index, data: initialData });
    };

    const closeModal = () => {
        setModal({ isOpen: false, section: '', index: -1, data: null });
    };

    const handleModalFieldChange = (fieldKey: string, value: any) => {
        setModal(prev => {
            if (!prev.data) return prev;
            const newData = { ...prev.data, [fieldKey]: value };

            // Auto Calculations on the fly
            const sec = prev.section;
            if (sec === 'userGrowth') {
                const nR = Number(newData.newRegist) || 0;
                const aU = Number(newData.activeGeoUsers) || 0;
                newData.conversion = nR > 0 ? Number(((aU / nR) * 100).toFixed(2)) : 0;
            } else if (sec === 'campaigns') {
                const ld = Number(newData.leads) || 0;
                const pa = Number(newData.participants) || 0;
                newData.conversion = ld > 0 ? Number(((pa / ld) * 100).toFixed(2)) : 0;
            } else if (sec === 'revenue') {
                const tg = Number(newData.target) || 0;
                const ac = Number(newData.actual) || 0;
                newData.achievement = tg > 0 ? Number(((ac / tg) * 100).toFixed(2)) : 0;
            } else if (sec === 'academy') {
                const rg = Number(newData.registrants) || 0;
                const cv = Number(newData.converted) || 0;
                newData.conversion = rg > 0 ? Number(((cv / rg) * 100).toFixed(2)) : 0;
            }

            return { ...prev, data: newData };
        });
    };

    const saveModalData = () => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (!n.biData) n.biData = {};
            if (!Array.isArray(n.biData[modal.section])) n.biData[modal.section] = [];

            if (modal.index >= 0) {
                n.biData[modal.section][modal.index] = modal.data;
            } else {
                n.biData[modal.section].push(modal.data);
            }
            return n;
        });
        closeModal();
    };

    const deleteBiItem = (section: string, index: number) => {
        if (confirm('Hapus data ini?')) {
            setLocalConfig(prev => {
                const n = JSON.parse(JSON.stringify(prev));
                if (n.biData && Array.isArray(n.biData[section])) {
                    n.biData[section].splice(index, 1);
                }
                return n;
            });
        }
    };

    // --- AUTH SCREEN ---
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 font-sans p-6">
                <form onSubmit={handleLogin} className="bg-white p-10 border border-zinc-200 shadow-2xl w-full max-w-sm text-center rounded-2xl">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Admin Panel</h2>
                    <p className="text-zinc-400 text-xs mb-8 uppercase tracking-widest font-bold">Authorized Personnel Only</p>
                    <input
                        type="password"
                        placeholder="Admin Passkey"
                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-zinc-200">
                        Unlock Admin
                    </button>
                </form>
            </div>
        );
    }

    if (loadingConfig) {
        return (
            <LoadingProgress
                isLoading={true}
                fetchDone={configFetchDone}
                title="Loading Configuration"
                stages={[
                    { target: 25, label: 'Connecting to Google Sheets...' },
                    { target: 50, label: 'Fetching admin config...' },
                    { target: 75, label: 'Syncing settings...' },
                    { target: 90, label: 'Preparing editor...' },
                ]}
                onComplete={() => setLoadingConfig(false)}
            />
        );
    }

    const sections = [
        { id: 'home', label: 'Home Page', icon: Home },
        { id: 'roles', label: 'Team Roles', icon: Users },
        { id: 'raci', label: 'RACI Matrix', icon: Table2 },
        { id: 'bi', label: 'BI Settings', icon: BarChart3 },
        { id: 'bidata', label: 'BI Data Edit', icon: Database },
    ];

    // Helper rendering Data Table list
    const getFilteredAndPaginatedData = () => {
        const sourceData = (config.biData?.[biSubTab as keyof BIData] as any[]) || [];
        const filtered = sourceData.map((item, originalIdx) => ({ item, originalIdx })).filter(({ item }) =>
            !biSearch || Object.values(item).some(v => String(v).toLowerCase().includes(biSearch.toLowerCase()))
        );
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        const currentData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        return { currentData, totalPages, totalItems: filtered.length };
    };

    const { currentData, totalPages, totalItems } = activeSection === 'bidata' ? getFilteredAndPaginatedData() : { currentData: [], totalPages: 1, totalItems: 0 };
    const biConf = BI_CONFIG[biSubTab];

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24">
            {/* ADMIN HEADER */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                            <Settings className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">Admin Panel</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveMsg && <span className={`text-xs font-bold ${saved ? 'text-emerald-600' : 'text-amber-600'}`}>{saveMsg}</span>}
                        <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition hidden md:flex">
                            <RotateCcw size={14} /> Reset
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition shadow-lg ${saving ? 'bg-zinc-400 text-white cursor-wait' : saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'}`}>
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving</> : saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* SECTION NAV */}
                <aside className="w-56 shrink-0 hidden lg:block">
                    <nav className="sticky top-28 space-y-1">
                        {sections.map(sec => (
                            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === sec.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}>
                                <sec.icon size={16} />{sec.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <div className="flex-1 space-y-8 min-w-0">

                    {/* ============ HOME PAGE ============ */}
                    {activeSection === 'home' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight">Home Page Settings</h2>
                                <p className="text-sm text-zinc-400 font-medium mt-1">Manage hero section and strategy content</p>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Hero Section</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Hero Title" value={config.heroTitle} onChange={(v: string) => updateConfig('heroTitle', v)} />
                                    <InputField label="Hero Subtitle" value={config.heroSubtitle} onChange={(v: string) => updateConfig('heroSubtitle', v)} />
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Strategy Content</h3>
                                <div className="space-y-4">
                                    <InputField label="Objective Title" value={config.objectiveTitle} onChange={(v: string) => updateConfig('objectiveTitle', v)} />
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Objective Description</label>
                                        <textarea value={config.objectiveText} onChange={(e) => updateConfig('objectiveText', e.target.value)} rows={3}
                                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium transition resize-none" />
                                    </div>
                                    <InputField label="Vibe Title" value={config.vibeTitle} onChange={(v: string) => updateConfig('vibeTitle', v)} />
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Vibe Description</label>
                                        <textarea value={config.vibeText} onChange={(e) => updateConfig('vibeText', e.target.value)} rows={3}
                                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium transition resize-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ TEAM ROLES ============ */}
                    {activeSection === 'roles' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight">Team Roles</h2>
                                <p className="text-sm text-zinc-400 font-medium mt-1">Edit role details shown in the org chart modal</p>
                            </div>

                            {Object.entries(config.roles).map(([key, role]) => (
                                <div key={key} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-all">
                                    <button onClick={() => setExpandedRole(expandedRole === key ? null : key)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white text-xs font-black uppercase">{key.substring(0, 2)}</div>
                                            <div className="text-left">
                                                <h4 className="font-black text-zinc-900">{role.title}</h4>
                                                <p className="text-xs text-zinc-400 font-medium italic">{role.focus}</p>
                                            </div>
                                        </div>
                                        {expandedRole === key ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>

                                    {expandedRole === key && (
                                        <div className="border-t border-zinc-100 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Title" value={role.title} onChange={(v: string) => updateRoleField(key, 'title', v)} />
                                                <InputField label="Focus" value={role.focus} onChange={(v: string) => updateRoleField(key, 'focus', v)} />
                                            </div>

                                            {(['responsibilities', 'dos', 'donts'] as const).map(field => (
                                                <div key={field}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className={`text-xs font-bold uppercase tracking-wider ${field === 'dos' ? 'text-emerald-600' : field === 'donts' ? 'text-rose-600' : 'text-zinc-500'}`}>
                                                            {field === 'responsibilities' ? 'Responsibilities' : field === 'dos' ? "Do's" : "Don'ts"}
                                                        </label>
                                                        <button onClick={() => addRoleArrayItem(key, field)} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider transition">
                                                            <Plus size={12} /> Add
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(role as any)[field].map((item: string, idx: number) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <input type="text" value={item} onChange={(e) => updateRoleArrayItem(key, field, idx, e.target.value)}
                                                                    className={`flex-1 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 font-medium transition ${field === 'dos' ? 'bg-emerald-50/50 border-emerald-100 focus:ring-emerald-500' :
                                                                        field === 'donts' ? 'bg-rose-50/50 border-rose-100 focus:ring-rose-500' :
                                                                            'bg-zinc-50 border-zinc-200 focus:ring-zinc-900'
                                                                        }`} />
                                                                <button onClick={() => removeRoleArrayItem(key, field, idx)} className="p-2.5 text-zinc-300 hover:text-rose-500 transition"><Trash2 size={14} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ============ RACI MATRIX ============ */}
                    {activeSection === 'raci' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">RACI Matrix</h2>
                                    <p className="text-sm text-zinc-400 font-medium mt-1">Click any cell to change its RACI value</p>
                                </div>
                                <button onClick={addRaciRow} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold w-fit uppercase tracking-wider bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition shadow-lg shadow-zinc-200">
                                    <Plus size={14} /> Add Activity
                                </button>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-zinc-900 text-[10px] uppercase tracking-[0.15em] text-white">
                                            <tr>
                                                <th className="px-4 py-4 font-black w-56">Activity</th>
                                                {config.raci.columns.map((col, cidx) => (
                                                    <th key={col.key} className="px-2 py-4 text-center font-bold min-w-[90px]">
                                                        <input
                                                            type="text" value={col.label}
                                                            onChange={(e) => updateRaciColumnLabel(cidx, e.target.value)}
                                                            className="bg-transparent text-white text-center w-full text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:bg-zinc-800 rounded px-1 py-0.5"
                                                        />
                                                    </th>
                                                ))}
                                                <th className="px-2 py-4 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {config.raci.rows.map((row, ridx) => (
                                                <tr key={ridx} className="hover:bg-zinc-50 transition">
                                                    <td className="px-4 py-3">
                                                        <input type="text" value={row.activity}
                                                            onChange={(e) => updateRaciActivity(ridx, e.target.value)}
                                                            className="font-bold text-zinc-900 bg-transparent focus:outline-none focus:bg-zinc-50 rounded px-2 py-1 w-full border border-transparent focus:border-zinc-200"
                                                        />
                                                    </td>
                                                    {config.raci.columns.map(col => {
                                                        const val = row.values[col.key] || 'I';
                                                        const isEditing = editingRaci?.row === ridx && editingRaci?.col === col.key;
                                                        return (
                                                            <td key={col.key} className="px-2 py-3 text-center relative">
                                                                {isEditing ? (
                                                                    <div className="absolute z-20 top-1 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 rounded-xl shadow-2xl p-2 flex gap-1">
                                                                        {RACI_OPTIONS.map(opt => (
                                                                            <button key={opt} onClick={() => updateRaciCell(ridx, col.key, opt)}
                                                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition hover:scale-105 ${RACI_COLORS[opt]}`}>
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                        <button onClick={() => setEditingRaci(null)} className="px-1.5 text-zinc-400 hover:text-zinc-600"><X size={12} /></button>
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => setEditingRaci({ row: ridx, col: col.key })}
                                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition hover:scale-110 cursor-pointer ${RACI_COLORS[val] || RACI_COLORS['I']}`}>
                                                                        {val}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-2 py-3 text-center">
                                                        <button onClick={() => removeRaciRow(ridx)} className="text-zinc-300 hover:text-rose-500 transition"><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-zinc-50 text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex gap-6 justify-center border-t border-zinc-100">
                                    {RACI_OPTIONS.map(opt => (
                                        <span key={opt} className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded text-center leading-5 text-[9px] font-black border ${RACI_COLORS[opt]}`}>{opt}</span>
                                            {opt === 'R' ? 'Responsible' : opt === 'A' ? 'Accountable' : opt === 'C' ? 'Consulted' : opt === 'I' ? 'Informed' : 'Resp & Acc'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ BI SETTINGS ============ */}
                    {activeSection === 'bi' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight">BI Dashboard Settings</h2>
                                <p className="text-sm text-zinc-400 font-medium mt-1">Control access and visibility</p>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Access Control</h3>
                                <InputField label="BI Dashboard Password" value={config.biPassword} onChange={(v: string) => updateConfig('biPassword', v)} mono />
                                <p className="text-[10px] text-zinc-400 font-medium">Password yang digunakan user untuk masuk ke BI Dashboard</p>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Tab Visibility</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(config.tabsVisible).map(([tab, visible]) => (
                                        <button key={tab} onClick={() => updateConfig(`tabsVisible.${tab}`, !visible)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${visible ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300'
                                                }`}>
                                            <div className="flex items-center justify-center gap-2 mb-2">{visible ? <Eye size={16} /> : <EyeOff size={16} />}</div>
                                            <span className="text-xs font-black uppercase tracking-widest">{tab}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ REVAMPED BI DATA EDITOR ============ */}
                    {activeSection === 'bidata' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">BI Data Management</h2>
                                    <p className="text-sm text-zinc-400 font-medium mt-1">Sistem List & Modal untuk input yang lebih responsif</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={async () => { /* Load dari Spreadsheet logic */ }} className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg"><Globe size={14} className="inline mr-1" /> Fetch Data</button>
                                </div>
                            </div>

                            {config.biData && (
                                <>
                                    {/* Sub-tabs Navigation */}
                                    <div className="border-b border-zinc-200 flex gap-6 overflow-x-auto pb-1 hide-scrollbar">
                                        {Object.keys(BI_CONFIG).map(key => (
                                            <button key={key} onClick={() => setBiSubTab(key)}
                                                className={`pb-3 text-xs font-bold tracking-widest uppercase transition whitespace-nowrap ${biSubTab === key ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                                {BI_CONFIG[key].title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Header & Search */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-xl border border-zinc-200">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input type="text" placeholder={`Search ${biConf.title}...`} value={biSearch} onChange={(e) => setBiSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none" />
                                        </div>
                                        <button onClick={() => openModal(biSubTab)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition shadow-md shadow-zinc-200">
                                            <Plus size={14} /> Add Data
                                        </button>
                                    </div>

                                    {/* Table View */}
                                    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left whitespace-nowrap">
                                                <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
                                                    <tr>
                                                        <th className="px-6 py-4 font-black w-10">No</th>
                                                        {biConf.cols.map((col: any) => <th key={col.key} className="px-4 py-4 font-black">{col.label}</th>)}
                                                        <th className="px-6 py-4 font-black text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                    {currentData.length > 0 ? currentData.map(({ item, originalIdx }, idx) => (
                                                        <tr key={originalIdx} className="hover:bg-zinc-50 transition">
                                                            <td className="px-6 py-4 text-xs font-bold text-zinc-400">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                                            {biConf.cols.map((col: any) => (
                                                                <td key={col.key} className="px-4 py-4 font-medium text-zinc-700 truncate max-w-[200px]">
                                                                    {String(item[col.key] ?? '-')}
                                                                </td>
                                                            ))}
                                                            <td className="px-6 py-4 text-right space-x-2">
                                                                <button onClick={() => openModal(biSubTab, originalIdx)} className="p-2 text-zinc-400 hover:text-blue-600 bg-white border border-zinc-200 rounded-lg hover:border-blue-200 transition">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteBiItem(biSubTab, originalIdx)} className="p-2 text-zinc-400 hover:text-rose-600 bg-white border border-zinc-200 rounded-lg hover:border-rose-200 transition">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan={biConf.cols.length + 2} className="px-6 py-8 text-center text-zinc-400 italic text-xs">No data found. Click "Add Data" to create one.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50">
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total: {totalItems}</span>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30">
                                                        <ChevronLeft size={18} />
                                                    </button>
                                                    <span className="text-xs font-bold">Page {currentPage} of {totalPages}</span>
                                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ============ MODAL POPUP ============ */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{modal.index >= 0 ? 'Edit' : 'Add'} {BI_CONFIG[modal.section].title}</h3>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-1">Fill in the details below</p>
                            </div>
                            <button onClick={closeModal} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500"><X size={18} /></button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="p-8 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {BI_CONFIG[modal.section].fields.map((field: any) => (
                                    <div key={field.key} className={field.type === 'text' && field.key === 'desc' ? 'sm:col-span-2' : ''}>
                                        {field.type === 'select' ? (
                                            <SelectField label={field.label} value={modal.data[field.key]} options={field.options} onChange={(v: any) => handleModalFieldChange(field.key, v)} />
                                        ) : (
                                            <InputField
                                                label={field.label}
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                value={modal.data[field.key]}
                                                onChange={(v: any) => handleModalFieldChange(field.key, v)}
                                                disabled={field.disabled}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end gap-3">
                            <button onClick={closeModal} className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition">Cancel</button>
                            <button onClick={saveModalData} className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition">Save Data</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}