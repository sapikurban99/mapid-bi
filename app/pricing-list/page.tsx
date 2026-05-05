'use client';

import { useState } from 'react';
import { DollarSign, FileText, Settings, HelpCircle, Briefcase, Calculator, Plus, X, ArrowRight, Sparkles, TrendingUp, ShieldCheck, Truck, Users, Activity, LayoutTemplate, Box, Server, Cloud } from 'lucide-react';

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

export default function PricingListPage() {
    const [activeTab, setActiveTab] = useState<'calculator' | 'enterprise' | 'platform' | 'services' | 'api' | 'survey' | 'parameters'>('calculator');

    // Calculator State
    const [calcBasePrice, setCalcBasePrice] = useState<number>(30000);
    const [calcUnits, setCalcUnits] = useState<number>(1);
    const [calcSla, setCalcSla] = useState<string>('Normal');
    const [calcAccessibility, setCalcAccessibility] = useState<string>('Urban');
    const [calcVerification, setCalcVerification] = useState<string>('None');
    const [calcMedia, setCalcMedia] = useState<string>('None');
    const [calcPermit, setCalcPermit] = useState<string>('No');
    const [hppBasePercentage, setHppBasePercentage] = useState<number>(40);

    // Dynamic Calculations
    const currentSla = parameters.sla.find(s => s.label === calcSla) || parameters.sla[0];
    const currentAcc = parameters.accessibility.find(a => a.label === calcAccessibility) || parameters.accessibility[0];
    const currentVer = parameters.verification.find(v => v.label === calcVerification) || parameters.verification[0];
    const currentMed = parameters.media.find(m => m.label === calcMedia) || parameters.media[0];
    const currentPerm = parameters.permit.find(p => p.label === calcPermit) || parameters.permit[0];

    const pricePerUnit = (calcBasePrice * currentSla.multiplier) + currentAcc.addon + currentVer.addon + currentMed.addon + currentPerm.addon;
    const totalRevenue = pricePerUnit * calcUnits;

    const baseHppPerUnit = calcBasePrice * (hppBasePercentage / 100);
    const addonsHppPerUnit = (currentAcc.addon + currentVer.addon + currentMed.addon + currentPerm.addon) * 0.5; // Assume addons take 50% operational cost
    const totalHpp = (baseHppPerUnit + addonsHppPerUnit) * calcUnits;

    const estimatedMargin = totalRevenue - totalHpp;
    const marginPercentage = totalRevenue > 0 ? (estimatedMargin / totalRevenue) * 100 : 0;

    return (
        <div className="p-4 md:p-8 min-h-screen bg-zinc-50 pb-20 font-sans">
            {/* HEADER */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 md:mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-2">
                        <Sparkles className="text-amber-500 w-6 h-6 md:w-8 md:h-8 shrink-0" /> PRICING CONFIGURATION
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium text-sm md:text-base">Platform & Services Pricing structure, HPP analysis & Margin Calculator</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-start overflow-x-auto max-w-full custom-scrollbar">
                    {[
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
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <tab.icon size={14} className="shrink-0" /> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* TAB CONTENT: CALCULATOR */}
            {activeTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* INPUT SECTION */}
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

                        {/* Base Price Config */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Base Price (IDR)</label>
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
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Quantity / Units</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={calcUnits} 
                                    onChange={(e) => setCalcUnits(Math.max(1, Number(e.target.value)))} 
                                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-black text-zinc-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Quick Presets for Base Price */}
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

                        {/* Parameters configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-2 border-t border-zinc-100">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Service Level Agreement (SLA)</label>
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
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Project Accessibility</label>
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
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Verification Type</label>
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
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Documentation Media</label>
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
                                <label className="block text-[10px] font-black text-zinc-400 mb-1.5 uppercase tracking-wider">Special Permit Required</label>
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

                        {/* HPP (Baseline Operational Cost Multiplier) */}
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

                    {/* RESULTS & BREAKDOWN */}
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

            {/* TAB CONTENT: ENTERPRISE LICENSE */}
            {activeTab === 'enterprise' && (
                <div className="space-y-6">
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

            {/* TAB CONTENT: PLATFORM & AI (PERSONAL & TEAM) */}
            {activeTab === 'platform' && (
                <div className="space-y-6">
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

            {/* TAB CONTENT: SERVICES PLAN */}
            {activeTab === 'services' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
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

            {/* TAB CONTENT: API SERVICES */}
            {activeTab === 'api' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
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

            {/* TAB CONTENT: SURVEY PLAN */}
            {activeTab === 'survey' && (
                <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
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

            {/* TAB CONTENT: PARAMETERS & HPP */}
            {activeTab === 'parameters' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* SLA & Accessibilities */}
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

                    {/* Verification & Media */}
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
