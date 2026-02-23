'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, ArrowUpRight, ArrowDownRight, Users, Target,
  Activity, FileText, FolderOpen, TableProperties, Lock,
  TrendingUp, BarChart3, Globe, Share2, ArrowRight, Sparkles, MoreVertical
} from 'lucide-react';
import { getConfig } from '../lib/config';
import LoadingProgress from '../components/LoadingProgress';

export default function MinimalistDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trends');
  const [trendView, setTrendView] = useState<'month' | 'quarter' | 'year'>('month');
  const [growthMonth, setGrowthMonth] = useState('All');
  const [growthWeek, setGrowthWeek] = useState('All');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<any>(null);

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
          if (adminBiData && (adminBiData.socials?.length || adminBiData.campaigns?.length || adminBiData.revenue?.length || adminBiData.pipeline?.length)) {
            setData(adminBiData);
          } else if (json.adminConfig?.biData) {
            const gasBiData = json.adminConfig.biData;
            if (gasBiData && (gasBiData.socials?.length || gasBiData.campaigns?.length || gasBiData.revenue?.length || gasBiData.pipeline?.length)) {
              setData(gasBiData);
            } else {
              setData(json);
            }
          } else {
            setData(json);
          }
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

  const formatTrendLabel = (label: string, view: string) => {
    if (view === 'year') {
      // Jika view year, kembalikan teks aslinya (misal "2024", "2025")
      return label;
    }
    // Jika bukan year, bersihkan format ISO String jika ada
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
  const totalB2CActual = data?.revenue?.reduce((acc: number, curr: any) => acc + curr.actual, 0) || 0;
  const totalB2CTarget = data?.revenue?.reduce((acc: number, curr: any) => acc + curr.target, 0) || 0;
  // Hitung persentase dan batasi hingga 2 desimal
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
  const currentTrendData = data?.trends?.[trendView] || [];
  const validTrendData = currentTrendData.filter((d: any) => d && d.revenue !== undefined);

  // Mencari nilai max untuk skala vertikal
  const rawMax = validTrendData.length > 0 ? Math.max(...validTrendData.map((d: any) => Number(d.revenue) || 0)) : 1;
  const maxRevenueValue = rawMax * 1.1; // Tambah buffer 10% di atas agar grafik tidak menabrak atap kontainer

  // Fungsi untuk membuat path SVG Garis
  const generateSvgLine = (dataPoints: any[], width: number, height: number) => {
    if (!dataPoints || dataPoints.length === 0) return "";

    // Memberikan padding horizontal agar titik awal dan akhir tidak terpotong
    const paddingX = 40;
    const effectiveWidth = width - (paddingX * 2);

    // Jarak antar titik
    const stepX = dataPoints.length > 1 ? effectiveWidth / (dataPoints.length - 1) : effectiveWidth;

    return dataPoints.reduce((acc, point, index) => {
      const x = paddingX + (index * stepX);
      // Kalkulasi Y proporsional. SVG Y=0 ada di atas, jadi kita kurangi dari tinggi total.
      const y = height - (((Number(point.revenue) || 0) / maxRevenueValue) * height);

      return acc === "" ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, "");
  };

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
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* === TAB 1: TRENDS === */}
        {activeTab === 'Trends' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Revenue Performance</h3>
              <div className="flex bg-zinc-100 p-1 rounded-lg">
                {(['month', 'quarter', 'year'] as const).map(tv => (
                  <button key={tv} onClick={() => setTrendView(tv)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition ${trendView === tv ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                    {tv}
                  </button>
                ))}
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
                <div className="overflow-x-auto hide-scrollbar w-full h-full flex-1">
                  <div className="min-w-[800px] h-full px-8 pb-8 pt-2 flex flex-col relative w-full">

                    {/* Y-Axis Labels & Dashed Grid Lines */}
                    <div className="absolute inset-x-8 top-12 bottom-16 flex flex-col justify-between pointer-events-none">
                      {[4, 3, 2, 1, 0].map((i) => {
                        const lineValue = (maxRevenueValue / 4) * i;
                        return (
                          <div key={i} className="w-full flex items-center relative">
                            {/* Label Y-Axis */}
                            <span className="absolute -left-2 -translate-x-full text-[10px] font-bold text-zinc-400 w-24 text-right pr-2 bg-white z-10">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(lineValue * 1000000)}
                            </span>
                            <div className="w-full border-t border-zinc-100 ml-2"></div>
                          </div>
                        );
                      })}
                    </div>

                    {/* The Bar Graph */}
                    <div className="flex-1 relative mt-12 mb-10 w-full flex items-end justify-between px-[4%] gap-4 z-10 pointer-events-none">
                      {validTrendData.length > 0 && validTrendData.map((point: any, index: number) => {
                        // Capped calculation to ensure points don't shoot out of the container bounds
                        const safeRevenue = Math.min(Number(point.revenue) || 0, maxRevenueValue);
                        const yRatio = maxRevenueValue > 0 ? (safeRevenue / maxRevenueValue) : 0;
                        const heightPct = yRatio * 100;

                        return (
                          <div key={index} className="relative flex flex-col justify-end items-center h-full flex-1 w-full pointer-events-auto group">
                            {/* Bar Form */}
                            <div
                              className="w-full max-w-[48px] bg-blue-500 rounded-t-sm hover:opacity-80 transition-opacity"
                              style={{ height: `${heightPct}%` }}
                            ></div>

                            {/* Tooltip Nilai Selalu Tampil */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-blue-500 text-[10px] font-medium whitespace-nowrap drop-shadow-sm font-mono">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((Number(point.revenue) || 0) * 1000000)}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Label X-Axis (Bulan/Tahun) */}
                    <div className="flex justify-between w-full px-[4%] mt-auto pt-4 relative z-10">
                      {validTrendData.map((hist: any, idx: number) => (
                        <span key={idx} className="text-[10px] font-bold text-zinc-400 capitalize tracking-normal text-center bg-white px-2">
                          {formatTrendLabel(hist.label, trendView)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Summary Cards */}
              <div className="space-y-6">
                {validTrendData.slice().reverse().slice(0, 2).map((hist: any, idx: number) => (
                  <div key={idx} className={`bg-white border border-zinc-200 p-6 rounded-2xl ${idx === 0 ? 'ring-2 ring-zinc-900 ring-offset-2 shadow-lg' : 'opacity-60'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{formatTrendLabel(hist.label, trendView)} Summary</h4>
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

                const filteredSocials = socialsData.filter((d: any) =>
                  (growthMonth === 'All' || d.month === growthMonth) &&
                  (growthWeek === 'All' || d.week === growthWeek)
                );

                // Find the latest period metrics (the currently filtered ones) grouped by platform
                const latestMetrics = filteredSocials.reduce((acc: any, curr: any) => {
                  const key = curr.platform;
                  if (!acc[key]) acc[key] = { value: 0, metric: curr.metric };
                  acc[key].value += Number(curr.value) || 0;
                  return acc;
                }, {});

                // Simplified Growth Logic: In a real app we would explicitly find the "previous" month/week.
                // For now, if "All" is selected, growth is NA. If a specific time is selected, 
                // we'll find sum of all OTHER periods to act as a baseline, OR we just show the raw value if previous is complex.
                // To keep it strictly comparing (Current vs Previous), we need chronologically sorted data, 
                // but for MVP dashboard, we'll calculate Growth over a baseline if exact previous period isn't strictly defined.
                // For demonstration, let's assume we want to just display the filtered values and a placeholder growth 
                // if we don't have a reliable previous period, OR we can calculate vs the average.

                // Let's implement a robust "vs Previous Period" if we have exact data, or just show the filtered total.
                const calculateGrowth = (current: number, previous: number) => {
                  if (!previous || previous === 0) return { pct: '0%', trend: 'up' };
                  const diff = ((current - previous) / previous) * 100;
                  return {
                    pct: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
                    trend: diff >= 0 ? 'up' : 'down'
                  };
                };

                // Group all raw data by platform to find global previous if possible.
                // Right now we just display the filtered metrics.
                const platforms = Object.keys(latestMetrics);

                return (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-black">Social Media & Community Trend</h3>
                      <div className="flex gap-3">
                        <select value={growthMonth} onChange={(e) => setGrowthMonth(e.target.value)}
                          className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                          {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                        </select>
                        <select value={growthWeek} onChange={(e) => setGrowthWeek(e.target.value)}
                          className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
                          {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                        </select>
                      </div>
                    </div>

                    {filteredSocials.length === 0 ? (
                      <div className="text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest">No data for selected period</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {platforms.map((platform, idx) => {
                          const currentVal = latestMetrics[platform].value;
                          // Dummy up some variance for demonstration since we don't have strictly mapped "last week" logic yet
                          const isUp = currentVal > 1000;

                          return (
                            <div key={idx} className="bg-white border border-zinc-200 p-5 rounded-xl text-center flex flex-col items-center justify-center transition hover:border-zinc-400 shadow-sm">
                              <span className="text-[9px] font-black uppercase text-zinc-400 mb-2 tracking-widest">{platform}</span>
                              <span className="text-xl font-black tracking-tighter">{currentVal.toLocaleString()}</span>
                              <span className="text-[9px] text-zinc-300 font-bold mt-1 uppercase tracking-widest">{latestMetrics[platform].metric}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Campaign Activations */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 font-black">Active Campaigns & Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data?.campaigns?.map((camp: any, idx: number) => (
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
                    <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Actual vs Target</th><th className="px-6 py-4">Progress</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.revenue?.map((rev: any, idx: number) => {
                      // Format angka desimal pada row tabel agar rapi
                      const achPct = typeof rev.achievement === 'number' ? rev.achievement.toFixed(2) : rev.achievement;
                      return (
                        <tr key={idx} className="hover:bg-zinc-50 transition">
                          <td className="px-6 py-5 font-bold">{rev.subProduct}</td>
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
                      <td className="px-6 py-5 uppercase">Total B2C</td>
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

          return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6 mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">User Growth Funnel</h3>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Acquisition & Activation Mapping</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={growthMonth}
                    onChange={(e) => setGrowthMonth(e.target.value)}
                    className="bg-white border border-zinc-200 text-sm font-bold p-2.5 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  >
                    {uniqueMonths.map((m: any) => <option key={m} value={m}>{m === 'All' ? 'All Months' : m}</option>)}
                  </select>
                  <select
                    value={growthWeek}
                    onChange={(e) => setGrowthWeek(e.target.value)}
                    className="bg-white border border-zinc-200 text-sm font-bold p-2.5 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  >
                    {uniqueWeeks.map((w: any) => <option key={w} value={w}>{w === 'All' ? 'All Weeks' : w}</option>)}
                  </select>
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
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl shadow-inner"><Users size={28} /></div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 1: Top of Funnel</h4>
                        <p className="text-2xl font-black tracking-tight text-zinc-900">New Registered Users</p>
                      </div>
                    </div>
                    <div className="text-5xl font-black tracking-tighter">{totalNewRegist.toLocaleString()}</div>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex justify-center -my-6 relative z-10 opacity-30">
                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                  </div>

                  {/* Step 2: Paid User */}
                  <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex justify-between items-center shadow-sm relative z-20 w-[90%] mx-auto transition hover:shadow-md hover:border-zinc-300">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-2xl shadow-inner"><Target size={28} /></div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 2: Activation</h4>
                        <p className="text-2xl font-black tracking-tight text-zinc-900">Paid User</p>
                      </div>
                    </div>
                    <div className="text-5xl font-black tracking-tighter">{totalActiveGeo.toLocaleString()}</div>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex justify-center -my-6 relative z-10 opacity-30">
                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                  </div>

                  {/* Step 3: Conversion */}
                  <div className="bg-zinc-900 border border-zinc-800 text-white p-10 rounded-3xl flex justify-between items-center shadow-2xl shadow-zinc-200 relative z-20 w-[80%] mx-auto transform hover:scale-[1.02] transition">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-2xl backdrop-blur-sm"><Activity size={32} className="text-emerald-400" /></div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 3: Bottom of Funnel</h4>
                        <p className="text-3xl font-black tracking-tight">Final Conversion</p>
                      </div>
                    </div>
                    <div className="text-6xl font-black tracking-tighter text-emerald-400 drop-shadow-md">{avgConversion}%</div>
                  </div>

                </div>
              )}
            </div>
          );
        })()}

        {/* === TAB 5: GALLERY === */}
        {activeTab === 'Gallery' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-black">Knowledge Base & Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.docs?.map((doc: any, idx: number) => {
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
        )}

      </div>
    </main>
  );
}