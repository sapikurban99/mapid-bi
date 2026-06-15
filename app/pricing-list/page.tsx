'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DollarSign, FileText, Settings, HelpCircle, Briefcase, Calculator, Plus, X, ArrowRight, Sparkles, TrendingUp, ShieldCheck, Truck, Users, Activity, LayoutTemplate, Box, Server, Cloud, FilePlus2, History, Printer, Save, Trash2, Copy, ChevronLeft } from 'lucide-react';

const enterprisePricing = [
    {
        item: 'MAPID Enterprise On Cloud',
        unit: 'License / Year',
        price: 199000000,
        isQuotation: false,
        desc: 'Unlocks the full MAPID platform to be customized according to enterprise needs. All core MAPID technologies serve as the foundation for enterprise solutions that deliver impactful and sustainable outcomes. Includes SINI & MAPS (Annual) + Maintenance.'
    },
    {
        item: 'MAPID Enterprise On Premise',
        unit: 'Perpetual',
        price: 789000000,
        isQuotation: false,
        desc: 'Designed for organizations that require high-level data privacy. MAPID solutions will be deployed on dedicated servers or storage, ensuring full control and compliance with internal security standards. Includes On-Premise Install, SINI & MAPS (Annual) + Maintenance.'
    },
    {
        item: 'Web/App & Custom Dashboards Development',
        unit: 'Project Scope',
        price: null,
        isQuotation: true,
        desc: 'Built on MAPID’s core technology to create customized enterprise solutions (Asset Dashboard, Flood Dashboard, FMCG, Real Estate, BI, Logistics, Retail, Environment, etc). Includes Business Analyst, UI/UX Designer, Data Analyst/Scientists, GIS Specialist, System Integrator, Trainer & Support Team.'
    }
];

const platformPricing = [
    {
        item: 'Personal License',
        unit: 'License / Month',
        price: 99000,
        altPrice: '$9.00',
        desc: 'GEO MAPID, Maps & Dashboard Editor, Viewer Dashboard, FORM MAPID, Field Data Collector, MAPID MAPS, Base Map. Ideal for students and professional practitioners who want to learn and explore connected spatial analysis.'
    },
    {
        item: 'Team License (AI & Data)',
        unit: 'License / User / Month',
        price: 699000,
        altPrice: '$45.00',
        desc: 'All Personal License Features + Up to 10 Collaborators + SINI AI + SINI DATA. Ideal for SMEs seeking investment certainty through spatial analysis. Powers stronger insights for decision-making.'
    }
];

const servicesPricing = [
    { item: 'Online Training', unit: 'Session', price: 6275000, desc: 'Includes 10-20 participants, materials, platform access, e-certs' },
    { item: 'Offline Training', unit: 'Session', price: 10480000, desc: 'On-site training, 10-20 participants, materials, mentoring' },
    { item: 'Lead Engineer/BA/PM', unit: 'Engineer / Day', price: 3500000, desc: 'Min 5 years experience, skill independent transfer' },
    { item: 'Mid Engineer/Dev/DA', unit: 'Engineer / Day', price: 2750000, desc: 'Min 3 years experience, skill independent transfer' },
    { item: 'Junior Engineer/Lead Surveyor', unit: 'Engineer / Day', price: 1365000, desc: 'Min 1 years experience, skill independent transfer' },
];

const apiPricing = [
    { item: 'Base Maps', unit: '1000 Calls', price: 45000, desc: 'Web/App, Raster, Vector, 3D object rendering' },
    { item: 'Standard Routing', unit: '1000 Calls', price: 45000, desc: 'Motorcycle, car, truck routing' },
    { item: 'Advanced Routing', unit: '1000 Calls', price: 70000, desc: 'Multi-location, scoring, customized patterns' },
    { item: 'Geocode Boundary', unit: '1000 Calls', price: 2000, desc: 'Administrative areas (district, city, province)' },
    { item: 'Geocode', unit: '1000 Calls', price: 70000, desc: 'Reverse/forward geocoding and location search' },
    { item: 'Toll Calculation', unit: '1000 Calls', price: 99000, desc: 'Calculates accurate toll costs across vehicles' },
];

const surveyPricing = [
    { category: 'POI', type: 'Simple', price: 15000 },
    { category: 'POI', type: 'Medium', price: 30000 },
    { category: 'POI', type: 'Hard', price: 45000 },
    { category: 'POI', type: 'Super Hard', price: 70000 },
    { category: 'Questionnaire', type: 'Simple', price: 10000 },
    { category: 'Questionnaire', type: 'Medium', price: 15000 },
    { category: 'Questionnaire', type: 'Hard', price: 30000 },
    { category: 'Questionnaire', type: 'Super Hard', price: 45000 },
];

const parameters = {
    sla: [
        { label: 'Normal', multiplier: 1.0, desc: 'Standard completion time' },
        { label: 'Express', multiplier: 1.2, desc: 'Faster processing and priority (+20%)' },
        { label: 'Super Express', multiplier: 1.4, desc: 'Urgent task with highest priority (+40%)' },
    ],
    accessibility: [
        { label: 'Urban', addon: 0, desc: 'Easily accessible area' },
        { label: 'Suburban', addon: 10000, desc: 'Requires additional travel (+IDR 10K)' },
        { label: 'Rural', addon: 25000, desc: 'Hard-to-reach area, high travel / logistics (+IDR 25K)' },
    ],
    verification: [
        { label: 'None', addon: 0, desc: 'No verification required' },
        { label: 'QC Internal', addon: 5000, desc: 'Internal quality control (+IDR 5K)' },
        { label: 'Client Verify', addon: 15000, desc: 'Direct verification by the client (+IDR 15K)' },
    ],
    media: [
        { label: 'None', addon: 0, desc: 'No media documentation' },
        { label: 'Photo', addon: 5000, desc: 'Includes photo documentation (+IDR 5K)' },
        { label: 'Photo + Video', addon: 15000, desc: 'Full photo & video coverage (+IDR 15K)' },
    ],
    permit: [
        { label: 'No', addon: 0, desc: 'No special permit required' },
        { label: 'Yes', addon: 10000, desc: 'Requires access or security permit (+IDR 10K)' },
    ]
};

// Flat catalog used by the quotation builder dropdown
type CatalogItem = { category: string; name: string; unit: string; price: number };
const CATALOG: CatalogItem[] = [
    ...enterprisePricing.filter(i => !i.isQuotation && i.price).map(i => ({ category: 'Enterprise', name: i.item, unit: i.unit, price: i.price as number })),
    ...platformPricing.map(i => ({ category: 'Platform', name: i.item, unit: i.unit, price: i.price })),
    ...servicesPricing.map(i => ({ category: 'Services', name: i.item, unit: i.unit, price: i.price })),
    ...apiPricing.map(i => ({ category: 'API', name: i.item, unit: i.unit, price: i.price })),
    ...surveyPricing.map(i => ({ category: 'Survey', name: `${i.category} - ${i.type}`, unit: 'Point', price: i.price })),
];

