'use client';
import { useState, useEffect } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig } from '../lib/config';
import { 
    ArrowUpRight, ArrowDownRight, MessageSquare, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function SocialMediaPerformancePage() {
    const { isLoading: globalIsLoading } = useGlobalData();
    const [config, setConfigState] = useState(() => getConfig());

    // Filter states — same as original dashboard
    const [socialPrimaryMonth, setSocialPrimaryMonth] = useState('All');
    const [socialPrimaryWeek, setSocialPrimaryWeek] = useState('All');
    const [socialSecondaryMonth, setSocialSecondaryMonth] = useState('All');
    const [socialSecondaryWeek, setSocialSecondaryWeek] = useState('All');

    useEffect(() => {
        setConfigState(getConfig());
    }, [globalIsLoading]);

    // --- Same helpers as original dashboard ---
    const normalizeMonth = (m: string) => {
        if (!m || typeof m !== 'string') return m;
        if (m.includes('T')) return m.split('T')[0];
        if (m.includes(' ') && (m.includes('-') || m.includes('/'))) return m.split(' ')[0];
        return m;
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

    const data = config.biData;

    const socialsData = data?.socials || [];
    const uniqueMonths = ['All', ...Array.from(new Set(socialsData.map((d: any) => normalizeMonth(d.month)).filter(Boolean)))];
    const uniqueWeeks = ['All', ...Array.from(new Set(socialsData.map((d: any) => d.week).filter(Boolean)))];

    // Auto-fill filters based on available data — exact same logic as original dashboard
    useEffect(() => {
        if (socialsData.length > 0 && socialPrimaryMonth === 'All') {
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
    }, [data]);

    // --- DATA TRANSFORMS FOR B2C SOCIALS — exact same as original dashboard ---
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
        <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner text-white">
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">Social Media Performance</h1>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Growth Comparison</p>
                        </div>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
                        <ArrowLeft size={14} /> Back to BI
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto py-12 px-6">
                {/* Exact same layout as original dashboard B2C Social tab */}
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
            </div>
        </main>
    );
}
