import type { Metadata } from "next";
import { PortfolioPublicPageClient } from "@/components/portfolio/portfolio-public-page-client";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | InternAI Portfolio`,
    description: `Professional 3D portfolio for ${username} on InternAI.`,
    robots: { index: true, follow: true }
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { username } = await params;
  return <PortfolioPublicPageClient slug={username} />;
}
