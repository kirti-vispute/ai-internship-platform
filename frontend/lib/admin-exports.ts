import { getAuthSession } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type AdminExcelExportKey = "candidates" | "internships" | "users-intern" | "users-hr" | "users-ceo";

const EXPORT_PATHS: Record<AdminExcelExportKey, string> = {
  candidates: "/api/admin/reports/candidates.xlsx",
  internships: "/api/admin/reports/internships.xlsx",
  "users-intern": "/api/admin/reports/users-intern.xlsx",
  "users-hr": "/api/admin/reports/users-hr.xlsx",
  "users-ceo": "/api/admin/reports/users-ceo.xlsx"
};

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="?([^"]+)"?/);
  return match?.[1] || fallback;
}

export async function downloadAdminExcelExport(key: AdminExcelExportKey) {
  const session = getAuthSession();
  if (!session?.token) {
    throw new Error("Please sign in to download this export.");
  }

  const response = await fetch(`${API_BASE}${EXPORT_PATHS[key]}`, {
    headers: { Authorization: `Bearer ${session.token}` }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to generate the Excel export.");
  }

  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("Content-Disposition"), `CareerSetu-${key}.xlsx`);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { filename };
}
