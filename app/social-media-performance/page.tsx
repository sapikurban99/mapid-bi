'use client';
import { useState, useEffect, useMemo } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig } from '../lib/config';
import {
    ArrowUpRight, ArrowDownRight, MessageSquare, ArrowLeft,
    TrendingUp, Users, Eye, Heart, Share2, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import {
    ResponsiveContainer, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip,
    AreaChart, Area
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
    instagram: '#E1306C',
    tiktok: '#010101',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    youtube: '#FF0000',
    linkedin: '#0A66C2',
    threads: '#000000',
    default: '#6366F1',
};

const getPlatformColor = (platform: string) => {
    const key = Object.keys(PLATFORM_COLORS).find(k =>
        platform.toLowerCase().includes(k)
    );
    return PLATFORM_COLORS[key || 'default'];
};

const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Heart size={16} />;
    if (p.includes('tiktok')) return <BarChart3 size={16} />;
    if (p.includes('facebook')) return <Users size={16} />;
    if (p.includes('twitter')) return <Share2 size={16} />;
    if (p.includes('youtube')) return <Eye size={16} />;
    if (p.includes('linkedin')) return <TrendingUp size={16} />;
    return <MessageSquare size={16} />;
};

const toTimestamp = (val: any): number => {
    if (!val) return 0;
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
};

// The real per-snapshot timestamp lives in `month` (an ISO date string in the DB).
// `created_at` is just the bulk-import date, so fall back to it only when month is unparseable.
const recordDate = (d: any) => {
    if (d.month && !isNaN(new Date(d.month).getTime())) return d.month;
    return d.created_at || d.month || '';
};

const formatDayLabel = (val: any) => {
    const ts = toTimestamp(val);
    if (!ts) return String(val ?? '');
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(ts));
};

const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-');
    if (!y || !m) return key;
    return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(Number(y), Number(m) - 1));
};

