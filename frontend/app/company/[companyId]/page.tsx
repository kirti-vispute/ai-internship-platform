import type { Metadata } from "next";
import { CompanyPublicProfilePage } from "@/components/company/company-public-profile-page";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Company Profile | InternAI",
    description: "Company profile, open positions, and hiring stats on InternAI.",
    robots: { index: false, follow: false }
  };
}

export default async function PublicCompanyProfileRoute({ params }: PageProps) {
  const { companyId } = await params;
  return <CompanyPublicProfilePage companyId={companyId} />;
}
