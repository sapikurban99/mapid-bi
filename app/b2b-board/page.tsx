'use client';
import { useEffect, useState, useMemo } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, SiteConfig, setConfig } from '../lib/config';
import { Globe, Loader2, Plus, X, Briefcase, Users, Target, BarChart3, Trash2, HelpCircle, Search, Filter, ChevronDown, ExternalLink, Phone, Mail, DollarSign, Calendar, UserCheck, CheckCircle, Activity, Zap, Info, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import ReactMarkdown from 'react-markdown';

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

const QuickNoteInput = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
    const [val, setVal] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); if (val.trim()) { onSubmit(val); setVal(''); } }} className="mt-2 flex gap-1.5 pt-2 border-t border-zinc-100">
            <input type="text" value={val} onChange={e => setVal(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Add quick note..." className="flex-1 text-[9px] px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium text-zinc-800" />
            <button type="submit" onClick={e => e.stopPropagation()} className="px-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">Add</button>
        </form>
    );
};

const NotesViewer = ({ notes, colorClass = 'bg-zinc-50' }: { notes: string, colorClass?: string }) => {
    const [open, setOpen] = useState(false);
    if (!notes) return null;
    const noteLines = notes.split('\n');
    
    return (
        <div className="mb-2">
            <div className={`text-[9px] text-zinc-500 space-y-1`}>
                {noteLines.slice(0, 1).map((n, i) => (
                    <div key={i} className={`${colorClass} px-2 py-1.5 rounded-md leading-tight truncate`}>{n}</div>
                ))}
            </div>
            {(noteLines.length > 1 || notes.length > 50) && (
                <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="text-[9px] font-black text-blue-500 mt-1 uppercase hover:underline text-left">View all notes</button>
            )}
            
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Note History</h3>
                            <button onClick={() => setOpen(false)} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={14} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2">
                            {noteLines.map((n, i) => (
                                <div key={i} className={`${colorClass} p-3 rounded-xl text-xs leading-relaxed text-zinc-700`}>{n}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SALES_TEAM = ['Titan', 'Rani'];

// --- Project Type helpers (data=1x, dev=3x, survey=3x) ---
const PROJECT_TYPES = ['data', 'dev', 'survey'] as const;
type ProjectType = typeof PROJECT_TYPES[number];

const getTypeMultiplier = (type?: string) => {
    const t = (type || 'data').toLowerCase();
    if (t === 'dev' || t === 'survey') return 3.0;
    return 1.0;
};

const getTypeStyle = (type?: string) => {
    const t = (type || 'data').toLowerCase();
    if (t === 'dev') return { bar: 'bg-rose-500', text: 'text-rose-500', chip: 'bg-rose-100 text-rose-700', label: 'DEV', mult: '3x' };
    if (t === 'survey') return { bar: 'bg-rose-500', text: 'text-rose-500', chip: 'bg-amber-100 text-amber-700', label: 'SURVEY', mult: '3x' };
    return { bar: 'bg-blue-400', text: 'text-blue-500', chip: 'bg-blue-100 text-blue-700', label: 'DATA', mult: '1x' };
};

// --- Sub-components (Cards) ---
const ProjectCard = ({ project: p, onEdit, onDelete, getPseName, onAddNote, onEmailStatus }: any) => {
    const isDone = p.stage === 'Done';
    const isLost = p.stage === 'Lost';
    const isFrozen = p.stage === 'Freeze';
    const hasValue = p.forecastedValue && p.forecastedValue > 0;
    const tStyle = getTypeStyle(p.projectType);
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('projectId', p.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isDone ? 'bg-emerald-50 border-emerald-200' : isLost ? 'bg-rose-50 border-rose-200' : isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDone ? 'bg-emerald-500' : isLost ? 'bg-rose-500' : isFrozen ? 'bg-slate-400' : tStyle.bar}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDone ? 'bg-emerald-100 text-emerald-600' : isLost ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}><Briefcase size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Project', p.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md whitespace-nowrap inline-block ${isDone ? 'bg-emerald-200 text-emerald-800' : isLost ? 'bg-rose-200 text-rose-800' : isFrozen ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'}`}>{p.stage}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${tStyle.chip}`}>{tStyle.label} · {tStyle.mult}</span>
                    <button onClick={(e) => { e.stopPropagation(); onEmailStatus('Project', p); }} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-blue-600 transition-colors mt-0.5 flex items-center gap-0.5"><Mail size={8} /> Email</button>
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

                {(p.closeQuarter || p.closeYear) && (
                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg w-fit">
                        <Clock size={10} /> Target: {p.closeQuarter || ''} {p.closeYear || ''}
                    </div>
                )}

                {p.proposalLink && (
                    <button onClick={(e) => { e.stopPropagation(); window.open(p.proposalLink, '_blank'); }} className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg w-fit transition-colors">
                        <ExternalLink size={10} /> Open Document
                    </button>
                )}

                {p.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {p.nextStep}</p>}
                
                {p.notes && <NotesViewer notes={p.notes} colorClass="bg-zinc-50" />}
                <div className="flex flex-col border-t border-zinc-50 pt-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5">
                        <span className="text-zinc-400">Progress</span>
                        <span className={isDone ? 'text-emerald-500' : 'text-blue-500'}>{p.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.progress || 0}%` }}></div>
                    </div>
                </div>
                <QuickNoteInput onSubmit={(val) => onAddNote('Project', p, val)} />
            </div>
        </div>
    );
};

const LeadCard = ({ lead: l, onEdit, onDelete, getPseName, getStageColor, onAddNote, onEmailStatus }: any) => {
    const isLost = l.stage === 'Closed Lost';
    const isFrozen = l.stage === 'Freeze';
    const hasValue = l.forecastedValue && l.forecastedValue > 0;
    const tStyle = getTypeStyle(l.projectType);
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('leadId', l.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isLost ? 'bg-rose-50 border-rose-200' : isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isLost ? 'bg-rose-500' : isFrozen ? 'bg-slate-400' : tStyle.bar}`}></div>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLost ? 'bg-rose-100 text-rose-600' : isFrozen ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}><Target size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Lead', l.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border whitespace-nowrap inline-block ${isLost ? 'bg-rose-200 text-rose-800' : isFrozen ? 'bg-slate-200 text-slate-800 border-slate-300' : getStageColor(l.stage)}`}>{l.stage}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${tStyle.chip}`}>{tStyle.label} · {tStyle.mult}</span>
                    <button onClick={(e) => { e.stopPropagation(); onEmailStatus('Lead', l); }} className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-600 transition-colors mt-0.5 flex items-center gap-0.5"><Mail size={8} /> Email</button>
                </div>
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
                {l.demoDate && (
                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg w-fit">
                        <Calendar size={10} /> Demo: {new Date(l.demoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                )}

                {(l.closeQuarter || l.closeYear) && (
                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg w-fit">
                        <Clock size={10} /> Target: {l.closeQuarter || ''} {l.closeYear || ''}
                    </div>
                )}

                {/* Next Step */}
                {l.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {l.nextStep}</p>}
                
                {l.proposalLink && (
                    <button onClick={(e) => { e.stopPropagation(); window.open(l.proposalLink, '_blank'); }} className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg w-fit transition-colors">
                        <ExternalLink size={10} /> Open Document
                    </button>
                )}

                {l.notes && <NotesViewer notes={l.notes} colorClass="bg-emerald-50/50" />}
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
                <QuickNoteInput onSubmit={(val) => onAddNote('Lead', l, val)} />
            </div>
        </div>
    );
};

const PartnerCard = ({ partner: p, onEdit, onDelete, getPseName, getStageColor, onAddNote }: any) => {
    const isFrozen = p.stage === 'Freeze';
    const tStyle = getTypeStyle(p.projectType);
    return (
        <div draggable onDragStart={(e) => e.dataTransfer.setData('partnerId', p.id)}
            className={`border shadow-sm hover:shadow-md p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${isFrozen ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-zinc-200'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isFrozen ? 'bg-slate-400' : tStyle.bar}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isFrozen ? 'bg-slate-100 text-slate-600' : 'bg-purple-50 text-purple-600'}`}><Users size={14} /></div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete('Partner', p.id); }} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
                <div className="text-right flex flex-col gap-1 items-end">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border whitespace-nowrap ${isFrozen ? 'bg-slate-200 text-slate-800 border-slate-300' : getStageColor(p.stage || 'Sourcing')}`}>{p.stage || 'Sourcing'}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${tStyle.chip}`}>{tStyle.label} · {tStyle.mult}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isFrozen ? 'text-slate-400' : 'text-purple-400'}`}>{p.type}</span>
                </div>
            </div>
            <div onClick={() => onEdit('Partner', p)}>
                <h3 className="font-bold text-purple-950 text-base mb-1">{p.name}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                    {p.picPartner && <p className="text-[10px] font-black text-amber-600/80 uppercase tracking-widest"><UserCheck size={9} className="inline mr-0.5 -mt-0.5" /> Sales: <span className="text-amber-800">{p.picPartner}</span></p>}
                </div>

                {(p.contactName || p.contactNumber) && (
                    <div className="flex items-center gap-2 mb-2 text-[9px] text-zinc-400 font-bold">
                        {p.contactName && <span className="truncate max-w-[120px]">{p.contactName}</span>}
                        {p.contactNumber && <span className="flex items-center gap-0.5"><Phone size={8} /> {p.contactNumber.substring(0, 15)}</span>}
                    </div>
                )}

                {p.nextStep && <p className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-2 line-clamp-2 italic">&rarr; {p.nextStep}</p>}
                
                {p.notes && <NotesViewer notes={p.notes} colorClass="bg-purple-50/50" />}
                
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
                <QuickNoteInput onSubmit={(val) => onAddNote('Partner', p, val)} />
            </div>
        </div>
    );
};

export default function B2BBoardPage() {
    const { syncData, isLoading: globalIsLoading } = useGlobalData();
    const [config, setLocalConfig] = useState<SiteConfig | null>(null);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'leads' | 'partners' | 'stats' | 'sales' | 'calendar'>('projects');
    const [showArchived, setShowArchived] = useState(false);
    const [showPointsInfo, setShowPointsInfo] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pseDetailModal, setPseDetailModal] = useState<{ pseId: string; name: string; tab: 'projects' | 'leads' } | null>(null);
    const [emailStatusModal, setEmailStatusModal] = useState<{ clientName: string; itemType: 'Project' | 'Lead'; itemId: string } | null>(null);
    const [clientRawEmails, setClientRawEmails] = useState<any[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);


    // Dynamic filter state: Record<columnName, selectedValues[]>
    const [filters, setFilters] = useState<Record<string, string[]>>({});

    // === Calendar States & Logic ===
    const [calendarData, setCalendarData] = useState<{ agendas: any[], externalEvents: any[] }>({ agendas: [], externalEvents: [] });
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [currentCalDate, setCurrentCalDate] = useState(() => new Date());
    const [isAddingAgenda, setIsAddingAgenda] = useState(false);
    const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
    const [newAgenda, setNewAgenda] = useState({ title: '', description: '', startDate: '', endDate: '', startTime: '', endTime: '', attachmentLink: '', syncToPrivateEmail: false });
    const [submittingCalendar, setSubmittingCalendar] = useState(false);
    const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any>(null);
    const [calendarFilter, setCalendarFilter] = useState<string>('all');

    const fetchCalendar = async () => {
        setLoadingCalendar(true);
        try {
            const res = await fetch('/api/bi/calendar');
            const data = await res.json();
            if (data.success) {
                setCalendarData({ agendas: data.agendas || [], externalEvents: data.externalEvents || [] });
            }
        } catch (error) {
            console.error('Failed to fetch calendar:', error);
        } finally {
            setLoadingCalendar(false);
        }
    };

    const fetchEmailUpdates = async (clientName: string) => {
        setLoadingEmails(true);
        setClientRawEmails([]);
        setAiSummary(null);
        try {
            const res = await fetch(`/api/bi/email-updates?client=${encodeURIComponent(clientName)}`);
            const data = await res.json();
            if (data.success) {
                setClientRawEmails(data.raw_emails || []);
            }
        } catch (error) {
            console.error('Failed to fetch email updates:', error);
        } finally {
            setLoadingEmails(false);
        }
    };

    const handleGenerateSummary = async (clientName: string) => {
        if (clientRawEmails.length === 0) return;
        setIsSummarizing(true);
        setAiSummary(null);
        try {
            const res = await fetch('/api/bi/ai-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: clientRawEmails, clientName })
            });
            const data = await res.json();
            if (data.success) {
                setAiSummary(data.summary);
            } else {
                alert('Failed to generate summary: ' + data.message);
            }
        } catch (error) {
            console.error('AI Summary Error:', error);
            alert('Failed to generate summary due to a network error.');
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'calendar') {
            fetchCalendar();
        }
    }, [activeTab]);

    const handleSaveAgenda = async () => {
        if (!newAgenda.title || !newAgenda.startDate) {
            alert('Title and Start Date are required!');
            return;
        }
        setSubmittingCalendar(true);
        try {
            const method = editingAgendaId ? 'PUT' : 'POST';
            const payload = editingAgendaId ? { id: editingAgendaId, ...newAgenda } : newAgenda;
            const res = await fetch('/api/bi/calendar', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                setIsAddingAgenda(false);
                setEditingAgendaId(null);
                setNewAgenda({ title: '', description: '', startDate: '', endDate: '', startTime: '', endTime: '', attachmentLink: '', syncToPrivateEmail: false });
                fetchCalendar();
            } else {
                alert('Failed to save: ' + result.message);
            }
        } catch (error: any) {
            alert('Error saving agenda: ' + error.message);
        } finally {
            setSubmittingCalendar(false);
        }
    };

    const handleDeleteAgenda = async (id: string) => {
        if (!confirm('Are you sure you want to delete this agenda?')) return;
        try {
            const res = await fetch(`/api/bi/calendar?id=${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                fetchCalendar();
            } else {
                alert('Failed to delete: ' + result.message);
            }
        } catch (error: any) {
            alert('Error deleting agenda: ' + error.message);
        }
    };

    const combinedEvents = useMemo(() => {
        const list: any[] = [];
        
        // 1. Supabase agendas
        calendarData.agendas.forEach(a => {
            const timeStr = a.start_time ? a.start_time.substring(0, 5) : '';
            const displayTitle = timeStr ? `[${timeStr}] ${a.title}` : a.title;
            list.push({
                id: `agenda-${a.id}`,
                rawId: a.id,
                title: displayTitle,
                description: a.description,
                startDate: a.start_date,
                endDate: a.end_date || a.start_date,
                startTime: a.start_time,
                endTime: a.end_time,
                attachmentLink: a.attachment_link,
                syncToPrivateEmail: a.sync_to_private_email,
                type: 'agenda',
                color: 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 font-extrabold shadow-sm',
                badgeColor: 'bg-indigo-300',
            });
        });

        // 2. PrivateEmail external events
        calendarData.externalEvents.forEach((e, idx) => {
            const startDay = e.startDate ? e.startDate.split('T')[0] : '';
            const endDay = e.endDate ? e.endDate.split('T')[0] : startDay;
            let timeStr = '';
            if (e.startDate && e.startDate.includes('T')) {
                const parts = e.startDate.split('T');
                if (parts[1]) {
                    timeStr = parts[1].substring(0, 5);
                }
            }
            const displayTitle = timeStr ? `[${timeStr}] ${e.title}` : e.title;
            list.push({
                id: `ext-${idx}`,
                title: displayTitle,
                description: e.description,
                startDate: startDay,
                endDate: endDay,
                type: 'external',
                color: 'bg-amber-500 text-amber-950 border-amber-600 hover:bg-amber-600 font-extrabold shadow-sm',
                badgeColor: 'bg-amber-300',
            });
        });

        // 3. Leads dates from config?.kanbanLeads
        const leads = config?.kanbanLeads || [];
        leads.forEach(l => {
            if (l.demoDate) {
                list.push({
                    id: `lead-demo-${l.id}`,
                    title: `📞 Demo: ${l.name}`,
                    description: `PIC Sales: ${l.picSales || '-'}\nExpected Close: ${l.expectedCloseDate || '-'}`,
                    startDate: l.demoDate,
                    endDate: l.demoDate,
                    type: 'lead-demo',
                    color: 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 font-extrabold shadow-sm',
                    badgeColor: 'bg-rose-300',
                });
            }
            if (l.lastInteractedOn) {
                list.push({
                    id: `lead-interacted-${l.id}`,
                    title: `💬 Interacted: ${l.name}`,
                    description: `Next Step: ${l.nextStep || '-'}`,
                    startDate: l.lastInteractedOn,
                    endDate: l.lastInteractedOn,
                    type: 'lead-interacted',
                    color: 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 font-extrabold shadow-sm',
                    badgeColor: 'bg-emerald-300',
                });
            }
            if (l.expectedCloseDate) {
                list.push({
                    id: `lead-close-${l.id}`,
                    title: `💰 Close Deal: ${l.name}`,
                    description: `Forecasted Value: IDR ${(Number(l.forecastedValue || 0) / 1000000).toFixed(0)}M\nProbability: ${(Number(l.probability || 0) * 100).toFixed(0)}%`,
                    startDate: l.expectedCloseDate,
                    endDate: l.expectedCloseDate,
                    type: 'lead-close',
                    color: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 font-extrabold shadow-sm',
                    badgeColor: 'bg-blue-300',
                });
            }
        });

        const filteredList = list.filter(item => {
            if (calendarFilter === 'all') return true;
            if (calendarFilter === 'agenda') return item.type === 'agenda';
            if (calendarFilter === 'external') return item.type === 'external';
            if (calendarFilter === 'leads') return item.type.startsWith('lead-');
            return true;
        });
        return filteredList;
    }, [calendarData, config?.kanbanLeads, calendarFilter]);

    const calendarGrid = useMemo(() => {
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const daysInMonth = lastDayOfMonth.getDate();

        const grid = [];
        // Pad previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            grid.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                dateStr: new Date(year, month - 1, prevMonthLastDay - i).toISOString().split('T')[0]
            });
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({
                day: i,
                isCurrentMonth: true,
                dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }
        // Pad next month days to make multiple of 7
        const totalCells = Math.ceil(grid.length / 7) * 7;
        const remaining = totalCells - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({
                day: i,
                isCurrentMonth: false,
                dateStr: new Date(year, month + 1, i).toISOString().split('T')[0]
            });
        }
        return grid;
    }, [currentCalDate]);

    // Modals State
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [isAddingLead, setIsAddingLead] = useState(false);
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Forms State
    const [newProject, setNewProject] = useState<any>({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, projectType: 'data', notes: '', picSales: '', contactName: '', contactNumber: '', forecastedValue: 0, nextStep: '', probability: 0.4, closeYear: '', closeQuarter: '', closeDate: '' });
    const [newLead, setNewLead] = useState<any>({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, projectType: 'data', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '', partnerId: '', closeYear: '', closeQuarter: '' });
    const [newPartner, setNewPartner] = useState<any>({ name: '', type: 'Technology', projectType: 'data', stage: 'Sourcing', progress: 0, notes: '', picPartner: '', contactName: '', contactNumber: '', nextStep: '' });

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
            projectTypes: ['data', 'dev', 'survey'],
            pse: [...new Set(projects.map((p: any) => getPseName(p.pseId)).filter(Boolean))].sort(),
            clients: [...new Set(projects.map((p: any) => p.client).filter(Boolean))].sort(),
        };
    }, [config?.kanbanProjects]);

    const getUniqueLeadValues = useMemo(() => {
        const leads = config?.kanbanLeads || [];
        return {
            stages: [...new Set(leads.map((l: any) => l.stage))].sort(),
            projectTypes: ['data', 'dev', 'survey'],
            pse: [...new Set(leads.map((l: any) => getPseName(l.pseId)).filter(Boolean))].sort(),
            picSales: [...new Set(leads.map((l: any) => l.picSales).filter(Boolean))].sort(),
            companies: [...new Set(leads.map((l: any) => l.name).filter(Boolean))].sort(),
        };
    }, [config?.kanbanLeads]);

    const getUniquePartnerValues = useMemo(() => {
        const partners = config?.kanbanPartners || [];
        return {
            stages: [...new Set(partners.map((p: any) => p.stage || 'Sourcing'))].sort(),
            projectTypes: ['data', 'dev', 'survey'],
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
            if (filters.projectType && !filters.projectType.includes(p.projectType || 'data')) return false;
            if (filters.pse && !filters.pse.includes(getPseName(p.pseId))) return false;
            if (filters.client && !filters.client.includes(p.client)) return false;
            if (!matchesSearch(p)) return false;
            return true;
        }) || [];
    };

    const getFilteredLeads = (stage: string) => {
        return config?.kanbanLeads?.filter((l: any) => {
            if (l.stage !== stage) return false;
            if (filters.projectType && !filters.projectType.includes(l.projectType || 'data')) return false;
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
            if (filters.projectType && !filters.projectType.includes(p.projectType || 'data')) return false;
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

    const handleAddNote = async (type: 'Project' | 'Lead' | 'Partner', item: any, noteText: string) => {
        const timestamp = new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const formattedNote = `[${timestamp}] ${noteText}`;
        const newNotes = item.notes ? `${formattedNote}\n${item.notes}` : formattedNote;
        
        const endpoint = `editKanban${type}`;
        fetch('/api/bi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: endpoint, id: item.id, ...item, notes: newNotes })
        });
        
        setLocalConfig((prev: any) => {
            if (!prev) return prev;
            const n = JSON.parse(JSON.stringify(prev));
            const arrayName = type === 'Project' ? 'kanbanProjects' : type === 'Lead' ? 'kanbanLeads' : 'kanbanPartners';
            const target = n[arrayName].find((x: any) => x.id === item.id);
            if (target) target.notes = newNotes;
            setConfig({ [arrayName]: n[arrayName] });
            return n;
        });
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
                projectType: lead.projectType || 'data',
                notes: lead.notes || '',
                closeYear: lead.closeYear || '',
                closeQuarter: lead.closeQuarter || '',
                picSales: lead.picSales || '',
                contactName: lead.contactName || '',
                contactNumber: lead.contactNumber || '',
                forecastedValue: Number(lead.forecastedValue) || 0,
                nextStep: lead.nextStep || '',
                probability: lead.probability || 0.4,
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

    const handleUpdateMaxCapacity = async (pseId: string, maxCapacity: number) => {
        const newVal = Math.max(1, Math.min(100, maxCapacity || 1));
        setLocalConfig((prev: any) => {
            if (!prev) return prev;
            const n = JSON.parse(JSON.stringify(prev));
            const idx = n.pseWorkloads?.findIndex((m: any) => m.pseId === pseId);
            if (idx > -1) n.pseWorkloads[idx].maxCapacity = newVal;
            setConfig({ pseWorkloads: n.pseWorkloads });
            return n;
        });
        try {
            await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updatePseMember', pseId, maxCapacity: newVal }),
            });
            syncData({ silent: true });
        } catch {
            // silently fail, optimistic update already applied
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 font-sans">
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
                        <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><Calendar size={14} /> Calendar</button>
                        <div className="w-px h-6 bg-zinc-200 mx-1"></div>
                        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><BarChart3 size={14} /> PSE</button>
                        <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}><UserCheck size={14} /> Sales</button>
                    </div>
                </div>
            </header>


            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-8">
                {/* GLOBAL ACTION BAR */}
                <div className="flex justify-between items-center mb-6 animate-in fade-in duration-300">
                    <div>
                        {activeTab === 'projects' && <button onClick={() => { setEditingItemId(null); setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, projectType: 'data', notes: '', closeYear: '', closeQuarter: '', closeDate: '' }); setIsAddingProject(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-blue-600 text-white hover:bg-blue-700"><Plus size={14} /> Add Project</button>}
                        {activeTab === 'leads' && <button onClick={() => { setEditingItemId(null); setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, projectType: 'data', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '', closeYear: '', closeQuarter: '' }); setIsAddingLead(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-emerald-600 text-white hover:bg-emerald-700"><Plus size={14} /> Add Lead Support</button>}
                        {activeTab === 'partners' && <button onClick={() => { setEditingItemId(null); setNewPartner({ name: '', type: 'Technology', projectType: 'data', stage: 'Sourcing', progress: 0, notes: '', picPartner: '', contactName: '', contactNumber: '', nextStep: '' }); setIsAddingPartner(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-purple-600 text-white hover:bg-purple-700"><Plus size={14} /> Add Partner</button>}
                        {activeTab === 'stats' && <button onClick={() => setEditingMember({ pseId: '', name: '', maxCapacity: 30, isActive: true, isExisting: false })} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-zinc-900 text-white hover:bg-zinc-800"><Plus size={14} /> Add PSE Member</button>}
                        {activeTab === 'calendar' && <button onClick={() => { setNewAgenda({ title: '', description: '', startDate: '', endDate: '', startTime: '', endTime: '', attachmentLink: '', syncToPrivateEmail: false }); setIsAddingAgenda(true); }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-indigo-600 text-white hover:bg-indigo-700"><Plus size={14} /> Add Agenda</button>}
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
                                    <FilterChipDropdown label="Type" options={getUniqueProjectValues.projectTypes} selected={filters.projectType || []} onChange={(v) => updateFilter('projectType', v)} color="rose" />
                                    <FilterChipDropdown label="PSE" options={getUniqueProjectValues.pse} selected={filters.pse || []} onChange={(v) => updateFilter('pse', v)} color="zinc" />
                                    <FilterChipDropdown label="Client" options={getUniqueProjectValues.clients} selected={filters.client || []} onChange={(v) => updateFilter('client', v)} color="purple" />
                                </>
                            )}
                            {activeTab === 'leads' && (
                                <>
                                    <FilterChipDropdown label="Stage" options={getUniqueLeadValues.stages} selected={filters.stage || []} onChange={(v) => updateFilter('stage', v)} color="emerald" />
                                    <FilterChipDropdown label="Type" options={getUniqueLeadValues.projectTypes} selected={filters.projectType || []} onChange={(v) => updateFilter('projectType', v)} color="rose" />
                                    <FilterChipDropdown label="PSE" options={getUniqueLeadValues.pse} selected={filters.pse || []} onChange={(v) => updateFilter('pse', v)} color="zinc" />
                                    <FilterChipDropdown label="PIC Sales" options={getUniqueLeadValues.picSales} selected={filters.picSales || []} onChange={(v) => updateFilter('picSales', v)} color="amber" />
                                    <FilterChipDropdown label="Company" options={getUniqueLeadValues.companies} selected={filters.company || []} onChange={(v) => updateFilter('company', v)} color="blue" />
                                </>
                            )}
                            {activeTab === 'partners' && (
                                <>
                                    <FilterChipDropdown label="Stage" options={getUniquePartnerValues.stages} selected={filters.stage || []} onChange={(v) => updateFilter('stage', v)} color="purple" />
                                    <FilterChipDropdown label="Type" options={getUniquePartnerValues.projectTypes} selected={filters.projectType || []} onChange={(v) => updateFilter('projectType', v)} color="rose" />
                                    <FilterChipDropdown label="Partner Type" options={getUniquePartnerValues.types} selected={filters.type || []} onChange={(v) => updateFilter('type', v)} color="amber" />
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
                                            const prob = PROBABILITY_MAP[stage] ?? 0.4;
                                            const newProgress = Math.round(prob * 100);
                                            let fullProject: any = null;
                                            setLocalConfig(prev => {
                                                if (!prev) return prev;
                                                const n = JSON.parse(JSON.stringify(prev));
                                                const p = n.kanbanProjects?.find((x: any) => x.id === projectId);
                                                if (p) {
                                                    p.stage = stage;
                                                    p.progress = newProgress;
                                                    fullProject = { ...p };
                                                }
                                                setConfig({ kanbanProjects: n.kanbanProjects });
                                                return n;
                                            });
                                            if (fullProject) {
                                                fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'editKanbanProject', id: projectId, ...fullProject }) }).catch(() => alert("Fail update"));
                                            }
                                        }
                                    }}
                                >
                                    <div className="p-4 border-b border-zinc-200/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-zinc-600">
                                        {stage}
                                        <span className="bg-white border border-zinc-200 text-zinc-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredProjects(stage).length}</span>
                                    </div>
                                    <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                        {getFilteredProjects(stage).map((p: any) => <ProjectCard key={p.id} project={p} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} onAddNote={handleAddNote} onEmailStatus={(type: string, item: any) => { setEmailStatusModal({ clientName: item.client || item.projectName, itemType: type as 'Project' | 'Lead', itemId: item.id }); fetchEmailUpdates(item.client || item.projectName); }} />)}
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
                                            const prob = PROBABILITY_MAP[stage] ?? 0;
                                            const newProgress = Math.round(prob * 100);
                                            let fullLead: any = null;
                                            setLocalConfig(prev => {
                                                if (!prev) return prev;
                                                const n = JSON.parse(JSON.stringify(prev));
                                                const p = n.kanbanLeads?.find((x: any) => x.id === leadId);
                                                if (p) {
                                                    p.stage = stage;
                                                    p.progress = newProgress;
                                                    p.probability = prob;
                                                    fullLead = { ...p };
                                                }
                                                setConfig({ kanbanLeads: n.kanbanLeads });
                                                return n;
                                            });
                                            if (fullLead) {
                                                fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'editKanbanLead', id: leadId, ...fullLead }) }).catch(() => alert("Fail update"));
                                            }
                                        }
                                    }}
                                >
                                    <div className="p-4 border-b border-emerald-100/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-emerald-800">
                                        {stage}
                                        <span className="bg-white border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredLeads(stage).length}</span>
                                    </div>
                                    <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                        {getFilteredLeads(stage).map((l: any) => <LeadCard key={l.id} lead={l} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} getStageColor={getStageColor} onAddNote={handleAddNote} onEmailStatus={(type: string, item: any) => { setEmailStatusModal({ clientName: item.name, itemType: type as 'Project' | 'Lead', itemId: item.id }); fetchEmailUpdates(item.name); }} />)}
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
                                            let fullPartner: any = null;
                                            setLocalConfig(prev => {
                                                if (!prev) return prev;
                                                const n = JSON.parse(JSON.stringify(prev));
                                                const p = n.kanbanPartners?.find((x: any) => x.id === partnerId);
                                                if (p) {
                                                    p.stage = stage;
                                                    // Add progress mapping for partners if needed, else ignore
                                                    fullPartner = { ...p };
                                                }
                                                setConfig({ kanbanPartners: n.kanbanPartners });
                                                return n;
                                            });
                                            if (fullPartner) {
                                                fetch('/api/bi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'editKanbanPartner', id: partnerId, ...fullPartner }) }).catch(() => alert("Fail update"));
                                            }
                                        }
                                    }}
                                >
                                    <div className="p-4 border-b border-purple-200/60 bg-white/50 rounded-t-3xl font-black text-[11px] uppercase tracking-widest flex justify-between items-center text-purple-800">
                                        {stage}
                                        <span className="bg-white border border-purple-200 text-purple-900 px-2 py-0.5 rounded-md text-[10px] shadow-sm">{getFilteredPartners(stage).length}</span>
                                    </div>
                                    <div className="p-3 flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                        {getFilteredPartners(stage).map((p: any) => <PartnerCard key={p.id} partner={p} onEdit={openEditModal} onDelete={handleDeleteData} getPseName={getPseName} getStageColor={getStageColor} onAddNote={handleAddNote} />)}
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
                                            <Bar dataKey="activeLeads" name="Leads (Weight)" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
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
                                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter flex items-center gap-1">
                                                        {pse.totalPoints || 0} /
                                                        <input
                                                            type="number"
                                                            value={pse.maxCapacity || 0}
                                                            onChange={(e) => handleUpdateMaxCapacity(pse.pseId, Number(e.target.value))}
                                                            className="w-10 text-center bg-zinc-100 border border-zinc-200 hover:border-zinc-400 rounded-md px-1 py-0.5 text-[10px] font-black text-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-300 outline-none transition"
                                                            min={1}
                                                            max={100}
                                                        />
                                                        PTS
                                                    </span>
                                                    <span className={`${pse.loadPercentage > 90 ? 'text-rose-500' : pse.loadPercentage > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{pse.loadPercentage}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${pse.loadPercentage > 90 ? 'bg-rose-500' : pse.loadPercentage > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pse.loadPercentage, 100)}%` }}></div>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                <button onClick={() => setPseDetailModal({ pseId: pse.pseId, name: pse.name, tab: 'projects' })} className="hover:text-blue-600 hover:underline transition">{pse.activeProjectsCount} Proj</button>
                                                <button onClick={() => setPseDetailModal({ pseId: pse.pseId, name: pse.name, tab: 'leads' })} className="hover:text-emerald-600 hover:underline transition">{pse.activeLeadsCount} Lead</button>
                                                <span className="ml-auto text-zinc-300">Limit: {pse.maxCapacity || 30}pts</span>
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

                {/* TAB 6: CALENDAR VIEW */}
                {activeTab === 'calendar' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Calendar Main Grid */}
                            <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Operations Calendar</h3>
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Click a day to schedule a new agenda</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 overflow-x-auto hide-scrollbar max-w-full">
                                        <button 
                                            onClick={() => setCalendarFilter('all')} 
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${calendarFilter === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                        >
                                            All
                                        </button>
                                        <button 
                                            onClick={() => setCalendarFilter('agenda')} 
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${calendarFilter === 'agenda' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                        >
                                            Agendas
                                        </button>
                                        <button 
                                            onClick={() => setCalendarFilter('external')} 
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${calendarFilter === 'external' ? 'bg-amber-500 text-amber-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                        >
                                            PrivateEmail
                                        </button>
                                        <button 
                                            onClick={() => setCalendarFilter('leads')} 
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${calendarFilter === 'leads' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                        >
                                            Leads
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => {
                                            const prev = new Date(currentCalDate);
                                            prev.setMonth(prev.getMonth() - 1);
                                            setCurrentCalDate(prev);
                                        }} className="p-2 hover:bg-zinc-100 rounded-xl transition"><ChevronLeft size={20} className="text-zinc-800" /></button>
                                        <span className="font-black text-lg min-w-[150px] text-center text-zinc-800">
                                            {currentCalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button onClick={() => {
                                            const next = new Date(currentCalDate);
                                            next.setMonth(next.getMonth() + 1);
                                            setCurrentCalDate(next);
                                        }} className="p-2 hover:bg-zinc-100 rounded-xl transition"><ChevronRight size={20} className="text-zinc-800" /></button>
                                    </div>
                                </div>

                                {loadingCalendar ? (
                                    <div className="flex flex-col justify-center items-center py-24 space-y-3">
                                        <Loader2 className="animate-spin text-zinc-400" size={32} />
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Loading Agenda & Events...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                            <div key={d} className="bg-zinc-50 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">{d}</div>
                                        ))}

                                        {calendarGrid.map((cell, idx) => {
                                            const cellEvents = combinedEvents.filter(e => e.startDate === cell.dateStr);
                                            const isToday = new Date().toDateString() === new Date(cell.dateStr).toDateString();
                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => {
                                                        if (cell.isCurrentMonth) {
                                                            setNewAgenda({ title: '', description: '', startDate: cell.dateStr, endDate: cell.dateStr, startTime: '', endTime: '', attachmentLink: '', syncToPrivateEmail: false });
                                                            setEditingAgendaId(null);
                                                            setIsAddingAgenda(true);
                                                        }
                                                    }}
                                                    className={`bg-white min-h-[120px] p-2 border-t border-zinc-100 transition hover:bg-zinc-50/80 cursor-pointer group/day ${cell.isCurrentMonth ? '' : 'opacity-40'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-zinc-900 text-white' : 'text-zinc-600 group-hover/day:bg-zinc-100'}`}>
                                                            {cell.day}
                                                        </div>
                                                        {cell.isCurrentMonth && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 opacity-0 group-hover/day:opacity-100 transition">+ ADD</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto hide-scrollbar">
                                                        {cellEvents.map((evt) => (
                                                            <div 
                                                                key={evt.id} 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCalendarEvent(evt);
                                                                }}
                                                                className={`text-[9px] font-bold px-2 py-1 rounded truncate border hover:scale-105 transition-all ${evt.color}`} 
                                                                title={`${evt.title} (Click to View)`}
                                                            >
                                                                {evt.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Sidebar: All Agendas list */}
                            <div className="space-y-6">
                                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Database Agendas</h4>
                                    {calendarData.agendas.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-300 italic text-xs">No agendas created yet.</div>
                                    ) : (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {calendarData.agendas.map((a) => (
                                                <div key={a.id} className="p-3 bg-zinc-50 hover:bg-zinc-100/80 rounded-2xl border border-zinc-100 transition-all flex justify-between items-start gap-2 group">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-zinc-800 leading-tight">{a.title}</p>
                                                        {a.description && <p className="text-[10px] text-zinc-500 leading-relaxed font-medium line-clamp-2">{a.description}</p>}
                                                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                                            📅 {new Date(a.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            {a.start_time && ` • ${a.start_time.substring(0, 5)}`}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => handleDeleteAgenda(a.id)} className="p-1 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">PrivateEmail Calendar</h4>
                                    {calendarData.externalEvents.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-300 italic text-xs">No external events loaded.</div>
                                    ) : (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {calendarData.externalEvents.slice(0, 15).map((e, idx) => (
                                                <div key={idx} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                                                    <p className="text-xs font-black text-amber-900 leading-tight">{e.title}</p>
                                                    {e.startDate && (
                                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                                                            📅 {new Date(e.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                            {calendarData.externalEvents.length > 15 && (
                                                <p className="text-center text-[9px] font-bold text-amber-400 uppercase tracking-widest italic">+ {calendarData.externalEvents.length - 15} more events...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                            
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Project Type <span className="text-zinc-400 normal-case font-medium">(workload weight)</span></label>
                                    <select value={newProject.projectType || 'data'} onChange={(e) => setNewProject((p: any) => ({ ...p, projectType: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="data">Data (1x)</option>
                                        <option value="dev">Dev (3x)</option>
                                        <option value="survey">Survey (3x)</option>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Close Quarter</label>
                                    <select value={newProject.closeQuarter || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, closeQuarter: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Quarter...</option>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Close Year</label>
                                    <select value={newProject.closeYear || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, closeYear: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Year...</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                        <option value="2028">2028</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Next Step</label>
                                <input type="text" value={newProject.nextStep || ''} onChange={(e) => setNewProject((p: any) => ({ ...p, nextStep: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900" />
                            </div>
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase group relative">
                                    <div className="flex items-center gap-1.5 cursor-help">
                                        <span>Progress</span>
                                        <Info size={12} className="text-zinc-400 hover:text-blue-500 transition-colors" />
                                        <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 bg-zinc-800 text-white text-[10px] font-medium normal-case rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                                            Persentase otomatis diperbarui setiap kali Anda memindah Stage. Anda dapat menggeser slider ini jika ingin melakukan penyesuaian manual.
                                        </div>
                                    </div>
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
                            <button disabled={submitting} onClick={() => handleSaveData('Project', newProject, setNewProject, setIsAddingProject, () => setNewProject({ client: '', projectName: '', pseId: '', stage: 'Technical Handover', progress: 0, projectType: 'data', notes: '', picSales: '', contactName: '', contactNumber: '', forecastedValue: 0, nextStep: '', closeDate: '', probability: 0.4, closeYear: '', closeQuarter: '' }))} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase rounded-xl hover:bg-blue-700">{submitting ? 'Saving...' : editingItemId ? 'Update Project' : 'Save Project'}</button>
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
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Type <span className="text-zinc-400 normal-case font-medium">(weight)</span></label>
                                    <select value={newLead.projectType || 'data'} onChange={(e) => setNewLead((p: any) => ({ ...p, projectType: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="data">Data (1x)</option>
                                        <option value="dev">Dev (3x)</option>
                                        <option value="survey">Survey (3x)</option>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Close Quarter</label>
                                    <select value={newLead.closeQuarter || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, closeQuarter: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Quarter...</option>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Close Year</label>
                                    <select value={newLead.closeYear || ''} onChange={(e) => setNewLead((p: any) => ({ ...p, closeYear: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="">Select Year...</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                        <option value="2028">2028</option>
                                    </select>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="flex justify-between items-center text-[10px] font-bold text-zinc-700 mb-1.5 uppercase group relative">
                                    <div className="flex items-center gap-1.5 cursor-help">
                                        <span>Progress to Won</span>
                                        <Info size={12} className="text-zinc-400 hover:text-emerald-500 transition-colors" />
                                        <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 bg-zinc-800 text-white text-[10px] font-medium normal-case rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-xl">
                                            Persentase otomatis diperbarui setiap kali Anda memindah Stage. Anda dapat menggeser slider ini jika ingin melakukan penyesuaian manual.
                                        </div>
                                    </div>
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
                                <button disabled={submitting} onClick={() => handleSaveData('Lead', newLead, setNewLead, setIsAddingLead, () => setNewLead({ name: '', pseId: '', stage: 'Lead Generation', progress: 0, projectType: 'data', notes: '', picSales: '', contactName: '', contactEmail: '', contactNumber: '', forecastedValue: 0, probability: 0, demoDate: '', expectedCloseDate: '', lastInteractedOn: '', nextStep: '', proposalLink: '', partnerId: '', closeYear: '', closeQuarter: '' }))} className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-700">{submitting ? 'Saving...' : editingItemId ? 'Update Lead' : 'Save Lead'}</button>
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
                                    <span>Max Points Capacity (Limit)</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            value={editingMember.maxCapacity}
                                            onChange={(e) => setEditingMember({ ...editingMember, maxCapacity: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
                                            className="w-14 text-center bg-white border border-zinc-300 rounded-lg px-2 py-1 text-xs font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                            min={1}
                                            max={100}
                                        />
                                        <span className="text-[10px] text-zinc-400">Pts</span>
                                    </div>
                                </label>
                                <input type="range" min="1" max="100" step="1" value={editingMember.maxCapacity} onChange={(e) => setEditingMember({ ...editingMember, maxCapacity: Number(e.target.value) })} className="w-full accent-zinc-900 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer" />
                                <div className="flex justify-between mt-1 text-[8px] font-bold text-zinc-300 uppercase">
                                    <span>1 pt</span>
                                    <span>100 pts</span>
                                </div>
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

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Sales</label>
                                <select value={newPartner.picPartner || ''} onChange={(e) => setNewPartner((p: any) => ({ ...p, picPartner: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                    <option value="">Select Sales...</option>{SALES_TEAM.map(s => <option key={s} value={s}>{s}</option>)}
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
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Project Type <span className="text-zinc-400 normal-case font-medium">(weight)</span></label>
                                    <select value={newPartner.projectType || 'data'} onChange={(e) => setNewPartner((p: any) => ({ ...p, projectType: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900">
                                        <option value="data">Data (1x)</option>
                                        <option value="dev">Dev (3x)</option>
                                        <option value="survey">Survey (3x)</option>
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
                            <button disabled={submitting} onClick={() => handleSaveData('Partner', newPartner, setNewPartner, setIsAddingPartner, () => setNewPartner({ name: '', type: 'Technology', projectType: 'data', stage: 'Sourcing', progress: 0, notes: '', picPartner: '', contactName: '', contactNumber: '', nextStep: '' }))} className="px-6 py-2.5 bg-purple-600 text-white text-xs font-black uppercase rounded-xl hover:bg-purple-700">{submitting ? 'Saving...' : editingItemId ? 'Update Partner' : 'Save Partner'}</button>
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
                                    Beban kerja setiap anggota tim dihitung berdasarkan poin. Setiap tugas memiliki <b>Bobot Dasar</b>, lalu dikalikan dengan <b>Jenis Proyek</b>: <span className="font-black text-blue-600">Data</span> = 1x, <span className="font-black text-rose-600">Dev / Survey</span> = 3x.
                                </p>

                                <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                                    <table className="w-full text-left text-[11px]">
                                        <thead>
                                            <tr className="bg-zinc-100/50 border-b border-zinc-200">
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Tipe Tugas</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Data (1x)</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Dev (3x)</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tighter text-zinc-500">Survey (3x)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/50 font-bold text-zinc-700">
                                            <tr>
                                                <td className="px-4 py-3 bg-blue-50/30 text-blue-700">Project (3 pts)</td>
                                                <td className="px-4 py-3 text-center bg-blue-50/50">3.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">9.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">9.0</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-emerald-50/30 text-emerald-700">Lead (1 pt)</td>
                                                <td className="px-4 py-3 text-center bg-emerald-50/50">1.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">3.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">3.0</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-purple-50/30 text-purple-700">Partner (1 pt)</td>
                                                <td className="px-4 py-3 text-center bg-purple-50/50">1.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">3.0</td>
                                                <td className="px-4 py-3 text-center text-rose-600">3.0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><Target size={14} /></div>
                                    <div>
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight mb-0.5">Kapasitas Maksimal (Limit)</p>
                                        <p className="text-[11px] text-blue-700 leading-tight">Secara default, setiap PSE memiliki limit 30 poin. Status <b>Freeze</b>, <b>Done</b>, dan <b>Lost</b> tidak akan menambah beban poin.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => setShowPointsInfo(false)} className="w-full mt-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl">Dimengerti</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ADD AGENDA MODAL ========== */}
            {isAddingAgenda && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h3 className="text-lg font-black text-zinc-900">{editingAgendaId ? 'Edit Calendar Agenda' : 'Add New Calendar Agenda'}</h3>
                            <button onClick={() => {
                                setIsAddingAgenda(false);
                                setEditingAgendaId(null);
                            }} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Agenda Title</label>
                                <input type="text" value={newAgenda.title} onChange={(e) => setNewAgenda(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Technical Kickoff" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Description</label>
                                <textarea rows={3} value={newAgenda.description} onChange={(e) => setNewAgenda(prev => ({ ...prev, description: e.target.value }))} placeholder="Agenda details, requirements..." className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Attachment Link (Optional)</label>
                                <input type="text" value={newAgenda.attachmentLink} onChange={(e) => setNewAgenda(prev => ({ ...prev, attachmentLink: e.target.value }))} placeholder="e.g. https://meet.google.com/abc-def" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Start Date</label>
                                    <input type="date" value={newAgenda.startDate} onChange={(e) => setNewAgenda(prev => ({ ...prev, startDate: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">End Date (Optional)</label>
                                    <input type="date" value={newAgenda.endDate} onChange={(e) => setNewAgenda(prev => ({ ...prev, endDate: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">Start Time (Optional)</label>
                                    <input type="time" value={newAgenda.startTime} onChange={(e) => setNewAgenda(prev => ({ ...prev, startTime: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase">End Time (Optional)</label>
                                    <input type="time" value={newAgenda.endTime} onChange={(e) => setNewAgenda(prev => ({ ...prev, endTime: e.target.value }))} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-amber-50/40 border border-amber-100 rounded-2xl">
                                <input 
                                    type="checkbox" 
                                    id="syncToPrivateEmail" 
                                    checked={newAgenda.syncToPrivateEmail} 
                                    onChange={(e) => setNewAgenda(prev => ({ ...prev, syncToPrivateEmail: e.target.checked }))} 
                                    className="w-4 h-4 text-amber-600 border-zinc-300 rounded focus:ring-amber-500 cursor-pointer"
                                />
                                <label htmlFor="syncToPrivateEmail" className="text-xs font-black text-amber-900 cursor-pointer select-none">
                                    Sync to PrivateEmail Calendar 📧
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 shrink-0 bg-zinc-50/50">
                            <button onClick={() => {
                                setIsAddingAgenda(false);
                                setEditingAgendaId(null);
                            }} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors">Cancel</button>
                            <button onClick={handleSaveAgenda} disabled={submittingCalendar} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                                {submittingCalendar ? 'Saving...' : 'Save Agenda'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EVENT DETAILS MODAL ========== */}
            {selectedCalendarEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800">
                                {selectedCalendarEvent.type === 'agenda' ? 'Database Agenda' : selectedCalendarEvent.type === 'external' ? 'PrivateEmail Event' : 'CRM Lead Support'}
                            </span>
                            <button onClick={() => setSelectedCalendarEvent(null)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Title</h4>
                                <p className="text-base font-black text-zinc-900 leading-tight">{selectedCalendarEvent.title}</p>
                            </div>
                            
                            {selectedCalendarEvent.description && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Details / Description</h4>
                                    <p className="text-xs font-bold text-zinc-600 leading-relaxed whitespace-pre-line bg-zinc-50 p-3 rounded-2xl border border-zinc-100 max-h-[150px] overflow-y-auto custom-scrollbar">{selectedCalendarEvent.description}</p>
                                </div>
                            )}

                            {selectedCalendarEvent.attachmentLink && (
                                <div className="pt-2 border-t border-zinc-100">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Attachment / Link</h4>
                                    <a 
                                        href={selectedCalendarEvent.attachmentLink.startsWith('http') ? selectedCalendarEvent.attachmentLink : `https://${selectedCalendarEvent.attachmentLink}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800 underline transition"
                                    >
                                        <ExternalLink size={14} /> Open Attachment
                                    </a>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Date</h4>
                                    <p className="text-xs font-black text-zinc-800">
                                        📅 {new Date(selectedCalendarEvent.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                {(selectedCalendarEvent.startTime || selectedCalendarEvent.endTime) && (
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Time</h4>
                                        <p className="text-xs font-black text-indigo-600">
                                            ⏰ {selectedCalendarEvent.startTime ? selectedCalendarEvent.startTime.substring(0, 5) : '00:00'} - {selectedCalendarEvent.endTime ? selectedCalendarEvent.endTime.substring(0, 5) : '23:59'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                            {selectedCalendarEvent.type === 'agenda' && (
                                <>
                                    <button onClick={() => {
                                        setNewAgenda({
                                            title: selectedCalendarEvent.title.replace(/^\[\d{2}:\d{2}\]\s+/, ''),
                                            description: selectedCalendarEvent.description || '',
                                            startDate: selectedCalendarEvent.startDate,
                                            endDate: selectedCalendarEvent.endDate || selectedCalendarEvent.startDate,
                                            startTime: selectedCalendarEvent.startTime || '',
                                            endTime: selectedCalendarEvent.endTime || '',
                                            attachmentLink: selectedCalendarEvent.attachmentLink || '',
                                            syncToPrivateEmail: selectedCalendarEvent.syncToPrivateEmail || false,
                                        });
                                        setEditingAgendaId(selectedCalendarEvent.rawId);
                                        setSelectedCalendarEvent(null);
                                        setIsAddingAgenda(true);
                                    }} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors">
                                        Edit Agenda
                                    </button>
                                    <button onClick={() => {
                                        handleDeleteAgenda(selectedCalendarEvent.rawId);
                                        setSelectedCalendarEvent(null);
                                    }} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors">
                                        Delete
                                    </button>
                                </>
                            )}
                            <button onClick={() => setSelectedCalendarEvent(null)} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== PSE DETAIL MODAL (Projects/Leads list) ========== */}
            {pseDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <div>
                                <h3 className="text-lg font-black text-zinc-900">{pseDetailModal.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                    {pseDetailModal.tab === 'projects' ? 'Active Projects' : 'Active Leads'}
                                </p>
                            </div>
                            <button onClick={() => setPseDetailModal(null)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-2">
                            {(() => {
                                const items = pseDetailModal.tab === 'projects'
                                    ? (config?.kanbanProjects || []).filter((p: any) => p.pseId === pseDetailModal.pseId && !['Done', 'Lost', 'Freeze'].includes(p.stage))
                                    : (config?.kanbanLeads || []).filter((l: any) => l.pseId === pseDetailModal.pseId && l.isClosed === false && !['Freeze', 'Closed Lost'].includes(l.stage));
                                if (items.length === 0) {
                                    return <div className="text-center py-8 text-zinc-300 italic text-xs">No active {pseDetailModal.tab}.</div>;
                                }
                                return items.map((item: any) => (
                                    <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center ${pseDetailModal.tab === 'projects' ? 'bg-blue-50/50 border-blue-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 truncate">{pseDetailModal.tab === 'projects' ? (item.client || item.projectName) : item.name}</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{item.stage}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {item.forecastedValue > 0 && <span className="text-[9px] font-black text-emerald-600">IDR {(item.forecastedValue / 1000000).toFixed(0)}M</span>}
                                            <span className="text-[9px] font-black text-zinc-400">{item.progress || 0}%</span>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                        <div className="p-6 border-t border-zinc-100 flex justify-end">
                            <button onClick={() => setPseDetailModal(null)} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EMAIL STATUS MODAL ========== */}
            {emailStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <div>
                                <h3 className="text-lg font-black text-zinc-900">{emailStatusModal.clientName}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                    Email Status — {emailStatusModal.itemType}
                                </p>
                            </div>
                            <button onClick={() => setEmailStatusModal(null)} className="p-2 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 max-h-[60vh]">
                            {loadingEmails ? (
                                <div className="flex items-center justify-center py-12 text-zinc-400">
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Loading emails...</span>
                                </div>
                            ) : clientRawEmails.length === 0 ? (
                                <div className="text-center py-12">
                                    <Mail size={32} className="mx-auto text-zinc-200 mb-3" />
                                    <p className="text-xs text-zinc-400 italic">No email history found.</p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-zinc-100 ml-3 space-y-8 pb-4">
                                    <div className="pl-6 mb-6">
                                        <button 
                                            onClick={() => handleGenerateSummary(emailStatusModal.clientName)}
                                            disabled={isSummarizing}
                                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-4 rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors font-medium text-sm shadow-sm"
                                        >
                                            {isSummarizing ? (
                                                <><Loader2 size={16} className="animate-spin" /> Menganalisis Percakapan...</>
                                            ) : (
                                                <>✨ Generate AI Summary</>
                                            )}
                                        </button>
                                        
                                        {aiSummary && (
                                            <div className="mt-4 bg-zinc-50 border border-zinc-200 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                        Groq AI Summary
                                                    </span>
                                                </div>
                                                <div className="text-sm text-zinc-800 leading-relaxed markdown-content">
                                                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {clientRawEmails.map((email: any) => (
                                        <div key={email.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-400 ring-4 ring-white"></div>
                                            <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-800 transition-colors"></div>
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-zinc-900">{email.subject || '(No Subject)'}</h4>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">
                                                            From: <span className="text-zinc-600">{email.from_addr}</span>
                                                        </p>
                                                    </div>
                                                    <span className="text-[9px] font-black bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg whitespace-nowrap">
                                                        {new Date(email.email_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-600 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar border border-zinc-100">
                                                    {email.body ? email.body.trim() : <span className="italic text-zinc-400">Empty body</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-zinc-100 flex justify-end">
                            <button onClick={() => setEmailStatusModal(null)} className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}