const dayKey = (val: any): string => {
    const ts = toTimestamp(val);
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const monthKey = (val: any): string => {
    const ts = toTimestamp(val);
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

type Mode = 'daily' | 'monthly';

export default function SocialMediaPerformancePage() {
    const { isLoading: globalIsLoading } = useGlobalData();
    const [config, setConfigState] = useState(() => getConfig());

    const [activePlatform, setActivePlatform] = useState<string>('');
    const [activeMetric, setActiveMetric] = useState<string>('');
    const [mode, setMode] = useState<Mode>('daily');

    useEffect(() => {
        setConfigState(getConfig());
    }, [globalIsLoading]);

    const socialsData = config.biData?.socials || [];

    const platforms = useMemo(() =>
        Array.from(new Set(socialsData.map((d: any) => d.platform))).filter(Boolean),
        [socialsData]
    );

    const metricsForPlatform = useMemo(() =>
        Array.from(new Set(
            socialsData.filter((d: any) => d.platform === activePlatform).map((d: any) => d.metric)
        )).filter(Boolean),
        [socialsData, activePlatform]
    );

    useEffect(() => {
        if (platforms.length > 0 && !platforms.includes(activePlatform)) {
            setActivePlatform(platforms[0]);
        }
    }, [platforms, activePlatform]);

    useEffect(() => {
        if (metricsForPlatform.length > 0 && !metricsForPlatform.includes(activeMetric)) {
            // Default to a followers-like metric when available.
            const preferred = metricsForPlatform.find((m: any) => String(m).toLowerCase().includes('follow'));
            setActiveMetric(preferred || metricsForPlatform[0]);
        }
    }, [metricsForPlatform, activeMetric]);

    // Snapshot series: one point per period, showing the followers value AT that time,
    // ordered by created_at. For a period with multiple scrapes, keep the latest snapshot.
    const series = useMemo(() => {
        if (!activePlatform || !activeMetric) return [];

        const rows = socialsData.filter((d: any) =>
            d.platform === activePlatform && d.metric === activeMetric
        );

        const buckets = new Map<string, { value: number; ts: number; date: any }>();
        rows.forEach((d: any) => {
            const date = recordDate(d);
            const ts = toTimestamp(date);
            const key = mode === 'daily' ? dayKey(date) : monthKey(date);
            if (!key) return;
            const value = Number(d.value) || 0;
            const existing = buckets.get(key);
            if (!existing || ts >= existing.ts) {
                buckets.set(key, { value, ts, date });
            }
        });

        return Array.from(buckets.entries())
            .map(([key, b]) => ({
                key,
                label: mode === 'daily' ? formatDayLabel(b.date) : formatMonthLabel(key),
                value: b.value,
                ts: b.ts,
            }))
            .sort((a, b) => a.ts - b.ts);
    }, [socialsData, activePlatform, activeMetric, mode]);

    // KPI summary per metric: latest snapshot value + change vs previous snapshot point.
    const kpis = useMemo(() => {
        return metricsForPlatform.map((metric, i) => {
            const rows = socialsData
                .filter((d: any) => d.platform === activePlatform && d.metric === metric)
                .map((d: any) => ({ value: Number(d.value) || 0, ts: toTimestamp(recordDate(d)) }))
                .sort((a: any, b: any) => a.ts - b.ts);

            const latest = rows.length ? rows[rows.length - 1].value : 0;
            const prev = rows.length > 1 ? rows[rows.length - 2].value : 0;
            const colors = [
                'bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600',
                'bg-violet-50 text-violet-600', 'bg-amber-50 text-amber-600',
                'bg-rose-50 text-rose-600', 'bg-cyan-50 text-cyan-600',
            ];
            const icons = [<TrendingUp size={16} />, <Users size={16} />, <Eye size={16} />, <Heart size={16} />, <Share2 size={16} />, <BarChart3 size={16} />];
            return {
                metric,
                value: latest,
                prev,
                color: colors[i % colors.length],
                icon: icons[i % icons.length],
            };
        }).filter((k: any) => k.value > 0 || k.prev > 0);
    }, [socialsData, activePlatform, metricsForPlatform]);

    // Detailed table rows for the selected metric, newest first.
    const tableRows = useMemo(() => {
        return series
            .map((p, i) => {
                const prev = i > 0 ? series[i - 1].value : null;
                const change = prev === null ? null : p.value - prev;
                return { label: p.label, value: p.value, change };
            })
            .reverse();
    }, [series]);

    const color = activePlatform ? getPlatformColor(activePlatform) : PLATFORM_COLORS.default;

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
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Platform Analytics Dashboard</p>
                        </div>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
                        <ArrowLeft size={14} /> Back to BI
                    </Link>
                </div>
            </header>

            <div className="max-w-screen-xl mx-auto py-8 px-6 space-y-8">
                {/* Platform Tabs */}
                {platforms.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {platforms.map(platform => {
                            const isActive = activePlatform === platform;
                            const c = getPlatformColor(platform);
                            return (
                                <button key={platform} onClick={() => setActivePlatform(platform)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'text-white shadow-lg scale-[1.02]'
                                            : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                    }`}
                                    style={isActive ? { backgroundColor: c } : {}}>
                                    {getPlatformIcon(platform)}
                                    {platform}
                                </button>
                            );
                        })}
                    </div>
                )}

                {activePlatform && (
                    <div className="space-y-8">
                        {/* KPI Cards — latest snapshot per metric */}
                        {kpis.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    {activePlatform} — Latest Snapshot
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {kpis.map((kpi, i) => {
                                        const change = kpi.prev > 0
                                            ? ((kpi.value - kpi.prev) / kpi.prev * 100).toFixed(1)
                                            : kpi.value > 0 ? '100.0' : '0.0';
                                        const isUp = kpi.value > kpi.prev;
                                        const isDown = kpi.value < kpi.prev;
                                        return (
                                            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                                                    {kpi.icon}
                                                </div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 truncate">{kpi.metric}</p>
                                                <p className="text-xl font-black">{kpi.value.toLocaleString()}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    {isUp ? <ArrowUpRight size={12} className="text-emerald-500" /> :
                                                        isDown ? <ArrowDownRight size={12} className="text-rose-500" /> :
                                                            <div className="w-3 h-3 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /></div>}
                                                    <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-zinc-400'}`}>
                                                        {isUp ? '+' : ''}{change}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Followers-over-time chart */}
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                        {activeMetric || 'Metric'} Over Time — {activePlatform}
                                    </h4>
                                    <p className="text-[10px] font-bold text-zinc-400 mt-1">
                                        Snapshot value per {mode === 'daily' ? 'day' : 'month'}, ordered by created date
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {metricsForPlatform.length > 1 && (
                                        <select value={activeMetric} onChange={(e) => setActiveMetric(e.target.value)}
                                            className="bg-zinc-50 border text-xs text-zinc-900 border-zinc-200 font-bold p-2 rounded-lg outline-none cursor-pointer">
                                            {metricsForPlatform.map((m: any) => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    )}
                                    <div className="flex bg-zinc-100 rounded-lg p-1">
                                        {(['daily', 'monthly'] as Mode[]).map(m => (
                                            <button key={m} onClick={() => setMode(m)}
                                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition ${
                                                    mode === m ? 'bg-white shadow text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                                                }`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {series.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="grad-series" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                                            <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} angle={-40} textAnchor="end" height={70} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 700 }} domain={['auto', 'auto']} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 700 }}
                                                formatter={(value: any) => [Number(value).toLocaleString(), activeMetric]}
                                            />
                                            <Area type="monotone" dataKey="value" stroke={color}
                                                fill="url(#grad-series)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex items-center justify-center text-zinc-400 font-bold text-xs uppercase tracking-widest">
                                    No data for {activeMetric || 'this metric'}
                                </div>
                            )}
                        </div>

                        {/* Detailed table — newest first */}
                        {tableRows.length > 0 && (
                            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-zinc-100">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                        {activePlatform} — {activeMetric} ({mode})
                                    </h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">{mode === 'daily' ? 'Date' : 'Month'}</th>
                                                <th className="px-6 py-4 text-right">{activeMetric}</th>
                                                <th className="px-6 py-4 text-right">Change vs Prev.</th>
                                                <th className="px-6 py-4 text-center">Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {tableRows.map((row, idx) => {
                                                const isUp = row.change !== null && row.change > 0;
                                                const isDown = row.change !== null && row.change < 0;
                                                return (
                                                    <tr key={idx} className="hover:bg-zinc-50 transition">
                                                        <td className="px-6 py-4 font-bold whitespace-nowrap">{row.label}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-zinc-900 font-bold text-lg">{row.value.toLocaleString()}</td>
                                                        <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-zinc-400'}`}>
                                                            {row.change === null ? '—' : `${row.change > 0 ? '+' : ''}${row.change.toLocaleString()}`}
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
                )}

                {platforms.length === 0 && !globalIsLoading && (
                    <div className="text-center p-12 bg-white border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest">
                        No social media data available
                    </div>
                )}
            </div>
        </main>
    );
}
