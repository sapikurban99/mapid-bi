import type { Metadata } from "next";
import { Inter, Figtree } from "next/font/google";
import "./globals.css";
import SidebarNav from "./components/SidebarNav";
import { GlobalDataProvider } from "./components/GlobalDataProvider";

const inter = Inter({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "MAPID BI & Strategy",
  description: "Internal Business Intelligence & Strategy Dashboard",
  icons: {
    icon: 'https://mapid.co.id/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${figtree.variable}`}>
      <body className={`${inter.className} bg-zinc-50 text-zinc-900 flex flex-col lg:flex-row min-h-screen relative`}>

        <GlobalDataProvider>
          {/* SIDEBAR NAVIGATION */}
          <SidebarNav />

          {/* KONTEN HALAMAN UTAMA */}
          <div className="flex-1 min-w-0 min-h-screen">
            {children}
          </div>
        </GlobalDataProvider>

      </body>
    </html>
  );
}