"use client";

import { useEffect, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function SupportPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile().then(setProfile).catch(() => undefined);
  }, []);

  return (
    <SectionPanel title="Help / Support" subtitle="Get help with your account and applications.">
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="surface-subtle px-3 py-2">No open support tickets.</div>
            <div className="surface-subtle px-3 py-2">If you face an issue, use your account support contact configured by the platform admin.</div>
            <div className="surface-subtle px-3 py-2">For recommendation accuracy, upload the latest resume and refresh your recommendation page.</div>
          </div>
        </SectionPanel>
  );
}
