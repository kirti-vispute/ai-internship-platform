"use client";

import { useState } from "react";
import { FolderArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { useToast } from "@/components/ui/toast";
import { downloadApplicantResumesZip } from "@/lib/company-portal";

type ResumeZipDownloadButtonProps = {
  /** Scope the download to one internship's applicants. Omit to download every applicant across the company. */
  internshipId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
};

export function ResumeZipDownloadButton({
  internshipId,
  label = "Download Resumes (.zip)",
  variant = "secondary",
  size = "sm",
  disabled = false,
  className
}: ResumeZipDownloadButtonProps) {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);
      const result = await downloadApplicantResumesZip({ internshipId });
      pushToast({
        title: "Resumes downloaded",
        message: `${result.filename} saved successfully.`,
        variant: "success"
      });
    } catch (error) {
      pushToast({
        title: "Download failed",
        message: (error as Error).message || "Unable to download resumes.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className ? `gap-2 ${className}` : "gap-2"}
      onClick={handleDownload}
      disabled={loading || disabled}
    >
      <AppIcon icon={FolderArchive} size="xs" className="text-current" />
      {loading ? "Zipping..." : label}
    </Button>
  );
}
