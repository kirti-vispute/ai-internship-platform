"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { ADMIN_PERMISSIONS, canAccessAdminView, hasAdminPermission } from "@/constants/admin-permissions";
import { clearAuthSession, getAuthSession, type AdminRole } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  fetchAdminActivityLogs,
  fetchAdminCompanies,
  fetchAdminInternships,
  fetchAdminMetrics,
  fetchAdminReports,
  fetchAdminUsers,
  invalidateAdminPortalCache,
  resolveReport,
  softDeleteAdminUser,
  updateAdminUser,
  updateReportStatus,
  updateCompanyVerification,
  moderateAdminInternship,
  type AdminActivityLog,
  type AdminCompany,
  type AdminInternship,
  type AdminMetrics,
  type AdminReport,
  type AdminUser
} from "@/lib/admin-portal";
import { Building2, Calendar, ClipboardList, Flag, GraduationCap, UserCheck, Users } from "lucide-react";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/icons/status-badge";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";

export type AdminDashboardView =
  | "overview"
  | "users"
  | "companies"
  | "verification"
  | "internships"
  | "reports"
  | "activity-logs"
  | "analytics"
  | "notifications"
  | "settings";

const VIEW_META: Record<AdminDashboardView, { title: string; subtitle: string }> = {
  overview: { title: "Platform Overview", subtitle: "Live snapshot of platform health, users, and moderation." },
  users: { title: "User Management", subtitle: "All interns, companies, and administrators on the platform." },
  companies: { title: "Companies", subtitle: "Registered companies and their verification status." },
  verification: { title: "Verification Queue", subtitle: "Review and approve or reject pending company accounts." },
  internships: { title: "Internships", subtitle: "All internship postings across companies." },
  reports: { title: "Reported Companies", subtitle: "Abuse reports awaiting moderation." },
  "activity-logs": { title: "Activity Logs", subtitle: "Audit trail of administrative and hiring actions." },
  analytics: { title: "Platform Analytics", subtitle: "Real-time KPIs and operational trends." },
  notifications: { title: "Notifications", subtitle: "Recent operational alerts and moderation notifications." },
  settings: { title: "Settings", subtitle: "Administrative controls and platform safeguards." }
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}


