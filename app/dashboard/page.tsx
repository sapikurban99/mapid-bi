'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowUpRight, ArrowDownRight, Users, Target, Activity, FileText, FolderOpen, TableProperties } from 'lucide-react';

export default function MinimalistDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Trends');
  const [trendView, setTrendView] = useState<'month' | 'quarter' | 'year'>('month'); // Toggle Trends
  const [errorMsg, setErrorMsg] = useState<any>(null);

  useEffect(() => {
    fetch('/api/gas')
      .then(res => res.json())
      .then(json => {
        if (json.isError || json.error) setErrorMsg(json);
        else setData(json);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg({ title: "Network Error", message: err.message });
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-zinc-400 p-8">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <p className="text-sm tracking-widest uppercase">Fetching Engine</p>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="bg-white p-8 border border-red-200 max-w-lg w-full">
        <h2 className="text-lg font-bold text-red-600 mb-2">Engine Error</h2>
        <p className="text-sm text-zinc-600 mb-4">{errorMsg.message || errorMsg.error}</p>
      </div>
    </div>
  );

  // Helper Trend Data
  const currentTrendData = data?.trends?.[trendView] || [];
  const maxRevenue = currentTrendData.length > 0 ? Math.max(...currentTrendData.map((d: any) => d.revenue)) : 1;

  // Format IDR Rupiah
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans pb-24 text-zinc-900">
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-3xl font-light tracking-tight">Business Metrics</h1>
        <p className="text-zinc-500 text-sm mt-1">Real-time SOT Database Tracker</p>
      </header>

      {/* TAB NAVIGATION */}
      <div className="max-w-6xl mx-auto mb-10 border-b border-zinc-200 flex gap-6 overflow-x-auto hide-scrollbar">
        {['Trends', 'B2C (Growth)', 'B2B (Enterprise)', 'Gallery & Docs'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab.split(' ')[0])}
            className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.split(' ')[0] ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* === TAB: TRENDS === */}
        {activeTab === 'Trends' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Revenue & Deal Size</h3>
               {/* TOGGLE WAKTU */}
               <div className="flex bg-white border border-zinc-200 p-1 rounded-md">
                 {['month', 'quarter', 'year'].map(tv => (
                   <button key={tv} onClick={() => setTrendView(tv as any)}
                     className={`px-4 py-1.5 text-xs font-semibold capitalize rounded ${trendView === tv ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                     {tv}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CSS Bar Chart Dinamis */}
              <div className="lg:col-span-2 bg-white border border-zinc-200 p-8 flex flex-col justify-end min-h-[300px]">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <div className="text-2xl font-light tracking-tight">Total Revenue</div>
                    <div className="text-xs text-zinc-400 mt-1">View: By {trendView} (in Millions)</div>
                  </div>
                </div>
                
                <div className="flex items-end justify-between gap-2 h-48 pt-4 border-b border-zinc-100">
                  {currentTrendData.map((hist: any, idx: number) => {
                    const heightPct = (hist.revenue / maxRevenue) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                        <span className="text-[10px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity mb-2">Rp {hist.revenue}M</span>
                        <div className="w-full max-w-[60px] bg-zinc-800 hover:bg-zinc-600 transition-all rounded-t-sm" style={{ height: `${heightPct}%`, minHeight: '10%' }}></div>
                        <span className="text-[10px] md:text-xs text-zinc-500 mt-3 whitespace-nowrap">{hist.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deal Size Stats (Menampilkan 2 data terakhir dari time view terpilih) */}
              <div className="space-y-6">
                {currentTrendData.slice().reverse().slice(0, 2).map((hist: any, idx: number) => (
                  <div key={idx} className={`bg-white border border-zinc-200 p-6 ${idx === 0 ? 'border-l-4 border-l-zinc-800' : 'opacity-70'}`}>
                    <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-4">{hist.label} Avg Deal Size</h4>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-light">Rp {hist.dealSize}M</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TAB: B2C (GROWTH) === */}
        {activeTab === 'B2C' && (
           <div className="space-y-12 animate-in fade-in">
             
             {/* Section: Social & Community */}
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Social & Community Health</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {data?.socials?.map((soc: any, idx: number) => (
                   <div key={idx} className="bg-white border border-zinc-200 p-4 flex flex-col items-center text-center">
                     <span className="text-[10px] uppercase font-bold text-zinc-400 mb-2">{soc.platform}</span>
                     <span className="text-xl font-light text-zinc-900">{soc.value.toLocaleString()}</span>
                     <div className="flex items-center mt-2 text-[10px] font-bold">
                       {soc.trend === 'up' ? <span className="text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3"/> {soc.growth}</span> 
                                           : <span className="text-red-500 flex items-center"><ArrowDownRight className="w-3 h-3"/> {soc.growth}</span>}
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Section: Campaigns */}
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Activation Campaigns</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {data?.campaigns?.map((camp: any, idx: number) => (
                   <div key={idx} className="bg-white border border-zinc-200 p-6">
                     <div className="flex justify-between items-start mb-4">
                       <h4 className="font-semibold text-zinc-900 line-clamp-1" title={camp.name}>{camp.name}</h4>
                       <span className={`text-[9px] uppercase font-bold px-2 py-1 border ${camp.status === 'Active' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}>{camp.status}</span>
                     </div>
                     <div className="flex justify-between items-end border-t border-zinc-100 pt-4">
                       <div><div className="text-[10px] text-zinc-400 uppercase">Leads</div><div className="text-lg font-light">{camp.leads}</div></div>
                       <div><div className="text-[10px] text-zinc-400 uppercase">Participants</div><div className="text-lg font-light">{camp.participants}</div></div>
                       <div className="text-right"><div className="text-[10px] text-zinc-400 uppercase">Conversion</div><div className="text-lg font-semibold text-indigo-600">{camp.conversion}%</div></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Section: Revenue Status (Tetap Ada) */}
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">B2C Revenue Status</h3>
               <div className="bg-white border border-zinc-200 overflow-x-auto">
                 <table className="w-full text-sm text-left whitespace-nowrap">
                   <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                     <tr><th className="px-6 py-4 font-normal">Sub Product</th><th className="px-6 py-4 font-normal">Actual vs Target</th><th className="px-6 py-4 font-normal">Achievement</th></tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100">
                     {data?.revenue?.map((rev: any, idx: number) => (
                       <tr key={idx}>
                         <td className="px-6 py-4 font-medium">{rev.subProduct}</td>
                         <td className="px-6 py-4 text-zinc-500 text-xs">Rp {rev.actual.toLocaleString()} <span className="mx-2">/</span> Rp {rev.target.toLocaleString()}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-24 bg-zinc-100 h-1"><div className={`h-1 ${rev.achievement >= 100 ? 'bg-emerald-500' : 'bg-zinc-900'}`} style={{ width: `${Math.min(rev.achievement, 100)}%` }}></div></div>
                             <span className={`text-xs font-bold ${rev.achievement >= 100 ? 'text-emerald-600' : 'text-zinc-600'}`}>{rev.achievement}%</span>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
        )}

        {/* === TAB: B2B (ENTERPRISE) === */}
        {activeTab === 'B2B' && (
           <div className="animate-in fade-in space-y-12">
             
             {/* PIPELINE PROGRESS (Data Asli Image) */}
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex justify-between">
                 <span>Pipeline Progress (2026)</span>
                 <span className="text-zinc-900 font-bold tracking-normal text-sm">Total Est: Rp 7.46 B</span>
               </h3>
               <div className="bg-white border border-zinc-200 overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-4 font-normal">Client / Lead</th>
                        <th className="px-4 py-4 font-normal">Industry</th>
                        <th className="px-4 py-4 font-normal">Current Stage</th>
                        <th className="px-4 py-4 font-normal text-right">Est. Value</th>
                        <th className="px-4 py-4 font-normal">Next Action</th>
                        <th className="px-4 py-4 font-normal">ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data?.pipeline?.map((pipe: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="px-6 py-4 font-bold text-zinc-800">{pipe.client}</td>
                          <td className="px-4 py-4 text-xs text-zinc-500">{pipe.industry}</td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${pipe.stage === 'Won' ? 'bg-emerald-100 text-emerald-700' : pipe.stage === 'Negotiation' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {pipe.stage}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-zinc-700">{formatIDR(pipe.value)}</td>
                          <td className="px-4 py-4 text-xs text-zinc-500">{pipe.action}</td>
                          <td className="px-4 py-4 text-xs font-semibold">{pipe.eta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>

             {/* PROJECT DELIVERY (Dari Versi Lama) */}
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Project Delivery Watchlist</h3>
               <div className="bg-white border border-zinc-200 overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                      <tr><th className="px-6 py-4 font-normal">Project</th><th className="px-6 py-4 font-normal w-1/4">Progress</th><th className="px-6 py-4 font-normal">Status Notes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {data?.projects?.map((proj: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 font-medium">{proj.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3"><div className="w-full bg-zinc-100 h-1"><div className={`h-1 ${proj.progress < 20 ? 'bg-red-400' : 'bg-zinc-900'}`} style={{ width: `${proj.progress}%` }}></div></div><span className="text-xs font-medium">{proj.progress}%</span></div>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">{proj.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </div>
           </div>
        )}

        {/* === TAB: GALLERY & DOCS === */}
        {activeTab === 'Gallery' && (
          <div className="animate-in fade-in space-y-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Knowledge Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data?.docs?.map((doc: any, idx: number) => (
                <div key={idx} className="group bg-white border border-zinc-200 p-6 flex flex-col justify-between hover:border-zinc-400 transition cursor-pointer">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      {doc.format === 'Folder' ? <FolderOpen className="w-5 h-5 text-zinc-400"/> : doc.format === 'Sheet' ? <TableProperties className="w-5 h-5 text-emerald-500"/> : <FileText className="w-5 h-5 text-indigo-500"/>}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 border border-zinc-100">{doc.category}</span>
                    </div>
                    <h4 className="font-semibold text-zinc-900 mb-2">{doc.title}</h4>
                    <p className="text-xs text-zinc-500 mb-6">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}