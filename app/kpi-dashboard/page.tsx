'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { 
    TrendingUp, TrendingDown, Target, Activity, Zap, Shield, 
    BarChart3, Users, ChevronRight, Info, AlertCircle 
} from 'lucide-react';

const fetchActuals = async () => {
    const res = await fetch('/api/kpi-actuals');
    if (!res.ok) throw new Error('Failed to fetch actuals');
    return res.json();
};

export default function KpiDashboardPage() {
    const { data, isLoading, error } = useSWR('api/kpi-actuals', fetchActuals);
    const [viewType, setViewType] = useState<'role' | 'individual'>('role');
    const [selectedKpi, setSelectedKpi] = useState<any>(null);

    const roles = [
        { id: 'B2C', label: 'B2C (Growth)', color: 'blue' },
        { id: 'Sales', label: 'Sales (Revenue)', color: 'purple' },
        { id: 'PSE', label: 'PSE (Delivery)', color: 'orange' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
                    <span className="text-sm font-black tracking-widest text-zinc-400 uppercase">Calculating Metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-rose-500 gap-4">
                <AlertCircle className="w-12 h-12" />
                <p className="font-bold">Error loading KPI data: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen bg-zinc-50 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-900">PERFORMANCE HUB</h1>
                    <p className="text-zinc-500 mt-2 font-medium">System-wide Key Performance Indicators & Operational Metrics.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm self-start">
                    <button 
                        onClick={() => setViewType('role')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'role' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Role View
                    </button>
                    <button 
                        onClick={() => setViewType('individual')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === 'individual' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Individual View
                    </button>
                </div>
            </header>

            {viewType === 'role' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {roles.map(role => (
                        <div key={role.id} className="flex flex-col gap-6">
                            <div className={`flex items-center gap-3 p-4 rounded-2xl bg-white border-l-4 shadow-sm ${
                                role.color === 'blue' ? 'border-blue-500' : 
                                role.color === 'purple' ? 'border-purple-500' : 
                                'border-orange-500'
                            }`}>
                                <div className={`p-2 rounded-lg ${
                                    role.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                    role.color === 'purple' ? 'bg-purple-50 text-purple-600' : 
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase">{role.label}</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                {data?.summary?.filter((c: any) => c.role === role.id && c.owner_type === 'role').map((kpi: any) => (
                                    <KpiCard 
                                        key={kpi.id} 
                                        kpi={kpi} 
                                        onClick={() => setSelectedKpi(kpi)}
                                    />
                                ))}
                                
                                {data?.summary?.filter((c: any) => c.role === role.id && c.owner_type === 'role').length === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 italic text-sm">
                                        No role-level KPIs configured for {role.id}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-16">
                    {roles.map(role => {
                        const roleMembers = Object.entries(data?.individuals || {})
                            .filter(([_, kpis]: [string, any]) => kpis[0]?.role === role.id);
                        
                        if (roleMembers.length === 0) return null;

                        return (
                            <div key={role.id} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${
                                        role.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                        role.color === 'purple' ? 'bg-purple-50 text-purple-600' : 
                                        'bg-orange-50 text-orange-600'
                                    }`}>
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">{role.label} Team Members</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {roleMembers.map(([name, kpis]: [string, any]) => (
                                        <div key={name} className="flex flex-col gap-6">
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs">
                                                    {name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-zinc-900 text-lg leading-tight">{name}</h3>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{role.id} Performance</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                {kpis.map((kpi: any) => (
                                                    <KpiCard 
                                                        key={kpi.id} 
                                                        kpi={kpi} 
                                                        onClick={() => setSelectedKpi(kpi)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Drill-down Modal (Actionable layer) */}
            {selectedKpi && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8 border-b border-zinc-100 bg-zinc-50 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter text-zinc-900">{selectedKpi.kpi_name} Detail</h2>
                                <p className="text-zinc-500 text-sm">Actionable insights and historical breakdown.</p>
                            </div>
                            <button onClick={() => setSelectedKpi(null)} className="p-2 rounded-full hover:bg-white transition shadow-sm border border-transparent hover:border-zinc-200">
                                <ChevronRight className="w-6 h-6 rotate-90" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actual Value</span>
                                    <div className="text-3xl font-black text-zinc-900 mt-1">
                                        {selectedKpi.actual_value.toLocaleString()}{selectedKpi.is_percentage ? '%' : ''}
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Target</span>
                                    <div className="text-3xl font-black text-zinc-900 mt-1">
                                        {selectedKpi.target_value.toLocaleString()}{selectedKpi.is_percentage ? '%' : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                                <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm self-start">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900 text-sm mb-1">Operational Insight</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Current performance is influenced by the recent campaign activity. 
                                        Recommendation: Increase follow-up frequency at the proposal stage to improve conversion.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedKpi(null)}
                                className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ kpi, onClick }: { kpi: any, onClick: () => void }) {
    const progress = kpi.target_value > 0 ? (kpi.actual_value / kpi.target_value) * 100 : 0;
    
    let statusColor = 'rose';
    if (progress >= kpi.thresholds.green) statusColor = 'emerald';
    else if (progress >= kpi.thresholds.yellow) statusColor = 'amber';

    const trendValue = Math.floor(Math.random() * 10) - 3; // Mock trend

    return (
        <div 
            onClick={onClick}
            className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white transition-colors`}>
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors">{kpi.kpi_name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{kpi.role} Performance</p>
                    </div>

                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${
                    trendValue >= 0 ? 'text-emerald-600' : 'text-rose-600'
                } bg-zinc-50 px-2 py-1 rounded-full`}>
                    {trendValue >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trendValue)}% vs LW
                </div>
            </div>

            <div className="flex items-end justify-between mb-6">
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter text-zinc-900">
                        {kpi.actual_value.toLocaleString()}{kpi.is_percentage ? '%' : ''}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-1">
                        <Target className="w-3 h-3" /> Target: {kpi.target_value.toLocaleString()}{kpi.is_percentage ? '%' : ''}
                    </span>

                </div>
                <div className={`text-xs font-black px-3 py-1 rounded-full border ${
                    statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    statusColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                    {Math.round(progress)}%
                </div>
            </div>

            <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                            statusColor === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                            statusColor === 'amber' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                            'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">Progress</span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors">
                        Click for drill-down <ChevronRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
