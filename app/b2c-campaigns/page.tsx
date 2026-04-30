'use client';
import { useState, useEffect } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import { Plus, Edit2, Trash2, X, Target, Loader2, Check, ArrowLeft, Wallet, TrendingDown } from 'lucide-react';
import Link from 'next/link';

const BI_EDIT_CONFIG: Record<string, any> = {
  campaigns: {
    title: 'Campaign',
    empty: { name: '', period: '', leads: 0, conversion: 0, status: 'Active' },
    fields: [
      { key: 'name', label: 'Campaign Name', type: 'text' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'Q2 2026' },
      { key: 'leads', label: 'Leads Count', type: 'number' },
      { key: 'conversion', label: 'Conversion (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Planned'] },
    ],
  },
  budget: {
    title: 'Budget Item',
    empty: { category: 'Operational', amount: 0, date: '', description: '' },
    fields: [
      { key: 'category', label: 'Category', type: 'select', options: ['Ads Spend', 'Event', 'Operational', 'Software', 'Other'] },
      { key: 'amount', label: 'Amount (Rp)', type: 'number' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
};

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const EditModal = ({ isOpen, onClose, onSave, title, fields, data, onChange }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {fields.map((f: any) => (
            <div key={f.key}>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">{f.label}</label>
              {f.type === 'select' ? (
                <select value={data?.[f.key] || ''} onChange={e => onChange(f.key, e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none">
                  <option value="" disabled>Select {f.label}</option>
                  {f.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder || ''} value={data?.[f.key] ?? (f.type === 'number' ? 0 : '')} onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-zinc-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition">Cancel</button>
          <button onClick={onSave} className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default function B2CCampaignsPage() {
  const { isLoading: globalIsLoading, syncData } = useGlobalData();
  const [config, setConfigState] = useState(() => getConfig());
  const [b2cPeriod, setB2cPeriod] = useState('All');
  
  const [editModal, setEditModal] = useState<{ section: string; index: number; data: any } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Re-read config when global data finishes loading
  useEffect(() => {
    setConfigState(getConfig());
  }, [globalIsLoading]);

  const openEditModal = (section: string, index: number = -1) => {
    const sectionConfig = BI_EDIT_CONFIG[section];
    if (!sectionConfig) return;
    const existingData = index >= 0 ? (config.biData as any)?.[section]?.[index] : null;
    setEditModal({ section, index, data: existingData ? { ...existingData } : { ...sectionConfig.empty } });
  };

  const handleEditField = (key: string, value: any) => {
    setEditModal(prev => prev ? { ...prev, data: { ...prev.data, [key]: value } } : null);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaveStatus('saving');
    const newConfig = JSON.parse(JSON.stringify(config));
    if (!newConfig.biData) newConfig.biData = {};
    if (!newConfig.biData[editModal.section]) newConfig.biData[editModal.section] = [];

    if (editModal.index >= 0) {
      newConfig.biData[editModal.section][editModal.index] = editModal.data;
    } else {
      newConfig.biData[editModal.section].push(editModal.data);
    }

    setConfigState(newConfig);
    setConfigLS(newConfig);
    await saveConfigToSupabase(newConfig);
    await syncData({ silent: true });
    // Re-read config after sync to get fresh data from Supabase
    setConfigState(getConfig());
    setEditModal(null);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const handleDeleteItem = async (section: string, index: number) => {
    if (!confirm('Delete this item?')) return;
    setSaveStatus('saving');
    const newConfig = JSON.parse(JSON.stringify(config));
    if (newConfig.biData?.[section]) {
      newConfig.biData[section].splice(index, 1);
      setConfigState(newConfig);
      setConfigLS(newConfig);
      await saveConfigToSupabase(newConfig);
      await syncData({ silent: true });
      setConfigState(getConfig());
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const campaigns = config.biData?.campaigns || [];
  const uniqueB2cPeriods = ['All', ...Array.from(new Set(campaigns.map((c: any) => c.period).filter(Boolean)))];
  const filteredCampaigns = campaigns.filter((c: any) => b2cPeriod === 'All' || c.period === b2cPeriod);

  // Budget calculations
  const budgetData = config.biData?.budget || [];
  const totalSpent = budgetData.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const maxBudget = (config as any).b2cTotalBudget || 100000000;
  const remaining = maxBudget - totalSpent;
  const budgetUsagePercent = maxBudget > 0 ? Math.min((totalSpent / maxBudget) * 100, 100) : 0;
  const spentByCategory = budgetData.reduce((acc: any, item: any) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {} as Record<string, number>);
  const sortedCategories = Object.entries(spentByCategory).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0">
              <Target className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">B2C Campaigns</h1>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest">Campaigns & Budget Disbursement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link href="/dashboard" className="px-3 sm:px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </Link>
            <button onClick={() => openEditModal('campaigns')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
              <Plus size={12} /> Campaign
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-12">

        {/* === CAMPAIGNS SECTION === */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 pb-4 mb-6 gap-3">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900">Campaign Overview</h3>
            {uniqueB2cPeriods.length > 2 && (
              <select value={b2cPeriod} onChange={(e) => setB2cPeriod(e.target.value)}
                className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none w-full sm:w-auto">
                {uniqueB2cPeriods.map((p: any) => <option key={p} value={p}>{p === 'All' ? 'All Periods' : p}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCampaigns.length === 0 ? (
              <div className="col-span-full text-center p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest">No campaigns for selected period</div>
            ) : filteredCampaigns.map((camp: any, idx: number) => {
              const origIdx = campaigns.indexOf(camp);
              return (
                <div key={idx} className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl transition hover:border-zinc-400 group relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEditModal('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteItem('campaigns', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="font-bold text-zinc-900 text-sm leading-tight pr-8">{camp.name}</h4>
                    <div className={`text-[8px] px-2 py-0.5 font-black uppercase rounded border flex-shrink-0 ${camp.status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : camp.status === 'Planned' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                      {camp.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                    <div><div className="text-[9px] text-zinc-400 uppercase font-bold">Leads</div><div className="text-xl font-black">{(camp.leads || 0).toLocaleString('id-ID')}</div></div>
                    <div className="text-right"><div className="text-[9px] text-zinc-400 uppercase font-bold">Conv. Rate</div><div className="text-xl font-black text-zinc-900">{camp.conversion}%</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* === BUDGET DISBURSEMENT SECTION === */}
        <section className="pt-8 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">Budget Disbursement</h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-widest">Operational Spending Overview</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => {
                const newBudget = prompt('Enter new total budget limit (Rp):', maxBudget.toString());
                if (newBudget && !isNaN(Number(newBudget))) {
                  const newConfig = { ...config, b2cTotalBudget: Number(newBudget) } as any;
                  setConfigState(newConfig);
                  setConfigLS(newConfig);
                  saveConfigToSupabase(newConfig);
                }
              }} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition">
                <Edit2 size={12} /> Set Limit
              </button>
              <button onClick={() => openEditModal('budget')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                <Plus size={12} /> Add Spent
              </button>
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Budget */}
            <div className="bg-zinc-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={48} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Budget Limit</h4>
              <div className="text-xl sm:text-2xl font-black tracking-tighter text-white">{formatIDR(maxBudget)}</div>
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5">
                  <span>USAGE</span>
                  <span className="text-white">{budgetUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${budgetUsagePercent}%` }} />
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown size={48} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Disbursed</h4>
              <div className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-600">{formatIDR(totalSpent)}</div>
              <div className="text-[10px] font-bold text-zinc-400 mt-2">{budgetData.length} transaction{budgetData.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Remaining */}
            <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Remaining</h4>
              <div className={`text-xl sm:text-2xl font-black tracking-tighter ${remaining >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>{formatIDR(remaining)}</div>
              <div className="text-[10px] font-bold text-zinc-400 mt-2">{remaining >= 0 ? 'Available' : 'Over Budget!'}</div>
            </div>

            {/* Top Category */}
            {sortedCategories.length > 0 && (
              <div className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Top Category</h4>
                <div className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-900">{formatIDR(sortedCategories[0][1] as number)}</div>
                <div className="text-[10px] font-bold text-zinc-400 mt-2 uppercase">{sortedCategories[0][0]} • {totalSpent > 0 ? (((sortedCategories[0][1] as number) / totalSpent) * 100).toFixed(1) : 0}%</div>
              </div>
            )}
          </div>

          {/* Category Breakdown (if more than 1 category) */}
          {sortedCategories.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {sortedCategories.map(([cat, amount]: any) => (
                <div key={cat} className="bg-white border border-zinc-100 p-4 rounded-xl hover:border-zinc-300 transition">
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{cat}</div>
                  <div className="text-sm font-black tracking-tight text-zinc-900">{formatIDR(amount)}</div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${totalSpent > 0 ? (amount / totalSpent) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disbursement History Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-4 sm:px-6 py-4">Date</th>
                    <th className="px-4 sm:px-6 py-4">Category</th>
                    <th className="px-4 sm:px-6 py-4 hidden sm:table-cell min-w-[180px]">Description</th>
                    <th className="px-4 sm:px-6 py-4 text-right">Amount</th>
                    <th className="px-3 sm:px-4 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {budgetData.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No spending recorded</td></tr>
                  ) : (
                    budgetData.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime() || 0).map((row: any, idx: number) => {
                      const origIdx = budgetData.indexOf(row);
                      return (
                        <tr key={idx} className="hover:bg-zinc-50 transition group">
                          <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold whitespace-nowrap text-xs sm:text-sm">{formatDate(row.date)}</td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block whitespace-nowrap">{row.category}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5 text-zinc-500 font-medium italic hidden sm:table-cell">{row.description || '-'}</td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-mono font-bold text-zinc-900 text-xs sm:text-sm whitespace-nowrap">{formatIDR(row.amount)}</td>
                          <td className="px-3 sm:px-4 py-4 sm:py-5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => openEditModal('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteItem('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
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
        </section>
      </div>

      <EditModal isOpen={!!editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} title={`${editModal?.index! >= 0 ? 'Edit' : 'Add'} ${BI_EDIT_CONFIG[editModal?.section!]?.title}`} fields={BI_EDIT_CONFIG[editModal?.section!]?.fields || []} data={editModal?.data} onChange={handleEditField} />

      {saveStatus !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className={`px-5 py-3 rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${saveStatus === 'saving' ? 'bg-zinc-900 text-white' : 'bg-emerald-500 text-white'}`}>
            {saveStatus === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Saved!</>}
          </div>
        </div>
      )}
    </main>
  );
}
