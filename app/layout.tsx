import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarNav from "./components/SidebarNav";

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

        {/* SIDEBAR NAVIGATION */}
        <SidebarNav />

        {/* KONTEN HALAMAN UTAMA */}
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>

      </body>
    </html>
  );
}