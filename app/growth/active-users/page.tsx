'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGrowthData } from '../useGrowthData';
import PaymentHistoryModal from '../PaymentHistoryModal';
import UserDetailsModal from '../UserDetailsModal';
import { Users, Repeat, Loader2, ArrowLeft, Download, ShieldCheck, Zap, AlertCircle, Briefcase, Send, Clock, X, MessageSquare } from 'lucide-react';

interface LeadItem {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    industry: string;
    total: number;
    status: string;
    payment_methode?: string;
    redeemCode?: string;
    licenseType?: string;
    priority?: number;
    successCount: number;
    licenseTypesList?: { type: string, count: number }[];
}

// Opsi Filter Constant
const FILTER_OPTIONS = {
    timeRanges: [
        { label: 'Bulan Ini (Mar)', value: 'this_month' },
        { label: 'Hari Ini', value: 'today' },
        { label: '7 Hari Terakhir', value: '7d' },
        { label: 'Kuartal Ini (Q1)', value: 'this_quarter' },
        { label: 'Semua Waktu', value: 'all' },
        { label: 'Custom Range...', value: 'custom' },
    ],
    industries: ['All Industries', 'Research & Education', 'Info Technology', 'Government', 'Real Estate & Arch', 'Retail & Fashion', 'Not Specified'],
    licenses: ['All Licenses', 'Personal', 'Teams'],
    paymentMethods: ['All Methods', 'Midtrans', 'Gift', 'No License']
};

