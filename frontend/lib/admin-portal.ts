import { apiRequest } from "@/lib/api-client";

export type AdminUser = {
  _id: string;
  email: string;
  role: "intern" | "company" | "admin";
  adminRole?: "super_admin" | "verification_admin" | "moderation_admin" | "support_admin" | null;
  permissions?: string[];
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
};

export type AdminCompany = {
  _id: string;
  companyName: string;
  companyEmail: string;
  gst?: string;
  contactName?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  rejectionReason?: string;
  verificationDocuments?: string[];
  linkedInUrl?: string;
  hrIdentityProofUrl?: string;
  businessRegistrationProofUrl?: string;
  verifiedBadgeIssuedAt?: string | null;
  createdAt?: string;
};

export type AdminInternship = {
  _id: string;
  role: string;
  location?: string;
  stipend?: string;
  duration?: string;
  isActive?: boolean;
  createdAt?: string;
  company?: {
    _id?: string;
    companyName?: string;
    companyEmail?: string;
    verificationStatus?: string;
  } | null;
};

export type AdminReport = {
  _id: string;
  reason: string;
  status: "open" | "in_review" | "escalated" | "resolved" | "dismissed";
  reportType?: "fake_internship" | "abusive_hr" | "scam_company" | "inappropriate_behavior" | "other";
  details?: string;
  evidenceUrls?: string[];
  resolutionNote?: string;
  createdAt?: string;
  company?: {
    _id?: string;
    companyName?: string;
    companyEmail?: string;
  } | null;
  reportedBy?: {
    _id?: string;
    email?: string;
    role?: string;
  } | null;
  internship?: {
    _id?: string;
    role?: string;
  } | null;
  hrUser?: {
    _id?: string;
    email?: string;
    role?: string;
  } | null;
};

export type AdminActivityLog = {
  _id: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
  actorUser?: {
    _id?: string;
    email?: string;
  } | null;
  createdAt?: string;
};

export type AdminMetrics = {
  totalStudents: number;
  totalCompanies: number;
  activeInternships: number;
  totalHires: number;
  reportsOverview: number;
  pendingCompanyApprovals: number;
  activeInterviews: number;
};

type CacheEntry = { ts: number; data: unknown };
const CACHE_TTL_MS = 30 * 1000;
const cacheStore = new Map<string, CacheEntry>();
const inFlightStore = new Map<string, Promise<unknown>>();

function getCache<T>(key: string): T | null {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }
  return cached.data as T;
}

function setCache<T>(key: string, data: T) {
  cacheStore.set(key, { ts: Date.now(), data });
}

async function withCache<T>(key: string, force: boolean, fetcher: () => Promise<T>): Promise<T> {
  if (!force) {
    const cached = getCache<T>(key);
    if (cached) return cached;
    const active = inFlightStore.get(key);
    if (active) return active as Promise<T>;
  }

  const pending = fetcher()
    .then((result) => {
      setCache(key, result);
      return result;
    })
    .finally(() => {
      inFlightStore.delete(key);
    });

  inFlightStore.set(key, pending);
  return pending;
}

export function invalidateAdminPortalCache() {
  cacheStore.clear();
  inFlightStore.clear();
}

export type PaginatedUsers = {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
};

export async function fetchAdminUsers(
  options: { page?: number; limit?: number; q?: string; role?: string; isActive?: string; force?: boolean } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (options.q) params.set("q", options.q);
  if (options.role) params.set("role", options.role);
  if (options.isActive) params.set("isActive", options.isActive);
  const cacheKey = `admin:users:${params.toString()}`;

  return withCache(cacheKey, options.force ?? false, async () => {
    const response = await apiRequest<PaginatedUsers>(`/api/admin/users?${params.toString()}`);
    return {
      users: response.users || [],
      page: response.page ?? page,
      limit: response.limit ?? limit,
      total: response.total ?? 0
    };
  });
}

export async function fetchAdminMetrics(force = false) {
  return withCache("admin:metrics", force, async () => {
    const response = await apiRequest<{ metrics: AdminMetrics }>("/api/admin/metrics");
    return response.metrics;
  });
}

export async function fetchAdminCompanies(
  options: { status?: string; q?: string; force?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.q) params.set("q", options.q);
  const query = params.toString();
  const cacheKey = `admin:companies:${query || "all"}`;

  return withCache(cacheKey, options.force ?? false, async () => {
    const response = await apiRequest<{ companies: AdminCompany[] }>(
      `/api/admin/companies${query ? `?${query}` : ""}`
    );
    return response.companies || [];
  });
}

export async function fetchAdminInternships(force = false) {
  return withCache("admin:internships", force, async () => {
    const response = await apiRequest<{ internships: AdminInternship[] }>("/api/admin/internships");
    return response.internships || [];
  });
}

export async function moderateAdminInternship(
  internshipId: string,
  payload: { isActive?: boolean; removePost?: boolean }
) {
  const response = await apiRequest<{ message: string; internship: AdminInternship }>(
    `/api/admin/internships/${internshipId}/moderation`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  invalidateAdminPortalCache();
  return response;
}

export async function fetchAdminReports(force = false) {
  return withCache("admin:reports", force, async () => {
    const response = await apiRequest<{ reports: AdminReport[] }>("/api/admin/reports");
    return response.reports || [];
  });
}

export async function fetchAdminActivityLogs(
  options: {
    page?: number;
    limit?: number;
    q?: string;
    entityType?: string;
    action?: string;
    force?: boolean;
  } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (options.q) params.set("q", options.q);
  if (options.entityType) params.set("entityType", options.entityType);
  if (options.action) params.set("action", options.action);

  return withCache(`admin:logs:${params.toString()}`, options.force ?? false, async () => {
    const response = await apiRequest<{ logs: AdminActivityLog[]; page: number; limit: number; total: number }>(
      `/api/admin/activity-logs?${params.toString()}`
    );
    return response;
  });
}

export async function updateCompanyVerification(
  companyId: string,
  status: "pending" | "verified" | "rejected" | "suspended",
  rejectionReason = "",
  verifiedBadge = false
) {
  const response = await apiRequest<{ company: AdminCompany; message: string }>(
    `/api/admin/companies/${companyId}/verification`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason, verifiedBadge })
    }
  );
  cacheStore.delete("admin:companies");
  return response.company;
}

export async function resolveReport(reportId: string, resolutionNote = "") {
  const response = await apiRequest<{ report: AdminReport; message: string }>(
    `/api/admin/reports/${reportId}/resolve`,
    {
      method: "PATCH",
      body: JSON.stringify({ resolutionNote, status: "resolved" })
    }
  );
  cacheStore.delete("admin:reports");
  return response.report;
}

export async function updateAdminUser(
  userId: string,
  payload: { isActive?: boolean; role?: "intern" | "company" | "admin"; adminRole?: "super_admin" | "verification_admin" | "moderation_admin" | "support_admin" }
) {
  const response = await apiRequest<{ user: AdminUser }>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  cacheStore.delete("admin:users");
  return response.user;
}

export async function softDeleteAdminUser(userId: string) {
  const response = await apiRequest<{ message: string }>(`/api/admin/users/${userId}`, {
    method: "DELETE"
  });
  cacheStore.delete("admin:users");
  return response.message;
}

export async function updateReportStatus(
  reportId: string,
  payload: { status: "open" | "in_review" | "escalated" | "resolved" | "dismissed"; resolutionNote?: string }
) {
  const response = await apiRequest<{ report: AdminReport }>(`/api/admin/reports/${reportId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  cacheStore.delete("admin:reports");
  return response.report;
}
