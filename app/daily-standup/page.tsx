'use client';
import { useEffect, useState, useMemo } from 'react';
import {
    Plus, X, Loader2, ChevronLeft, ChevronRight, Calendar, CheckCircle2,
    Clock, AlertTriangle, Users, BarChart3, Trash2, Edit3, Link as LinkIcon,
    ExternalLink, FileText, Check, Save, Copy, Github, Figma, Youtube, Globe,
    Video, MessageSquare, Pin, CheckCircle
} from 'lucide-react';

// Team members from spreadsheet
const TEAM_MEMBERS = ['Fariz', 'Dwi', 'Wina', 'Annisa', 'Lossa', 'Amel', 'Hadi', 'Zhafran'];

const MEMBER_COLORS: Record<string, { bg: string; border: string; text: string; light: string; dot: string; btn: string }> = {
    'Fariz': { bg: 'bg-blue-50/70', border: 'border-blue-200/80', text: 'text-blue-700', light: 'bg-blue-100', dot: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
    'Dwi': { bg: 'bg-emerald-50/70', border: 'border-emerald-200/80', text: 'text-emerald-700', light: 'bg-emerald-100', dot: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    'Wina': { bg: 'bg-purple-50/70', border: 'border-purple-200/80', text: 'text-purple-700', light: 'bg-purple-100', dot: 'bg-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' },
    'Annisa': { bg: 'bg-rose-50/70', border: 'border-rose-200/80', text: 'text-rose-700', light: 'bg-rose-100', dot: 'bg-rose-500', btn: 'bg-rose-600 hover:bg-rose-700' },
    'Lossa': { bg: 'bg-amber-50/70', border: 'border-amber-200/80', text: 'text-amber-700', light: 'bg-amber-100', dot: 'bg-amber-500', btn: 'bg-amber-600 hover:bg-amber-700' },
    'Amel': { bg: 'bg-cyan-50/70', border: 'border-cyan-200/80', text: 'text-cyan-700', light: 'bg-cyan-100', dot: 'bg-cyan-500', btn: 'bg-cyan-600 hover:bg-cyan-700' },
    'Hadi': { bg: 'bg-indigo-50/70', border: 'border-indigo-200/80', text: 'text-indigo-700', light: 'bg-indigo-100', dot: 'bg-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    'Zhafran': { bg: 'bg-teal-50/70', border: 'border-teal-200/80', text: 'text-teal-700', light: 'bg-teal-100', dot: 'bg-teal-500', btn: 'bg-teal-600 hover:bg-teal-700' },
};

const getColor = (name: string) => MEMBER_COLORS[name] || { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700', light: 'bg-zinc-100', dot: 'bg-zinc-500', btn: 'bg-zinc-600 hover:bg-zinc-700' };

interface StandupTask {
    id: string;
    date: string;
    memberName: string;
    task: string;
    status: string;
    notes: string;
    hambatan: string;
    link: string;
}

interface GeneralLink {
    title: string;
    url: string;
}

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getWeekRange(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMon);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    return { start, end };
}

// Dynamic Link Domain Auto-detection
function getLinkInfo(url: string) {
    if (!url) return null;
    const lower = url.trim().toLowerCase();
    let label = 'Link';
    let color = 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-200';
    let iconName = 'generic';

    if (lower.includes('github.com')) {
        label = 'GitHub';
        color = 'bg-slate-900 text-white hover:bg-slate-800 border-slate-950';
        iconName = 'github';
    } else if (lower.includes('figma.com')) {
        label = 'Figma';
        color = 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200';
        iconName = 'figma';
    } else if (lower.includes('notion.so') || lower.includes('notion.site')) {
        label = 'Notion';
        color = 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-300';
        iconName = 'notion';
    } else if (lower.includes('docs.google.com') || lower.includes('drive.google.com') || lower.includes('sheets.google.com') || lower.includes('slides.google.com')) {
        label = 'Google Doc';
        color = 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200';
        iconName = 'google-drive';
    } else if (lower.includes('meet.google.com')) {
        label = 'Google Meet';
        color = 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200';
        iconName = 'meet';
    } else if (lower.includes('zoom.us') || lower.includes('zoom.com')) {
        label = 'Zoom';
        color = 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200';
        iconName = 'zoom';
    } else if (lower.includes('trello.com')) {
        label = 'Trello';
        color = 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200';
        iconName = 'trello';
    } else if (lower.includes('jira.com') || lower.includes('atlassian.net')) {
        label = 'Jira';
        color = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200';
        iconName = 'jira';
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        label = 'YouTube';
        color = 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200';
        iconName = 'youtube';
    } else if (lower.includes('vercel.app')) {
        label = 'Vercel';
        color = 'bg-slate-50 text-slate-900 hover:bg-slate-100 border-slate-400';
        iconName = 'vercel';
    } else if (lower.includes('whatsapp.com') || lower.includes('wa.me')) {
        label = 'WhatsApp';
        color = 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200';
        iconName = 'whatsapp';
    }

    return { label, color, iconName };
}

export default function DailyStandupPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<StandupTask[]>([]);
    const [weekTasks, setWeekTasks] = useState<StandupTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'weekly'>('grid');
    const [memberFilter, setMemberFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Custom Filter State
    const [isRangeMode, setIsRangeMode] = useState(false);
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [endDate, setEndDate] = useState(formatDate(new Date()));

    // Shared Daily Board State
    const [generalNotes, setGeneralNotes] = useState('');
    const [generalLinks, setGeneralLinks] = useState<GeneralLink[]>([]);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [generalSavedSuccess, setGeneralSavedSuccess] = useState(false);
    const [newGeneralTitle, setNewGeneralTitle] = useState('');
    const [newGeneralUrl, setNewGeneralUrl] = useState('');
    const [isAddingGeneralLink, setIsAddingGeneralLink] = useState(false);

    // Member Personal Links State
    const [memberLinks, setMemberLinks] = useState<Record<string, string>>({});
    const [editingMemberLink, setEditingMemberLink] = useState<string | null>(null);
    const [tempMemberLink, setTempMemberLink] = useState('');

    // Modal State
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<StandupTask | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [newTask, setNewTask] = useState({ memberName: '', task: '', status: 'In Progress', notes: '', hambatan: '', link: '' });

    const dateStr = formatDate(currentDate);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let url = `/api/bi?standupDate=${dateStr}`;
            if (isRangeMode) {
                url = `/api/bi?standupStart=${startDate}&standupEnd=${endDate}`;
            }
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setTasks(json.data || []);
                // If fetching a single date, get the daily general links & notes
                if (!isRangeMode && json.general) {
                    setGeneralNotes(json.general.general_notes || '');
                    setGeneralLinks(json.general.general_links || []);
                    setMemberLinks(json.general.member_links || {});
                } else if (!isRangeMode) {
                    setGeneralNotes('');
                    setGeneralLinks([]);
                    setMemberLinks({});
                }
            }
        } catch (err) {
            console.error('Failed to fetch standup', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMemberLink = async (member: string, url: string) => {
        const updatedLinks = { ...memberLinks, [member]: url.trim() };
        setMemberLinks(updatedLinks);
        setEditingMemberLink(null);
        setTempMemberLink('');
        
        setSavingGeneral(true);
        try {
            await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveStandupGeneral',
                    date: dateStr,
                    generalNotes,
                    generalLinks,
                    memberLinks: updatedLinks
                })
            });
        } catch (err) {
            alert('Failed to save personal link');
        } finally {
            setSavingGeneral(false);
        }
    };

    const fetchWeekTasks = async () => {
        const { start, end } = getWeekRange(currentDate);
        try {
            const res = await fetch(`/api/bi?standupStart=${formatDate(start)}&standupEnd=${formatDate(end)}`);
            const json = await res.json();
            if (json.success) setWeekTasks(json.data || []);
        } catch (err) {
            console.error('Failed to fetch week standup', err);
        }
    };

    useEffect(() => {
        if (viewMode !== 'weekly') fetchTasks();
    }, [dateStr, isRangeMode, startDate, endDate]);

    useEffect(() => {
        if (viewMode === 'weekly') fetchWeekTasks();
    }, [viewMode, dateStr]);

    const goToPrev = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
    const goToNext = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); };
    const goToToday = () => setCurrentDate(new Date());

    // Open add modal, optionally pre-fill member
    const openAddModal = (member = '') => {
        setNewTask({ memberName: member, task: '', status: 'In Progress', notes: '', hambatan: '', link: '' });
        setIsAdding(true);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (memberFilter.length > 0 && !memberFilter.includes(t.memberName)) return false;
            if (statusFilter !== 'All' && t.status !== statusFilter) return false;
            return true;
        });
    }, [tasks, memberFilter, statusFilter]);

    const analytics = useMemo(() => {
        const total = filteredTasks.length;
        const done = filteredTasks.filter(t => t.status === 'Done').length;
        const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
        const withBlockers = filteredTasks.filter(t => t.hambatan && t.hambatan.trim()).length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, inProgress, withBlockers, rate };
    }, [filteredTasks]);

    const handleAdd = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addStandupTask', date: dateStr, ...newTask })
            });
            const json = await res.json();
            if (json.success) {
                setTasks(prev => [...prev, { id: json.newId, date: dateStr, ...newTask }]);
                setIsAdding(false);
                setNewTask({ memberName: '', task: '', status: 'In Progress', notes: '', hambatan: '', link: '' });
            }
        } catch (err) { alert('Failed to add task'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = async () => {
        if (!editingTask) return;
        setSubmitting(true);
        try {
            const { id, ...taskPayload } = editingTask;
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'editStandupTask', id, ...taskPayload })
            });
            const json = await res.json();
            if (json.success) {
                setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
                setEditingTask(null);
            }
        } catch (err) { alert('Failed to edit task'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteStandupTask', id })
            });
            const json = await res.json();
            if (json.success) setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err) { alert('Failed to delete'); }
    };

    const handleToggleStatus = async (task: StandupTask) => {
        const newStatus = task.status === 'Done' ? 'In Progress' : 'Done';
        try {
            await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateStandupStatus', id: task.id, status: newStatus })
            });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (err) { alert('Failed to update status'); }
    };

    // Shared Daily Board Save Action
    const handleSaveGeneral = async (updatedLinks?: GeneralLink[]) => {
        setSavingGeneral(true);
        const linksToSave = updatedLinks !== undefined ? updatedLinks : generalLinks;
        try {
            const res = await fetch('/api/bi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveStandupGeneral',
                    date: dateStr,
                    generalNotes,
                    generalLinks: linksToSave,
                    memberLinks
                })
            });
            const json = await res.json();
            if (json.success) {
                setGeneralSavedSuccess(true);
                setTimeout(() => setGeneralSavedSuccess(false), 2000);
            }
        } catch (err) {
            alert('Failed to save shared board');
        } finally {
            setSavingGeneral(false);
        }
    };

    const handleAddGeneralLink = () => {
        if (!newGeneralTitle.trim() || !newGeneralUrl.trim()) return;
        const newLink: GeneralLink = {
            title: newGeneralTitle.trim(),
            url: newGeneralUrl.trim()
        };
        const updated = [...generalLinks, newLink];
        setGeneralLinks(updated);
        setNewGeneralTitle('');
        setNewGeneralUrl('');
        setIsAddingGeneralLink(false);
        // Automatically save to database
        handleSaveGeneral(updated);
    };

    const handleRemoveGeneralLink = (index: number) => {
        const updated = generalLinks.filter((_, idx) => idx !== index);
        setGeneralLinks(updated);
        handleSaveGeneral(updated);
    };

    const tasksByMember = useMemo(() => {
        const map: Record<string, StandupTask[]> = {};
        TEAM_MEMBERS.forEach(m => { map[m] = []; });
        filteredTasks.forEach(t => {
            if (!map[t.memberName]) map[t.memberName] = [];
            map[t.memberName].push(t);
        });
        return map;
    }, [filteredTasks]);

    const weekDays = useMemo(() => {
        const { start } = getWeekRange(currentDate);
        const days = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(formatDate(d));
        }
        return days;
    }, [dateStr]);

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-24 text-slate-800">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                            <Calendar className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Daily Standup</h1>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{formatDisplayDate(dateStr)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Users size={12} className="inline mr-1 -mt-0.5" />Grid</button>
                            <button onClick={() => setViewMode('timeline')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><BarChart3 size={12} className="inline mr-1 -mt-0.5" />Timeline</button>
                            <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Calendar size={12} className="inline mr-1 -mt-0.5" />Weekly</button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-6">
                {/* Analytics Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-indigo-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{analytics.total}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Tasks</p>
                        </div>
                    </div>
                    <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle2 size={18} className="text-emerald-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-emerald-700">{analytics.done}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Done ({analytics.rate}%)</p>
                        </div>
                    </div>
                    <div className="bg-white border border-amber-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center"><Clock size={18} className="text-amber-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-amber-700">{analytics.inProgress}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">In Progress</p>
                        </div>
                    </div>
                    <div className="bg-white border border-rose-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center"><AlertTriangle size={18} className="text-rose-600 animate-pulse" /></div>
                        <div>
                            <p className="text-2xl font-black text-rose-700">{analytics.withBlockers}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Blockers</p>
                        </div>
                    </div>
                </div>

                {/* Date nav + Action bar */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                            <button
                                onClick={() => setIsRangeMode(false)}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${!isRangeMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >Single</button>
                            <button
                                onClick={() => setIsRangeMode(true)}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${isRangeMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >Range</button>
                        </div>

                        {!isRangeMode ? (
                            <div className="flex items-center gap-2">
                                <button onClick={goToPrev} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-700 shadow-sm"><ChevronLeft size={16} /></button>
                                <button onClick={goToToday} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-700 shadow-sm">Today</button>
                                <input type="date" value={dateStr} onChange={(e) => setCurrentDate(new Date(e.target.value + 'T00:00:00'))} className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 shadow-sm" />
                                <button onClick={goToNext} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-700 shadow-sm"><ChevronRight size={16} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 text-[10px] font-bold border-none focus:ring-0 text-slate-900" />
                                <span className="text-[10px] font-black text-slate-400">TO</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 text-[10px] font-bold border-none focus:ring-0 text-slate-900" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end">
                        {/* Member filter chips */}
                        <div className="flex flex-wrap items-center gap-1 group/members">
                            <div className="flex items-center gap-1 mr-1 pr-1 border-r border-slate-200">
                                <button
                                    onClick={() => setMemberFilter([])}
                                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md transition-all ${memberFilter.length === 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >All</button>
                                <button
                                    onClick={() => setMemberFilter([...TEAM_MEMBERS])}
                                    className="px-2 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                                >Select All</button>
                            </div>
                            {TEAM_MEMBERS.map(m => {
                                const active = memberFilter.includes(m);
                                const c = getColor(m);
                                return (
                                    <button key={m} onClick={() => {
                                        if (active) setMemberFilter(prev => prev.filter(x => x !== m));
                                        else setMemberFilter(prev => [...prev, m]);
                                    }} className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${active ? `${c.bg} ${c.border} ${c.text}` : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>{m}</button>
                                );
                            })}
                        </div>
                        {/* Status filter */}
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-[10px] font-black uppercase bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm">
                            <option value="All">All Status</option>
                            <option value="Done">Done</option>
                            <option value="In Progress">In Progress</option>
                        </select>
                        {/* Global add task */}
                        <button onClick={() => openAddModal()} className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                            <Plus size={12} /> Add Task
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        {/* MAIN TASKS AREA */}
                        <div className={`space-y-6 ${(!isRangeMode && viewMode !== 'weekly') ? 'xl:col-span-9' : 'xl:col-span-12'}`}>
                            {/* GRID VIEW */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                    {TEAM_MEMBERS.filter(m => memberFilter.length === 0 || memberFilter.includes(m)).map(member => {
                                        const memberTasks = tasksByMember[member] || [];
                                        const c = getColor(member);
                                        const doneTasks = memberTasks.filter(t => t.status === 'Done').length;
                                        return (
                                            <div key={member} className={`${c.bg} border-2 ${c.border} rounded-3xl overflow-hidden transition-all hover:shadow-md duration-300 flex flex-col min-h-[250px]`}>
                                                {/* Member header — click to add */}
                                                <div className="p-4 flex items-center justify-between border-b border-slate-200/40">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-9 h-9 ${c.light} rounded-xl flex items-center justify-center shadow-inner`}>
                                                            <span className={`text-sm font-black ${c.text}`}>{member[0]}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className={`text-sm font-black ${c.text}`}>{member}</h3>
                                                            <p className={`text-[9px] font-bold ${c.text} opacity-70 uppercase tracking-widest`}>{doneTasks}/{memberTasks.length} done</p>
                                                        </div>
                                                    </div>
                                                    {/* Quick-add button per member */}
                                                    <button
                                                        onClick={() => openAddModal(member)}
                                                        className={`w-8 h-8 rounded-xl ${c.btn} text-white flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95`}
                                                        title={`Add task for ${member}`}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Member's Personal Link Section */}
                                                {!isRangeMode && (
                                                    <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200/20 flex items-center justify-between gap-2 shadow-inner">
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                            <LinkIcon size={11} className="text-slate-400 flex-shrink-0" />
                                                            {editingMemberLink === member ? (
                                                                <div className="flex items-center gap-1 w-full">
                                                                    <input
                                                                        type="text"
                                                                        value={tempMemberLink}
                                                                        onChange={(e) => setTempMemberLink(e.target.value)}
                                                                        placeholder="Paste workspace link..."
                                                                        className="text-[10px] px-2 py-1 w-full bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                                                                        autoFocus
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSaveMemberLink(member, tempMemberLink)}
                                                                        className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex-shrink-0"
                                                                        title="Save link"
                                                                    >
                                                                        <Check size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingMemberLink(null); setTempMemberLink(''); }}
                                                                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md flex-shrink-0"
                                                                        title="Cancel"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ) : memberLinks[member] ? (
                                                                (() => {
                                                                    const info = getLinkInfo(memberLinks[member]);
                                                                    return (
                                                                        <a
                                                                            href={memberLinks[member].startsWith('http') ? memberLinks[member] : `https://${memberLinks[member]}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 truncate hover:underline"
                                                                            title={memberLinks[member]}
                                                                        >
                                                                            {info?.label || 'Workspace Board'}
                                                                        </a>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 font-bold italic">No link set</span>
                                                            )}
                                                        </div>
                                                        
                                                        {editingMemberLink !== member && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMemberLink(member);
                                                                    setTempMemberLink(memberLinks[member] || '');
                                                                }}
                                                                className="text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider flex-shrink-0"
                                                            >
                                                                {memberLinks[member] ? 'Edit' : '+ Set Link'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Task list */}
                                                <div className="px-3 py-3 space-y-2 flex-1 max-h-[420px] overflow-y-auto custom-scrollbar">
                                                    {memberTasks.length === 0 && (
                                                        <button
                                                            onClick={() => openAddModal(member)}
                                                            className={`w-full py-8 text-[10px] font-bold ${c.text} opacity-60 uppercase tracking-widest border-2 border-dashed ${c.border} rounded-2xl hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5`}
                                                        >
                                                            <Plus size={12} /> Add first task
                                                        </button>
                                                    )}
                                                    {memberTasks.map(t => (
                                                        <div key={t.id} className={`bg-white rounded-2xl p-4 border border-slate-100 group transition-all hover:shadow-sm duration-200 ${t.status === 'Done' ? 'bg-slate-50/50 border-slate-100/50' : ''}`}>
                                                            <div className="flex items-start gap-2.5">
                                                                <button onClick={() => handleToggleStatus(t)} className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}>
                                                                    {t.status === 'Done' && <CheckCircle size={11} />}
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-xs font-bold leading-relaxed ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.task}</p>
                                                                    
                                                                    {/* Styled Notes Block */}
                                                                    {t.notes && (
                                                                        <div className="mt-2 bg-amber-50/40 border border-amber-100/50 rounded-xl p-2 flex items-start gap-1.5">
                                                                            <FileText size={10} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                                            <p className="text-[10px] text-slate-600 font-medium leading-normal italic">{t.notes}</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Blockers highlighting */}
                                                                    {t.hambatan && (
                                                                        <div className="flex items-start gap-1.5 mt-2 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl">
                                                                            <AlertTriangle size={11} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                                                            <span className="leading-tight">{t.hambatan}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Beautiful Dynamic Link Badge */}
                                                                    {t.link && (() => {
                                                                        const info = getLinkInfo(t.link);
                                                                        if (!info) return null;
                                                                        return (
                                                                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                                                                <a
                                                                                    href={t.link.startsWith('http') ? t.link : `https://${t.link}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border shadow-sm transition-all hover:scale-102 ${info.color}`}
                                                                                >
                                                                                    {info.iconName === 'github' && <Github size={11} />}
                                                                                    {info.iconName === 'figma' && <Figma size={11} />}
                                                                                    {info.iconName === 'notion' && <FileText size={11} />}
                                                                                    {info.iconName === 'google-drive' && <Globe size={11} />}
                                                                                    {info.iconName === 'meet' && <Video size={11} />}
                                                                                    {info.iconName === 'zoom' && <Video size={11} />}
                                                                                    {info.iconName === 'youtube' && <Youtube size={11} />}
                                                                                    {info.iconName === 'vercel' && <Globe size={11} />}
                                                                                    {info.iconName === 'whatsapp' && <MessageSquare size={11} />}
                                                                                    {info.iconName === 'generic' && <LinkIcon size={11} />}
                                                                                    {info.label}
                                                                                    <ExternalLink size={9} className="opacity-60 ml-0.5" />
                                                                                </a>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(t.link);
                                                                                        alert('Link copied to clipboard!');
                                                                                    }}
                                                                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                                                                                    title="Copy Link"
                                                                                >
                                                                                    <Copy size={10} />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => setEditingTask({ ...t })} className={`p-1.5 ${c.text} hover:bg-slate-100 rounded-lg`}><Edit3 size={12} /></button>
                                                                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={12} /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TIMELINE VIEW */}
                            {viewMode === 'timeline' && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                    {filteredTasks.length === 0 && (
                                        <div className="text-center py-16 text-slate-500 font-bold uppercase text-xs tracking-widest bg-white border border-slate-200 rounded-3xl">No standup data for this date</div>
                                    )}
                                    {filteredTasks.map(t => {
                                        const c = getColor(t.memberName);
                                        return (
                                            <div key={t.id} className="flex items-start gap-4 group">
                                                <div className="flex flex-col items-center pt-1.5">
                                                    <div className={`w-3 h-3 rounded-full ${t.status === 'Done' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-400 ring-4 ring-amber-100'}`}></div>
                                                    <div className="w-0.5 h-full bg-slate-200 min-h-[60px] mt-2"></div>
                                                </div>
                                                <div className={`flex-1 bg-white border border-slate-200 rounded-3xl p-5 transition-all hover:shadow-md shadow-sm`}>
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${c.text} ${c.light} px-2.5 py-1 rounded-lg border border-slate-200/50`}>{t.memberName}</span>
                                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${t.status === 'Done' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-amber-50 border border-amber-100 text-amber-700'}`}>{t.status}</span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleToggleStatus(t)} className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 text-[10px] font-bold flex items-center gap-1">
                                                                <CheckCircle2 size={12} /> {t.status === 'Done' ? 'Undo' : 'Mark Done'}
                                                            </button>
                                                            <button onClick={() => setEditingTask({ ...t })} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit3 size={12} /></button>
                                                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 mb-2 leading-relaxed">{t.task}</p>
                                                    
                                                    {/* Notes Block */}
                                                    {t.notes && (
                                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start gap-2 max-w-2xl mb-2">
                                                            <FileText size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs text-slate-600 italic font-medium leading-relaxed">{t.notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Blockers */}
                                                    {t.hambatan && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-2xl inline-flex mb-2">
                                                            <AlertTriangle size={12} className="text-rose-500" />
                                                            <span>Blocker: {t.hambatan}</span>
                                                        </div>
                                                    )}

                                                    {/* Link badge */}
                                                    {t.link && (() => {
                                                        const info = getLinkInfo(t.link);
                                                        if (!info) return null;
                                                        return (
                                                            <div className="mt-2.5 flex items-center gap-2">
                                                                <a
                                                                    href={t.link.startsWith('http') ? t.link : `https://${t.link}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border shadow-sm transition-all hover:scale-102 ${info.color}`}
                                                                >
                                                                    {info.iconName === 'github' && <Github size={12} />}
                                                                    {info.iconName === 'figma' && <Figma size={12} />}
                                                                    {info.iconName === 'notion' && <FileText size={12} />}
                                                                    {info.iconName === 'google-drive' && <Globe size={12} />}
                                                                    {info.iconName === 'meet' && <Video size={12} />}
                                                                    {info.iconName === 'zoom' && <Video size={12} />}
                                                                    {info.iconName === 'youtube' && <Youtube size={12} />}
                                                                    {info.iconName === 'vercel' && <Globe size={12} />}
                                                                    {info.iconName === 'whatsapp' && <MessageSquare size={12} />}
                                                                    {info.iconName === 'generic' && <LinkIcon size={12} />}
                                                                    {info.label}
                                                                    <ExternalLink size={10} className="opacity-60 ml-0.5" />
                                                                </a>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(t.link);
                                                                        alert('Link copied to clipboard!');
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    title="Copy Link"
                                                                >
                                                                    <Copy size={12} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* WEEKLY VIEW */}
                            {viewMode === 'weekly' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="overflow-x-auto hide-scrollbar">
                                        <div className="min-w-[900px]">
                                            <div className="grid grid-cols-5 gap-3 mb-3">
                                                {weekDays.map(day => {
                                                    const isToday = day === formatDate(new Date());
                                                    const isCurrent = day === dateStr;
                                                    return (
                                                        <button key={day} onClick={() => setCurrentDate(new Date(day + 'T00:00:00'))}
                                                            className={`p-3 rounded-xl text-center transition-all shadow-sm ${isCurrent ? 'bg-indigo-600 text-white shadow-lg' : isToday ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}</p>
                                                            <p className="text-lg font-black">{new Date(day + 'T00:00:00').getDate()}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="grid grid-cols-5 gap-3">
                                                {weekDays.map(day => {
                                                    const dayTasks = weekTasks.filter(t => t.date === day);
                                                    return (
                                                        <div key={day} className="bg-white border border-slate-200 rounded-2xl p-3 min-h-[200px] shadow-sm">
                                                            <div className="space-y-2">
                                                                {dayTasks.length === 0 && <p className="text-[10px] text-slate-400 font-bold text-center py-4 uppercase">No data</p>}
                                                                {dayTasks.map(t => {
                                                                    const c = getColor(t.memberName);
                                                                    return (
                                                                        <div key={t.id} className={`${c.bg} border ${c.border} rounded-xl p-2.5`}>
                                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></div>
                                                                                <span className={`text-[8px] font-black uppercase ${c.text}`}>{t.memberName}</span>
                                                                                <span className={`ml-auto text-[7px] font-black uppercase px-1 py-0.5 rounded ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status === 'Done' ? '✓' : '...'}</span>
                                                                            </div>
                                                                            <p className="text-[10px] font-bold text-slate-700 line-clamp-2 leading-relaxed">{t.task}</p>
                                                                            
                                                                            {/* Link Indicator */}
                                                                            {t.link && (
                                                                                <div className="mt-1 flex items-center gap-0.5 text-[8px] text-slate-500 font-black">
                                                                                    <LinkIcon size={8} /> Link Attached
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DAILY GENERAL ANNOUNCEMENTS & QUICK LINKS BOARD */}
                        {!isRangeMode && viewMode !== 'weekly' && (
                            <div className="xl:col-span-3 space-y-6">
                                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-5 sticky top-24">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <Pin size={14} className="rotate-45" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">Shared Daily Board</h3>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">General Resources</p>
                                            </div>
                                        </div>
                                        
                                        {/* Save Board Status Indicator */}
                                        <button
                                            onClick={() => handleSaveGeneral()}
                                            disabled={savingGeneral}
                                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                generalSavedSuccess
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                    : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 disabled:opacity-40 shadow-sm'
                                            }`}
                                            title="Save Shared Board"
                                        >
                                            {savingGeneral ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : generalSavedSuccess ? (
                                                <Check size={12} />
                                            ) : (
                                                <Save size={12} />
                                            )}
                                            {generalSavedSuccess ? 'Saved' : 'Save'}
                                        </button>
                                    </div>

                                    {/* Announcements / Notes Section */}
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                            📝 Announcements / General Notes
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={generalNotes}
                                            onChange={(e) => setGeneralNotes(e.target.value)}
                                            placeholder="Write announcements, general updates, Google Meet link, or attendance notes here for today..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-950 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed placeholder-slate-400"
                                        />
                                    </div>

                                    {/* General Daily Links Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                                🔗 Quick Meeting / Retro Links
                                            </label>
                                            <button
                                                onClick={() => setIsAddingGeneralLink(!isAddingGeneralLink)}
                                                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 uppercase tracking-wider"
                                            >
                                                {isAddingGeneralLink ? 'Cancel' : '+ Add Link'}
                                            </button>
                                        </div>

                                        {isAddingGeneralLink && (
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                                                <input
                                                    type="text"
                                                    placeholder="Link Title (e.g. Google Meet)"
                                                    value={newGeneralTitle}
                                                    onChange={(e) => setNewGeneralTitle(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="URL (https://...)"
                                                    value={newGeneralUrl}
                                                    onChange={(e) => setNewGeneralUrl(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <button
                                                    onClick={handleAddGeneralLink}
                                                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm"
                                                >
                                                    Attach Link
                                                </button>
                                            </div>
                                        )}

                                        {/* Shared Links List */}
                                        <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                                            {generalLinks.length === 0 && (
                                                <p className="text-[10px] text-slate-400 font-bold text-center py-4 uppercase border-2 border-dashed border-slate-100 rounded-2xl">No links shared today</p>
                                            )}
                                            {generalLinks.map((link, idx) => {
                                                const info = getLinkInfo(link.url);
                                                return (
                                                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:bg-white hover:border-slate-200">
                                                        <a
                                                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 min-w-0 flex-1"
                                                        >
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                                <LinkIcon size={10} className="text-indigo-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{link.title}</p>
                                                                <p className="text-[8px] text-slate-400 truncate mt-0.5">{info?.label || 'External Link'}</p>
                                                            </div>
                                                        </a>
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(link.url);
                                                                    alert('Link copied to clipboard!');
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                                                title="Copy URL"
                                                            >
                                                                <Copy size={10} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveGeneralLink(idx)}
                                                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                                                title="Delete Link"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-slate-400 font-bold leading-normal italic text-center">
                                        💡 Shared Board updates are immediately visible to anyone viewing today's standup.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========== ADD TASK MODAL ========== */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col border border-slate-100">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Add Standup Task</h3>
                                {newTask.memberName && (
                                    <p className={`text-xs font-bold ${getColor(newTask.memberName).text} mt-0.5`}>for {newTask.memberName}</p>
                                )}
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Team Member</label>
                                <select value={newTask.memberName} onChange={(e) => setNewTask(p => ({ ...p, memberName: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950">
                                    <option value="">Select member...</option>
                                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Description</label>
                                <textarea rows={3} value={newTask.task} onChange={(e) => setNewTask(p => ({ ...p, task: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-slate-950" placeholder="What did you work on?"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Status</label>
                                    <select value={newTask.status} onChange={(e) => setNewTask(p => ({ ...p, status: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950">
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Notes (Optional)</label>
                                    <input type="text" value={newTask.notes} onChange={(e) => setNewTask(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" placeholder="e.g. Almost finished..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Link / Attachment URL</label>
                                <input type="text" value={newTask.link} onChange={(e) => setNewTask(p => ({ ...p, link: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" placeholder="e.g. Figma, GitHub URL, Notion Doc link..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase"><AlertTriangle size={10} className="inline mr-1 text-rose-500" />Hambatan / Blockers</label>
                                <input type="text" value={newTask.hambatan} onChange={(e) => setNewTask(p => ({ ...p, hambatan: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" placeholder="Any blockers preventing completion?" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
                            <button disabled={submitting || !newTask.memberName || !newTask.task} onClick={handleAdd} className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                                {submitting ? 'Adding...' : 'Add Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EDIT TASK MODAL ========== */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col border border-slate-100">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-900">Edit Task</h3>
                            <button onClick={() => setEditingTask(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Team Member</label>
                                <select value={editingTask.memberName} onChange={(e) => setEditingTask(p => p ? { ...p, memberName: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950">
                                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Description</label>
                                <textarea rows={3} value={editingTask.task} onChange={(e) => setEditingTask(p => p ? { ...p, task: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-slate-950"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Status</label>
                                    <select value={editingTask.status} onChange={(e) => setEditingTask(p => p ? { ...p, status: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950">
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Notes</label>
                                    <input type="text" value={editingTask.notes || ''} onChange={(e) => setEditingTask(p => p ? { ...p, notes: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Link / Attachment URL</label>
                                <input type="text" value={editingTask.link || ''} onChange={(e) => setEditingTask(p => p ? { ...p, link: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" placeholder="e.g. Figma, GitHub, Notion link..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase"><AlertTriangle size={10} className="inline mr-1 text-rose-500" />Hambatan / Blockers</label>
                                <input type="text" value={editingTask.hambatan || ''} onChange={(e) => setEditingTask(p => p ? { ...p, hambatan: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-950" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
                            <button onClick={() => { handleDelete(editingTask.id); setEditingTask(null); }} className="px-4 py-3 text-rose-600 hover:bg-rose-50 border border-rose-200/50 text-xs font-black uppercase rounded-xl transition-colors flex items-center gap-1">
                                <Trash2 size={12} /> Delete
                            </button>
                            <button disabled={submitting} onClick={handleEdit} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-40">
                                {submitting ? 'Saving...' : 'Update Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </main>
    );
}
