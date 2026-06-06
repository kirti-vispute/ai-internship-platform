import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CursorMount } from "@/components/cursor-mount";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import "./platform-design-system.css";
import "./readability.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CareerSetu | Connecting Skills to Success",
  description: "CareerSetu — Connecting Skills to Success. Internship and placement management for students, companies, and administrators.",
  icons: {
    icon: [
      { url: "/brand/logo.png", sizes: "any" },
      { url: "/brand/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/logo.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/brand/logo.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans text-[var(--ds-text,#e5e7eb)] antialiased [text-rendering:optimizeLegibility]`}
        suppressHydrationWarning
      >
        <CursorMount />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
