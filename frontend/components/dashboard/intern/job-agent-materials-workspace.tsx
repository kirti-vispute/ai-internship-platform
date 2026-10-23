"use client";

import { useState } from "react";
import { FileText, Mail, Eye, Pencil, Sparkles } from "lucide-react";
import { DashboardTabs, type DashboardTabItem } from "@/components/dashboard/shared/dashboard-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

// Distinguishes genuine LLM-generated content from the deterministic
// template, per the application-assistant's `source` field ("template" |
// "user-edited" | the AI provider name, e.g. "groq"). One small badge per
// document -- not repeated anywhere else in the card -- so the candidate
// always knows what produced it without the UI feeling badge-heavy.
export function sourceLabel(source?: string): string {
  if (!source || source === "template") return "Template-generated";
  if (source === "user-edited") return "Edited by you";
  return `AI-polished (${source})`;
}

const URL_IN_TEXT = /(https?:\/\/[^\s)]+)/g;

// Turns any raw URL inside a line of plain text into a real, clickable
// link -- the underlying saved content stays plain text (so copying it out
// never carries markup), only the preview's rendering linkifies it.
function linkify(text: string): React.ReactNode[] {
  const parts = text.split(URL_IN_TEXT);
  return parts.map((part, i) =>
    // split() on a capturing group places each matched URL as its own
    // array element -- checking the part's own shape (not re-running the
    // global/stateful regex, whose lastIndex would otherwise desync across
    // repeated .test() calls in this loop) is both correct and simpler.
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[var(--ds-accent)] underline underline-offset-2 hover:opacity-80">
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Renders generated text (resume highlights or a cover letter) as a clean
// document instead of a wall of text: an ALL-CAPS line on its own (the
// template's own section-heading convention, e.g. "PROFESSIONAL SUMMARY")
// becomes a section heading; a line immediately followed by a "- " bullet
// line is that bullet group's project/entry title; a "- " line becomes a
// real bulleted list item; a "  Label: value" line (tech stack, link)
// becomes a small muted caption with its URL, if any, clickable. Falls
// back to plain paragraphs for anything else (a cover letter has no
// section headings and renders as ordinary paragraphs).
type PreviewBlock =
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "caption"; text: string }
  | { type: "entryTitle"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "spacer" };

// Groups the raw lines into renderable blocks first -- in particular,
// consecutive "- " bullet lines become ONE <ul> with multiple <li>s
// (a document with each bullet as its own separate single-item list is
// invalid/unhelpful list semantics) -- then renders each block once.
function toPreviewBlocks(content: string): PreviewBlock[] {
  const lines = content.split("\n");
  const blocks: PreviewBlock[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "spacer" });
      continue;
    }

    const isHeading = trimmed.length > 2 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length < 40;
    if (isHeading) {
      blocks.push({ type: "heading", text: trimmed });
      continue;
    }

    if (trimmed.startsWith("-")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("-")) {
        items.push(lines[i].trim().replace(/^-\s*/, ""));
        i += 1;
      }
      i -= 1; // outer loop's own i++ accounts for the last consumed line
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (line.startsWith("  ")) {
      // A sub-caption line (e.g. "  Built with: ..." / "  Link: ...").
      blocks.push({ type: "caption", text: trimmed });
      continue;
    }

    // A short line immediately followed by a bullet is that bullet group's
    // own title (a project name) -- shown as a sub-heading.
    const nextTrimmed = (lines[i + 1] || "").trim();
    if (trimmed.length < 70 && nextTrimmed.startsWith("-")) {
      blocks.push({ type: "entryTitle", text: trimmed });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

function MaterialPreview({ content }: { content: string }) {
  const blocks = toPreviewBlocks(content);
  return (
    <div className="max-h-96 w-full overflow-y-auto rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5 text-sm leading-relaxed text-[var(--ds-text)]">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "spacer":
            return <div key={idx} className="h-2.5" aria-hidden />;
          case "heading":
            return (
              <p key={idx} className="mb-2 mt-4 border-b border-[var(--ds-border)] pb-1 text-xs font-bold uppercase tracking-wide text-[var(--ds-accent)] first:mt-0">
                {block.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={idx} className="list-disc space-y-0.5 pl-5 marker:text-[var(--ds-muted)]">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-[var(--ds-text-secondary)]">
                    {linkify(item)}
                  </li>
                ))}
              </ul>
            );
          case "caption":
            return (
              <p key={idx} className="ml-5 text-xs text-[var(--ds-muted)]">
                {linkify(block.text)}
              </p>
            );
          case "entryTitle":
            return (
              <p key={idx} className="mt-3 text-sm font-semibold text-[var(--ds-text)] first:mt-0">
                {block.text}
              </p>
            );
          default:
            return (
              <p key={idx} className="text-[var(--ds-text-secondary)]">
                {linkify(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

type MaterialEditorProps = {
  label: string;
  savedContent: string;
  draftValue: string;
  source?: string;
  onChange: (value: string) => void;
};

function MaterialEditor({ label, savedContent, draftValue, source, onChange }: MaterialEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const hasUnsavedChanges = draftValue !== savedContent;
  const wordCount = draftValue.trim() ? draftValue.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="neutral" icon={source && source !== "template" && source !== "user-edited" ? Sparkles : undefined}>
            {sourceLabel(source)}
          </Badge>
          {hasUnsavedChanges && (
            <Badge tone="warning" dot>
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--ds-border)] p-0.5">
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-pressed={mode === "edit"}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition",
              mode === "edit" ? "bg-[var(--ds-surface-raised)] text-[var(--ds-text)]" : "text-[var(--ds-muted)]"
            )}
          >
            <AppIcon icon={Pencil} size="xs" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            aria-pressed={mode === "preview"}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition",
              mode === "preview" ? "bg-[var(--ds-surface-raised)] text-[var(--ds-text)]" : "text-[var(--ds-muted)]"
            )}
          >
            <AppIcon icon={Eye} size="xs" /> Preview
          </button>
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          aria-label={label}
          className="h-72 w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4 text-sm leading-relaxed text-[var(--ds-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring)]"
          value={draftValue}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <MaterialPreview content={draftValue} />
      )}
      <p className="text-right text-[11px] text-[var(--ds-muted)]">{wordCount} words</p>
    </div>
  );
}

