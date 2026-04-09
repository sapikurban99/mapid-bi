'use client';
import { useEffect, useState } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, SiteConfig, setConfig } from '../lib/config';
import { Globe, Loader2, LayoutDashboard, Plus, X, Briefcase, Users, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function B2BBoardPage() {
    const { syncData, isLoading: globalIsLoading } = useGlobalData();
    const [config, setLocalConfig] = useState<SiteConfig | null>(null);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'leads' | 'partners' | 'stats'>('projects');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [showArchived, setShowArchived] = useState(false);

    // Modals State
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [isAddingLead, setIsAddingLead] = useState(false);
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // Forms State
    const [newProject, setNewProject] = useState<any>({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '' });
    const [newLead, setNewLead] = useState<any>({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '' });
    const [newPartner, setNewPartner] = useState<any>({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '' });

    const [editingItemType, setEditingItemType] = useState<'Project' | 'Lead' | 'Partner' | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Kanban Stages (Sesuai SOP)
    const KANBAN_STAGES = ['Technical Handover', 'Feasibility & Design', 'Demo / POC', 'Development & Data', 'Internal Testing', 'UAT with Client', 'Training & Go Live', 'Value Review', 'Done', 'Lost'];
    const PRESALES_STAGES = ['Lead Generation', 'Discovery Meeting', 'MoM & BRD Creation', 'Technical Handover', 'Feasibility Check', 'Solution Design & FRD', 'Validation & Demo', 'Commercial Negotiation', 'Closed Won', 'Closed Lost'];
    const PARTNER_STAGES = ['Sourcing', 'Approached', 'Negotiation', 'Onboarded', 'Active', 'Archived'];

    const getFilteredProjects = (stage: string) => {
        return config?.kanbanProjects?.filter((p: any) => {
            if (p.stage !== stage) return false;
            if (priorityFilter !== 'All' && (p.priority || 'Medium') !== priorityFilter) return false;
            const isArchived = p.stage === 'Done' || p.stage === 'Lost';
            if (!showArchived && isArchived) return false;
            return true;
        }) || [];
    };

    const getFilteredLeads = (stage: string) => {
        return config?.kanbanLeads?.filter((l: any) => {
            if (l.stage !== stage) return false;
            if (priorityFilter !== 'All' && (l.priority || 'Medium') !== priorityFilter) return false;
            const isArchived = l.stage === 'Closed Won' || l.stage === 'Closed Lost' || l.isClosed === true;
            if (!showArchived && isArchived) return false;
            return true;
        }) || [];
    };

    const getFilteredPartners = (stage: string) => {
        return config?.kanbanPartners?.filter((p: any) => {
            if ((p.stage || 'Sourcing') !== stage) return false;
            if (priorityFilter !== 'All' && (p.priority || 'Medium') !== priorityFilter) return false;
            const isArchived = p.stage === 'Archived' || p.isActive === false;
            if (!showArchived && isArchived) return false;
            return true;
        }) || [];
    };

    useEffect(() => {
        setLocalConfig(getConfig());
    }, [globalIsLoading]);

    if (!config) return <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Workspace...</div>;

    // Helper: Cari nama PSE dari ID
    const getPseName = (id: string) => config.pseWorkloads?.find((p: any) => p.pseId === id)?.name || 'Unknown PSE';

    // Helper: Hitung warna badge stage
    const getStageColor = (stage: string) => {
        const index = PRESALES_STAGES.indexOf(stage);
        if (index < 3) return 'bg-zinc-200 text-zinc-800'; 
        if (index < 6) return 'bg-blue-100 text-blue-800';
        return 'bg-emerald-100 text-emerald-800'; 
    };

    // --- Action Handlers ---
    const openEditModal = (type: 'Project' | 'Lead' | 'Partner', data: any) => {
        setEditingItemType(type);
        setEditingItemId(data.id);
        if (type === 'Project') { setNewProject(data); setIsAddingProject(true); }
        else if (type === 'Lead') { setNewLead(data); setIsAddingLead(true); }
        else { setNewPartner(data); setIsAddingPartner(true); }
    };

    const handleSaveData = async (type: 'Project' | 'Lead' | 'Partner', payload: any, stateUpdater: any, modalCloser: any, resetForm: any) => {
        setSubmitting(true);
        try {
            const isEditing = !!editingItemId && editingItemType === type;
            const endpoint = isEditing ? `editKanban${type}` : `addKanban${type}`;
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: endpoint, ...(isEditing ? { id: editingItemId } : {}), ...payload })
            });
            const data = await res.json();
            if (data.success) {
                // Optimistic Update
                setLocalConfig((prev: any) => {
                    if (!prev) return prev;
                    const n = JSON.parse(JSON.stringify(prev));
                    const arrayName = type === 'Project' ? 'kanbanProjects' : type === 'Lead' ? 'kanbanLeads' : 'kanbanPartners';
                    if (!n[arrayName]) n[arrayName] = [];
                    
                    if (isEditing) {
                        const idx = n[arrayName].findIndex((x: any) => x.id === editingItemId);
                        if (idx > -1) n[arrayName][idx] = { ...n[arrayName][idx], ...payload };
                    } else {
                        n[arrayName].push({ id: data.newId, ...payload, isClosed: false, isActive: true });
                    }
                    setConfig({ [arrayName]: n[arrayName] });
                    return n;
                });
                modalCloser(false);
                setEditingItemId(null);
                setEditingItemType(null);
                resetForm();
                
                // Silent refetch to sync background changes directly to config state
                syncData({ silent: true });
            } else {
                alert(`Error saving ${type}: ` + data.message);
            }
        } catch (err) {
            alert(`Failed to save ${type}.`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24">
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                            <Briefcase className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-zinc-900">B2B Operations</h1>
                            <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Delivery & Resource Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 overflow-x-auto hide-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><Briefcase size={14} /> Projects</button>
                        <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'leads' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><Target size={14} /> Leads</button>
                        <button onClick={() => setActiveTab('partners')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'partners' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><Users size={14} /> Partners</button>
                        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><BarChart3 size={14} /> PSE Stats</button>
                    </div>
                </div>
            </header>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-8">
                {/* GLOBAL ACTION BAR */}
                <div className="flex justify-between items-center mb-6 animate-in fade-in duration-300">
                    <div>
                        {activeTab === 'projects' && <button onClick={() => { setEditingItemId(null); setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '' }); setIsAddingProject(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-blue-600 text-white hover:bg-blue-700"><Plus size={14} /> Add Project</button>}
                        {activeTab === 'leads' && <button onClick={() => { setEditingItemId(null); setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '' }); setIsAddingLead(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-emerald-600 text-white hover:bg-emerald-700"><Plus size={14} /> Add Lead Support</button>}
                        {activeTab === 'partners' && <button onClick={() => { setEditingItemId(null); setNewPartner({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '' }); setIsAddingPartner(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-purple-600 text-white hover:bg-purple-700"><Plus size={14} /> Add Partner</button>}
                    </div>

                    <button
                        onClick={async () => {
                            setLoadingBiData(true);
                            await syncData();
                            setLocalConfig(getConfig());
                            setLoadingBiData(false);
                        }}
                        disabled={loadingBiData || globalIsLoading}
                        className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm ${loadingBiData || globalIsLoading ? 'bg-zinc-200 text-zinc-500 cursor-wait' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}`}>
                        {loadingBiData || globalIsLoading ? <><Loader2 size={14} className="animate-spin" /> Syncing</> : <><Globe size={14} /> Sync Data</>}
                    </button>
                </div>

                {/* FILTER BAR OPTIONS */}
                {activeTab !== 'stats' && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2 animate-in fade-in duration-300">
                        <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto hide-scrollbar">
                            {['All', 'High', 'Medium', 'Low'].map(p => (
                                <button key={p} onClick={() => setPriorityFilter(p)} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${priorityFilter === p ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>{p} Priority</button>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-zinc-200">
                            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-zinc-100 border-zinc-300" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">Show Completed / Archived</span>
                        </label>
                    </div>
                )}

                {/* TAB 1: KANBAN PROJECTS */}
                {activeTab === 'projects' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar flex-nowrap items-start animate-in slide-in-from-bottom-4 duration-500" style={{ minHeight: '70vh' }}>
                        {KANBAN_STAGES.map(stage => (
                            <div key={stage} className="w-[320px] shrink-0 bg-zinc-100/50 border border-zinc-200 rounded-3xl flex flex-col h-full max-h-[75vh]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const projectId = e.dataTransfer.getData('projectId');
                                    if (projectId) {
                                        setLocalConfig(prev => {
                                            if (!prev) return prev;
                                            const n = JSON.parse(JSON.stringify(prev));
                                            const p = n.kanbanProjects?.find((x: any) => x.id === projectId);
                                            if (p) p.stage = stage;
                                            setConfig({ kanbanProjects: n.kanbanProjects });
                                            return n;
                                        });
                                        fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateKanban', projectId, newStage: stage }) }).catch(() => alert("Fail update"));
                                    }
                                }}
                            >
                                <div className="p-4 border-b border-zinc-200/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-zinc-600">
                                    {stage}
                                    <span className="bg-white border border-zinc-200 text-zinc-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredProjects(stage).length}</span>
                                </div>
                                <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                    {getFilteredProjects(stage).map((p: any) => (
                                        <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('projectId', p.id)}
                                            onClick={() => openEditModal('Project', p)}
                                            className="bg-white border border-zinc-200 shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${(p.priority || 'Medium') === 'High' ? 'bg-rose-500' : (p.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Briefcase size={14} /></div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-blue-100 text-blue-800`}>{p.stage}</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${p.priority === 'High' ? 'text-rose-500' : p.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>{p.priority}</span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-blue-950 text-base mb-1">{p.projectName}</h3>
                                            <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mb-3">Client: <span className="text-blue-800">{p.client}</span> &bull; PSE: <span className="text-blue-800">{getPseName(p.pseId)}</span></p>
                                            <div className="flex flex-col border-t border-blue-50 pt-3">
                                                <span className="text-[9px] text-blue-600/50 font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                                    <span>Progress</span>
                                                    <span>{p.progress || 0}%</span>
                                                </span>
                                                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 2: LEADS SUPPORT (KANBAN) */}
                {activeTab === 'leads' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar flex-nowrap items-start animate-in slide-in-from-bottom-4 duration-500" style={{ minHeight: '70vh' }}>
                        {PRESALES_STAGES.map(stage => (
                            <div key={stage} className="w-[320px] shrink-0 bg-emerald-50/30 border border-emerald-100 rounded-3xl flex flex-col h-full max-h-[75vh]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const leadId = e.dataTransfer.getData('leadId');
                                    if (leadId) {
                                        setLocalConfig(prev => {
                                            if (!prev) return prev;
                                            const n = JSON.parse(JSON.stringify(prev));
                                            const p = n.kanbanLeads?.find((x: any) => x.id === leadId);
                                            if (p) p.stage = stage;
                                            setConfig({ kanbanLeads: n.kanbanLeads });
                                            return n;
                                        });
                                        fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateKanbanLead', leadId, newStage: stage }) }).catch(() => alert("Fail update"));
                                    }
                                }}
                            >
                                <div className="p-4 border-b border-emerald-100/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-emerald-800">
                                    {stage}
                                    <span className="bg-white border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredLeads(stage).length}</span>
                                </div>
                                <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                    {getFilteredLeads(stage).map((l: any) => (
                                        <div key={l.id} draggable onDragStart={(e) => e.dataTransfer.setData('leadId', l.id)}
                                            onClick={() => openEditModal('Lead', l)}
                                            className="bg-white border border-emerald-200 shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${(l.priority || 'Medium') === 'High' ? 'bg-rose-500' : (l.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Target size={14} /></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${getStageColor(l.stage)}`}>{l.stage}</span>
                                            </div>
                                            <h3 className="font-bold text-emerald-950 text-base mb-1">{l.name}</h3>
                                            <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mb-3">Support: <span className="text-emerald-800">{getPseName(l.pseId)}</span></p>
                                            <div className="flex flex-col border-t border-emerald-50 pt-3">
                                                <span className="text-[9px] text-emerald-600/50 font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                                    <span>Progress</span>
                                                    <span>{l.progress || 0}%</span>
                                                </span>
                                                <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${l.progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 3: PARTNERS DIRECTORY (KANBAN) */}
                {activeTab === 'partners' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar flex-nowrap items-start animate-in slide-in-from-bottom-4 duration-500" style={{ minHeight: '70vh' }}>
                        {PARTNER_STAGES.map(stage => (
                            <div key={stage} className="w-[320px] shrink-0 bg-purple-50/30 border border-purple-100 rounded-3xl flex flex-col h-full max-h-[75vh]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const partnerId = e.dataTransfer.getData('partnerId');
                                    if (partnerId) {
                                        setLocalConfig(prev => {
                                            if (!prev) return prev;
                                            const n = JSON.parse(JSON.stringify(prev));
                                            const p = n.kanbanPartners?.find((x: any) => x.id === partnerId);
                                            if (p) p.stage = stage;
                                            setConfig({ kanbanPartners: n.kanbanPartners });
                                            return n;
                                        });
                                        fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateKanbanPartner', partnerId, newStage: stage }) }).catch(() => alert("Fail update"));
                                    }
                                }}
                            >
                                <div className="p-4 border-b border-purple-200/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-purple-800">
                                    {stage}
                                    <span className="bg-white border border-purple-200 text-purple-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredPartners(stage).length}</span>
                                </div>
                                <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                    {getFilteredPartners(stage).map((p: any) => (
                                        <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('partnerId', p.id)}
                                            onClick={() => openEditModal('Partner', p)}
                                            className="bg-white border border-purple-200 shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${(p.priority || 'Medium') === 'High' ? 'bg-rose-500' : (p.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Users size={14} /></div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${getStageColor(p.stage || 'Sourcing')}`}>{p.stage || 'Sourcing'}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">{p.type}</span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-purple-950 text-base mb-1">{p.name}</h3>
                                            <p className="text-[10px] font-black text-purple-600/70 uppercase tracking-widest mb-3">PIC: <span className="text-purple-800">{getPseName(p.pseId)}</span></p>
                                            <div className="flex flex-col border-t border-purple-50 pt-3">
                                                <span className="text-[9px] text-purple-600/50 font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                                    <span>Progress</span>
                                                    <span>{p.progress || 0}%</span>
                                                </span>
                                                <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 4: PSE WORKLOAD STATS */}
                {activeTab === 'stats' && config.pseWorkloads && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart 1: Proportional Composition */}
                            <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6">Workload Composition (Points)</h2>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={config.pseWorkloads} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#3f3f46', fontWeight: 900 }} axisLine={false} tickLine={false} width={80} />
                                            <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                            <Bar dataKey="activeProjects" name="Projects (x3)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="activeLeads" name="Leads (x1)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="activePartners" name="Partners (x1)" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Capacity Limits */}
                            <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6">Capacity Utilization (%)</h2>
                                <div className="space-y-6">
                                    {config.pseWorkloads.map(pse => (
                                        <div key={pse.pseId}>
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-zinc-800">{pse.name}</span>
                                                <span className={`${pse.loadPercentage > 90 ? 'text-rose-500' : pse.loadPercentage > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{pse.loadPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${pse.loadPercentage > 90 ? 'bg-rose-500' : pse.loadPercentage > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pse.loadPercentage, 100)}%` }}></div>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                <span>{pse.activeProjects} Proj</span>
                                                <span>{pse.activeLeads} Lead</span>
                                                <span>{pse.activePartners} Ptnr</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========== ADD PROJECT MODAL ========== */}
            {isAddingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">Add New Project</h3>
                            <button onClick={() => setIsAddingProject(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Client Name</label><input type="text" value={newProject.client} onChange={(e) => setNewProject((p: any) => ({ ...p, client: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Project Name</label><input type="text" value={newProject.projectName} onChange={(e) => setNewProject((p: any) => ({ ...p, projectName: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PSE Assignee</label>
                                    <select value={newProject.pseId} onChange={(e) => setNewProject((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Stage</label>
                                    <select value={newProject.stage} onChange={(e) => setNewProject((p: any) => ({ ...p, stage: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        {KANBAN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">
                                    <span>Progress</span>
                                    <span>{newProject.progress || 0}%</span>
                                </label>
                                <input type="range" min="0" max="100" value={newProject.progress || 0} onChange={(e) => setNewProject((p: any) => ({ ...p, progress: Number(e.target.value) }))} className="w-full accent-blue-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Notes</label>
                                <textarea rows={2} value={newProject.notes || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900"></textarea>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end">
                            <button disabled={submitting} onClick={() => handleSaveData('Project', newProject, setNewProject, setIsAddingProject, () => setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '' }))} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase rounded-xl hover:bg-blue-700">{submitting ? 'Saving...' : 'Save Project'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ADD LEAD MODAL ========== */}
            {isAddingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">Add Lead Support</h3>
                            <button onClick={() => setIsAddingLead(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Company / Lead Name</label><input type="text" value={newLead.name} onChange={(e) => setNewLead((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-900" /></div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PSE Support</label>
                                <select value={newLead.pseId} onChange={(e) => setNewLead((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                    <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Current Stage</label>
                                    <select value={newLead.stage} onChange={(e) => setNewLead((p: any) => ({ ...p, stage: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        {PRESALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Priority</label>
                                    <select value={newLead.priority || 'Medium'} onChange={(e) => setNewLead((p: any) => ({ ...p, priority: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">
                                    <span>Progress</span>
                                    <span>{newLead.progress || 0}%</span>
                                </label>
                                <input type="range" min="0" max="100" value={newLead.progress || 0} onChange={(e) => setNewLead((p: any) => ({ ...p, progress: Number(e.target.value) }))} className="w-full accent-emerald-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Notes</label>
                                <textarea rows={2} value={newLead.notes || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-900"></textarea>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end">
                            <button disabled={submitting} onClick={() => handleSaveData('Lead', newLead, setNewLead, setIsAddingLead, () => setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '' }))} className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-700">{submitting ? 'Saving...' : 'Save Lead'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ADD PARTNER MODAL ========== */}
            {isAddingPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">Add Partner</h3>
                            <button onClick={() => setIsAddingPartner(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Partner Name</label><input type="text" value={newPartner.name} onChange={(e) => setNewPartner((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900" /></div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PIC (PSE)</label>
                                <select value={newPartner.pseId} onChange={(e) => setNewPartner((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                    <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Current Stage</label>
                                    <select value={newPartner.stage} onChange={(e) => setNewPartner((p: any) => ({ ...p, stage: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        {PARTNER_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Priority</label>
                                    <select value={newPartner.priority || 'Medium'} onChange={(e) => setNewPartner((p: any) => ({ ...p, priority: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">
                                    <span>Progress</span>
                                    <span>{newPartner.progress || 0}%</span>
                                </label>
                                <input type="range" min="0" max="100" value={newPartner.progress || 0} onChange={(e) => setNewPartner((p: any) => ({ ...p, progress: Number(e.target.value) }))} className="w-full accent-purple-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Notes</label>
                                <textarea rows={2} value={newPartner.notes || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900"></textarea>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end">
                            <button disabled={submitting} onClick={() => handleSaveData('Partner', newPartner, setNewPartner, setIsAddingPartner, () => setNewPartner({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '' }))} className="px-6 py-2.5 bg-purple-600 text-white text-xs font-black uppercase rounded-xl hover:bg-purple-700">{submitting ? 'Saving...' : 'Save Partner'}</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e4e4e7; border-radius: 10px; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </main>
    );
}