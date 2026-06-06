"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import {
  Application,
  InternProfile,
  Recommendation,
  fetchInternApplications,
  fetchInternProfile,
  fetchInternRecommendations,
  peekInternProfile
} from "@/lib/intern-portal";
import { toDisplaySkillList } from "@/lib/skill-normalizer";

export default function SuggestionsPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cached = peekInternProfile();
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setError(null);

        const loadedProfile = await fetchInternProfile();
        setProfile(loadedProfile);
        setApplications(await fetchInternApplications());

        if (loadedProfile.resumeUploaded && (loadedProfile.resume?.parsed?.skills || []).length > 0) {
          setRecommendations(await fetchInternRecommendations(loadedProfile.resume?.parsed?.skills || [], true));
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load suggestions.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const missingRequiredSkills = useMemo(() => {
    const items = recommendations.flatMap((item) => item.missingRequiredSkills || []);
    return toDisplaySkillList(items).slice(0, 3);
  }, [recommendations]);

  const actionableSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (!profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0) {
      suggestions.push("Upload your resume to unlock accurate internship recommendations.");
    }
    if (missingRequiredSkills.length > 0) {
      suggestions.push(`Prioritize these missing required skills: ${missingRequiredSkills.join(", ")}.`);
    }
    if (applications.length === 0) {
      suggestions.push("Start by applying to one high-overall-score internship this week.");
    }

    if (suggestions.length === 0) {
      suggestions.push("Your profile looks strong. Keep applying to internships with high required skill match.");
    }

    return suggestions;
  }, [profile, missingRequiredSkills, applications]);

  return (
    <>
      {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading suggestions...</div>
        ) : (
          <SectionPanel title="Suggestions" subtitle="Generated from your resume data, recommendation results, and applications.">
            {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            {!error && (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {actionableSuggestions.map((item, idx) => (
                  <li key={`suggestion-${idx}`} className="surface-subtle px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </SectionPanel>
      )}
    </>
  );
}
