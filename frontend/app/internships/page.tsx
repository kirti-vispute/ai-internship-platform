import type { Metadata } from "next";
import { PublicInternshipsBrowse } from "@/components/internships/public-internships-browse";

export const metadata: Metadata = {
  title: "Browse Internships & Jobs",
  description: "Open internships and jobs from verified companies on CareerSetu. Browse freely — sign in as an intern to apply."
};

export default function InternshipsPage() {
  return <PublicInternshipsBrowse />;
}
