'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import { Loader2, Plus, Edit2, Trash2, X, BookOpen, Users, Check, ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';

const apiFetcher = (url: string) => fetch(url).then(r => r.json());

const BI_EDIT_CONFIG = {
    academy: {
        title: 'Academy Program',
        empty: { program: '', batch: '', registrants: 0, converted: 0, conversion: 0 },
        fields: [
            { key: 'program', label: 'Program Name', type: 'text' },
            { key: 'batch', label: 'Batch Label', type: 'text' },
            { key: 'registrants', label: 'Registrants', type: 'number' },
            { key: 'converted', label: 'Converted to Paid', type: 'number' },
        ],
    },
};

// --- Inline Edit Modal (same as original dashboard) ---
const EditModal = ({ isOpen, onClose, onSave, title, fields, data, onChange }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <h3 className="text-lg font-black tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {fields.map((f: any) => (
                        <div key={f.key}>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">{f.label}</label>
                            <input type={f.type === 'number' ? 'number' : 'text'}
                                value={data?.[f.key] ?? (f.type === 'number' ? 0 : '')}
                                onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-zinc-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition">Cancel</button>
                    <button onClick={onSave} className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default function AcademyPerformancePage() {
    const { isLoading: globalIsLoading, syncData } = useGlobalData();
    const [config, setConfigState] = useState(() => getConfig());
    const [editModal, setEditModal] = useState<{ section: string; index: number; data: any } | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Quarter Filter Logic
  const getQuarterDates = (q: number, y: number) => {
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0);
    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    return {
      start: fmt(start),
      end: fmt(end),
    };
  };
    const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
    const currentY = new Date().getFullYear();
    const defaultDates = getQuarterDates(currentQ, currentY);
    const [revenueStartDate, setRevenueStartDate] = useState(defaultDates.start);
    const [revenueEndDate, setRevenueEndDate] = useState(defaultDates.end);

    const academyPaymentsUrl = `/api/revenue/payments?start_date=${revenueStartDate}&end_date=${revenueEndDate}&category=MAPID Academy`;
    const { data: academyPayData, isLoading: academyLoading } = useSWR(academyPaymentsUrl, apiFetcher, { revalidateOnFocus: false });

    useEffect(() => {
        setConfigState(getConfig());
    }, [globalIsLoading]);

    const openEditModal = (section: string, index: number = -1) => {
        const sectionConfig = (BI_EDIT_CONFIG as any)[section];
        if (!sectionConfig) return;
        const existingData = index >= 0 ? (config.biData as any)?.[section]?.[index] : null;
        setEditModal({ section, index, data: existingData ? { ...existingData } : { ...sectionConfig.empty } });
    };

    const handleEditField = (key: string, value: any) => {
        setEditModal(prev => prev ? { ...prev, data: { ...prev.data, [key]: value } } : null);
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;
        setSaveStatus('saving');
        const newConfig = JSON.parse(JSON.stringify(config));
        if (!newConfig.biData) newConfig.biData = {};
        if (!newConfig.biData[editModal.section]) newConfig.biData[editModal.section] = [];

        if (editModal.index >= 0) {
            newConfig.biData[editModal.section][editModal.index] = editModal.data;
        } else {
            newConfig.biData[editModal.section].push(editModal.data);
        }

        setConfigState(newConfig);
        setConfigLS(newConfig);
        await saveConfigToSupabase(newConfig);
        syncData({ silent: true });
        setEditModal(null);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
    };

    const handleDeleteItem = async (section: string, index: number) => {
        if (!confirm('Delete this item?')) return;
        const newConfig = JSON.parse(JSON.stringify(config));
        if (newConfig.biData?.[section]) {
            newConfig.biData[section].splice(index, 1);
            setConfigState(newConfig);
            setConfigLS(newConfig);
            await saveConfigToSupabase(newConfig);
            syncData({ silent: true });
        }
    };

    // --- DATA TRANSFORMS FOR ACADEMY (same as original dashboard) ---
    const validAcademyData = config.biData?.academy || [];
    const academyPrograms = Array.from(new Set(validAcademyData.map((a: any) => a.program))).sort();

    // Revenue metrics
    const academyActual = academyPayData?.totalAmount || 0;
    const academyTarget = 60000000;
    const academyPercent = academyTarget > 0 ? Math.min(Math.round((academyActual / academyTarget) * 100), 100) : 0;

    const selectedQuarterStr = (() => {
        const sd = new Date(revenueStartDate);
        const q = Math.ceil((sd.getMonth() + 1) / 3);
        return `Q${q} ${sd.getFullYear()}`;
    })();

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                            <BookOpen className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-zinc-900">Academy Performance</h1>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Education & Program Metrics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
                            <ArrowLeft size={14} /> Back to BI
                        </Link>
                        <button onClick={() => openEditModal('academy')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                            <Plus size={12} /> Add Batch
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto py-12 px-6">
                {/* ===== NEW: Academy B2C Revenue Section with Quarter Filter ===== */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Academy B2C Revenue</h3>
                            <p className="text-[10px] font-bold text-zinc-300 mt-1">{selectedQuarterStr} • {new Date(revenueStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {new Date(revenueEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Quick Quarter Buttons */}
                            {[1,2,3,4].map(q => {
                                const dates = getQuarterDates(q, currentY);
                                const isActive = revenueStartDate === dates.start && revenueEndDate === dates.end;
                                return (
                                    <button key={q} onClick={() => { setRevenueStartDate(dates.start); setRevenueEndDate(dates.end); }}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${isActive ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>
                                        Q{q}
                                    </button>
                                );
                            })}
                            <div className="hidden md:block w-px h-6 bg-zinc-200 mx-1"></div>
                            {/* Date Range Inputs */}
                            <input type="date" value={revenueStartDate} onChange={e => setRevenueStartDate(e.target.value)}
                                className="bg-white border border-zinc-200 text-xs font-bold text-zinc-600 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none" />
                            <span className="text-zinc-300 text-xs font-bold">—</span>
                            <input type="date" value={revenueEndDate} onChange={e => setRevenueEndDate(e.target.value)}
                                className="bg-white border border-zinc-200 text-xs font-bold text-zinc-600 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none" />
                            {academyLoading && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                                    <Loader2 size={12} className="animate-spin" /> Loading...
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Revenue Card */}
                    <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-blue-500 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layers size={48} className="text-blue-600" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">MAPID Academy</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black tracking-tighter text-zinc-900">Rp {(academyActual / 1000000).toFixed(1)}M</span>
                            <span className="text-xs font-bold text-zinc-400 mb-2">/ {(academyTarget / 1000000).toFixed(0)}M</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{academyPercent}% COMPLETE</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${academyPercent}%` }}></div>
                        </div>
                        <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-4">Source: Supabase DB → revenue_payments</p>
                    </div>
                </div>

                {/* ===== ORIGINAL: Academy Performance By Program (exact same as original dashboard) ===== */}
                <div className="space-y-12 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Academy Performance By Program</h3>
                    </div>
                    {academyPrograms.map((program: any) => {
                        const programData = validAcademyData.filter((a: any) => a.program === program);

                        // Sort natural by batch (Batch 1, Batch 2... Batch 10)
                        const sortedData = [...programData].sort((a, b) => {
                            return a.batch.localeCompare(b.batch, undefined, { numeric: true, sensitivity: 'base' });
                        });

                        const totalRegistrants = sortedData.reduce((acc, curr) => acc + (Number(curr.registrants) || 0), 0);
                        const totalConverted = sortedData.reduce((acc, curr) => acc + (Number(curr.converted) || 0), 0);
                        const totalConversion = totalRegistrants > 0 ? ((totalConverted / totalRegistrants) * 100).toFixed(2) : '0';

                        return (
                            <div key={program} className="space-y-6">
                                {/* Program Header Summary */}
                                <div className="bg-white border text-left border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">{program}</h3>
                                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Overall Performance</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 px-2 md:px-6 md:border-l border-zinc-100 min-w-max">
                                        <div>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Total Registrants</p>
                                            <p className="text-2xl font-black text-zinc-900">{totalRegistrants}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Total Converted</p>
                                            <p className="text-2xl font-black text-emerald-600">{totalConverted}</p>
                                        </div>
                                        <div className="bg-zinc-50 px-4 py-2 border border-zinc-200 rounded-xl text-center">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Avg Rate</p>
                                            <p className="text-xl font-black text-zinc-900 font-mono">{totalConversion}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Batch Breakdowns Table */}
                                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-50/50 text-xs text-zinc-400 font-bold tracking-widest uppercase border-b border-zinc-100">
                                                <tr>
                                                    <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/5">Batch Name</th>
                                                    <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/5">Registrants</th>
                                                    <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/5">Converted</th>
                                                    <th className="px-6 py-4 text-center w-1/4">Conversion %</th>
                                                    <th className="px-4 py-4 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {sortedData.map((row, idx) => {
                                                    const registrants = Number(row.registrants) || 0;
                                                    const converted = Number(row.converted) || 0;
                                                    const rate = registrants > 0 ? ((converted / registrants) * 100).toFixed(2) : '0';

                                                    return (
                                                        <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
                                                            <td className="px-6 py-4 font-bold text-zinc-900 border-r border-dashed border-zinc-200">
                                                                {row.batch}
                                                            </td>
                                                            <td className="px-6 py-4 text-zinc-600 font-mono border-r border-dashed border-zinc-200">
                                                                {registrants}
                                                            </td>
                                                            <td className="px-6 py-4 text-emerald-600 font-mono border-r border-dashed border-zinc-200">
                                                                +{converted}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3 w-full max-w-[200px] mx-auto">
                                                                    <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden shadow-inner">
                                                                        <div
                                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                                            style={{ width: `${Math.min(Number(rate), 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-zinc-900 font-bold w-12 text-right font-mono">{rate}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                                    {(() => { const origIdx = validAcademyData.indexOf(row); return (<>
                                                                        <button onClick={() => openEditModal('academy', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                                                        <button onClick={() => handleDeleteItem('academy', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                                                                    </>); })()}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {academyPrograms.length === 0 && (
                        <div className="text-center py-20 bg-white border border-zinc-200 border-dashed rounded-3xl">
                            <Users className="mx-auto text-zinc-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-zinc-400">No Academy Data yet</h3>
                            <p className="text-sm text-zinc-400 mt-2">Click the "+ Add Batch" button above to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editModal && (
                <EditModal
                    isOpen={true}
                    onClose={() => setEditModal(null)}
                    onSave={handleSaveEdit}
                    title={`${editModal.index >= 0 ? 'Edit' : 'Add'} ${BI_EDIT_CONFIG[editModal.section as keyof typeof BI_EDIT_CONFIG]?.title || 'Item'}`}
                    fields={BI_EDIT_CONFIG[editModal.section as keyof typeof BI_EDIT_CONFIG]?.fields || []}
                    data={editModal.data}
                    onChange={handleEditField}
                />
            )}

            {/* Save Status Toast */}
            {saveStatus !== 'idle' && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
                    <div className={`px-5 py-3 rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${saveStatus === 'saving' ? 'bg-zinc-900 text-white' : 'bg-emerald-500 text-white'}`}>
                        {saveStatus === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Saved!</>}
                    </div>
                </div>
            )}
        </main>
    );
}
