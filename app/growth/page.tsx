'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGrowthData } from './useGrowthData';
import PaymentHistoryModal from './PaymentHistoryModal';
import UserDetailsModal from './UserDetailsModal';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid } from 'recharts';
import { 
    Users, Target, Activity, Filter, CalendarDays, Briefcase, CreditCard, 
    ChevronRight, MessageSquare, Send, Clock, AlertCircle, Loader2, 
    ArrowLeft, DollarSign, Wallet, TrendingUp, Download, X, Repeat, Zap, UserPlus, Search, PieChart, Layers, HeartPulse, CreditCard as CardIcon
} from 'lucide-react';

interface LeadItem {
    _id?: string;
    name: string;
    full_name?: string;
    username: string;
    email: string;
    phone: string;
    phone_number?: string;
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
    licenseTypesList?: any[];
}

export default function GrowthIntelligencePage() {
    const [mounted, setMounted] = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    // --- QUARTER FILTER LOGIC ---
  const getQuarterDates = (q: number, y: number) => {
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0);
    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    return {
      start: fmt(start),
      end: fmt(end),
    };
  };
    const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
    const currentY = new Date().getFullYear();
    const defaultDates = getQuarterDates(currentQ, currentY);

    // --- FILTER STATES ---
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);
    const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
    const [selectedLicense, setSelectedLicense] = useState('All Licenses');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'leads' | 'new_regs' | 'active' | 'retention'>('leads');

    // --- UI STATES ---
    const [selectedHistoryUser, setSelectedHistoryUser] = useState<{ id: string, name: string } | null>(null);
    const [selectedDetailUser, setSelectedDetailUser] = useState<LeadItem | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [blastModalOpen, setBlastModalOpen] = useState(false);
    const [blastMessage, setBlastMessage] = useState('Halo {{name}}, \n\nKami melihat ada penawaran menarik untuk lisensi MAPID. Apakah ada yang bisa kami bantu?');
    const [blastSchedule, setBlastSchedule] = useState('now');
    const [blastDateTime, setBlastDateTime] = useState('');
    const [blasting, setBlasting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // --- DATA FETCHING ---
    const { newRegisters, paidConversions, allPayments, isLoading, isError } = useGrowthData(startDate, endDate);

    // --- UNIFIED DATA MAPPING ---
    const processedData = useMemo(() => {
        const userMap = new Map<string, LeadItem>();
        const trendsData: Record<string, { week: string, registers: number, paid: number, checkout: number }> = {};

        const getWeekKey = (dateStr: string) => {
            const d = new Date(dateStr);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const weekNum = Math.ceil(d.getDate() / 7);
            return `${monthNames[d.getMonth()]} W${weekNum}`;
        };

        // --- STEP 1: Map new registrations (users without payments yet) ---
        newRegisters.forEach((user: any) => {
            let calculatedCreatedAt = user.createdAt || user.created_on || user.createdat || '';
            if (!calculatedCreatedAt && user._id && user._id.length >= 8) {
                try {
                    const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
                    calculatedCreatedAt = new Date(timestamp).toISOString();
                } catch (e) {}
            }

            if (calculatedCreatedAt) {
                const wk = getWeekKey(calculatedCreatedAt);
                if (!trendsData[wk]) trendsData[wk] = { week: wk, registers: 0, paid: 0, checkout: 0 };
                trendsData[wk].registers += 1;
            }

            userMap.set(user._id, {
                _id: user._id,
                name: user.name || user.username || 'Unknown User',
                full_name: user.full_name || user.name || '-',
                username: user.name || user.username || '-',
                email: user.email || '-',
                phone: user.phone_number || user.phone || '-',
                phone_number: user.phone_number || user.phone || '-',
                plan: user.licenses?.[0]?.payment_type || 'No Plan',
                licenseType: user.licenses?.[0]?.license_type || '-',
                date: calculatedCreatedAt,
                createdAt: calculatedCreatedAt,
                updatedAt: user.updatedAt || calculatedCreatedAt,
                industry: user.industry || 'Not Specified',
                total: 0,
                status: 'Registered',
                successCount: 0,
                licenseTypesList: []
            });
        });

        // --- STEP 2: Merge paidConversions (payment-success API) — this has the REAL license data ---
        paidConversions.forEach((user: any) => {
            if (!user._id) return;
            const allLicenses = user.licenses || [];
            
            // Filter out 'gift' and 'academy' to ensure we only track real paid conversions
            const validLicenses = allLicenses.filter((l: any) => {
                const isGift = (l.payment_methods || '').toLowerCase().includes('gift');
                const isAcademy = (l.license_type || '').toLowerCase().includes('academy');
                return !isGift && !isAcademy;
            });

            // If user only has gift/academy licenses, do not upgrade them to Active
            if (validLicenses.length === 0) return;

            const existing = userMap.get(user._id);

            // Determine payment method from first valid license
            const firstLicense = validLicenses[0];
            const paymentMethod = firstLicense?.payment_methods || '-';
            const dateStart = firstLicense?.date_start || firstLicense?.createdAt || '';

            // Count for trends
            if (dateStart) {
                const wk = getWeekKey(dateStart);
                if (!trendsData[wk]) trendsData[wk] = { week: wk, registers: 0, paid: 0, checkout: 0 };
                trendsData[wk].paid += 1;
            }

            if (existing) {
                // Enrich existing user with real license data
                existing.status = 'Active';
                existing.successCount = validLicenses.length;
                existing.licenseTypesList = validLicenses; // Use the REAL licenses array from API
                existing.payment_methode = paymentMethod;
                existing.full_name = user.full_name || existing.full_name;
                existing.email = user.email || existing.email;
                existing.phone = user.phone_number || existing.phone;
                existing.phone_number = user.phone_number || existing.phone_number;
            } else {
                userMap.set(user._id, {
                    _id: user._id,
                    name: user.name || 'Unknown User',
                    full_name: user.full_name || user.name || '-',
                    username: user.name || '-',
                    email: user.email || '-',
                    phone: user.phone_number || '-',
                    phone_number: user.phone_number || '-',
                    plan: firstLicense?.payment_type || 'Unspecified',
                    licenseType: firstLicense?.license_type || '-',
                    date: dateStart,
                    createdAt: dateStart,
                    updatedAt: firstLicense?.updatedAt || dateStart,
                    industry: user.industry || 'Not Specified',
                    total: 0,
                    status: 'Active',
                    successCount: validLicenses.length,
                    licenseTypesList: validLicenses, // REAL licenses array
                    payment_methode: paymentMethod
                });
            }
        });

        // --- STEP 3: Layer allPayments for revenue + checkout/expired status ---
        allPayments.forEach((p: any) => {
            if (!p.user?._id) return;
            
            // Track checkout attempts
            const dateStr = p.date_in || p.createdAt || '';
            const isGift = (p.payment_methode || p.payment_type || '').toLowerCase().includes('gift');
            const isAcademy = (p.license_type || p.payment_type || '').toLowerCase().includes('academy');
            if (dateStr && !isGift && !isAcademy) {
                const wk = getWeekKey(dateStr);
                if (!trendsData[wk]) trendsData[wk] = { week: wk, registers: 0, paid: 0, checkout: 0 };
                trendsData[wk].checkout += 1;
            }

            const existing = userMap.get(p.user._id);
            const isSuccess = p.status === 'success';
            const amount = p.detail_amount?.total || p.total || 0;

            if (existing) {
                if (isSuccess) {
                    existing.total += amount;
                } else if (existing.status !== 'Active') {
                    existing.status = p.status === 'expired' ? 'Expired' : 'Checkout';
                }
            } else {
                // User only in allPayments (not in payment-success)
                // We DO NOT set them to 'Active' so they don't count towards Paid Conversions
                userMap.set(p.user._id, {
                    _id: p.user._id,
                    name: p.user.name || 'Unknown User',
                    full_name: p.user.full_name || p.user.name || '-',
                    username: p.user.name || '-',
                    email: p.user.email || '-',
                    phone: p.user.phone_number || p.user.phone || '-',
                    phone_number: p.user.phone_number || p.user.phone || '-',
                    plan: p.payment_type || 'Unspecified',
                    licenseType: p.license_type || '-',
                    date: p.date_in || p.createdAt || '',
                    createdAt: p.date_in || p.createdAt || '',
                    updatedAt: p.updatedAt || '',
                    industry: p.user.industry || 'Not Specified',
                    total: isSuccess ? amount : 0,
                    status: p.status === 'expired' ? 'Expired' : 'Checkout',
                    successCount: isSuccess ? 1 : 0,
                    licenseTypesList: p.license_type ? [{
                        license_type: p.license_type,
                        date_start: p.createdAt || p.date_in,
                        date_expired: p.date_expired || null,
                        payment_methods: p.payment_methode || p.payment_type,
                        redeem_code: p.redeem_code || ''
                    }] : [],
                    payment_methode: p.payment_methode || '-'
                });
            }
        });

        const allUsers = Array.from(userMap.values());

        // --- FILTERING ---
        let filtered = allUsers;
        if (selectedIndustry !== 'All Industries') {
            const target = selectedIndustry.replace(' & ', ' and ');
            filtered = filtered.filter(u => u.industry.includes(target) || u.industry === selectedIndustry);
        }
        if (selectedLicense !== 'All Licenses') {
            const key = selectedLicense.toLowerCase();
            filtered = filtered.filter(u => u.plan.toLowerCase().includes(key) || (u.licenseType || '').toLowerCase().includes(key));
        }

        const isCommercial = (u: LeadItem) => {
            const isGift = (u.payment_methode || '').toLowerCase().includes('gift') || (u.plan || '').toLowerCase().includes('gift');
            const isAcademy = (u.licenseType || '').toLowerCase().includes('academy') || (u.plan || '').toLowerCase().includes('academy');
            return !isGift && !isAcademy;
        };

        const leads = filtered.filter(u => (u.status === 'Checkout' || u.status === 'Expired') && isCommercial(u));
        const newRegs = filtered.filter(u => u.status === 'Registered' && u.successCount === 0);
        const active = filtered.filter(u => u.status === 'Active');
        const retention = filtered
            .filter(u => u.successCount > 1)
            .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime());

        const searchFilter = (list: LeadItem[]) => {
            if (!searchQuery) return list;
            const q = searchQuery.toLowerCase();
            return list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q)));
        };

        const industryCounts: Record<string, number> = {};
        allUsers.forEach(u => {
            if (isCommercial(u)) {
                industryCounts[u.industry] = (industryCounts[u.industry] || 0) + 1;
            }
        });
        const industryBreakdown = Object.entries(industryCounts)
            .map(([name, count]) => ({ name, count, pct: Math.round((count / (allUsers.length || 1)) * 100) }))
            .sort((a, b) => b.count - a.count);

        const midtransPaidCount = allUsers.filter(u => u.status === 'Active').length;

        return {
            leads: searchFilter(leads),
            new_regs: searchFilter(newRegs),
            active: searchFilter(active),
            retention: searchFilter(retention),
            trends: Object.values(trendsData).sort((a, b) => a.week.localeCompare(b.week)),
            industryBreakdown,
            summary: {
                totalRevenue: allUsers.reduce((sum, u) => sum + u.total, 0),
                totalUsers: allUsers.length,
                totalPaid: midtransPaidCount,
                totalCheckout: allUsers.filter(u => (u.status === 'Checkout' || u.status === 'Active' || u.status === 'Expired') && isCommercial(u)).length
            }
        };
    }, [newRegisters, paidConversions, allPayments, selectedIndustry, selectedLicense, searchQuery]);

    const licenseOptions = useMemo(() => {
        const set = new Set<string>();
        paidConversions.forEach((u: any) => {
            (u.licenses || []).forEach((l: any) => {
                if (l.license_type) set.add(l.license_type);
            });
        });
        allPayments.forEach((p: any) => {
            if (p.license_type) set.add(p.license_type);
        });
        return ['All Licenses', ...Array.from(set).sort()];
    }, [paidConversions, allPayments]);

    const displayList = useMemo(() => {
        const list = [...processedData[activeTab]];
        list.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt).getTime() || 0;
            const dateB = new Date(b.date || b.createdAt).getTime() || 0;
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return list;
    }, [processedData, activeTab, sortOrder]);

    const exportCsv = () => {
        if (!displayList.length) return;
        const headers = "Name,Full Name,Email,Phone,Plan,Status,Industry,Date\n";
        const csv = displayList.map(u => `"${u.name}","${u.full_name || ''}","${u.email}","${u.phone}","${u.plan}","${u.status}","${u.industry}","${new Date(u.date).toLocaleDateString()}"`).join('\n');
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `growth-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleBlastConfirm = async () => {
        setBlasting(true);
        const contacts = displayList.filter(u => selectedContacts.includes(u._id || u.name));
        try {
            await fetch('/api/n8n/blast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts, messageTemplate: blastMessage, schedule: blastSchedule === 'schedule' ? blastDateTime : null })
            });
            alert('Blast payload sent!');
            setBlastModalOpen(false);
            setSelectedContacts([]);
        } catch (error) {
            alert('Blast failed.');
        } finally {
            setBlasting(false);
        }
    };

    const scrollToTable = () => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleFunnelClick = (tab: 'leads' | 'active') => {
        setActiveTab(tab);
        setCurrentPage(1);
        scrollToTable();
    };

    if (!mounted) return null;

    const conversionRate = Math.round((processedData.summary.totalPaid / (processedData.summary.totalCheckout || 1)) * 1000) / 10;

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900">
            {/* HEADER */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-black text-xl tracking-tight">Growth Intelligence Hub</h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Performance & Blast Operations</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Quarter Buttons */}
                        {[1, 2, 3, 4].map(q => {
                            const dates = getQuarterDates(q, currentY);
                            const isActive = startDate === dates.start && endDate === dates.end;
                            return (
                                <button key={q} onClick={() => { setStartDate(dates.start); setEndDate(dates.end); }}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${isActive ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>
                                    Q{q}
                                </button>
                            );
                        })}
                        <div className="hidden md:block w-px h-6 bg-zinc-200 mx-1"></div>
                        {/* Date Range Inputs */}
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-[10px] font-black outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
                            <span className="text-zinc-300 font-black">—</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-[10px] font-black outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
                
                {/* --- 1. DASHBOARD OVERVIEW --- */}
                <section className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
                        {/* REVENUE CARD */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group flex flex-col justify-center">
                            <Wallet className="absolute -right-12 -bottom-12 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={360} />
                            <div className="relative z-10">
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6">Total Platform Revenue</p>
                                <p className="text-5xl md:text-6xl font-black tracking-tighter">Rp {processedData.summary.totalRevenue.toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        {/* FUNNEL CARDS */}
                        <div className="flex flex-col gap-4 justify-center items-center py-4">
                            <div 
                                onClick={() => handleFunnelClick('leads')}
                                className="w-full max-w-[400px] bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm flex items-center justify-between relative z-30 transform hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group/card"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover/card:bg-blue-600 group-hover/card:text-white transition-colors">
                                        <CardIcon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 1: Top of Funnel</p>
                                        <h3 className="font-black text-zinc-900 text-lg">Checkout Initiated</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-zinc-900 tracking-tighter">{processedData.summary.totalCheckout}</span>
                                    <ChevronRight className="text-zinc-300 group-hover/card:text-blue-500 group-hover/card:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>

                            <div className="w-px h-8 bg-zinc-200 relative z-10"></div>

                            <div 
                                onClick={() => handleFunnelClick('active')}
                                className="w-[92%] max-w-[370px] bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm flex items-center justify-between relative z-20 transform hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group/card"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover/card:bg-emerald-600 group-hover/card:text-white transition-colors">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 2: Activation</p>
                                        <h3 className="font-black text-zinc-900 text-lg">Paid Conversions</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-zinc-900 tracking-tighter">{processedData.summary.totalPaid}</span>
                                    <ChevronRight className="text-zinc-300 group-hover/card:text-emerald-500 group-hover/card:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>

                            <div className="w-px h-8 bg-zinc-200 relative z-10"></div>

                            <div className="w-[84%] max-w-[340px] bg-zinc-900 p-7 rounded-[2rem] shadow-2xl flex items-center justify-between relative z-10 border border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-zinc-800 text-emerald-400 rounded-2xl">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Step 3: Bottom of Funnel</p>
                                        <h3 className="font-black text-white text-lg">Final Conversion</h3>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-emerald-400 tracking-tighter">{conversionRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 bg-white border border-zinc-200 p-10 rounded-[3rem] shadow-sm h-80">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Registration & Conversion Trends</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Reg</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Checkout</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Paid</span></div>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="70%">
                                <BarChart data={processedData.trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="week" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                                        labelStyle={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: '#94a3b8' }}
                                    />
                                    <Bar dataKey="registers" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="checkout" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="paid" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-zinc-200 p-10 rounded-[3rem] shadow-sm flex flex-col h-80">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-10 flex items-center gap-2">
                                <Briefcase size={14} /> Industry Segments
                            </h4>
                            <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                {processedData.industryBreakdown.slice(0, 5).map((ind, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[11px] font-black mb-2 uppercase tracking-tight">
                                                <span className="truncate pr-2 text-zinc-500">{ind.name}</span>
                                                <span className="text-zinc-900">{ind.pct}%</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-zinc-900" style={{ width: `${ind.pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-zinc-200" />

                {/* --- 2. CONTACT HUB (BLAST OPERATIONS) --- */}
                <section ref={tableRef} className="space-y-6 scroll-mt-24">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-zinc-900">
                            <Layers className="text-blue-500" />
                            Contact Hub & Blast Operations
                        </h2>
                        
                        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                            {(['leads', 'new_regs', 'active', 'retention'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setCurrentPage(1); setSelectedContacts([]); }}
                                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                                />
                            </div>
                            
                            <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-4 text-xs font-bold outline-none">
                                <option value="All Industries">All Industries</option>
                                <option value="Research & Education">Research & Education</option>
                                <option value="Info Technology">Info Technology</option>
                                <option value="Government">Government</option>
                                <option value="Real Estate & Arch">Real Estate & Arch</option>
                                <option value="Retail & Fashion">Retail & Fashion</option>
                                <option value="Not Specified">Not Specified</option>
                            </select>

                            <select value={selectedLicense} onChange={(e) => setSelectedLicense(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-4 text-xs font-bold outline-none">
                                {licenseOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
                                className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest px-4 py-4 rounded-2xl flex items-center gap-2 transition-all"
                            >
                                <svg className={`w-4 h-4 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={exportCsv}
                                    disabled={displayList.length === 0}
                                    className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest px-6 py-4 rounded-2xl disabled:opacity-50 shadow-sm flex items-center gap-2 transition-all"
                                >
                                    <Download size={16} /> Export
                                </button>
                                <button
                                    onClick={() => setBlastModalOpen(true)}
                                    disabled={selectedContacts.length === 0}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl disabled:opacity-50 shadow-xl shadow-emerald-100 flex items-center gap-3 transition-all transform active:scale-95"
                                >
                                    <MessageSquare size={18} /> Blast ({selectedContacts.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-32 flex flex-col items-center justify-center gap-4 text-zinc-400">
                                <Loader2 className="animate-spin" size={48} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Processing Data...</p>
                            </div>
                        ) : displayList.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 border-b border-zinc-200">
                                            <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                                                <th className="px-8 py-6 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContacts.length === displayList.length && displayList.length > 0}
                                                        onChange={(e) => setSelectedContacts(e.target.checked ? displayList.map(u => u._id || u.name) : [])}
                                                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                    />
                                                </th>
                                                <th className="px-6 py-6">User Profile</th>
                                                <th className="px-6 py-6">Contact Details</th>
                                                <th className="px-6 py-6">Current Status</th>
                                                <th className="px-6 py-6">Industry</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {displayList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((user, idx) => (
                                                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors group">
                                                    <td className="px-8 py-7">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedContacts.includes(user._id || user.name)}
                                                            onChange={(e) => setSelectedContacts(e.target.checked ? [...selectedContacts, user._id || user.name] : selectedContacts.filter(id => id !== (user._id || user.name)))}
                                                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-7 cursor-pointer" onClick={() => setSelectedDetailUser(user)}>
                                                        <p className="font-black text-zinc-900 group-hover:text-blue-600 transition decoration-2 underline-offset-4 group-hover:underline">{user.full_name || user.name}</p>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1.5">{new Date(user.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <p className="font-bold text-zinc-600 text-xs">{user.email}</p>
                                                        <p className="text-[11px] text-zinc-400 font-medium mt-1">{user.phone_number || user.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border shadow-sm ${
                                                            user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            user.status === 'Checkout' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-7">
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">{user.industry}</p>
                                                    </td>
                                                    <td className="px-8 py-7 text-right">
                                                        <button onClick={() => setSelectedHistoryUser({ id: user._id || '', name: user.name })} className="p-3 bg-white border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white rounded-2xl transition-all shadow-sm">
                                                            <Clock size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-zinc-200 text-zinc-600 rounded-2xl disabled:opacity-50 hover:shadow-lg transition-all">Previous</button>
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">Page {currentPage} of {Math.ceil(displayList.length / ITEMS_PER_PAGE)}</p>
                                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(displayList.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(displayList.length / ITEMS_PER_PAGE)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-zinc-200 text-zinc-600 rounded-2xl disabled:opacity-50 hover:shadow-lg transition-all">Next</button>
                                </div>
                            </>
                        ) : (
                            <div className="p-40 text-center space-y-6">
                                <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto border border-zinc-100">
                                    <Users className="text-zinc-200" size={48} />
                                </div>
                                <div>
                                    <h3 className="font-black text-zinc-900 text-xl tracking-tight">No matching contacts</h3>
                                    <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto">Your filters might be too restrictive. Try broadening your criteria.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* BLAST MODAL */}
            {blastModalOpen && (
                <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-zinc-100 flex justify-between items-start shrink-0">
                            <div>
                                <h2 className="font-black text-3xl text-zinc-900 tracking-tight">Broadcast Blast</h2>
                                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2">{selectedContacts.length} Selected Recipients</p>
                            </div>
                            <button onClick={() => setBlastModalOpen(false)} className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all"><X size={28} /></button>
                        </div>
                        <div className="p-12 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Message Body</label>
                                <textarea
                                    value={blastMessage}
                                    onChange={(e) => setBlastMessage(e.target.value)}
                                    rows={6}
                                    placeholder="Write your message here... Use {{name}} for dynamic names."
                                    className="w-full p-8 bg-zinc-50 border-2 border-zinc-50 rounded-[2.5rem] focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none font-medium text-base transition-all resize-none shadow-inner"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <button onClick={() => setBlastSchedule('now')} className={`p-8 rounded-[2rem] border-2 transition-all text-left group ${blastSchedule === 'now' ? 'border-emerald-500 bg-emerald-50/50 shadow-2xl shadow-emerald-100' : 'border-zinc-50 bg-zinc-50/30 hover:border-zinc-200'}`}>
                                    <Send size={24} className={`mb-4 ${blastSchedule === 'now' ? 'text-emerald-500' : 'text-zinc-300'}`} />
                                    <p className={`font-black text-sm uppercase tracking-widest ${blastSchedule === 'now' ? 'text-zinc-900' : 'text-zinc-400'}`}>Instant</p>
                                </button>
                                <button onClick={() => setBlastSchedule('schedule')} className={`p-8 rounded-[2rem] border-2 transition-all text-left group ${blastSchedule === 'schedule' ? 'border-emerald-500 bg-emerald-50/50 shadow-2xl shadow-emerald-100' : 'border-zinc-50 bg-zinc-50/30 hover:border-zinc-200'}`}>
                                    <Clock size={24} className={`mb-4 ${blastSchedule === 'schedule' ? 'text-emerald-500' : 'text-zinc-300'}`} />
                                    <p className={`font-black text-sm uppercase tracking-widest ${blastSchedule === 'schedule' ? 'text-zinc-900' : 'text-zinc-400'}`}>Schedule</p>
                                </button>
                            </div>
                            {blastSchedule === 'schedule' && (
                                <input type="datetime-local" value={blastDateTime} onChange={(e) => setBlastDateTime(e.target.value)} className="w-full p-8 bg-white border-4 border-zinc-50 rounded-[2.5rem] font-black text-sm shadow-sm focus:border-emerald-500 outline-none transition-all" />
                            )}
                        </div>
                        <div className="p-10 bg-zinc-50/50 border-t border-zinc-100 flex justify-end gap-6 shrink-0">
                            <button onClick={() => setBlastModalOpen(false)} className="px-10 py-5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition">Cancel</button>
                            <button onClick={handleBlastConfirm} disabled={blasting} className="px-14 py-5 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-emerald-600 transition shadow-2xl shadow-emerald-200 flex items-center gap-4 active:scale-95 disabled:opacity-50">
                                {blasting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                {blasting ? 'Transmitting...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <PaymentHistoryModal userId={selectedHistoryUser?.id || null} userName={selectedHistoryUser?.name || ''} onClose={() => setSelectedHistoryUser(null)} />
            <UserDetailsModal user={selectedDetailUser} onClose={() => setSelectedDetailUser(null)} />
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
            `}</style>
        </main>
    );
}