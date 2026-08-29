import { apiRequest } from "@/lib/api-client";
import type { InternshipListing } from "@/lib/intern-portal";

export type { InternshipListing };

// GET /api/internships and /api/internships/:id carry no auth middleware --
// they're the public catalog Unstop-style browsing reads from, distinct from
// the intern-scoped /api/intern/internships used inside the dashboard (which
// additionally computes matchPercent against the signed-in intern's profile).
export async function fetchPublicInternships(
  params: { role?: string; location?: string; limit?: number } = {}
): Promise<InternshipListing[]> {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 60));
  if (params.role) search.set("role", params.role);
  if (params.location) search.set("location", params.location);

  const response = await apiRequest<{ internships: InternshipListing[] }>(`/api/internships?${search.toString()}`);
  return response.internships || [];
}

export async function fetchPublicInternshipById(id: string): Promise<InternshipListing> {
  const response = await apiRequest<{ internship: InternshipListing }>(`/api/internships/${id}`);
  return response.internship;
}
