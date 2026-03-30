import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { CursorMount } from "@/components/cursor-mount";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "AI Internship Platform",
  description: "Modern AI-powered internship platform for interns and companies"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} font-sans text-slate-100 antialiased`}>
        <CursorMount />
        {children}
      </body>
    </html>
  );
}
