'use client';
import { useState, useEffect } from 'react';
import { useGlobalData } from '../components/GlobalDataProvider';
import { getConfig, setConfig as setConfigLS, saveConfigToSupabase } from '../lib/config';
import { Plus, Edit2, Trash2, X, FolderOpen, TableProperties, FileText, ArrowRight, Loader2, Check, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

const BI_EDIT_CONFIG: Record<string, any> = {
  docs: {
    title: 'Document / Asset',
    empty: { title: '', desc: '', category: '', format: 'File', link: '', team: '' },
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'desc', label: 'Description', type: 'text' },
      { key: 'team', label: 'Team', type: 'select', options: ['B2B', 'B2C', 'PSE'] },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'format', label: 'Format', type: 'select', options: ['Folder', 'Sheet', 'File'] },
      { key: 'link', label: 'URL Link', type: 'text' },
    ],
  },
};

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
                <input type={f.type === 'number' ? 'number' : 'text'} value={data?.[f.key] ?? (f.type === 'number' ? 0 : '')} onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
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

export default function GalleryConfigPage() {
  const { isLoading: globalIsLoading, syncData } = useGlobalData();
  const [config, setConfigState] = useState(() => getConfig());
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  
  const [editModal, setEditModal] = useState<{ section: string; index: number; data: any } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
    syncData({ silent: true });
    setEditModal(null);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const handleDeleteItem = async (section: string, index: number) => {
    if (!confirm('Delete this item?')) return;
    const newConfig = JSON.parse(JSON.stringify(config));
    if (newConfig.biData?.[section]) {
      newConfig.biData[section].splice(index, 1);
      setConfigState(newConfig);
      setConfigLS(newConfig);
      await saveConfigToSupabase(newConfig);
      syncData({ silent: true });
    }
  };

  const docsData = config.biData?.docs || [];
  const uniqueGalleryCategories = ['All', ...Array.from(new Set(docsData.map((d: any) => d.category).filter(Boolean)))];

  const filteredDocs = docsData.filter((d: any) =>
    (galleryCategory === 'All' || d.category === galleryCategory) &&
    (teamFilter === 'All' || d.team === teamFilter)
  );

  return (
    <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <ImageIcon className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900">Gallery & Assets</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Knowledge Base Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <ArrowLeft size={14} /> Back to BI
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Team Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {['All', 'B2B', 'B2C', 'PSE'].map(t => (
            <button key={t} onClick={() => setTeamFilter(t)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all whitespace-nowrap ${teamFilter === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>
              {t === 'All' ? 'All Teams' : t}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Knowledge Base & Assets</h3>
          <div className="flex gap-3 items-center">
            <button onClick={() => openEditModal('docs')} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
              <Plus size={12} /> Add
            </button>
            <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)}
              className="bg-white border text-xs text-zinc-500 border-zinc-200 font-bold p-2 px-3 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none">
              {uniqueGalleryCategories.map((c: any) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc: any, idx: number) => {
            const isLinkValid = doc.link && doc.link !== '#';
            const origIdx = docsData.indexOf(doc);
            return (
              <div key={idx} className="group bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col justify-between transition-all relative hover:border-zinc-400">
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                  <button onClick={(e) => { e.preventDefault(); openEditModal('docs', origIdx); }} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.preventDefault(); handleDeleteItem('docs', origIdx); }} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                </div>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="p-3 bg-zinc-50 rounded-xl group-hover:bg-zinc-100 transition text-zinc-900">
                      {doc.format === 'Folder' ? <FolderOpen size={24} /> : doc.format === 'Sheet' ? <TableProperties size={24} /> : <FileText size={24} />}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      {doc.team && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-900 text-white">{doc.team}</span>}
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">{doc.category}</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-black tracking-tight mb-2 leading-tight">{doc.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-8 line-clamp-2 italic">{doc.desc}</p>
                </div>
                <a href={isLinkValid ? doc.link : undefined} target="_blank" rel="noopener noreferrer"
                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition ${isLinkValid ? 'text-zinc-900 hover:underline cursor-pointer' : 'text-zinc-300 cursor-not-allowed'}`}>
                  {isLinkValid ? 'Go to Content' : 'Link not ready'} {isLinkValid && <ArrowRight size={14} />}
                </a>
              </div>
            );
          })}
        </div>
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
