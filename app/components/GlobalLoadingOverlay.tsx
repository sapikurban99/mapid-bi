'use client';

import { Loader2 } from 'lucide-react';

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function GlobalLoadingOverlay({ isLoading, message = 'Processing Request...' }: GlobalLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-50/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-100 border-t-zinc-900 animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-900 animate-pulse" size={24} />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black tracking-tight text-zinc-900">{message}</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
