import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Activity, LayoutDashboard, Target } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAPID BI & Strategy",
  description: "Internal Business Intelligence & Strategy Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-zinc-50 text-zinc-900 flex flex-col md:flex-row min-h-screen`}>
        
        {/* SIDEBAR NAVIGATION - MINIMALIST WHITE */}
        <nav className="w-full md:w-64 bg-white border-r border-zinc-200 shrink-0 md:min-h-screen p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-900 font-black text-xl mb-10 tracking-tight">
            <Activity className="w-5 h-5" /> BUSINESS MAPID
          </div>
          
          <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition whitespace-nowrap"
            >
              <Target className="w-4 h-4" />
              <span className="font-medium text-sm">Strategy & RACI</span>
            </Link>

            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium text-sm">BI Dashboard</span>
            </Link>
          </div>
        </nav>

        {/* KONTEN HALAMAN UTAMA */}
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>

      </body>
    </html>
  );
}