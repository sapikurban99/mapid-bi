'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const roleDetails: Record<string, any> = {
  'dwi': { title: 'Growth Marketing (Dwi)', focus: 'Planning Conversion Funnels, Data Analytics.', responsibilities: ['Analyze user data & manage paid channels.', 'Temporary Admin (Q1).', 'Final Quality Control (QC) for content.'], dos: ['Focus on CPL and Conversion Rates.'], donts: ['Do not execute content creation.'] },
  'wina': { title: 'Activation (Wina)', focus: 'Full Content Execution & Community Leadership.', responsibilities: ['Plan & Execute ALL social media content.', 'Manage community freelancers.', 'Lead brainstorming with PSE.'], dos: ['Translate complex tech jargon.'], donts: ['Do not wait for ideas (You are the engine).'] },
  'annisa': { title: 'Design (Annisa)', focus: 'Brand Awareness & Art Direction.', responsibilities: ['Create visual assets.', 'Manage freelance designers.', 'Maintain Brand Guidelines.'], dos: ['Ensure visual consistency.'], donts: ['Do not compromise brand guidelines.'] },
  'fariz': { title: 'Academy Ops (Fariz)', focus: 'Curriculum Architecture.', responsibilities: ['Draft curriculum & update LMS.', 'Manage thematic classes.', 'Ensure product readiness.'], dos: ['Focus on curriculum quality.'], donts: ['Do not handle PR/Humas.'] },
  'pse_team': { title: 'PSE Team', focus: 'Technical PM & Solution Design.', responsibilities: ['Manage SDLC.', 'Technical proposals.', 'Handover Validation.', 'Technical support.'], dos: ['Reject incomplete handovers.'], donts: ['NO commercial negotiation.'] },
  'sales_enterprise': { title: 'Enterprise Sales', focus: 'New Lead Acquisition.', responsibilities: ['Acquire new accounts.', 'Draft commercial proposals.', 'Target: 20 Proposals / Month.'], dos: ['Hit proposal volume.'], donts: ['Do not promise unvalidated tech features.'] },
  'hob': { title: 'Head of Business', focus: 'Growth Engine & P&L Management.', responsibilities: ['Oversee P&L.', 'Manage Marketing & PSE.', 'Coordinate strategy.'], dos: ['Ensure smooth operations.'], donts: ['Do not micromanage daily sales.'] },
  'enterprise_lead': { title: 'Enterprise Lead', focus: 'Commercial Engine.', responsibilities: ['Lead Sales Team.', 'C-Level negotiations.', 'Report pipeline.'], dos: ['Focus on big-ticket deals.'], donts: ['Do not over-commit tech resources.'] }
};

