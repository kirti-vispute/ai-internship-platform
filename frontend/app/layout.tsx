import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { CursorMount } from "@/components/cursor-mount";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { ServiceWorkerManager } from "@/components/pwa/service-worker-manager";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/seo";
import "./theme-tokens.generated.css";
import "./globals.css";
import "./platform-design-system.css";
import "./readability.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} | ${SITE_TAGLINE}`
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "internship management",
    "placement management",
    "internship platform",
    "ATS resume screening",
    "campus placements",
    "student internships",
    "hiring platform for companies"
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/brand/favicon-48.png", sizes: "any" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000c13"
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrlBrandLogo(),
  description: SITE_DESCRIPTION
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL
};

function absoluteUrlBrandLogo() {
  return new URL("/brand/logo-full.png", SITE_URL).toString();
}

function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareApplicationJsonLd) }}
        />
      </head>
      <body
        className={`internai-platform ${inter.variable} font-sans text-[var(--ds-text,#e5e7eb)] antialiased [text-rendering:optimizeLegibility]`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {/* Makes every framer-motion animation in the app respect OS-level
              prefers-reduced-motion automatically, without per-component checks. */}
          <MotionConfig reducedMotion="user">
            <CursorMount />
            <ToastProvider>{children}</ToastProvider>
            <ServiceWorkerManager />
            <InstallPrompt />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
