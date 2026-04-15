'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, ArrowUpRight, ArrowDownRight, Users, Target,
  Activity, FileText, FolderOpen, TableProperties, Lock,
  TrendingUp, BarChart3, Globe, Share2, ArrowRight, Sparkles, Maximize2, Minimize2, BookOpen, MoreVertical
} from 'lucide-react';
import { getConfig } from '../lib/config';
import LoadingProgress from '../components/LoadingProgress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';

export default function MinimalistDashboard() {
  const [activeTab, setActiveTab] = useState('Trends');
  const [trendCategory, setTrendCategory] = useState('All');
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [b2cPeriod, setB2cPeriod] = useState('All');
  const [b2bQuarter, setB2bQuarter] = useState('All');

  // Pagination states
  const [pipelinePage, setPipelinePage] = useState(1);
  const [revenuePage, setRevenuePage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const ITEMS_PER_PAGE = 10;



  // States for Social & Community Comparison
  const [socialPrimaryMonth, setSocialPrimaryMonth] = useState('All');
  const [socialPrimaryWeek, setSocialPrimaryWeek] = useState('All');
  const [socialSecondaryMonth, setSocialSecondaryMonth] = useState('All');
  const [socialSecondaryWeek, setSocialSecondaryWeek] = useState('All');
  const [errorMsg, setErrorMsg] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [config, setConfigState] = useState(() => {
      return typeof window === 'undefined' ? (require('../lib/config').DEFAULT_CONFIG) : (require('../lib/config').getConfig());
  });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const c = require('../lib/config').getConfig();
      if (c.biData && Object.keys(c.biData).length > 0) {
        setConfigState(c);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

    // Auto-fill B2B Quarter
    if (data?.pipeline && data.pipeline.length > 0 && b2bQuarter === 'All') {
        const b2bPeriods = Array.from(new Set((data.pipeline as any[]).map((p: any) => p.quarter).filter(Boolean))).sort().reverse();
        if (b2bPeriods.includes(currentQuarterStr)) {
            setB2bQuarter(currentQuarterStr);
        } else if (b2bPeriods.length > 0) {
            setB2bQuarter(b2bPeriods[0] as string);
        }
    }
  }, [data, activeTab, mounted]);

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
  const filteredB2cRevenue = activeRevenueData.filter((r: any) => b2cPeriod === 'All' || r.quarter === b2cPeriod);

  const totalB2CActual = filteredB2cRevenue.reduce((acc: number, curr: any) => acc + curr.actual, 0) || 0;
  const totalB2CTarget = filteredB2cRevenue.reduce((acc: number, curr: any) => acc + curr.target, 0) || 0;
  const totalB2CAchievement = totalB2CTarget > 0 ? ((totalB2CActual / totalB2CTarget) * 100).toFixed(2) : '0.00';

  const activePipeline = (data?.pipeline || []).filter((p: any) => p.stage !== 'Won');
  const totalB2BPipeline = activePipeline.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0) || 0;

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
        {config.tabsVisible.Academy && <button onClick={() => setActiveTab('Academy')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'Academy' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>Academy</button>}
        {config.tabsVisible.Gallery && <button onClick={() => setActiveTab('Gallery')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'Gallery' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>Gallery</button>}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* === TAB 1: TRENDS === */}
        {activeTab === 'Trends' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Revenue Performance</h3>
              <div className="flex gap-3">
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
                        {validTrendData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Summary Cards */}
              <div className="space-y-6">
                {validTrendData.slice().reverse().slice(0, 2).map((hist: any, idx: number) => (
                  <div key={idx} className={`bg-white border border-zinc-200 p-6 rounded-2xl ${idx === 0 ? 'ring-2 ring-zinc-900 ring-offset-2 shadow-lg' : 'opacity-60'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{formatTrendLabel(hist.label)} Summary</h4>
                    <div className="text-3xl font-black tracking-tighter mb-1">Rp {hist.revenue}M</div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg Deal: Rp {hist.dealSize}M</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BUDGET DISBURSEMENT SECTION */}
            <div className="pt-8 border-t border-zinc-200 mt-12 mb-6">
              <h3 className="text-xl font-black tracking-tight leading-tight mb-6">Budget Disbursement<br /><span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Operational Spending Overview</span></h3>
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
                            <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 min-w-[200px]">Description</th><th className="px-6 py-4 text-right">Amount (IDR)</th></tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {budgetData.length === 0 ? (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No spending recorded</td></tr>
                            ) : (
                              budgetData.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime() || 0).map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-zinc-50 transition">
                                  <td className="px-6 py-5 font-bold whitespace-nowrap">{formatDate(row.date)}</td>
                                  <td className="px-6 py-5"><span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block whitespace-nowrap">{row.category}</span></td>
                                  <td className="px-6 py-5 text-zinc-500 font-medium italic">{row.description || '-'}</td>
                                  <td className="px-6 py-5 text-right font-mono font-bold text-zinc-900">{formatIDR(row.amount)}</td>
                                </tr>
                              ))
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
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Active Campaigns & Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCampaigns.length === 0 ? (
                  <div className="col-span-full text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest w-full">No campaigns for selected period</div>
                ) : filteredCampaigns.map((camp: any, idx: number) => (
                  <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-2xl transition hover:border-zinc-400">
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
                ))}
              </div>
            </div>

            {/* Revenue Status */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 font-black">B2C Product Revenue</h3>
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                      <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Quarter</th><th className="px-6 py-4">Actual vs Target</th><th className="px-6 py-4">Progress</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredB2cRevenue.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No revenue data for selected period</td></tr>
                      ) : filteredB2cRevenue.map((rev: any, idx: number) => {
                        // Format angka desimal pada row tabel agar rapi
                        const achPct = typeof rev.achievement === 'number' ? rev.achievement.toFixed(2) : rev.achievement;
                        return (
                          <tr key={idx} className="hover:bg-zinc-50 transition">
                            <td className="px-6 py-5 font-bold">{rev.subProduct}</td>
                            <td className="px-6 py-5 font-bold text-zinc-500 text-xs">{rev.quarter || '-'}</td>
                            <td className="px-6 py-5 text-zinc-500 font-medium">{formatIDR(rev.actual)} <span className="opacity-30 mx-2">/</span> {formatIDR(rev.target)}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-full max-w-[120px] bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full ${rev.achievement >= 100 ? 'bg-emerald-500' : 'bg-zinc-900'}`} style={{ width: `${Math.min(rev.achievement, 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black">{achPct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {/* BARIS TOTAL B2C */}
                    <tfoot className="bg-zinc-900 text-white border-t border-zinc-800 font-black tracking-widest text-[10px]">
                      <tr>
                        <td colSpan={2} className="px-6 py-5 uppercase">Total B2C</td>
                        <td className="px-6 py-5 font-bold">{formatIDR(totalB2CActual)} <span className="opacity-50 mx-1">/</span> {formatIDR(totalB2CTarget)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-full max-w-[120px] bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" style={{ width: `${Math.min(Number(totalB2CAchievement), 100)}%` }}></div>
                            </div>
                            <span className="text-emerald-400">{totalB2CAchievement}%</span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 3: B2B === */}
        {activeTab === 'B2B' && (
          <div className="space-y-12 animate-in fade-in">
            {/* Pipeline Progress */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Enterprise Pipeline (IDR)</h3>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Client</th><th className="px-4 py-4">Stage</th><th className="px-4 py-4 text-right">Est. Value</th><th className="px-6 py-4">Action</th><th className="px-4 py-4">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {activePipeline.slice((pipelinePage - 1) * ITEMS_PER_PAGE, pipelinePage * ITEMS_PER_PAGE).map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition text-zinc-900">
                          <td className="px-6 py-4 font-bold">{p.client}</td>
                          <td className="px-4 py-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${p.stage === 'Won' ? 'bg-emerald-100 text-emerald-700' : p.stage === 'Negotiation' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>{p.stage}</span>
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold">{formatIDR(p.value)}</td>
                          <td className="px-6 py-4 text-zinc-400 font-medium italic truncate max-w-[200px]">{p.action}</td>
                          <td className="px-4 py-4 font-bold uppercase tracking-tighter">{formatDate(p.eta)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-900 text-white border-t border-zinc-800 font-black tracking-widest text-[10px]">
                      <tr>
                        <td colSpan={2} className="px-6 py-6">TOTAL PIPELINE VALUE</td>
                        <td className="px-4 py-6 text-right text-sm text-emerald-400">{formatIDR(totalB2BPipeline)}</td>
                        <td colSpan={2} className="px-6 py-6 text-zinc-500 text-right font-normal lowercase tracking-normal italic text-[8px]">
                          *estimasi lead aktif (exclude won)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {activePipeline.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                    <button onClick={() => setPipelinePage(p => Math.max(1, p - 1))} disabled={pipelinePage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {pipelinePage} of {Math.ceil(activePipeline.length / ITEMS_PER_PAGE)}</span>
                    <button onClick={() => setPipelinePage(p => Math.min(Math.ceil(activePipeline.length / ITEMS_PER_PAGE), p + 1))} disabled={pipelinePage === Math.ceil(activePipeline.length / ITEMS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                  </div>
                )}
              </div>
            </div>

            {/* B2B Revenue Realization */}
            {(() => {
              const wonPipeline = (data?.pipeline || []).filter((p: any) => p.stage === 'Won');

              const getQuarter = (dateStr: string) => {
                if (!dateStr || dateStr === '#') return 'Unknown';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return 'Unknown';
                const month = d.getMonth();
                return `Q${Math.floor(month / 3) + 1}`;
              };

              const revenueData = wonPipeline.map((p: any) => ({
                ...p,
                quarter: getQuarter(p.eta)
              }));

              const uniqueQuarters = ['All', ...(Array.from(new Set(revenueData.map((d: any) => d.quarter).filter(Boolean))) as string[]).sort()];

              const filteredRevenue = revenueData.filter((d: any) => b2bQuarter === 'All' || d.quarter === b2bQuarter);
              const totalRevenue = filteredRevenue.reduce((acc: number, curr: any) => acc + (Number(curr.value) || 0), 0);

              return (
                <div className="pt-8 border-t border-zinc-200 mt-12 mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 pb-4 mb-6 gap-4">
                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">B2B Revenue Realization <span className="text-zinc-400 font-medium text-xs ml-2">(Closed Won)</span></h3>
                    <select value={b2bQuarter} onChange={(e) => setB2bQuarter(e.target.value)}
                      className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                      {uniqueQuarters.map((q: string) => <option key={q} value={q}>{q === 'All' ? 'All Quarters' : q}</option>)}
                    </select>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left whitespace-nowrap">
                        <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 font-black uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Client Name</th>
                            <th className="px-4 py-4 text-right">Project Value</th>
                            <th className="px-6 py-4">Close Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredRevenue.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No revenue data for selected quarter</td></tr>
                          ) : filteredRevenue.slice((revenuePage - 1) * ITEMS_PER_PAGE, revenuePage * ITEMS_PER_PAGE).map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition text-zinc-900">
                              <td className="px-6 py-4 font-bold">{p.client}</td>
                              <td className="px-4 py-4 text-right font-mono font-bold">{formatIDR(p.value)}</td>
                              <td className="px-6 py-4 font-bold uppercase tracking-tighter text-emerald-600">{formatDate(p.eta)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-zinc-900 text-white border-t border-zinc-800 font-black tracking-widest text-[10px]">
                          <tr>
                            <td className="px-6 py-6 font-bold text-zinc-400 uppercase tracking-widest">Total Realized Revenue</td>
                            <td className="px-4 py-6 text-right text-sm text-emerald-400">{formatIDR(totalRevenue)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {filteredRevenue.length > ITEMS_PER_PAGE && (
                      <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                        <button onClick={() => setRevenuePage(p => Math.max(1, p - 1))} disabled={revenuePage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {revenuePage} of {Math.ceil(filteredRevenue.length / ITEMS_PER_PAGE)}</span>
                        <button onClick={() => setRevenuePage(p => Math.min(Math.ceil(filteredRevenue.length / ITEMS_PER_PAGE), p + 1))} disabled={revenuePage === Math.ceil(filteredRevenue.length / ITEMS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        )}



        {/* === TAB 5: ACADEMY === */}
        {activeTab === 'Academy' && (() => {
          // --- DATA TRANSFORMS FOR ACADEMY ---
          const validAcademyData = config.biData?.academy || [];
          const academyPrograms = Array.from(new Set(validAcademyData.map((a: any) => a.program))).sort();

          return (
            <div className="space-y-12 animate-in fade-in">
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
                              <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/4">Batch Name</th>
                              <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/4">Registrants</th>
                              <th className="px-6 py-4 border-r border-dashed border-zinc-200 w-1/4">Converted</th>
                              <th className="px-6 py-4 text-center">Conversion %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {sortedData.map((row, idx) => {
                              const registrants = Number(row.registrants) || 0;
                              const converted = Number(row.converted) || 0;
                              const rate = registrants > 0 ? ((converted / registrants) * 100).toFixed(2) : '0';

                              return (
                                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
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
                  <p className="text-sm text-zinc-400 mt-2">Create some data in the Admin Panel to see the performance.</p>
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
                <div className="flex gap-3">
                  <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)}
                    className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                    {uniqueGalleryCategories.map((c: any) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc: any, idx: number) => {
                  const isLinkValid = doc.link && doc.link !== '#';
                  return (
                    <a key={idx} href={isLinkValid ? doc.link : undefined} target="_blank" rel="noopener noreferrer"
                      className={`group bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col justify-between transition-all ${isLinkValid ? 'hover:border-zinc-900 hover:shadow-xl cursor-pointer ring-1 ring-transparent hover:ring-zinc-900' : 'opacity-40 cursor-not-allowed'}`}>
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
                      <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition ${isLinkValid ? 'text-zinc-900' : 'text-zinc-300'}`}>
                        {isLinkValid ? 'Go to Content' : 'Link not ready'} {isLinkValid && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    </main>
  );
}