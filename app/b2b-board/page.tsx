'use client';
import { useEffect, useState, useMemo } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, SiteConfig, setConfig } from '../lib/config';
import { Globe, Loader2, LayoutDashboard, Plus, X, Briefcase, Users, Target, BarChart3, Trash2, HelpCircle, Search, Filter, ChevronDown, ExternalLink, Phone, Mail, DollarSign, Calendar, UserCheck, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Filter Chip Dropdown Component ---
const FilterChipDropdown = ({ label, options, selected, onChange, color = 'blue' }: {
    label: string;
    options: string[];
    selected: string[];
    onChange: (val: string[]) => void;
    color?: string;
}) => {
    const [open, setOpen] = useState(false);
    const isActive = selected.length > 0;
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
        zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200',
    };
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all whitespace-nowrap ${isActive ? colorMap[color] : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>
                <Filter size={10} />
                {label} {isActive && <span className="bg-white/80 text-[9px] px-1.5 py-0.5 rounded-md font-black">{selected.length}</span>}
                <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-zinc-200 shadow-xl min-w-[180px] max-h-[240px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="p-1.5">
                            {options.map(opt => (
                                <label key={opt} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selected.includes(opt)} onChange={(e) => {
                                        if (e.target.checked) onChange([...selected, opt]);
                                        else onChange(selected.filter(s => s !== opt));
                                    }} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold text-zinc-700 truncate">{opt}</span>
                                </label>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <div className="border-t border-zinc-100 p-1.5">
                                <button onClick={() => { onChange([]); setOpen(false); }} className="w-full text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">Clear</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const SALES_TEAM = ['Titan', 'Rani'];

// --- Sub-components (Cards) ---
const ProjectCard = ({ project: p, onEdit, onDelete, getPseName }: any) => {
    const isDone = p.stage === 'Done';
    const isLost = p.stage === 'Lost';
    const isFrozen = p.stage === 'Freeze';
    const hasValue = p.forecastedValue && p.forecastedValue > 0;
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('projectId', p.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isDone ? 'bg-emerald-50 border-emerald-200' : isLost ? 'bg-rose-50 border-rose-200' : isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDone ? 'bg-emerald-500' : isLost ? 'bg-rose-500' : isFrozen ? 'bg-slate-400' : (p.priority || 'Medium') === 'High' ? 'bg-rose-500' : (p.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDone ? 'bg-emerald-100 text-emerald-600' : isLost ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}><Briefcase size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Project', p.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isDone ? 'bg-emerald-200 text-emerald-800' : isLost ? 'bg-rose-200 text-rose-800' : isFrozen ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'}`}>{p.stage}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${p.priority === 'High' ? 'text-rose-500' : p.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>{p.priority}</span>
                </div>
            </div>
            <div onClick={() => onEdit('Project', p)}>
                <h3 className={`font-bold text-base mb-1 ${isDone ? 'text-emerald-950' : isLost ? 'text-rose-950' : 'text-blue-950'}`}>{p.client || p.projectName}</h3>
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Project: <span className="text-zinc-600">{p.projectName}</span></p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                    {p.picSales && <p className="text-[10px] font-black text-amber-600/80 uppercase tracking-widest"><UserCheck size={9} className="inline mr-0.5 -mt-0.5" /> Sales: <span className="text-amber-800">{p.picSales}</span></p>}
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PSE: <span className="text-zinc-600">{getPseName(p.pseId)}</span></p>
                </div>

                {hasValue && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <DollarSign size={10} className="text-blue-500" />
                        <span className="text-[10px] font-black text-blue-700">IDR {(p.forecastedValue / 1000000).toFixed(0)}M</span>
                    </div>
                )}

                {(p.contactName || p.contactNumber) && (
                    <div className="flex items-center gap-2 mb-2 text-[9px] text-zinc-400 font-bold">
                        {p.contactName && <span className="truncate max-w-[120px]">{p.contactName}</span>}
                        {p.contactNumber && <span className="flex items-center gap-0.5"><Phone size={8} /> {p.contactNumber.substring(0, 15)}</span>}
                    </div>
                )}

                {p.closeDate && (
                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                        <Calendar size={10} /> Close: {new Date(p.closeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                )}

                {p.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {p.nextStep}</p>}
                
                <div className="flex flex-col border-t border-zinc-50 pt-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5">
                        <span className="text-zinc-400">Progress</span>
                        <span className={isDone ? 'text-emerald-500' : 'text-blue-500'}>{p.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.progress || 0}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeadCard = ({ lead: l, onEdit, onDelete, getPseName, getStageColor }: any) => {
    const isLost = l.stage === 'Closed Lost';
    const isFrozen = l.stage === 'Freeze';
    const hasValue = l.forecastedValue && l.forecastedValue > 0;
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('leadId', l.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isLost ? 'bg-rose-50 border-rose-200' : isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isLost ? 'bg-rose-500' : isFrozen ? 'bg-slate-400' : (l.priority || 'Medium') === 'High' ? 'bg-rose-500' : (l.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLost ? 'bg-rose-100 text-rose-600' : isFrozen ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}><Target size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Lead', l.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${isLost ? 'bg-rose-200 text-rose-800' : isFrozen ? 'bg-slate-200 text-slate-800 border-slate-300' : getStageColor(l.stage)}`}>{l.stage}</span>
            </div>
            <div onClick={() => onEdit('Lead', l)}>
                <h3 className="font-bold text-zinc-900 text-base mb-1">{l.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                    {l.picSales && <p className="text-[10px] font-black text-amber-600/80 uppercase tracking-widest"><UserCheck size={9} className="inline mr-0.5 -mt-0.5" /> Sales: <span className="text-amber-800">{l.picSales}</span></p>}
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PSE: <span className="text-zinc-600">{getPseName(l.pseId)}</span></p>
                </div>
                {l.partnerId && <p className="text-[9px] font-black text-purple-600/80 uppercase tracking-widest mb-2"><Users size={9} className="inline mr-0.5 -mt-0.5" /> Partner: <span className="text-purple-800">Linked</span></p>}
                {/* Forecasted Value */}
                {hasValue && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <DollarSign size={10} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-700">IDR {(l.forecastedValue / 1000000).toFixed(0)}M</span>
                        {l.probability > 0 && <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{Math.round(l.probability * 100)}%</span>}
                    </div>
                )}
                {/* Contact info row */}
                {(l.contactName || l.contactNumber) && (
                    <div className="flex items-center gap-2 mb-2 text-[9px] text-zinc-400 font-bold">
                        {l.contactName && <span className="truncate max-w-[120px]">{l.contactName}</span>}
                        {l.contactNumber && <span className="flex items-center gap-0.5"><Phone size={8} /> {l.contactNumber.substring(0, 15)}</span>}
                    </div>
                )}
                {/* Next Step */}
                {l.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {l.nextStep}</p>}
                {/* Progress bar */}
                <div className="flex flex-col border-t border-emerald-50 pt-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5">
                        <span className="text-zinc-400">Progress</span>
                        <span className="text-emerald-500">{l.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1 bg-emerald-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${l.progress || 0}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PartnerCard = ({ partner: p, onEdit, onDelete, getPseName, getStageColor }: any) => {
    const isFrozen = p.stage === 'Freeze';
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('partnerId', p.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isFrozen ? 'bg-slate-400' : (p.priority || 'Medium') === 'High' ? 'bg-rose-500' : (p.priority || 'Medium') === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isFrozen ? 'bg-slate-100 text-slate-600' : 'bg-purple-50 text-purple-600'}`}><Users size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Partner', p.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <div className="text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md block mb-1 border ${isFrozen ? 'bg-slate-200 text-slate-800 border-slate-300' : getStageColor(p.stage || 'Sourcing')}`}>{p.stage || 'Sourcing'}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isFrozen ? 'text-slate-400' : 'text-purple-400'}`}>{p.type}</span>
                </div>
            </div>
            <div onClick={() => onEdit('Partner', p)}>
                <h3 className="font-bold text-purple-950 text-base mb-1">{p.name}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                    {p.picPartner && <p className="text-[10px] font-black text-amber-600/80 uppercase tracking-widest"><UserCheck size={9} className="inline mr-0.5 -mt-0.5" /> PIC: <span className="text-amber-800">{p.picPartner}</span></p>}
                    <p className="text-[10px] font-black text-purple-600/70 uppercase tracking-widest">PSE: <span className="text-purple-800">{getPseName(p.pseId)}</span></p>
                </div>

                {(p.contactName || p.contactNumber) && (
                    <div className="flex items-center gap-2 mb-2 text-[9px] text-zinc-400 font-bold">
                        {p.contactName && <span className="truncate max-w-[120px]">{p.contactName}</span>}
                        {p.contactNumber && <span className="flex items-center gap-0.5"><Phone size={8} /> {p.contactNumber.substring(0, 15)}</span>}
                    </div>
                )}

                {p.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {p.nextStep}</p>}
                
                {/* Leads Section Indicator */}
                {p.leadsCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="bg-purple-100 text-purple-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">{p.leadsCount} Leads Generated</span>
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                            {p.leads?.map((l: any) => (
                                <div key={l.id} className="bg-zinc-50 border border-zinc-100 p-2 rounded-lg flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-zinc-800 truncate max-w-[150px]">{l.name}</span>
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">{l.stage}</span>
                                    </div>
                                    {l.forecastedValue > 0 && <span className="text-[8px] font-black text-emerald-600">IDR {(l.forecastedValue / 1000000).toFixed(0)}M</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex flex-col border-t border-purple-50 pt-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5">
                        <span className="text-purple-600/50">Syncing</span>
                        <span className="text-purple-500">{p.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function B2BBoardPage() {
    const { syncData, isLoading: globalIsLoading } = useGlobalData();
    const [config, setLocalConfig] = useState<SiteConfig | null>(null);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'leads' | 'partners' | 'stats' | 'sales' | 'revenue'>('projects');
    const [showArchived, setShowArchived] = useState(false);
    const [showPointsInfo, setShowPointsInfo] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic filter state: Record<columnName, selectedValues[]>
    const [filters, setFilters] = useState<Record<string, string[]>>({});

    // Modals State
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [isAddingLead, setIsAddingLead] = useState(false);
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Forms State
    const [newProject, setNewProject] = useState<any>({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '', picSales: '', contactName: '', contactNumber: '', forecastedValue: 0, nextStep: '', probability: 0.4 });
    const [newLead, setNewLead] = useState<any>({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '', partnerId: '' });
    const [newPartner, setNewPartner] = useState<any>({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '', picPartner: '', contactName: '', contactNumber: '', nextStep: '' });

    const [editingItemType, setEditingItemType] = useState<'Project' | 'Lead' | 'Partner' | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<any>(null);

    // Kanban Stages (Sesuai SOP)
    const KANBAN_STAGES = ['Technical Handover', 'Feasibility & Design', 'Demo / POC', 'Development & Data', 'Internal Testing', 'UAT with Client', 'Training & Go Live', 'Value Review', 'Freeze', 'Done', 'Lost'];
    const PRESALES_STAGES = ['Lead Generation', 'Discovery Meeting', 'MoM & BRD Creation', 'Technical Handover', 'Feasibility Check', 'Solution Design & FRD', 'Validation & Demo', 'Commercial Negotiation', 'Freeze', 'Closed Lost'];
    const PARTNER_STAGES = ['Sourcing', 'Approached', 'Negotiation', 'Onboarded', 'Active', 'Freeze', 'Archived'];

    // Hardcoded Probability & Progress Mapping
    const PROBABILITY_MAP: Record<string, number> = {
        // Leads
        'Lead Generation': 0.1,
        'Discovery Meeting': 0.2,
        'MoM & BRD Creation': 0.3,
        'Technical Handover': 0.4,
        'Feasibility Check': 0.5,
        'Solution Design & FRD': 0.6,
        'Validation & Demo': 0.8,
        'Commercial Negotiation': 0.9,
        'Freeze': 0,
        'Closed Lost': 0,
        // Projects
        'Technical Handover': 0.4,
        'Feasibility & Design': 0.5,
        'Demo / POC': 0.6,
        'Development & Data': 0.7,
        'Internal Testing': 0.8,
        'UAT with Client': 0.9,
        'Training & Go Live': 1.0,
        'Value Review': 1.0,
        'Done': 1.0,
        'Lost': 0
    };

    // CRM Status mapping - keep CRM status as-is for leads
    const CRM_STATUSES = ['Lead', 'Contacted', 'Demo/Call of Interest', 'Feasibility Check', 'Proposal made', 'Negotiation', 'POC', 'Won', 'Lost', 'Fridge'];

    useEffect(() => {
        setLocalConfig(getConfig());
    }, [globalIsLoading]);

    // Helper: Cari nama PSE dari ID
    const getPseName = (id: string) => config?.pseWorkloads?.find((p: any) => p.pseId === id)?.name || 'Unknown PSE';

    // Helper: Hitung warna badge stage
    const getStageColor = (stage: string) => {
        if (stage === 'Freeze') return 'bg-slate-100 text-slate-600 border-slate-200';
        const index = PRESALES_STAGES.indexOf(stage);
        if (index < 3) return 'bg-zinc-100 text-zinc-500 border-zinc-200'; 
        if (index < 6) return 'bg-blue-50 text-blue-600 border-blue-100';
        return 'bg-emerald-50 text-emerald-600 border-emerald-100'; 
    };

    // --- Dynamic filter logic ---
    const updateFilter = (column: string, values: string[]) => {
        setFilters(prev => {
            const next = { ...prev };
            if (values.length === 0) delete next[column];
            else next[column] = values;
            return next;
        });
    };

    const clearAllFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

    // Extract unique values per column for filter dropdowns
    const getUniqueProjectValues = useMemo(() => {
        const projects = config?.kanbanProjects || [];
        return {
            stages: [...new Set(projects.map((p: any) => p.stage))].sort(),
            priorities: ['High', 'Medium', 'Low'],
            pse: [...new Set(projects.map((p: any) => getPseName(p.pseId)).filter(Boolean))].sort(),
            clients: [...new Set(projects.map((p: any) => p.client).filter(Boolean))].sort(),
        };
    }, [config?.kanbanProjects]);

    const getUniqueLeadValues = useMemo(() => {
        const leads = config?.kanbanLeads || [];
        return {
            stages: [...new Set(leads.map((l: any) => l.stage))].sort(),
            priorities: ['High', 'Medium', 'Low'],
            pse: [...new Set(leads.map((l: any) => getPseName(l.pseId)).filter(Boolean))].sort(),
            picSales: [...new Set(leads.map((l: any) => l.picSales).filter(Boolean))].sort(),
            companies: [...new Set(leads.map((l: any) => l.name).filter(Boolean))].sort(),
        };
    }, [config?.kanbanLeads]);

    const getUniquePartnerValues = useMemo(() => {
        const partners = config?.kanbanPartners || [];
        return {
            stages: [...new Set(partners.map((p: any) => p.stage || 'Sourcing'))].sort(),
            priorities: ['High', 'Medium', 'Low'],
            pse: [...new Set(partners.map((p: any) => getPseName(p.pseId)).filter(Boolean))].sort(),
            types: [...new Set(partners.map((p: any) => p.type).filter(Boolean))].sort(),
        };
    }, [config?.kanbanPartners]);

    // Guard: render nothing until config is loaded (MUST be after all hooks)
    if (!config) return <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Workspace...</div>;

    // Apply filters + search to items
    const matchesSearch = (item: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return Object.values(item).some(v => v && String(v).toLowerCase().includes(q));
    };

    const getFilteredProjects = (stage: string) => {
        return config?.kanbanProjects?.filter((p: any) => {
            if (p.stage !== stage) return false;
            if (filters.priority && !filters.priority.includes(p.priority || 'Medium')) return false;
            if (filters.pse && !filters.pse.includes(getPseName(p.pseId))) return false;
            if (filters.client && !filters.client.includes(p.client)) return false;
            if (!matchesSearch(p)) return false;
            return true;
        }) || [];
    };

    const getFilteredLeads = (stage: string) => {
        return config?.kanbanLeads?.filter((l: any) => {
            if (l.stage !== stage) return false;
            if (filters.priority && !filters.priority.includes(l.priority || 'Medium')) return false;
            if (filters.pse && !filters.pse.includes(getPseName(l.pseId))) return false;
            if (filters.picSales && !filters.picSales.includes(l.picSales)) return false;
            if (filters.company && !filters.company.includes(l.name)) return false;
            if (!matchesSearch(l)) return false;
            return true;
        }) || [];
    };

    const getFilteredPartners = (stage: string) => {
        return config?.kanbanPartners?.filter((p: any) => {
            if ((p.stage || 'Sourcing') !== stage) return false;
            if (filters.priority && !filters.priority.includes(p.priority || 'Medium')) return false;
            if (filters.pse && !filters.pse.includes(getPseName(p.pseId))) return false;
            if (filters.type && !filters.type.includes(p.type)) return false;
            if (!matchesSearch(p)) return false;
            return true;
        }).map((p: any) => {
            const partnerLeads = config?.kanbanLeads?.filter((l: any) => l.partnerId === p.id) || [];
            return { ...p, leadsCount: partnerLeads.length, leads: partnerLeads };
        }) || [];
    };

    // --- Action Handlers ---
    const openEditModal = (type: 'Project' | 'Lead' | 'Partner', data: any) => {
        setEditingItemType(type);
        setEditingItemId(data.id);
        if (type === 'Project') { setNewProject(data); setIsAddingProject(true); }
        else if (type === 'Lead') { setNewLead(data); setIsAddingLead(true); }
        else { setNewPartner(data); setIsAddingPartner(true); }
    };

    const handleDeleteData = async (type: 'Project' | 'Lead' | 'Partner', id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: `deleteKanban${type}`, id })
            });
            const data = await res.json();
            if (data.success) {
                setLocalConfig((prev: any) => {
                    if (!prev) return prev;
                    const n = JSON.parse(JSON.stringify(prev));
                    const arrayName = type === 'Project' ? 'kanbanProjects' : type === 'Lead' ? 'kanbanLeads' : 'kanbanPartners';
                    n[arrayName] = n[arrayName].filter((x: any) => x.id !== id);
                    setConfig({ [arrayName]: n[arrayName] });
                    return n;
                });
                syncData({ silent: true });
            }
        } catch (err) {
            alert(`Failed to delete ${type}.`);
        }
    };

    const handleConvertToProject = async (lead: any) => {
        if (!confirm(`Convert "${lead.name}" to an Active Project? This will move the data to Projects and remove it from Leads.`)) return;
        setSubmitting(true);
        try {
            const projectPayload = {
                client: lead.name,
                projectName: `${lead.name} - Project`,
                pseId: lead.pseId,
                stage: 'Technical Handover',
                progress: 0,
                priority: lead.priority || 'Medium',
                notes: lead.notes || ''
            };
            const addRes = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addKanbanProject', ...projectPayload })
            });
            const addData = await addRes.json();
            
            if (addData.success) {
                await fetch('/api/bi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'deleteKanbanLead', id: lead.id })
                });

                setLocalConfig((prev: any) => {
                    if (!prev) return prev;
                    const n = JSON.parse(JSON.stringify(prev));
                    n.kanbanLeads = n.kanbanLeads.filter((x: any) => x.id !== lead.id);
                    n.kanbanProjects.push({ id: addData.newId, ...projectPayload });
                    setConfig({ kanbanLeads: n.kanbanLeads, kanbanProjects: n.kanbanProjects });
                    return n;
                });
                
                setIsAddingLead(false);
                setEditingItemId(null);
                setActiveTab('projects');
                syncData({ silent: true });
            }
        } catch (err) {
            alert("Failed to convert lead to project.");
        } finally {
            setSubmitting(false);
        }
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

    const handleUpdateMember = async () => {
        if (!editingMember) return;
        setSubmitting(true);
        try {
            const isEditing = !!editingMember.isExisting;
            const action = isEditing ? 'updatePseMember' : 'addPseMember';
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    pseId: editingMember.pseId, 
                    name: editingMember.name,
                    maxCapacity: editingMember.maxCapacity, 
                    isActive: editingMember.isActive 
                })
            });
            const data = await res.json();
            if (data.success) {
                setLocalConfig((prev: any) => {
                    if (!prev) return prev;
                    const n = JSON.parse(JSON.stringify(prev));
                    if (isEditing) {
                        const idx = n.pseWorkloads.findIndex((m: any) => m.pseId === editingMember.pseId);
                        if (idx > -1) n.pseWorkloads[idx] = { ...n.pseWorkloads[idx], ...editingMember };
                    } else {
                        n.pseWorkloads.push({
                            ...editingMember,
                            activeProjects: 0, activeLeads: 0, activePartners: 0, loadPercentage: 0
                        });
                    }
                    setConfig({ pseWorkloads: n.pseWorkloads });
                    return n;
                });
                setEditingMember(null);
                syncData({ silent: true });
            }
        } catch (err) {
            alert("Failed to update workload settings.");
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
                        <div className="w-px h-6 bg-zinc-200 mx-1"></div>
                        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><BarChart3 size={14} /> PSE</button>
                        <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><UserCheck size={14} /> Sales</button>
                        <button onClick={() => setActiveTab('revenue')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'revenue' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><DollarSign size={14} /> Revenue</button>
                    </div>
                </div>
            </header>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-8">
                {/* GLOBAL ACTION BAR */}
                <div className="flex justify-between items-center mb-6 animate-in fade-in duration-300">
                    <div>
                        {activeTab === 'projects' && <button onClick={() => { setEditingItemId(null); setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '' }); setIsAddingProject(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-blue-600 text-white hover:bg-blue-700"><Plus size={14} /> Add Project</button>}
                        {activeTab === 'leads' && <button onClick={() => { setEditingItemId(null); setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '' }); setIsAddingLead(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-emerald-600 text-white hover:bg-emerald-700"><Plus size={14} /> Add Lead Support</button>}
                        {activeTab === 'partners' && <button onClick={() => { setEditingItemId(null); setNewPartner({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '' }); setIsAddingPartner(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-purple-600 text-white hover:bg-purple-700"><Plus size={14} /> Add Partner</button>}
                        {activeTab === 'stats' && <button onClick={() => setEditingMember({ pseId: '', name: '', maxCapacity: 30, isActive: true, isExisting: false })} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-zinc-900 text-white hover:bg-zinc-800"><Plus size={14} /> Add PSE Member</button>}
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

                {/* DYNAMIC FILTER BAR */}
                {['projects', 'leads', 'partners'].includes(activeTab) && (
                    <div className="flex flex-col gap-3 mb-6 mt-2 animate-in fade-in duration-300">
                        {/* Search + Clear row */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search across all fields..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-zinc-900 placeholder:text-zinc-400"
                                />
                            </div>
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all whitespace-nowrap">
                                    <X size={10} /> Clear All
                                </button>
                            )}
                        </div>

                        {/* Filter chips row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {activeTab === 'projects' && (
                                <>
                                    <FilterChipDropdown label="Stage" options={getUniqueProjectValues.stages} selected={filters.stage || []} onChange={(v) => updateFilter('stage', v)} color="blue" />
                                    <FilterChipDropdown label="Priority" options={getUniqueProjectValues.priorities} selected={filters.priority || []} onChange={(v) => updateFilter('priority', v)} color="amber" />
                                    <FilterChipDropdown label="PSE" options={getUniqueProjectValues.pse} selected={filters.pse || []} onChange={(v) => updateFilter('pse', v)} color="zinc" />
                                    <FilterChipDropdown label="Client" options={getUniqueProjectValues.clients} selected={filters.client || []} onChange={(v) => updateFilter('client', v)} color="purple" />
                                </>
                            )}
                            {activeTab === 'leads' && (
                                <>
                                    <FilterChipDropdown label="Stage" options={getUniqueLeadValues.stages} selected={filters.stage || []} onChange={(v) => updateFilter('stage', v)} color="emerald" />
                                    <FilterChipDropdown label="Priority" options={getUniqueLeadValues.priorities} selected={filters.priority || []} onChange={(v) => updateFilter('priority', v)} color="amber" />
                                    <FilterChipDropdown label="PSE" options={getUniqueLeadValues.pse} selected={filters.pse || []} onChange={(v) => updateFilter('pse', v)} color="zinc" />
                                    <FilterChipDropdown label="PIC Sales" options={getUniqueLeadValues.picSales} selected={filters.picSales || []} onChange={(v) => updateFilter('picSales', v)} color="rose" />
                                    <FilterChipDropdown label="Company" options={getUniqueLeadValues.companies} selected={filters.company || []} onChange={(v) => updateFilter('company', v)} color="blue" />
                                </>
                            )}
                            {activeTab === 'partners' && (
                                <>
                                    <FilterChipDropdown label="Stage" options={getUniquePartnerValues.stages} selected={filters.stage || []} onChange={(v) => updateFilter('stage', v)} color="purple" />
                                    <FilterChipDropdown label="Priority" options={getUniquePartnerValues.priorities} selected={filters.priority || []} onChange={(v) => updateFilter('priority', v)} color="amber" />
                                    <FilterChipDropdown label="PSE" options={getUniquePartnerValues.pse} selected={filters.pse || []} onChange={(v) => updateFilter('pse', v)} color="zinc" />
                                    <FilterChipDropdown label="Type" options={getUniquePartnerValues.types} selected={filters.type || []} onChange={(v) => updateFilter('type', v)} color="rose" />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar animate-in slide-in-from-bottom-4 duration-500 flex-nowrap items-start" style={{ minHeight: '70vh' }}>
                        {KANBAN_STAGES.map(stage => {
                            // If stage filter is active and this stage isn't selected, skip column entirely
                            if (filters.stage && filters.stage.length > 0 && !filters.stage.includes(stage)) return null;
                            return (
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
                                        {getFilteredProjects(stage).map((p: any) => <ProjectCard key={p.id} project={p} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} />)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar animate-in slide-in-from-bottom-4 duration-500 flex-nowrap items-start" style={{ minHeight: '70vh' }}>
                        {PRESALES_STAGES.map(stage => {
                            if (filters.stage && filters.stage.length > 0 && !filters.stage.includes(stage)) return null;
                            return (
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
                                        {getFilteredLeads(stage).map((l: any) => <LeadCard key={l.id} lead={l} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} getStageColor={getStageColor} />)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'partners' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar animate-in slide-in-from-bottom-4 duration-500 flex-nowrap items-start" style={{ minHeight: '70vh' }}>
                        {PARTNER_STAGES.map(stage => {
                            if (filters.stage && filters.stage.length > 0 && !filters.stage.includes(stage)) return null;
                            return (
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
                                        {getFilteredPartners(stage).map((p: any) => <PartnerCard key={p.id} partner={p} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} getStageColor={getStageColor} />)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TAB 4: PSE WORKLOAD STATS */}
                {activeTab === 'stats' && config.pseWorkloads && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">Workload Composition (Weighted)</h2>
                                    <button onClick={() => setShowPointsInfo(true)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                        <HelpCircle size={18} />
                                    </button>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={config.pseWorkloads} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#3f3f46', fontWeight: 900 }} axisLine={false} tickLine={false} width={80} />
                                            <Tooltip cursor={{ fill: '#f4f4f5' }} labelStyle={{ color: "#18181b", fontWeight: 900, fontSize: "14px", marginBottom: "8px" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                            <Bar dataKey="activeProjects" name="Projects (Weight)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="activeLeads" name="Leads (Weight)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="activePartners" name="Partners (Weight)" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6">Capacity Utilization (%)</h2>
                                <div className="space-y-6">
                                    {config.pseWorkloads.map(pse => (
                                        <div key={pse.pseId} className="group relative">
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-800">{pse.name}</span>
                                                    {!pse.isActive && <span className="text-[8px] font-black bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded uppercase">Inactive</span>}
                                                    <button onClick={() => setEditingMember({ ...pse, isExisting: true, maxCapacity: pse.maxCapacity || 30, isActive: pse.isActive ?? true })} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-40 group-hover:opacity-100">
                                                        <Globe size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">{pse.totalPoints} / {pse.maxCapacity} PTS</span>
                                                    <span className={`${pse.loadPercentage > 90 ? 'text-rose-500' : pse.loadPercentage > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{pse.loadPercentage}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${pse.loadPercentage > 90 ? 'bg-rose-500' : pse.loadPercentage > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pse.loadPercentage, 100)}%` }}></div>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                <span>{pse.activeProjectsCount} Proj</span>
                                                <span>{pse.activeLeadsCount} Lead</span>
                                                <span>{pse.activePartnersCount} Ptnr</span>
                                                <span className="ml-auto text-zinc-300">Max: {pse.maxCapacity || 30}pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: SALES STATS */}
                {activeTab === 'sales' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {(() => {
                            const salesData = SALES_TEAM.map(name => {
                                const activeLeads = (config.kanbanLeads || []).filter((l: any) => l.picSales === name && !['Freeze', 'Closed Lost'].includes(l.stage));
                                const wonLeads = (config.kanbanLeads || []).filter((l: any) => l.picSales === name && l.stage === 'Commercial Negotiation'); // Approaching Won
                                const activeProjects = (config.kanbanProjects || []).filter((p: any) => p.picSales === name && !['Freeze', 'Done', 'Lost'].includes(p.stage));
                                const activePartners = (config.kanbanPartners || []).filter((p: any) => p.picPartner === name && p.isActive !== false);

                                const potentialValue = activeLeads.reduce((acc: number, l: any) => acc + (Number(l.forecastedValue) || 0), 0);
                                const totalValue = activeProjects.reduce((acc: number, p: any) => acc + (Number(p.forecastedValue) || 0), 0);

                                return {
                                    name,
                                    activeLeads: activeLeads.length,
                                    wonLeads: wonLeads.length,
                                    activeProjects: activeProjects.length,
                                    activePartners: activePartners.length,
                                    potentialValue,
                                    totalValue
                                };
                            });

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {salesData.map(data => (
                                        <div key={data.name} className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                                                    <UserCheck size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-zinc-900 tracking-tight">{data.name}</h3>
                                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Sales Representative</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Leads</span>
                                                    <span className="text-sm font-black text-emerald-600">{data.activeLeads}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Projects</span>
                                                    <span className="text-sm font-black text-blue-600">{data.activeProjects}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Partners</span>
                                                    <span className="text-sm font-black text-purple-600">{data.activePartners}</span>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-zinc-100 space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Potential Value (Leads)</p>
                                                    <p className="text-lg font-mono font-black text-amber-600">IDR {(data.potentialValue / 1000000).toFixed(0)}M</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Secured Value (Projects)</p>
                                                    <p className="text-lg font-mono font-black text-emerald-600">IDR {(data.totalValue / 1000000).toFixed(0)}M</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* TAB 6: REVENUE DASHBOARD */}
                {activeTab === 'revenue' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {(() => {
                            const projects = config.kanbanProjects || [];
                            const leads = config.kanbanLeads || [];
                            
                            const totalRevenue = projects.reduce((acc: number, p: any) => acc + (Number(p.forecastedValue) || 0), 0);
                            const activeProjectsRev = projects.filter((p: any) => !['Done', 'Lost', 'Freeze'].includes(p.stage)).reduce((acc: number, p: any) => acc + (Number(p.forecastedValue) || 0), 0);
                            const doneProjectsRev = projects.filter((p: any) => p.stage === 'Done').reduce((acc: number, p: any) => acc + (Number(p.forecastedValue) || 0), 0);

                            const potentialRevenue = leads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, l: any) => acc + (Number(l.forecastedValue) || 0), 0);
                            const weightedPipeline = leads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, l: any) => acc + ((Number(l.forecastedValue) || 0) * (Number(l.probability) || 0)), 0);

                            const formatIDR = (val: number) => {
                                return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
                            };

                            return (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={64} /></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 relative z-10">Total Pipeline Value</p>
                                            <p className="text-2xl font-black font-mono text-zinc-900 relative z-10">{formatIDR(potentialRevenue)}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-2 relative z-10">All active leads & opportunities</p>
                                        </div>
                                        <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={64} /></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 relative z-10">Weighted Pipeline</p>
                                            <p className="text-2xl font-black font-mono text-emerald-600 relative z-10">{formatIDR(weightedPipeline)}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-2 relative z-10">Adjusted by probability %</p>
                                        </div>
                                        <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase size={64} /></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 relative z-10">Active Contracts Value</p>
                                            <p className="text-2xl font-black font-mono text-blue-600 relative z-10">{formatIDR(activeProjectsRev)}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-2 relative z-10">In-progress projects</p>
                                        </div>
                                        <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><CheckCircle size={64} /></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 relative z-10">Total Realized Revenue</p>
                                            <p className="text-2xl font-black font-mono text-emerald-600 relative z-10">{formatIDR(doneProjectsRev)}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-2 relative z-10">Completed & billed (Done stage)</p>
                                        </div>
                                    </div>

                                    {/* Visualization */}
                                    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 mt-6">
                                        <div className="mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Revenue Composition Overview</h3>
                                            <p className="text-[10px] font-bold text-zinc-400 mt-1">Comparison of potential, active, and realized value</p>
                                        </div>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Potential Pipeline', value: potentialRevenue, fill: '#f59e0b' },
                                                    { name: 'Active Contracts', value: activeProjectsRev, fill: '#3b82f6' },
                                                    { name: 'Realized Revenue', value: doneProjectsRev, fill: '#10b981' }
                                                ]} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                    <YAxis tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: '#f4f4f5' }} formatter={(val: any) => formatIDR(Number(val) || 0)} labelStyle={{ color: "#18181b", fontWeight: 900, fontSize: "12px", marginBottom: "8px" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Tables */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                                        {/* Potential Pipeline Table */}
                                        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Potential Revenue Pipeline</h3>
                                                    <p className="text-[10px] font-bold text-zinc-400 mt-1">From Active Leads</p>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto flex-1">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-white text-[9px] text-zinc-400 border-b border-zinc-100 font-black uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-6 py-4">Lead Name</th>
                                                            <th className="px-4 py-4">Stage</th>
                                                            <th className="px-4 py-4 text-right">Value (IDR)</th>
                                                            <th className="px-6 py-4 text-center">Prob.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-50">
                                                        {leads.filter((l: any) => l.forecastedValue > 0 && !['Closed Lost', 'Freeze'].includes(l.stage)).sort((a: any, b: any) => b.forecastedValue - a.forecastedValue).map((l: any) => (
                                                            <tr key={l.id} className="hover:bg-zinc-50 transition">
                                                                <td className="px-6 py-4 font-bold text-zinc-900">{l.name}</td>
                                                                <td className="px-4 py-4"><span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[9px] rounded font-black uppercase tracking-widest">{l.stage}</span></td>
                                                                <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">{formatIDR(l.forecastedValue)}</td>
                                                                <td className="px-6 py-4 text-center font-bold">{Math.round(l.probability * 100)}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Secured Revenue Table */}
                                        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Secured Contracts</h3>
                                                    <p className="text-[10px] font-bold text-zinc-400 mt-1">From Projects</p>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto flex-1">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-white text-[9px] text-zinc-400 border-b border-zinc-100 font-black uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-6 py-4">Project / Client</th>
                                                            <th className="px-4 py-4">Stage</th>
                                                            <th className="px-4 py-4 text-center">Close Date</th>
                                                            <th className="px-6 py-4 text-right">Value (IDR)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-50">
                                                        {projects.filter((p: any) => p.forecastedValue > 0 && !['Lost', 'Freeze'].includes(p.stage)).sort((a: any, b: any) => b.forecastedValue - a.forecastedValue).map((p: any) => (
                                                            <tr key={p.id} className="hover:bg-zinc-50 transition">
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-zinc-900">{p.projectName}</p>
                                                                    <p className="text-[9px] font-black uppercase text-zinc-400 mt-0.5">{p.client}</p>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <span className={`px-2 py-1 text-[9px] rounded font-black uppercase tracking-widest ${p.stage === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>{p.stage}</span>
                                                                </td>
                                                                <td className="px-4 py-4 text-center font-bold text-zinc-500">
                                                                    {p.closeDate ? new Date(p.closeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">{formatIDR(p.forecastedValue)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* ========== ADD PROJECT MODAL ========== */}
            {isAddingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">{editingItemId ? 'Edit Project' : 'Add New Project'}</h3>
                            <button onClick={() => setIsAddingProject(false)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Client Name</label><input type="text" value={newProject.client} onChange={(e) => setNewProject((p: any) => ({ ...p, client: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Project Name</label><input type="text" value={newProject.projectName} onChange={(e) => setNewProject((p: any) => ({ ...p, projectName: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                            </div>
                            
                            {/* CRM Fields for Project */}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Contact Name</label><input type="text" value={newProject.contactName || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, contactName: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Phone size={10} className="inline mr-1 -mt-0.5" />Contact Number</label><input type="text" value={newProject.contactNumber || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, contactNumber: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" /></div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PIC Sales</label>
                                    <select value={newProject.picSales || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, picSales: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Sales...</option>{SALES_TEAM.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PSE Assignee</label>
                                    <select value={newProject.pseId} onChange={(e) => setNewProject((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Stage</label>
                                    <select value={newProject.stage} onChange={(e) => {
                                        const stage = e.target.value;
                                        const prob = PROBABILITY_MAP[stage] ?? 0.4;
                                        setNewProject((p: any) => ({ ...p, stage, probability: prob, progress: Math.round(prob * 100) }));
                                    }} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        {KANBAN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><DollarSign size={10} className="inline mr-1 -mt-0.5" />Contract Value (IDR)</label>
                                    <input type="number" value={newProject.forecastedValue || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, forecastedValue: Number(e.target.value) }))} placeholder="0" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Calendar size={10} className="inline mr-1 -mt-0.5" />Close Date</label>
                                    <input type="date" value={newProject.closeDate || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, closeDate: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Next Step</label>
                                <input type="text" value={newProject.nextStep || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, nextStep: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" />
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
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-between items-center">
                            {editingItemId && editingItemType === 'Project' ? (
                                <button onClick={() => { handleDeleteData('Project', editingItemId); setIsAddingProject(false); }} className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-black uppercase rounded-xl transition-colors flex items-center gap-2">
                                    <Trash2 size={14} /> Delete
                                </button>
                            ) : <div></div>}
                            <button disabled={submitting} onClick={() => handleSaveData('Project', newProject, setNewProject, setIsAddingProject, () => setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, priority: 'Medium', notes: '', closeDate: '', probability: 0.4 }))} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase rounded-xl hover:bg-blue-700">{submitting ? 'Saving...' : editingItemId ? 'Update Project' : 'Save Project'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ADD LEAD MODAL (with CRM Fields) ========== */}
            {isAddingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">{editingItemId ? 'Edit Lead / CRM Entry' : 'Add Lead Support'}</h3>
                            <button onClick={() => setIsAddingLead(false)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Company / Lead Name</label><input type="text" value={newLead.name} onChange={(e) => setNewLead((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Contact Name</label><input type="text" value={newLead.contactName || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, contactName: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-900" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Mail size={10} className="inline mr-1 -mt-0.5" />Contact Email</label><input type="email" value={newLead.contactEmail || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, contactEmail: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Phone size={10} className="inline mr-1 -mt-0.5" />Contact Number</label><input type="text" value={newLead.contactNumber || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, contactNumber: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                            </div>

                            {/* Assignment */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PIC Sales</label>
                                    <select value={newLead.picSales || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, picSales: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Sales...</option>{SALES_TEAM.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PSE Support</label>
                                    <select value={newLead.pseId} onChange={(e) => setNewLead((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
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

                            {/* Stage & Commercials */}
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Lead Partner</label>
                                    <select value={newLead.partnerId || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, partnerId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">No Partner (Direct)</option>
                                        {config.kanbanPartners?.filter((ptnr: any) => ptnr.isActive !== false).map((ptnr: any) => (
                                            <option key={ptnr.id} value={ptnr.id}>{ptnr.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Current Stage</label>
                                    <select value={newLead.stage} onChange={(e) => {
                                        const stage = e.target.value;
                                        const prob = PROBABILITY_MAP[stage] ?? 0;
                                        setNewLead((p: any) => ({ ...p, stage, probability: prob, progress: Math.round(prob * 100) }));
                                    }} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        {PRESALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><DollarSign size={10} className="inline mr-1 -mt-0.5" />Forecasted Value (IDR)</label>
                                    <input type="number" value={newLead.forecastedValue || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, forecastedValue: Number(e.target.value) }))} placeholder="0" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Probability (%)</label>
                                    <div className="w-full p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-black text-zinc-500 cursor-not-allowed">
                                        {Math.round((newLead.probability || 0) * 100)}% (Auto)
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Calendar size={10} className="inline mr-1 -mt-0.5" />Demo Date</label><input type="date" value={newLead.demoDate || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, demoDate: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Calendar size={10} className="inline mr-1 -mt-0.5" />Expected Close</label><input type="date" value={newLead.expectedCloseDate || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, expectedCloseDate: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Last Interacted</label><input type="date" value={newLead.lastInteractedOn || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, lastInteractedOn: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">
                                    <span>Progress to Won</span>
                                    <span>{newLead.progress || 0}%</span>
                                </label>
                                <input type="range" min="0" max="100" value={newLead.progress || 0} onChange={(e) => setNewLead((p: any) => ({ ...p, progress: Number(e.target.value) }))} className="w-full accent-emerald-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            {/* Next Step & Notes */}
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Next Step</label><input type="text" value={newLead.nextStep || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, nextStep: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Proposal Link</label><input type="url" value={newLead.proposalLink || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, proposalLink: e.target.value }))} placeholder="https://..." className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Notes</label><textarea rows={1} value={newLead.notes || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-zinc-900"></textarea></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex flex-col gap-3">
                            <div className="flex justify-between items-center w-full">
                                {editingItemId && editingItemType === 'Lead' ? (
                                    <button onClick={() => { handleDeleteData('Lead', editingItemId); setIsAddingLead(false); }} className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-black uppercase rounded-xl transition-colors flex items-center gap-2">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                ) : <div></div>}
                                <button disabled={submitting} onClick={() => handleSaveData('Lead', newLead, setNewLead, setIsAddingLead, () => setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, priority: 'Medium', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '' }))} className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-700">{submitting ? 'Saving...' : editingItemId ? 'Update Lead' : 'Save Lead'}</button>
                            </div>
                            {editingItemId && editingItemType === 'Lead' && (
                                <button onClick={() => handleConvertToProject(newLead)} className="w-full py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Globe size={14} className="text-emerald-400" /> Convert to Active Project
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EDIT MEMBER SETTINGS MODAL ========== */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">Workload Settings</h3>
                            <button onClick={() => setEditingMember(null)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {!editingMember.isExisting && (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-widest">Login ID (Unique)</label><input type="text" placeholder="e.g. john_doe" value={editingMember.pseId} onChange={(e) => setEditingMember({ ...editingMember, pseId: e.target.value })} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium" /></div>
                                    <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-widest">Full Name</label><input type="text" placeholder="e.g. John Doe" value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium" /></div>
                                </div>
                            )}
                            {editingMember.isExisting && (
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 mb-1">{editingMember.name}</h4>
                                    <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Adjust resource capacity allocation</p>
                                </div>
                            )}
                            
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-3 uppercase tracking-widest">
                                    <span>Max Points Capacity</span>
                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{editingMember.maxCapacity} Pts</span>
                                </label>
                                <input type="range" min="5" max="50" step="5" value={editingMember.maxCapacity} onChange={(e) => setEditingMember({ ...editingMember, maxCapacity: Number(e.target.value) })} className="w-full accent-zinc-900 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <div>
                                    <p className="text-xs font-bold text-zinc-900">Active Status</p>
                                    <p className="text-[10px] text-zinc-400 font-medium">Show in assign lists</p>
                                </div>
                                <button onClick={() => setEditingMember({ ...editingMember, isActive: !editingMember.isActive })} className={`w-12 h-6 rounded-full transition-all relative ${editingMember.isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingMember.isActive ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end">
                            <button disabled={submitting} onClick={handleUpdateMember} className="w-full py-3 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition shadow-lg">
                                {submitting ? 'Updating...' : editingMember.isExisting ? 'Update Settings' : 'Add Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ADD PARTNER MODAL ========== */}
            {isAddingPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">{editingItemId ? 'Edit Partner' : 'Add Partner'}</h3>
                            <button onClick={() => setIsAddingPartner(false)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Partner Name</label><input type="text" value={newPartner.name} onChange={(e) => setNewPartner((p: any) => ({ ...p, name: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900" /></div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Contact Name</label><input type="text" value={newPartner.contactName || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, contactName: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900" /></div>
                                <div><label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase"><Phone size={10} className="inline mr-1 -mt-0.5" />Contact Number</label><input type="text" value={newPartner.contactNumber || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, contactNumber: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900" /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PIC Sales</label>
                                    <select value={newPartner.picPartner || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, picPartner: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Sales...</option>{SALES_TEAM.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">PIC (PSE)</label>
                                    <select value={newPartner.pseId} onChange={(e) => setNewPartner((p: any) => ({ ...p, pseId: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select...</option>{config.pseWorkloads?.map(pse => <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>)}
                                    </select>
                                </div>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Next Step</label>
                                    <input type="text" value={newPartner.nextStep || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, nextStep: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Notes</label>
                                    <textarea rows={1} value={newPartner.notes || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium text-zinc-900"></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-between items-center">
                            {editingItemId && editingItemType === 'Partner' ? (
                                <button onClick={() => { handleDeleteData('Partner', editingItemId); setIsAddingPartner(false); }} className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-black uppercase rounded-xl transition-colors flex items-center gap-2">
                                    <Trash2 size={14} /> Delete
                                </button>
                            ) : <div></div>}
                            <button disabled={submitting} onClick={() => handleSaveData('Partner', newPartner, setNewPartner, setIsAddingPartner, () => setNewPartner({ name: '', pseId: '', type: 'Technology', stage: 'Sourcing', progress: 0, priority: 'Medium', notes: '' }))} className="px-6 py-2.5 bg-purple-600 text-white text-xs font-black uppercase rounded-xl hover:bg-purple-700">{submitting ? 'Saving...' : editingItemId ? 'Update Partner' : 'Save Partner'}</button>
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
            {/* ========== POINTS INFO MODAL (INDONESIA) ========== */}
            {showPointsInfo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 mb-1">Aturan Bobot Kerja (Points)</h3>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sistem Transparansi Beban Kerja PSE</p>
                                </div>
                                <button onClick={() => setShowPointsInfo(false)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <div className="space-y-6">
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    Beban kerja setiap anggota tim dihitung berdasarkan poin. Setiap tipe tugas memiliki **Bobot Dasar**, yang kemudian dikalikan dengan **Prioritas** tugas tersebut.
                                </p>

                                <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="bg-zinc-100/50 border-b border-zinc-200">
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Tipe Tugas</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Low (0.5x)</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Med (1.0x)</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">High (1.5x)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/50 font-bold text-zinc-700">
                                            <tr>
                                                <td className="px-4 py-3 bg-blue-50/30 text-blue-700">Project (3 pts)</td>
                                                <td className="px-4 py-3 text-center">1.5</td>
                                                <td className="px-4 py-3 text-center bg-blue-50/50">3.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">4.5</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-emerald-50/30 text-emerald-700">Lead (1 pt)</td>
                                                <td className="px-4 py-3 text-center">0.5</td>
                                                <td className="px-4 py-3 text-center bg-emerald-50/50">1.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">1.5</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-purple-50/30 text-purple-700">Partner (1 pt)</td>
                                                <td className="px-4 py-3 text-center">0.5</td>
                                                <td className="px-4 py-3 text-center bg-purple-50/50">1.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">1.5</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><Target size={14} /></div>
                                    <div>
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight mb-0.5">Kapasitas Maksimal (Limit)</p>
                                        <p className="text-[11px] text-blue-700 leading-tight">Secara default, setiap PSE memiliki limit 30 poin. Status **Freeze**, **Done**, dan **Lost** tidak akan menambah beban poin.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => setShowPointsInfo(false)} className="w-full mt-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl">Dimengerti</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}