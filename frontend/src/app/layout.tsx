import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";


const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "OTOHUB - Smart Management",
  description: "SaaS Dealership Management System",
  metadataBase: new URL('https://oto.modula.click'),
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
