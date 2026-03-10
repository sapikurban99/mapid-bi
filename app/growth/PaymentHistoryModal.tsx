import React from 'react';
import { useUserPaymentHistory } from './useGrowthData';
import { X, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentHistoryModalProps {
    userId: string | null;
    userName: string;
    onClose: () => void;
}

export default function PaymentHistoryModal({ userId, userName, onClose }: PaymentHistoryModalProps) {
    const { history, isLoading, isError } = useUserPaymentHistory(userId);

    if (!userId) return null;

    return (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-black text-xl text-zinc-900">Payment History</h2>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            {userName}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="animate-spin text-zinc-400 mb-2" size={32} />
                            <p className="text-sm font-medium text-zinc-500">Loading history...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-10 text-rose-500">
                            <AlertCircle className="mx-auto mb-2" size={32} />
                            <p className="text-sm font-bold">Failed to load payment history.</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400">
                            <Clock className="mx-auto mb-2 opacity-50" size={32} />
                            <p className="text-sm italic">No payment records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((record: any, idx: number) => (
                                <div key={record._id || idx} className="border border-zinc-200 p-4 rounded-xl hover:border-zinc-300 transition flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-zinc-900">{record.payment_type || 'Unknown Plan'}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${record.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 font-medium">
                                            {record.createdAt ? new Date(record.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown Date'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-zinc-900">Rp {(record.detail_amount?.total || 0).toLocaleString('id-ID')}</p>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{record.payment_method || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition">Close</button>
                </div>
            </div>
        </div>
    );
}