const COMPANY_INFO = {
    name: 'PT MULTI AREAL PLANING INDONESIA (MAPID)',
    address: 'Jl. Mekar Raya No.11, Mekar Rahayu, Kec. Margaasih\nKab. Bandung Jawa Barat 40218\nIndonesia',
    bank: 'Bank Mandiri',
    accountName: 'PT. Multi Areal Planing Indonesia',
    accountNumber: '1300088778785',
};

type QuoteItem = {
    id: string;
    code: string;
    name: string;
    description: string;
    qty: number;
    unit: string;
    unit_price: number;
    order_index: number;
};

type Quotation = {
    id: string | null;
    quote_number: string;
    customer_name: string;
    customer_address: string;
    customer_country: string;
    quote_date: string;
    location: string;
    discount: number;
    ppn_percentage: number;
    biaya_lain_lain: number;
    keterangan: string;
    signatory_name: string;
    signatory_title: string;
    signature_url: string;
    status: string;
};

type QuotationSummary = Quotation & { total: number };

const blankQuotation = (quoteNumber: string): Quotation => ({
    id: null,
    quote_number: quoteNumber,
    customer_name: '',
    customer_address: '',
    customer_country: 'Indonesia',
    quote_date: new Date().toISOString().slice(0, 10),
    location: 'Bandung',
    discount: 0,
    ppn_percentage: 11,
    biaya_lain_lain: 0,
    keterangan: 'Harga dalam penawaran ini bersifat estimasi dan dapat berubah sesuai dengan scope pekerjaan yang disepakati.',
    signatory_name: 'Bagus Imam Darmawan',
    signatory_title: 'Direktur Utama PT.Multi Areal Planing Indonesia',
    signature_url: '/signature-bagus.png',
    status: 'draft',
});

