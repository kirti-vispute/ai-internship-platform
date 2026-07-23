"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { safeUrl } from "@/lib/safe-url";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminShell } from "@/components/dashboard/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { SummaryStatCard } from "@/components/dashboard/shared/summary-stat-card";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { ErrorState as SharedErrorState, classifyErrorMessage } from "@/components/errors/error-state";
import { ADMIN_PERMISSIONS, canAccessAdminView, hasAdminPermission } from "@/constants/admin-permissions";
import { logoutAuthSession } from "@/lib/api-client";
import { getAuthSession, type AdminRole } from "@/lib/session";
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
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { StatusBadge } from "@/components/icons/status-badge";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";
import { AdminGrowthCharts } from "@/components/dashboard/admin/admin-growth-charts";
import { AdminRecentActivityPanel } from "@/components/dashboard/admin/admin-recent-activity-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { DashboardErrorState, LoadingRows, formatDate } from "@/components/dashboard/admin/admin-dashboard-shared";
import { AdminCompaniesView } from "@/components/dashboard/admin/views/admin-companies-view";

// View-gated surfaces (certification review / hiring scoring / theme settings) never
// appear on the default "overview" view — split them into their own chunks.
const AdminCertificationReview = dynamic(
  () => import("@/components/dashboard/admin/admin-certification-review").then((m) => m.AdminCertificationReview),
  { ssr: false }
);
const AdminHiringScoringPanel = dynamic(
  () => import("@/components/dashboard/admin/admin-hiring-scoring-panel").then((m) => m.AdminHiringScoringPanel),
  { ssr: false }
);
const ThemeSettingsPanel = dynamic(
  () => import("@/components/theme/theme-settings-panel").then((m) => m.ThemeSettingsPanel),
  { ssr: false }
);

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
  | "settings"
  | "hiring-scoring"
  | "certification-review";

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
  settings: { title: "Settings", subtitle: "Administrative controls and platform safeguards." },
  "hiring-scoring": {
    title: "AI Hiring Scoring",
    subtitle: "Configure role-specific evaluation weights with validation and version history."
  },
  "certification-review": {
    title: "Certification Review",
    subtitle: "Approve or reject intern course completion submissions."
  }
};

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

  const debouncedSearch = useDebouncedValue(search);
  const debouncedCompanySearch = useDebouncedValue(companySearch);
  const debouncedLogSearch = useDebouncedValue(logSearch);

  const [companyPage, setCompanyPage] = useState(1);
  const [internshipPage, setInternshipPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const PAGE_SIZE = 10;

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [confirmAction, setConfirmAction] = useState<
    | { type: "delete-user"; user: AdminUser }
    | { type: "suspend-company"; company: AdminCompany }
    | { type: "remove-internship"; internship: AdminInternship }
    | null
  >(null);

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
          const [m, u, c, i, r, l] = await Promise.all([
            fetchAdminMetrics(force),
            fetchAdminUsers({ limit: 100, force }),
            fetchAdminCompanies({ force }),
            fetchAdminInternships(force),
            fetchAdminReports(force),
            fetchAdminActivityLogs({ page: 1, limit: 20, force })
          ]);
          setMetrics(m);
          setUsers(u.users);
          setUserTotal(u.total);
          setCompanies(c);
          setInternships(i);
          setReports(r);
          setLogs(l.logs || []);
        } else if (view === "users") {
          const response = await fetchAdminUsers({ page: userPage, limit: 50, q: debouncedSearch, role: roleFilter, force });
          setUsers(response.users);
          setUserTotal(response.total);
        } else if (view === "analytics") {
          setMetrics(await fetchAdminMetrics(force));
          setCompanies(await fetchAdminCompanies({ force }));
          setInternships(await fetchAdminInternships(force));
        } else if (view === "companies") {
          setCompanies(await fetchAdminCompanies({ q: debouncedCompanySearch, force }));
        } else if (view === "verification") {
          setCompanies(await fetchAdminCompanies({ status: "pending", q: debouncedCompanySearch, force }));
        } else if (view === "internships") {
          setInternships(await fetchAdminInternships(force));
        } else if (view === "reports") {
          setReports(await fetchAdminReports(force));
        } else if (view === "activity-logs") {
          const response = await fetchAdminActivityLogs({ page: logsPage, limit: 30, q: debouncedLogSearch, force });
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
    [view, userPage, debouncedSearch, roleFilter, debouncedCompanySearch, logsPage, debouncedLogSearch]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCompanyPage(1);
    setInternshipPage(1);
    setReportPage(1);
    setSelectedUserIds(new Set());
  }, [view]);

  const handleLogout = useCallback(async () => {
    await logoutAuthSession();
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

  const runConfirmedAction = useCallback(async () => {
    if (!confirmAction) return;
    setBulkBusy(true);
    try {
      if (confirmAction.type === "delete-user") {
        await handleSoftDeleteUser(confirmAction.user);
      } else if (confirmAction.type === "suspend-company") {
        await handleVerify(confirmAction.company, "suspended", "Suspended by admin");
      } else if (confirmAction.type === "remove-internship") {
        await moderateAdminInternship(confirmAction.internship._id, { removePost: true });
        await loadData(true);
      }
    } finally {
      setBulkBusy(false);
      setConfirmAction(null);
    }
  }, [confirmAction, handleSoftDeleteUser, handleVerify, loadData]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const handleBulkUserActivation = useCallback(
    async (isActive: boolean) => {
      if (!canUpdateUsers || selectedUserIds.size === 0) return;
      setBulkBusy(true);
      try {
        const targets = users.filter((u) => selectedUserIds.has(u._id));
        for (const user of targets) {
          await updateAdminUser(user._id, { isActive });
        }
        const response = await fetchAdminUsers({ page: userPage, limit: 50, q: debouncedSearch, role: roleFilter, force: true });
        setUsers(response.users);
        setUserTotal(response.total);
        setSelectedUserIds(new Set());
      } catch (err) {
        setError((err as Error).message || "Bulk action failed");
      } finally {
        setBulkBusy(false);
      }
    },
    [canUpdateUsers, selectedUserIds, users, userPage, debouncedSearch, roleFilter]
  );

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

  const visibleCompanies = view === "verification" ? pendingCompanies : companies;
  const companyTotalPages = Math.max(1, Math.ceil(visibleCompanies.length / PAGE_SIZE));
  const pagedCompanies = useMemo(
    () => visibleCompanies.slice((companyPage - 1) * PAGE_SIZE, companyPage * PAGE_SIZE),
    [visibleCompanies, companyPage]
  );

  const internshipTotalPages = Math.max(1, Math.ceil(internships.length / PAGE_SIZE));
  const pagedInternships = useMemo(
    () => internships.slice((internshipPage - 1) * PAGE_SIZE, internshipPage * PAGE_SIZE),
    [internships, internshipPage]
  );

  const reportTotalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const pagedReports = useMemo(
    () => reports.slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE),
    [reports, reportPage]
  );

  if (!canAccessAdminView(view, permissions)) {
    return null;
  }

  return (
    <AdminShell welcomeName={welcomeName} adminRole={adminRole} permissions={permissions} onLogout={handleLogout}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--ds-text)]">{meta.title}</h1>
          <p className="mt-1 text-sm text-[var(--ds-muted)]">{meta.subtitle}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => loadData(true)} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <DashboardErrorState message={error} onRetry={() => loadData(true)} />
        </div>
      )}

      {view === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReportDownloadButton reportKey="platform-statistics" label="Download Platform Statistics PDF" />
          </div>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`row1-${i}`} className="h-28 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`row2-${i}`} className="h-28 w-full" />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`row3-${i}`} className="h-56 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryStatCard title="Total Students" value={stats.totalStudents} hint="Registered intern accounts" icon={GraduationCap} />
                <SummaryStatCard title="Total Companies" value={stats.totalCompanies} hint={`${stats.pending} pending verification`} icon={Building2} />
                <SummaryStatCard title="Active Internships" value={stats.activeInternships} hint="Active postings on platform" icon={ClipboardList} />
                <SummaryStatCard
                  title="Total Applications"
                  value="—"
                  hint="Not exposed by the admin API yet"
                  icon={Users}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryStatCard title="Interviews" value={stats.activeInterviews} hint="Ongoing interview pipeline" icon={Calendar} />
                <SummaryStatCard title="Offers" value={stats.totalHires} hint="Selected or offered applications" icon={UserCheck} />
                <SummaryStatCard title="Pending Verifications" value={stats.pending} hint="Companies awaiting approval" icon={Building2} />
                <SummaryStatCard title="Reports" value={stats.openReports} hint={`${reports.length} total reports`} icon={Flag} />
              </div>

              <div className="mt-6">
                <AdminGrowthCharts users={users} companies={companies} internships={internships} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AdminRecentActivityPanel logs={logs} />

                <div className="space-y-4">
                  <Card title="Pending Verification" subtitle="Companies awaiting approval">
                    {pendingCompanies.length === 0 ? (
                      <EmptyState title="No pending companies" hint="All companies have been reviewed." presetKey="companies" />
                    ) : (
                      <ul className="space-y-2">
                        {pendingCompanies.slice(0, 5).map((company) => (
                          <li
                            key={company._id}
                            className="flex items-center justify-between rounded-xl border border-[var(--ds-border)] bg-[var(--ds-card)] px-3 py-2.5 "
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--ds-text)]">{company.companyName}</p>
                              <p className="truncate text-xs text-[var(--ds-muted)]">{company.companyEmail}</p>
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
                    {reports.filter((r) => r.status === "open").length === 0 ? (
                      <EmptyState title="No open reports" hint="The moderation queue is clear." presetKey="reports" />
                    ) : (
                      <ul className="space-y-2">
                        {reports
                          .filter((r) => r.status === "open")
                          .slice(0, 5)
                          .map((report) => (
                            <li
                              key={report._id}
                              className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-card)] px-3 py-2.5 "
                            >
                              <p className="truncate text-sm font-semibold text-[var(--ds-text)]">
                                {report.company?.companyName || "Unknown company"}
                              </p>
                              <p className="truncate text-xs text-[var(--ds-muted)]">{report.reason}</p>
                            </li>
                          ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {view === "users" && (
        <Card>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <SearchInput
                value={search}
                onValueChange={(next) => {
                  setSearch(next);
                  setUserPage(1);
                }}
                loading={loading && Boolean(debouncedSearch)}
                placeholder="Search by email..."
              />
              <select
                value={roleFilter}
                aria-label="Filter by role"
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setUserPage(1);
                }}
                className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-input)] px-3 py-2 text-sm "
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

          {loading ? (
            <SkeletonTable rows={6} columns={7} />
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description={search || roleFilter ? "No users match the current search or role filter." : undefined}
              presetKey="users"
              action={
                search || roleFilter ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("");
                      setUserPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">

              {canUpdateUsers && selectedUserIds.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ds-primary)]/30 bg-[var(--ds-info-bg)] px-3 py-2.5">
                  <span className="text-sm font-semibold text-[var(--ds-primary)]">
                    {selectedUserIds.size} user{selectedUserIds.size > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => handleBulkUserActivation(true)}>
                      Activate
                    </Button>
                    <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => handleBulkUserActivation(false)}>
                      Deactivate
                    </Button>
                    <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelectedUserIds(new Set())}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--ds-border)] text-xs uppercase tracking-wide text-[var(--ds-muted)] ">
                    {canUpdateUsers && (
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label="Select all users on this page"
                          checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u._id))}
                          onChange={(event) => {
                            setSelectedUserIds(event.target.checked ? new Set(filteredUsers.map((u) => u._id)) : new Set());
                          }}
                        />
                      </th>
                    )}
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
                    <tr key={user._id} className="border-b border-[var(--ds-border)]">
                      {canUpdateUsers && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${user.email}`}
                            checked={selectedUserIds.has(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                          />
                        </td>
                      )}
                      <td className="px-3 py-3 font-medium text-[var(--ds-text)]">{user.email}</td>
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
                              className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-input)] px-2 py-1 text-xs "
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="verification_admin">Verification Admin</option>
                              <option value="moderation_admin">Moderation Admin</option>
                              <option value="support_admin">Support Admin</option>
                            </select>
                          ) : (
                            <span className="text-xs capitalize text-[var(--ds-text-secondary)]">{user.adminRole?.replace(/_/g, " ") || "—"}</span>
                          )
                        ) : (
                          <span className="text-xs text-[var(--ds-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[var(--ds-text-secondary)]">
                        {user.isActive === false ? "Inactive" : "Active"}
                      </td>
                      <td className="px-3 py-3 text-[var(--ds-muted)]">{formatDate(user.createdAt)}</td>
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
                            <Button size="sm" variant="secondary" disabled={busyId === user._id} onClick={() => setConfirmAction({ type: "delete-user", user })}>
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
              <div className="flex items-center justify-between pt-2 text-xs text-[var(--ds-muted)]">
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
          </div>
        </Card>
      )}

      {(view === "companies" || view === "verification") && (
        <AdminCompaniesView
          view={view}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          setCompanyPage={setCompanyPage}
          loading={loading}
          debouncedCompanySearch={debouncedCompanySearch}
          visibleCompanies={visibleCompanies}
          pagedCompanies={pagedCompanies}
          companyPage={companyPage}
          companyTotalPages={companyTotalPages}
          canVerifyCompanies={canVerifyCompanies}
          busyId={busyId}
          setBusyId={setBusyId}
          setCompanies={setCompanies}
          setError={setError}
          rejectingId={rejectingId}
          setRejectingId={setRejectingId}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          handleVerify={handleVerify}
          onSuspend={(company) => setConfirmAction({ type: "suspend-company", company })}
          loadData={loadData}
        />
      )}

      {view === "internships" && (
        <Card>
          {loading ? (
            <SkeletonTable rows={6} columns={7} />
          ) : internships.length === 0 ? (
            <EmptyState title="No internships posted yet" presetKey="internships" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--ds-border)] text-xs uppercase tracking-wide text-[var(--ds-muted)] ">
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
                  {pagedInternships.map((internship) => (
                    <tr key={internship._id} className="border-b border-[var(--ds-border)]">
                      <td className="px-3 py-3 font-medium text-[var(--ds-text)]">{internship.role}</td>
                      <td className="px-3 py-3 text-[var(--ds-text-secondary)]">{internship.company?.companyName || "—"}</td>
                      <td className="px-3 py-3 text-[var(--ds-text-secondary)]">{internship.location || "—"}</td>
                      <td className="px-3 py-3 text-[var(--ds-text-secondary)]">{internship.stipend || "—"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={internship.isActive === false ? "rejected" : "verified"} />
                      </td>
                      <td className="px-3 py-3 text-[var(--ds-muted)]">{formatDate(internship.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              try {
                                await moderateAdminInternship(internship._id, { isActive: !internship.isActive });
                                await loadData(true);
                              } catch (err) {
                                setError((err as Error).message || "Failed to update internship");
                              }
                            }}
                          >
                            {internship.isActive === false ? "Activate" : "Deactivate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmAction({ type: "remove-internship", internship })}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between pt-3 text-xs text-[var(--ds-muted)]">
                <span>
                  Page {internshipPage} of {internshipTotalPages} · {internships.length} internships
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={internshipPage <= 1} onClick={() => setInternshipPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button size="sm" variant="secondary" disabled={internshipPage >= internshipTotalPages} onClick={() => setInternshipPage((p) => Math.min(internshipTotalPages, p + 1))}>
                    Next
                  </Button>
                </div>
              </div>
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
            <>
            {pagedReports.map((report) => (
              <Card key={report._id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-[var(--ds-text)]">
                        {report.company?.companyName || "Unknown company"}
                      </h3>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--ds-text-secondary)]">{report.reason}</p>
                    {report.reportType && (
                      <p className="mt-1 text-xs capitalize text-[var(--ds-muted)]">Type: {report.reportType.replace(/_/g, " ")}</p>
                    )}
                    {report.details && (
                      <p className="mt-2 text-xs text-[var(--ds-text-secondary)]">{report.details}</p>
                    )}
                    {report.internship?.role && (
                      <p className="mt-1 text-xs text-[var(--ds-muted)]">Internship: {report.internship.role}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--ds-muted)]">
                      {report.reportedBy?.email && <span>Reported by: {report.reportedBy.email}</span>}
                      <span>Filed: {formatDate(report.createdAt)}</span>
                    </div>
                    {(report.evidenceUrls || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(report.evidenceUrls || []).map((url, index) => (
                          <a
                            key={`${report._id}-evidence-${index}`}
                            href={safeUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--ds-accent)]"
                          >
                            Evidence {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {report.status === "resolved" && report.resolutionNote && (
                      <p className="mt-2 text-xs text-[var(--ds-success)]">Resolution: {report.resolutionNote}</p>
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
            ))}
            <div className="flex items-center justify-between pt-1 text-xs text-[var(--ds-muted)]">
              <span>
                Page {reportPage} of {reportTotalPages} · {reports.length} reports
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={reportPage <= 1} onClick={() => setReportPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={reportPage >= reportTotalPages} onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {view === "activity-logs" && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-2">
            <SearchInput
              value={logSearch}
              onValueChange={(next) => {
                setLogSearch(next);
                setLogsPage(1);
              }}
              loading={loading && Boolean(debouncedLogSearch)}
              placeholder="Search activity logs..."
              containerClassName="min-w-[220px] flex-1"
            />
            <Button size="sm" variant="secondary" onClick={() => loadData(true)}>
              Search
            </Button>
          </div>
          {loading ? (
            <LoadingRows rows={6} />
          ) : logs.length === 0 ? (
            <EmptyState
              title={logSearch ? "No logs match your search" : "No activity recorded yet"}
              hint={logSearch ? "Try a different keyword or action name." : "Administrative and hiring actions will appear here."}
              presetKey="activity"
              action={
                logSearch ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setLogSearch("");
                      setLogsPage(1);
                    }}
                  >
                    Clear Search
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-card)] px-3 py-2.5 "
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ds-text)]">
                      <span className="capitalize">{(log.action || "").replace(/_/g, " ") || "Action"}</span>
                    </p>
                    <p className="truncate text-xs text-[var(--ds-muted)]">
                      {log.actorUser?.email ? `${log.actorUser.email} · ` : log.actorRole ? `${log.actorRole} · ` : ""}
                      {log.entityType || ""}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--ds-muted)]">{formatDate(log.createdAt)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--ds-muted)]">
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
              <div className="rounded-xl border border-[var(--ds-border)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--ds-muted)]">Pending Company Approvals</p>
                <p className="mt-1 text-2xl font-black text-[var(--ds-text)]">{stats.pending}</p>
              </div>
              <div className="rounded-xl border border-[var(--ds-border)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--ds-muted)]">Open Reports</p>
                <p className="mt-1 text-2xl font-black text-[var(--ds-text)]">{stats.openReports}</p>
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
                <li key={`report-${report._id}`} className="rounded-xl border border-[var(--ds-border)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--ds-text)]">Report: {report.company?.companyName || "Unknown company"}</p>
                  <p className="text-xs text-[var(--ds-muted)]">{report.reason}</p>
                </li>
              ))}
              {logs.slice(0, 8).map((log) => (
                <li key={`log-${log._id}`} className="rounded-xl border border-[var(--ds-border)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--ds-text)]">{(log.action || "").replace(/_/g, " ")}</p>
                  <p className="text-xs text-[var(--ds-muted)]">{log.actorUser?.email || log.actorRole || "system"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {view === "certification-review" && (
        <Card title={meta.title} subtitle={meta.subtitle}>
          <AdminCertificationReview />
        </Card>
      )}

      {view === "hiring-scoring" && hasAdminPermission(permissions, ADMIN_PERMISSIONS.MANAGE) && <AdminHiringScoringPanel />}

      {view === "settings" && (
        <Card title="Administrative Settings" subtitle="Safety controls and account policy preferences">
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--ds-border)] p-3">
              <p className="text-sm font-semibold text-[var(--ds-text)]">Your Admin Account</p>
              <p className="mt-1 text-xs text-[var(--ds-muted)]">Email: {welcomeName}</p>
              <p className="text-xs capitalize text-[var(--ds-muted)]">Role: {adminRole?.replace(/_/g, " ") || "super admin"}</p>
              <p className="mt-1 text-xs text-[var(--ds-muted)]">{permissions.length} permissions assigned</p>
            </div>
            <div className="rounded-xl border border-[var(--ds-border)] p-3">
              <p className="text-sm font-semibold text-[var(--ds-text)]">Admin MFA Policy</p>
              <p className="text-xs text-[var(--ds-muted)]">Admin login is protected with mandatory OTP verification.</p>
            </div>
            <div className="rounded-xl border border-[var(--ds-border)] p-3">
              <p className="text-sm font-semibold text-[var(--ds-text)]">Session Security</p>
              <p className="text-xs text-[var(--ds-muted)]">Access tokens auto-refresh and sessions are cookie backed.</p>
            </div>
            <div className="rounded-xl border border-[var(--ds-border)] p-3">
              <p className="text-sm font-semibold text-[var(--ds-text)]">Default Admin Credentials (dev seed)</p>
              <p className="text-xs text-[var(--ds-muted)]">admin@internai.com / Admin@123</p>
            </div>
          </div>
        </Card>
      )}

      {view === "settings" && <ThemeSettingsPanel />}

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "delete-user"
            ? `Soft delete ${confirmAction.user.email}?`
            : confirmAction?.type === "suspend-company"
              ? `Suspend ${confirmAction.company.companyName}?`
              : confirmAction?.type === "remove-internship"
                ? `Remove "${confirmAction.internship.role}" posting?`
                : ""
        }
        description={
          confirmAction?.type === "delete-user"
            ? "The account is deactivated and marked deleted. This can be reversed by reactivating the user."
            : confirmAction?.type === "suspend-company"
              ? "The company loses platform access until reinstated by an admin."
              : confirmAction?.type === "remove-internship"
                ? "This internship posting will be removed from the platform."
                : undefined
        }
        confirmLabel={confirmAction?.type === "delete-user" ? "Soft Delete" : confirmAction?.type === "suspend-company" ? "Suspend" : "Remove"}
        busy={bulkBusy}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
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
