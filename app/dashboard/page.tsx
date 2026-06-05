'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useSWR from 'swr';
import {
  Loader2, ArrowUpRight, ArrowDownRight, Users, Target,
  Activity, FileText, FolderOpen, TableProperties, Lock,
  TrendingUp, BarChart3, Globe, Share2, ArrowRight, Sparkles, Maximize2, Minimize2, BookOpen, MoreVertical,
  Layers, Zap, Plus, Edit2, Trash2, X, Save, Check, Download, Calendar, Clock, Briefcase
} from 'lucide-react';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import LoadingProgress from '../components/LoadingProgress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useGrowthData } from '../growth/useGrowthData';
import { useGlobalData } from '../components/GlobalDataProvider';

const apiFetcher = (url: string) => fetch(url).then(r => r.json());

// --- BI Section Edit Configs ---
const BI_EDIT_CONFIG: Record<string, { title: string; fields: { key: string; label: string; type: string; options?: string[]; placeholder?: string }[]; empty: any }> = {
  campaigns: {
    title: 'Campaign',
    empty: { name: '', period: '', status: 'Active', leads: 0, participants: 0, conversion: 0 },
    fields: [
      { key: 'name', label: 'Campaign Name', type: 'text' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'Q2 2026' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Ended', 'Planned'] },
      { key: 'leads', label: 'Leads', type: 'number' },
      { key: 'participants', label: 'Participants', type: 'number' },
      { key: 'conversion', label: 'Conversion (%)', type: 'number' },
    ],
  },
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
  trends: {
    title: 'Trend Data Point',
    empty: { category: 'Month', label: '', revenue: 0, dealSize: 0 },
    fields: [
      { key: 'category', label: 'Timeframe', type: 'select', options: ['Month', 'Quarter', 'Year'] },
      { key: 'label', label: 'Label (e.g. Q1 2026)', type: 'text' },
      { key: 'revenue', label: 'Revenue (Millions)', type: 'number' },
      { key: 'dealSize', label: 'Avg Deal Size (Millions)', type: 'number' },
    ],
  },
  docs: {
    title: 'Gallery / Document',
    empty: { title: '', desc: '', link: '', format: 'Doc', category: '' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'format', label: 'Format', type: 'select', options: ['Doc', 'Sheet', 'Folder', 'PDF'] },
      { key: 'category', label: 'Category Tag', type: 'text' },
      { key: 'desc', label: 'Description', type: 'text' },
      { key: 'link', label: 'File URL Link', type: 'text' },
    ],
  },
};

