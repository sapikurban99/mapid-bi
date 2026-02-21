'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Target, Zap, ChevronRight, X } from 'lucide-react';
import { getConfig, DEFAULT_CONFIG, SiteConfig } from './lib/config';



export default function StrategyHome() {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [config, setConfigState] = useState<SiteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfigState(getConfig());
  }, []);

  const roleDetails = config.roles;

  // Helper untuk render badge RACI
  const renderRACI = (type: string) => {
    switch (type) {
      case 'R': return <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">R</span>; // Responsible
      case 'A': return <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">A</span>; // Accountable
      case 'R/A': return <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">R/A</span>; // Resp & Acc
      case 'C': return <span className="font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">C</span>; // Consulted
      default: return <span className="text-zinc-300 font-medium">I</span>; // Informed
    }
  };

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 font-sans pb-24 selection:bg-zinc-900 selection:text-white">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200 shadow-sm">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <span className="font-black text-2xl tracking-tighter italic">MAPID 2026.</span>
          <Link href="/dashboard" className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] border-b-2 border-transparent hover:border-zinc-900 pb-1 transition-all">
            Enter BI Engine
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
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
              <p className="text-zinc-500 font-medium">Two equal pillars reporting to the CEO. Click cards for RACI breakdown.</p>
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
                  <p className={`text-xs font-bold tracking-widest ${activeRole === 'hob' ? 'text-zinc-400' : 'text-zinc-400'} uppercase`}>Growth & Ops</p>
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
                  <p className={`text-xs font-bold tracking-widest ${activeRole === 'enterprise_lead' ? 'text-zinc-400' : 'text-zinc-400'} uppercase`}>Commercial</p>
                </div>

                <div className="w-[2px] bg-zinc-200 h-8"></div>

                <div
                  onClick={() => setActiveRole('sales_enterprise')}
                  className={`border-2 p-6 w-full max-w-[240px] text-center cursor-pointer transition-all rounded-xl ${activeRole === 'sales_enterprise' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white border-zinc-200 hover:border-zinc-900'}`}
                >
                  <h4 className="text-sm font-black mb-1">Sales Enterprise</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Hunter Team</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RACI MATRIX */}
        <section className="mb-24">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black tracking-tight">RACI Matrix Alignment</h2>
          </div>
          <div className="bg-white border border-zinc-200 overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-900 text-[10px] uppercase tracking-[0.2em] text-white">
                <tr>
                  <th className="px-6 py-5 font-black">Activity Function</th>
                  {config.raci.columns.map(col => (
                    <th key={col.key} className="px-4 py-5 text-center font-bold">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {config.raci.rows.map((row, ridx) => (
                  <tr key={ridx} className="hover:bg-zinc-50 transition">
                    <td className="px-6 py-5 font-bold text-zinc-900">{row.activity}</td>
                    {config.raci.columns.map(col => (
                      <td key={col.key} className="text-center">{renderRACI(row.values[col.key] || 'I')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-zinc-50 text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex gap-6 justify-center">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> (R) Responsible</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> (A) Accountable</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> (C) Consulted</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-300"></div> (I) Informed</span>
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