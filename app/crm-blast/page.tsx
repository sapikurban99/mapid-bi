'use client';

import { useState, useRef, useMemo } from 'react';
import useSWR from 'swr';
import * as XLSX from 'xlsx';
import { Loader2, Upload, Send, Trash2, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Users, Search, History, SendHorizontal, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

const apiFetcher = async (url: string) => {
  const r = await fetch(url);
  const contentType = r.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return r.json();
  }
  const text = await r.text();
  console.error('API Error (Not JSON):', text);
  throw new Error(`API returned ${r.status} ${r.statusText}. Expected JSON but got ${contentType}.`);
};

export default function CRMBlastPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadedContacts, setUploadedContacts] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contactsResponse, mutate } = useSWR('/api/bi/wa-blast', apiFetcher);
  const allContacts = contactsResponse?.data || [];

  const groups = useMemo(() => {
    const groupMap = new Map();
    allContacts.forEach((c: any) => {
      if (!groupMap.has(c.group_name)) {
        groupMap.set(c.group_name, { name: c.group_name, count: 0, status: c.status, createdAt: c.created_at });
      }
      groupMap.get(c.group_name).count++;
    });
    return Array.from(groupMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allContacts]);

  const filteredContacts = useMemo(() => {
    let filtered = allContacts;
    if (selectedGroup) filtered = filtered.filter((c: any) => c.group_name === selectedGroup);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((c: any) => c.name.toLowerCase().includes(s) || c.phone_number.includes(searchTerm));
    }
    return filtered;
  }, [allContacts, selectedGroup, searchTerm]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Try parsing with headers first
        const dataWithHeaders: any[] = XLSX.utils.sheet_to_json(ws);
        let mapped = dataWithHeaders.map((item: any) => ({
          name: item.name || item.Name || item.Nama || item.nama || '',
          phone_number: String(item.wa_number || item.wa || item.whatsapp || item.phone || item.no_wa || item['No WA'] || item.Number || item.number || '')
        })).filter(item => item.name && item.phone_number);

        // Fallback: If no mapped data found, try parsing as raw array (no headers)
        // and assume first column is Name, second is Phone
        if (mapped.length === 0) {
          const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          mapped = rawData.map((row: any[]) => ({
            name: String(row[0] || '').trim(),
            phone_number: String(row[1] || '').trim()
          })).filter(item => item.name && item.phone_number && /^\d+$/.test(item.phone_number.replace(/\D/g, '')));
        }

        if (mapped.length === 0) {
           alert('Could not find any valid contacts. Please ensure your file has Name in the first column and Phone in the second column.');
        }

        setUploadedContacts(mapped);
        if (!groupName) {
          const now = new Date();
          setGroupName(`Blast-${now.toLocaleDateString()}-${now.getHours()}:${now.getMinutes()}`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Failed to parse file. Please ensure it is a valid Excel or CSV.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveToSupabase = async () => {
    if (!groupName || uploadedContacts.length === 0) { alert('Please provide a group name and upload contacts.'); return; }
    setIsUploading(true);
    try {
      const res = await fetch('/api/bi/wa-blast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', contacts: uploadedContacts.map(c => ({ ...c, group_name: groupName, image_url: imageUrl, status: 'pending' })) })
      });
      const result = await res.json();
      if (result.success) { mutate(); setUploadedContacts([]); setGroupName(''); alert('Contacts saved!'); }
      else throw new Error(result.message);
    } catch (error: any) { alert('Error: ' + error.message); }
    finally { setIsUploading(false); }
  };

  const handleSendBlast = async (gName: string) => {
    if (!blastMessage) { alert('Please enter a blast message first.'); return; }
    if (!confirm(`Send blast to group "${gName}"?`)) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/bi/wa-blast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', groupName: gName, message: blastMessage, imageUrl })
      });
      const result = await res.json();
      if (result.success) { mutate(); alert('Blast triggered successfully!'); }
      else throw new Error(result.message);
    } catch (error: any) { alert('Error: ' + error.message); }
    finally { setIsSending(false); }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] font-sans pb-24 text-zinc-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center"><SendHorizontal className="text-white" size={18} /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight">CRM Blast Manager</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">WhatsApp Business Blast Hub</p>
            </div>
          </div>
          <Link href="/crm-wa" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition">WA CRM</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Upload + Message + BLAST BUTTON */}
          <div className="lg:col-span-5 space-y-6">

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                <Upload className="text-zinc-400" size={18} />
                <h3 className="font-black text-lg">1. Upload Contacts</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Group Name</label>
                <input type="text" placeholder="e.g. Campaign-May-2026" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>
              <div onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all"><FileSpreadsheet size={20} /></div>
                <p className="text-sm font-black">Click to upload Excel / CSV</p>
              </div>

              {/* PREVIEW uploaded data */}
              {uploadedContacts.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={16} />
                    <span className="text-sm font-black text-emerald-700">{uploadedContacts.length} Contacts Parsed</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-emerald-200/50 rounded-xl bg-white/60">
                    <table className="w-full text-[11px] text-left">
                      <thead className="sticky top-0 bg-emerald-100/80">
                        <tr><th className="px-3 py-1.5 font-black text-emerald-700">Name</th><th className="px-3 py-1.5 font-black text-emerald-700">Phone</th></tr>
                      </thead>
                      <tbody>
                        {uploadedContacts.slice(0, 15).map((c, i) => (
                          <tr key={i} className="border-t border-emerald-50">
                            <td className="px-3 py-1 font-bold text-emerald-800">{c.name}</td>
                            <td className="px-3 py-1 font-mono text-emerald-600 text-[10px]">{c.phone_number}</td>
                          </tr>
                        ))}
                        {uploadedContacts.length > 15 && (
                          <tr><td colSpan={2} className="px-3 py-1 text-center text-[9px] font-bold text-emerald-400 italic">+ {uploadedContacts.length - 15} more...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={handleSaveToSupabase} disabled={isUploading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2">
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Save to Supabase</>}
                  </button>
                </div>
              )}
            </div>

            {/* Message + Image + BLAST BUTTON */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">2. Compose Message</h3>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium focus:bg-white/10 outline-none placeholder:text-zinc-600" />
                </div>
                {imageUrl && (
                  <div className="mt-3 space-y-2">
                    <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e: any) => e.target.src = 'https://placehold.co/600x400?text=Invalid+URL'} />
                    </div>
                    <button onClick={() => setImageUrl('')} className="text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                  </div>
                )}
              </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Blast Message</label>
                  <textarea rows={5} value={blastMessage} onChange={(e) => setBlastMessage(e.target.value)} 
                    placeholder="Halo {name}, ini pesan dari MAPID..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium focus:bg-white/10 outline-none placeholder:text-zinc-600" />
                </div>

                {/* Personalized Preview */}
                {blastMessage && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-1">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2">Personalized Preview</label>
                    <p className="text-xs text-emerald-100 leading-relaxed italic whitespace-pre-wrap">
                      "{blastMessage.replace(/{name}/g, (selectedGroup && filteredContacts[0]?.name) || 'Pelanggan')}"
                    </p>
                    <p className="text-[8px] font-bold text-emerald-500/60 mt-2 uppercase tracking-widest">
                      * {selectedGroup ? `Previewing for "${filteredContacts[0]?.name || 'Unknown'}"` : 'Previewing with default name'}
                    </p>
                  </div>
                )}

              {/* TARGET GROUP SELECTOR */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">3. Select Target Group</label>
                <select value={selectedGroup || ''} onChange={(e) => setSelectedGroup(e.target.value || null)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none">
                  <option value="" className="text-zinc-900">-- Select a group --</option>
                  {groups.map(g => <option key={g.name} value={g.name} className="text-zinc-900">{g.name} ({g.count} contacts)</option>)}
                </select>
              </div>

              {/* ===== THE BIG BLAST BUTTON ===== */}
              <button
                onClick={() => { if (selectedGroup) handleSendBlast(selectedGroup); else alert('Please select a target group first.'); }}
                disabled={isSending || !blastMessage}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                  blastMessage && selectedGroup
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                    : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {isSending ? 'Sending...' : 'Send Blast Now'}
              </button>
              <p className="text-[10px] font-bold text-zinc-600 italic text-center">
                {!blastMessage && !selectedGroup ? 'Fill message & select group to enable' :
                 !blastMessage ? 'Write a message to enable' :
                 !selectedGroup ? 'Select a target group to enable' :
                 `Ready to blast ${groups.find(g => g.name === selectedGroup)?.count || 0} contacts`}
              </p>
            </div>
          </div>

          {/* RIGHT: Stats + History + Contact Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Contacts</p>
                <h4 className="text-2xl font-black">{allContacts.length}</h4>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Groups</p>
                <h4 className="text-2xl font-black">{groups.length}</h4>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Sent</p>
                <h4 className="text-2xl font-black">{groups.filter(g => g.status === 'sent').length}</h4>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between gap-3">
                <div className="flex items-center gap-3">
                  <History className="text-zinc-400" size={18} />
                  <h3 className="font-black text-lg">Blast Groups</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-zinc-900 outline-none" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-zinc-50/50">
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Group</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Contacts</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-50">
                    {groups.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-zinc-300"><Users size={32} /><p className="text-sm font-bold">No groups yet</p></div>
                      </td></tr>
                    ) : groups.map((group, idx) => (
                      <tr key={idx} className={`hover:bg-zinc-50 transition-colors cursor-pointer ${selectedGroup === group.name ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedGroup(group.name === selectedGroup ? null : group.name)}>
                        <td className="px-5 py-3">
                          <p className="text-sm font-black">{group.name}</p>
                          <p className="text-[9px] font-bold text-zinc-400 mt-0.5">{new Date(group.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-zinc-600">{group.count}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            group.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                            {group.status === 'sent' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} {group.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedGroup(group.name); }}
                            className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-zinc-700 transition flex items-center gap-1.5">
                            <Send size={10} /> Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contact Preview for selected group */}
            {selectedGroup && filteredContacts.length > 0 && (
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="p-5 border-b border-zinc-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-base">Preview: {selectedGroup}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{filteredContacts.length} contacts</p>
                  </div>
                  <button onClick={() => setSelectedGroup(null)} className="p-2 bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg transition"><XCircle size={16} /></button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-zinc-50 z-10"><tr>
                      <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">Name</th>
                      <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">WhatsApp</th>
                      <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredContacts.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          <td className="px-5 py-2 text-sm font-bold">{c.name}</td>
                          <td className="px-5 py-2 text-sm font-mono text-zinc-500">{c.phone_number}</td>
                          <td className="px-5 py-2"><span className={`text-[9px] font-black uppercase ${c.status === 'sent' ? 'text-emerald-500' : 'text-zinc-400'}`}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