export default function ActiveRetentionUsersPage() {
    // --- STATE MANAGEMENT UNTUK FILTER ---
    const [selectedTime, setSelectedTime] = useState('this_month');
    const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
    const [selectedLicense, setSelectedLicense] = useState('All Licenses');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Methods');

    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // --- STATE DATE RANGE ---
    const { startDate, endDate } = useMemo(() => {
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);

        if (selectedTime === 'this_month') {
            start.setDate(1);
        } else if (selectedTime === 'today') {
            // start is today
        } else if (selectedTime === '7d') {
            start.setDate(today.getDate() - 7);
        } else if (selectedTime === 'this_quarter') {
            const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
            start.setMonth(quarterMonth, 1);
        } else if (selectedTime === 'all') {
            start.setFullYear(2020, 0, 1); // some past date
        } else if (selectedTime === 'custom') {
            if (customStartDate && customEndDate) {
                return { startDate: customStartDate, endDate: customEndDate };
            }
            return { startDate: '', endDate: '' };
        }

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        return { startDate: formatDate(start), endDate: formatDate(end) };
    }, [selectedTime, customStartDate, customEndDate]);

    const [activeTab, setActiveTab] = useState<'active' | 'retention'>('active');

    // UI States
    const [selectedHistoryUser, setSelectedHistoryUser] = useState<{ id: string, name: string } | null>(null);
    const [selectedDetailUser, setSelectedDetailUser] = useState<LeadItem | null>(null);
    const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(null);

    // Blast States
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [blastModalOpen, setBlastModalOpen] = useState(false);
    const [blastMessage, setBlastMessage] = useState('Halo {{name}}, \n\nKami melihat ada update terkait lisensi {{plan}} MAPID Anda. Apakah ada yang bisa kami bantu?');
    const [blastSchedule, setBlastSchedule] = useState('now');
    const [blastDateTime, setBlastDateTime] = useState('');
    const [blasting, setBlasting] = useState(false);

    // Pagination
    const [leadsPage, setLeadsPage] = useState(1);
    const LEADS_PER_PAGE = 10;

    // Data Fetching
    const { newRegisters, allPayments, isLoading, isError } = useGrowthData(startDate, endDate);

    // --- DATA MAPPING (Identical to page.tsx) ---
    const processedData = useMemo(() => {
        let leads: LeadItem[] = [];

        const leadsMap = new Map<string, LeadItem>();

        // First, add all new registers
        if (Array.isArray(newRegisters)) {
            const today = new Date();
            newRegisters.forEach((user: any) => {
                const licenses = user.licenses || [];
                const firstLicense = licenses.length > 0 ? licenses[0] : null;

                let priorityLevel = 1;
                let statusLabel = 'No License';

                if (firstLicense) {
                    const expiryDate = new Date(firstLicense.date_expired);
                    if (expiryDate < today) {
                        priorityLevel = 2; // Expired
                        statusLabel = 'Expired';
                    } else {
                        priorityLevel = 3; // Active
                        statusLabel = 'Active';
                    }
                }

                let calculatedCreatedAt = user.createdAt || user.created_on || user.createdat || user.created_at || '';
                let calculatedUpdatedAt = user.updatedAt || user.updated_on || user.updatedat || user.updated_at || '';

                // Extract all successful payments for this user from allPayments
                const userPayments = Array.isArray(allPayments)
                    ? allPayments.filter((p: any) => p.user?._id === user._id && p.status === 'success')
                    : [];

                // Use userPayments as the source of truth for history if available, else fallback to current licenses
                const historySource = userPayments.length > 0 ? userPayments : licenses;

                if (!calculatedCreatedAt && historySource.length > 0) {
                    const validCreateds = historySource.map((l: any) => l.createdAt || l.created_on || l.createdat || l.date_in || null).filter(Boolean).map((d: string) => new Date(d));
                    if (validCreateds.length > 0) {
                        calculatedCreatedAt = new Date(Math.min(...validCreateds.map((d: Date) => d.getTime()))).toISOString();
                    }
                }

                if (!calculatedUpdatedAt && historySource.length > 0) {
                    const validUpdateds = historySource.map((l: any) => l.updatedAt || l.updated_on || l.updatedat || l.date_in || null).filter(Boolean).map((d: string) => new Date(d));
                    if (validUpdateds.length > 0) {
                        calculatedUpdatedAt = new Date(Math.max(...validUpdateds.map((d: Date) => d.getTime()))).toISOString();
                    }
                }

                // Group payments by date (e.g., YYYY-MM-DD) to detect packages
                const packagesByDate: Record<string, any[]> = {};
                historySource.forEach((l: any) => {
                    const d = new Date(l.date_in || l.createdAt || l.created_on || l.createdat);
                    if (!isNaN(d.getTime())) {
                        const dateKey = d.toISOString().split('T')[0];
                        if (!packagesByDate[dateKey]) packagesByDate[dateKey] = [];
                        packagesByDate[dateKey].push(l);
                    } else {
                        // Fallback for missing dates: count independently
                        const fallbackKey = 'unknown_' + Math.random();
                        packagesByDate[fallbackKey] = [l];
                    }
                });

                let calculatedSuccessCount = 0;
                const licenseCounts: Record<string, number> = {};

                Object.values(packagesByDate).forEach(group => {
                    const typesInGroup = new Set(group.map(l => (l.license_type || l.payment_type || '').toLowerCase()));
                    
                    // Logic: If basic, sini_ai, and sini_data are all present, it's 1 package.
                    const isPackage = typesInGroup.has('license_basic') && typesInGroup.has('license_sini_ai') && typesInGroup.has('license_sini_data');
                    
                    if (isPackage) {
                        calculatedSuccessCount += 1;
                        licenseCounts['Mapid Package (Basic, Sini AI, Sini Data)'] = (licenseCounts['Mapid Package (Basic, Sini AI, Sini Data)'] || 0) + 1;
                    } else {
                        // Count independently
                        calculatedSuccessCount += group.length;
                        group.forEach(l => {
                            const type = l.license_type || l.payment_type;
                            if (type) {
                                licenseCounts[type] = (licenseCounts[type] || 0) + 1;
                            }
                        });
                    }
                });

                const licenseTypesList = Object.entries(licenseCounts).map(([type, count]) => ({ type: type as string, count: count as number }));

                leadsMap.set(user._id, {
                    _id: user._id,
                    name: user.full_name || user.name || 'Unknown User',
                    email: user.email || '-',
                    phone: user.phone_number || user.phone || '-',
                    plan: firstLicense?.payment_methods || user.payment_type || 'Unspecified',
                    licenseType: firstLicense?.license_type || '-',
                    date: calculatedCreatedAt,
                    createdAt: calculatedCreatedAt,
                    updatedAt: calculatedUpdatedAt,
                    industry: user.industry || 'Not Specified',
                    total: 0,
                    status: statusLabel,
                    priority: priorityLevel,
                    redeemCode: firstLicense?.redeem_code || user.redeem_code,
                    successCount: calculatedSuccessCount,
                    licenseTypesList
                });
            });
        }

        // Second, add or merge all payments
        if (Array.isArray(allPayments)) {
            allPayments.forEach((p: any) => {
                if (p.user && p.user._id) {
                    const existing = leadsMap.get(p.user._id);

                    // For the active users list, we also merge in details if it doesn't exist
                    if (!existing || (p.status !== 'success' && existing.priority === 1)) {
                        const priorityLevel = p.status === 'success' ? 3 : p.status === 'expired' ? 2 : 1; 
                        const statusLabel = p.status === 'success' ? 'Active' : p.status === 'expired' ? 'Expired' : 'Checkout';

                        leadsMap.set(p.user._id, {
                            ...existing,
                            _id: p.user._id,
                            name: p.user.full_name || p.user.name || existing?.name || 'Unknown User',
                            email: p.user.email || existing?.email || '-',
                            phone: p.user.phone_number || p.user.phone || existing?.phone || '-',
                            plan: p.payment_type || existing?.plan || 'Unspecified',
                            licenseType: p.license_type || existing?.licenseType || '-',
                            date: existing?.date || p.date_in || p.createdAt || p.created_on || '',
                            createdAt: existing?.createdAt || p.date_in || p.createdAt || p.created_on || '',
                            updatedAt: p.date_out || p.updatedAt || p.updated_on || existing?.updatedAt || '',
                            industry: p.user.industry || existing?.industry || 'Not Specified',
                            total: p.detail_amount?.total || p.total || existing?.total || 0,
                            status: statusLabel,
                            priority: priorityLevel,
                            payment_methode: p.payment_methode || existing?.payment_methode,
                            redeemCode: p.redeem_code || existing?.redeemCode,
                            successCount: existing?.successCount || 0,
                            licenseTypesList: existing?.licenseTypesList || []
                        });
                    } else if (existing && p.status === 'success') {
                        // User exists and had a successful payment, update their details strictly for Contacts
                        leadsMap.set(p.user._id, {
                            ...existing,
                            email: existing.email !== '-' ? existing.email : (p.user.email || '-'),
                            phone: existing.phone !== '-' ? existing.phone : (p.user.phone_number || p.user.phone || '-')
                        });
                    }
                }
            });
        }

        leads = Array.from(leadsMap.values());

        // Apply Industry and License Filters Locally against fetched filtered array
        if (selectedIndustry !== 'All Industries') {
            leads = leads.filter(d => d.industry === selectedIndustry);
        }
        if (selectedLicense !== 'All Licenses') {
            leads = leads.filter(d =>
                (d.plan || '').toLowerCase().includes(selectedLicense.toLowerCase()) ||
                (d.licenseType || '').toLowerCase().includes(selectedLicense.toLowerCase())
            );
        }
        if (selectedPaymentMethod !== 'All Methods') {
            if (selectedPaymentMethod === 'No License') {
                leads = leads.filter(d => d.status === 'No License' || !d.payment_methode);
            } else {
                 leads = leads.filter(d =>
                    (d.payment_methode || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase())
                );
            }
        }

        const activeUsers = leads.filter(l => l.successCount >= 1).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const retentionUsers = leads.filter(l => l.successCount > 1).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { activeUsers, retentionUsers };
    }, [newRegisters, allPayments, selectedIndustry, selectedLicense, selectedPaymentMethod]);

    const displayData = activeTab === 'active' ? processedData.activeUsers : processedData.retentionUsers;

    const handleBlastConfirm = async () => {
        setBlasting(true);
        const contacts = displayData.filter(l => selectedLeads.includes(l._id || l.name));
        try {
            const res = await fetch('/api/n8n/blast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contacts,
                    messageTemplate: blastMessage,
                    schedule: blastSchedule === 'schedule' ? blastDateTime : null
                })
            });
            await res.json();
            alert('Blast payload successfully sent to n8n Webhook!');
            setBlastModalOpen(false);
            setSelectedLeads([]);
        } catch (error) {
            alert('Failed to send blast payload.');
        } finally {
            setBlasting(false);
        }
    };

    const exportCsv = () => {
        const headers = "Name,Email,Phone,Plan,License,Industry,Status,Priority,Success Count\n";
        const csv = displayData.map(l => `${l.name},${l.email},${l.phone},${l.plan},"${l.licenseTypesList?.map(lic => `${lic.type} (${lic.count}x)`).join(' | ') || '-'}",${l.industry},${l.status},${l.priority},${l.successCount}`).join('\n');
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-users.csv`;
        a.click();
    };

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* HEADER */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-auto py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/growth" className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500 hover:text-zinc-900">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-black text-xl tracking-tight">Active & Retention Users</h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Growth Payment History Tracking</p>
                        </div>
                    </div>

                    {/* FILTER PANEL NATIVE */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            className="text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        >
                            {FILTER_OPTIONS.timeRanges.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {selectedTime === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input type="date" className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                                <span className="text-zinc-400">-</span>
                                <input type="date" className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                            </div>
                        )}
                        <select
                            className="text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedIndustry}
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                        >
                            {FILTER_OPTIONS.industries.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <select
                            className="text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedLicense}
                            onChange={(e) => setSelectedLicense(e.target.value)}
                        >
                            {FILTER_OPTIONS.licenses.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select
                            className="text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        >
                            {FILTER_OPTIONS.paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-16 animate-in fade-in bg-white border border-zinc-200 rounded-2xl shadow-sm h-64">
                        <Loader2 className="animate-spin text-zinc-400 mb-4" size={40} />
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Memuat Data Payment History...</p>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center p-16 animate-in fade-in bg-white border border-rose-200 rounded-2xl shadow-sm text-rose-500 text-center h-64">
                        <AlertCircle className="mb-4 text-rose-300" size={48} strokeWidth={1.5} />
                        <h3 className="text-xl font-black mb-2 text-rose-900">Gagal Mengambil Data</h3>
                        <p className="text-sm max-w-sm text-rose-600/80 mb-6">Terdapat masalah saat mengambil data dari API Payment History.</p>
                    </div>
                ) : (
                    <>
                        {/* 1. METRICS */}
                        <section className="animate-in fade-in flex flex-col md:flex-row gap-6">
                            <div className="flex-1 bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm flex items-center gap-6 hover:shadow-md transition">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl">
                                    <Zap size={32} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Active Users</h4>
                                    <p className="text-4xl font-black tracking-tighter text-zinc-900">
                                        {processedData.activeUsers.length.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">Users with at least 1 successful license</p>
                                </div>
                            </div>

                            <div className="flex-1 bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm flex items-center gap-6 hover:shadow-md transition">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-2xl">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Retention Users</h4>
                                    <p className="text-4xl font-black tracking-tighter text-zinc-900">
                                        {processedData.retentionUsers.length.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">Users with more than 3 successful licenses</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. DATA TABS & TABLE */}
                        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
                                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => { setActiveTab('active'); setLeadsPage(1); setSelectedLeads([]); }}
                                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        <div className="flex items-center gap-2"><Zap size={14} /> Active</div>
                                    </button>
                                    <button 
                                        onClick={() => { setActiveTab('retention'); setLeadsPage(1); setSelectedLeads([]); }}
                                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'retention' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        <div className="flex items-center gap-2"><Repeat size={14} /> Retention</div>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={exportCsv}
                                        className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                    {selectedLeads.length > 0 && (
                                        <button
                                            onClick={() => setBlastModalOpen(true)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-md flex items-center gap-2 animate-in fade-in"
                                        >
                                            <Send size={14} /> Blast WA ({selectedLeads.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {displayData.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-zinc-50 text-[10px] text-zinc-500 uppercase font-black tracking-widest border-b border-zinc-200">
                                                <tr>
                                                    <th className="px-6 py-4 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={displayData.length > 0 && selectedLeads.length === Math.min(LEADS_PER_PAGE, displayData.length)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedLeads(displayData.slice((leadsPage - 1) * LEADS_PER_PAGE, leadsPage * LEADS_PER_PAGE).map(l => l._id || l.name));
                                                                else setSelectedLeads([]);
                                                            }}
                                                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4">User Info / Industry</th>
                                                    <th className="px-6 py-4">Contact</th>
                                                    <th className="px-6 py-4">Plan / License Type</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {displayData.slice((leadsPage - 1) * LEADS_PER_PAGE, leadsPage * LEADS_PER_PAGE).map((lead, idx) => {
                                                    const leadId = lead._id || lead.name;
                                                    return (
                                                        <tr key={idx} className={`hover:bg-zinc-50 transition border-l-4 ${lead.priority === 1 ? 'border-l-rose-500' : lead.priority === 2 ? 'border-l-amber-500' : 'border-l-emerald-500'} ${selectedLeads.includes(leadId) ? 'bg-zinc-50' : ''}`}>
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedLeads.includes(leadId)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedLeads([...selectedLeads, leadId]);
                                                                        else setSelectedLeads(selectedLeads.filter(e => e !== leadId));
                                                                    }}
                                                                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 cursor-pointer group/name" onClick={() => setSelectedDetailUser(lead)}>
                                                                <p className="font-bold text-zinc-900 group-hover/name:text-blue-600 transition decoration-2 underline-offset-2 group-hover/name:underline">{lead.name}</p>
                                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1"><Briefcase size={12} /> {lead.industry}</p>
                                                            </td>
                                                            <td className="px-6 py-4 relative group">
                                                                <p className="font-medium text-zinc-600">{lead.email}</p>
                                                                <p className="text-xs text-zinc-400">{lead.phone}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1 items-start cursor-pointer group" onClick={() => setExpandedLicenseId(expandedLicenseId === leadId ? null : leadId)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded capitalize transition-all ${lead.plan.includes('teams') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200'}`}>
                                                                            {lead.plan}
                                                                        </span>
                                                                        {lead.successCount && lead.successCount > 1 && (
                                                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">{lead.successCount}x</span>
                                                                        )}
                                                                    </div>
                                                                    {expandedLicenseId === leadId && lead.licenseTypesList && lead.licenseTypesList.length > 0 && (
                                                                        <div className="flex flex-col gap-1 w-full mt-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                                                            {lead.licenseTypesList.map((lic, i) => (
                                                                                <div key={i} className="flex items-center justify-between gap-2 border border-zinc-200 px-2 py-0.5 rounded shadow-sm bg-white">
                                                                                    <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">
                                                                                        {lic.type.replace('license_', '').replace(/_/g, ' ')}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                                                                                        {lic.count}x
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${lead.priority === 1 ? 'bg-rose-50 text-rose-600 border-rose-200' : lead.priority === 2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                                        {lead.status}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => setSelectedHistoryUser({ id: lead._id || '', name: lead.name })}
                                                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ml-auto shadow-sm">
                                                                    <Clock size={12} /> History
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {displayData.length > LEADS_PER_PAGE && (
                                        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                                            <button onClick={() => setLeadsPage(p => Math.max(1, p - 1))} disabled={leadsPage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {leadsPage} of {Math.ceil(displayData.length / LEADS_PER_PAGE)}</span>
                                            <button onClick={() => setLeadsPage(p => Math.min(Math.ceil(displayData.length / LEADS_PER_PAGE), p + 1))} disabled={leadsPage === Math.ceil(displayData.length / LEADS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <Users className="mx-auto text-zinc-300 mb-4 opacity-50" size={48} />
                                    <h3 className="text-lg font-black text-zinc-900 mb-1">No Users Found</h3>
                                    <p className="text-sm text-zinc-500 font-medium">Belum ada {activeTab} users dari rentang waktu ini.</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* --- WA BLAST MODAL --- */}
                {blastModalOpen && (
                    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-xl text-zinc-900">WA Blast Configuration</h2>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                            {selectedLeads.length} Leads Selected
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setBlastModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition"><X size={20} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Message Template</label>
                                    <textarea
                                        value={blastMessage}
                                        onChange={(e) => setBlastMessage(e.target.value)}
                                        rows={5}
                                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition resize-none text-sm text-zinc-800"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBlastSchedule('now')}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${blastSchedule === 'now' ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-500/10' : 'border-zinc-200 hover:border-zinc-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Send size={16} className={blastSchedule === 'now' ? 'text-emerald-600' : 'text-zinc-400'} />
                                            <span className={`font-black text-sm ${blastSchedule === 'now' ? 'text-emerald-900' : 'text-zinc-600'}`}>Send Now</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setBlastSchedule('schedule')}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${blastSchedule === 'schedule' ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-500/10' : 'border-zinc-200 hover:border-zinc-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock size={16} className={blastSchedule === 'schedule' ? 'text-emerald-600' : 'text-zinc-400'} />
                                            <span className={`font-black text-sm ${blastSchedule === 'schedule' ? 'text-emerald-900' : 'text-zinc-600'}`}>Schedule</span>
                                        </div>
                                    </button>
                                </div>

                                {blastSchedule === 'schedule' && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={blastDateTime}
                                            onChange={(e) => setBlastDateTime(e.target.value)}
                                            className="w-full p-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition text-sm shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-zinc-100 bg-zinc-50/80 rounded-b-3xl flex justify-end gap-3 backdrop-blur-sm">
                                <button
                                    onClick={() => setBlastModalOpen(false)}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlastConfirm}
                                    disabled={blasting || (blastSchedule === 'schedule' && !blastDateTime)}
                                    className="px-6 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {blasting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                                    {blasting ? 'Processing...' : (blastSchedule === 'now' ? 'Blast Now' : 'Schedule Blast')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PAYMENT HISTORY MODAL --- */}
                <PaymentHistoryModal
                    userId={selectedHistoryUser?.id || null}
                    userName={selectedHistoryUser?.name || ''}
                    onClose={() => setSelectedHistoryUser(null)}
                />

                {/* --- USER DETAILS MODAL --- */}
                <UserDetailsModal
                    user={selectedDetailUser}
                    onClose={() => setSelectedDetailUser(null)}
                />

            </div>
        </main>
    );
}
