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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trends');
  const [trendCategory, setTrendCategory] = useState('All');
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [b2cPeriod, setB2cPeriod] = useState('All');

  // States for User Growth Comparison
  const [growthMonth, setGrowthMonth] = useState('All');
  const [growthWeek, setGrowthWeek] = useState('All');
  const [growthCompareMonth, setGrowthCompareMonth] = useState('All');
  const [growthCompareWeek, setGrowthCompareWeek] = useState('All');

  // States for Social & Community Comparison
  const [socialPrimaryMonth, setSocialPrimaryMonth] = useState('All');
  const [socialPrimaryWeek, setSocialPrimaryWeek] = useState('All');
  const [socialSecondaryMonth, setSocialSecondaryMonth] = useState('All');
  const [socialSecondaryWeek, setSocialSecondaryWeek] = useState('All');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<any>(null);

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

  // --- PROGRESS BAR STATE ---
  const fetchDone = useRef(false);

  // --- CONFIG ---
  const [config, setConfigState] = useState(() => getConfig());
  useEffect(() => { setConfigState(getConfig()); }, []);

  const visibleTabs = Object.entries(config.tabsVisible)
    .filter(([, visible]) => visible)
    .map(([name]) => name);

  // --- SIMPLE AUTH LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.biPassword) {
      setIsAuthorized(true);
    } else {
      alert('Akses Ditolak: Password Salah!');
    }
  };

  // --- DATA FETCH ---
  useEffect(() => {
    if (!isAuthorized) return;
    fetchDone.current = false;

    // Actual data fetch — check admin biData override first
    const adminBiData = config.biData;

    fetch('/api/gas')
      .then(res => res.json())
      .then(json => {
        if (json.isError || json.error) {
          if (adminBiData) {
            setData(adminBiData);
          } else {
            setErrorMsg(json);
          }
        } else {
          // Prioritize REAL spreadsheet arrays over stringified AdminConfig cache when possible
          const mergedData = { ...json };

          const fallbackData = json.adminConfig?.biData || adminBiData || {};

          // Overwrite with fallback ONLY IF the live spreadsheet data is completely empty
          mergedData.socials = mergedData.socials?.length ? mergedData.socials : fallbackData.socials || [];
          mergedData.campaigns = mergedData.campaigns?.length ? mergedData.campaigns : fallbackData.campaigns || [];
          mergedData.revenue = mergedData.revenue?.length ? mergedData.revenue : fallbackData.revenue || [];
          mergedData.pipeline = mergedData.pipeline?.length ? mergedData.pipeline : fallbackData.pipeline || [];
          mergedData.projects = mergedData.projects?.length ? mergedData.projects : fallbackData.projects || [];
          mergedData.trends = mergedData.trends?.length ? mergedData.trends : fallbackData.trends || [];
          mergedData.userGrowth = mergedData.userGrowth?.length ? mergedData.userGrowth : fallbackData.userGrowth || [];
          mergedData.academy = mergedData.academy?.length ? mergedData.academy : fallbackData.academy || [];
          mergedData.docs = mergedData.docs?.length ? mergedData.docs : fallbackData.docs || [];

          setData(mergedData);
        }
        fetchDone.current = true;
      })
      .catch(err => {
        if (adminBiData) {
          setData(adminBiData);
        } else {
          setErrorMsg({ title: "Network Error", message: err.message });
        }
        fetchDone.current = true;
      });
  }, [isAuthorized]);

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
    if (label && label.includes('T')) {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
        }).format(date).toUpperCase();
      }
    }
    return label;
  }

  // --- CALCULATIONS ---
  const b2cPeriods = new Set<string>();
  (data?.campaigns || []).forEach((c: any) => { if (c.period) b2cPeriods.add(c.period); });
  (data?.revenue || []).forEach((r: any) => { if (r.quarter) b2cPeriods.add(r.quarter); });
  const uniqueB2cPeriods = ['All', ...Array.from(b2cPeriods).sort()];

  const filteredCampaigns = (data?.campaigns || []).filter((c: any) => b2cPeriod === 'All' || c.period === b2cPeriod);
  const filteredB2cRevenue = (data?.revenue || []).filter((r: any) => b2cPeriod === 'All' || r.quarter === b2cPeriod);

  const totalB2CActual = filteredB2cRevenue.reduce((acc: number, curr: any) => acc + curr.actual, 0) || 0;
  const totalB2CTarget = filteredB2cRevenue.reduce((acc: number, curr: any) => acc + curr.target, 0) || 0;
  const totalB2CAchievement = totalB2CTarget > 0 ? ((totalB2CActual / totalB2CTarget) * 100).toFixed(2) : '0.00';
  const totalB2BPipeline = data?.pipeline?.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0) || 0;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 font-sans p-6">
        <form onSubmit={handleLogin} className="bg-white p-10 border border-zinc-200 shadow-2xl w-full max-w-sm text-center rounded-2xl">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">BI Access</h2>
          <p className="text-zinc-400 text-xs mb-8 uppercase tracking-widest font-bold">Internal MAPID Team Only</p>
          <input
            type="password"
            placeholder="Passkey"
            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-zinc-200">
            Unlock Data
          </button>
        </form>
      </div>
    );
  }

  if (loading) return (
    <LoadingProgress
      isLoading={true}
      fetchDone={fetchDone.current}
      title="Syncing SOT Database"
      stages={[
        { target: 20, label: 'Connecting to server...' },
        { target: 35, label: 'Establishing secure link...' },
        { target: 55, label: 'Fetching data from SOT...' },
        { target: 70, label: 'Processing response...' },
        { target: 90, label: 'Building visualizations...' },
      ]}
      onComplete={() => setLoading(false)}
    />
  );

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
        {config.tabsVisible.UserGrowth && <button onClick={() => setActiveTab('UserGrowth')} className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'UserGrowth' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>UserGrowth</button>}
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
                <select value={trendCategory} onChange={(e) => setTrendCategory(e.target.value)}
                  className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                  {uniqueTrendCategories.map((c: any) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                </select>
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
          </div>
        )}

        {/* === TAB 2: B2C === */}
        {activeTab === 'B2C' && (
          <div className="space-y-12 animate-in fade-in">
            {/* Social & Community */}
            <div>
              {(() => {
                const socialsData = data?.socials || [];
                const uniqueMonths = ['All', ...Array.from(new Set(socialsData.map((d: any) => d.month).filter(Boolean)))];
                const uniqueWeeks = ['All', ...Array.from(new Set(socialsData.map((d: any) => d.week).filter(Boolean)))];


                // --- DATA TRANSFORMS FOR B2C SOCIALS ---
                const filteredPrimary = socialsData.filter((d: any) =>
                  (socialPrimaryMonth === 'All' || d.month === socialPrimaryMonth) &&
                  (socialPrimaryWeek === 'All' || d.week === socialPrimaryWeek)
                );
                const filteredSecondary = socialsData.filter((d: any) =>
                  (socialSecondaryMonth === 'All' || d.month === socialSecondaryMonth) &&
                  (socialSecondaryWeek === 'All' || d.week === socialSecondaryWeek)
                );

                const primaryMetrics = filteredPrimary.reduce((acc: any, curr: any) => {
                  if (!acc[curr.platform]) acc[curr.platform] = { value: 0, metric: curr.metric };
                  acc[curr.platform].value += (Number(curr.value) || 0);
                  return acc;
                }, {});

                const secondaryMetrics = filteredSecondary.reduce((acc: any, curr: any) => {
                  if (!acc[curr.platform]) acc[curr.platform] = { value: 0 };
                  acc[curr.platform].value += (Number(curr.value) || 0);
                  return acc;
                }, {});

                const platforms = Object.keys(primaryMetrics);

                return (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h3 className="text-xl font-black tracking-tight leading-tight">Social Media & Community<br /><span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Growth Comparison</span></h3>
                      <div className="flex flex-col md:flex-row gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                        {/* Primary Filters */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest">Primary</span>
                          <select value={socialPrimaryMonth} onChange={(e) => setSocialPrimaryMonth(e.target.value)}
                            className="bg-white border text-xs text-zinc-900 border-zinc-200 font-bold p-2 rounded-lg outline-none">
                            {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                          </select>
                          <select value={socialPrimaryWeek} onChange={(e) => setSocialPrimaryWeek(e.target.value)}
                            className="bg-white border text-xs text-zinc-900 border-zinc-200 font-bold p-2 rounded-lg outline-none">
                            {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                          </select>
                        </div>
                        <div className="hidden md:block w-px bg-zinc-200"></div>
                        {/* Secondary Filters */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest opacity-50">Compare</span>
                          <select value={socialSecondaryMonth} onChange={(e) => setSocialSecondaryMonth(e.target.value)}
                            className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-lg outline-none">
                            {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                          </select>
                          <select value={socialSecondaryWeek} onChange={(e) => setSocialSecondaryWeek(e.target.value)}
                            className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-lg outline-none">
                            {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {platforms.length === 0 ? (
                      <div className="text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest">No data for selected primary period</div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {platforms.map((platform, idx) => {
                          const val1 = primaryMetrics[platform].value;
                          const val2 = secondaryMetrics[platform]?.value || 0;
                          const abs_change = val1 - val2;
                          const pct_change = val2 > 0 ? ((abs_change / val2) * 100).toFixed(1) : 0;
                          const isUp = abs_change > 0;
                          const isDown = abs_change < 0;

                          return (
                            <div key={idx} className="bg-white border border-zinc-200 p-5 rounded-2xl text-center flex flex-col items-center justify-between transition hover:border-zinc-400 shadow-sm relative overflow-hidden group">
                              <span className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest absolute top-4 left-4">{platform}</span>
                              <div className="mt-8 mb-4">
                                <span className="text-3xl font-black tracking-tighter block">{val1.toLocaleString()}</span>
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{primaryMetrics[platform].metric}</span>
                              </div>
                              <div className={`mt-auto w-[110%] -mb-5 py-3 ${isUp ? 'bg-emerald-50 text-emerald-600' : isDown ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-400'} flex items-center justify-center gap-2 group-hover:-translate-y-1 transition-transform`}>
                                {isUp ? <ArrowUpRight size={14} /> : isDown ? <ArrowDownRight size={14} /> : <div className="w-2 h-2 rounded-full bg-zinc-300"></div>}
                                <span className="text-xs font-black font-mono">{abs_change > 0 ? '+' : ''}{abs_change.toLocaleString()} ({abs_change > 0 ? '+' : ''}{pct_change}%)</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Filter B2C Campaigns & Revenue */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 pb-4 mb-6 gap-4">
              <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">B2C Performance Overview</h3>
              <select value={b2cPeriod} onChange={(e) => setB2cPeriod(e.target.value)}
                className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                {uniqueB2cPeriods.map((p: string) => <option key={p} value={p}>{p === 'All' ? 'All Periods' : p}</option>)}
              </select>
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
                <table className="w-full text-sm text-left">
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
                      {data?.pipeline?.map((p: any, idx: number) => (
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
                          *estimasi lead aktif (exclude won/lost lama)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Project Delivery */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 font-black">Live Project Delivery</h3>
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                      <tr><th className="px-6 py-4">Project</th><th className="px-6 py-4">Phase</th><th className="px-6 py-4">Progress</th><th className="px-6 py-4 min-w-[300px]">Issue</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data?.projects?.map((proj: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition">
                          <td className="px-6 py-5 font-bold whitespace-nowrap">{proj.name}</td>
                          <td className="px-6 py-5 text-zinc-500 font-medium italic uppercase text-xs tracking-tighter whitespace-nowrap">{proj.phase}</td>
                          <td className="px-6 py-5 min-w-[200px]">
                            <div className="flex items-center gap-4">
                              <div className="w-full max-w-[120px] bg-zinc-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                <div className={`h-full ${proj.progress < 20 ? 'bg-rose-400' : 'bg-zinc-900'}`} style={{ width: `${proj.progress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-zinc-500">{proj.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs text-rose-500 italic" title={proj.issue}>{proj.issue || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 4: USER GROWTH === */}
        {activeTab === 'UserGrowth' && (() => {
          // --- DATA TRANSFORMS FOR ACADEMY ---
          const validAcademyData = config.biData?.academy || [];
          const academyPrograms = Array.from(new Set(validAcademyData.map(a => a.program))).sort();

          const userGrowthData = data?.userGrowth || [];
          const uniqueMonths = ['All', ...Array.from(new Set(userGrowthData.map((d: any) => d.month).filter(Boolean)))];
          const uniqueWeeks = ['All', ...Array.from(new Set(userGrowthData.map((d: any) => d.week).filter(Boolean)))];

          const filteredData = userGrowthData.filter((d: any) =>
            (growthMonth === 'All' || d.month === growthMonth) &&
            (growthWeek === 'All' || d.week === growthWeek)
          );

          const totalNewRegist = filteredData.reduce((acc: number, curr: any) => acc + Number(curr.newRegist), 0) || 0;
          const totalActiveGeo = filteredData.reduce((acc: number, curr: any) => acc + Number(curr.activeGeoUsers), 0) || 0;
          const avgConversion = totalNewRegist > 0 ? ((totalActiveGeo / totalNewRegist) * 100).toFixed(2) : 0;

          // Comparison Data
          const comparisonData = userGrowthData.filter((d: any) =>
            (growthCompareMonth === 'All' || d.month === growthCompareMonth) &&
            (growthCompareWeek === 'All' || d.week === growthCompareWeek)
          );

          const compareNewRegist = comparisonData.reduce((acc: number, curr: any) => acc + Number(curr.newRegist), 0) || 0;
          const compareActiveGeo = comparisonData.reduce((acc: number, curr: any) => acc + Number(curr.activeGeoUsers), 0) || 0;
          const compareAvgConversion = compareNewRegist > 0 ? ((compareActiveGeo / compareNewRegist) * 100).toFixed(2) : 0;

          const registChange = totalNewRegist - compareNewRegist;
          const registPctMap = compareNewRegist > 0 ? ((registChange / compareNewRegist) * 100).toFixed(1) : 0;

          const activeChange = totalActiveGeo - compareActiveGeo;
          const activePctMap = compareActiveGeo > 0 ? ((activeChange / compareActiveGeo) * 100).toFixed(1) : 0;

          const convChange = Number(avgConversion) - Number(compareAvgConversion);

          return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6 mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">User Growth Funnel</h3>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Acquisition & Activation Mapping</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                  {/* Primary Growth Filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest">Primary</span>
                    <select
                      value={growthMonth}
                      onChange={(e) => setGrowthMonth(e.target.value)}
                      className="bg-white border border-zinc-200 text-xs font-bold p-2 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    >
                      {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                    </select>
                    <select
                      value={growthWeek}
                      onChange={(e) => setGrowthWeek(e.target.value)}
                      className="bg-white border border-zinc-200 text-xs font-bold p-2 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    >
                      {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                    </select>
                  </div>
                  <div className="hidden md:block w-px bg-zinc-200"></div>
                  {/* Secondary Growth Filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 tracking-widest opacity-50">Compare</span>
                    <select
                      value={growthCompareMonth}
                      onChange={(e) => setGrowthCompareMonth(e.target.value)}
                      className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    >
                      {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                    </select>
                    <select
                      value={growthCompareWeek}
                      onChange={(e) => setGrowthCompareWeek(e.target.value)}
                      className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    >
                      {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center p-12 bg-white border border-zinc-200 rounded-3xl">
                  <p className="text-zinc-500 font-bold">No data matches the selected filters.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-w-4xl mx-auto py-8">

                  {/* Step 1: New Regist */}
                  <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex justify-between items-center shadow-sm relative z-20 transition hover:shadow-md hover:border-zinc-300">
                    <div className="flex flex-col md:flex-row justify-between w-full h-full">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl shadow-inner"><Users size={28} /></div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 1: Top of Funnel</h4>
                          <p className="text-2xl font-black tracking-tight text-zinc-900">New Registered Users</p>
                        </div>
                      </div>
                      <div className="text-right mt-4 md:mt-0 flex flex-col items-end justify-center">
                        <div className="text-5xl font-black tracking-tighter">{totalNewRegist.toLocaleString()}</div>
                        <div className={`mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${registChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {registChange > 0 ? <ArrowUpRight size={14} /> : registChange < 0 ? <ArrowDownRight size={14} /> : null}
                          {registChange > 0 ? '+' : ''}{registChange.toLocaleString()} ({registChange > 0 ? '+' : ''}{registPctMap}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex justify-center -my-6 relative z-10 opacity-30">
                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                  </div>

                  {/* Step 2: Paid User */}
                  <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex justify-between items-center shadow-sm relative z-20 w-[90%] mx-auto transition hover:shadow-md hover:border-zinc-300">
                    <div className="flex flex-col md:flex-row justify-between w-full h-full">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-2xl shadow-inner"><Target size={28} /></div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 2: Activation</h4>
                          <p className="text-2xl font-black tracking-tight text-zinc-900">Paid User</p>
                        </div>
                      </div>
                      <div className="text-right mt-4 md:mt-0 flex flex-col items-end justify-center">
                        <div className="text-5xl font-black tracking-tighter">{totalActiveGeo.toLocaleString()}</div>
                        <div className={`mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${activeChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {activeChange > 0 ? <ArrowUpRight size={14} /> : activeChange < 0 ? <ArrowDownRight size={14} /> : null}
                          {activeChange > 0 ? '+' : ''}{activeChange.toLocaleString()} ({activeChange > 0 ? '+' : ''}{activePctMap}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex justify-center -my-6 relative z-10 opacity-30">
                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                  </div>

                  {/* Step 3: Conversion */}
                  <div className="bg-zinc-900 border border-zinc-800 text-white p-10 rounded-3xl flex justify-between items-center shadow-2xl shadow-zinc-200 relative z-20 w-[80%] mx-auto transform hover:scale-[1.02] transition">
                    <div className="flex flex-col md:flex-row justify-between w-full h-full">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-2xl backdrop-blur-sm"><Activity size={32} className="text-emerald-400" /></div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 3: Bottom of Funnel</h4>
                          <p className="text-3xl font-black tracking-tight">Final Conversion</p>
                        </div>
                      </div>
                      <div className="text-right mt-4 md:mt-0 flex flex-col items-end justify-center">
                        <div className="text-6xl font-black tracking-tighter text-emerald-400 drop-shadow-md">{avgConversion}%</div>
                        <div className={`mt-2 flex items-center gap-1 text-sm font-bold opacity-80 ${convChange >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                          {convChange > 0 ? <ArrowUpRight size={16} /> : convChange < 0 ? <ArrowDownRight size={16} /> : null}
                          {convChange > 0 ? '+' : ''}{convChange.toFixed(2)}% vs {compareAvgConversion}%
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })()}

        {/* === TAB 5: ACADEMY === */}
        {activeTab === 'Academy' && (() => {
          // --- DATA TRANSFORMS FOR ACADEMY ---
          const validAcademyData = config.biData?.academy || [];
          const academyPrograms = Array.from(new Set(validAcademyData.map(a => a.program))).sort();

          return (
            <div className="space-y-12 animate-in fade-in">
              {academyPrograms.map((program: any) => {
                const programData = validAcademyData.filter(a => a.program === program);

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