type JobAgentMaterialsWorkspaceProps = {
  tailoredResumeContent: string;
  tailoredResumeSource?: string;
  coverLetterContent: string;
  coverLetterSource?: string;
  draftResume: string;
  draftCoverLetter: string;
  onDraftResumeChange: (value: string) => void;
  onDraftCoverLetterChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
};

export function JobAgentMaterialsWorkspace({
  tailoredResumeContent,
  tailoredResumeSource,
  coverLetterContent,
  coverLetterSource,
  draftResume,
  draftCoverLetter,
  onDraftResumeChange,
  onDraftCoverLetterChange,
  onSave,
  saving
}: JobAgentMaterialsWorkspaceProps) {
  const hasUnsavedChanges = draftResume !== tailoredResumeContent || draftCoverLetter !== coverLetterContent;

  const tabs: DashboardTabItem[] = [
    {
      key: "resume",
      label: "Resume",
      icon: FileText,
      content: (
        <MaterialEditor
          label="Tailored Resume Highlights (review and edit before use)"
          savedContent={tailoredResumeContent}
          draftValue={draftResume}
          source={tailoredResumeSource}
          onChange={onDraftResumeChange}
        />
      )
    },
    {
      key: "cover-letter",
      label: "Cover Letter",
      icon: Mail,
      content: (
        <MaterialEditor
          label="Cover Letter (review and edit before use)"
          savedContent={coverLetterContent}
          draftValue={draftCoverLetter}
          source={coverLetterSource}
          onChange={onDraftCoverLetterChange}
        />
      )
    }
  ];

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--ds-border)] pt-4">
      <DashboardTabs tabs={tabs} defaultKey="resume" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--ds-muted)]">
          {hasUnsavedChanges ? "You have unsaved changes." : "Everything here is saved."}
        </p>
        <Button type="button" size="sm" disabled={saving || !hasUnsavedChanges} onClick={onSave}>
          {saving ? "Saving..." : "Save My Edits"}
        </Button>
      </div>
    </div>
  );
}
