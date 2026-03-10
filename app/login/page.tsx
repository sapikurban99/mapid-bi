'use client';

import { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { login } from '../actions/auth';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('password', password);

        try {
            const res = await login(formData);
            if (res && res.error) {
                setError(res.error);
                setLoading(false);
            }
        } catch (err: any) {
            if (err.message === 'NEXT_REDIRECT') {
                // Ignore the redirect error as NextJS handles it
                return;
            }
            setError('Something went wrong');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans p-6 selection:bg-zinc-900 selection:text-white">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-10 border border-zinc-200 shadow-2xl rounded-3xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Lock size={180} />
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 shadow-inner transform -rotate-6">
                            <ShieldCheck className="text-white" size={32} />
                        </div>

                        <h1 className="text-3xl font-black tracking-tight mb-2 text-zinc-900">Sign In</h1>
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">
                            MAPID BI Dashboard Access
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                    Secure Passkey
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your passkey"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full p-4 bg-zinc-50 border ${error ? 'border-rose-500 focus:ring-rose-200' : 'border-zinc-200 focus:ring-zinc-900'} rounded-xl text-zinc-900 focus:outline-none focus:ring-2 font-bold transition-all text-center tracking-widest`}
                                />
                                {error && (
                                    <p className="mt-2 text-xs font-bold text-rose-500 flex items-center justify-center gap-1 animate-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Authenticating</>
                                ) : (
                                    <>Access Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Authorized Personnel Only &copy; 2026 MAPID
                </p>
            </div>
        </main>
    );
}
