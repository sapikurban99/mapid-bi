import React from 'react';
import { X, User, Phone, Mail, Briefcase, Calendar, Star, Tag, Layers, CreditCard, ShieldCheck, ExternalLink } from 'lucide-react';

interface UserDetailsModalProps {
    user: any | null;
    onClose: () => void;
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
    if (!user) return null;

    const formatDate = (d: any) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
        } catch (e) {
            return '-';
        }
    };

    // Extract the real licenses array from user data
    const licenses: any[] = user.licenseTypesList || [];

    // Determine the primary payment method from the first license
    const primaryPaymentMethod = licenses[0]?.payment_methods || user.payment_methode || '-';

    // Avoid repeating names if full_name and name are the same
    const displayName = user.full_name && user.full_name !== user.name ? user.full_name : user.name;

    return (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-400 flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
                {/* Header */}
                <div className="p-8 border-b border-zinc-100 flex justify-between items-center shrink-0 bg-zinc-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white border border-zinc-200 text-zinc-900 rounded-[2rem] flex items-center justify-center shadow-sm">
                            <User size={38} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="font-black text-4xl text-zinc-900 tracking-tight leading-none">{displayName || 'User Profile'}</h2>
                            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" /> Account Intelligence
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-4 bg-white border border-zinc-100 hover:border-zinc-300 rounded-full transition shadow-sm group">
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 flex items-center gap-2">
                                <User size={14} /> Profile Information
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Username</p>
                                    <p className="text-base font-bold text-zinc-900">{user.username || user.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Email Address</p>
                                    <p className="text-base font-bold text-zinc-900">{user.email && user.email !== '-' ? user.email : <span className="text-zinc-300 italic">Not provided</span>}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Contact Number</p>
                                    <p className="text-base font-bold text-zinc-900">{user.phone_number || user.phone || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 flex items-center gap-2">
                                <Briefcase size={14} /> Professional Context
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Industry Segment</p>
                                    <p className="text-base font-bold text-zinc-900">{user.industry || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Primary Gateway</p>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-xl border inline-block mt-1.5 ${
                                        primaryPaymentMethod === 'midtrans' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        primaryPaymentMethod === 'gift' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-zinc-50 text-zinc-600 border-zinc-100'
                                    }`}>
                                        {primaryPaymentMethod}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Lifecycle Status</p>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-xl border inline-block mt-1.5 ${
                                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        user.status === 'Checkout' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                        'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        {user.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 flex items-center gap-2">
                                <Calendar size={14} /> Account Lifecycle
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Registered On</p>
                                    <p className="text-base font-bold text-zinc-900">{formatDate(user.createdAt || user.date)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Last Known Activity</p>
                                    <p className="text-base font-bold text-zinc-900">{formatDate(user.updatedAt || user.date)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Active Products</p>
                                    <p className="text-base font-bold text-zinc-900">{licenses.length} Verified Licenses</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Licenses Section */}
                    <div className="space-y-8 pt-10 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-900 flex items-center gap-3">
                                <Layers size={18} className="text-blue-500" /> Subscription & Licenses
                            </h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-zinc-100 px-4 py-2 rounded-full">
                                {licenses.length} ACTIVE RECORD(S)
                            </p>
                        </div>

                        <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-50 border-b border-zinc-200">
                                        <tr className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                            <th className="px-8 py-6">No</th>
                                            <th className="px-8 py-6">Product / Lisensi</th>
                                            <th className="px-8 py-6">Payment Method</th>
                                            <th className="px-8 py-6">Subscription Period</th>
                                            <th className="px-8 py-6 text-center">Current Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {licenses.length > 0 ? (
                                            licenses.map((license: any, idx: number) => {
                                                const isExpired = license.date_expired ? new Date(license.date_expired) < new Date() : false;
                                                const licenseLabel = (license.license_type || '')
                                                    .replace('license_', '')
                                                    .replace(/_/g, ' ');
                                                
                                                return (
                                                    <tr key={license._id || idx} className="hover:bg-zinc-50/50 transition-colors">
                                                        <td className="px-8 py-7 font-bold text-zinc-300">{idx + 1}</td>
                                                        <td className="px-8 py-7">
                                                            <p className="font-black text-zinc-900 uppercase tracking-tight text-lg">{licenseLabel || 'Unknown'}</p>
                                                            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-[0.2em]">{license.payment_type || 'Personal'}</p>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <div className="space-y-2">
                                                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest inline-block ${
                                                                    license.payment_methods === 'midtrans' ? 'bg-blue-100 text-blue-700' :
                                                                    license.payment_methods === 'gift' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-zinc-100 text-zinc-500'
                                                                }`}>
                                                                    {license.payment_methods || '-'}
                                                                </span>
                                                                {license.redeem_code && license.redeem_code.trim() !== '' && (
                                                                    <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em]">Promo: {license.redeem_code}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7 font-bold text-zinc-600">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-zinc-900">{formatDate(license.date_start)}</span>
                                                                <span className="text-zinc-300">—</span>
                                                                <span className={isExpired ? 'text-rose-500' : 'text-emerald-600'}>{formatDate(license.date_expired)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <div className="flex justify-center">
                                                                <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-2xl border ${
                                                                    !isExpired 
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100' 
                                                                        : 'bg-rose-50 text-rose-600 border-rose-200'
                                                                }`}>
                                                                    {!isExpired ? 'VALID LICENSE' : 'EXPIRED'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <p className="text-zinc-200 font-black text-2xl uppercase tracking-tighter">No Active Licenses</p>
                                                    <p className="text-[10px] text-zinc-400 uppercase tracking-[0.4em] mt-3">VERIFICATION PENDING OR PAYMENT NOT COMPLETED</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-10 border-t border-zinc-100 bg-zinc-50/50 shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-12 py-5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-zinc-800 transition shadow-2xl shadow-zinc-200 active:scale-95">
                        Close Intelligence Window
                    </button>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
            `}</style>
        </div>
    );
}