// --- Inline Edit Modal ---
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
              {f.type === 'select' ? (
                <select value={data?.[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none">
                  {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={data?.[f.key] ?? (f.type === 'number' ? 0 : '')}
                  onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={f.placeholder || ''}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
              )}
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

export default function MinimalistDashboard() {
  const { isLoading: globalIsLoading, syncData } = useGlobalData();
  const [activeTab, setActiveTab] = useState<string>('Trends');
  const [trendCategory, setTrendCategory] = useState('All');

  // Pagination states
  const [projectPage, setProjectPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // States for Social & Community Comparison
  const [socialPrimaryMonth, setSocialPrimaryMonth] = useState('All');
  const [socialPrimaryWeek, setSocialPrimaryWeek] = useState('All');
  const [socialSecondaryMonth, setSocialSecondaryMonth] = useState('All');
  const [socialSecondaryWeek, setSocialSecondaryWeek] = useState('All');
  const [errorMsg, setErrorMsg] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Use config from global provider
  const [config, setConfigState] = useState(() => getConfig());

  // B2C Revenue date range filter (default: current quarter)
  const getQuarterDates = (q: number, y: number) => {
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0); // last day of quarter
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentY = new Date().getFullYear();
  const defaultDates = getQuarterDates(currentQ, currentY);
  const [revenueStartDate, setRevenueStartDate] = useState(defaultDates.start);
  const [revenueEndDate, setRevenueEndDate] = useState(defaultDates.end);

  // B2B Quarter Filter State
  const [b2bQuarter, setB2bQuarter] = useState<'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('All');

  // Fetch Supabase revenue payments (dynamic date range)
  const supabasePaymentsUrl = `/api/revenue/payments?start_date=${revenueStartDate}&end_date=${revenueEndDate}`;
  const { data: supabasePayData, isLoading: academyLoading } = useSWR(supabasePaymentsUrl, apiFetcher, { revalidateOnFocus: false });

  // Fetch Live Platform Data from DevServer (dynamic date range)
  const { allPayments, isLoading: platformLoading } = useGrowthData(revenueStartDate, revenueEndDate);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setConfigState(getConfig());
  }, [globalIsLoading]);

  // --- Inline Edit State ---
  const [editModal, setEditModal] = useState<{ section: string; index: number; data: any } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const openEditModal = (section: string, index: number = -1) => {
    const sectionConfig = BI_EDIT_CONFIG[section];
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

  // Custom Recharts Tooltip
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-zinc-200 p-3 rounded-xl shadow-lg">
          <p className="text-[10px] font-bold text-zinc-400 mb-1">{formatTrendLabel(label)}</p>
          <p className="text-sm font-black text-blue-500">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((Number(payload[0].value) || 0) * 1000000)}
          </p>
        </div>
      );
    }
    return null;
  };

  const data = config.biData; // Defined here for all hooks

  // Auto-fill filters based on available data
  useEffect(() => {
    const socialsData = data?.socials || [];
    if (socialsData.length > 0 && socialPrimaryMonth === 'All' && activeTab === 'B2C') {
      // Find all unique periods (month + week)
      const periods = Array.from(new Set(socialsData.map((s: any) => `${normalizeMonth(s.month)}|${s.week}`)))
        .map((p: any) => {
          const [month, week] = p.split('|');
          return { month, week, sortKey: `${month}-${week}` };
        })
        .sort((a, b) => {
          const dateA = new Date(a.month).getTime();
          const dateB = new Date(b.month).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return b.week.localeCompare(a.week, undefined, { numeric: true });
        });

      if (periods.length > 0) {
        const latest = periods[0];
        setSocialPrimaryMonth(latest.month);
        setSocialPrimaryWeek(latest.week);

        if (periods.length > 1) {
          const previous = periods[1];
          setSocialSecondaryMonth(previous.month);
          setSocialSecondaryWeek(previous.week);
        }
      }
    }

    // Identify Current Quarter (e.g., "Q2 2026")
    const now = new Date();
    const currentQuarterStr = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;




  }, [data, activeTab, mounted]);

  // Determine which quarter string to filter academy data by, based on selected date range
  const selectedQuarterStr = useMemo(() => {
    const sd = new Date(revenueStartDate);
    const q = Math.ceil((sd.getMonth() + 1) / 3);
    return `Q${q} ${sd.getFullYear()}`;
  }, [revenueStartDate]);

  // Calculate B2C Metrics (dynamic date range — both from live sources)
  const b2cMetrics = useMemo(() => {
    // Academy: from revenue_payments table where category === 'MAPID Academy'
    const academyActual = (supabasePayData?.payments || [])
      .filter((p: any) => p.category === 'MAPID Academy')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Platform manual invoices: from revenue_payments where invoice_id starts with "bus-exp"
    const manualPlatformActual = (supabasePayData?.payments || [])
      .filter((p: any) => p.invoice_id && p.invoice_id.toLowerCase().startsWith('bus-exp'))
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Platform: from DevServer (already filtered by date range via useGrowthData) + manualPlatformActual
    const platformActual = allPayments
      .filter((p: any) => p.status === 'success' && p.payment_methode?.toLowerCase() === 'midtrans')
      .reduce((sum: number, p: any) => sum + (p.detail_amount?.total || p.total || 0), 0) + manualPlatformActual;

    const academyTarget = 60000000;
    const platformTarget = 40000000;

    return {
      academy: { actual: academyActual, target: academyTarget, percent: academyTarget > 0 ? Math.min(Math.round((academyActual / academyTarget) * 100), 100) : 0 },
      platform: { actual: platformActual, target: platformTarget, percent: Math.min(Math.round((platformActual / platformTarget) * 100), 100) },
      total: { actual: academyActual + platformActual, target: academyTarget + platformTarget, percent: Math.min(Math.round(((academyActual + platformActual) / (academyTarget + platformTarget)) * 100), 100) },
      isLoading: academyLoading || platformLoading,
    };
  }, [supabasePayData, allPayments, academyLoading, platformLoading]);

  // --- B2B Logic ---
  const filteredLeads = useMemo(() => {
    const leads = config?.kanbanLeads || [];
    if (b2bQuarter === 'All') return leads;
    return leads.filter((l: any) => {
      if (!l.expectedCloseDate) return false;
      const month = new Date(l.expectedCloseDate).getMonth();
      const quarter = `Q${Math.floor(month / 3) + 1}`;
      return quarter === b2bQuarter;
    });
  }, [config.kanbanLeads, b2bQuarter]);

  const filteredProjects = useMemo(() => {
    const projects = config?.kanbanProjects || [];
    if (b2bQuarter === 'All') return projects;
    return projects.filter((p: any) => {
      if (!p.closeDate) return false;
      const month = new Date(p.closeDate).getMonth();
      const quarter = `Q${Math.floor(month / 3) + 1}`;
      return quarter === b2bQuarter;
    });
  }, [config.kanbanProjects, b2bQuarter]);

  const b2bMetrics = useMemo(() => {
    const activeProjectsRev = filteredProjects.filter((p: any) => p.stage !== 'Done' && p.stage !== 'Lost' && p.stage !== 'Freeze').reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const doneProjectsRev = filteredProjects.filter((p: any) => p.stage === 'Done').reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const potentialRevenue = filteredLeads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const weightedPipeline = filteredLeads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) * (curr.probability || 0)), 0);
    
    return {
        activeProjectsRev,
        doneProjectsRev,
        potentialRevenue,
        weightedPipeline,
        totalProjection: activeProjectsRev + doneProjectsRev + potentialRevenue,
        realizationProgress: Math.round((doneProjectsRev / (activeProjectsRev + doneProjectsRev + potentialRevenue || 1)) * 100)
    };
  }, [filteredLeads, filteredProjects]);

  // Pre-hydration check
  if (!mounted) {
      return (
          <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
          </main>
      );
  }

  const visibleTabs = Object.entries(config.tabsVisible)
    .filter(([, visible]) => visible)
    .map(([name]) => name);

  // --- HELPER FORMATTERS ---
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateInput: string) => {
    if (!dateInput || dateInput === '#') return '-';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return dateInput;
      // Menghasilkan format "28 Feb"
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    } catch {
      return dateInput;
    }
  };

  const formatTrendLabel = (label: string) => {
    // Bersihkan format ISO String jika ada date
    if (typeof label === 'string' && label.includes('T')) {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
        }).format(date).toUpperCase();
      }
    }
    return label;
  };

  const formatMonthDropdown = (label: string) => {
    if (typeof label === 'string' && label.includes('T')) {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-GB', {
          month: 'short',
          year: 'numeric'
        }).format(date);
      }
    }
    return label;
  };

  const normalizeMonth = (m: string) => {
    if (!m || typeof m !== 'string') return m;
    if (m.includes('T')) return m.split('T')[0];
    // Jika formatnya 'YYYY-MM-DD HH:mm:ss'
    if (m.includes(' ') && (m.includes('-') || m.includes('/'))) return m.split(' ')[0];
    return m;
  };

  // --- CALCULATIONS ---
  const activeRevenueData = data?.revenue || [];




  // --- LOGIC GRAFIK SVG PROPORSIONAL ---
  const currentTrendData = (Array.isArray(data?.trends) ? data.trends : [])
    .filter((d: any) => trendCategory === 'All' || d.category === trendCategory);
  const validTrendData = currentTrendData.filter((d: any) => d && d.revenue !== undefined);

  const uniqueTrendCategories = ['All', ...Array.from(new Set((Array.isArray(data?.trends) ? data.trends : []).map((d: any) => d.category).filter(Boolean)))];

  // Mencari nilai max untuk skala vertikal
  const rawMax = validTrendData.length > 0 ? Math.max(...validTrendData.map((d: any) => Number(d.revenue) || 0)) : 1;
  const maxRevenueValue = rawMax * 1.1; // Tambah buffer 10% di atas agar grafik tidak menabrak atap kontainer

  return (
    <main className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans pb-24 text-zinc-900">

      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter leading-none mb-2">MAPID <span className="text-zinc-300">BI.</span></h1>
          <p className="text-zinc-500 text-sm font-medium">Executive Performance Intelligence Dashboard</p>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <div className="max-w-6xl mx-auto mb-10 border-b border-zinc-200 flex gap-8 overflow-x-auto hide-scrollbar">
        {config.tabsVisible.Trends && <button onClick={() => setActiveTab('Trends')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'Trends' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>Trends</button>}
        {config.tabsVisible.B2C && <button onClick={() => setActiveTab('B2C')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'B2C' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>B2C</button>}
        {config.tabsVisible.B2B && <button onClick={() => setActiveTab('B2B')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'B2B' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>B2B</button>}



      </div>

      <div className="max-w-6xl mx-auto">

        {/* === TAB 1: TRENDS === */}
        {activeTab === 'Trends' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Revenue Performance</h3>
              <div className="flex gap-3 items-center">
                <button onClick={() => openEditModal('trends')} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Add Data
                </button>
                {uniqueTrendCategories.length > 2 && (
                  <select value={trendCategory} onChange={(e) => setTrendCategory(e.target.value)}
                    className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                    {uniqueTrendCategories.map((c: any) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* --- SVG LINE CHART CONTAINER --- */}
              <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl flex flex-col min-h-[450px] relative overflow-hidden">
                <div className="p-8 pb-0">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-1">Revenue Performance</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total Revenue
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition relative">
                        <Sparkles className="text-blue-500" size={12} />
                        Smart Analysis
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
                      </button>
                      <button className="p-1.5 border border-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-full h-full flex-1 pt-6 pb-2 pr-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={validTrendData.map((d: any) => ({
                        rawLabel: d.label,
                        displayLabel: formatTrendLabel(d.label),
                        revenue: Number(d.revenue) || 0,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis
                        dataKey="displayLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value * 1000000)}
                        tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                        width={90}
                        dx={-10}
                      />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomRechartsTooltip />} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {validTrendData.map((entry: any, index: number) => {
                          const origIdx = (data?.trends || []).indexOf(entry);
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill="#3b82f6" 
                              className="hover:opacity-80 transition-opacity cursor-pointer" 
                              onClick={() => openEditModal('trends', origIdx)}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Summary Cards */}
              <div className="space-y-6">
                {validTrendData.slice().reverse().slice(0, 2).map((hist: any, idx: number) => (
                  <div key={idx} className={`bg-white border border-zinc-200 p-6 rounded-2xl group relative ${idx === 0 ? 'ring-2 ring-zinc-900 ring-offset-2 shadow-lg' : 'opacity-60'}`}>
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {(() => { const origIdx = (data?.trends || []).indexOf(hist); return (<>
                        <button onClick={() => openEditModal('trends', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteItem('trends', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                      </>); })()}
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{formatTrendLabel(hist.label)} Summary</h4>
                    <div className="text-3xl font-black tracking-tighter mb-1">Rp {hist.revenue}M</div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg Deal: Rp {hist.dealSize}M</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Manage Trend History Section */}
            <div className="mt-12 bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Manage Trend History</h4>
                <div className="text-[10px] font-bold text-zinc-400">{validTrendData.length} Records Total</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/30 text-[10px] text-zinc-400 border-b border-zinc-100 uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Label</th>
                      <th className="px-6 py-4">Timeframe</th>
                      <th className="px-6 py-4">Revenue</th>
                      <th className="px-6 py-4">Avg Deal</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {validTrendData.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-300 font-bold uppercase tracking-widest text-xs">No historical data found</td></tr>
                    ) : (
                      validTrendData.slice().reverse().map((hist: any, idx: number) => {
                        const origIdx = (data?.trends || []).indexOf(hist);
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition group">
                            <td className="px-6 py-4 font-bold text-zinc-900">{hist.label}</td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block">
                                {hist.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-blue-600">Rp {hist.revenue}M</td>
                            <td className="px-6 py-4 font-mono text-zinc-500">Rp {hist.dealSize}M</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => openEditModal('trends', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteItem('trends', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* === TAB 2: B2C === */}
        {activeTab === 'B2C' && (
          <div className="space-y-12 animate-in fade-in">
            {/* B2C Revenue Cards (Live — with date range filter) */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex flex-col">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">B2C Revenue Targets</h3>
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
                  {b2cMetrics.isLoading && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                      <Loader2 size={12} className="animate-spin" /> Loading...
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Platform Module */}
                <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={48} className="text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">MAPID Platform</h4>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black tracking-tighter text-zinc-900">Rp {(b2cMetrics.platform.actual / 1000000).toFixed(1)}M</span>
                    <span className="text-xs font-bold text-zinc-400 mb-2">/ {(b2cMetrics.platform.target / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{b2cMetrics.platform.percent}% COMPLETE</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 transition-all duration-1000 ease-out" style={{ width: `${b2cMetrics.platform.percent}%` }}></div>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-4">Source: DevServer API → all_payments</p>
                </div>

                {/* Academy Module */}
                <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-blue-600 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={48} className="text-blue-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">MAPID Academy</h4>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black tracking-tighter text-zinc-900">Rp {(b2cMetrics.academy.actual / 1000000).toFixed(1)}M</span>
                    <span className="text-xs font-bold text-zinc-400 mb-2">/ {(b2cMetrics.academy.target / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{b2cMetrics.academy.percent}% COMPLETE</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${b2cMetrics.academy.percent}%` }}></div>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-4">Source: Supabase → revenue_payments</p>
                </div>

                {/* Combined Total Module */}
                <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-zinc-200 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 -z-0"></div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 relative z-10">Total B2C Performance</h4>
                  <div className="flex items-end gap-2 mb-2 relative z-10">
                    <span className="text-5xl font-black tracking-tighter text-white">Rp {(b2cMetrics.total.actual / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GLOBAL ACHIEVEMENT</span>
                    <span className="text-xs font-black text-white">{b2cMetrics.total.percent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative z-10">
                    <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${b2cMetrics.total.percent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 3: B2B === */}
        {activeTab === 'B2B' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tighter leading-none mb-2 text-zinc-900">
                  B2B <span className="text-zinc-300">Performance.</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  Revenue & Financial Pipeline
                </p>
              </div>
              <select
                value={b2bQuarter}
                onChange={(e: any) => setB2bQuarter(e.target.value)}
                className="bg-white border border-zinc-200 text-xs font-black uppercase px-4 py-3 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all shadow-sm w-full md:w-auto"
              >
                <option value="All">All Quarters</option>
                <option value="Q1">Q1 Performance</option>
                <option value="Q2">Q2 Performance</option>
                <option value="Q3">Q3 Performance</option>
                <option value="Q4">Q4 Performance</option>
              </select>
            </header>

            {/* Financial Overview (KPI Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric Card 1: Deals Won (Secured Revenue) */}
              <div className="relative overflow-hidden bg-zinc-900 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between min-h-[180px] group transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        Deals Secured (Won Revenue)
                      </span>
                      <h3 className="text-3xl font-black tracking-tight mt-1">
                        {formatIDR(b2bMetrics.doneProjectsRev + b2bMetrics.activeProjectsRev)}
                      </h3>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 text-emerald-400">
                      <Zap size={20} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs mt-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Realized / Done</p>
                    <p className="font-bold text-emerald-400">{formatIDR(b2bMetrics.doneProjectsRev)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Active Delivery</p>
                    <p className="font-bold text-blue-400">{formatIDR(b2bMetrics.activeProjectsRev)}</p>
                  </div>
                </div>
              </div>

              {/* Metric Card 2: Potential Pipeline */}
              <div className="relative overflow-hidden bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[180px] group transition-all duration-300 hover:shadow-lg hover:border-zinc-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-all duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Potential Revenue (Leads)
                      </span>
                      <h3 className="text-3xl font-black tracking-tight text-zinc-900 mt-1">
                        {formatIDR(b2bMetrics.potentialRevenue)}
                      </h3>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-indigo-600">
                      <Target size={20} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-zinc-100 text-xs mt-4">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Probability-Weighted</p>
                  <p className="font-bold text-indigo-600">{formatIDR(b2bMetrics.weightedPipeline)}</p>
                </div>
              </div>

              {/* Metric Card 3: Total Projection & Realization Progress */}
              <div className="relative overflow-hidden bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[180px] group transition-all duration-300 hover:shadow-lg hover:border-zinc-300">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        Total Combined Pipeline
                      </span>
                      <h3 className="text-3xl font-black tracking-tight text-zinc-900 mt-1">
                        {formatIDR(b2bMetrics.totalProjection)}
                      </h3>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-emerald-600">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-zinc-100 mt-4">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
                    <span>Realization Progress</span>
                    <span className="text-zinc-900">{b2bMetrics.realizationProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-all duration-1000"
                      style={{ width: `${b2bMetrics.realizationProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Won Revenue & Potential Lists (revamped card grid) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Section 1: Won Revenue Deals (Cards) */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Zap size={14} className="text-emerald-500" /> Won Deals (Revenue)
                  </h3>
                  <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                    {filteredProjects.filter((p: any) => p.forecastedValue > 0 && !['Lost', 'Freeze'].includes(p.stage)).length} Projects
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredProjects
                    .filter((p: any) => p.forecastedValue > 0 && !['Lost', 'Freeze'].includes(p.stage))
                    .sort((a: any, b: any) => b.forecastedValue - a.forecastedValue)
                    .map((p: any) => (
                      <div
                        key={p.id}
                        className="relative group overflow-hidden bg-white border border-zinc-200 hover:border-emerald-500 hover:shadow-md rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-4 -mt-4 group-hover:bg-emerald-500/10 transition-all duration-300"></div>

                        <div className="relative z-10 flex justify-between items-start gap-4 mb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                              {p.client || 'No Client'}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-900 mt-0.5 group-hover:text-emerald-600 transition-colors line-clamp-1">
                              {p.projectName || 'Unnamed Project'}
                            </h4>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[8px] rounded-md font-black uppercase tracking-wider border whitespace-nowrap ${
                              p.stage === 'Done'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {p.stage}
                          </span>
                        </div>

                        <div className="relative z-10 flex items-end justify-between mb-4">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Value</span>
                            <p className="text-sm font-mono font-black text-zinc-900 leading-none mt-0.5">
                              {formatIDR(p.forecastedValue)}
                            </p>
                          </div>
                          {p.closeDate && (
                            <div className="text-right">
                              <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider block">Close Date</span>
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mt-0.5 justify-end">
                                <Calendar size={10} /> {formatDate(p.closeDate)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="relative z-10 space-y-1.5 pt-3.5 border-t border-zinc-100 mt-2">
                          <div className="flex justify-between text-[9px] font-bold text-zinc-500">
                            <span>Implementation Progress</span>
                            <span>{p.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.stage === 'Done' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${p.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {filteredProjects.filter((p: any) => p.forecastedValue > 0 && !['Lost', 'Freeze'].includes(p.stage)).length === 0 && (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-400 font-medium italic text-xs">
                      No active B2B deals or projects found for this quarter.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Potential opportunities (Cards) */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Target size={14} className="text-indigo-500" /> Potential Opportunities
                  </h3>
                  <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                    {filteredLeads.filter((l: any) => l.forecastedValue > 0 && !['Closed Lost', 'Freeze'].includes(l.stage)).length} Opportunities
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredLeads
                    .filter((l: any) => l.forecastedValue > 0 && !['Closed Lost', 'Freeze'].includes(l.stage))
                    .sort((a: any, b: any) => b.forecastedValue - a.forecastedValue)
                    .map((l: any) => (
                      <div
                        key={l.id}
                        className="relative group overflow-hidden bg-white border border-zinc-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-all duration-300"></div>

                        <div className="relative z-10 flex justify-between items-start gap-4 mb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                              Sales PIC: {l.picSales || 'No PIC'}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-900 mt-0.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {l.name || 'Unnamed Lead'}
                            </h4>
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-50 text-zinc-600 text-[8px] rounded-md font-black uppercase tracking-wider border border-zinc-200 whitespace-nowrap">
                            {l.stage}
                          </span>
                        </div>

                        <div className="relative z-10 flex items-end justify-between mb-4">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Value</span>
                            <p className="text-sm font-mono font-black text-zinc-900 leading-none mt-0.5">
                              {formatIDR(l.forecastedValue)}
                            </p>
                          </div>
                          {l.expectedCloseDate && (
                            <div className="text-right">
                              <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider block">Expected Close</span>
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mt-0.5 justify-end">
                                <Clock size={10} /> {formatDate(l.expectedCloseDate)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="relative z-10 flex items-center justify-between pt-3.5 border-t border-zinc-100 mt-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Win Probability</span>
                            <span className="text-xs font-black text-indigo-600 mt-0.5">
                              {Math.round((l.probability || 0) * 100)}%
                            </span>
                          </div>
                          <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.round((l.probability || 0) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {filteredLeads.filter((l: any) => l.forecastedValue > 0 && !['Closed Lost', 'Freeze'].includes(l.stage)).length === 0 && (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-400 font-medium italic text-xs">
                      No active B2B opportunities or leads found for this quarter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Edit Modal */}
      {editModal && (
        <EditModal
          isOpen={true}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
          title={`${editModal.index >= 0 ? 'Edit' : 'Add'} ${BI_EDIT_CONFIG[editModal.section]?.title || 'Item'}`}
          fields={BI_EDIT_CONFIG[editModal.section]?.fields || []}
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