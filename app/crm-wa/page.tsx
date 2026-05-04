'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Download, ArrowLeft, MessageCircle, Trash2, X, Clock } from 'lucide-react';
import Link from 'next/link';

const apiFetcher = (url: string) => fetch(url).then(r => r.json());

const formatResponseTime = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return '-';
  if (ms < 60000) return '< 1m';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
};

export default function CRMPage() {
  const [waCrmStartDate, setWaCrmStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [waCrmEndDate, setWaCrmEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // State for the modal to show conversation history
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  const waCrmUrl = `/api/bi/wa-crm?start_date=${waCrmStartDate}&end_date=${waCrmEndDate}`;
  const { data: waCrmResponse, isLoading: waCrmLoading, mutate } = useSWR(waCrmUrl, apiFetcher);
  const waCrmData = waCrmResponse?.data || [];

  const handleDelete = async (identifier: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch('/api/bi/wa-crm/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: identifier })
      });
      const result = await res.json();
      if (result.success) {
        mutate();
      } else {
        alert('Delete failed: ' + result.message);
      }
    } catch (err: any) {
      alert('Error deleting contact: ' + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 transition-all">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-inner">
              <MessageCircle className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900">WA CRM SalesMAPID</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Conversation Performance & Summary</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <ArrowLeft size={14} /> Back to BI
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="space-y-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h3 className="text-xl font-black tracking-tight leading-tight">Overview</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-2 px-3 border-r border-zinc-100">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">From</span>
                <input type="date" value={waCrmStartDate} onChange={e => setWaCrmStartDate(e.target.value)} 
                  className="text-xs font-bold outline-none bg-transparent" />
              </div>
              <div className="flex items-center gap-2 px-3">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">To</span>
                <input type="date" value={waCrmEndDate} onChange={e => setWaCrmEndDate(e.target.value)} 
                  className="text-xs font-bold outline-none bg-transparent" />
              </div>
              <button 
                onClick={() => {
                  const headers = ['Name', 'Phone', 'Inbound Count', 'Outbound Count', 'Response Rate (%)', 'Avg Response Time', 'Conversation Summary'];
                  
                  const sanitize = (text: any) => {
                    if (text === null || text === undefined) return '';
                    let cleanText = String(text).replace(/[\n\r]+/g, ' ').trim();
                    cleanText = cleanText.replace(/"/g, '""');
                    return `"${cleanText}"`;
                  };

                  const rows = waCrmData.map((c: any) => {
                    const rate = c.responseRate !== undefined ? c.responseRate : 0;
                    return [
                      sanitize(c.name || 'Unknown'),
                      sanitize(c.phone || '-'),
                      c.inboundCount,
                      c.outboundCount,
                      `${rate}%`,
                      sanitize(formatResponseTime(c.avgResponseTimeMs)),
                      sanitize((c.conversationSummary || []).join(' | '))
                    ];
                  });

                  const csvContent = [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `wa_crm_full_summary_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {waCrmLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Contacts</h4>
                  <div className="text-3xl font-black tracking-tighter text-zinc-900">{waCrmData.length}</div>
                </div>
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 text-emerald-500">Inbound Activity</h4>
                  <div className="text-3xl font-black tracking-tighter text-zinc-900">{waCrmData.reduce((acc: number, c: any) => acc + (c.inboundCount || 0), 0)}</div>
                </div>
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 text-blue-500">Outbound Activity</h4>
                  <div className="text-3xl font-black tracking-tighter text-zinc-900">{waCrmData.reduce((acc: number, c: any) => acc + (c.outboundCount || 0), 0)}</div>
                </div>
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 text-zinc-900">Overall Response Rate</h4>
                  {(() => {
                    const contactsWithResponseRate = waCrmData.filter((c: any) => c.responseRate !== undefined);
                    const avgRate = contactsWithResponseRate.length > 0
                      ? Math.round(contactsWithResponseRate.reduce((acc: number, c: any) => acc + (c.responseRate || 0), 0) / contactsWithResponseRate.length)
                      : (waCrmData.reduce((acc: number, c: any) => acc + (c.inboundCount || 0), 0) > 0 ? Math.min(Math.round(waCrmData.reduce((acc: number, c: any) => acc + (c.outboundCount || 0), 0) / waCrmData.reduce((acc: number, c: any) => acc + (c.inboundCount || 0), 0) * 100), 100) : 0);
                    return (
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black tracking-tighter text-zinc-900">{avgRate}%</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Efficiency</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50/50 text-[10px] text-zinc-400 border-b border-zinc-100 uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Activity</th>
                        <th className="px-6 py-4">Response Time</th>
                        <th className="px-6 py-4 w-1/2">Conversation Overview</th>
                        <th className="px-4 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {waCrmData.map((c: any, idx: number) => {
                        const rate = c.responseRate !== undefined ? c.responseRate : (c.inboundCount > 0 ? Math.min(Math.round((c.outboundCount / c.inboundCount) * 100), 100) : 0);
                        const isLate = rate < 100 && c.inboundCount > 0;
                        return (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-bold text-zinc-900">{c.name || 'Unknown User'}</div>
                                {c.isPendingReply && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500 text-white animate-pulse">
                                    Segera Balas
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 font-mono">{c.phone || '-'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-4 text-xs font-bold">
                                <div className="text-emerald-600"><span className="text-zinc-400 text-[9px] uppercase block mb-1">Inbound</span>{c.inboundCount || 0} msgs</div>
                                <div className="text-blue-600"><span className="text-zinc-400 text-[9px] uppercase block mb-1">Outbound</span>{c.outboundCount || 0} msgs</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-zinc-100 rounded-full h-1.5 w-16">
                                    <div className={`h-full rounded-full ${isLate ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${rate}%` }}></div>
                                  </div>
                                  <span className="font-mono font-bold text-xs">{rate}%</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                  <Clock size={12} />
                                  <span>{formatResponseTime(c.avgResponseTimeMs)} AVG</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-2">
                                {c.conversationSummary && c.conversationSummary.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] rounded leading-tight font-bold line-clamp-1 max-w-[200px] truncate" title={c.conversationSummary[c.conversationSummary.length - 1]}>
                                      {c.conversationSummary[c.conversationSummary.length - 1]}
                                    </span>
                                    {c.conversationSummary.length > 1 && (
                                      <button 
                                        onClick={() => setSelectedContact(c)}
                                        className="text-[9px] text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded font-black uppercase tracking-widest transition"
                                      >
                                        View All ({c.conversationSummary.length})
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-300 italic text-xs">No specific intent extracted</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button 
                                onClick={() => handleDelete(c.id || c.wa_number || c.chat_id)}
                                className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-xl transition duration-150"
                                title="Delete Contact"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conversation Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900">{selectedContact.name || 'Unknown User'}</h3>
                <p className="text-xs font-mono text-zinc-500 mt-1">{selectedContact.phone || '-'}</p>
              </div>
              <button 
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50">
              {selectedContact.conversationSummary && selectedContact.conversationSummary.length > 0 ? (
                selectedContact.conversationSummary.map((sum: string, i: number) => {
                  const isUser = sum.startsWith('User:');
                  const messageText = sum.replace(/^(User|Sales):\s*/, '');
                  
                  return (
                    <div key={i} className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${isUser ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm' : 'bg-green-500 text-white rounded-tr-sm shadow-md shadow-green-500/20'}`}>
                        <div className="font-semibold text-[10px] uppercase tracking-widest mb-1 opacity-70">
                          {isUser ? 'Customer' : 'SalesMAPID'}
                        </div>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">{messageText}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-12 text-zinc-400 italic">No conversation history available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