export default function StrategyHome() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 font-sans pb-20">
      
      <header className="bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-200">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">Strategy Q1</span>
          <Link href="/dashboard" className="text-sm font-medium hover:text-zinc-500 transition flex items-center gap-1">
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto py-16 px-6">
        
        {/* STRUKTUR ORGANISASI MINIMALIS */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h1 className="text-3xl font-light tracking-tight mb-2">Team Structure</h1>
            <p className="text-zinc-500 text-sm">Two equal pillars reporting to the CEO.</p>
          </div>

          <div className="flex flex-col items-center w-full relative">
            <div className="border border-zinc-300 bg-white px-8 py-3 text-sm font-semibold tracking-widest uppercase z-10">CEO</div>
            <div className="w-[1px] bg-zinc-300 h-8"></div>
            <div className="h-[1px] bg-zinc-300 w-[50%]"></div>
            <div className="flex justify-between w-[50%] h-6">
              <div className="border-l border-zinc-300"></div><div className="border-r border-zinc-300"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-2">
              {/* Pillar 1 */}
              <div className="flex flex-col items-center">
                <div onClick={() => setActiveRole('hob')} className="border border-zinc-200 bg-white p-6 w-full text-center cursor-pointer hover:border-zinc-400 transition">
                  <h3 className="font-semibold">Head of Business</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">GROWTH & OPS</p>
                </div>
                <div className="w-[1px] bg-zinc-200 h-6"></div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div onClick={() => setActiveRole('dwi')} className="border border-zinc-200 bg-white p-4 text-center cursor-pointer hover:bg-zinc-50 transition">
                    <h4 className="text-xs font-semibold">Growth</h4>
                    <p className="text-[10px] text-zinc-400">Dwi, Wina, Annisa, Fariz</p>
                  </div>
                  <div onClick={() => setActiveRole('pse_team')} className="border border-zinc-200 bg-white p-4 text-center cursor-pointer hover:bg-zinc-50 transition">
                    <h4 className="text-xs font-semibold">PSE</h4>
                    <p className="text-[10px] text-zinc-400">Zhafran, Lossa, Amel</p>
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col items-center">
                <div onClick={() => setActiveRole('enterprise_lead')} className="border border-zinc-200 bg-white p-6 w-full text-center cursor-pointer hover:border-zinc-400 transition">
                  <h3 className="font-semibold">Enterprise Lead</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">COMMERCIAL</p>
                </div>
                <div className="w-[1px] bg-zinc-200 h-6"></div>
                <div onClick={() => setActiveRole('sales_enterprise')} className="border border-zinc-200 bg-white p-4 w-full max-w-[200px] text-center cursor-pointer hover:bg-zinc-50 transition">
                  <h4 className="text-xs font-semibold">Sales</h4>
                  <p className="text-[10px] text-zinc-400">Hunter Team</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLE DETAILS MODAL */}
        {activeRole && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex justify-center items-center z-50 p-6">
            <div className="bg-white border border-zinc-200 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold">{roleDetails[activeRole].title}</h3>
                  <p className="text-sm text-zinc-500">{roleDetails[activeRole].focus}</p>
                </div>
                <button onClick={() => setActiveRole(null)} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-900">Close</button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Key Responsibilities</h4>
                  <ul className="list-disc ml-4 text-sm space-y-1 text-zinc-700">{roleDetails[activeRole].responsibilities.map((r:string, i:number) => <li key={i}>{r}</li>)}</ul>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Do's</h4>
                    <ul className="list-disc ml-4 text-sm space-y-1 text-zinc-900">{roleDetails[activeRole].dos.map((r:string, i:number) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Don'ts</h4>
                    <ul className="list-disc ml-4 text-sm space-y-1 text-zinc-500">{roleDetails[activeRole].donts.map((r:string, i:number) => <li key={i}>{r}</li>)}</ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RACI MATRIX MINIMALIS */}
        <section className="mb-24">
          <h2 className="text-lg font-bold mb-6">RACI Matrix</h2>
          <div className="bg-white border border-zinc-200 overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Activity</th>
                  <th className="px-4 py-4 font-medium text-center">HoB</th>
                  <th className="px-4 py-4 font-medium text-center">Ent</th>
                  <th className="px-4 py-4 font-medium text-center">Grwth</th>
                  <th className="px-4 py-4 font-medium text-center">Actv</th>
                  <th className="px-4 py-4 font-medium text-center">Dsgn</th>
                  <th className="px-4 py-4 font-medium text-center">PSE</th>
                  <th className="px-4 py-4 font-medium text-center">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr className="hover:bg-zinc-50">
                  <td className="px-6 py-4 text-zinc-700">Content Execution</td>
                  <td className="text-center text-zinc-400">I</td><td className="text-center text-zinc-400">I</td>
                  <td className="text-center font-bold">A</td><td className="text-center font-bold">R</td><td className="text-center font-bold">C</td><td className="text-center text-zinc-400">I</td><td className="text-center text-zinc-400">I</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="px-6 py-4 text-zinc-700">Solution Design</td>
                  <td className="text-center text-zinc-400">I</td><td className="text-center text-zinc-400">I</td>
                  <td className="text-center text-zinc-400">I</td><td className="text-center text-zinc-400">I</td><td className="text-center text-zinc-400">I</td><td className="text-center font-bold">R/A</td><td className="text-center font-bold">C</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}