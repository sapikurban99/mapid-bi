'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useSWR from 'swr';
import {
  Loader2, ArrowUpRight, ArrowDownRight, Users, Target,
  Activity, FileText, FolderOpen, TableProperties, Lock,
  TrendingUp, BarChart3, Globe, Share2, ArrowRight, Sparkles, Maximize2, Minimize2, BookOpen, MoreVertical,
  Layers, Zap, Plus, Edit2, Trash2, X, Save, Check
} from 'lucide-react';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import LoadingProgress from '../components/LoadingProgress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useGrowthData } from '../growth/useGrowthData';
import { useGlobalData } from '../components/GlobalDataProvider';

const apiFetcher = (url: string) => fetch(url).then(r => r.json());

// --- BI Section Edit Configs ---
const BI_EDIT_CONFIG: Record<string, { title: string; fields: { key: string; label: string; type: string; options?: string[]; placeholder?: string }[]; empty: any }> = {
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
        <div className="flex gap-3 p-6 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition">Cancel</button>
          <button onClick={onSave} className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition flex items-center justify-center gap-2">
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MinimalistDashboard() {
  const { isLoading: globalIsLoading, syncData } = useGlobalData();
  const [activeTab, setActiveTab] = useState('Trends');
  const [trendCategory, setTrendCategory] = useState('All');
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [b2cPeriod, setB2cPeriod] = useState('All');
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

  // Fetch Academy revenue from Supabase revenue_payments table (dynamic date range)
  const academyPaymentsUrl = `/api/revenue/payments?start_date=${revenueStartDate}&end_date=${revenueEndDate}&category=MAPID Academy`;
  const { data: academyPayData, isLoading: academyLoading } = useSWR(academyPaymentsUrl, apiFetcher, { revalidateOnFocus: false });

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

    // Auto-fill B2C period (Campaigns & Revenue)
    if (data?.revenue && data.revenue.length > 0 && b2cPeriod === 'All') {
      const b2cPeriods = Array.from(new Set((data.revenue as any[]).map((r: any) => r.quarter).filter(Boolean))).sort().reverse();
      if (b2cPeriods.includes(currentQuarterStr)) {
          setB2cPeriod(currentQuarterStr);
      } else if (b2cPeriods.length > 0) {
          setB2cPeriod(b2cPeriods[0] as string); // Fallback to latest
      }
    } else if (data?.campaigns && data.campaigns.length > 0 && b2cPeriod === 'All') {
      const campPeriods = Array.from(new Set((data.campaigns as any[]).map((c: any) => c.period).filter(Boolean))).sort().reverse();
      if (campPeriods.includes(currentQuarterStr)) {
          setB2cPeriod(currentQuarterStr);
      } else if (campPeriods.length > 0) {
          setB2cPeriod(campPeriods[0] as string);
      }
    }


  }, [data, activeTab, mounted]);

  // Determine which quarter string to filter academy data by, based on selected date range
  const selectedQuarterStr = useMemo(() => {
    const sd = new Date(revenueStartDate);
    const q = Math.ceil((sd.getMonth() + 1) / 3);
    return `Q${q} ${sd.getFullYear()}`;
  }, [revenueStartDate]);

  // Calculate B2C Metrics (dynamic date range — both from live sources)
  const b2cMetrics = useMemo(() => {
    // Academy: from revenue_payments table (filtered by date range + category)
    const academyActual = academyPayData?.totalAmount || 0;

    // Platform: from DevServer (already filtered by date range via useGrowthData)
    const platformActual = allPayments
      .filter((p: any) => p.status === 'success' && p.payment_methode?.toLowerCase() === 'midtrans')
      .reduce((sum: number, p: any) => sum + (p.detail_amount?.total || p.total || 0), 0);

    const academyTarget = 60000000;
    const platformTarget = 40000000;

    return {
      academy: { actual: academyActual, target: academyTarget, percent: academyTarget > 0 ? Math.min(Math.round((academyActual / academyTarget) * 100), 100) : 0 },
      platform: { actual: platformActual, target: platformTarget, percent: Math.min(Math.round((platformActual / platformTarget) * 100), 100) },
      total: { actual: academyActual + platformActual, target: academyTarget + platformTarget, percent: Math.min(Math.round(((academyActual + platformActual) / (academyTarget + platformTarget)) * 100), 100) },
      isLoading: academyLoading || platformLoading,
    };
  }, [academyPayData, allPayments, academyLoading, platformLoading]);

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

  const b2cPeriods = new Set<string>();
  (data?.campaigns || []).forEach((c: any) => { if (c.period) b2cPeriods.add(c.period); });
  activeRevenueData.forEach((r: any) => { if (r.quarter) b2cPeriods.add(r.quarter); });
  const uniqueB2cPeriods = ['All', ...Array.from(b2cPeriods).sort()];

  const filteredCampaigns = (data?.campaigns || []).filter((c: any) => b2cPeriod === 'All' || c.period === b2cPeriod);


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

        {config.tabsVisible.Academy && <button onClick={() => setActiveTab('Academy')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'Academy' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>Academy</button>}
        {config.tabsVisible.Gallery && <button onClick={() => setActiveTab('Gallery')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'Gallery' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>Gallery</button>}
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

            {/* BUDGET DISBURSEMENT SECTION */}
            <div className="pt-8 border-t border-zinc-200 mt-12 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black tracking-tight leading-tight">Budget Disbursement<br /><span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Operational Spending Overview</span></h3>
                <button onClick={() => openEditModal('budget')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Add
                </button>
              </div>
              {(() => {
                const budgetData = data?.budget || [];
                const totalSpent = budgetData.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
                const maxBudget = 100000000;
                const budgetProgress = (totalSpent / maxBudget) * 100;
                const spentByCategory = budgetData.reduce((acc: any, item: any) => {
                  const cat = item.category || 'Other';
                  acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
                  return acc;
                }, {});

                // Sort categories by highest spent
                const sortedCategories = Object.entries(spentByCategory).sort((a: any, b: any) => b[1] - a[1]);

                return (
                  <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Budget Spent</h4>
                        <div className="text-2xl font-black tracking-tighter text-emerald-400">{formatIDR(totalSpent)}</div>
                      </div>
                      {sortedCategories.slice(0, 3).map(([cat, amount]: any, idx) => (
                        <div key={cat} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm transition hover:border-zinc-300">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{cat}</h4>
                          <div className="text-xl font-black tracking-tighter text-zinc-900">{formatIDR(amount)}</div>
                          <div className="text-[10px] font-bold text-zinc-400 mt-1 text-right">{totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0}% of Total</div>
                        </div>
                      ))}
                    </div>

                    {/* Disbursement History Table */}
                    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                            <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 min-w-[200px]">Description</th><th className="px-6 py-4 text-right">Amount (IDR)</th><th className="px-4 py-4 w-16"></th></tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {budgetData.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No spending recorded</td></tr>
                            ) : (
                              budgetData.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime() || 0).map((row: any, idx: number) => {
                                // Find original index in the unsorted data
                                const origIdx = (data?.budget || []).indexOf(row);
                                return (
                                  <tr key={idx} className="hover:bg-zinc-50 transition group">
                                    <td className="px-6 py-5 font-bold whitespace-nowrap">{formatDate(row.date)}</td>
                                    <td className="px-6 py-5"><span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block whitespace-nowrap">{row.category}</span></td>
                                    <td className="px-6 py-5 text-zinc-500 font-medium italic">{row.description || '-'}</td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-zinc-900">{formatIDR(row.amount)}</td>
                                    <td className="px-4 py-5">
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
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
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* === TAB 2: B2C === */}
        {activeTab === 'B2C' && (
          <div className="space-y-12 animate-in fade-in">
            {/* Social & Community */}
            <div>
              {(() => {
                const socialsData = data?.socials || [];
                const uniqueMonths = ['All', ...Array.from(new Set(socialsData.map((d: any) => normalizeMonth(d.month)).filter(Boolean)))];
                const uniqueWeeks = ['All', ...Array.from(new Set(socialsData.map((d: any) => d.week).filter(Boolean)))];


                // --- DATA TRANSFORMS FOR B2C SOCIALS ---
                const getComparisonValue = (dataset: any[], month: string, week: string, platform: string, metric: string, type: 'latest' | 'earliest') => {
                  const filtered = dataset.filter(d =>
                    d.platform === platform &&
                    d.metric === metric &&
                    (month === 'All' || normalizeMonth(d.month) === normalizeMonth(month)) &&
                    (week === 'All' || d.week === week)
                  );

                  if (filtered.length === 0) return 0;

                  // If "All" is selected for month or week, we show target data point (latest vs earliest)
                  // instead of aggregating (summing) as per user request.
                  if (week === 'All' || month === 'All') {
                    const sorted = [...filtered].sort((a, b) => {
                      const dateA = new Date(a.month).getTime();
                      const dateB = new Date(b.month).getTime();
                      if (dateA !== dateB) return dateA - dateB;
                      return b.week.localeCompare(a.week, undefined, { numeric: true });
                    });
                    // For growth comparison: primary is latest, secondary is earliest
                    return type === 'latest' ? (Number(sorted[sorted.length - 1].value) || 0) : (Number(sorted[0].value) || 0);
                  }

                  // Normal behavior for specific week/month
                  return filtered.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
                };

                const uniqueMetrics = Array.from(new Set(socialsData.map((d: any) => `${d.platform}|${d.metric}`)));
                const comparisonRows = uniqueMetrics.map((key: any) => {
                  const [platform, metric] = key.split('|');
                  const primary = getComparisonValue(socialsData, socialPrimaryMonth, socialPrimaryWeek, platform, metric, 'latest');
                  const secondary = getComparisonValue(socialsData, socialSecondaryMonth, socialSecondaryWeek, platform, metric, 'earliest');
                  return { platform, metric, primary, secondary };
                }).filter(r => r.primary > 0 || r.secondary > 0);

                return (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h3 className="text-xl font-black tracking-tight leading-tight">Social Media & Community<br /><span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Growth Comparison</span></h3>
                      <div className="flex flex-col md:flex-row gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                        {/* Primary Filters */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest">Now</span>
                          {uniqueMonths.length > 2 && (
                            <select value={socialPrimaryMonth} onChange={(e) => setSocialPrimaryMonth(e.target.value)}
                              className="bg-white border text-xs text-zinc-900 border-zinc-200 font-bold p-2 rounded-lg outline-none cursor-pointer">
                              {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : formatMonthDropdown(m)}</option>)}
                            </select>
                          )}
                          {uniqueWeeks.length > 2 && (
                            <select value={socialPrimaryWeek} onChange={(e) => setSocialPrimaryWeek(e.target.value)}
                              className="bg-white border text-xs text-zinc-900 border-zinc-200 font-bold p-2 rounded-lg outline-none cursor-pointer">
                              {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                            </select>
                          )}
                        </div>
                        {(uniqueMonths.length > 2 || uniqueWeeks.length > 2) && <div className="hidden md:block w-px bg-zinc-200"></div>}
                        {/* Secondary Filters */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest opacity-50">Then</span>
                          {uniqueMonths.length > 2 && (
                            <select value={socialSecondaryMonth} onChange={(e) => setSocialSecondaryMonth(e.target.value)}
                              className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-lg outline-none cursor-pointer">
                              {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : formatMonthDropdown(m)}</option>)}
                            </select>
                          )}
                          {uniqueWeeks.length > 2 && (
                            <select value={socialSecondaryWeek} onChange={(e) => setSocialSecondaryWeek(e.target.value)}
                              className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-lg outline-none cursor-pointer">
                              {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {comparisonRows.length === 0 ? (
                      <div className="text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest">No data for selected periods</div>
                    ) : (
                      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                              <tr>
                                <th className="px-6 py-4">Platform</th>
                                <th className="px-6 py-4">Metric</th>
                                <th className="px-6 py-4 text-right">Primary Vol.</th>
                                <th className="px-6 py-4 text-right text-zinc-400">Secondary Vol.</th>
                                <th className="px-6 py-4 text-right">Variance</th>
                                <th className="px-6 py-4 text-center">Trend</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {comparisonRows.map((row, idx) => {
                                const abs_change = row.primary - row.secondary;
                                const pct_change = row.secondary > 0 ? ((abs_change / row.secondary) * 100).toFixed(1) : ((row.primary > 0) ? '100.0' : '0.0');
                                const isUp = abs_change > 0;
                                const isDown = abs_change < 0;

                                return (
                                  <tr key={idx} className="hover:bg-zinc-50 transition group">
                                    <td className="px-6 py-4 font-bold whitespace-nowrap">{row.platform}</td>
                                    <td className="px-6 py-4 text-zinc-500 font-medium whitespace-nowrap text-xs">{row.metric}</td>
                                    <td className="px-6 py-4 text-right font-mono text-zinc-900 font-bold text-lg">{row.primary.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-zinc-400">{row.secondary.toLocaleString()}</td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-zinc-400'}`}>
                                      {abs_change > 0 ? '+' : ''}{abs_change.toLocaleString()} ({abs_change > 0 ? '+' : ''}{pct_change}%)
                                    </td>
                                    <td className="px-6 py-4 text-center flex justify-center">
                                      {isUp ? <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><ArrowUpRight size={14} /></div> :
                                        isDown ? <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner"><ArrowDownRight size={14} /></div> :
                                          <div className="w-7 h-7 rounded-full bg-zinc-50 text-zinc-400 flex items-center justify-center shadow-inner"><div className="w-2 h-2 rounded-full bg-zinc-300"></div></div>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Filter B2C Campaigns & Revenue */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 pb-4 mb-6 gap-4">
              <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">B2C Performance Overview</h3>
              {uniqueB2cPeriods.length > 2 && (
                <select value={b2cPeriod} onChange={(e) => setB2cPeriod(e.target.value)}
                  className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                  {uniqueB2cPeriods.map((p: string) => <option key={p} value={p}>{p === 'All' ? 'All Periods' : p}</option>)}
                </select>
              )}
            </div>

            {/* Campaign Activations */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Active Campaigns & Performance</h3>
                <button onClick={() => openEditModal('campaigns')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCampaigns.length === 0 ? (
                  <div className="col-span-full text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest w-full">No campaigns for selected period</div>
                ) : filteredCampaigns.map((camp: any, idx: number) => {
                  const origIdx = (data?.campaigns || []).indexOf(camp);
                  return (
                    <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-2xl transition hover:border-zinc-400 group relative">
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEditModal('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteItem('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="font-bold text-zinc-900 text-sm leading-tight">{camp.name}</h4>
                        <div className={`text-[8px] px-2 py-0.5 font-black uppercase rounded border ${camp.status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                          {camp.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                        <div><div className="text-[9px] text-zinc-400 uppercase font-bold">Leads</div><div className="text-xl font-black">{camp.leads}</div></div>
                        <div className="text-right"><div className="text-[9px] text-zinc-400 uppercase font-bold">Conv. Rate</div><div className="text-xl font-black text-zinc-900">{camp.conversion}%</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
                {/* Academy Module */}
                <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-blue-500 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Layers size={48} className="text-blue-600" />
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
                  <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-4">Source: Supabase DB → revenue_payments</p>
                </div>

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



        {/* === TAB 5: ACADEMY === */}
        {activeTab === 'Academy' && (() => {
          // --- DATA TRANSFORMS FOR ACADEMY ---
          const validAcademyData = config.biData?.academy || [];
          const academyPrograms = Array.from(new Set(validAcademyData.map((a: any) => a.program))).sort();

          return (
            <div className="space-y-12 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Academy Performance By Program</h3>
                <button onClick={() => openEditModal('academy')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                  <Plus size={12} /> Add Batch
                </button>
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
          );
        })()}

        {/* === TAB 6: GALLERY === */}
        {activeTab === 'Gallery' && (() => {
          const docsData = data?.docs || [];
          const uniqueGalleryCategories = ['All', ...Array.from(new Set(docsData.map((d: any) => d.category).filter(Boolean)))];

          const filteredDocs = docsData.filter((d: any) =>
            galleryCategory === 'All' || d.category === galleryCategory
          );

          return (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-black">Knowledge Base & Assets</h3>
                <div className="flex gap-3 items-center">
                  <button onClick={() => openEditModal('docs')} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                    <Plus size={12} /> Add
                  </button>
                  <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)}
                    className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                    {uniqueGalleryCategories.map((c: any) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc: any, idx: number) => {
                  const isLinkValid = doc.link && doc.link !== '#';
                  const origIdx = docsData.indexOf(doc);
                  return (
                    <div key={idx} className="group bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col justify-between transition-all relative hover:border-zinc-400">
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                        <button onClick={(e) => { e.preventDefault(); openEditModal('docs', origIdx); }} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                        <button onClick={(e) => { e.preventDefault(); handleDeleteItem('docs', origIdx); }} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                      </div>
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="p-3 bg-zinc-50 rounded-xl group-hover:bg-zinc-100 transition text-zinc-900">
                            {doc.format === 'Folder' ? <FolderOpen size={24} /> : doc.format === 'Sheet' ? <TableProperties size={24} /> : <FileText size={24} />}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">{doc.category}</span>
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-2 leading-tight">{doc.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-8 line-clamp-2 italic">{doc.desc}</p>
                      </div>
                      <a href={isLinkValid ? doc.link : undefined} target="_blank" rel="noopener noreferrer"
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition ${isLinkValid ? 'text-zinc-900 hover:underline cursor-pointer' : 'text-zinc-300 cursor-not-allowed'}`}>
                        {isLinkValid ? 'Go to Content' : 'Link not ready'} {isLinkValid && <ArrowRight size={14} />}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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