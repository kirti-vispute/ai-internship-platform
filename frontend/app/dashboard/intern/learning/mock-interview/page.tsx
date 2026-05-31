"use client";

import { useEffect, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function MockInterviewPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile().then(setProfile).catch(() => undefined);
  }, []);

  return (
    <SectionPanel title="Mock Interview" subtitle="Interview simulation workspace.">
          <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            No interview simulations available yet.
          </div>
        </SectionPanel>
  );
}
