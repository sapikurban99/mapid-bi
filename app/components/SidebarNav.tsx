'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Target, Settings, Menu, LogOut, PanelLeftClose, PanelRightClose, Briefcase, Calendar, Link2, TrendingUp, ChevronRight, MessageSquare, MessageCircle, Image as ImageIcon, SendHorizontal } from "lucide-react";
import { getConfig } from "../lib/config";
import { useEffect, useState } from "react";
import { useGlobalData } from "./GlobalDataProvider";

export default function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarTitle, setSidebarTitle] = useState('BUSINESS MAPID');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { syncData, isLoading } = useGlobalData();

    useEffect(() => {
        const config = getConfig();
        setSidebarTitle(config.sidebarTitle);
    }, []);

    const navigationGroups = [
        {
            title: 'Main Menu',
            links: [
                { href: '/', label: 'Strategy & RACI', icon: Target },
                { href: '/dashboard', label: 'BI Dashboard', icon: LayoutDashboard },
                { href: '/kpi-dashboard', label: 'KPI Dashboard', icon: Activity },
            ]
        },
        {
            title: 'B2B Performance',
            links: [
                { href: '/b2b-performance', label: 'B2B Performance', icon: Briefcase },
            ]
        },
        {
            title: 'B2C Performance',
            links: [
                { href: '/growth', label: 'Platform Performance', icon: TrendingUp },
                { href: '/academy-performance', label: 'Academy Performance', icon: Activity },
                { href: '/social-media-performance', label: 'Social Media Performance', icon: MessageSquare },
            ]
        },
        {
            title: 'Operations',
            links: [
                { href: '/b2b-board', label: 'B2B Delivery & Ops', icon: Briefcase },
                { href: '/daily-standup', label: 'Daily Standup', icon: Calendar },
                { href: '/b2c-campaigns', label: 'B2C Campaigns', icon: Target },
                { href: '/crm-wa', label: 'WA CRM & Blast', icon: MessageCircle },
            ]
        },
        {
            title: 'Configuration',
            links: [
                { href: '/kpi-config', label: 'KPI Config', icon: Settings },
                { href: '/links-setup', label: 'Public Links', icon: Link2 },
                { href: '/gallery-config', label: 'Gallery & Assets', icon: ImageIcon },
                { href: '/pricing-list', label: 'Pricing List', icon: Briefcase },
            ]
        }
    ];

    if (pathname === '/login' || pathname.startsWith('/l/')) {
        return null;
    }

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            sessionStorage.clear();
            localStorage.clear();
        }
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Top Header (Visible only on mobile) */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200 sticky top-0 z-[60]">
                <img src="https://mapid.co.id/img/mapid_logo_black.png" alt="Mapid Logo" className="h-6 w-auto" />
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-zinc-100 rounded-lg text-zinc-900"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <nav className={`fixed lg:sticky top-0 left-0 bottom-0 z-[56] transition-all duration-300 ease-in-out bg-white border-r border-zinc-200 flex flex-col h-screen
                ${isCollapsed ? 'w-20' : 'w-64'} 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className={`flex flex-col h-full overflow-y-auto custom-scrollbar ${isCollapsed ? 'p-4' : 'p-6'}`}>
                    {/* Header */}
                    <div className={`flex items-center mb-8 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!isCollapsed && (
                            <img src="https://mapid.co.id/img/mapid_logo_black.png" alt="Mapid Logo" className="h-7 w-auto" />
                        )}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition hidden lg:block"
                        >
                            {isCollapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-2 text-zinc-400"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <div className="flex flex-col gap-8 flex-1">
                        {navigationGroups.map((group, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                {!isCollapsed && (
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2 px-3">
                                        {group.title}
                                    </p>
                                )}
                                {isCollapsed && <div className="h-px bg-zinc-100 mb-4 mx-2"></div>}
                                
                                <div className="flex flex-col gap-1">
                                    {group.links.map(link => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                                                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                                                    : 'hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'
                                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                            >
                                                <link.icon size={18} className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                {!isCollapsed && (
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-bold text-[13px] tracking-tight">{link.label}</span>
                                                        {isActive && <ChevronRight size={12} className="opacity-40" />}
                                                    </div>
                                                )}
                                                {isActive && isCollapsed && (
                                                    <div className="absolute left-0 w-1 h-6 bg-zinc-900 rounded-r-full"></div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions (Pushed to bottom) */}
                    <div className={`mt-auto pt-8 flex flex-col gap-3 shrink-0 ${isCollapsed ? 'items-center' : ''}`}>
                        <button
                            onClick={() => syncData()}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLoading ? 'bg-zinc-100 text-zinc-400 cursor-wait' : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-zinc-200'}`}
                        >
                            {isLoading ? (isCollapsed ? '...' : 'Syncing...') : (isCollapsed ? <Activity size={16} /> : 'Sync Data')}
                        </button>

                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 ${isCollapsed ? 'px-0' : ''}`}
                        >
                            <LogOut size={16} className="shrink-0" />
                            {!isCollapsed && 'Log Out'}
                        </button>

                        {!isCollapsed && (
                            <div className="text-center mt-1">
                                <span className="text-[8px] font-black tracking-widest uppercase text-zinc-300">MAPID-BI v{process.env.NEXT_PUBLIC_APP_VERSION || '1.2.4'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f4f4f5; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e4e4e7; }
            `}} />
        </>
    );
}
