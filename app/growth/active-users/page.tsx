'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActiveUsersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/growth');
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Redirecting to Growth Hub...</p>
            </div>
        </div>
    );
}
