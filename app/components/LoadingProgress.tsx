'use client';

import { useState, useEffect, useRef } from 'react';

interface LoadingProgressProps {
    isLoading: boolean;
    onComplete?: () => void;
    title?: string;
    stages?: { target: number; label: string }[];
    fetchDone?: boolean;
}

const DEFAULT_STAGES = [
    { target: 20, label: 'Connecting to server...' },
    { target: 40, label: 'Establishing secure link...' },
    { target: 60, label: 'Fetching data from SOT...' },
    { target: 80, label: 'Processing response...' },
    { target: 90, label: 'Almost done...' },
];

export default function LoadingProgress({
    isLoading,
    onComplete,
    title = 'Loading',
    stages = DEFAULT_STAGES,
    fetchDone = false
}: LoadingProgressProps) {
    const [progress, setProgress] = useState(0);
    const [label, setLabel] = useState(stages[0]?.label || 'Loading...');
    const fetchDoneRef = useRef(fetchDone);

    useEffect(() => {
        fetchDoneRef.current = fetchDone;
    }, [fetchDone]);

    useEffect(() => {
        if (!isLoading) return;

        let currentProgress = 0;
        let stageIndex = 0;

        const interval = setInterval(() => {
            if (fetchDoneRef.current) {
                currentProgress = Math.min(currentProgress + 5, 100);
                setProgress(currentProgress);
                setLabel('Complete!');
                if (currentProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => onComplete?.(), 400);
                }
                return;
            }

            if (stageIndex < stages.length) {
                const stage = stages[stageIndex];
                if (currentProgress < stage.target) {
                    currentProgress += 1;
                    setProgress(currentProgress);
                    setLabel(stage.label);
                } else {
                    stageIndex++;
                }
            }
        }, 60);

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!isLoading && progress === 0) return null;

    const milestones = [0, 25, 50, 75, 100];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50 font-sans">
            <div className="w-full max-w-md text-center">
                {/* Title */}
                <p className="text-[10px] tracking-[0.3em] uppercase font-black text-zinc-400 mb-8">{title}</p>

                {/* Big Percentage */}
                <div className="relative mb-10">
                    <span className={`text-[7rem] font-black tracking-tighter leading-none transition-colors duration-500 ${progress >= 100 ? 'text-emerald-500' : 'text-zinc-900'
                        }`}>
                        {progress}
                    </span>
                    <span className={`text-3xl font-black ml-1 transition-colors duration-500 ${progress >= 100 ? 'text-emerald-400' : 'text-zinc-300'
                        }`}>%</span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-zinc-200 rounded-full overflow-hidden mb-4">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${progress >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                : 'bg-gradient-to-r from-zinc-900 to-zinc-700'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Milestones */}
                <div className="flex justify-between px-0 mb-6">
                    {milestones.map(m => (
                        <div key={m} className={`w-2 h-2 rounded-full transition-all duration-300 ${progress >= m ? (progress >= 100 ? 'bg-emerald-400 scale-110' : 'bg-zinc-900') : 'bg-zinc-200'
                            }`} />
                    ))}
                </div>

                {/* Stage Label */}
                <p className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${progress >= 100 ? 'text-emerald-500' : 'text-zinc-400'
                    }`}>
                    {label}
                </p>
            </div>
        </div>
    );
}
