'use client';

import { RefreshCw, Timer } from 'lucide-react';

interface InactivityPromptProps {
  show: boolean;
}

export default function InactivityPrompt({ show }: InactivityPromptProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-zinc-900/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl flex flex-col items-center gap-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100 shadow-inner">
          <Timer className="text-zinc-900 animate-pulse" size={40} />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tighter text-zinc-900">Welcome Back!</h2>
          <p className="text-zinc-500 font-medium">
            You've been away for a while. To ensure you're viewing the latest performance data, please refresh the dashboard.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full group flex items-center justify-center gap-3 bg-zinc-900 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-[0.98]"
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          Refresh Dashboard
        </button>
        
        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Mapid Executive Intelligence</p>
      </div>
    </div>
  );
}
