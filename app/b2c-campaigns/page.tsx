'use client';
import { useState, useEffect, useMemo } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import { Plus, Edit2, Trash2, X, Target, Loader2, Check, ArrowLeft, Wallet, TrendingDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

const BI_EDIT_CONFIG: Record<string, any> = {
  campaigns: {
    title: 'Campaign',
    empty: { name: '', period: '', startDate: '', endDate: '', leads: 0, conversion: 0, status: 'Active' },
    fields: [
      { key: 'name', label: 'Campaign Name', type: 'text' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'Q2 2026' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'leads', label: 'Leads Count', type: 'number' },
      { key: 'conversion', label: 'Conversion (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Planned'] },
    ],
  },
  budget: {
    title: 'Budget Item',
    empty: { category: 'Operational', amount: 0, date: '', description: '' },
    fields: [
      { key: 'category', label: 'Category', type: 'select', options: ['Ads Spend', 'Event', 'Operational', 'Software', 'Other'] },
      { key: 'amount', label: 'Amount (Rp)', type: 'number' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  contents: {
    title: 'Konten',
    empty: { title: '', platform: 'Instagram', account: 'mapidseeit', contentType: 'Reels', date: '', status: 'Drafting', pic: '' },
    fields: [
      { key: 'title', label: 'Title / Topic', type: 'text' },
      { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'YouTube', 'Other'] },
      { key: 'account', label: 'Akun Media', type: 'select', options: ['mapidseeit', 'mapidacademy', 'Other'] },
      { key: 'contentType', label: 'Content Type', type: 'select', options: ['Feed', 'Story', 'Reels', 'Video', 'Article', 'Other'] },
      { key: 'date', label: 'Publish Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Idea', 'Drafting', 'Editing', 'Finalized', 'Scheduled', 'Published'] },
      { key: 'pic', label: 'PIC', type: 'text' },
    ],
  },
};

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const EditModal = ({ isOpen, onClose, onSave, onDelete, title, fields, data, onChange }: any) => {
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
              {f.type === 'select' ? (
                <div className="space-y-2">
                  <select 
                    value={f.options.includes(data?.[f.key]) ? data?.[f.key] : (data?.[f.key] ? 'Other' : '')} 
                    onChange={e => onChange(f.key, e.target.value)} 
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none"
                  >
                    <option value="" disabled>Select {f.label}</option>
                    {f.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {(data?.[f.key] === 'Other' || (data?.[f.key] && !f.options.includes(data?.[f.key]))) && (
                    <input 
                      type="text" 
                      placeholder={`Enter custom ${f.label}`} 
                      value={data?.[f.key] === 'Other' ? '' : data?.[f.key]} 
                      onChange={e => onChange(f.key, e.target.value)} 
                      className="w-full p-3 bg-white border border-zinc-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none animate-in slide-in-from-top-1 duration-150"
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder || ''} value={data?.[f.key] ?? (f.type === 'number' ? 0 : '')} onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-zinc-100 flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition border border-rose-200">
              <Trash2 size={12} className="inline mr-1.5" /> Delete
            </button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition">Cancel</button>
          <button onClick={onSave} className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default function B2CCampaignsPage() {
  const { isLoading: globalIsLoading, syncData } = useGlobalData();
  const [config, setConfigState] = useState(() => getConfig());
  const [activeQuarter, setActiveQuarter] = useState<1 | 2 | 3 | 4>(Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4);
  const [campaignPage, setCampaignPage] = useState(1);
  const [contentPage, setContentPage] = useState(1);
  const [budgetPage, setBudgetPage] = useState(1);
  const CAMPAIGNS_PER_PAGE = 5;
  const CONTENTS_PER_PAGE = 5;
  const BUDGET_PER_PAGE = 10;
  const [activeTab, setActiveTab] = useState<'Overview' | 'ContentCalendar' | 'CampaignCalendar' | 'Budget'>('Overview');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [editModal, setEditModal] = useState<{ section: string; index: number; data: any } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setConfigState(getConfig());
  }, [globalIsLoading]);

  const openEditModal = (section: string, index: number = -1, defaultData: any = null) => {
    const sectionConfig = BI_EDIT_CONFIG[section];
    if (!sectionConfig) return;
    const existingData = index >= 0 ? (config.biData as any)?.[section]?.[index] : null;
    setEditModal({ section, index, data: existingData ? { ...existingData } : { ...sectionConfig.empty, ...defaultData } });
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
    await syncData({ silent: true });
    setConfigState(getConfig());
    setEditModal(null);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const handleDeleteItem = async (section: string, index: number) => {
    if (!confirm('Delete this item?')) return;
    setEditModal(null);
    setSaveStatus('saving');
    const newConfig = JSON.parse(JSON.stringify(config));
    if (newConfig.biData?.[section]) {
      newConfig.biData[section].splice(index, 1);
      setConfigState(newConfig);
      setConfigLS(newConfig);
      await saveConfigToSupabase(newConfig);
      await syncData({ silent: true });
      setConfigState(getConfig());
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const campaigns = config.biData?.campaigns || [];
  const contents = config.biData?.contents || [];

  const quarterRanges = useMemo(() => {
    const year = new Date().getFullYear();
    return {
      1: { start: `${year}-01-01`, end: `${year}-03-31`, label: `Q1 ${year}`, range: `01/01/${year} – 31/03/${year}` },
      2: { start: `${year}-04-01`, end: `${year}-06-30`, label: `Q2 ${year}`, range: `01/04/${year} – 30/06/${year}` },
      3: { start: `${year}-07-01`, end: `${year}-09-30`, label: `Q3 ${year}`, range: `01/07/${year} – 30/09/${year}` },
      4: { start: `${year}-10-01`, end: `${year}-12-31`, label: `Q4 ${year}`, range: `01/10/${year} – 31/12/${year}` },
    };
  }, []);

  const currentQuarter = quarterRanges[activeQuarter];

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c: any) => {
      const campStart = c.startDate;
      const campEnd = c.endDate || c.startDate;
      if (!campStart) return false;
      return campStart <= currentQuarter.end && campEnd >= currentQuarter.start;
    });
  }, [campaigns, currentQuarter]);

  const totalCampaignPages = Math.max(1, Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE));
  const paginatedCampaigns = filteredCampaigns.slice((campaignPage - 1) * CAMPAIGNS_PER_PAGE, campaignPage * CAMPAIGNS_PER_PAGE);

  const filteredContents = useMemo(() => {
    return contents.filter((c: any) => {
      if (!c.date) return false;
      return c.date <= currentQuarter.end && c.date >= currentQuarter.start;
    });
  }, [contents, currentQuarter]);

  const totalContentPages = Math.max(1, Math.ceil(filteredContents.length / CONTENTS_PER_PAGE));
  const paginatedContents = filteredContents.slice((contentPage - 1) * CONTENTS_PER_PAGE, contentPage * CONTENTS_PER_PAGE);

  const filteredBudget = useMemo(() => {
    return (config.biData?.budget || []).filter((b: any) => {
      if (!b.date) return false;
      return b.date <= currentQuarter.end && b.date >= currentQuarter.start;
    });
  }, [config.biData?.budget, currentQuarter]);

  const totalBudgetPages = Math.max(1, Math.ceil(filteredBudget.length / BUDGET_PER_PAGE));
  const paginatedBudget = filteredBudget.slice((budgetPage - 1) * BUDGET_PER_PAGE, budgetPage * BUDGET_PER_PAGE);

  const budgetData = config.biData?.budget || [];
  const totalSpent = budgetData.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const maxBudget = (config as any).b2cTotalBudget || 100000000;
  const remaining = maxBudget - totalSpent;
  const budgetUsagePercent = maxBudget > 0 ? Math.min((totalSpent / maxBudget) * 100, 100) : 0;
  const spentByCategory = budgetData.reduce((acc: any, item: any) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {} as Record<string, number>);
  const sortedCategories = Object.entries(spentByCategory).sort((a: any, b: any) => b[1] - a[1]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const nextWeek = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() + 7);
    setCalendarDate(d);
  };
  const prevWeek = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() - 7);
    setCalendarDate(d);
  };
  const nextDay = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() + 1);
    setCalendarDate(d);
  };
  const prevDay = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() - 1);
    setCalendarDate(d);
  };

  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const grid = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const pD = new Date(year, month - 1, prevMonthLastDay - i);
      grid.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateStr: `${pD.getFullYear()}-${String(pD.getMonth() + 1).padStart(2, '0')}-${String(pD.getDate()).padStart(2, '0')}`
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      grid.push({ day: i, isCurrentMonth: true, dateStr: dStr });
    }
    const totalCells = Math.ceil(grid.length / 7) * 7;
    const remainingCells = totalCells - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nD = new Date(year, month + 1, i);
      grid.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${nD.getFullYear()}-${String(nD.getMonth() + 1).padStart(2, '0')}-${String(nD.getDate()).padStart(2, '0')}`
      });
    }
    return grid;
  }, [calendarDate]);

  const weekDays = useMemo(() => {
    const start = new Date(calendarDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({
        day: d.getDate(),
        dayName: dayNamesShort[d.getDay()],
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        isToday: new Date().toLocaleDateString('id-ID') === d.toLocaleDateString('id-ID'),
      });
    }
    return days;
  }, [calendarDate]);

  const dayHours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  }, []);

  const weekDateRange = useMemo(() => {
    const start = new Date(calendarDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [calendarDate]);

  const campaignEvents = useMemo(() => {
    const list: any[] = [];
    campaigns.forEach((c: any, idx: number) => {
      if (!c.startDate) return;
      list.push({
        id: `camp-${idx}`,
        origIdx: idx,
        title: c.name,
        type: 'campaign',
        startDate: c.startDate,
        endDate: c.endDate || c.startDate,
        status: c.status,
        color: c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
             : c.status === 'Planned' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
             : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
      });
    });
    return list;
  }, [campaigns]);

  const contentEvents = useMemo(() => {
    const list: any[] = [];
    contents.forEach((c: any, idx: number) => {
      if (!c.date) return;
      const isPublished = c.status === 'Published';
      list.push({
        id: `cont-${idx}`,
        origIdx: idx,
        title: c.title,
        type: 'content',
        startDate: c.date,
        endDate: c.date,
        status: c.status,
        account: c.account,
        platform: c.platform,
        color: isPublished ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
             : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
      });
    });
    return list;
  }, [contents]);

  const getEventsByDate = (dateStr: string, events: any[]) => {
    return events.filter(evt => {
      if (evt.type === 'content') return evt.startDate === dateStr;
      const cur = new Date(dateStr);
      const st = new Date(evt.startDate); st.setHours(0,0,0,0);
      const en = new Date(evt.endDate); en.setHours(23,59,59,999);
      return cur >= st && cur <= en;
    });
  };

  const getCalendarNavLabel = () => {
    if (calendarView === 'month') return `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    if (calendarView === 'week') return weekDateRange;
    return calendarDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderCalendarNav = () => (
    <div className="flex items-center gap-4">
      <button onClick={calendarView === 'month' ? prevMonth : calendarView === 'week' ? prevWeek : prevDay} className="p-2 hover:bg-zinc-100 rounded-xl transition"><ChevronLeft size={20} /></button>
      <span className="font-black text-lg min-w-[200px] text-center">{getCalendarNavLabel()}</span>
      <button onClick={calendarView === 'month' ? nextMonth : calendarView === 'week' ? nextWeek : nextDay} className="p-2 hover:bg-zinc-100 rounded-xl transition"><ChevronRight size={20} /></button>
    </div>
  );

  const renderViewToggle = () => (
    <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
      {(['month', 'week', 'day'] as const).map(v => (
        <button key={v} onClick={() => setCalendarView(v)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${calendarView === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
          {v}
        </button>
      ))}
    </div>
  );

  const renderMonthCalendar = (events: any[], section: string, defaultDataFn: (dateStr: string) => any) => (
    <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
      {dayNamesShort.map(day => (
        <div key={day} className="bg-zinc-50 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">{day}</div>
      ))}
      {calendarGrid.map((cell, idx) => {
        const cellEvents = getEventsByDate(cell.dateStr, events);
        const isToday = new Date().toLocaleDateString('id-ID') === new Date(cell.dateStr).toLocaleDateString('id-ID');
        return (
          <div key={idx}
            onClick={() => cell.isCurrentMonth && openEditModal(section, -1, defaultDataFn(cell.dateStr))}
            className={`bg-white min-h-[120px] p-2 border-t border-zinc-100 transition hover:bg-zinc-50/80 cursor-pointer group/day ${cell.isCurrentMonth ? '' : 'opacity-40'}`}>
            <div className="flex justify-between items-center mb-2">
              <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-zinc-900 text-white' : 'text-zinc-600 group-hover/day:bg-zinc-100'}`}>
                {cell.day}
              </div>
              {cell.isCurrentMonth && (
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 opacity-0 group-hover/day:opacity-100 transition">+ ADD</span>
              )}
            </div>
            <div className="space-y-1 max-h-[85px] overflow-y-auto hide-scrollbar">
              {cellEvents.map((evt: any) => (
                <div key={evt.id}
                  onClick={(e) => { e.stopPropagation(); openEditModal(evt.type === 'campaign' ? 'campaigns' : 'contents', evt.origIdx); }}
                  className={`text-[9px] font-bold px-2 py-1 rounded truncate border hover:scale-105 transition-all ${evt.color}`}
                  title={`${evt.title} (Click to Edit)`}>
                  {evt.type === 'content' && <span className="opacity-60">📱 </span>}{evt.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekCalendar = (events: any[], section: string, defaultDataFn: (dateStr: string) => any) => (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-zinc-200">
        {weekDays.map(d => (
          <div key={d.dateStr} className={`py-3 text-center border-b border-zinc-200 ${d.isToday ? 'bg-zinc-900 text-white' : 'bg-zinc-50'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest">{d.dayName}</div>
            <div className={`text-lg font-black ${d.isToday ? 'text-white' : 'text-zinc-900'}`}>{d.day}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-100">
        {weekDays.map(d => {
          const dayEvents = getEventsByDate(d.dateStr, events);
          return (
            <div key={d.dateStr}
              onClick={() => openEditModal(section, -1, defaultDataFn(d.dateStr))}
              className="bg-white min-h-[400px] p-2 cursor-pointer hover:bg-zinc-50/80 transition">
              <div className="space-y-1">
                {dayEvents.map((evt: any) => (
                  <div key={evt.id}
                    onClick={(e) => { e.stopPropagation(); openEditModal(evt.type === 'campaign' ? 'campaigns' : 'contents', evt.origIdx); }}
                    className={`text-[9px] font-bold px-2 py-1.5 rounded border truncate hover:scale-105 transition-all ${evt.color}`}
                    title={`${evt.title} (Click to Edit)`}>
                    {evt.type === 'content' && <span className="opacity-60">📱 </span>}{evt.title}
                    <span className="block text-[8px] opacity-60 mt-0.5">{evt.status}</span>
                  </div>
                ))}
                {dayEvents.length === 0 && d.isToday && (
                  <div className="text-[9px] text-zinc-300 font-bold text-center mt-8">Click to add</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayCalendar = (events: any[], section: string, defaultDataFn: (dateStr: string) => any) => {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(calendarDate.getDate()).padStart(2, '0')}`;
    const dayEvents = getEventsByDate(dateStr, events);
    const isToday = new Date().toLocaleDateString('id-ID') === calendarDate.toLocaleDateString('id-ID');

    return (
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className={`px-6 py-4 border-b border-zinc-200 ${isToday ? 'bg-zinc-900 text-white' : 'bg-zinc-50'}`}>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{dayNamesShort[calendarDate.getDay()]}</div>
          <div className={`text-2xl font-black ${isToday ? 'text-white' : 'text-zinc-900'}`}>{calendarDate.getDate()}</div>
        </div>
        <div className="grid grid-cols-[60px_1fr] gap-px bg-zinc-100">
          {dayHours.map((hour, i) => (
            <div key={hour} className="bg-zinc-50 py-3 px-2 text-[10px] font-bold text-zinc-400 text-right">{hour}</div>
          )).concat([<div key="all-day" className="bg-white col-span-2" />])}
        </div>
        <div className="p-4 space-y-2 bg-white min-h-[300px]">
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Events</div>
          {dayEvents.length === 0 ? (
            <button onClick={() => openEditModal(section, -1, defaultDataFn(dateStr))}
              className="w-full p-4 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition text-center">
              Click to add event
            </button>
          ) : dayEvents.map((evt: any) => (
            <div key={evt.id}
              onClick={() => openEditModal(evt.type === 'campaign' ? 'campaigns' : 'contents', evt.origIdx)}
              className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between ${evt.color}`}>
              <div>
                <div className="text-xs font-bold">{evt.type === 'content' && '📱 '}{evt.title}</div>
                <div className="text-[9px] opacity-60 mt-0.5">{evt.status}{evt.account ? ` • ${evt.account}` : ''}</div>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendar = (events: any[], section: string, defaultDataFn: (dateStr: string) => any) => {
    if (calendarView === 'month') return renderMonthCalendar(events, section, defaultDataFn);
    if (calendarView === 'week') return renderWeekCalendar(events, section, defaultDataFn);
    return renderDayCalendar(events, section, defaultDataFn);
  };

  return (
    <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0">
              <Target className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">B2C Campaigns</h1>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest">Campaigns & Budget Disbursement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link href="/dashboard" className="px-3 sm:px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </Link>
            {activeTab === 'Overview' && (
              <button onClick={() => openEditModal('campaigns')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                <Plus size={12} /> Campaign
              </button>
            )}
            {activeTab === 'ContentCalendar' && (
              <>
                <button onClick={() => openEditModal('contents')} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-lg">
                  <Plus size={12} /> Konten
                </button>
                {renderViewToggle()}
              </>
            )}
            {activeTab === 'CampaignCalendar' && (
              <>
                <button onClick={() => openEditModal('campaigns')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Campaign
                </button>
                {renderViewToggle()}
              </>
            )}
            {activeTab === 'Budget' && (
              <>
                <button onClick={() => {
                  const newBudget = prompt('Enter new total budget limit (Rp):', maxBudget.toString());
                  if (newBudget && !isNaN(Number(newBudget))) {
                    const newConfig = { ...config, b2cTotalBudget: Number(newBudget) } as any;
                    setConfigState(newConfig);
                    setConfigLS(newConfig);
                    saveConfigToSupabase(newConfig);
                  }
                }} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition">
                  <Edit2 size={12} /> Set Limit
                </button>
                <button onClick={() => openEditModal('budget')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Add Spent
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-zinc-200 overflow-x-auto hide-scrollbar">
          {[
            { key: 'Overview', icon: LayoutGrid, label: 'Overview' },
            { key: 'ContentCalendar', icon: CalendarIcon, label: 'Content Calendar' },
            { key: 'CampaignCalendar', icon: CalendarIcon, label: 'Campaign Calendar' },
            { key: 'Budget', icon: Wallet, label: 'Budget' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.key ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600 border-b-2 border-transparent'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* === OVERVIEW TAB === */}
        {activeTab === 'Overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Global Quarter Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900">Overview</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                  {([1, 2, 3, 4] as const).map(q => (
                    <button key={q} onClick={() => { setActiveQuarter(q); setCampaignPage(1); setContentPage(1); setBudgetPage(1); }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeQuarter === q ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                      Q{q}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-500">{currentQuarter.range}</span>
              </div>
            </div>

            {/* Summary Metrics */}
            {(() => {
              const publishedCount = filteredContents.filter((c: any) => c.status === 'Published').length;
              const activeCampaigns = filteredCampaigns.filter((c: any) => c.status === 'Active').length;
              const totalLeads = filteredCampaigns.reduce((acc: number, c: any) => acc + (Number(c.leads) || 0), 0);
              const filteredBudgetTotal = filteredBudget.reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0);
              const filteredBudgetPct = maxBudget > 0 ? Math.min((filteredBudgetTotal / maxBudget) * 100, 100) : 0;
              const metrics = [
                { label: 'Content Published', value: `${publishedCount}/${filteredContents.length}`, sub: `${filteredContents.length - publishedCount} remaining`, color: 'bg-purple-600', icon: '📱' },
                { label: 'Active Campaigns', value: activeCampaigns, sub: `of ${filteredCampaigns.length} total`, color: 'bg-emerald-600', icon: '🎯' },
                { label: 'Total Leads', value: totalLeads.toLocaleString('id-ID'), sub: `from ${activeCampaigns} active`, color: 'bg-blue-600', icon: '📊' },
                { label: 'Budget Spent', value: formatIDR(filteredBudgetTotal), sub: `${filteredBudgetPct.toFixed(1)}% of ${formatIDR(maxBudget)}`, color: 'bg-zinc-900', icon: '💰' },
              ];
              return (
                <section>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    {metrics.map((m) => (
                      <div key={m.label} className="bg-white border border-zinc-200 p-4 sm:p-5 rounded-2xl hover:border-zinc-300 transition">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-7 h-7 ${m.color} rounded-lg flex items-center justify-center text-white text-xs`}>{m.icon}</div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{m.label}</span>
                        </div>
                        <div className="text-2xl font-black tracking-tighter text-zinc-900">{m.value}</div>
                        <div className="text-[10px] font-bold text-zinc-400 mt-1">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 pb-4 mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900">Campaign Overview</h3>
              </div>

              {/* Campaign Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-4 sm:px-6 py-4">Campaign</th>
                        <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Period</th>
                        <th className="px-4 sm:px-6 py-4">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-right">Leads</th>
                        <th className="px-4 sm:px-6 py-4 text-right hidden sm:table-cell">Conv.</th>
                        <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Dates</th>
                        <th className="px-3 sm:px-4 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedCampaigns.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No campaigns for Q{activeQuarter}</td></tr>
                      ) : paginatedCampaigns.map((camp: any) => {
                        const origIdx = campaigns.indexOf(camp);
                        return (
                          <tr key={origIdx} className="hover:bg-zinc-50 transition group">
                            <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-zinc-900 text-xs sm:text-sm">{camp.name}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs text-zinc-500 font-bold hidden sm:table-cell">{camp.period || '-'}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <span className={`text-[8px] px-2 py-0.5 font-black uppercase rounded border ${camp.status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : camp.status === 'Planned' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                                {camp.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono font-bold text-zinc-900 text-xs sm:text-sm">{(camp.leads || 0).toLocaleString('id-ID')}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono font-bold text-zinc-900 text-xs sm:text-sm hidden sm:table-cell">{camp.conversion}%</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-bold text-zinc-400 hidden md:table-cell whitespace-nowrap">
                              {camp.startDate ? `${formatDate(camp.startDate)}${camp.endDate ? ` – ${formatDate(camp.endDate)}` : ''}` : '-'}
                            </td>
                            <td className="px-3 sm:px-4 py-4 sm:py-5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditModal('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteItem('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalCampaignPages > 1 && (
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-100 bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {(campaignPage - 1) * CAMPAIGNS_PER_PAGE + 1}–{Math.min(campaignPage * CAMPAIGNS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCampaignPage(p => Math.max(1, p - 1))} disabled={campaignPage === 1}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        Prev
                      </button>
                      {Array.from({ length: totalCampaignPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCampaignPage(page)}
                          className={`w-8 h-8 text-[10px] font-black rounded-lg transition ${campaignPage === page ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                          {page}
                        </button>
                      ))}
                      <button onClick={() => setCampaignPage(p => Math.min(totalCampaignPages, p + 1))} disabled={campaignPage === totalCampaignPages}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Content Overview */}
            <section>
              <div className="border-b border-zinc-200 pb-4 mb-6">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900">Content Overview</h3>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-4 sm:px-6 py-4">Title</th>
                        <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Platform</th>
                        <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Account</th>
                        <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Type</th>
                        <th className="px-4 sm:px-6 py-4">Status</th>
                        <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Publish Date</th>
                        <th className="px-4 sm:px-6 py-4 hidden md:table-cell">PIC</th>
                        <th className="px-3 sm:px-4 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedContents.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No content for Q{activeQuarter}</td></tr>
                      ) : paginatedContents.map((item: any) => {
                        const origIdx = contents.indexOf(item);
                        return (
                          <tr key={origIdx} className="hover:bg-zinc-50 transition group">
                            <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-zinc-900 text-xs sm:text-sm max-w-[200px] truncate" title={item.title}>{item.title}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 hidden sm:table-cell">
                              <span className="text-[8px] px-2 py-0.5 font-black uppercase rounded border border-purple-200 bg-purple-50 text-purple-600">{item.platform}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs text-zinc-500 font-bold hidden sm:table-cell">{item.account || '-'}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-bold text-zinc-400 hidden md:table-cell">{item.contentType || '-'}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <span className={`text-[8px] px-2 py-0.5 font-black uppercase rounded border ${item.status === 'Published' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : item.status === 'Scheduled' ? 'border-blue-200 bg-blue-50 text-blue-600' : item.status === 'Finalized' ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-bold text-zinc-400 hidden sm:table-cell whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs text-zinc-500 font-bold hidden md:table-cell">{item.pic || '-'}</td>
                            <td className="px-3 sm:px-4 py-4 sm:py-5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditModal('contents', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteItem('contents', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalContentPages > 1 && (
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-100 bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {(contentPage - 1) * CONTENTS_PER_PAGE + 1}–{Math.min(contentPage * CONTENTS_PER_PAGE, filteredContents.length)} of {filteredContents.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setContentPage(p => Math.max(1, p - 1))} disabled={contentPage === 1}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        Prev
                      </button>
                      {Array.from({ length: totalContentPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setContentPage(page)}
                          className={`w-8 h-8 text-[10px] font-black rounded-lg transition ${contentPage === page ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                          {page}
                        </button>
                      ))}
                      <button onClick={() => setContentPage(p => Math.min(totalContentPages, p + 1))} disabled={contentPage === totalContentPages}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {activeTab === 'ContentCalendar' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Content Calendar</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Manage your content schedule</p>
              </div>
              {renderCalendarNav()}
            </div>
            {renderCalendar(contentEvents, 'contents', (dateStr: string) => ({ date: dateStr }))}
          </div>
        )}

        {/* === CAMPAIGN CALENDAR TAB === */}
        {activeTab === 'CampaignCalendar' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Campaign Calendar</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Track campaign periods and timelines</p>
              </div>
              {renderCalendarNav()}
            </div>
            {renderCalendar(campaignEvents, 'campaigns', (dateStr: string) => ({ startDate: dateStr, endDate: dateStr }))}
          </div>
        )}

        {/* === BUDGET TAB === */}
        {activeTab === 'Budget' && (
          <div className="space-y-8 animate-in fade-in">
            {(() => {
              const filteredTotalSpent = filteredBudget.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
              const filteredRemaining = maxBudget - filteredTotalSpent;
              const filteredUsagePercent = maxBudget > 0 ? Math.min((filteredTotalSpent / maxBudget) * 100, 100) : 0;
              const filteredSpentByCat = filteredBudget.reduce((acc: any, item: any) => {
                const cat = item.category || 'Other';
                acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
                return acc;
              }, {} as Record<string, number>);
              const filteredSortedCats = Object.entries(filteredSpentByCat).sort((a: any, b: any) => b[1] - a[1]);
              return (
              <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">Budget Disbursement</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-widest">Operational Spending Overview</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                      {([1, 2, 3, 4] as const).map(q => (
                        <button key={q} onClick={() => { setActiveQuarter(q); setBudgetPage(1); }}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeQuarter === q ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
                          Q{q}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs font-bold text-zinc-500">{currentQuarter.range}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-zinc-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={48} /></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Budget Limit</h4>
                    <div className="text-xl sm:text-2xl font-black tracking-tighter text-white">{formatIDR(maxBudget)}</div>
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5">
                        <span>USAGE</span>
                        <span className="text-white">{filteredUsagePercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${filteredUsagePercent > 90 ? 'bg-rose-500' : filteredUsagePercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${filteredUsagePercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown size={48} /></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Disbursed</h4>
                    <div className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-600">{formatIDR(filteredTotalSpent)}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-2">{filteredBudget.length} transaction{filteredBudget.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Remaining</h4>
                    <div className={`text-xl sm:text-2xl font-black tracking-tighter ${filteredRemaining >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>{formatIDR(filteredRemaining)}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-2">{filteredRemaining >= 0 ? 'Available' : 'Over Budget!'}</div>
                  </div>

                  {filteredSortedCats.length > 0 && (
                    <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Top Category</h4>
                      <div className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-900">{formatIDR(filteredSortedCats[0][1] as number)}</div>
                      <div className="text-[10px] font-bold text-zinc-400 mt-2 uppercase">{filteredSortedCats[0][0]} • {filteredTotalSpent > 0 ? (((filteredSortedCats[0][1] as number) / filteredTotalSpent) * 100).toFixed(1) : 0}%</div>
                    </div>
                  )}
                </div>

                {filteredSortedCats.length > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                    {filteredSortedCats.map(([cat, amount]: any) => (
                      <div key={cat} className="bg-white border border-zinc-100 p-4 rounded-xl hover:border-zinc-300 transition">
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{cat}</div>
                        <div className="text-sm font-black tracking-tight text-zinc-900">{formatIDR(amount)}</div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${filteredTotalSpent > 0 ? (amount / filteredTotalSpent) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                        <tr>
                          <th className="px-4 sm:px-6 py-4">Date</th>
                          <th className="px-4 sm:px-6 py-4">Category</th>
                          <th className="px-4 sm:px-6 py-4 hidden sm:table-cell min-w-[180px]">Description</th>
                          <th className="px-4 sm:px-6 py-4 text-right">Amount</th>
                          <th className="px-3 sm:px-4 py-4 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {paginatedBudget.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No spending for Q{activeQuarter}</td></tr>
                        ) : (
                          paginatedBudget.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime() || 0).map((row: any, idx: number) => {
                            const origIdx = (config.biData?.budget || []).indexOf(row);
                            return (
                              <tr key={idx} className="hover:bg-zinc-50 transition group">
                                <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold whitespace-nowrap text-xs sm:text-sm">{formatDate(row.date)}</td>
                                <td className="px-4 sm:px-6 py-4 sm:py-5">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block whitespace-nowrap">{row.category}</span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 font-medium italic hidden sm:table-cell">{row.description || '-'}</td>
                                <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono font-bold text-zinc-900 text-xs sm:text-sm whitespace-nowrap">{formatIDR(row.amount)}</td>
                                <td className="px-3 sm:px-4 py-4 sm:py-5">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openEditModal('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteItem('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalBudgetPages > 1 && (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-100 bg-zinc-50">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {(budgetPage - 1) * BUDGET_PER_PAGE + 1}–{Math.min(budgetPage * BUDGET_PER_PAGE, filteredBudget.length)} of {filteredBudget.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBudgetPage(p => Math.max(1, p - 1))} disabled={budgetPage === 1}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                          Prev
                        </button>
                        {Array.from({ length: totalBudgetPages }, (_, i) => i + 1).map(page => (
                          <button key={page} onClick={() => setBudgetPage(page)}
                            className={`w-8 h-8 text-[10px] font-black rounded-lg transition ${budgetPage === page ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                            {page}
                          </button>
                        ))}
                        <button onClick={() => setBudgetPage(p => Math.min(totalBudgetPages, p + 1))} disabled={budgetPage === totalBudgetPages}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              );
            })()}
          </div>
        )}
      </div>

      <EditModal isOpen={!!editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} onDelete={editModal?.index! >= 0 ? () => handleDeleteItem(editModal!.section, editModal!.index!) : undefined} title={`${editModal?.index! >= 0 ? 'Edit' : 'Add'} ${BI_EDIT_CONFIG[editModal?.section!]?.title}`} fields={BI_EDIT_CONFIG[editModal?.section!]?.fields || []} data={editModal?.data} onChange={handleEditField} />

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
