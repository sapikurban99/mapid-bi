'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useGrowthData } from './useGrowthData';
import PaymentHistoryModal from './PaymentHistoryModal';
import UserDetailsModal from './UserDetailsModal';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Target, Activity, Expand, Minimize, Settings2, Download, Table, X, Filter, CalendarDays, Briefcase, CreditCard, ChevronRight, MessageSquare, Send, Clock, AlertCircle, Loader2, ArrowLeft, DollarSign, Wallet, TrendingUp } from 'lucide-react';

interface TrendItem {
    date: string;
    regist: number;
    conv: number;
    industry: string;
    license: string;
    payment_methode?: string;
    week?: string;
}

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
    successCount?: number;
    licenseTypesList?: { type: string, count: number }[];
}

export default function UserGrowthIntelligencePage() {
    // Agregasi Data Tren (Helper for labels)
    const currentMonthName = useMemo(() => {
        return new Date().toLocaleString('id-ID', { month: 'short' });
    }, []);

    const currentQuarter = useMemo(() => {
        return Math.floor(new Date().getMonth() / 3) + 1;
    }, []);

    const dynamicFilterOptions = useMemo(() => ({
        timeRanges: [
            { label: `Bulan Ini (${currentMonthName})`, value: 'this_month' },
            { label: 'Hari Ini', value: 'today' },
            { label: '7 Hari Terakhir', value: '7d' },
            { label: `Kuartal Ini (Q${currentQuarter})`, value: 'this_quarter' },
            { label: 'Semua Waktu', value: 'all' },
            { label: 'Custom Range...', value: 'custom' },
        ],
        industries: ['All Industries', 'Research & Education', 'Info Technology', 'Government', 'Real Estate & Arch', 'Retail & Fashion', 'Not Specified'],
        licenses: ['All Licenses', 'Personal', 'Teams'],
        paymentMethods: ['All Methods', 'Midtrans', 'Gift', 'No License']
    }), [currentMonthName, currentQuarter]);

    // --- STATE MANAGEMENT UNTUK FILTER ---
    const [selectedTime, setSelectedTime] = useState('this_month');
    const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
    const [selectedLicense, setSelectedLicense] = useState('All Licenses');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Methods');
    const [showFilterPanel, setShowFilterPanel] = useState(true);
    const [leadsFilters, setLeadsFilters] = useState({ name: '', industry: '', email: '', plan: '', status: '' });
    const [newRegFilters, setNewRegFilters] = useState({ name: '', email: '', industry: '' });
    const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(null);

    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectedRegisters, setSelectedRegisters] = useState<string[]>([]);
    const [selectedHistoryUser, setSelectedHistoryUser] = useState<{ id: string, name: string } | null>(null);
    const [selectedDetailUser, setSelectedDetailUser] = useState<LeadItem | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // State untuk Custom Filter
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // --- STATE UNTUK WA BLAST ---
    const [blastModalOpen, setBlastModalOpen] = useState(false);
    const [blastMessage, setBlastMessage] = useState('Halo {{name}}, \n\nKami melihat Anda belum menyelesaikan pembayaran untuk lisensi {{plan}} MAPID. Apakah ada yang bisa kami bantu?');
    const [blastSchedule, setBlastSchedule] = useState('now'); // 'now' | 'schedule'
    const [blastDateTime, setBlastDateTime] = useState('');
    const [blasting, setBlasting] = useState(false);

    // --- STATE UNTUK PAGINATION ---
    const [leadsPage, setLeadsPage] = useState(1);
    const [newRegistersPage, setNewRegistersPage] = useState(1);
    const [successPaymentsPage, setSuccessPaymentsPage] = useState(1);
    const LEADS_PER_PAGE = 10;
    const NEW_REGISTERS_PER_PAGE = 10;
    const SUCCESS_PAYMENTS_PER_PAGE = 10;

    const successTableRef = useRef<HTMLDivElement>(null);

    const [blastType, setBlastType] = useState<'leads' | 'registers'>('leads');

    const handleBlastConfirm = async () => {
        setBlasting(true);
        const sourceData = blastType === 'leads' ? displayLeads : displayNewRegs;
        const selectedIds = blastType === 'leads' ? selectedLeads : selectedRegisters;
        // Fallback email to ID if email is not available in real data
        const contacts = sourceData.filter(l => selectedIds.includes(l._id || l.name || l.email));

        try {
            const res = await fetch('/api/n8n/blast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contacts: contacts,
                    messageTemplate: blastMessage,
                    schedule: (blastSchedule === 'schedule' && blastDateTime) 
                        ? (blastDateTime.length === 16 ? `${blastDateTime}:00` : blastDateTime) 
                        : null
                })
            });
            const data = await res.json();
            console.log('Blast payload sent:', data);

            alert('Blast payload successfully sent to n8n Webhook!');
            setBlastModalOpen(false);
            setSelectedLeads([]);
            setSelectedRegisters([]);
        } catch (error) {
            console.error('Blast failed:', error);
            alert('Failed to send blast payload.');
        } finally {
            setBlasting(false);
        }
    };

    // --- LOGIKA DATE RANGE ---
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

    // Fetch data using hook
    const { newRegisters, paidConversions, allPayments, isLoading, isError } = useGrowthData(startDate, endDate);

    // --- LOGIKA FILTERING DATA (Disesuaikan dengan format JSON) ---
    const filteredData = useMemo(() => {
        let trends: TrendItem[] = [];
        let leads: LeadItem[] = [];

        // 1. Mapping New Registrations (API 1)
        // Format JSON: { _id, full_name, created_on, ... }
        if (Array.isArray(newRegisters)) {
            newRegisters.forEach((user: any) => {
                let dateStr = user.created_on?.split('T')[0] || user.createdAt?.split('T')[0] || '';

                if (!dateStr && user.licenses && user.licenses.length > 0) {
                    dateStr = user.licenses[0].createdAt?.split('T')[0] || user.licenses[0].date_start?.split('T')[0] || '';
                }

                // Fallback: Extract from MongoDB _id if date is still missing
                if (!dateStr && user._id && user._id.length >= 8) {
                    try {
                        const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
                        if (!isNaN(timestamp)) {
                            dateStr = new Date(timestamp).toISOString().split('T')[0];
                        }
                    } catch (e) {
                         // ignore
                    }
                }

                if (dateStr) {
                    const hasLicense = user.licenses && user.licenses.length > 0;
                    let licenseType = '';

                    if (hasLicense) {
                        const lic = user.licenses[0];
                        if (lic.payment_type?.toLowerCase().includes('enterprise') || lic.license_type?.toLowerCase().includes('enterprise')) {
                            licenseType = 'Enterprise';
                        } else if (lic.payment_type?.toLowerCase().includes('team') || lic.license_type?.toLowerCase().includes('team')) {
                            licenseType = 'Teams';
                        } else {
                            licenseType = 'Personal';
                        }
                    }

                    const paymentMethod = hasLicense ? user.licenses[0].payment_methods : undefined;
                    
                    trends.push({
                        date: dateStr,
                        regist: 1,
                        conv: (hasLicense && paymentMethod === 'midtrans') ? 1 : 0,
                        industry: user.industry || 'Not Specified', // JSON tidak ada field industry, set default
                        license: licenseType,
                        payment_methode: paymentMethod
                    });
                }
            });
        }

        // 2. Mapping Paid Conversions (API 2) for Chart Plotting
        // Only push conversion events if they happen on different dates or by different users, 
        // avoiding double counting with newRegisters by relying solely on the date string
        if (Array.isArray(paidConversions)) {
            paidConversions.forEach((payment: any) => {
                const licenses = payment.licenses || [];

                if (licenses.length > 0) {
                    licenses.forEach((lic: any) => {
                        const dateStr = lic.createdAt?.split('T')[0] || lic.date_start?.split('T')[0] || '';

                        let licenseType = 'Personal';
                        if (lic.payment_type?.toLowerCase().includes('enterprise') || lic.license_type?.toLowerCase().includes('enterprise')) {
                            licenseType = 'Enterprise';
                        } else if (lic.payment_type?.toLowerCase().includes('team') || lic.license_type?.toLowerCase().includes('team')) {
                            licenseType = 'Teams';
                        }

                        if (dateStr) {
                            trends.push({
                                date: dateStr,
                                regist: 0,
                                conv: lic.payment_methods === 'midtrans' ? 1 : 0,
                                industry: payment.industry || 'Not Specified',
                                license: licenseType,
                                payment_methode: lic.payment_methods
                            });
                        }
                    });
                }
            });
        }

        // 3. Mapping Unified Directory (Leads & Active Users)
        // 3. Mapping Unified Directory (Leads & Active Users)
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

                if (!calculatedCreatedAt && user._id && user._id.length >= 8) {
                    try {
                        const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
                        if (!isNaN(timestamp)) {
                            calculatedCreatedAt = new Date(timestamp).toISOString();
                        }
                    } catch (e) {
                         // ignore
                    }
                }

                if (!calculatedUpdatedAt) calculatedUpdatedAt = calculatedCreatedAt;

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
                    payment_methode: firstLicense?.payment_methods,
                    successCount: 0, // Calculated below
                    licenseTypesList: []
                });
            });
        }

        // Second, add or merge all payments
        if (Array.isArray(allPayments)) {
            allPayments.forEach((p: any) => {
                if (p.user && p.user._id) {
                    const existing = leadsMap.get(p.user._id);

                    // If user exists, we only update if payment is unpaid/failed and they are currently 'No License'
                    // Or we just add them as a new "Unpaid Checkout" lead if they aren't in registers
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
                        // User exists and had a successful payment, update their details just in case they are missing contacts
                        leadsMap.set(p.user._id, {
                            ...existing,
                            email: existing.email !== '-' ? existing.email : (p.user.email || '-'),
                            phone: existing.phone !== '-' ? existing.phone : (p.user.phone_number || p.user.phone || '-'),
                            payment_methode: p.payment_methode || existing.payment_methode
                        });
                    }
                }
            });
        }

        leads = Array.from(leadsMap.values());
        // Sort highest priority (Unpaid/Failed = 1) first
        leads.sort((a, b) => (a.priority || 3) - (b.priority || 3));

        // --- GROUPING & FILTERING ---

        // Fungsi untuk mengelompokkan berdasarkan Minggu (Week)
        const getWeekNumber = (d: Date) => {
            const std = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d.getTime() - std.getTime()) / (24 * 60 * 60 * 1000));
            return Math.ceil((d.getDay() + 1 + days) / 7);
        };

        trends.forEach(t => {
            const d = new Date(t.date);
            // Menggabungkan bulan dan minggu agar lebih unik
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            t.week = `${monthNames[d.getMonth()]} W${getWeekNumber(d) % 4 || 4}`;
        });

        // Filter Industri
        if (selectedIndustry !== 'All Industries') {
            let targetIndustry = selectedIndustry;
            if (selectedIndustry === 'Research & Education') targetIndustry = 'Research and Education';
            else if (selectedIndustry === 'Info Technology') targetIndustry = 'Information Technology and Services';
            else if (selectedIndustry === 'Real Estate & Arch') targetIndustry = 'Real Estate and Architecture';
            else if (selectedIndustry === 'Retail & Fashion') targetIndustry = 'Retail and Fashion';

            trends = trends.filter(d => d.industry === targetIndustry);
            leads = leads.filter(d => d.industry === targetIndustry);
        }

        // Filter Lisensi (Hanya berdampak pada Konversi & Leads)
        if (selectedLicense !== 'All Licenses') {
            const licenseKey = selectedLicense === 'Teams' ? 'team' : 'personal';

            leads = leads.filter(d =>
                (d.plan || '').toLowerCase().includes(licenseKey) ||
                (d.licenseType || '').toLowerCase().includes(licenseKey)
            );
            trends = trends.map(d => ({
                ...d,
                conv: (d.license || '').toLowerCase().includes(licenseKey) || (d.license || '').toLowerCase().includes(selectedLicense.toLowerCase()) ? d.conv : 0
            }));
        }

        // --- FILTER NEW REGISTERS SEPARATELY ---
        let filteredNewRegistersData: any[] = [];
        if (Array.isArray(newRegisters)) {
            filteredNewRegistersData = newRegisters.filter(user => {

                // Apply industry filter if needed
                let targetIndustry = selectedIndustry;
                if (selectedIndustry === 'Research & Education') targetIndustry = 'Research and Education';
                else if (selectedIndustry === 'Info Technology') targetIndustry = 'Information Technology and Services';
                else if (selectedIndustry === 'Real Estate & Arch') targetIndustry = 'Real Estate and Architecture';
                else if (selectedIndustry === 'Retail & Fashion') targetIndustry = 'Retail and Fashion';

                if (selectedIndustry !== 'All Industries' && user.industry !== targetIndustry) {
                    return false;
                }
                return true;
            });
        }

        // Filter Payment Method
        if (selectedPaymentMethod !== 'All Methods') {
            if (selectedPaymentMethod === 'No License') {
                leads = leads.filter(d => d.status === 'No License' || !d.payment_methode);
                trends = trends.map(d => ({
                    ...d,
                    conv: 0, // No license means no paid conversion
                    regist: (!d.payment_methode || d.payment_methode === '') ? d.regist : 0
                }));
            } else {
                leads = leads.filter(d =>
                    (d.payment_methode || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase())
                );
                trends = trends.map(d => ({
                    ...d,
                    conv: (d.payment_methode || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase()) ? d.conv : 0,
                    regist: (d.payment_methode || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase()) ? d.regist : 0
                }));
            }
        }

        // Agregasi Data Tren
        const aggregatedTrendsMap = trends.reduce((acc, curr) => {
            const w = curr.week || 'Unknown';
            if (!acc[w]) {
                acc[w] = { week: w, regist: 0, conv: 0 };
            }
            acc[w].regist += curr.regist;
            acc[w].conv += curr.conv;
            return acc;
        }, {} as Record<string, { week: string; regist: number; conv: number }>);

        // Urutkan Array secara chronological sederhana (berdasarkan key string)
        const aggregatedTrends = Object.values(aggregatedTrendsMap).sort((a, b) => a.week.localeCompare(b.week));

        // Kalkulasi Revenue
        let totalRevenue = 0;
        let successTransactions = 0;
        const successPaymentsList: any[] = [];
        
        if (Array.isArray(allPayments)) {
            allPayments.forEach((p: any) => {
                if (p.status === 'success') {
                    let targetIndustry = selectedIndustry;
                    if (selectedIndustry === 'Research & Education') targetIndustry = 'Research and Education';
                    else if (selectedIndustry === 'Info Technology') targetIndustry = 'Information Technology and Services';
                    else if (selectedIndustry === 'Real Estate & Arch') targetIndustry = 'Real Estate and Architecture';
                    else if (selectedIndustry === 'Retail & Fashion') targetIndustry = 'Retail and Fashion';

                    const matchIndustry = selectedIndustry === 'All Industries' || p.user?.industry === targetIndustry;
                    
                    const pLicense = (p.license_type || p.payment_type || '').toLowerCase();
                    const filterLicenseKey = selectedLicense === 'Teams' ? 'team' : 'personal';
                    const matchLicense = selectedLicense === 'All Licenses' || pLicense.includes(filterLicenseKey);
                    
                    const matchPaymentMethod = selectedPaymentMethod === 'All Methods' || (selectedPaymentMethod !== 'No License' && (p.payment_methode || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase()));
                    const isMidtrans = p.payment_methode?.toLowerCase() === 'midtrans';
                    
                    if (matchIndustry && matchLicense && matchPaymentMethod && isMidtrans) {
                        const amount = p.detail_amount?.total || p.detail_amount?.price || p.total || 0;
                        totalRevenue += amount;
                        successTransactions += 1;
                        successPaymentsList.push(p);
                    }
                }
            });
        }

        // Kalkulasi Headlines (Ensure no negative values)
        const totalNewRegisters = trends.reduce((sum, curr) => sum + curr.regist, 0);
        const totalPaidConversions = trends.reduce((sum, curr) => sum + curr.conv, 0);
        const unpaidCheckouts = Math.max(0, leads.length);

        // Breakdown Industri
        const industryCounts = trends.reduce((acc, curr) => {
            if (curr.regist > 0) acc[curr.industry] = (acc[curr.industry] || 0) + curr.regist;
            return acc;
        }, {} as Record<string, number>);

        const totalRegistForInd = Object.values(industryCounts).reduce((sum, c) => sum + c, 0);
        const industryBreakdown = Object.entries(industryCounts)
            .map(([name, count]) => ({ name, pct: totalRegistForInd > 0 ? Math.round((count / totalRegistForInd) * 100) : 0 }))
            .sort((a, b) => b.pct - a.pct);

        // Breakdown Lisensi
        const licenseCounts = trends.reduce((acc, curr) => {
            if (curr.conv > 0 && curr.license) {
                acc[curr.license] = (acc[curr.license] || 0) + curr.conv;
            }
            return acc;
        }, {} as Record<string, number>);

        const totalConvForLic = Object.values(licenseCounts).reduce((sum, c) => sum + c, 0);

        return {
            headlines: { newRegisters: totalNewRegisters, paidConversions: totalPaidConversions, unpaidCheckouts, totalRevenue, successTransactions, successPaymentsList },
            trends: aggregatedTrends,
            industryBreakdown: industryBreakdown.slice(0, 5),
            licenseBreakdown: {
                personal: totalConvForLic > 0 ? Math.round(((licenseCounts['Personal'] || 0) / totalConvForLic) * 100) : 0,
                teams: totalConvForLic > 0 ? Math.round(((licenseCounts['Teams'] || 0) / totalConvForLic) * 100) : 0,
            },
            unpaidLeads: leads,
            filteredNewRegisters: filteredNewRegistersData
        };

    }, [newRegisters, paidConversions, allPayments, selectedIndustry, selectedLicense, selectedPaymentMethod]);

    // Helpers untuk Grafik & State
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedTime !== 'this_month') count++;
        if (selectedIndustry !== 'All Industries') count++;
        if (selectedLicense !== 'All Licenses') count++;
        if (selectedPaymentMethod !== 'All Methods') count++;
        if (selectedTime === 'custom' && customStartDate && customEndDate) count++;
        return count;
    }, [selectedTime, selectedIndustry, selectedLicense, selectedPaymentMethod, customStartDate, customEndDate]);

    const resetFilters = () => {
        setSelectedTime('this_month');
        setSelectedIndustry('All Industries');
        setSelectedLicense('All Licenses');
        setSelectedPaymentMethod('All Methods');
        setCustomStartDate('');
        setCustomEndDate('');
        setLeadsFilters({ name: '', industry: '', email: '', plan: '', status: '' });
        setLeadsPage(1);
        setNewRegistersPage(1);
        setSuccessPaymentsPage(1);
        setSelectedLeads([]);
        setSelectedRegisters([]);
    };

    // --- SECONDARY FILTERING FOR PER-COLUMN ---
    const displayLeads = useMemo(() => {
        return filteredData.unpaidLeads.filter(lead => {
            if (leadsFilters.name && !lead.name.toLowerCase().includes(leadsFilters.name.toLowerCase())) return false;
            if (leadsFilters.industry && !lead.industry.toLowerCase().includes(leadsFilters.industry.toLowerCase())) return false;
            if (leadsFilters.email && !lead.email.toLowerCase().includes(leadsFilters.email.toLowerCase()) && !lead.phone.toLowerCase().includes(leadsFilters.email.toLowerCase())) return false;
            if (leadsFilters.plan && !lead.plan.toLowerCase().includes(leadsFilters.plan.toLowerCase()) && !(lead.licenseType && lead.licenseType.toLowerCase().includes(leadsFilters.plan.toLowerCase()))) return false;
            if (leadsFilters.status && !lead.status.toLowerCase().includes(leadsFilters.status.toLowerCase())) return false;
            return true;
        });
    }, [filteredData.unpaidLeads, leadsFilters]);

    const displayNewRegs = useMemo(() => {
        return filteredData.filteredNewRegisters.filter(user => {
            const name = user.full_name || user.name || '';
            const email = user.email || '';
            const phone = user.phone_number || user.phone || '';
            const industry = user.industry || '';

            if (newRegFilters.name && !name.toLowerCase().includes(newRegFilters.name.toLowerCase())) return false;
            if (newRegFilters.email && !email.toLowerCase().includes(newRegFilters.email.toLowerCase()) && !phone.toLowerCase().includes(newRegFilters.email.toLowerCase())) return false;
            if (newRegFilters.industry && !industry.toLowerCase().includes(newRegFilters.industry.toLowerCase())) return false;
            return true;
        });
    }, [filteredData.filteredNewRegisters, newRegFilters]);

    return (
        <main className="min-h-screen bg-zinc-50 font-sans pb-24 text-zinc-900 selection:bg-zinc-900 selection:text-white">

            {/* HEADER */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition text-zinc-500 hover:text-zinc-900">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="font-black text-xl tracking-tight">User Growth Intelligence</h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">B2C Platform Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/growth/active-users" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300">
                            Active & Retention Users
                        </Link>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition relative ${showFilterPanel ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                        >
                            <Filter size={14} />
                            {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                            {activeFilterCount > 0 && !showFilterPanel && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md">{activeFilterCount}</div>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

                {/* --- GLOBAL FILTER PANEL --- */}
                {showFilterPanel && (
                    <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-5 pb-5 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-900"><Filter size={18} /></div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Global Filters</h2>
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters} className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors">
                                    <X size={14} /> Reset Filters ({activeFilterCount})
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Time Range Filter */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Time Range</label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {dynamicFilterOptions.timeRanges.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>

                                {selectedTime === 'custom' && (
                                    <div className="flex items-center gap-2 mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-all"
                                        />
                                        <span className="text-zinc-400 font-bold">-</span>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Industry Filter */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Industry Segment</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    <select
                                        value={selectedIndustry}
                                        onChange={(e) => setSelectedIndustry(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {dynamicFilterOptions.industries.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* License Filter */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Converted License Type</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    <select
                                        value={selectedLicense}
                                        onChange={(e) => setSelectedLicense(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {dynamicFilterOptions.licenses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Payment Method Filter */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Payment Method</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    <select
                                        value={selectedPaymentMethod}
                                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {dynamicFilterOptions.paymentMethods.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* --- DATA DISPLAY AREA --- */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-16 animate-in fade-in bg-white border border-zinc-200 rounded-2xl shadow-sm h-64">
                        <Loader2 className="animate-spin text-zinc-400 mb-4" size={40} />
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Fetching Live Data</p>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center p-16 animate-in fade-in bg-white border border-rose-200 rounded-2xl shadow-sm text-rose-500 text-center h-64">
                        <AlertCircle className="mb-4 text-rose-300" size={48} strokeWidth={1.5} />
                        <h3 className="text-xl font-black mb-2 text-rose-900">Failed to Fetch Data</h3>
                        <p className="text-sm max-w-sm text-rose-600/80 mb-6">Terdapat masalah saat mengambil data dari server. Pastikan API aktif.</p>
                        <button onClick={resetFilters} className="text-xs font-bold uppercase tracking-widest bg-rose-100 text-rose-900 px-6 py-3 rounded-xl hover:bg-rose-200 transition">Try Again</button>
                    </div>
                ) : filteredData.headlines.newRegisters === 0 && filteredData.unpaidLeads.length === 0 ? (
                    <section className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-sm animate-in fade-in">
                        <AlertCircle className="mx-auto text-zinc-300 mb-4" size={48} strokeWidth={1.5} />
                        <h3 className="text-xl font-black text-zinc-900 mb-2">No Data Match</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">Kombinasi filter Anda terlalu spesifik atau tidak ada data pada rentang waktu tersebut.</p>
                        <button onClick={resetFilters} className="text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition shadow-lg">Reset Filters</button>
                    </section>
                ) : (
                    <>
                        {/* REVENUE DASHBOARD */}
                        <section className="animate-in fade-in duration-500 mb-8 mt-2">
                            <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2 text-zinc-900 border-b border-zinc-200 pb-3">
                                <Wallet className="text-emerald-500" size={24} /> 
                                Revenue Overview
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Total Revenue */}
                                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group hover:shadow-xl hover:scale-[1.01] transition-all">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="text-8xl font-black text-emerald-400 italic">Rp</span>
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-white/10 rounded-xl text-emerald-400 backdrop-blur-sm px-3"><span className="text-sm font-black italic">Rp</span></div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Total Revenue (Midtrans)</h4>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 mb-1 tracking-widest uppercase">IDR</p>
                                            <div className="text-4xl font-black tracking-tighter text-white drop-shadow-md truncate">
                                                {filteredData.headlines.totalRevenue.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Success Transactions */}
                                <div 
                                    onClick={() => {
                                        successTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between cursor-pointer group"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-100 transition-colors"><Activity size={20} /></div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Success Transactions</h4>
                                        </div>
                                        <div className="bg-zinc-100 text-zinc-400 p-2 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                            <TrendingUp size={16} />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-zinc-900">
                                        {filteredData.headlines.successTransactions.toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SUCCESS TRANSACTIONS TABLE */}
                        <section ref={successTableRef} className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-500 scroll-mt-24">
                            <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50/20 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Successful Transactions ({filteredData.headlines.successPaymentsList.length})</h2>
                                        <p className="text-xs text-zinc-500 font-medium mt-1">Daftar transaksi Midtrans yang berhasil pada rentang waktu terpilih.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {filteredData.headlines.successPaymentsList.length > 0 && (
                                        <button
                                            onClick={() => {
                                                const headers = "User Name,Email,Industry,License Type,Payment Method,Date,Amount (IDR)\n";
                                                const csv = filteredData.headlines.successPaymentsList.map((payment: any) => {
                                                    const name = payment.user?.full_name || payment.user?.name || 'Unknown';
                                                    const email = payment.user?.email || '-';
                                                    const industry = payment.user?.industry || 'Not Specified';
                                                    const license = payment.license_type || payment.payment_type || 'Unknown';
                                                    const method = payment.payment_methode || '-';
                                                    const dateStr = payment.date_in || payment.createdAt || '';
                                                    const amount = payment.detail_amount?.total || payment.detail_amount?.price || payment.total || 0;
                                                    return `"${name}","${email}","${industry}","${license}","${method}","${dateStr}","${amount}"`;
                                                }).join('\n');
                                                const blob = new Blob([headers + csv], { type: 'text/csv' });
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'success-transactions.csv';
                                                a.click();
                                            }}
                                            className="bg-zinc-900 border border-zinc-900 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition shadow-lg shadow-zinc-200 flex items-center gap-2 hover:bg-zinc-800"
                                        >
                                            <Download size={14} /> Export CSV
                                        </button>
                                    )}
                                </div>
                            </div>

                            {filteredData.headlines.successPaymentsList.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-zinc-50 text-[10px] text-zinc-500 font-black tracking-widest border-b border-zinc-200">
                                                <tr className="uppercase bg-zinc-100">
                                                    <th className="px-6 py-4">User Details</th>
                                                    <th className="px-6 py-4 text-center">Industry</th>
                                                    <th className="px-6 py-4">License Type</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-right">Amount (IDR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {filteredData.headlines.successPaymentsList.slice((successPaymentsPage - 1) * SUCCESS_PAYMENTS_PER_PAGE, successPaymentsPage * SUCCESS_PAYMENTS_PER_PAGE).map((payment: any, idx: number) => {
                                                    const dateStr = payment.date_in || payment.createdAt || '';
                                                    const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                                                    const amount = payment.detail_amount?.total || payment.detail_amount?.price || payment.total || 0;
                                                    
                                                    return (
                                                        <tr key={payment._id || idx} className="hover:bg-zinc-50 transition border-l-4 border-l-emerald-500 group">
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-zinc-900 group-hover:text-blue-600 transition">{payment.user?.full_name || payment.user?.name || 'Unknown'}</p>
                                                                <p className="text-[10px] text-zinc-400 font-medium">{payment.user?.email || '-'}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{payment.user?.industry || 'Not Specified'}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                                                                        {payment.license_type || payment.payment_type || 'Unknown'}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                                                                        {payment.payment_methode || 'Midtrans'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[11px] font-bold text-zinc-500">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-zinc-900 text-lg">
                                                                Rp {amount.toLocaleString('id-ID')}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredData.headlines.successPaymentsList.length > SUCCESS_PAYMENTS_PER_PAGE && (
                                        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                                            <button onClick={() => setSuccessPaymentsPage(p => Math.max(1, p - 1))} disabled={successPaymentsPage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {successPaymentsPage} of {Math.ceil(filteredData.headlines.successPaymentsList.length / SUCCESS_PAYMENTS_PER_PAGE)}</span>
                                            <button onClick={() => setSuccessPaymentsPage(p => Math.min(Math.ceil(filteredData.headlines.successPaymentsList.length / SUCCESS_PAYMENTS_PER_PAGE), p + 1))} disabled={successPaymentsPage === Math.ceil(filteredData.headlines.successPaymentsList.length / SUCCESS_PAYMENTS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-20 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-100 m-6 rounded-2xl bg-zinc-50">
                                    No successful transactions found for the current filter.
                                </div>
                            )}
                        </section>

                        {/* 1. HEADLINE METRICS (FUNNEL) */}
                        <section className="animate-in fade-in duration-500 flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Step 1: New Regist */}
                                <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center md:items-center gap-6 shadow-sm relative z-20 transition hover:shadow-md hover:border-zinc-300">
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                                        <div className="w-14 h-14 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl shadow-inner"><Users size={28} /></div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 1: Top of Funnel</h4>
                                            <p className="text-2xl font-black tracking-tight text-zinc-900">New Registered Users</p>
                                        </div>
                                    </div>
                                    <div className="text-5xl font-black tracking-tighter">{filteredData.headlines.newRegisters.toLocaleString('id-ID')}</div>
                                </div>

                                {/* Arrow Connector */}
                                <div className="flex justify-center -my-6 relative z-10 opacity-30">
                                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                                </div>

                                {/* Step 2: Paid User */}
                                <div className="bg-white border border-zinc-200 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center md:items-center gap-6 shadow-sm relative z-20 w-[90%] mx-auto transition hover:shadow-md hover:border-zinc-300">
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                                        <div className="w-14 h-14 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-2xl shadow-inner"><Target size={28} /></div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 2: Activation</h4>
                                            <p className="text-2xl font-black tracking-tight text-zinc-900">Paid Conversions</p>
                                        </div>
                                    </div>
                                    <div className="text-5xl font-black tracking-tighter">{filteredData.headlines.paidConversions.toLocaleString('id-ID')}</div>
                                </div>

                                {/* Arrow Connector */}
                                <div className="flex justify-center -my-6 relative z-10 opacity-30">
                                    <div className="h-14 w-[3px] bg-zinc-400 rounded-full"></div>
                                </div>

                                {/* Step 3: Conversion */}
                                <div className="bg-zinc-900 border border-zinc-800 text-white p-10 rounded-3xl flex flex-col md:flex-row justify-between items-center md:items-center gap-6 shadow-2xl shadow-zinc-200 relative z-20 w-[80%] mx-auto transform hover:scale-[1.02] transition">
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                                        <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-2xl backdrop-blur-sm"><Activity size={32} className="text-emerald-400" /></div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Step 3: Bottom of Funnel</h4>
                                            <p className="text-3xl font-black tracking-tight">Final Conversion</p>
                                        </div>
                                    </div>
                                    <div className="text-6xl font-black tracking-tighter text-emerald-400 drop-shadow-md">
                                        {filteredData.headlines.newRegisters > 0 ? ((filteredData.headlines.paidConversions / filteredData.headlines.newRegisters) * 100).toFixed(1) : 0}%
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/3 flex flex-col justify-center">
                                <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition flex flex-col items-center text-center justify-center h-full">
                                    <AlertCircle size={48} className="text-rose-500 mb-6" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Needs Attention</h4>
                                    <p className="text-3xl font-black tracking-tight text-zinc-900 mb-4">Unpaid Checkouts</p>
                                    <div className="text-7xl font-black tracking-tighter text-rose-500">{filteredData.headlines.unpaidCheckouts.toLocaleString('id-ID')}</div>
                                    <p className="text-xs text-rose-500 mt-6 font-medium italic px-4 py-2 bg-rose-50 rounded-full border border-rose-100">Hot leads ready for follow up</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. GROWTH TREND (Chart) */}
                        <section className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm animate-in fade-in duration-500">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 gap-4">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight mb-1">Growth & Conversion Trend</h2>
                                    <p className="text-sm text-zinc-500 font-medium">Weekly Registrations vs Paid Transactions</p>
                                </div>
                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest border border-zinc-100 p-3 rounded-lg bg-zinc-50">
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-zinc-900"></div> Registers</span>
                                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> Conversions</span>
                                </div>
                            </div>

                            <div className="h-64 mt-8 w-full border-b border-zinc-200 pb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredData.trends} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 900 }} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="regist" fill="#18181b" radius={[4, 4, 0, 0]} name="Registers" />
                                        <Bar dataKey="conv" fill="#34d399" radius={[4, 4, 0, 0]} name="Conversions" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* 3. PROFILING & SEGMENTATION */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {/* Industry Breakdown */}
                            <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <Briefcase className="text-zinc-400" size={20} />
                                    <h2 className="text-lg font-black tracking-tight">New Users by Industry</h2>
                                </div>
                                {filteredData.industryBreakdown.length > 0 ? (
                                    <div className="space-y-5">
                                        {filteredData.industryBreakdown.map((ind, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs font-bold mb-2">
                                                    <span className="text-zinc-700 truncate mr-2">{ind.name}</span>
                                                    <span className="text-zinc-900 shrink-0">{ind.pct}%</span>
                                                </div>
                                                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-zinc-900 h-full rounded-full transition-all duration-500" style={{ width: `${ind.pct}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-100 rounded-xl">No industry data for active filters</div>
                                )}
                            </div>

                            {/* License Donut */}
                            <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm flex flex-col">
                                <div className="flex items-center gap-3 mb-8">
                                    <CreditCard className="text-zinc-400" size={20} />
                                    <h2 className="text-lg font-black tracking-tight">Conversions by License</h2>
                                </div>

                                {filteredData.headlines.paidConversions > 0 ? (
                                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
                                        <div className="relative w-36 h-36 shrink-0">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#18181b" strokeWidth="4" strokeDasharray={`${filteredData.licenseBreakdown.personal}, 100`} className="transition-all duration-1000" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34d399" strokeWidth="4" strokeDasharray={`${filteredData.licenseBreakdown.teams}, 100`} strokeDashoffset={`-${filteredData.licenseBreakdown.personal}`} className="transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center relative z-10 pointer-events-none">
                                                <span className="text-2xl font-black">{filteredData.headlines.paidConversions}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Paid</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4 w-full sm:w-auto">
                                            <div className="flex items-center justify-between sm:justify-start gap-4 border border-zinc-100 p-3 rounded-xl bg-zinc-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-zinc-900 shrink-0"></div>
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Personal</span>
                                                </div>
                                                <p className="text-xl font-black">{filteredData.licenseBreakdown.personal}%</p>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-start gap-4 border border-zinc-100 p-3 rounded-xl bg-zinc-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teams</span>
                                                </div>
                                                <p className="text-xl font-black">{filteredData.licenseBreakdown.teams}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-center py-10 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-100 rounded-xl">No conversions for active filters</div>
                                )}
                            </div>
                        </section>

                        {/* 4. TABLE: UNIFIED LEADS DIRECTORY */}
                        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
                            <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/30 gap-4">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-blue-900">Leads & Active Users Directory ({displayLeads.length})</h2>
                                    <p className="text-xs text-blue-600 font-medium mt-1">Daftar kontak prospek siap di follow-up, diprioritaskan untuk konfirmasi lisensi.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            const headers = "Name,Email,Phone,Plan,License,Industry,Status,Priority\n";
                                            const csv = filteredData.unpaidLeads.map(l => `${l.name},${l.email},${l.phone},${l.plan},"${l.licenseTypesList?.map(lic => `${lic.type} (${lic.count}x)`).join(' | ') || '-'}",${l.industry},${l.status},${l.priority}`).join('\n');
                                            const blob = new Blob([headers + csv], { type: 'text/csv' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'leads-directory.csv';
                                            a.click();
                                        }}
                                        className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 mr-2"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                    {selectedLeads.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setBlastType('leads');
                                                setBlastModalOpen(true);
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-md flex items-center gap-2"
                                        >
                                            <Send size={14} /> Blast WA {selectedLeads.length > 0 && `(${selectedLeads.length})`}
                                        </button>
                                    )}
                                    {selectedIndustry !== 'All Industries' && <span className="bg-white text-zinc-600 text-[10px] font-bold px-3 py-1 rounded-full border border-zinc-200">{selectedIndustry}</span>}
                                </div>
                            </div>

                            {filteredData.unpaidLeads.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-zinc-50 text-[10px] text-zinc-500 font-black tracking-widest border-b border-zinc-200 align-top">
                                                <tr className="uppercase bg-zinc-100">
                                                    <th className="px-6 py-4 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={displayLeads.length > 0 && selectedLeads.length === displayLeads.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedLeads(displayLeads.map(l => l._id || l.name));
                                                                else setSelectedLeads([]);
                                                            }}
                                                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4">
                                                        User Info / Industry
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Name / Industry" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:capitalize" value={leadsFilters.name} onChange={(e) => setLeadsFilters({...leadsFilters, name: e.target.value})} />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4">
                                                        Contact
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Email / Phone" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:capitalize" value={leadsFilters.email} onChange={(e) => setLeadsFilters({...leadsFilters, email: e.target.value})} />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4">
                                                        Plan / License Type
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Plan" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:capitalize" value={leadsFilters.plan} onChange={(e) => setLeadsFilters({...leadsFilters, plan: e.target.value})} />
                                                        </div>
                                                    </th>

                                                    <th className="px-6 py-4">
                                                        Status
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Status" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:capitalize" value={leadsFilters.status} onChange={(e) => setLeadsFilters({...leadsFilters, status: e.target.value})} />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-right align-middle">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {displayLeads.slice((leadsPage - 1) * LEADS_PER_PAGE, leadsPage * LEADS_PER_PAGE).map((lead, idx) => {
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
                                                                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow-sm">Copy</button>
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
                                                                    {lead.payment_methode === 'midtrans' && (
                                                                        <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold px-2 py-0.5 mt-1 border border-blue-200 bg-blue-50 rounded">
                                                                            Midtrans
                                                                        </span>
                                                                    )}
                                                                    {lead.payment_methode === 'gift' && lead.redeemCode && (
                                                                        <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold px-2 py-0.5 mt-1 border border-purple-200 bg-purple-50 rounded">
                                                                            Gift Code: {lead.redeemCode}
                                                                        </span>
                                                                    )}
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
                                    {displayLeads.length > LEADS_PER_PAGE && (
                                        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                                            <button onClick={() => setLeadsPage(p => Math.max(1, p - 1))} disabled={leadsPage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {leadsPage} of {Math.ceil(displayLeads.length / LEADS_PER_PAGE)}</span>
                                            <button onClick={() => setLeadsPage(p => Math.min(Math.ceil(displayLeads.length / LEADS_PER_PAGE), p + 1))} disabled={leadsPage === Math.ceil(displayLeads.length / LEADS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16 text-zinc-400 text-sm italic bg-white rounded-b-2xl">Tidak ada direktori yang cocok dengan kombinasi filter ini.</div>
                            )}
                        </section>

                        {/* 5. TABLE: NEW REGISTERS DIRECTORY */}
                        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500 mt-8">
                            <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50/30 gap-4">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-emerald-900">New Registered Users ({displayNewRegs.length})</h2>
                                    <p className="text-xs text-emerald-600 font-medium mt-1">Daftar pengguna baru yang mendaftar melalui platform.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => {
                                            const headers = "Name,Email,Phone,Industry,Date\n";
                                            const csv = filteredData.filteredNewRegisters.map((u: any) => `${u.full_name || u.name || '-'},${u.email || '-'},${u.phone_number || u.phone || '-'},${u.industry || '-'},${u.created_on || u.createdAt || '-'}`).join('\n');
                                            const blob = new Blob([headers + csv], { type: 'text/csv' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'new-registers.csv';
                                            a.click();
                                        }}
                                        className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 mr-2"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                    {selectedRegisters.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setBlastType('registers');
                                                setBlastModalOpen(true);
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-md flex items-center gap-2 animate-in fade-in"
                                        >
                                            <Send size={14} /> Blast WA ({selectedRegisters.length})
                                        </button>
                                    )}

                                </div>
                            </div>

                            {filteredData.filteredNewRegisters.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-zinc-50 text-[10px] text-zinc-500 font-black tracking-widest border-b border-zinc-200 align-top">
                                                <tr className="uppercase bg-zinc-100">
                                                    <th className="px-6 py-4 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={displayNewRegs.length > 0 && selectedRegisters.length === displayNewRegs.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedRegisters(displayNewRegs.map(u => u._id || u.email));
                                                                else setSelectedRegisters([]);
                                                            }}
                                                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4 w-1/3">
                                                        User Name
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Name" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none placeholder:capitalize" value={newRegFilters.name} onChange={(e) => setNewRegFilters({...newRegFilters, name: e.target.value})} />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 w-1/3">
                                                        Contact
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Email / Phone" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none placeholder:capitalize" value={newRegFilters.email} onChange={(e) => setNewRegFilters({...newRegFilters, email: e.target.value})} />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 w-1/3">
                                                        Industry
                                                        <div className="mt-2">
                                                            <input type="text" placeholder="Filter Industry" className="w-full font-medium text-zinc-900 px-2 py-1 rounded border border-zinc-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none placeholder:capitalize" value={newRegFilters.industry} onChange={(e) => setNewRegFilters({...newRegFilters, industry: e.target.value})} />
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {displayNewRegs.slice((newRegistersPage - 1) * NEW_REGISTERS_PER_PAGE, newRegistersPage * NEW_REGISTERS_PER_PAGE).map((user: any, idx: number) => {
                                                    const dateStr = user.created_on || user.createdAt || '';
                                                    const date = dateStr ? new Date(dateStr).toISOString() : '';
                                                    
                                                    const dummyLead: LeadItem = {
                                                        _id: user._id,
                                                        name: user.full_name || user.name || 'Unknown',
                                                        email: user.email || '-',
                                                        phone: user.phone_number || user.phone || '-',
                                                        plan: 'No License',
                                                        licenseType: '-',
                                                        date: date,
                                                        createdAt: date,
                                                        updatedAt: date,
                                                        industry: user.industry || 'Not Specified',
                                                        total: 0,
                                                        status: 'No License',
                                                        priority: 1,
                                                        successCount: 0
                                                    };
                                                    return (
                                                        <tr key={user._id || idx} className="hover:bg-zinc-50 transition cursor-pointer group/name border-l-4 border-l-blue-500" onClick={() => setSelectedDetailUser(dummyLead)}>
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRegisters.includes(user._id || user.email)}
                                                                    onChange={(e) => {
                                                                        const userId = user._id || user.email;
                                                                        if (e.target.checked) setSelectedRegisters([...selectedRegisters, userId]);
                                                                        else setSelectedRegisters(selectedRegisters.filter(id => id !== userId));
                                                                    }}
                                                                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-zinc-900 group-hover/name:text-blue-600 transition decoration-2 underline-offset-2 group-hover/name:underline">{user.full_name || user.name || 'Unknown'}</td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-zinc-600">{user.email || '-'}</p>
                                                                <p className="text-xs text-zinc-400">{user.phone_number || user.phone || '-'}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-zinc-600">{user.industry || '-'}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {displayNewRegs.length > NEW_REGISTERS_PER_PAGE && (
                                        <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-100 bg-white">
                                            <button onClick={() => setNewRegistersPage(p => Math.max(1, p - 1))} disabled={newRegistersPage === 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Prev</button>
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Page {newRegistersPage} of {Math.ceil(displayNewRegs.length / NEW_REGISTERS_PER_PAGE)}</span>
                                            <button onClick={() => setNewRegistersPage(p => Math.min(Math.ceil(displayNewRegs.length / NEW_REGISTERS_PER_PAGE), p + 1))} disabled={newRegistersPage === Math.ceil(displayNewRegs.length / NEW_REGISTERS_PER_PAGE)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg disabled:opacity-50 hover:bg-zinc-100 transition">Next</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16 text-zinc-400 text-sm italic bg-white rounded-b-2xl">Tidak ada pengguna baru yang mendaftar.</div>
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
                                            {(blastType === 'leads' ? selectedLeads : selectedRegisters).length} {blastType === 'leads' ? 'Leads' : 'Users'} Selected
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
                                    <p className="text-[10px] font-bold text-emerald-600/80 mt-2 bg-emerald-50 p-2 rounded-lg">Available variables: {'{{name}}'}, {'{{plan}}'}, {'{{industry}}'}</p>
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
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${blastSchedule === 'now' ? 'text-emerald-600/70' : 'text-zinc-400'}`}>Process immediately</p>
                                    </button>

                                    <button
                                        onClick={() => setBlastSchedule('schedule')}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${blastSchedule === 'schedule' ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-500/10' : 'border-zinc-200 hover:border-zinc-300'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock size={16} className={blastSchedule === 'schedule' ? 'text-emerald-600' : 'text-zinc-400'} />
                                            <span className={`font-black text-sm ${blastSchedule === 'schedule' ? 'text-emerald-900' : 'text-zinc-600'}`}>Schedule</span>
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${blastSchedule === 'schedule' ? 'text-emerald-600/70' : 'text-zinc-400'}`}>Set delivery time</p>
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
                                {(blastType === 'leads' ? selectedLeads : selectedRegisters).length === 0 && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest animate-pulse flex items-center">Select at least one contact</p>
                                )}
                                <button
                                    onClick={handleBlastConfirm}
                                    disabled={blasting || (blastSchedule === 'schedule' && !blastDateTime) || (blastType === 'leads' ? selectedLeads : selectedRegisters).length === 0}
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
                {/* --- SUCCESS PAYMENTS MODAL --- */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="font-black text-xl text-zinc-900">Success Transactions</h2>
                                            {filteredData.headlines.successPaymentsList.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const headers = "User Name,Email,Industry,License Type,Payment Method,Date,Amount (IDR)\n";
                                                        const csv = filteredData.headlines.successPaymentsList.map((payment: any) => {
                                                            const name = payment.user?.full_name || payment.user?.name || 'Unknown';
                                                            const email = payment.user?.email || '-';
                                                            const industry = payment.user?.industry || 'Not Specified';
                                                            const license = payment.license_type || payment.payment_type || 'Unknown';
                                                            const method = payment.payment_methode || '-';
                                                            const dateStr = payment.date_in || payment.createdAt || '';
                                                            const amount = payment.detail_amount?.total || payment.detail_amount?.price || payment.total || 0;
                                                            return `"${name}","${email}","${industry}","${license}","${method}","${dateStr}","${amount}"`;
                                                        }).join('\n');
                                                        const blob = new Blob([headers + csv], { type: 'text/csv' });
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'success-transactions.csv';
                                                        a.click();
                                                    }}
                                                    className="bg-white hover:bg-emerald-50 border border-zinc-200 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
                                                >
                                                    <Download size={12} /> Export CSV
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-zinc-500 mt-1">
                                            {filteredData.headlines.successPaymentsList.length} Payments Found (Midtrans Only)
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSuccessModal(false)} className="text-zinc-400 hover:text-zinc-900 p-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-full transition"><X size={20} /></button>
                            </div>
                            
                            <div className="overflow-y-auto w-full p-6">
                                {filteredData.headlines.successPaymentsList.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-zinc-100 text-[10px] text-zinc-500 font-black tracking-widest border-b border-zinc-200">
                                                <tr className="uppercase">
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Industry</th>
                                                    <th className="px-6 py-4">License Type</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-right">Amount (IDR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {filteredData.headlines.successPaymentsList.map((payment: any, idx: number) => {
                                                    const dateStr = payment.date_in || payment.createdAt || '';
                                                    const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                                                    const amount = payment.detail_amount?.total || payment.detail_amount?.price || payment.total || 0;
                                                    
                                                    return (
                                                        <tr key={payment._id || idx} className="hover:bg-zinc-50 transition border-l-4 border-l-emerald-500">
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-zinc-900">{payment.user?.full_name || payment.user?.name || 'Unknown'}</p>
                                                                <p className="text-[10px] text-zinc-500 font-medium">{payment.user?.email || '-'}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded font-medium">{payment.user?.industry || 'Not Specified'}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded">
                                                                    {payment.license_type || payment.payment_type || 'Unknown'}
                                                                </span>
                                                                {(payment.payment_methode) && (
                                                                     <div className="text-[9px] uppercase tracking-wider text-blue-600 font-bold px-2 py-0.5 mt-2 border border-blue-200 bg-blue-50 rounded inline-block">
                                                                        {payment.payment_methode}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-zinc-900">
                                                                Rp {amount.toLocaleString('id-ID')}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-zinc-400 text-sm italic bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
                                        Tidak ada data transaksi sukses untuk kombinasi filter ini.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}