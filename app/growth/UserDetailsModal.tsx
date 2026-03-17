import React from 'react';
import { X, User, Phone, Mail, Briefcase, Calendar, Star, Tag } from 'lucide-react';

interface UserDetailsModalProps {
    user: any | null;
    onClose: () => void;
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-zinc-900">User Details</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                Profile Information
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <User size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Full Name</p>
                            <p className="text-sm font-bold text-zinc-900">{user.name || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Mail size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Email Address</p>
                            <p className="text-sm font-bold text-zinc-900">{user.email || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Phone size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Phone Number</p>
                            <p className="text-sm font-bold text-zinc-900">{user.phone || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Briefcase size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Industry Sector</p>
                            <p className="text-sm font-bold text-zinc-900">{user.industry || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Tag size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Current Plan</p>
                            <p className="text-sm font-bold text-zinc-900 capitalize">{user.plan || '-'}</p>
                            {user.licenseType && user.licenseType !== '-' && (
                                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">{user.licenseType.replace('license_', '').replace('_', ' ')}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Star size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Status</p>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${user.priority === 1 ? 'bg-rose-50 text-rose-600 border-rose-200' : user.priority === 2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {user.status || '-'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-500 mt-1">
                            <Calendar size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Registered Date</p>
                            <p className="text-sm font-bold text-zinc-900">{user.createdAt ? new Date(user.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : (user.date ? new Date(user.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-')}</p>
                        </div>
                    </div>
                    {user.updatedAt && user.updatedAt !== user.createdAt && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 flex items-center justify-center mt-1">
                                <Calendar size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Last Transaction</p>
                                <p className="text-sm font-bold text-zinc-900">{new Date(user.updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50/80 rounded-b-3xl shrink-0 flex justify-end backdrop-blur-sm">
                    <button onClick={onClose} className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition shadow-md">Close</button>
                </div>
            </div>
        </div>
    );
}
