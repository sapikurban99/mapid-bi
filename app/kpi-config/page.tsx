'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const fetcher = async () => {
    const { data, error } = await supabase.from('kpi_configs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export default function KpiConfigPage() {
    const { data: configs, error, isLoading } = useSWR('kpi_configs', fetcher);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        role: 'B2C',
        kpi_name: '',
        owner_name: '', 
        type: 'Outcome',
        actual_value: 0,
        calculation_type: 'sum',
        owner_type: 'role',
        target_value: 0,
        threshold_green: 80,
        threshold_yellow: 60,
        threshold_red: 0,
        is_percentage: false
    });

    const roles = ['B2C', 'Sales', 'PSE'];
    const types = ['Outcome', 'Process', 'Guardrail'];
    const calcTypes = ['sum', 'avg', 'ratio', 'count'];
    const ownerTypes = ['role', 'individual'];

    // TEAM MEMBERS LIST
    const teamMembers = {
        'B2C': ['Wina', 'Annisa', 'Fariz', 'Dwi'],
        'Sales': ['Rani', 'Titan', 'Andrew'],
        'PSE': ['Zhafran', 'Lossa', 'Amel']
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            // Include owner name in the title for manual tracking
            const finalKpiName = formData.owner_type === 'individual' && formData.owner_name
                ? `${formData.kpi_name} (${formData.owner_name})`
                : formData.kpi_name;

            // DO NOT include owner_name in payload to avoid schema cache errors
            // We store the name inside the kpi_name instead.
            const payload: any = {
                role: formData.role,
                kpi_name: finalKpiName,
                type: formData.type,
                data_key: `manual:${formData.actual_value}`,
                calculation_type: formData.calculation_type,
                owner_type: formData.owner_type,
                target_value: formData.target_value,
                threshold_green: formData.threshold_green,
                threshold_yellow: formData.threshold_yellow,
                threshold_red: formData.threshold_red,
                is_percentage: formData.is_percentage,
                updated_at: new Date().toISOString()
            };

            if (editingId) {
                const { error } = await supabase
                    .from('kpi_configs')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                setMessage({ type: 'success', text: 'KPI updated successfully!' });
            } else {
                const { error } = await supabase
                    .from('kpi_configs')
                    .insert([payload]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'KPI added successfully!' });
            }

            mutate('kpi_configs');
            setIsAdding(false);
            setEditingId(null);
            setFormData({
                role: 'B2C',
                kpi_name: '',
                owner_name: '',
                type: 'Outcome',
                actual_value: 0,
                calculation_type: 'sum',
                owner_type: 'role',
                target_value: 0,
                threshold_green: 80,
                threshold_yellow: 60,
                threshold_red: 0,
                is_percentage: false
            });

        } catch (err: any) {
            console.error('Save Error:', err);
            setMessage({ type: 'error', text: err.message || 'Check database connection or schema.' });
        }
    };

    const handleEdit = (config: any) => {
        let actual = 0;
        if (config.data_key && config.data_key.startsWith('manual:')) {
            actual = Number(config.data_key.replace('manual:', '')) || 0;
        }

        // Clean name and extract owner from brackets if present
        let cleanName = config.kpi_name;
        let oName = '';
        
        if (cleanName.includes('(')) {
            const match = cleanName.match(/\(([^)]+)\)/);
            if (match) {
                oName = match[1];
                cleanName = cleanName.replace(` (${oName})`, '');
            }
        }

        setFormData({
            role: config.role,
            kpi_name: cleanName,
            owner_name: oName,
            type: config.type,
            actual_value: actual,
            calculation_type: config.calculation_type || 'sum',
            owner_type: config.owner_type || 'role',
            target_value: config.target_value,
            threshold_green: config.threshold_green,
            threshold_yellow: config.threshold_yellow,
            threshold_red: config.threshold_red,
            is_percentage: config.is_percentage || false
        });

        setEditingId(config.id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;

        try {
            const { error } = await supabase.from('kpi_configs').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'KPI deleted successfully!' });
            mutate('kpi_configs');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">KPI CONFIGURATION</h1>
                    <p className="text-zinc-500 mt-1">Manage performance targets and manually update actual values.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        ADD NEW KPI
                    </button>
                )}
            </header>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium text-xs">{message.text}</span>
                </div>
            )}

            {isAdding && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-10 shadow-xl shadow-zinc-200/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-zinc-900">{editingId ? 'Edit KPI' : 'Add New KPI'}</h2>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-zinc-400 hover:text-zinc-600 transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-900">Role Group</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-900 font-bold"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-900">Owner Type</label>
                            <select
                                value={formData.owner_type}
                                onChange={(e) => setFormData({ ...formData, owner_type: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-900 font-bold"
                            >
                                {ownerTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {formData.owner_type === 'individual' && (
                            <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                                <label className="text-xs font-black uppercase tracking-widest text-blue-600">Assign to Member</label>
                                <select
                                    value={formData.owner_name}
                                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                    required
                                    className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-blue-900 font-bold"
                                >
                                    <option value="">Select Member...</option>
                                    {teamMembers[formData.role as keyof typeof teamMembers]?.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-900">KPI Name</label>
                            <input
                                type="text"
                                value={formData.kpi_name}
                                onChange={(e) => setFormData({ ...formData, kpi_name: e.target.value })}
                                placeholder="e.g. Win Rate"
                                required
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-900 font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-blue-600">Actual Performance Value</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.actual_value}
                                onChange={(e) => setFormData({ ...formData, actual_value: Number(e.target.value) })}
                                placeholder="Input current performance here"
                                required
                                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-blue-900 font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-900">Target Value</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-900 font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-900">KPI Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-900 font-bold"
                            >
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="is_percentage"
                                checked={formData.is_percentage}
                                onChange={(e) => setFormData({ ...formData, is_percentage: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="is_percentage" className="text-xs font-black uppercase tracking-widest text-zinc-900 cursor-pointer">Format as Percentage (%)</label>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-100">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-emerald-500">Green Threshold (Min %)</label>
                                <input
                                    type="number"
                                    value={formData.threshold_green}
                                    onChange={(e) => setFormData({ ...formData, threshold_green: Number(e.target.value) })}
                                    className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-emerald-900 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-amber-500">Yellow Threshold (Min %)</label>
                                <input
                                    type="number"
                                    value={formData.threshold_yellow}
                                    onChange={(e) => setFormData({ ...formData, threshold_yellow: Number(e.target.value) })}
                                    className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-amber-900 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-rose-500">Red Threshold (Min %)</label>
                                <input
                                    type="number"
                                    value={formData.threshold_red}
                                    onChange={(e) => setFormData({ ...formData, threshold_red: Number(e.target.value) })}
                                    className="w-full bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition text-rose-900 font-bold"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingId(null); }}
                                className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition"
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/20"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'UPDATE KPI' : 'SAVE KPI'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900">Role</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900">KPI Name</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900 text-right">Actual</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900 text-right">Target</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900 text-center">Thresholds</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-900 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-400 italic">Loading configurations...</td></tr>
                        ) : configs?.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-400 italic">No KPIs configured yet.</td></tr>
                        ) : (
                            configs?.map((config: any) => {
                                const actual = config.data_key?.startsWith('manual:')
                                    ? config.data_key.replace('manual:', '')
                                    : '0';

                                return (
                                    <tr key={config.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                config.role === 'B2C' ? 'bg-blue-100 text-blue-700' :
                                                config.role === 'Sales' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {config.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-zinc-900">{config.kpi_name}</div>
                                            <div className="text-[10px] text-zinc-500">{config.owner_type.toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                                            {Number(actual).toLocaleString()}{config.is_percentage ? '%' : ''}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-zinc-900">
                                            {config.target_value.toLocaleString()}{config.is_percentage ? '%' : ''}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-1">
                                                <span className="w-8 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">{config.threshold_green}%</span>
                                                <span className="w-8 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">{config.threshold_yellow}%</span>
                                                <span className="w-8 py-1 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">{config.threshold_red}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(config)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(config.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
