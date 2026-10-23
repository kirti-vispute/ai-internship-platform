"use client";

import { useEffect, useState } from "react";
import { SectionPanel } from "@/components/dashboard/shared/section-panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  JobAgentExperienceLevel,
  JobAgentNotificationFrequency,
  JobAgentPreference,
  JobAgentWorkMode,
  fetchJobAgentPreferences,
  saveJobAgentPreferences
} from "@/lib/job-agent-portal";

type FormState = {
  enabled: boolean;
  desiredRoles: string;
  locations: string;
  workMode: JobAgentWorkMode;
  minSalary: string;
  salaryCurrency: string;
  experienceLevel: JobAgentExperienceLevel;
  notificationFrequency: JobAgentNotificationFrequency;
};

const DEFAULT_FORM: FormState = {
  enabled: false,
  desiredRoles: "",
  locations: "",
  workMode: "any",
  minSalary: "",
  salaryCurrency: "INR",
  experienceLevel: "intern",
  notificationFrequency: "daily"
};

function preferenceToForm(preference: JobAgentPreference | null): FormState {
  if (!preference) return DEFAULT_FORM;
  return {
    enabled: preference.enabled,
    desiredRoles: (preference.desiredRoles || []).join(", "),
    locations: (preference.locations || []).join(", "),
    workMode: preference.workMode,
    minSalary: preference.minSalary != null ? String(preference.minSalary) : "",
    salaryCurrency: preference.salaryCurrency || "INR",
    experienceLevel: preference.experienceLevel,
    notificationFrequency: preference.notificationFrequency
  };
}

export default function JobAgentSettingsPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { preference } = await fetchJobAgentPreferences();
        setForm(preferenceToForm(preference));
      } catch (e) {
        setError((e as Error).message || "Failed to load your Job Agent settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const minSalaryValue = form.minSalary.trim() ? Number(form.minSalary) : null;
      if (form.minSalary.trim() && (Number.isNaN(minSalaryValue) || (minSalaryValue ?? 0) < 0)) {
        throw new Error("Minimum salary must be a non-negative number.");
      }

      await saveJobAgentPreferences({
        enabled: form.enabled,
        desiredRoles: form.desiredRoles.split(",").map((s) => s.trim()).filter(Boolean),
        locations: form.locations.split(",").map((s) => s.trim()).filter(Boolean),
        workMode: form.workMode,
        minSalary: minSalaryValue,
        salaryCurrency: form.salaryCurrency,
        experienceLevel: form.experienceLevel,
        notificationFrequency: form.notificationFrequency
      });

      pushToast({ title: "Job Agent settings saved", variant: "success" });
    } catch (e) {
      const message = (e as Error).message || "Failed to save settings.";
      setError(message);
      pushToast({ title: "Couldn't save settings", message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionPanel title="Agent Settings" subtitle="Tell the AI Job Agent what you're looking for — it uses this to score and alert you about new matches.">
      {loading ? (
        <SkeletonList rows={5} />
      ) : (
        <div className="max-w-xl space-y-4">
          {error && (
            <div className="rounded-xl border border-[var(--ds-danger)]/40 bg-[var(--ds-danger-bg)] px-4 py-3 text-sm text-[var(--ds-danger)]">
              {error}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[var(--ds-text)]">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            Enable the AI Job Agent (monitors for new matches automatically)
          </label>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Desired roles (comma-separated)</label>
            <input
              className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
              placeholder="e.g. Frontend Developer, Data Analyst"
              value={form.desiredRoles}
              onChange={(e) => setForm((f) => ({ ...f, desiredRoles: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Preferred locations (comma-separated)</label>
            <input
              className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
              placeholder="e.g. Bangalore, Pune"
              value={form.locations}
              onChange={(e) => setForm((f) => ({ ...f, locations: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Work mode</label>
              <select
                className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
                value={form.workMode}
                onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value as JobAgentWorkMode }))}
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Experience level</label>
              <select
                className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
                value={form.experienceLevel}
                onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value as JobAgentExperienceLevel }))}
              >
                <option value="intern">Intern</option>
                <option value="fresher">Fresher</option>
                <option value="0-1 years">0-1 years</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3+ years">3+ years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Minimum salary (optional)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
                placeholder="e.g. 20000"
                value={form.minSalary}
                onChange={(e) => setForm((f) => ({ ...f, minSalary: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ds-muted)]">Notification frequency</label>
              <select
                className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-2 text-sm text-[var(--ds-text)]"
                value={form.notificationFrequency}
                onChange={(e) => setForm((f) => ({ ...f, notificationFrequency: e.target.value as JobAgentNotificationFrequency }))}
              >
                <option value="realtime">As soon as found</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
          </div>

          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </SectionPanel>
  );
}
