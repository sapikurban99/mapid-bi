'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Target, Settings } from "lucide-react";
import { getConfig } from "../lib/config";
import { useEffect, useState } from "react";

export default function SidebarNav() {
    const pathname = usePathname();
    const [sidebarTitle, setSidebarTitle] = useState('BUSINESS MAPID');

    useEffect(() => {
        const config = getConfig();
        setSidebarTitle(config.sidebarTitle);
    }, []);

    const links = [
        { href: '/', label: 'Strategy & RACI', icon: Target },
        { href: '/dashboard', label: 'BI Dashboard', icon: LayoutDashboard },
        { href: '/admin', label: 'Admin Panel', icon: Settings },
    ];

    return (
        <nav className="w-full md:w-64 bg-white border-r border-zinc-200 shrink-0 md:min-h-screen p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-10">
                <img src="https://mapid.co.id/img/mapid_logo_black.png" alt="Mapid Logo" className="h-8 w-auto px-1" />
            </div>

            <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
                {links.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition whitespace-nowrap ${pathname === link.href
                            ? 'bg-zinc-900 text-white'
                            : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                            }`}
                    >
                        <link.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{link.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
