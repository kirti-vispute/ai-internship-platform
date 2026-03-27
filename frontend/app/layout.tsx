import type { Metadata } from "next";
import { Manrope } from "next/font/google";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var key = "internai-theme";
                  var stored = localStorage.getItem(key);
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = stored === "dark" || stored === "light" ? stored : (prefersDark ? "dark" : "light");
                  if (theme === "dark") document.documentElement.classList.add("dark");
                  else document.documentElement.classList.remove("dark");
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${manrope.variable} font-sans text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
