"use client";

import { Card } from "@/components/ui/card";
import { SkillChips } from "@/components/dashboard/skill-chips";
import type { CompanyApplication } from "@/lib/company-portal";

type InternLike = CompanyApplication["intern"];

export function ApplicantParsedResume({ intern }: { intern?: InternLike }) {
  const parsed = intern?.resume?.parsed;
  const projectList = parsed?.projects || [];
  const educationList = parsed?.education || [];
  const certificationList = parsed?.certifications || [];
  const achievementList = parsed?.achievements?.length
    ? parsed.achievements
    : intern?.achievements || [];
  const languages = parsed?.languages || [];
  const experienceList = parsed?.experience || [];
  const linkList = [...(parsed?.links || []), ...(intern?.links || [])].filter(Boolean);
  const summaryText = (parsed?.summary || intern?.summary || "").trim();

  return (
    <div className="space-y-4">
      <Card title="Summary" subtitle="Professional summary from the parsed resume.">
        {summaryText ? (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{summaryText}</p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">No summary extracted.</p>
        )}
      </Card>

      <Card title="Skills" subtitle="Extracted and normalized skills from the resume.">
        <SkillChips skills={parsed?.skills?.length ? parsed.skills : intern?.skills || []} />
        {!(parsed?.skills?.length || intern?.skills?.length) && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No skills extracted.</p>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Projects" subtitle="Resume project highlights.">
          {projectList.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No projects extracted yet.</p>
          ) : (
            <div className="space-y-2">
              {projectList.map((project, idx) => (
                <div key={`${project.title || "project"}-${idx}`} className="surface-subtle rounded-lg p-3.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{project.title || "Project"}</p>
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="mt-2">
                      <SkillChips skills={project.techStack} />
                    </div>
                  )}
                  {project.description && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{project.description}</p>}
                  {project.demoLink && (
                    <a
                      href={project.demoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      View demo
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Education" subtitle="Extracted academic details.">
          {educationList.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No education entries extracted yet.</p>
          ) : (
            <div className="space-y-2">
              {educationList.map((item, idx) => (
                <div key={`${item.degree || "education"}-${idx}`} className="surface-subtle rounded-lg p-3.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.degree || "Education"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.institution || item.raw || "-"}</p>
                  {(item.startYear || item.endYear) && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[item.startYear, item.endYear].filter(Boolean).join(" - ")}</p>
                  )}
                  {item.grade && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Grade: {item.grade}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Certifications" subtitle="Extracted certification records.">
          {certificationList.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No certifications extracted yet.</p>
          ) : (
            <div className="space-y-2">
              {certificationList.map((item, idx) => (
                <div key={`${item.name || "cert"}-${idx}`} className="surface-subtle rounded-lg p-3.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name || item.raw || "Certification"}</p>
                  {(item.issuer || item.year) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{[item.issuer, item.year].filter(Boolean).join(" | ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {experienceList.length > 0 && (
        <Card title="Experience" subtitle="Work experience extracted from the resume.">
          <div className="space-y-2">
            {experienceList.map((exp, idx) => (
              <div key={`${exp.role || "exp"}-${idx}`} className="surface-subtle rounded-lg p-3.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{exp.role || "Role"}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{exp.company || "-"}</p>
                {exp.duration && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exp.duration}</p>}
                {exp.description && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{exp.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Achievements" subtitle="Awards and notable accomplishments.">
        {achievementList.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No achievements extracted yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {achievementList.map((item, idx) => (
              <li key={`ach-${idx}`} className="surface-subtle rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200">
                {item}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Languages" subtitle="Detected from the resume.">
        {languages.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No languages extracted.</p>
        ) : (
          <SkillChips skills={languages} />
        )}
      </Card>

      {linkList.length > 0 && (
        <Card title="Links" subtitle="URLs extracted from the resume.">
          <ul className="space-y-1.5">
            {linkList.map((href, idx) => (
              <li key={`${href}-${idx}`}>
                <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400">
                  {href}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
