export type FeatureItem = {
  title: string;
  description: string;
};

export const features: FeatureItem[] = [
  {
    title: "AI-Powered Matchmaking",
    description: "Automatically connect interns to high-fit roles and companies to high-potential candidates."
  },
  {
    title: "Smart Skill Gap Insights",
    description: "Identify gaps in candidate readiness and improve outcomes with focused recommendations."
  },
  {
    title: "Fast Hiring Workflows",
    description: "Track applicants, collaborate, and shorten the time from posting to offer."
  }
];

export const whyChoose = [
  "Built for both interns and companies with role-specific workflows",
  "Designed for verification-first trust and secure onboarding",
  "Modular architecture ready for Firebase, MongoDB, and AI API integrations"
];

export const stats = [
  { label: "Active Interns", value: "12K+" },
  { label: "Verified Companies", value: "850+" },
  { label: "Successful Placements", value: "4.2K+" },
  { label: "Avg. Hiring Time Reduced", value: "38%" }
];
