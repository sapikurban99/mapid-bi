import { useState } from 'react';
import { SiteConfig, setConfig } from '../../lib/config';
import { Loader2, Plus, X, Globe } from 'lucide-react';

export default function KanbanBoard({ 
    config, 
    setLocalConfig, 
    syncData, 
    globalIsLoading 
}: { 
    config: SiteConfig, 
    setLocalConfig: (c: any) => void,
    syncData: () => void,
    globalIsLoading: boolean 
}) {
    const [loadingBiData, setLoadingBiData] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newProject, setNewProject] = useState({ client: '', projectName: '', pseId: '', stage: 'Proposal', progress: 0, priority: 'Medium' });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200">
                    <Plus size={14} /> Add Project
                </button>

                <button
                    onClick={async () => {
                        setLoadingBiData(true);
                        await syncData();
                        setLocalConfig((prev: any) => ({ ...prev })); // trigger re-render if needed, but App host sets it
                        setLoadingBiData(false);
                    }}
                    disabled={loadingBiData || globalIsLoading}
                    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg ${loadingBiData || globalIsLoading ? 'bg-zinc-300 text-white cursor-wait' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'}`}>
                    {loadingBiData || globalIsLoading ? <><Loader2 size={14} className="animate-spin" /> Fetching</> : <><Globe size={14} /> Refresh Board</>}
                </button>
            </div>

            {!config.kanbanProjects || config.kanbanProjects.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-500 font-bold tracking-wide">
                    No Kanban projects found. Ensure KANBAN_SHEET_ID is set correctly in GAS script and fetch data.
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar flex-nowrap items-start" style={{ minHeight: '70vh' }}>
                    {Array.from(new Set(config.kanbanProjects.map(p => p.stage).concat(['Proposal', 'Negotiation', 'Won', 'Lost', 'Done']))).map(stage => (
                        <div key={stage} className="w-[340px] shrink-0 bg-white border border-zinc-200 rounded-3xl flex flex-col h-full max-h-[75vh]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                                e.preventDefault();
                                const projectId = e.dataTransfer.getData('projectId');
                                if (projectId) {
                                    // Optimistic update
                                    setLocalConfig((prev: any) => {
                                        if (!prev) return prev;
                                        const n = JSON.parse(JSON.stringify(prev));
                                        const p = n.kanbanProjects?.find((x: any) => x.id === projectId);
                                        if (p) p.stage = stage;
                                        setConfig({ kanbanProjects: n.kanbanProjects }); // save to base config
                                        return n;
                                    });
                                    // API call
                                    try {
                                        await fetch('/api/gas', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ action: 'updateKanban', projectId, newStage: stage })
                                        });
                                    } catch(err) {
                                        alert("Failed to update kanban stage.");
                                    }
                                }
                            }}
                        >
                            <div className="p-5 border-b border-zinc-100 bg-zinc-50/80 rounded-t-3xl font-black text-sm uppercase tracking-wider flex justify-between items-center text-zinc-800">
                                {stage}
                                <span className="bg-white border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">{config.kanbanProjects?.filter((p: any) => p.stage === stage).length || 0}</span>
                            </div>
                            <div className="p-4 flex-1 space-y-4 bg-zinc-50/30 overflow-y-auto custom-scrollbar">
                                {config.kanbanProjects?.filter((p: any) => p.stage === stage).map((p: any) => (
                                    <div key={p.id} draggable
                                        onDragStart={(e) => e.dataTransfer.setData('projectId', p.id)}
                                        className="bg-white border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 p-5 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-200 group relative overflow-hidden">
                                        
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        <div className="text-[10px] font-black text-blue-600 mb-1.5 uppercase tracking-widest">{p.client}</div>
                                        <div className="font-extrabold text-zinc-900 text-base leading-snug mb-3">{p.projectName}</div>
                                        
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Progress</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p.progress}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-700">{p.progress}%</span>
                                                </div>
                                            </div>
                                            <span className="bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-600 text-[10px] font-black tracking-widest uppercase cursor-help" title={`Full PSE ID: ${p.pseId}`}>
                                                PSE: {p.pseId.substring(0,4)}...
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== ADD PROJECT MODAL ========== */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-zinc-900">Add New Project</h3>
                                <p className="text-xs font-medium text-zinc-800 uppercase tracking-widest mt-1">Enter project details</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500"><X size={18} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">Client Name</label>
                                <input type="text" value={newProject.client} onChange={(e) => setNewProject(p => ({ ...p, client: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900" placeholder="e.g. PT Example" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">Project Name</label>
                                <input type="text" value={newProject.projectName} onChange={(e) => setNewProject(p => ({ ...p, projectName: e.target.value }))}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900" placeholder="e.g. Website Overhaul" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">PSE Representative</label>
                                    <select value={newProject.pseId} onChange={(e) => setNewProject(p => ({ ...p, pseId: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900">
                                        <option value="">Select PSE...</option>
                                        {config.pseWorkloads?.map(pse => (
                                            <option key={pse.pseId} value={pse.pseId}>{pse.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">Initial Stage</label>
                                    <select value={newProject.stage} onChange={(e) => setNewProject(p => ({ ...p, stage: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900">
                                        {['Proposal', 'Negotiation', 'Won', 'Lost', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">Progress (%)</label>
                                    <input type="number" min="0" max="100" value={newProject.progress} onChange={(e) => setNewProject(p => ({ ...p, progress: Number(e.target.value) }))}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-700 mb-2 uppercase tracking-wider">Priority</label>
                                    <select value={newProject.priority} onChange={(e) => setNewProject(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition text-zinc-900">
                                        {['Low', 'Medium', 'High'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition">Cancel</button>
                            <button
                                disabled={submitting || !newProject.client || !newProject.projectName}
                                onClick={async () => {
                                    setSubmitting(true);
                                    try {
                                        const res = await fetch('/api/gas', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ action: 'addKanbanProject', ...newProject })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            const newProjData = { id: data.newId, ...newProject };
                                            setLocalConfig((prev: any) => {
                                                if (!prev) return prev;
                                                const n = JSON.parse(JSON.stringify(prev));
                                                if (!n.kanbanProjects) n.kanbanProjects = [];
                                                n.kanbanProjects.push(newProjData);
                                                setConfig({ kanbanProjects: n.kanbanProjects });
                                                return n;
                                            });
                                            setIsAdding(false);
                                            setNewProject({ client: '', projectName: '', pseId: '', stage: 'Proposal', progress: 0, priority: 'Medium' });
                                        } else {
                                            alert("Error saving project: " + data.message);
                                        }
                                    } catch (err: any) {
                                        alert("Failed to save project.");
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                className="flex items-center justify-center min-w-[120px] gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e4e4e7; border-radius: 10px; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
