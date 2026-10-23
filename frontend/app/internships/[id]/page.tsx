import type { Metadata } from "next";
import { PublicInternshipDetail } from "@/components/internships/public-internship-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

async function fetchInternshipSummary(id: string): Promise<{ role?: string; description?: string; company?: { companyName?: string } } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/internships/${id}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.internship ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const internship = await fetchInternshipSummary(id);

  if (!internship) {
    return {
      title: "Internship",
      description: "Browse open internships and jobs on CareerSetu.",
      robots: { index: false, follow: false }
    };
  }

  const title = `${internship.role || "Internship"} at ${internship.company?.companyName || "CareerSetu"}`;
  return {
    title,
    description: internship.description?.slice(0, 160) || `Apply to ${internship.role || "this role"} at ${internship.company?.companyName || "this company"} on CareerSetu.`
  };
}

export default async function InternshipDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicInternshipDetail internshipId={id} />;
}
