'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, Target, Zap, ChevronRight, X, ChevronDown, Layers, Briefcase, Loader2 } from 'lucide-react';
import { useGrowthData } from './growth/useGrowthData';
import { useGlobalData } from './components/GlobalDataProvider';
import { getConfig, DEFAULT_CONFIG, SiteConfig } from './lib/config';

// Fetcher for SWR
const apiFetcher = (url: string) => fetch(url).then(r => r.json());

export default function StrategyHome() {
  const { isLoading: globalIsLoading } = useGlobalData();
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [config, setConfigState] = useState<SiteConfig>(DEFAULT_CONFIG);

  // Fetch Academy revenue directly from Supabase via /api/bi (not from localStorage)
  const { data: biData, isLoading: biLoading } = useSWR('/api/bi', apiFetcher, { revalidateOnFocus: false });

  // Fetch Live Platform Data from DevServer for Q2 2026
  const { allPayments, isLoading: platformLoading } = useGrowthData('2026-04-01', '2026-06-30');

  useEffect(() => {
    setConfigState(getConfig());
  }, [globalIsLoading]);

  const roleDetails = config.roles;

  // Calculate B2C targets from live data sources
  const b2cMetrics = useMemo(() => {
    // Academy: from Supabase revenue table (fetched via /api/bi)
    const revenueRows = biData?.revenue || [];
    const q2Revenue = revenueRows.filter((r: any) => {
        const q = String(r.quarter || '').toUpperCase();
        return q.includes('Q2') && q.includes('2026');
    });

    const academyRows = q2Revenue.filter((r: any) => r.subProduct?.toLowerCase().includes('academy'));
    const academyActual = academyRows.reduce((sum: number, r: any) => sum + (Number(r.actual) || 0), 0);
    const academyTargetFromDB = academyRows.reduce((sum: number, r: any) => sum + (Number(r.target) || 0), 0);

    // Platform: from devserver (live payment data)
    const platformActual = allPayments
      .filter((p: any) => p.status === 'success' && p.payment_methode?.toLowerCase() === 'midtrans')
      .reduce((sum: number, p: any) => sum + (p.detail_amount?.total || p.total || 0), 0);

    const academyTarget = academyTargetFromDB > 0 ? academyTargetFromDB : 60000000;
    const platformTarget = 40000000;

    return {
      academy: { 
          actual: academyActual, 
          target: academyTarget, 
          percent: Math.min(Math.round((academyActual / academyTarget) * 100), 100) 
      },
      platform: { 
          actual: platformActual, 
          target: platformTarget, 
          percent: Math.min(Math.round((platformActual / platformTarget) * 100), 100) 
      },
      total: { 
          actual: academyActual + platformActual, 
          target: academyTarget + platformTarget, 
          percent: Math.min(Math.round(((academyActual + platformActual) / (academyTarget + platformTarget)) * 100), 100) 
      },
      isLoading: biLoading || platformLoading,
    };
  }, [biData, allPayments, biLoading, platformLoading]);

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 font-sans pb-24 selection:bg-zinc-900 selection:text-white">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 shadow-sm">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <span className="font-black text-2xl tracking-tighter italic">MAPID 2026.</span>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto py-16 px-6 lg:px-8">

        {/* HERO STRATEGY */}
        <section className="mb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-[5rem] md:text-[8rem] font-black tracking-tighter mb-12 leading-[0.85] text-zinc-900">
            {config.heroTitle} <br /> <span className="text-zinc-300">{config.heroSubtitle}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-zinc-900 text-white rounded-2xl shadow-lg shadow-zinc-200 mt-1"><Target size={24} /></div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight mb-2">{config.objectiveTitle}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed">{config.objectiveText}</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-white border border-zinc-200 rounded-2xl mt-1"><Zap size={24} className="text-zinc-900" /></div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight mb-2">{config.vibeTitle}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed">{config.vibeText}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STRUKTUR ORGANISASI INTERAKTIF */}
        <section className="mb-32">
          <div className="mb-20 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end border-b border-zinc-200 pb-6">
            <div>
              <h3 className="font-black text-3xl tracking-tight mb-2">Team Architecture</h3>
              <p className="text-zinc-500 font-medium">Two equal pillars reporting to the CEO. Click cards for responsibilities.</p>
            </div>
          </div>

          <div className="flex flex-col items-center w-full relative">
            {/* CEO Root */}
            <div className="border-2 border-zinc-900 bg-white px-10 py-4 text-lg font-black tracking-[0.2em] uppercase z-10 rounded-xl shadow-lg">CEO</div>

            {/* Connector Lines */}
            <div className="w-[2px] bg-zinc-900 h-10"></div>
            <div className="h-[2px] bg-zinc-900 w-[60%] md:w-[50%]"></div>
            <div className="flex justify-between w-[60%] md:w-[50%] h-8">
              <div className="border-l-2 border-zinc-900"></div><div className="border-r-2 border-zinc-900"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-12 w-full mt-0">
              {/* Pillar 1: HOB */}
              <div className="flex flex-col items-center w-full max-w-sm mx-auto">
                <div
                  onClick={() => setActiveRole('hob')}
                  className={`border-2 p-8 w-full text-center cursor-pointer transition-all rounded-2xl ${activeRole === 'hob' ? 'bg-zinc-900 text-white border-zinc-900 scale-105 shadow-xl' : 'bg-white border-zinc-200 hover:border-zinc-900 hover:shadow-lg'}`}
                >
                  <h3 className="font-black text-xl mb-1">Head of Business</h3>
                  <p className={`text-xs font-bold tracking-widest ${activeRole === 'hob' ? 'text-zinc-400' : 'text-zinc-400'} uppercase`}>Hadi</p>
                </div>

                <div className="w-[2px] bg-zinc-200 h-8"></div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  {/* Growth Team Branch */}
                  <div className="flex flex-col gap-3">
                    <div
                      onClick={() => setActiveRole('dwi')}
                      className={`border-2 p-4 text-center cursor-pointer transition-all rounded-xl ${activeRole === 'dwi' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white border-zinc-200 hover:border-zinc-900'}`}
                    >
                      <h4 className="text-sm font-black mb-1">Growth Lead</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Dwi</p>
                    </div>
                    {/* Sub-team */}
                    <div className="flex flex-col gap-2 pl-4 border-l-2 border-zinc-100 ml-4">
                      {['wina', 'annisa', 'fariz'].map((name) => (
                        <div
                          key={name}
                          onClick={() => setActiveRole(name)}
                          className={`border p-3 text-center text-xs cursor-pointer transition-all rounded-lg font-black uppercase tracking-wider ${activeRole === name ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 hover:border-zinc-900'}`}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PSE Team Branch */}
                  <div
                    onClick={() => setActiveRole('pse_team')}
                    className={`border-2 p-4 text-center cursor-pointer transition-all rounded-xl h-fit ${activeRole === 'pse_team' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white border-zinc-200 hover:border-zinc-900'}`}
                  >
                    <h4 className="text-sm font-black mb-1">PSE Team</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Zhafran, Lossa, Amel</p>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Enterprise Lead */}
              <div className="flex flex-col items-center w-full max-w-sm mx-auto">
                <div
                  onClick={() => setActiveRole('enterprise_lead')}
                  className={`border-2 p-8 w-full text-center cursor-pointer transition-all rounded-2xl ${activeRole === 'enterprise_lead' ? 'bg-zinc-900 text-white border-zinc-900 scale-105 shadow-xl' : 'bg-white border-zinc-200 hover:border-zinc-900 hover:shadow-lg'}`}
                >
                  <h3 className="font-black text-xl mb-1">Enterprise Lead</h3>
                  <p className={`text-xs font-bold tracking-widest ${activeRole === 'enterprise_lead' ? 'text-zinc-400' : 'text-zinc-400'} uppercase`}>Andrew</p>
                </div>

                <div className="w-[2px] bg-zinc-200 h-8"></div>

                <div
                  onClick={() => setActiveRole('sales_enterprise')}
                  className={`border-2 p-6 w-full max-w-[240px] text-center cursor-pointer transition-all rounded-xl ${activeRole === 'sales_enterprise' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white border-zinc-200 hover:border-zinc-900'}`}
                >
                  <h4 className="text-sm font-black mb-1">Sales Enterprise</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Rani & Titan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B2C Q2 REVENUE TARGETS */}
        <section className="mb-32">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-zinc-200 pb-4 mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-1">B2C Q2 Revenue Targets</h2>
              <p className="text-zinc-400 text-sm font-medium">Real-time — Academy from database, Platform from live API.</p>
            </div>
            <div className="flex items-center gap-3">
              {b2cMetrics.isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <Loader2 size={14} className="animate-spin" /> Fetching live data...
                </div>
              )}
              <div className="bg-zinc-100 px-4 py-2 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Global Target:</span>
                <span className="ml-2 text-sm font-black text-zinc-950">Rp {(b2cMetrics.total.target / 1000000).toFixed(0)}M</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Academy Module */}
            <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-blue-500 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers size={48} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">MAPID Academy</h3>
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
              <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mt-4">Source: Supabase DB → revenue table</p>
            </div>

            {/* Platform Module */}
            <div className="bg-white border-2 border-zinc-100 p-8 rounded-3xl shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={48} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">MAPID Platform</h3>
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
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 relative z-10">Total B2C Performance</h3>
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
        </section>

        {/* BUSINESS MODEL & PRODUCT OVERVIEW */}
        <section className="mb-24">
          <div className="mb-12 border-b border-zinc-200 pb-6 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Business Core</h2>
              <p className="text-zinc-500 font-medium">Overview of the main revenue streams and product architecture.</p>
            </div>
            {/* Edit Button Placeholder - This indicates it's editable */}
            <button className="text-xs font-bold uppercase tracking-widest text-zinc-500 border border-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all">
              Edit Core
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Core 1: B2B */}
            <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm group hover:border-zinc-900 transition-colors">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Enterprise Solutions (B2B)</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">High-Value Contracts</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <h4 className="font-bold text-sm mb-1 text-zinc-900">Custom Implementation</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">Tailored geospatial solutions involving full SDLC, custom dashboard creation, and data integration tailored for BUMN/Enterprise.</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <h4 className="font-bold text-sm mb-1 text-zinc-900">Pilot & Renewal</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">Initial PoC projects scaling into annual recurring maintenance and license renewal contracts.</p>
                </div>
              </div>
            </div>

            {/* Core 2: B2C & Academy */}
            <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm group hover:border-zinc-900 transition-colors">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Platform & Academy (B2C)</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Volume & Community Growth</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <h4 className="font-bold text-sm mb-1 text-zinc-900">Personal License & Business Expansion Package</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">Self-serve subscriptions via the platform targeting individual professionals, researchers, and small businesses.</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <h4 className="font-bold text-sm mb-1 text-zinc-900">Academy Training</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">Monetized curriculum including WebGIS and Location Analytics courses, acting as both revenue generator and product adoption funnel.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ROLE DETAILS MODAL (Overlay) */}
      {activeRole && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex justify-center items-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 p-8 md:p-12 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200 relative">

            <button
              onClick={() => setActiveRole(null)}
              className="absolute top-6 right-6 p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-full transition-colors"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <div className="mb-8 border-b border-zinc-100 pb-6 pr-12">
              <h3 className="text-3xl font-black tracking-tight mb-2 text-zinc-900">{roleDetails[activeRole].title}</h3>
              <p className="text-sm font-medium text-zinc-500 italic">"{roleDetails[activeRole].focus}"</p>
            </div>

            <div className="space-y-10">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                  <Target size={14} /> Key Responsibilities
                </h4>
                <ul className="space-y-3">
                  {roleDetails[activeRole].responsibilities.map((r: string, i: number) => (
                    <li key={i} className="text-zinc-700 font-medium flex items-start gap-3 bg-zinc-50 p-3 rounded-lg">
                      <ChevronRight className="w-5 h-5 mt-0.5 text-zinc-400 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Do's</h4>
                  <ul className="space-y-3">
                    {roleDetails[activeRole].dos.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-emerald-900 font-bold flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 mb-4">Don't</h4>
                  <ul className="space-y-3">
                    {roleDetails[activeRole].donts.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-rose-900 font-bold flex items-start gap-2">
                        <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 shrink-0"></div> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}