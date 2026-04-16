'use client';
import { useEffect, useState, useMemo } from 'react';
import { Plus, X, Loader2, ChevronLeft, ChevronRight, Calendar, CheckCircle2, Clock, AlertTriangle, Users, BarChart3, Trash2, Edit3 } from 'lucide-react';

// Team members from spreadsheet
const TEAM_MEMBERS = ['Fariz', 'Dwi', 'Wina', 'Annisa', 'Lossa', 'Amel', 'Hadi', 'Zhafran'];

const MEMBER_COLORS: Record<string, { bg: string; border: string; text: string; light: string; dot: string; btn: string }> = {
    'Fariz': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', light: 'bg-blue-100', dot: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
    'Dwi': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-100', dot: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    'Wina': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', light: 'bg-purple-100', dot: 'bg-purple-500', btn: 'bg-purple-600 hover:bg-purple-700' },
    'Annisa': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', light: 'bg-rose-100', dot: 'bg-rose-500', btn: 'bg-rose-600 hover:bg-rose-700' },
    'Lossa': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', light: 'bg-amber-100', dot: 'bg-amber-500', btn: 'bg-amber-600 hover:bg-amber-700' },
    'Amel': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', light: 'bg-cyan-100', dot: 'bg-cyan-500', btn: 'bg-cyan-600 hover:bg-cyan-700' },
    'Hadi': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', light: 'bg-indigo-100', dot: 'bg-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    'Zhafran': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', light: 'bg-teal-100', dot: 'bg-teal-500', btn: 'bg-teal-600 hover:bg-teal-700' },
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

    // Modal State
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<StandupTask | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [newTask, setNewTask] = useState({ memberName: '', task: '', status: 'In Progress', notes: '', hambatan: '' });

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
            if (json.success) setTasks(json.data || []);
        } catch (err) {
            console.error('Failed to fetch standup', err);
        } finally {
            setLoading(false);
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
        setNewTask({ memberName: member, task: '', status: 'In Progress', notes: '', hambatan: '' });
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
                setNewTask({ memberName: '', task: '', status: 'In Progress', notes: '', hambatan: '' });
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
        <main className="min-h-screen bg-slate-100 font-sans pb-24">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-indigo-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{analytics.total}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Tasks</p>
                        </div>
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle2 size={18} className="text-emerald-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-emerald-700">{analytics.done}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Done ({analytics.rate}%)</p>
                        </div>
                    </div>
                    <div className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Clock size={18} className="text-amber-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-amber-700">{analytics.inProgress}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">In Progress</p>
                        </div>
                    </div>
                    <div className="bg-white border border-rose-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center"><AlertTriangle size={18} className="text-rose-600" /></div>
                        <div>
                            <p className="text-2xl font-black text-rose-700">{analytics.withBlockers}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Blockers</p>
                        </div>
                    </div>
                </div>

                {/* Date nav + Action bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
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

                    <div className="flex items-center gap-2">
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
                        <button onClick={() => openAddModal()} className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
                            <Plus size={12} /> Add Task
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : (
                    <>
                        {/* GRID VIEW */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                {TEAM_MEMBERS.filter(m => memberFilter.length === 0 || memberFilter.includes(m)).map(member => {
                                    const memberTasks = tasksByMember[member] || [];
                                    const c = getColor(member);
                                    const doneTasks = memberTasks.filter(t => t.status === 'Done').length;
                                    return (
                                        <div key={member} className={`${c.bg} border-2 ${c.border} rounded-2xl overflow-hidden transition-all hover:shadow-lg`}>
                                            {/* Member header — click to add */}
                                            <div className="p-4 flex items-center justify-between">
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
                                                    className={`w-8 h-8 rounded-xl ${c.btn} text-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95`}
                                                    title={`Add task for ${member}`}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Task list */}
                                            <div className="px-3 pb-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {memberTasks.length === 0 && (
                                                    <button
                                                        onClick={() => openAddModal(member)}
                                                        className={`w-full py-5 text-[10px] font-bold ${c.text} opacity-60 uppercase tracking-widest border-2 border-dashed ${c.border} rounded-xl hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5`}
                                                    >
                                                        <Plus size={12} /> Add first task
                                                    </button>
                                                )}
                                                {memberTasks.map(t => (
                                                    <div key={t.id} className={`bg-white rounded-xl p-3 border border-slate-100 group transition-all hover:shadow-sm ${t.status === 'Done' ? 'opacity-60' : ''}`}>
                                                        <div className="flex items-start gap-2">
                                                            <button onClick={() => handleToggleStatus(t)} className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}>
                                                                {t.status === 'Done' && <CheckCircle2 size={12} />}
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-bold leading-relaxed ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.task}</p>
                                                                {t.notes && <p className="text-[10px] text-slate-500 mt-1 italic font-medium">{t.notes}</p>}
                                                                {t.hambatan && (
                                                                    <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                                                        <AlertTriangle size={10} /> {t.hambatan}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => setEditingTask({ ...t })} className={`p-1 ${c.text} hover:opacity-70 rounded`}><Edit3 size={12} /></button>
                                                                <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><Trash2 size={12} /></button>
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
                            <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                                {filteredTasks.length === 0 && (
                                    <div className="text-center py-16 text-slate-500 font-bold uppercase text-xs tracking-widest">No standup data for this date</div>
                                )}
                                {filteredTasks.map(t => {
                                    const c = getColor(t.memberName);
                                    return (
                                        <div key={t.id} className="flex items-start gap-4 group">
                                            <div className="flex flex-col items-center pt-1">
                                                <div className={`w-3 h-3 rounded-full ${t.status === 'Done' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                                <div className="w-0.5 h-full bg-slate-200 min-h-[40px]"></div>
                                            </div>
                                            <div className={`flex-1 bg-white border-2 ${c.border} rounded-2xl p-4 transition-all hover:shadow-md shadow-sm`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${c.text} ${c.light} px-2 py-0.5 rounded-md`}>{t.memberName}</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 mb-1">{t.task}</p>
                                                {t.notes && <p className="text-[11px] text-slate-500 italic font-medium">{t.notes}</p>}
                                                {t.hambatan && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg inline-flex">
                                                        <AlertTriangle size={10} /> {t.hambatan}
                                                    </div>
                                                )}
                                                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleToggleStatus(t)} className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 text-[10px] font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> {t.status === 'Done' ? 'Undo' : 'Mark Done'}
                                                    </button>
                                                    <button onClick={() => setEditingTask({ ...t })} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit3 size={12} /></button>
                                                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 size={12} /></button>
                                                </div>
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
                                                        className={`p-3 rounded-xl text-center transition-all shadow-sm ${isCurrent ? 'bg-indigo-600 text-white shadow-lg' : isToday ? 'bg-indigo-50 border-2 border-indigo-300 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
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
                                                                    <div key={t.id} className={`${c.bg} border ${c.border} rounded-lg p-2`}>
                                                                        <div className="flex items-center gap-1 mb-1">
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></div>
                                                                            <span className={`text-[8px] font-black uppercase ${c.text}`}>{t.memberName}</span>
                                                                            <span className={`ml-auto text-[7px] font-black uppercase px-1 py-0.5 rounded ${t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status === 'Done' ? '✓' : '...'}</span>
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-slate-700 line-clamp-2">{t.task}</p>
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
                    </>
                )}
            </div>

            {/* ========== ADD TASK MODAL ========== */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
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
                                <select value={newTask.memberName} onChange={(e) => setNewTask(p => ({ ...p, memberName: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                                    <option value="">Select member...</option>
                                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Description</label>
                                <textarea rows={3} value={newTask.task} onChange={(e) => setNewTask(p => ({ ...p, task: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900" placeholder="What did you work on?"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Status</label>
                                    <select value={newTask.status} onChange={(e) => setNewTask(p => ({ ...p, status: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Notes</label>
                                    <input type="text" value={newTask.notes} onChange={(e) => setNewTask(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" placeholder="Optional..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase"><AlertTriangle size={10} className="inline mr-1 text-rose-500" />Hambatan / Blockers</label>
                                <input type="text" value={newTask.hambatan} onChange={(e) => setNewTask(p => ({ ...p, hambatan: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" placeholder="Any blockers?" />
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
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-900">Edit Task</h3>
                            <button onClick={() => setEditingTask(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Team Member</label>
                                <select value={editingTask.memberName} onChange={(e) => setEditingTask(p => p ? { ...p, memberName: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Task Description</label>
                                <textarea rows={3} value={editingTask.task} onChange={(e) => setEditingTask(p => p ? { ...p, task: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Status</label>
                                    <select value={editingTask.status} onChange={(e) => setEditingTask(p => p ? { ...p, status: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Notes</label>
                                    <input type="text" value={editingTask.notes || ''} onChange={(e) => setEditingTask(p => p ? { ...p, notes: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase"><AlertTriangle size={10} className="inline mr-1 text-rose-500" />Hambatan / Blockers</label>
                                <input type="text" value={editingTask.hambatan || ''} onChange={(e) => setEditingTask(p => p ? { ...p, hambatan: e.target.value } : p)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-3">
                            <button onClick={() => { handleDelete(editingTask.id); setEditingTask(null); }} className="px-4 py-3 text-rose-600 hover:bg-rose-50 text-xs font-black uppercase rounded-xl transition-colors flex items-center gap-1">
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
