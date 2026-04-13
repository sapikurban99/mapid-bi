import { SiteConfig } from '../../lib/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function WorkloadStats({ config }: { config: SiteConfig }) {
    if (!config.pseWorkloads || config.pseWorkloads.length === 0) {
        return (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-500 font-bold tracking-wide">
                No Workload Data Found
            </div>
        );
    }

    // Prepare chart data format
    const chartData = config.pseWorkloads.map(p => ({
        name: p.name,
        Projects: p.activeProjects * 3, // Weight 3
        Leads: p.activeLeads * 1, // Weight 1
        Partners: p.activePartners * 1, // Weight 1
        Total: p.totalPoints,
        Max: p.maxCapacity,
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Cumulative Workload vs Capacity */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-black text-lg mb-1">Total Capacity vs Workload</h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Cumulative Points</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600, fill: '#3f3f46' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontWeight: 'bold', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Bar dataKey="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} name="Total Workload Pts" />
                                <ReferenceLine x={15} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Max Cap (15)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Stacked Breakdown */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6">
                    <h3 className="font-black text-lg mb-1">Workload Composition</h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Breakdown by task</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600, fill: '#3f3f46' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', fontWeight: 'bold', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Bar dataKey="Projects" stackId="a" fill="#10b981" name="Projects (x3)" />
                                <Bar dataKey="Leads" stackId="a" fill="#f59e0b" name="Leads (x1)" />
                                <Bar dataKey="Partners" stackId="a" fill="#8b5cf6" name="Partners (x1)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden rounded-3xl">
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="font-black text-lg">Detailed Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-[10px] uppercase font-black tracking-wider text-zinc-500 bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4">PSE Name</th>
                                <th className="px-6 py-4 text-center">Projects</th>
                                <th className="px-6 py-4 text-center">Leads</th>
                                <th className="px-6 py-4 text-center">Partners</th>
                                <th className="px-6 py-4 text-center">Total Points</th>
                                <th className="px-6 py-4 w-48">Load %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {config.pseWorkloads.map(pse => (
                                <tr key={pse.pseId} className="hover:bg-zinc-50/50 transition duration-150">
                                    <td className="px-6 py-4 font-bold text-zinc-900">{pse.name}</td>
                                    <td className="px-6 py-4 text-center font-medium">{pse.activeProjects}</td>
                                    <td className="px-6 py-4 text-center font-medium">{pse.activeLeads}</td>
                                    <td className="px-6 py-4 text-center font-medium">{pse.activePartners}</td>
                                    <td className="px-6 py-4 text-center font-black text-blue-600">{pse.totalPoints} <span className="text-[10px] text-zinc-400 font-medium ml-1">/ {pse.maxCapacity}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${pse.loadPercentage > 100 ? 'bg-red-500' : pse.loadPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pse.loadPercentage, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-zinc-700 w-10 text-right">{pse.loadPercentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
