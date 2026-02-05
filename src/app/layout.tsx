import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Showroom Dealer - Sistem Manajemen Dealer Kendaraan",
  description: "Platform SaaS untuk mengelola showroom dan dealer kendaraan. Manajemen stok, penjualan, kredit, dan keuangan dalam satu sistem terintegrasi.",
  keywords: ["showroom", "dealer", "kendaraan", "motor", "mobil", "kredit", "penjualan"],
  authors: [{ name: "Showroom Dealer Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
