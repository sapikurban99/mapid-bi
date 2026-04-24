'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Target, Settings, Menu, LogOut, PanelLeftClose, PanelRightClose, Briefcase, Calendar, Link2 } from "lucide-react";
import { getConfig } from "../lib/config";
import { useEffect, useState } from "react";
import { useGlobalData } from "./GlobalDataProvider";

export default function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarTitle, setSidebarTitle] = useState('BUSINESS MAPID');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { syncData, isLoading } = useGlobalData();

    useEffect(() => {
        const config = getConfig();
        setSidebarTitle(config.sidebarTitle);
    }, []);

    const links = [
        { href: '/', label: 'Strategy & RACI', icon: Target },
        { href: '/dashboard', label: 'BI Dashboard', icon: LayoutDashboard },
        { href: '/b2b-board', label: 'B2B Delivery & Ops', icon: Briefcase },
        { href: '/daily-standup', label: 'Daily Standup', icon: Calendar },
        { href: '/growth', label: 'Growth Intelligence', icon: Activity },
        { href: '/links-setup', label: 'Public Links', icon: Link2 },
    ];

    if (pathname === '/login' || pathname.startsWith('/l/')) {
        return null; // Fullscreen login or public links page
    }

    const handleLogout = () => {
        // Clear all session states
        if (typeof window !== "undefined") {
            sessionStorage.clear();
            localStorage.clear();
        }
        router.push('/login');
    };

    return (
        <nav className={`transition-all duration-300 ease-in-out bg-white border-r border-zinc-200 shrink-0 lg:h-screen lg:sticky lg:top-0 flex flex-col z-50 ${isCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-64'}`}>
            <div className={`flex flex-col h-full overflow-y-auto ${isCollapsed ? 'p-4' : 'p-6'} pb-32`}>
                <div className={`flex items-center mb-10 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <img src="https://mapid.co.id/img/mapid_logo_black.png" alt="Mapid Logo" className="h-8 w-auto px-1" />
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-md hover:bg-zinc-100 text-zinc-500 transition hidden lg:block"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 shrink-0">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={isCollapsed ? link.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition whitespace-nowrap ${pathname === link.href
                                ? 'bg-zinc-900 text-white'
                                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <link.icon className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-sm">{link.label}</span>}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Actions Container - Push to bottom on Desktop */}
            <div className={`lg:absolute lg:bottom-0 lg:left-0 lg:w-full bg-white lg:border-t lg:border-zinc-100 ${isCollapsed ? 'p-4' : 'p-6'} hidden lg:flex flex-col gap-3 shrink-0 z-10`}>
                <button
                    onClick={() => syncData()}
                    disabled={isLoading}
                    title={isCollapsed ? "Sync Data" : undefined}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isLoading ? 'bg-zinc-100 text-zinc-400 cursor-wait' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:-translate-y-0.5'}`}
                >
                    {isLoading ? (isCollapsed ? '...' : 'Syncing...') : (isCollapsed ? <Activity className="w-4 h-4" /> : 'Sync Data')}
                </button>

                <button
                    onClick={handleLogout}
                    title={isCollapsed ? "Log Out" : undefined}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 ${isCollapsed ? 'p-3' : ''}`}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && 'Log Out'}
                </button>

                {!isCollapsed && (
                    <div className="text-center mt-2">
                        <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400">v{process.env.NEXT_PUBLIC_APP_VERSION || '0.1.24'}</span>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Border for spacing */}
            <div className="lg:hidden w-full h-px bg-zinc-200 mt-2 shrink-0"></div>
        </nav>
    );
}