const formatIDR = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID');
const formatDateID = (iso: string) => {
    if (!iso) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const generateQuoteNumber = (existing: string[]): string => {
    const year = new Date().getFullYear();
    const prefix = `MAPID-${year}-`;
    const max = existing
        .filter(n => n.startsWith(prefix))
        .map(n => parseInt(n.slice(prefix.length), 10))
        .filter(n => !isNaN(n))
        .reduce((a, b) => Math.max(a, b), 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

export default function PricingListPage() {
    type Tab = 'calculator' | 'enterprise' | 'platform' | 'services' | 'api' | 'survey' | 'parameters' | 'quotation' | 'quotation-history';
    const [activeTab, setActiveTab] = useState<Tab>('calculator');

    // Calculator State
    const [calcBasePrice, setCalcBasePrice] = useState<number>(30000);
    const [calcUnits, setCalcUnits] = useState<number>(1);
    const [calcSla, setCalcSla] = useState<string>('Normal');
    const [calcAccessibility, setCalcAccessibility] = useState<string>('Urban');
    const [calcVerification, setCalcVerification] = useState<string>('None');
    const [calcMedia, setCalcMedia] = useState<string>('None');
    const [calcPermit, setCalcPermit] = useState<string>('No');
    const [hppBasePercentage, setHppBasePercentage] = useState<number>(40);

    // Quotation builder state
    const [quote, setQuote] = useState<Quotation>(blankQuotation('MAPID-2026-001'));
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [catalogPick, setCatalogPick] = useState<string>('');
    const [quoteMsg, setQuoteMsg] = useState<string>('');
    const [quoteSaving, setQuoteSaving] = useState<boolean>(false);
    const [history, setHistory] = useState<QuotationSummary[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);

    // Initialize quote number on first open of builder
    useEffect(() => {
        if (activeTab !== 'quotation' || quote.id || quoteItems.length > 0) return;
        (async () => {
            const { data } = await supabase
                .from('mapid_quotations')
                .select('quote_number');
            const numbers = (data || []).map((r: any) => r.quote_number);
            const next = generateQuoteNumber(numbers);
            setQuote(prev => ({ ...prev, quote_number: next }));
        })();
    }, [activeTab]);

    // Load history when tab opened
    useEffect(() => {
        if (activeTab !== 'quotation-history') return;
        (async () => {
            setHistoryLoading(true);
            const { data: quotes } = await supabase
                .from('mapid_quotations')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: items } = await supabase
                .from('mapid_quotation_items')
                .select('quotation_id, qty, unit_price');

            const totals: Record<string, number> = {};
            (items || []).forEach((it: any) => {
                totals[it.quotation_id] = (totals[it.quotation_id] || 0) + Number(it.qty || 0) * Number(it.unit_price || 0);
            });

            const summaries: QuotationSummary[] = (quotes || []).map((q: any) => {
                const sub = totals[q.id] || 0;
                const afterDisc = sub - Number(q.discount || 0);
                const total = afterDisc + (afterDisc * Number(q.ppn_percentage || 0)) / 100 + Number(q.biaya_lain_lain || 0);
                return { ...q, total };
            });
            setHistory(summaries);
            setHistoryLoading(false);
        })();
    }, [activeTab]);

    // Dynamic Calculations
    const currentSla = parameters.sla.find(s => s.label === calcSla) || parameters.sla[0];
    const currentAcc = parameters.accessibility.find(a => a.label === calcAccessibility) || parameters.accessibility[0];
    const currentVer = parameters.verification.find(v => v.label === calcVerification) || parameters.verification[0];
    const currentMed = parameters.media.find(m => m.label === calcMedia) || parameters.media[0];
    const currentPerm = parameters.permit.find(p => p.label === calcPermit) || parameters.permit[0];

    const pricePerUnit = (calcBasePrice * currentSla.multiplier) + currentAcc.addon + currentVer.addon + currentMed.addon + currentPerm.addon;
    const totalRevenue = pricePerUnit * calcUnits;

    const baseHppPerUnit = calcBasePrice * (hppBasePercentage / 100);
    const addonsHppPerUnit = (currentAcc.addon + currentVer.addon + currentMed.addon + currentPerm.addon) * 0.5;
    const totalHpp = (baseHppPerUnit + addonsHppPerUnit) * calcUnits;

    const estimatedMargin = totalRevenue - totalHpp;
    const marginPercentage = totalRevenue > 0 ? (estimatedMargin / totalRevenue) * 100 : 0;

    // Quotation calculations
    const quoteSubtotal = useMemo(
        () => quoteItems.reduce((s, it) => s + (it.qty * it.unit_price), 0),
        [quoteItems]
    );
    const quoteAfterDiscount = quoteSubtotal - (quote.discount || 0);
    const quotePpn = (quoteAfterDiscount * (quote.ppn_percentage || 0)) / 100;
    const quoteTotal = quoteAfterDiscount + quotePpn + (quote.biaya_lain_lain || 0);

    const updateQuoteItem = (idx: number, field: keyof QuoteItem, value: any) => {
        const next = [...quoteItems];
        next[idx] = { ...next[idx], [field]: value };
        setQuoteItems(next);
    };

    const removeQuoteItem = (idx: number) => {
        const next = [...quoteItems];
        next.splice(idx, 1);
        next.forEach((it, i) => { it.order_index = i; });
        setQuoteItems(next);
    };

    const addCustomItem = () => {
        const nextCode = String(100044 + quoteItems.length);
        setQuoteItems([
            ...quoteItems,
            {
                id: crypto.randomUUID(),
                code: nextCode,
                name: '',
                description: '',
                qty: 1,
                unit: 'Package',
                unit_price: 0,
                order_index: quoteItems.length,
            },
        ]);
    };

    const addCatalogItem = () => {
        if (!catalogPick) return;
        const item = CATALOG[parseInt(catalogPick, 10)];
        if (!item) return;
        const nextCode = String(100044 + quoteItems.length);
        setQuoteItems([
            ...quoteItems,
            {
                id: crypto.randomUUID(),
                code: nextCode,
                name: item.name,
                description: '',
                qty: 1,
                unit: item.unit,
                unit_price: item.price,
                order_index: quoteItems.length,
            },
        ]);
        setCatalogPick('');
    };

    const resetQuote = async () => {
        const { data } = await supabase
            .from('mapid_quotations')
            .select('quote_number');
        const numbers = (data || []).map((r: any) => r.quote_number);
        setQuote(blankQuotation(generateQuoteNumber(numbers)));
        setQuoteItems([]);
        setQuoteMsg('');
    };

    const saveQuotation = async () => {
        if (!quote.customer_name.trim()) {
            setQuoteMsg('Error: Nama customer wajib diisi.');
            return;
        }
        if (quoteItems.length === 0) {
            setQuoteMsg('Error: Minimal 1 item.');
            return;
        }
        setQuoteSaving(true);
        setQuoteMsg('');
        try {
            let quoteId = quote.id;
            const headerPayload = {
                quote_number: quote.quote_number,
                customer_name: quote.customer_name,
                customer_address: quote.customer_address,
                customer_country: quote.customer_country,
                quote_date: quote.quote_date,
                location: quote.location,
                discount: Number(quote.discount) || 0,
                ppn_percentage: Number(quote.ppn_percentage) || 0,
                biaya_lain_lain: Number(quote.biaya_lain_lain) || 0,
                keterangan: quote.keterangan,
                signatory_name: quote.signatory_name,
                signatory_title: quote.signatory_title,
                signature_url: quote.signature_url || null,
                status: quote.status,
                updated_at: new Date().toISOString(),
            };

            if (quoteId) {
                const { error } = await supabase
                    .from('mapid_quotations')
                    .update(headerPayload)
                    .eq('id', quoteId);
                if (error) throw error;
                await supabase.from('mapid_quotation_items').delete().eq('quotation_id', quoteId);
            } else {
                const { data, error } = await supabase
                    .from('mapid_quotations')
                    .insert([headerPayload])
                    .select()
                    .single();
                if (error) throw error;
                quoteId = data.id;
                setQuote(prev => ({ ...prev, id: quoteId }));
            }

            if (quoteId && quoteItems.length > 0) {
                const itemsPayload = quoteItems.map((it, i) => ({
                    quotation_id: quoteId,
                    code: it.code,
                    name: it.name,
                    description: it.description,
                    qty: Number(it.qty) || 0,
                    unit: it.unit,
                    unit_price: Number(it.unit_price) || 0,
                    order_index: i,
                }));
                const { error } = await supabase.from('mapid_quotation_items').insert(itemsPayload);
                if (error) throw error;
            }

            setQuoteMsg('Quotation tersimpan.');
            setTimeout(() => setQuoteMsg(''), 3000);
        } catch (err: any) {
            console.error('Save quotation error', err);
            setQuoteMsg('Error: ' + (err.message || 'Gagal simpan'));
        } finally {
            setQuoteSaving(false);
        }
    };

    const loadQuotationFromHistory = async (id: string) => {
        const { data: header, error } = await supabase
            .from('mapid_quotations')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !header) return;
        const { data: items } = await supabase
            .from('mapid_quotation_items')
            .select('*')
            .eq('quotation_id', id)
            .order('order_index', { ascending: true });
        setQuote({
            id: header.id,
            quote_number: header.quote_number,
            customer_name: header.customer_name,
            customer_address: header.customer_address || '',
            customer_country: header.customer_country || 'Indonesia',
            quote_date: header.quote_date,
            location: header.location || 'Bandung',
            discount: Number(header.discount) || 0,
            ppn_percentage: Number(header.ppn_percentage) || 0,
            biaya_lain_lain: Number(header.biaya_lain_lain) || 0,
            keterangan: header.keterangan || '',
            signatory_name: header.signatory_name || '',
            signatory_title: header.signatory_title || '',
            signature_url: header.signature_url || '',
            status: header.status || 'draft',
        });
        setQuoteItems(
            (items || []).map((it: any, i: number) => ({
                id: it.id,
                code: it.code || '',
                name: it.name,
                description: it.description || '',
                qty: Number(it.qty) || 1,
                unit: it.unit || 'Package',
                unit_price: Number(it.unit_price) || 0,
                order_index: i,
            }))
        );
        setActiveTab('quotation');
    };

    const duplicateQuotation = async (id: string) => {
        await loadQuotationFromHistory(id);
        const { data } = await supabase.from('mapid_quotations').select('quote_number');
        const numbers = (data || []).map((r: any) => r.quote_number);
        setQuote(prev => ({ ...prev, id: null, quote_number: generateQuoteNumber(numbers), status: 'draft' }));
    };

    const deleteQuotation = async (id: string) => {
        if (!confirm('Hapus quotation ini?')) return;
        const { error } = await supabase.from('mapid_quotations').delete().eq('id', id);
        if (error) {
            alert('Gagal hapus: ' + error.message);
            return;
        }
        setHistory(h => h.filter(q => q.id !== id));
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-zinc-50 pb-20 font-sans">
            <style>{`
                .quotation-print, .quotation-print * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    font-family: var(--font-figtree), 'Figtree', system-ui, -apple-system, sans-serif !important;
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    html, body { background: white !important; margin: 0 !important; }
                    body * { visibility: hidden !important; }
                    .quotation-print, .quotation-print * { visibility: visible !important; }
                    .quotation-print {
                        position: absolute !important;
                        left: 0; top: 0;
                        width: 100%;
                        background: white;
                        padding: 12mm 14mm !important;
                    }
                    /* Reset inner template sizing so it doesn't overflow to a 2nd page */
                    .quotation-print > div {
                        width: 100% !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .quotation-print table { page-break-inside: auto; }
                    .quotation-print tr { page-break-inside: avoid; page-break-after: auto; }
                    .no-print { display: none !important; }
                    .print-page-break { page-break-after: always; }
                }
            `}</style>

            {/* HEADER */}
            <header className="no-print flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-2">
                        <Sparkles className="text-amber-500 w-6 h-6 md:w-8 md:h-8 shrink-0" /> PRICING CONFIGURATION
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium text-sm md:text-base">Platform & Services Pricing, Quotation Builder, HPP analysis & Margin Calculator</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-start overflow-x-auto max-w-full custom-scrollbar">
                    {[
                        { id: 'quotation', label: 'Quotation', icon: FilePlus2 },
                        { id: 'quotation-history', label: 'History', icon: History },
                        { id: 'calculator', label: 'Calculator', icon: Calculator },
                        { id: 'enterprise', label: 'Enterprise', icon: ShieldCheck },
                        { id: 'platform', label: 'Platform & AI', icon: LayoutTemplate },
                        { id: 'services', label: 'Services', icon: Users },
                        { id: 'api', label: 'API', icon: Settings },
                        { id: 'survey', label: 'Survey', icon: Briefcase },
                        { id: 'parameters', label: 'Parameters', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <tab.icon size={14} className="shrink-0" /> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* TAB: QUOTATION BUILDER */}
            {activeTab === 'quotation' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 no-print">
                    {/* LEFT - FORM */}
                    <div className="xl:col-span-7 space-y-6">
                        {quoteMsg && (
                            <div className={`p-3 rounded-xl text-xs font-bold ${quoteMsg.startsWith('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                {quoteMsg}
                            </div>
                        )}

                        {/* Customer block */}
                        <div className="bg-white p-5 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-700">Customer (Kepada)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Nama Customer</label>
                                    <input
                                        type="text"
                                        value={quote.customer_name}
                                        onChange={e => setQuote({ ...quote, customer_name: e.target.value })}
                                        placeholder="DSDA DKI Jakarta"
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Alamat</label>
                                    <textarea
                                        rows={3}
                                        value={quote.customer_address}
                                        onChange={e => setQuote({ ...quote, customer_address: e.target.value })}
                                        placeholder="TAMAN JATIBARU, GEDUNG DINAS SDA LANTAI 10 NO.1..."
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Country</label>
                                    <input
                                        type="text"
                                        value={quote.customer_country}
                                        onChange={e => setQuote({ ...quote, customer_country: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Meta block */}
                        <div className="bg-white p-5 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-700">Quotation Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Quote Number</label>
                                    <input
                                        type="text"
                                        value={quote.quote_number}
                                        onChange={e => setQuote({ ...quote, quote_number: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold font-mono text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Tanggal</label>
                                    <input
                                        type="date"
                                        value={quote.quote_date}
                                        onChange={e => setQuote({ ...quote, quote_date: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Lokasi</label>
                                    <input
                                        type="text"
                                        value={quote.location}
                                        onChange={e => setQuote({ ...quote, location: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white p-5 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-700">Items</h3>
                                <div className="flex gap-2 flex-wrap">
                                    <select
                                        value={catalogPick}
                                        onChange={e => setCatalogPick(e.target.value)}
                                        className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 max-w-[280px]"
                                    >
                                        <option value="">— Pilih dari katalog —</option>
                                        {['Enterprise', 'Platform', 'Services', 'API', 'Survey'].map(cat => (
                                            <optgroup key={cat} label={cat}>
                                                {CATALOG.map((item, idx) => item.category === cat ? (
                                                    <option key={idx} value={idx}>{item.name} — Rp {item.price.toLocaleString('id-ID')}</option>
                                                ) : null)}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <button
                                        onClick={addCatalogItem}
                                        disabled={!catalogPick}
                                        className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                    <button
                                        onClick={addCustomItem}
                                        className="px-3 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-zinc-50 transition flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Custom
                                    </button>
                                </div>
                            </div>

                            {quoteItems.length === 0 ? (
                                <div className="text-center py-8 text-zinc-400 text-xs font-bold border-2 border-dashed border-zinc-200 rounded-2xl">
                                    Belum ada item. Pilih dari katalog atau tambah custom.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {quoteItems.map((it, idx) => (
                                        <div key={it.id} className="p-3 md:p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                            <div className="grid grid-cols-12 gap-2 items-start">
                                                <div className="col-span-3 md:col-span-2">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Kode</label>
                                                    <input
                                                        type="text"
                                                        value={it.code}
                                                        onChange={e => updateQuoteItem(idx, 'code', e.target.value)}
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-9 md:col-span-10">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Nama</label>
                                                    <input
                                                        type="text"
                                                        value={it.name}
                                                        onChange={e => updateQuoteItem(idx, 'name', e.target.value)}
                                                        placeholder="Nama item / paket"
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-12">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Deskripsi (optional)</label>
                                                    <textarea
                                                        rows={2}
                                                        value={it.description}
                                                        onChange={e => updateQuoteItem(idx, 'description', e.target.value)}
                                                        placeholder="(Termasuk Training Penggunaan Produk)"
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-4 md:col-span-2">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Qty</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={it.qty}
                                                        onChange={e => updateQuoteItem(idx, 'qty', Number(e.target.value))}
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-4 md:col-span-3">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Satuan</label>
                                                    <input
                                                        type="text"
                                                        value={it.unit}
                                                        onChange={e => updateQuoteItem(idx, 'unit', e.target.value)}
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-4 md:col-span-3">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">@ Harga/Unit</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={it.unit_price}
                                                        onChange={e => updateQuoteItem(idx, 'unit_price', Number(e.target.value))}
                                                        className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                                    />
                                                </div>
                                                <div className="col-span-9 md:col-span-3">
                                                    <label className="block text-[9px] font-black text-zinc-600 mb-1 uppercase">Total</label>
                                                    <div className="w-full p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-mono font-black text-emerald-700">
                                                        {formatIDR(it.qty * it.unit_price)}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 md:col-span-1 flex md:items-end md:justify-end">
                                                    <button
                                                        onClick={() => removeQuoteItem(idx)}
                                                        className="w-full md:w-auto p-2 bg-white border border-zinc-200 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition mt-auto"
                                                        title="Hapus item"
                                                    >
                                                        <Trash2 size={14} className="mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="bg-white p-5 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-700">Totals</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Diskon (Rp)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={quote.discount}
                                        onChange={e => setQuote({ ...quote, discount: Number(e.target.value) })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold font-mono text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">PPN (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={quote.ppn_percentage}
                                        onChange={e => setQuote({ ...quote, ppn_percentage: Number(e.target.value) })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold font-mono text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Biaya Lain-lain (Rp)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={quote.biaya_lain_lain}
                                        onChange={e => setQuote({ ...quote, biaya_lain_lain: Number(e.target.value) })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold font-mono text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-zinc-100 text-sm font-mono">
                                <div className="flex justify-between"><span className="text-zinc-500">Sub Total</span><span className="font-bold">{formatIDR(quoteSubtotal)}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Diskon</span><span className="font-bold">- {formatIDR(quote.discount)}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">PPN ({quote.ppn_percentage}%)</span><span className="font-bold">{formatIDR(quotePpn)}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Biaya Lain-lain</span><span className="font-bold">{formatIDR(quote.biaya_lain_lain)}</span></div>
                                <div className="flex justify-between pt-2 mt-2 border-t border-zinc-200 text-base"><span className="text-zinc-900 font-black">Total</span><span className="font-black text-emerald-600">{formatIDR(quoteTotal)}</span></div>
                            </div>
                        </div>

                        {/* Keterangan + Signatory */}
                        <div className="bg-white p-5 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Keterangan</label>
                                <textarea
                                    rows={3}
                                    value={quote.keterangan}
                                    onChange={e => setQuote({ ...quote, keterangan: e.target.value })}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Nama Penandatangan</label>
                                    <input
                                        type="text"
                                        value={quote.signatory_name}
                                        onChange={e => setQuote({ ...quote, signatory_name: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Jabatan</label>
                                    <input
                                        type="text"
                                        value={quote.signatory_title}
                                        onChange={e => setQuote({ ...quote, signatory_title: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Signature Image URL (optional)</label>
                                    <input
                                        type="text"
                                        value={quote.signature_url}
                                        onChange={e => setQuote({ ...quote, signature_url: e.target.value })}
                                        placeholder="https://... atau /signature.png (taruh file di /public/)"
                                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1.5">Paste URL gambar tanda tangan (PNG transparan disarankan). Atau letakkan file di folder <code>/public/</code> dan referensi sebagai <code>/signature.png</code>.</p>
                                </div>
                                {quote.signature_url ? (
                                    <div className="border border-zinc-200 rounded-xl p-3 bg-white flex items-center justify-center h-[80px]">
                                        <img src={quote.signature_url} alt="Signature preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-zinc-300 rounded-xl p-3 bg-zinc-50 flex items-center justify-center h-[80px] text-[10px] text-zinc-400 font-bold uppercase tracking-wider">No signature</div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={saveQuotation}
                                disabled={quoteSaving}
                                className="px-5 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                            >
                                <Save size={16} /> {quoteSaving ? 'Saving…' : 'Save Quotation'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg"
                            >
                                <Printer size={16} /> Print / Save PDF
                            </button>
                            <button
                                onClick={resetQuote}
                                className="px-5 py-3 bg-white border border-zinc-300 text-zinc-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition flex items-center gap-2"
                            >
                                <FilePlus2 size={16} /> New Quote
                            </button>
                        </div>
                    </div>

                    {/* RIGHT - LIVE PREVIEW */}
                    <div className="xl:col-span-5">
                        <div className="sticky top-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Preview</h3>
                                <span className="text-[10px] font-bold text-zinc-400">A4 portrait</span>
                            </div>
                            <div className="border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="origin-top-left scale-[0.7] sm:scale-[0.78] md:scale-[0.85] xl:scale-[0.6] w-[210mm] -mb-[40%]">
                                    <QuotationPrintTemplate quote={quote} items={quoteItems} subtotal={quoteSubtotal} ppn={quotePpn} total={quoteTotal} />
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-3 font-bold leading-relaxed">
                                Klik <strong>Print / Save PDF</strong> untuk membuka dialog browser. Pilih "Save as PDF" sebagai destination.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT VIEW - always rendered, visible only when @media print */}
            {activeTab === 'quotation' && (
                <div className="quotation-print" style={{ display: 'none' }}>
                    <QuotationPrintTemplate quote={quote} items={quoteItems} subtotal={quoteSubtotal} ppn={quotePpn} total={quoteTotal} />
                </div>
            )}
            <style>{`
                @media print {
                    .quotation-print { display: block !important; }
                }
            `}</style>

            {/* TAB: QUOTATION HISTORY */}
            {activeTab === 'quotation-history' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm no-print">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-100 flex-wrap gap-3">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Quotation History</h3>
                            <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Semua quotation yang pernah dibuat. Klik untuk load ke builder.</p>
                        </div>
                        <button
                            onClick={() => { resetQuote(); setActiveTab('quotation'); }}
                            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition flex items-center gap-2"
                        >
                            <Plus size={14} /> New Quotation
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="text-zinc-400 text-sm">Loading…</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-2xl">
                            Belum ada quotation. Klik <strong>New Quotation</strong> untuk membuat.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                                        <th className="py-3 px-2">Quote #</th>
                                        <th className="py-3 px-2">Customer</th>
                                        <th className="py-3 px-2">Tanggal</th>
                                        <th className="py-3 px-2">Total</th>
                                        <th className="py-3 px-2">Status</th>
                                        <th className="py-3 px-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(q => (
                                        <tr key={q.id || ''} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition">
                                            <td className="py-3 px-2 font-mono font-bold text-xs">{q.quote_number}</td>
                                            <td className="py-3 px-2 font-bold">{q.customer_name}</td>
                                            <td className="py-3 px-2 text-zinc-500 text-xs">{formatDateID(q.quote_date)}</td>
                                            <td className="py-3 px-2 font-mono font-black text-emerald-600">{formatIDR(q.total)}</td>
                                            <td className="py-3 px-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : q.status === 'sent' ? 'bg-blue-100 text-blue-700' : q.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => q.id && loadQuotationFromHistory(q.id)} className="p-2 hover:bg-zinc-100 rounded-lg transition" title="Open">
                                                        <ArrowRight size={14} />
                                                    </button>
                                                    <button onClick={() => q.id && duplicateQuotation(q.id)} className="p-2 hover:bg-zinc-100 rounded-lg transition" title="Duplicate">
                                                        <Copy size={14} />
                                                    </button>
                                                    <button onClick={() => q.id && deleteQuotation(q.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CALCULATOR */}
            {activeTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 no-print">
                    <div className="lg:col-span-7 bg-white p-4 md:p-6 border border-zinc-200 rounded-[2rem] shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-base md:text-lg text-zinc-900 leading-tight">Dynamic Pricing & Estimator</h3>
                                <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Configure variables to calculate pricing & HPP</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Base Price (IDR)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-zinc-400 text-xs font-black tracking-tighter">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={calcBasePrice}
                                        onChange={(e) => setCalcBasePrice(Number(e.target.value))}
                                        className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-black text-zinc-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Quantity / Units</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={calcUnits}
                                    onChange={(e) => setCalcUnits(Math.max(1, Number(e.target.value)))}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-black text-zinc-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl overflow-x-auto">
                            <label className="block text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-wider">Quick Survey Presets</label>
                            <div className="flex sm:flex-wrap gap-2 w-max sm:w-auto">
                                {surveyPricing.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCalcBasePrice(item.price)}
                                        className={`px-3 py-1.5 rounded-lg border text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${calcBasePrice === item.price ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-500'}`}
                                    >
                                        {item.category} {item.type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-2 border-t border-zinc-100">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Service Level Agreement (SLA)</label>
                                <select
                                    value={calcSla}
                                    onChange={(e) => setCalcSla(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs md:text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {parameters.sla.map(s => <option key={s.label} value={s.label}>{s.label} (x{s.multiplier})</option>)}
                                </select>
                                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium leading-tight">{currentSla.desc}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Project Accessibility</label>
                                <select
                                    value={calcAccessibility}
                                    onChange={(e) => setCalcAccessibility(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs md:text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {parameters.accessibility.map(a => <option key={a.label} value={a.label}>{a.label} (+Rp {a.addon.toLocaleString()})</option>)}
                                </select>
                                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium leading-tight">{currentAcc.desc}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Verification Type</label>
                                <select
                                    value={calcVerification}
                                    onChange={(e) => setCalcVerification(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {parameters.verification.map(v => <option key={v.label} value={v.label}>{v.label} (+Rp {v.addon.toLocaleString()})</option>)}
                                </select>
                                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium leading-tight">{currentVer.desc}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Documentation Media</label>
                                <select
                                    value={calcMedia}
                                    onChange={(e) => setCalcMedia(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {parameters.media.map(m => <option key={m.label} value={m.label}>{m.label} (+Rp {m.addon.toLocaleString()})</option>)}
                                </select>
                                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium leading-tight">{currentMed.desc}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 mb-1.5 uppercase tracking-wider">Special Permit Required</label>
                                <select
                                    value={calcPermit}
                                    onChange={(e) => setCalcPermit(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {parameters.permit.map(p => <option key={p.label} value={p.label}>{p.label} (+Rp {p.addon.toLocaleString()})</option>)}
                                </select>
                                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium leading-tight">{currentPerm.desc}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100">
                            <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">
                                <span>Base HPP Constraint</span>
                                <span className="text-zinc-700">{hppBasePercentage}% of Base Price</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                value={hppBasePercentage}
                                onChange={(e) => setHppBasePercentage(Number(e.target.value))}
                                className="w-full accent-zinc-900 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[9px] text-zinc-400 mt-1.5 font-medium">Estimated base production cost before addon premiums. Typical threshold: 30-50%.</p>
                        </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex-1 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 -z-0"></div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Pricing & Revenue Breakdown</span>
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800 pb-4 gap-1">
                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Base Price Unit</span>
                                    <span className="font-mono text-lg font-black">Rp {calcBasePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800 py-3 gap-1 text-xs">
                                    <span className="text-zinc-400 font-bold uppercase tracking-wider">Unit Premium Extras</span>
                                    <span className="font-mono text-zinc-300 font-bold">Rp {(pricePerUnit - calcBasePrice).toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800 py-4 gap-1 text-xs font-black">
                                    <span className="text-zinc-400 uppercase tracking-wider">Revenue / Quoted Price</span>
                                    <span className="font-mono text-emerald-400 text-xl md:text-2xl tracking-tight">Rp {totalRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800 py-4 gap-1 text-xs font-black">
                                    <span className="text-zinc-400 uppercase tracking-wider">Total HPP (Est. Cost)</span>
                                    <span className="font-mono text-amber-400 text-base md:text-lg">Rp {totalHpp.toLocaleString()}</span>
                                </div>
                                <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                    <div>
                                        <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.15em] block">Estimated Profit</span>
                                        <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-tighter mt-1 block">Rp {estimatedMargin.toLocaleString()}</span>
                                    </div>
                                    <div className="sm:text-right">
                                        <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.15em] block">Profit Margin</span>
                                        <span className="font-mono text-2xl md:text-3xl font-black text-emerald-400 mt-1 block">{marginPercentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-zinc-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Margin Guidelines</h4>
                            <div className="grid grid-cols-3 gap-2 md:gap-3">
                                <div className="p-2 md:p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center md:text-left">
                                    <span className="text-[9px] md:text-[10px] font-black text-emerald-700 block">EXCELLENT</span>
                                    <span className="text-xs font-bold text-zinc-600 mt-0.5 block">&gt; 50%</span>
                                </div>
                                <div className="p-2 md:p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center md:text-left">
                                    <span className="text-[9px] md:text-[10px] font-black text-amber-700 block">STABLE</span>
                                    <span className="text-xs font-bold text-zinc-600 mt-0.5 block">30% - 50%</span>
                                </div>
                                <div className="p-2 md:p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-center md:text-left">
                                    <span className="text-[9px] md:text-[10px] font-black text-rose-700 block">CRITICAL</span>
                                    <span className="text-xs font-bold text-zinc-600 mt-0.5 block">&lt; 30%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ENTERPRISE LICENSE */}
            {activeTab === 'enterprise' && (
                <div className="space-y-6 no-print">
                    <div className="flex flex-col mb-4">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Enterprise License</h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Platform, AI, and Data custom solutions for large-scale organizations.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enterprisePricing.map((item, idx) => (
                            <div key={idx} className="bg-white border border-zinc-200 p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all group flex flex-col h-full">
                                <div className="flex-1">
                                    <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md">
                                        {idx === 0 ? <Cloud size={20} /> : idx === 1 ? <Server size={20} /> : <Box size={20} />}
                                    </div>
                                    <h4 className="text-lg font-black text-zinc-900 leading-tight">{item.item}</h4>
                                    <div className="inline-block mt-3 px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                        {item.unit}
                                    </div>
                                    <p className="mt-5 text-sm text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-zinc-100">
                                    {item.isQuotation ? (
                                        <div className="text-lg font-black text-zinc-900">Based on Quotation</div>
                                    ) : (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Pricing</span>
                                            <span className="text-2xl font-black font-mono text-emerald-600">Rp {item.price?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: PLATFORM & AI */}
            {activeTab === 'platform' && (
                <div className="space-y-6 no-print">
                    <div className="flex flex-col mb-4">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Platform & AI Data</h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Ready-to-use licenses for individuals and SME teams.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                        {platformPricing.map((item, idx) => (
                            <div key={idx} className={`border p-6 md:p-8 rounded-[2rem] shadow-sm transition-all flex flex-col h-full ${idx === 1 ? 'bg-zinc-900 border-zinc-800 text-white shadow-xl' : 'bg-white border-zinc-200'}`}>
                                <div className="flex-1">
                                    <h4 className={`text-xl font-black leading-tight ${idx === 1 ? 'text-white' : 'text-zinc-900'}`}>{item.item}</h4>
                                    <div className={`inline-block mt-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${idx === 1 ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                                        {item.unit}
                                    </div>
                                    <p className={`mt-6 text-sm leading-relaxed font-medium ${idx === 1 ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.desc}</p>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${idx === 1 ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${idx === 1 ? 'text-zinc-500' : 'text-zinc-400'}`}>Monthly Pricing</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-3xl font-black font-mono ${idx === 1 ? 'text-emerald-400' : 'text-emerald-600'}`}>Rp {item.price.toLocaleString()}</span>
                                        <span className={`text-sm font-bold ${idx === 1 ? 'text-zinc-500' : 'text-zinc-400'}`}>/ {item.altPrice}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl max-w-5xl flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            <strong>Note for Team License:</strong> Supports up to 10 users with adjusted pricing which can be viewed directly on our official website <a href="https://mapid.co.id/pricing" target="_blank" rel="noreferrer" className="underline font-bold hover:text-blue-900">mapid.co.id/pricing</a>.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB: SERVICES */}
            {activeTab === 'services' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm no-print">
                    <div className="flex flex-col mb-6 pb-6 border-b border-zinc-100">
                        <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Services Plan</h3>
                        <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Standard Corporate Services & Engineer Day Rates</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {servicesPricing.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-zinc-50 border border-zinc-100 rounded-2xl gap-4 hover:border-zinc-300 transition-colors">
                                <div>
                                    <div className="font-black text-zinc-900 text-base">{item.item}</div>
                                    <p className="text-xs md:text-sm text-zinc-500 mt-1 font-medium">{item.desc}</p>
                                </div>
                                <div className="flex flex-col sm:items-end shrink-0">
                                    <div className="font-bold text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mb-1">{item.unit}</div>
                                    <div className="font-black text-lg md:text-xl font-mono text-zinc-900">Rp {item.price.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: API */}
            {activeTab === 'api' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm no-print">
                    <div className="flex flex-col mb-6 pb-6 border-b border-zinc-100">
                        <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">API Services Developers Plan</h3>
                        <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Pay-as-you-go micro-services pricing for API calls</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apiPricing.map((item, idx) => (
                            <div key={idx} className="flex flex-col justify-between p-5 bg-zinc-50 border border-zinc-100 rounded-2xl gap-4 hover:border-zinc-300 transition-colors">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-black text-zinc-900 text-base">{item.item}</div>
                                        <div className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-zinc-200">{item.unit}</div>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">{item.desc}</p>
                                </div>
                                <div className="pt-4 border-t border-zinc-200/50 mt-2">
                                    <div className="font-black text-xl font-mono text-zinc-900">Rp {item.price.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: SURVEY */}
            {activeTab === 'survey' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm no-print">
                    <div className="flex flex-col mb-6 pb-6 border-b border-zinc-100">
                        <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Survey Plan Data Collection</h3>
                        <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Prices per point for community and internal surveyor POIs</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {['POI', 'Questionnaire'].map(category => (
                            <div key={category}>
                                <h4 className="text-[11px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                                    <span className={`p-1.5 rounded-md ${category === 'POI' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {category === 'POI' ? 'POI' : 'QST'}
                                    </span>
                                    {category === 'POI' ? 'Point of Interest' : 'Questionnaires'}
                                </h4>
                                <div className="space-y-2">
                                    {surveyPricing.filter(s => s.category === category).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-3 px-4 md:px-5 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-300 transition-colors">
                                            <div className="font-bold text-zinc-900 text-sm">{item.type} {category === 'POI' ? 'POI' : 'Form'}</div>
                                            <div className="font-black text-sm md:text-base font-mono text-zinc-900">Rp {item.price.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: PARAMETERS & HPP */}
            {activeTab === 'parameters' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 no-print">
                    <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-8">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight uppercase">Service Level Agreement (SLA)</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">SLA constraints affecting operational speed premium</p>
                            <div className="mt-5 space-y-3">
                                {parameters.sla.map((p, i) => (
                                    <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center gap-4">
                                        <div>
                                            <span className="font-black text-zinc-900 text-sm block">{p.label}</span>
                                            <span className="text-xs text-zinc-500 mt-1 block font-medium leading-tight">{p.desc}</span>
                                        </div>
                                        <div className="font-black text-amber-600 bg-amber-50/50 border border-amber-100/50 px-3 py-1.5 rounded-xl text-xs shrink-0">x{p.multiplier}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-zinc-100">
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight uppercase">Project Accessibility</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Difficulty premium based on logistics & reachability</p>
                            <div className="mt-5 space-y-3">
                                {parameters.accessibility.map((a, i) => (
                                    <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center gap-4">
                                        <div>
                                            <span className="font-black text-zinc-900 text-sm block">{a.label}</span>
                                            <span className="text-xs text-zinc-500 mt-1 block font-medium leading-tight">{a.desc}</span>
                                        </div>
                                        <div className="font-black font-mono text-zinc-900 bg-zinc-200/50 px-3 py-1.5 rounded-xl text-xs shrink-0">+Rp {a.addon.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-8">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight uppercase">Verification Requirements</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Additional internal QA or direct client checking</p>
                            <div className="mt-5 space-y-3">
                                {parameters.verification.map((v, i) => (
                                    <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center gap-4">
                                        <div>
                                            <span className="font-black text-zinc-900 text-sm block">{v.label}</span>
                                            <span className="text-xs text-zinc-500 mt-1 block font-medium leading-tight">{v.desc}</span>
                                        </div>
                                        <div className="font-black font-mono text-zinc-900 bg-zinc-200/50 px-3 py-1.5 rounded-xl text-xs shrink-0">+Rp {v.addon.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-zinc-100">
                            <h3 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight uppercase">Media Requirements</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Operational & post-production media extras</p>
                            <div className="mt-5 space-y-3">
                                {parameters.media.map((m, i) => (
                                    <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center gap-4">
                                        <div>
                                            <span className="font-black text-zinc-900 text-sm block">{m.label}</span>
                                            <span className="text-xs text-zinc-500 mt-1 block font-medium leading-tight">{m.desc}</span>
                                        </div>
                                        <div className="font-black font-mono text-zinc-900 bg-zinc-200/50 px-3 py-1.5 rounded-xl text-xs shrink-0">+Rp {m.addon.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ====================== PRINT TEMPLATE ======================
function QuotationPrintTemplate({
    quote,
    items,
    subtotal,
    ppn,
    total,
}: {
    quote: Quotation;
    items: QuoteItem[];
    subtotal: number;
    ppn: number;
    total: number;
}) {
    const afterDiscount = subtotal - (quote.discount || 0);
    return (
        <div style={{ width: '210mm', minHeight: '297mm', padding: '14mm 16mm', background: 'white', fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif', fontSize: '10pt', color: '#111' }}>
            {/* Top header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16pt' }}>
                <div style={{ flex: 1 }}>
                    <img
                        src="/mapid-logo.png"
                        alt="MAPID"
                        style={{ height: '34pt', width: 'auto', display: 'block' }}
                    />
                    <h2 style={{ fontSize: '13pt', fontWeight: 700, marginTop: '18pt', marginBottom: '8pt' }}>QUOTATION LETTER</h2>
                </div>
                <div style={{ flex: 1, textAlign: 'left', paddingLeft: '12pt' }}>
                    <div style={{ fontWeight: 900, fontSize: '12pt', lineHeight: 1.2 }}>{COMPANY_INFO.name}</div>
                    <div style={{ marginTop: '6pt', fontSize: '8.5pt', whiteSpace: 'pre-line', color: '#444' }}>{COMPANY_INFO.address}</div>
                </div>
            </div>

            {/* Kepada + Jumlah */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12pt', marginBottom: '12pt' }}>
                <div style={{ flex: 1, background: '#f3f4f6', padding: '8pt 10pt' }}>
                    <div style={{ fontWeight: 700, fontSize: '8.5pt', marginBottom: '2pt' }}>Kepada</div>
                    <div style={{ fontWeight: 900, fontSize: '11pt' }}>{quote.customer_name || '—'}</div>
                    <div style={{ fontSize: '8pt', whiteSpace: 'pre-line', color: '#444', marginTop: '3pt', lineHeight: 1.4 }}>
                        {quote.customer_address}
                        {quote.customer_country ? `\n${quote.customer_country}` : ''}
                    </div>
                </div>
                <div style={{ flex: 1, padding: '8pt 10pt' }}>
                    <div style={{ fontSize: '8.5pt', color: '#555', marginBottom: '4pt' }}>Jumlah</div>
                    <div style={{ fontWeight: 900, fontSize: '15pt', textDecoration: 'underline', textUnderlineOffset: '3pt' }}>{formatIDR(total)}</div>
                </div>
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8pt', fontSize: '8.5pt' }}>
                <thead>
                    <tr style={{ background: '#3b82f6', color: 'white' }}>
                        <th style={{ padding: '6pt', textAlign: 'left', fontWeight: 700, width: '12%' }}>KODE</th>
                        <th style={{ padding: '6pt', textAlign: 'left', fontWeight: 700, width: '44%' }}>NAMA</th>
                        <th style={{ padding: '6pt', textAlign: 'center', fontWeight: 700, width: '6%' }}>QTY</th>
                        <th style={{ padding: '6pt', textAlign: 'left', fontWeight: 700, width: '11%' }}>SATUAN</th>
                        <th style={{ padding: '6pt', textAlign: 'right', fontWeight: 700, width: '13%' }}>@HARGA / UNIT</th>
                        <th style={{ padding: '6pt', textAlign: 'right', fontWeight: 700, width: '14%' }}>TOTAL HARGA</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '20pt', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>Belum ada item</td></tr>
                    ) : items.map((it, i) => (
                        <tr key={it.id} style={{ borderBottom: '0.5pt solid #e5e7eb', verticalAlign: 'top' }}>
                            <td style={{ padding: '6pt' }}>{it.code}</td>
                            <td style={{ padding: '6pt' }}>
                                <div style={{ fontWeight: 600 }}>{it.name}</div>
                                {it.description ? <div style={{ fontSize: '8pt', color: '#555', marginTop: '2pt', whiteSpace: 'pre-line' }}>{it.description}</div> : null}
                            </td>
                            <td style={{ padding: '6pt', textAlign: 'center' }}>{it.qty}</td>
                            <td style={{ padding: '6pt' }}>{it.unit}</td>
                            <td style={{ padding: '6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{it.unit_price.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '6pt', textAlign: 'right', fontFamily: 'Consolas, monospace', fontWeight: 700 }}>{(it.qty * it.unit_price).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Keterangan + Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16pt', marginTop: '16pt' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '8.5pt', paddingBottom: '3pt', borderBottom: '0.5pt solid #ccc', marginBottom: '4pt' }}>Keterangan</div>
                    <div style={{ fontSize: '8pt', color: '#444', lineHeight: 1.5 }}>{quote.keterangan}</div>

                    <div style={{ borderTop: '1pt dashed #999', margin: '16pt 0 8pt' }}></div>

                    <div style={{ fontWeight: 700, fontSize: '8.5pt', marginBottom: '4pt' }}>PAYMENT INFO</div>
                    <div style={{ fontSize: '8pt', lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 700 }}>{COMPANY_INFO.bank}</div>
                        <div><strong>Nama Rekening:</strong> {COMPANY_INFO.accountName}</div>
                        <div><strong>Nomor Rekening:</strong> {COMPANY_INFO.accountNumber}</div>
                    </div>
                </div>
                <div style={{ width: '40%' }}>
                    <table style={{ width: '100%', fontSize: '9pt', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr><td style={{ padding: '4pt 6pt', color: '#444' }}>Sub Total</td><td style={{ padding: '4pt 6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{subtotal.toLocaleString('id-ID')}</td></tr>
                            <tr><td style={{ padding: '4pt 6pt', color: '#444' }}>Diskon</td><td style={{ padding: '4pt 6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{(quote.discount || 0).toLocaleString('id-ID')}</td></tr>
                            <tr><td style={{ padding: '4pt 6pt', color: '#444' }}>PPN ({quote.ppn_percentage}%)</td><td style={{ padding: '4pt 6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{ppn.toLocaleString('id-ID')}</td></tr>
                            <tr><td style={{ padding: '4pt 6pt', color: '#444' }}>Biaya Lain-lain</td><td style={{ padding: '4pt 6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{(quote.biaya_lain_lain || 0).toLocaleString('id-ID')}</td></tr>
                            <tr style={{ background: '#3b82f6', color: 'white', fontWeight: 700 }}>
                                <td style={{ padding: '6pt' }}>Total</td>
                                <td style={{ padding: '6pt', textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{total.toLocaleString('id-ID')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Signature */}
            <div style={{ marginTop: '32pt', textAlign: 'right' }}>
                <div style={{ fontSize: '9pt' }}>{quote.location || 'Bandung'}, {formatDateID(quote.quote_date)}</div>
                <div style={{ height: '6pt' }} />
                <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '180pt' }}>
                    {quote.signature_url ? (
                        <img
                            src={quote.signature_url}
                            alt="Signature"
                            style={{ height: '54pt', maxWidth: '160pt', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                        />
                    ) : (
                        <div style={{ height: '54pt' }} />
                    )}
                    <div style={{ borderTop: '0.5pt solid #333', paddingTop: '4pt', marginTop: '2pt' }}>
                        <div style={{ fontWeight: 700, fontSize: '9.5pt' }}>{quote.signatory_name}</div>
                        <div style={{ fontWeight: 700, fontSize: '8.5pt' }}>{quote.signatory_title}</div>
                    </div>
                </div>
            </div>

        </div>
    );
}
