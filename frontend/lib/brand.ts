export const BRAND_NAME = "InternAI";
export const BRAND_TAGLINE = "AI-Powered Internship & Placement Management";
export const BRAND_TAGLINE_ALT = "Connecting Talent with Opportunity";
export const BRAND_PORTAL_NAME = "InternAI Internship & Placement Management Portal";

export const LOADING_MESSAGES = [
  "Preparing your opportunities...",
  "Analyzing your profile...",
  "Matching internships...",
  "Loading your dashboard...",
  "Syncing applications..."
] as const;

export const BRANDED_EMPTY_STATES = {
  applications: {
    title: "No Applications Yet",
    hint: "Explore recommended internships and submit your first application to begin your journey.",
    ctaLabel: "Browse Internships",
    ctaHref: "/dashboard/intern/internships/recommended"
  },
  interviews: {
    title: "No Interviews Scheduled",
    hint: "Once companies shortlist your profile, interview details will appear here.",
    ctaLabel: "Track Progress",
    ctaHref: "/dashboard/intern/track-progress"
  },
  savedInternships: {
    title: "No Saved Internships",
    hint: "Save roles you like while browsing to compare and apply later.",
    ctaLabel: "Search Internships",
    ctaHref: "/dashboard/intern/internships/search"
  },
  notifications: {
    title: "No Notifications",
    hint: "Application updates, interview invites, and platform alerts will show up here.",
    ctaLabel: "View Applications",
    ctaHref: "/dashboard/intern/applications"
  },
  applicants: {
    title: "No Applicants Yet",
    hint: "Post internships and share listings to start receiving candidate applications.",
    ctaLabel: "Post Internship",
    ctaHref: "/dashboard/company/internships"
  },
  reports: {
    title: "No Reports to Review",
    hint: "Company and user reports submitted for moderation will appear in this queue.",
    ctaLabel: "Platform Overview",
    ctaHref: "/dashboard/admin"
  }
} as const;
