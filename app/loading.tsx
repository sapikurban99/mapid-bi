'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-md">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight">Sedang memuat data...</h2>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Harap Tunggu Sebentar</p>
                </div>
            </div>
        </div>
    );
}
