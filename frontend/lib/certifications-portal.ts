import { apiRequest } from "@/lib/api-client";
import { getAuthSession } from "@/lib/session";

export type CertificationStatus = "pending_verification" | "verified" | "rejected";

export type CertificationRecord = {
  _id: string;
  courseName: string;
  skillCategory: string;
  provider: string;
  completionDate: string;
  credentialUrl?: string;
  credentialId?: string;
  description?: string;
  verificationStatus: CertificationStatus;
  uploadTimestamp?: string;
  adminReviewTimestamp?: string | null;
  rejectionReason?: string;
  certificateFile?: {
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
    fileUrl?: string;
  } | null;
  userEmail?: string;
  internName?: string;
};

export type CertificationStats = {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
};

export const SKILL_CATEGORY_OPTIONS = [
  "Programming",
  "Frameworks",
  "Tools",
  "Databases",
  "Data / ML",
  "Projects",
  "Problem Solving"
] as const;

const STATUS_LABELS: Record<CertificationStatus, string> = {
  pending_verification: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected"
};

export function certificationStatusLabel(status: CertificationStatus): string {
  return STATUS_LABELS[status] || status;
}

export async function fetchMyCertifications() {
  return apiRequest<{ certifications: CertificationRecord[]; stats: CertificationStats }>(
    "/api/intern/certifications"
  );
}

export async function submitCertification(formData: FormData) {
  return apiRequest<{ message: string; certification: CertificationRecord }>("/api/intern/certifications", {
    method: "POST",
    body: formData
  });
}

function resolveApiBaseUrl() {
  if (typeof window === "undefined") return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
  try {
    const parsed = new URL(configured);
    const browserIsLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const configuredIsLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (configuredIsLocal && !browserIsLocal) {
      return `${window.location.protocol}//${window.location.hostname}:${parsed.port || "5000"}`;
    }
  } catch {
    // fall through
  }
  return configured;
}

export async function fetchCertificateBlob(certificationId: string, download = false) {
  const base = resolveApiBaseUrl();
  const token = getAuthSession().token;
  const qs = download ? "?download=1" : "";
  const response = await fetch(`${base}/api/intern/certifications/${certificationId}/file${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include"
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Could not load certificate file");
  }
  return response.blob();
}

export async function fetchAdminCertifications(params?: { status?: CertificationStatus; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest<{ certifications: CertificationRecord[] }>(`/api/admin/certifications${suffix}`);
}

export async function reviewAdminCertification(
  certificationId: string,
  payload: { status: "verified" | "rejected"; rejectionReason?: string }
) {
  return apiRequest<{ message: string; certification: CertificationRecord }>(
    `/api/admin/certifications/${certificationId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}

export async function fetchAdminCertificateBlob(certificationId: string, download = false) {
  const base = resolveApiBaseUrl();
  const token = getAuthSession().token;
  const qs = download ? "?download=1" : "";
  const response = await fetch(`${base}/api/admin/certifications/${certificationId}/file${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include"
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Could not load certificate file");
  }
  return response.blob();
}
