'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Settings, Save, RotateCcw, Lock, Eye, EyeOff,
    ChevronDown, ChevronRight, Check, X, Plus, Trash2,
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

export default function AdminPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [config, setLocalConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
    const [activeSection, setActiveSection] = useState('home');
    const [biSubTab, setBiSubTab] = useState('socials');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [editingRaci, setEditingRaci] = useState<{ row: number; col: string } | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [biLoadMsg, setBiLoadMsg] = useState('');
    const [configFetchDone, setConfigFetchDone] = useState(false);
    const biFetchDone = useRef(false);

    useEffect(() => {
        setLocalConfig(getConfig());
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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'MAPIDBOSS2026') {
            setIsAuthorized(true);
        } else {
            alert('Admin access denied!');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        // Save to localStorage first
        setConfig(config);
        // Then try GAS
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

    // --- Generic config updaters ---
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

    // --- RACI updaters ---
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

    // --- BI Data updaters ---
    const ensureBiData = (): BIData => {
        if (config.biData) return config.biData;
        return {
            socials: [], campaigns: [], revenue: [], pipeline: [],
            projects: [], docs: [],
            trends: { month: [], quarter: [], year: [] }
        };
    };

    const updateBiField = (section: string, index: number, field: string, value: any) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (!n.biData) {
                n.biData = { socials: [], campaigns: [], revenue: [], pipeline: [], projects: [], docs: [], trends: { month: [], quarter: [], year: [] } };
            }
            (n.biData as any)[section][index][field] = value;
            return n;
        });
    };

    const addBiRow = (section: string, template: any) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (!n.biData) {
                n.biData = { socials: [], campaigns: [], revenue: [], pipeline: [], projects: [], docs: [], trends: { month: [], quarter: [], year: [] } };
            }
            (n.biData as any)[section].push(template);
            return n;
        });
    };

    const removeBiRow = (section: string, index: number) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (n.biData) (n.biData as any)[section].splice(index, 1);
            return n;
        });
    };

    const updateTrendField = (view: string, index: number, field: string, value: any) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (!n.biData) {
                n.biData = { socials: [], campaigns: [], revenue: [], pipeline: [], projects: [], docs: [], trends: { month: [], quarter: [], year: [] } };
            }
            (n.biData.trends as any)[view][index][field] = value;
            return n;
        });
    };

    const addTrendPoint = (view: string) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (!n.biData) {
                n.biData = { socials: [], campaigns: [], revenue: [], pipeline: [], projects: [], docs: [], trends: { month: [], quarter: [], year: [] } };
            }
            (n.biData.trends as any)[view].push({ label: '', revenue: 0, dealSize: 0 });
            return n;
        });
    };

    const removeTrendPoint = (view: string, index: number) => {
        setLocalConfig(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            if (n.biData) (n.biData.trends as any)[view].splice(index, 1);
            return n;
        });
    };

    // Helper components
    const InputField = ({ label, value, onChange, type = 'text', placeholder = '', mono = false }: any) => (
        <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className={`w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 ${mono ? 'font-mono' : 'font-bold'} transition`}
            />
        </div>
    );

    const SelectField = ({ label, value, onChange, options }: any) => (
        <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-bold transition"
            >
                {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
            </select>
        </div>
    );

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
        { id: 'bidata', label: 'BI Data', icon: Database },
        { id: 'branding', label: 'Branding', icon: Palette },
    ];

    const biData = ensureBiData();

    return (
        <main className="min-h-screen bg-zinc-50 font-sans">
            {/* ADMIN HEADER */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                            <Settings className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">Admin Panel</h1>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Configuration Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveMsg && (
                            <span className={`text-xs font-bold ${saved ? 'text-emerald-600' : 'text-amber-600'}`}>{saveMsg}</span>
                        )}
                        <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition">
                            <RotateCcw size={14} /> Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition shadow-lg ${saving ? 'bg-zinc-400 text-white cursor-wait' :
                                saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'
                                }`}
                        >
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> :
                                saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save to GAS</>}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 flex gap-8">
                {/* SECTION NAV */}
                <aside className="w-56 shrink-0 hidden md:block">
                    <nav className="sticky top-28 space-y-1">
                        {sections.map(sec => (
                            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === sec.id ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                                    }`}>
                                <sec.icon size={16} />{sec.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MOBILE NAV */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-30 flex overflow-x-auto">
                    {sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-bold uppercase tracking-wider transition min-w-[60px] ${activeSection === sec.id ? 'text-zinc-900' : 'text-zinc-400'
                                }`}>
                            <sec.icon size={14} />{sec.label.split(' ')[0]}
                        </button>
                    ))}
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 space-y-8 pb-24 md:pb-8">

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
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">RACI Matrix</h2>
                                    <p className="text-sm text-zinc-400 font-medium mt-1">Click any cell to change its RACI value</p>
                                </div>
                                <button onClick={addRaciRow} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition shadow-lg shadow-zinc-200">
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

                    {/* ============ BI DATA ============ */}
                    {activeSection === 'bidata' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">BI Data Management</h2>
                                    <p className="text-sm text-zinc-400 font-medium mt-1">Edit all dashboard data directly — no spreadsheet needed</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        setLoadingBiData(true);
                                        setBiLoadMsg('');
                                        try {
                                            const res = await fetch('/api/gas');
                                            const json = await res.json();
                                            if (json.isError || json.error) {
                                                setBiLoadMsg('Gagal fetch: ' + (json.message || json.title));
                                            } else {
                                                const biData: BIData = {
                                                    socials: json.socials || [],
                                                    campaigns: json.campaigns || [],
                                                    revenue: json.revenue || [],
                                                    pipeline: json.pipeline || [],
                                                    projects: json.projects || [],
                                                    docs: json.docs || [],
                                                    trends: json.trends || { month: [], quarter: [], year: [] },
                                                };
                                                updateConfig('biData', biData);
                                                setBiLoadMsg('✓ Data loaded!');
                                                setTimeout(() => setBiLoadMsg(''), 2000);
                                            }
                                        } catch (err: any) {
                                            setBiLoadMsg('Error: ' + err.message);
                                        }
                                        setLoadingBiData(false);
                                    }}
                                    disabled={loadingBiData}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition shrink-0 ${loadingBiData ? 'bg-zinc-300 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                                        }`}>
                                    {loadingBiData ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : <><Globe size={14} /> Load dari Spreadsheet</>}
                                </button>
                            </div>
                            {biLoadMsg && (
                                <p className={`text-xs font-bold mb-2 ${biLoadMsg.startsWith('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>{biLoadMsg}</p>
                            )}

                            {!config.biData && (
                                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Database className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight mb-2">Load Data dari Spreadsheet</h3>
                                    <p className="text-sm text-zinc-400 font-medium mb-6 max-w-md mx-auto">Ambil data yang sudah ada di Google Sheets, lalu edit langsung dari sini. Tidak perlu buka spreadsheet lagi.</p>
                                    {biLoadMsg && (
                                        <p className="text-xs font-bold text-amber-600 mb-4">{biLoadMsg}</p>
                                    )}
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={async () => {
                                                setLoadingBiData(true);
                                                setBiLoadMsg('');
                                                try {
                                                    const res = await fetch('/api/gas');
                                                    const json = await res.json();
                                                    if (json.isError || json.error) {
                                                        setBiLoadMsg('Gagal fetch dari GAS: ' + (json.message || json.title));
                                                    } else {
                                                        // Extract BI data from GAS response
                                                        const biData: BIData = {
                                                            socials: json.socials || [],
                                                            campaigns: json.campaigns || [],
                                                            revenue: json.revenue || [],
                                                            pipeline: json.pipeline || [],
                                                            projects: json.projects || [],
                                                            docs: json.docs || [],
                                                            trends: json.trends || { month: [], quarter: [], year: [] },
                                                        };
                                                        updateConfig('biData', biData);
                                                        setBiLoadMsg('');
                                                    }
                                                } catch (err: any) {
                                                    setBiLoadMsg('Network error: ' + err.message);
                                                }
                                                setLoadingBiData(false);
                                            }}
                                            disabled={loadingBiData}
                                            className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg ${loadingBiData ? 'bg-zinc-400 text-white cursor-wait' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'
                                                }`}>
                                            {loadingBiData ? <><Loader2 size={14} className="animate-spin" /> Loading dari Spreadsheet...</> : <><Globe size={14} /> Load dari Spreadsheet</>}
                                        </button>
                                        <button
                                            onClick={() => updateConfig('biData', {
                                                socials: [], campaigns: [], revenue: [], pipeline: [], projects: [], docs: [],
                                                trends: { month: [], quarter: [], year: [] }
                                            })}
                                            className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition">
                                            <Plus size={14} /> Mulai Kosong
                                        </button>
                                    </div>
                                </div>
                            )}

                            {config.biData && (
                                <>
                                    {/* Sub-tabs */}
                                    <div className="border-b border-zinc-200 flex gap-4 overflow-x-auto">
                                        {[
                                            { id: 'socials', label: 'Socials', icon: Globe },
                                            { id: 'campaigns', label: 'Campaigns', icon: TrendingUp },
                                            { id: 'revenue', label: 'Revenue', icon: BarChart3 },
                                            { id: 'pipeline', label: 'Pipeline', icon: Database },
                                            { id: 'projects', label: 'Projects', icon: Settings },
                                            { id: 'docs', label: 'Gallery', icon: Home },
                                            { id: 'trends', label: 'Trends', icon: TrendingUp },
                                        ].map(t => (
                                            <button key={t.id} onClick={() => setBiSubTab(t.id)}
                                                className={`pb-3 text-xs font-bold tracking-widest uppercase flex items-center gap-2 whitespace-nowrap transition ${biSubTab === t.id ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                                                    }`}>
                                                <t.icon size={14} /> {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Socials */}
                                    {biSubTab === 'socials' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Social Media Data</h3>
                                                <button onClick={() => addBiRow('socials', { platform: '', value: 0, trend: 'up', growth: '0%' })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.socials.map((s, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                    <InputField label="Platform" value={s.platform} onChange={(v: string) => updateBiField('socials', idx, 'platform', v)} />
                                                    <InputField label="Value" value={s.value} type="number" onChange={(v: number) => updateBiField('socials', idx, 'value', v)} />
                                                    <SelectField label="Trend" value={s.trend} onChange={(v: string) => updateBiField('socials', idx, 'trend', v)} options={['up', 'down']} />
                                                    <InputField label="Growth" value={s.growth} onChange={(v: string) => updateBiField('socials', idx, 'growth', v)} />
                                                    <button onClick={() => removeBiRow('socials', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Campaigns */}
                                    {biSubTab === 'campaigns' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Campaign Data</h3>
                                                <button onClick={() => addBiRow('campaigns', { name: '', status: 'Active', leads: 0, conversion: 0 })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.campaigns.map((c, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                    <InputField label="Name" value={c.name} onChange={(v: string) => updateBiField('campaigns', idx, 'name', v)} />
                                                    <SelectField label="Status" value={c.status} onChange={(v: string) => updateBiField('campaigns', idx, 'status', v)} options={['Active', 'Ended', 'Planned']} />
                                                    <InputField label="Leads" value={c.leads} type="number" onChange={(v: number) => updateBiField('campaigns', idx, 'leads', v)} />
                                                    <InputField label="Conversion %" value={c.conversion} type="number" onChange={(v: number) => updateBiField('campaigns', idx, 'conversion', v)} />
                                                    <button onClick={() => removeBiRow('campaigns', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Revenue */}
                                    {biSubTab === 'revenue' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Revenue Data</h3>
                                                <button onClick={() => addBiRow('revenue', { subProduct: '', actual: 0, target: 0, achievement: 0 })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.revenue.map((r, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                    <InputField label="Product" value={r.subProduct} onChange={(v: string) => updateBiField('revenue', idx, 'subProduct', v)} />
                                                    <InputField label="Actual (Rp)" value={r.actual} type="number" onChange={(v: number) => updateBiField('revenue', idx, 'actual', v)} />
                                                    <InputField label="Target (Rp)" value={r.target} type="number" onChange={(v: number) => updateBiField('revenue', idx, 'target', v)} />
                                                    <InputField label="Achievement %" value={r.achievement} type="number" onChange={(v: number) => updateBiField('revenue', idx, 'achievement', v)} />
                                                    <button onClick={() => removeBiRow('revenue', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pipeline */}
                                    {biSubTab === 'pipeline' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Pipeline Data</h3>
                                                <button onClick={() => addBiRow('pipeline', { client: '', stage: 'Prospect', value: 0, action: '', eta: '' })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.pipeline.map((p, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                                                    <InputField label="Client" value={p.client} onChange={(v: string) => updateBiField('pipeline', idx, 'client', v)} />
                                                    <SelectField label="Stage" value={p.stage} onChange={(v: string) => updateBiField('pipeline', idx, 'stage', v)} options={['Prospect', 'Proposal', 'Negotiation', 'Won', 'Lost']} />
                                                    <InputField label="Value (Rp)" value={p.value} type="number" onChange={(v: number) => updateBiField('pipeline', idx, 'value', v)} />
                                                    <InputField label="Action" value={p.action} onChange={(v: string) => updateBiField('pipeline', idx, 'action', v)} />
                                                    <InputField label="ETA" value={p.eta} onChange={(v: string) => updateBiField('pipeline', idx, 'eta', v)} placeholder="YYYY-MM-DD" />
                                                    <button onClick={() => removeBiRow('pipeline', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Projects */}
                                    {biSubTab === 'projects' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Project Data</h3>
                                                <button onClick={() => addBiRow('projects', { name: '', phase: '', progress: 0 })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.projects.map((p, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                                                    <InputField label="Project Name" value={p.name} onChange={(v: string) => updateBiField('projects', idx, 'name', v)} />
                                                    <InputField label="Phase" value={p.phase} onChange={(v: string) => updateBiField('projects', idx, 'phase', v)} />
                                                    <InputField label="Progress %" value={p.progress} type="number" onChange={(v: number) => updateBiField('projects', idx, 'progress', v)} />
                                                    <button onClick={() => removeBiRow('projects', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Docs / Gallery */}
                                    {biSubTab === 'docs' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Gallery / Docs Data</h3>
                                                <button onClick={() => addBiRow('docs', { title: '', desc: '', link: '', format: 'Doc', category: '' })}
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add</button>
                                            </div>
                                            {config.biData.docs.map((d, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <InputField label="Title" value={d.title} onChange={(v: string) => updateBiField('docs', idx, 'title', v)} />
                                                        <SelectField label="Format" value={d.format} onChange={(v: string) => updateBiField('docs', idx, 'format', v)} options={['Doc', 'Sheet', 'Folder']} />
                                                        <InputField label="Category" value={d.category} onChange={(v: string) => updateBiField('docs', idx, 'category', v)} />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                                        <InputField label="Description" value={d.desc} onChange={(v: string) => updateBiField('docs', idx, 'desc', v)} />
                                                        <div className="flex gap-2 items-end">
                                                            <div className="flex-1"><InputField label="Link URL" value={d.link} onChange={(v: string) => updateBiField('docs', idx, 'link', v)} placeholder="https://..." /></div>
                                                            <button onClick={() => removeBiRow('docs', idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Trends */}
                                    {biSubTab === 'trends' && (
                                        <div className="space-y-8">
                                            {(['month', 'quarter', 'year'] as const).map(view => (
                                                <div key={view} className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{view} Trend Data</h3>
                                                        <button onClick={() => addTrendPoint(view)}
                                                            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"><Plus size={14} /> Add Point</button>
                                                    </div>
                                                    {(config.biData!.trends as any)[view].map((t: TrendPoint, idx: number) => (
                                                        <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                                                            <InputField label="Label" value={t.label} onChange={(v: string) => updateTrendField(view, idx, 'label', v)} placeholder={view === 'year' ? '2025' : '2025-01-01'} />
                                                            <InputField label="Revenue (M)" value={t.revenue} type="number" onChange={(v: number) => updateTrendField(view, idx, 'revenue', v)} />
                                                            <InputField label="Deal Size (M)" value={t.dealSize} type="number" onChange={(v: number) => updateTrendField(view, idx, 'dealSize', v)} />
                                                            <button onClick={() => removeTrendPoint(view, idx)} className="p-3 text-zinc-300 hover:text-rose-500 transition self-end"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                    {(config.biData!.trends as any)[view].length === 0 && (
                                                        <p className="text-xs text-zinc-400 italic p-4 bg-zinc-50 rounded-xl">No data points yet. Click "Add Point" to start.</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ============ BRANDING ============ */}
                    {activeSection === 'branding' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight">Branding</h2>
                                <p className="text-sm text-zinc-400 font-medium mt-1">Global branding and identity settings</p>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Identity</h3>
                                <div className="space-y-4">
                                    <InputField label="Sidebar Title" value={config.sidebarTitle} onChange={(v: string) => updateConfig('sidebarTitle', v)} />
                                    <p className="text-[10px] text-zinc-400 font-medium -mt-2">Teks yang muncul di atas sidebar navigasi</p>
                                    <InputField label="Site Title" value={config.siteTitle} onChange={(v: string) => updateConfig('siteTitle', v)} />
                                    <p className="text-[10px] text-zinc-400 font-medium -mt-2">Judul tab browser (metadata)</p>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Live Preview</h3>
                                <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><Settings size={14} className="text-white" /></div>
                                    <span className="font-black text-lg tracking-tight">{config.sidebarTitle}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
