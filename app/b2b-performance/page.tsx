'use client';
import { useEffect, useState, useMemo } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, SiteConfig } from '../lib/config';
import { Loader2, DollarSign, Calendar, TrendingUp, Target, Zap, Info } from 'lucide-react';

export default function B2BPerformancePage() {
    const { syncData, isLoading: globalIsLoading } = useGlobalData();
    const [config, setLocalConfig] = useState<SiteConfig | null>(null);
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState<'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('All');

    useEffect(() => {
        setLocalConfig(getConfig());
    }, [globalIsLoading]);

    // Guard: render nothing until config is loaded
    if (!config) return <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Workspace...</div>;

    const formatIDR = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const getPseName = (id: string) => config?.pseWorkloads?.find((p: any) => p.pseId === id)?.name || 'Unknown PSE';

    // Filter Logic for Revenue Tab
    const filteredLeads = (config?.kanbanLeads || []).filter((l: any) => {
        if (selectedQuarter === 'All') return true;
        if (!l.expectedCloseDate) return false;
        const month = new Date(l.expectedCloseDate).getMonth();
        const quarter = `Q${Math.floor(month / 3) + 1}`;
        return quarter === selectedQuarter;
    });

    const filteredProjects = (config?.kanbanProjects || []).filter((p: any) => {
        if (selectedQuarter === 'All') return true;
        if (!p.closeDate) return false;
        const month = new Date(p.closeDate).getMonth();
        const quarter = `Q${Math.floor(month / 3) + 1}`;
        return quarter === selectedQuarter;
    });

    const activeProjectsRev = filteredProjects.filter((p: any) => p.stage !== 'Done' && p.stage !== 'Lost' && p.stage !== 'Freeze').reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const doneProjectsRev = filteredProjects.filter((p: any) => p.stage === 'Done').reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const potentialRevenue = filteredLeads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) || 0), 0);
    const weightedPipeline = filteredLeads.filter((l: any) => !['Closed Lost', 'Freeze'].includes(l.stage)).reduce((acc: number, curr: any) => acc + (Number(curr.forecastedValue) * (curr.probability || 0)), 0);

    return (
        <main className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans pb-24 text-zinc-900">
            <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter leading-none mb-2">B2B <span className="text-zinc-300">Performance.</span></h1>
                    <p className="text-zinc-500 text-sm font-medium">Revenue & Financial Pipeline</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select value={selectedQuarter} onChange={(e: any) => setSelectedQuarter(e.target.value)} className="bg-white border border-zinc-200 text-xs font-black uppercase px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm flex-1 md:flex-none">
                        <option value="All">All Quarters</option>
                        <option value="Q1">Q1 Performance</option>
                        <option value="Q2">Q2 Performance</option>
                        <option value="Q3">Q3 Performance</option>
                        <option value="Q4">Q4 Performance</option>
                    </select>
                    <button
                        onClick={async () => {
                            setLoadingBiData(true);
                            await syncData();
                            setLoadingBiData(false);
                        }}
                        disabled={loadingBiData || globalIsLoading}
                        className={`flex items-center justify-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg flex-1 md:flex-none ${loadingBiData || globalIsLoading ? 'bg-zinc-900 text-white cursor-wait opacity-80' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                        {loadingBiData || globalIsLoading ? <><Loader2 size={14} className="animate-spin" /> Syncing</> : <><Target size={14} /> Sync Data</>}
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Analytics Card */}
                    <div className="lg:col-span-8 bg-zinc-900 rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[400px]">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -ml-20 -mb-20"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8 md:mb-12">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 block">Revenue Projection</span>
                                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter break-words leading-tight">
                                        {formatIDR(activeProjectsRev + doneProjectsRev + potentialRevenue)}
                                    </h2>
                                    <p className="text-zinc-400 text-xs md:text-sm font-medium mt-2">Total Combined Pipeline for {selectedQuarter === 'All' ? 'Fiscal Year' : selectedQuarter}</p>
                                </div>
                                <div className="bg-white/10 p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-md border border-white/10 shrink-0">
                                    <TrendingUp className="text-emerald-400" size={24} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Realized Revenue</p>
                                    <p className="text-lg md:text-xl font-black text-emerald-400 whitespace-nowrap">{formatIDR(doneProjectsRev)}</p>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Completed Projects</p>
                                </div>
                                <div className="md:border-x border-white/10 md:px-8 space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Contract Value</p>
                                    <p className="text-lg md:text-xl font-black text-blue-400 whitespace-nowrap">{formatIDR(activeProjectsRev)}</p>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ongoing Delivery</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Unweighted Leads</p>
                                    <p className="text-lg md:text-xl font-black text-zinc-300 whitespace-nowrap">{formatIDR(potentialRevenue)}</p>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Sales Opportunities</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-3 mt-auto">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                <span>Realization Progress</span>
                                <span>{Math.round((doneProjectsRev / (doneProjectsRev + activeProjectsRev + potentialRevenue || 1)) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ width: `${Math.round((doneProjectsRev / (doneProjectsRev + activeProjectsRev + potentialRevenue || 1)) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Insights Side Card */}
                    <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                                <Target size={24} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 mb-3">Weighted Pipeline</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-6">
                                Probability-adjusted forecast based on current lead stages.
                            </p>
                            <div className="space-y-4">
                                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Expected Closure</p>
                                    <p className="text-lg md:text-xl font-black text-blue-600 whitespace-nowrap">{formatIDR(weightedPipeline)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-zinc-900 p-5 rounded-2xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                                <Info size={12} /> Strategic Insight
                            </p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                Focus on high-probability leads to secure cash flow for {selectedQuarter === 'All' ? 'the fiscal year' : selectedQuarter}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filtered Tables */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
                    <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">Opportunity Breakdown</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Leads with expected close in {selectedQuarter}</p>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                                <Target size={18} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[600px]">
                                <thead className="bg-white text-[9px] text-zinc-400 border-b border-zinc-100 font-black uppercase tracking-[0.1em]">
                                    <tr>
                                        <th className="px-8 py-5 min-w-[200px]">Opportunity</th>
                                        <th className="px-4 py-5">Stage</th>
                                        <th className="px-4 py-5 text-right">Value (IDR)</th>
                                        <th className="px-8 py-5 text-center">Prob.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {filteredLeads.filter((l: any) => l.forecastedValue > 0 && !['Closed Lost', 'Freeze'].includes(l.stage)).sort((a: any, b: any) => b.forecastedValue - a.forecastedValue).map((l: any) => (
                                        <tr key={l.id} className="hover:bg-zinc-50/80 transition group">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-1">{l.name}</p>
                                                <p className="text-[9px] font-black uppercase text-zinc-400 mt-1">{l.picSales || 'No PIC'}</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-[9px] rounded-lg font-black uppercase tracking-widest border border-zinc-200 whitespace-nowrap inline-block">{l.stage}</span>
                                            </td>
                                            <td className="px-4 py-5 text-right font-mono font-black text-zinc-900">{formatIDR(l.forecastedValue)}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-black border border-emerald-100">
                                                    {Math.round((l.probability || 0) * 100)}%
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLeads.length === 0 && (
                                        <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-400 font-medium italic">No opportunities found for this quarter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">Contract Lifecycle</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Active & Closed Projects in {selectedQuarter}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                <Zap size={18} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[600px]">
                                <thead className="bg-white text-[9px] text-zinc-400 border-b border-zinc-100 font-black uppercase tracking-[0.1em]">
                                    <tr>
                                        <th className="px-8 py-5 min-w-[200px]">Client / Project</th>
                                        <th className="px-4 py-5">Lifecycle</th>
                                        <th className="px-4 py-5 text-center">Close Date</th>
                                        <th className="px-8 py-5 text-right">Value (IDR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {filteredProjects.filter((p: any) => p.forecastedValue > 0 && !['Lost', 'Freeze'].includes(p.stage)).sort((a: any, b: any) => b.forecastedValue - a.forecastedValue).map((p: any) => (
                                        <tr key={p.id} className="hover:bg-zinc-50/80 transition group">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{p.projectName}</p>
                                                <p className="text-[9px] font-black uppercase text-zinc-400 mt-1">{p.client}</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className={`px-2.5 py-1 text-[9px] rounded-lg font-black uppercase tracking-widest border whitespace-nowrap inline-block ${p.stage === 'Done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{p.stage}</span>
                                            </td>
                                            <td className="px-4 py-5 text-center font-bold text-zinc-400">
                                                {p.closeDate ? new Date(p.closeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono font-black text-zinc-900">{formatIDR(p.forecastedValue)}</td>
                                        </tr>
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-400 font-medium italic">No active contracts found for this quarter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