function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
      <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{message}</p>
      <div className="mt-3">
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function DocumentLinks({ company }: { company: AdminCompany }) {
  const links = [
    { label: "LinkedIn", url: company.linkedInUrl },
    { label: "HR Identity Proof", url: company.hrIdentityProofUrl },
    { label: "Business Registration", url: company.businessRegistrationProofUrl },
    ...(company.verificationDocuments || []).map((url, index) => ({ label: `Document ${index + 1}`, url }))
  ].filter((item) => item.url);

  if (links.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((item) => (
        <a
          key={`${item.label}-${item.url}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-primary-300"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function AdminDashboardInner({ view }: { view: AdminDashboardView }) {
  const router = useRouter();
  const meta = VIEW_META[view];
  const session = getAuthSession();
  const permissions = session.permissions;
  const adminRole = session.adminRole;
  const welcomeName = session.email || "Administrator";

  const canUpdateUsers = hasAdminPermission(permissions, ADMIN_PERMISSIONS.USER_UPDATE);
  const canDeleteUsers = hasAdminPermission(permissions, ADMIN_PERMISSIONS.USER_DELETE);
  const canVerifyCompanies = hasAdminPermission(permissions, ADMIN_PERMISSIONS.COMPANY_VERIFY);
  const canReviewReports = hasAdminPermission(permissions, ADMIN_PERMISSIONS.REPORT_REVIEW);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [internships, setInternships] = useState<AdminInternship[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logSearch, setLogSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!canAccessAdminView(view, permissions)) {
      router.replace("/dashboard/admin");
    }
  }, [view, permissions, router]);

  const loadData = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        // The overview needs everything; specific views fetch their own slice.
        if (view === "overview") {
          const [m, u, c, i, r] = await Promise.all([
            fetchAdminMetrics(force),
            fetchAdminUsers({ limit: 50, force }),
            fetchAdminCompanies({ force }),
            fetchAdminInternships(force),
            fetchAdminReports(force)
          ]);
          setMetrics(m);
          setUsers(u.users);
          setUserTotal(u.total);
          setCompanies(c);
          setInternships(i);
          setReports(r);
        } else if (view === "users") {
          const response = await fetchAdminUsers({ page: userPage, limit: 50, q: search, role: roleFilter, force });
          setUsers(response.users);
          setUserTotal(response.total);
        } else if (view === "analytics") {
          setMetrics(await fetchAdminMetrics(force));
          setCompanies(await fetchAdminCompanies({ force }));
          setInternships(await fetchAdminInternships(force));
        } else if (view === "companies") {
          setCompanies(await fetchAdminCompanies({ q: companySearch, force }));
        } else if (view === "verification") {
          setCompanies(await fetchAdminCompanies({ status: "pending", q: companySearch, force }));
        } else if (view === "internships") {
          setInternships(await fetchAdminInternships(force));
        } else if (view === "reports") {
          setReports(await fetchAdminReports(force));
        } else if (view === "activity-logs") {
          const response = await fetchAdminActivityLogs({ page: logsPage, limit: 30, q: logSearch, force });
          setLogs(response.logs || []);
          setLogsTotal(response.total || 0);
        } else if (view === "notifications") {
          setReports(await fetchAdminReports(force));
          const response = await fetchAdminActivityLogs({ page: 1, limit: 20, force });
          setLogs(response.logs || []);
        } else if (view === "settings") {
          setUsers(await fetchAdminUsers({ limit: 10, force }).then((r) => r.users));
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [view, userPage, search, roleFilter, companySearch, logsPage, logSearch]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    invalidateAdminPortalCache();
    router.push("/auth/admin");
  }, [router]);

  const handleVerify = useCallback(
    async (company: AdminCompany, status: "verified" | "rejected" | "suspended", reason = "") => {
      if (!canVerifyCompanies) return;
      setBusyId(company._id);
      try {
        await updateCompanyVerification(company._id, status, reason);
        const refreshed = await fetchAdminCompanies({
          status: view === "verification" ? "pending" : undefined,
          q: companySearch,
          force: true
        });
        setCompanies(refreshed);
        setRejectingId(null);
        setRejectReason("");
      } catch (err) {
        setError((err as Error).message || "Action failed");
      } finally {
        setBusyId(null);
      }
    },
    [canVerifyCompanies, view, companySearch]
  );

  const handleResolve = useCallback(async (report: AdminReport) => {
    setBusyId(report._id);
    try {
      await resolveReport(report._id, "Resolved by admin");
      const refreshed = await fetchAdminReports(true);
      setReports(refreshed);
    } catch (err) {
      setError((err as Error).message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleUserActivation = useCallback(async (user: AdminUser, isActive: boolean) => {
    if (!canUpdateUsers) return;
    setBusyId(user._id);
    try {
      await updateAdminUser(user._id, { isActive });
      const response = await fetchAdminUsers({ page: userPage, limit: 50, q: search, role: roleFilter, force: true });
      setUsers(response.users);
      setUserTotal(response.total);
    } catch (err) {
      setError((err as Error).message || "Failed to update user");
    } finally {
      setBusyId(null);
    }
  }, [canUpdateUsers, userPage, search, roleFilter]);

  const handleUserRole = useCallback(async (user: AdminUser, role: AdminUser["role"]) => {
    if (!canUpdateUsers) return;
    setBusyId(user._id);
    try {
      await updateAdminUser(user._id, { role });
      const response = await fetchAdminUsers({ page: userPage, limit: 50, q: search, role: roleFilter, force: true });
      setUsers(response.users);
      setUserTotal(response.total);
    } catch (err) {
      setError((err as Error).message || "Failed to update role");
    } finally {
      setBusyId(null);
    }
  }, [canUpdateUsers, userPage, search, roleFilter]);

  const handleAdminRoleChange = useCallback(async (user: AdminUser, nextAdminRole: AdminRole) => {
    if (!canUpdateUsers) return;
    setBusyId(user._id);
    try {
      await updateAdminUser(user._id, { adminRole: nextAdminRole });
      const response = await fetchAdminUsers({ page: userPage, limit: 50, q: search, role: roleFilter, force: true });
      setUsers(response.users);
      setUserTotal(response.total);
    } catch (err) {
      setError((err as Error).message || "Failed to update admin role");
    } finally {
      setBusyId(null);
    }
  }, [canUpdateUsers, userPage, search, roleFilter]);

  const handleSoftDeleteUser = useCallback(async (user: AdminUser) => {
    if (!canDeleteUsers) return;
    setBusyId(user._id);
    try {
      await softDeleteAdminUser(user._id);
      const response = await fetchAdminUsers({ page: userPage, limit: 50, q: search, role: roleFilter, force: true });
      setUsers(response.users);
      setUserTotal(response.total);
    } catch (err) {
      setError((err as Error).message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  }, [canDeleteUsers, userPage, search, roleFilter]);

  const handleReportStatus = useCallback(async (report: AdminReport, status: "in_review" | "escalated" | "resolved" | "dismissed") => {
    setBusyId(report._id);
    try {
      await updateReportStatus(report._id, {
        status,
        resolutionNote: status === "resolved" ? "Resolved by admin" : status === "dismissed" ? "Dismissed by admin" : ""
      });
      setReports(await fetchAdminReports(true));
    } catch (err) {
      setError((err as Error).message || "Failed to update report");
    } finally {
      setBusyId(null);
    }
  }, []);

  const stats = useMemo(() => {
    const interns = users.filter((u) => u.role === "intern").length;
    const companyUsers = users.filter((u) => u.role === "company").length;
    const pending = companies.filter((c) => c.verificationStatus === "pending").length;
    const openReports = reports.filter((r) => r.status === "open").length;
    return {
      interns,
      companyUsers,
      pending,
      openReports,
      totalStudents: metrics?.totalStudents ?? interns,
      totalCompanies: metrics?.totalCompanies ?? companies.length,
      activeInternships: metrics?.activeInternships ?? internships.length,
      totalHires: metrics?.totalHires ?? 0,
      activeInterviews: metrics?.activeInterviews ?? 0
    };
  }, [users, companies, reports, metrics, internships.length]);

  const pendingCompanies = useMemo(
    () => companies.filter((c) => c.verificationStatus === "pending"),
    [companies]
  );
  const filteredUsers = users;

  if (!canAccessAdminView(view, permissions)) {
    return null;
  }

  return (
    <AdminShell welcomeName={welcomeName} adminRole={adminRole} permissions={permissions} onLogout={handleLogout}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{meta.subtitle}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => loadData(true)} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorState message={error} onRetry={() => loadData(true)} />
        </div>
      )}

      {view === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReportDownloadButton reportKey="platform-statistics" label="Download Platform Statistics PDF" />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryStatCard title="Total Users" value={users.length} hint={`${stats.interns} interns · ${stats.companyUsers} companies`} icon={Users} />
              <SummaryStatCard title="Companies" value={stats.totalCompanies} hint={`${stats.pending} pending verification`} icon={Building2} />
              <SummaryStatCard title="Internships" value={stats.activeInternships} hint="Active postings on platform" icon={ClipboardList} />
              <SummaryStatCard title="Open Reports" value={stats.openReports} hint={`${reports.length} total reports`} icon={Flag} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Pending Verification" subtitle="Companies awaiting approval">
              {loading ? (
                <LoadingRows rows={3} />
              ) : pendingCompanies.length === 0 ? (
                <EmptyState title="No pending companies" hint="All companies have been reviewed." presetKey="companies" />
              ) : (
                <ul className="space-y-2">
                  {pendingCompanies.slice(0, 5).map((company) => (
                    <li
                      key={company._id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{company.companyName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{company.companyEmail}</p>
                      </div>
                      <Button size="sm" href="/dashboard/admin/verification" variant="secondary">
                        Review
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Open Reports" subtitle="Abuse reports needing attention">
              {loading ? (
                <LoadingRows rows={3} />
              ) : reports.filter((r) => r.status === "open").length === 0 ? (
                <EmptyState title="No open reports" hint="The moderation queue is clear." presetKey="reports" />
              ) : (
                <ul className="space-y-2">
                  {reports
                    .filter((r) => r.status === "open")
                    .slice(0, 5)
                    .map((report) => (
                      <li
                        key={report._id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/60"
                      >
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {report.company?.companyName || "Unknown company"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{report.reason}</p>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {view === "users" && (
        <Card>
          {loading ? (
            <LoadingRows />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" presetKey="users" />
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setUserPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  placeholder="Search by email..."
                />
                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setUserPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="">All roles</option>
                  <option value="intern">Intern</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" variant="secondary" onClick={() => loadData(true)}>
                  Apply filters
                </Button>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="px-3 py-2.5">Email</th>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5">Admin Role</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Joined</th>
                    <th className="px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-100">{user.email}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={user.role} />
                      </td>
                      <td className="px-3 py-3">
                        {user.role === "admin" ? (
                          canUpdateUsers ? (
                            <select
                              value={user.adminRole || "super_admin"}
                              disabled={busyId === user._id}
                              onChange={(event) => handleAdminRoleChange(user, event.target.value as AdminRole)}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="verification_admin">Verification Admin</option>
                              <option value="moderation_admin">Moderation Admin</option>
                              <option value="support_admin">Support Admin</option>
                            </select>
                          ) : (
                            <span className="text-xs capitalize text-slate-600 dark:text-slate-300">{user.adminRole?.replace(/_/g, " ") || "—"}</span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {user.isActive === false ? "Inactive" : "Active"}
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canUpdateUsers && (
                            <>
                              <Button size="sm" variant="secondary" disabled={busyId === user._id} onClick={() => handleUserActivation(user, user.isActive === false)}>
                                {user.isActive === false ? "Activate" : "Deactivate"}
                              </Button>
                              {user.role !== "admin" && (
                                <Button size="sm" variant="secondary" disabled={busyId === user._id} onClick={() => handleUserRole(user, user.role === "company" ? "intern" : "company")}>
                                  Toggle Role
                                </Button>
                              )}
                            </>
                          )}
                          {canDeleteUsers && (
                            <Button size="sm" variant="secondary" disabled={busyId === user._id} onClick={() => handleSoftDeleteUser(user)}>
                              Soft Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>
                  Page {userPage} · {users.length} of {userTotal} users
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={userPage <= 1 || loading} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button size="sm" variant="secondary" disabled={userPage * 50 >= userTotal || loading} onClick={() => setUserPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {(view === "companies" || view === "verification") && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={companySearch}
              onChange={(event) => setCompanySearch(event.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Search companies..."
            />
            <Button size="sm" variant="secondary" onClick={() => loadData(true)}>
              Search
            </Button>
          </div>
          {loading ? (
            <LoadingRows />
          ) : (view === "verification" ? pendingCompanies : companies).length === 0 ? (
            <EmptyState
              title={view === "verification" ? "No pending companies" : "No companies registered"}
              hint={view === "verification" ? "All companies have been reviewed." : undefined}
              presetKey="companies"
            />
          ) : (
            (view === "verification" ? pendingCompanies : companies).map((company) => (
              <Card key={company._id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{company.companyName}</h3>
                      <StatusBadge status={company.verificationStatus} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{company.companyEmail}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {company.gst && <span>GSTIN: {company.gst}</span>}
                      {company.contactName && <span>Contact: {company.contactName}</span>}
                      {company.phone && <span>Phone: {company.phone}</span>}
                      <span>Registered: {formatDate(company.createdAt)}</span>
                    </div>
                    {company.verificationStatus === "rejected" && company.rejectionReason && (
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Reason: {company.rejectionReason}</p>
                    )}
                    {company.description && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{company.description}</p>
                    )}
                    <DocumentLinks company={company} />
                  </div>

                  {canVerifyCompanies && (
                  <div className="flex flex-col items-stretch gap-2">
                    <ReportDownloadButton
                      reportKey="verification"
                      companyId={company._id}
                      label="Verification PDF"
                      size="sm"
                    />
                    {company.verificationStatus !== "verified" && (
                      <Button
                        size="sm"
                        disabled={busyId === company._id}
                        onClick={() => {
                          setBusyId(company._id);
                          updateCompanyVerification(company._id, "verified", "", true)
                            .then(() => fetchAdminCompanies({ status: view === "verification" ? "pending" : undefined, q: companySearch, force: true }))
                            .then((next) => setCompanies(next))
                            .catch((err) => setError((err as Error).message || "Action failed"))
                            .finally(() => setBusyId(null));
                        }}
                      >
                        {busyId === company._id ? "Saving…" : "Verify"}
                      </Button>
                    )}
                    {company.verificationStatus !== "rejected" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === company._id}
                        onClick={() => {
                          setRejectingId(rejectingId === company._id ? null : company._id);
                          setRejectReason("");
                        }}
                      >
                        Reject
                      </Button>
                    )}
                    {company.verificationStatus !== "suspended" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === company._id}
                        onClick={() => handleVerify(company, "suspended", "Suspended by admin")}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                  )}
                </div>

                {canVerifyCompanies && rejectingId === company._id && (
                  <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Rejection reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Explain why this company is being rejected…"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        disabled={busyId === company._id}
                        onClick={() => handleVerify(company, "rejected", rejectReason)}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {view === "internships" && (
        <Card>
          {loading ? (
            <LoadingRows />
          ) : internships.length === 0 ? (
            <EmptyState title="No internships posted yet" presetKey="internships" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5">Company</th>
                    <th className="px-3 py-2.5">Location</th>
                    <th className="px-3 py-2.5">Stipend</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Posted</th>
                    <th className="px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((internship) => (
                    <tr key={internship._id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-100">{internship.role}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{internship.company?.companyName || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{internship.location || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{internship.stipend || "—"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={internship.isActive === false ? "rejected" : "verified"} />
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{formatDate(internship.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              await moderateAdminInternship(internship._id, { isActive: !internship.isActive });
                              await loadData(true);
                            }}
                          >
                            {internship.isActive === false ? "Activate" : "Deactivate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await moderateAdminInternship(internship._id, { removePost: true });
                              await loadData(true);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {view === "reports" && (
        <div className="space-y-4">
          {loading ? (
            <LoadingRows />
          ) : reports.length === 0 ? (
            <EmptyState title={BRANDED_EMPTY_STATES.reports.title} hint={BRANDED_EMPTY_STATES.reports.hint} presetKey="reports" />
          ) : (
            reports.map((report) => (
              <Card key={report._id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                        {report.company?.companyName || "Unknown company"}
                      </h3>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{report.reason}</p>
                    {report.reportType && (
                      <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">Type: {report.reportType.replace(/_/g, " ")}</p>
                    )}
                    {report.details && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{report.details}</p>
                    )}
                    {report.internship?.role && (
                      <p className="mt-1 text-xs text-slate-500">Internship: {report.internship.role}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {report.reportedBy?.email && <span>Reported by: {report.reportedBy.email}</span>}
                      <span>Filed: {formatDate(report.createdAt)}</span>
                    </div>
                    {(report.evidenceUrls || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(report.evidenceUrls || []).map((url, index) => (
                          <a
                            key={`${report._id}-evidence-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-primary-300"
                          >
                            Evidence {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {report.status === "resolved" && report.resolutionNote && (
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Resolution: {report.resolutionNote}</p>
                    )}
                  </div>
                  {canReviewReports && (
                  <div className="flex flex-wrap gap-2">
                    {report.status !== "in_review" && (
                      <Button size="sm" variant="secondary" disabled={busyId === report._id} onClick={() => handleReportStatus(report, "in_review")}>
                        In Review
                      </Button>
                    )}
                    {report.status !== "escalated" && (
                      <Button size="sm" variant="secondary" disabled={busyId === report._id} onClick={() => handleReportStatus(report, "escalated")}>
                        Escalate
                      </Button>
                    )}
                    {report.status !== "resolved" && (
                      <Button size="sm" disabled={busyId === report._id} onClick={() => handleResolve(report)}>
                        {busyId === report._id ? "Saving…" : "Resolve"}
                      </Button>
                    )}
                    {report.status !== "dismissed" && (
                      <Button size="sm" variant="secondary" disabled={busyId === report._id} onClick={() => handleReportStatus(report, "dismissed")}>
                        Dismiss
                      </Button>
                    )}
                  </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {view === "activity-logs" && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              value={logSearch}
              onChange={(event) => {
                setLogSearch(event.target.value);
                setLogsPage(1);
              }}
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Search activity logs..."
            />
            <Button size="sm" variant="secondary" onClick={() => loadData(true)}>
              Search
            </Button>
          </div>
          {loading ? (
            <LoadingRows rows={6} />
          ) : logs.length === 0 ? (
            <EmptyState title="No activity recorded yet" hint="Administrative and hiring actions will appear here." presetKey="activity" />
          ) : (
            <>
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <span className="capitalize">{(log.action || "").replace(/_/g, " ") || "Action"}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {log.actorUser?.email ? `${log.actorUser.email} · ` : log.actorRole ? `${log.actorRole} · ` : ""}
                      {log.entityType || ""}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {logsPage} · {logs.length} of {logsTotal} entries
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={logsPage <= 1 || loading} onClick={() => setLogsPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={logsPage * 30 >= logsTotal || loading} onClick={() => setLogsPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
            </>
          )}
        </Card>
      )}

      {view === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStatCard title="Total Students" value={stats.totalStudents} hint="Registered intern accounts" icon={GraduationCap} />
            <SummaryStatCard title="Total Companies" value={stats.totalCompanies} hint="Company organizations onboarded" icon={Building2} />
            <SummaryStatCard title="Total Hires" value={stats.totalHires} hint="Applications marked selected/offered" icon={UserCheck} />
            <SummaryStatCard title="Active Interviews" value={stats.activeInterviews} hint="Ongoing interview pipeline" icon={Calendar} />
          </div>
          <Card title="Operational Mix" subtitle="Current platform workload distribution">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500">Pending Company Approvals</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{stats.pending}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500">Open Reports</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{stats.openReports}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === "notifications" && (
        <Card title="Recent Alerts" subtitle="Moderation and verification notifications">
          {reports.length === 0 && logs.length === 0 ? (
            <EmptyState title={BRANDED_EMPTY_STATES.notifications.title} hint={BRANDED_EMPTY_STATES.notifications.hint} presetKey="notifications" />
          ) : (
            <ul className="space-y-2">
              {reports.slice(0, 8).map((report) => (
                <li key={`report-${report._id}`} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Report: {report.company?.companyName || "Unknown company"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{report.reason}</p>
                </li>
              ))}
              {logs.slice(0, 8).map((log) => (
                <li key={`log-${log._id}`} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(log.action || "").replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{log.actorUser?.email || log.actorRole || "system"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {view === "settings" && (
        <Card title="Administrative Settings" subtitle="Safety controls and account policy preferences">
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your Admin Account</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email: {welcomeName}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">Role: {adminRole?.replace(/_/g, " ") || "super admin"}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{permissions.length} permissions assigned</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin MFA Policy</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin login is protected with mandatory OTP verification.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Session Security</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Access tokens auto-refresh and sessions are cookie backed.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Default Admin Credentials (dev seed)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">admin@internai.com / Admin@123</p>
            </div>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}

export function AdminDashboardPage({ view }: { view: AdminDashboardView }) {
  return (
    <RoleDashboardGuard expectedRole="admin">
      <AdminDashboardInner view={view} />
    </RoleDashboardGuard>
  );
}
