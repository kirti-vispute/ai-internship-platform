"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Briefcase, CalendarClock, MapPin, Wallet } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/lib/use-auth-session";
import { buildAuthRedirectUrl } from "@/lib/auth-routes";
import { fetchPublicInternshipById, type InternshipListing } from "@/lib/public-internships";
import { fetchInternProfile, fetchInternApplications, type InternProfile } from "@/lib/intern-portal";
import { appliedInternshipIdsFromApplications } from "@/lib/instant-load";

const InternApplicationModal = dynamic(
  () => import("@/components/dashboard/intern/intern-application-modal").then((m) => m.InternApplicationModal),
  { ssr: false }
);

type Props = { internshipId: string };

function InfoChip({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1.5 text-xs text-[var(--ds-text-secondary)]">
      <Icon className="h-3.5 w-3.5 text-[var(--ds-primary)]" strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

export function PublicInternshipDetail({ internshipId }: Props) {
  const { loggedIn, role } = useAuthSession();
  const [internship, setInternship] = useState<InternshipListing | null>(null);
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicInternshipById(internshipId)
      .then((data) => {
        if (active) setInternship(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message || "Internship not found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [internshipId]);

  useEffect(() => {
    if (!loggedIn || role !== "intern") return;
    let active = true;
    Promise.all([fetchInternProfile(), fetchInternApplications()])
      .then(([loadedProfile, applications]) => {
        if (!active) return;
        setProfile(loadedProfile);
        setApplied(appliedInternshipIdsFromApplications(applications).has(internshipId));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loggedIn, role, internshipId]);

  if (loading) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] focus:outline-none">
        <Navbar />
        <div className="container-shell max-w-3xl space-y-4 py-12">
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !internship) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] focus:outline-none">
        <Navbar />
        <div className="container-shell max-w-3xl py-16 text-center">
          <p className="text-lg font-semibold">Internship not available</p>
          <p className="mt-2 text-sm text-[var(--ds-muted)]">{error || "This listing may have been closed or removed."}</p>
          <Link href="/internships" className="mt-6 inline-block text-sm font-semibold text-[var(--ds-primary)] underline">
            Browse other internships
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const applyHref = buildAuthRedirectUrl("intern", `/internships/${internshipId}`);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] focus:outline-none">
      <Navbar />

      <div className="container-shell max-w-3xl py-12 sm:py-16">
        <Link href="/internships" className="text-sm font-semibold text-[var(--ds-muted)] hover:text-[var(--ds-primary)]">
          ← Back to internships
        </Link>

        <div className="mt-4 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-card)] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
          <p className="text-sm font-semibold text-[var(--ds-muted)]">{internship.company?.companyName || "Company"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{internship.role}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <InfoChip icon={MapPin}>{internship.location}</InfoChip>
            <InfoChip icon={Briefcase}>{internship.mode ? internship.mode.replace(/\b\w/g, (c) => c.toUpperCase()) : ""}</InfoChip>
            <InfoChip icon={Wallet}>{internship.stipend}</InfoChip>
            <InfoChip icon={CalendarClock}>{internship.duration}</InfoChip>
          </div>

          <div className="mt-6">
            {!loggedIn && (
              <Link href={applyHref} className="inline-flex items-center justify-center rounded-full bg-[var(--ds-primary)] px-6 py-3 text-sm font-semibold text-[var(--ds-on-primary)] transition hover:bg-[var(--ds-primary-hover)]">
                Sign in to Apply
              </Link>
            )}
            {loggedIn && role !== "intern" && (
              <p className="text-sm text-[var(--ds-muted)]">Only intern accounts can apply to internships.</p>
            )}
            {loggedIn && role === "intern" && (
              <Button type="button" disabled={applied} onClick={() => setApplying(true)}>
                {applied ? "Applied" : "Apply Now"}
              </Button>
            )}
            {applySuccess && <p className="mt-2 text-sm text-[var(--ds-success)]">{applySuccess}</p>}
          </div>

          {internship.description && (
            <div className="mt-8">
              <h2 className="text-base font-semibold">About this role</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--ds-text-secondary)]">{internship.description}</p>
            </div>
          )}

          {internship.responsibilities && (
            <div className="mt-6">
              <h2 className="text-base font-semibold">Responsibilities</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--ds-text-secondary)]">{internship.responsibilities}</p>
            </div>
          )}

          {(internship.skillsRequired || []).length > 0 && (
            <div className="mt-6">
              <h2 className="text-base font-semibold">Skills required</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {internship.skillsRequired?.map((skill) => (
                  <span key={skill} className="rounded-full border border-[var(--ds-border)] px-2.5 py-1 text-xs text-[var(--ds-text-secondary)]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {internship.educationQualification && (
            <div className="mt-6">
              <h2 className="text-base font-semibold">Eligibility</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--ds-text-secondary)]">{internship.educationQualification}</p>
            </div>
          )}
        </div>
      </div>

      {applying && loggedIn && role === "intern" && (
        <InternApplicationModal
          internship={internship}
          resumePath={profile?.resume?.filePath || ""}
          onClose={() => setApplying(false)}
          onSuccess={() => {
            setApplied(true);
            setApplySuccess(`Application submitted for ${internship.role}.`);
            setApplying(false);
          }}
        />
      )}

      <Footer />
    </main>
  );
}
