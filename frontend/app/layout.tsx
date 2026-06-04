import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { CursorMount } from "@/components/cursor-mount";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "InternAI | AI Internship Platform",
  description: "InternAI — enterprise internship and placement management for students, companies, and administrators.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/logo-compact.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans text-slate-100 antialiased [text-rendering:optimizeLegibility]`} suppressHydrationWarning>
        <CursorMount />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
