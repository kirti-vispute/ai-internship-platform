export type FeatureItem = {
  title: string;
  description: string;
};

export const features: FeatureItem[] = [
  {
    title: "AI-Powered Match Graph",
    description: "Evaluate internship fit using resume signals, skills, role priorities, and hiring context in one ranking engine."
  },
  {
    title: "Resume + Skill Intelligence",
    description: "Turn resume data into score drivers, missing-skill insights, and practical growth actions for better interview outcomes."
  },
  {
    title: "Verified Hiring Workflows",
    description: "Manage trusted company onboarding, applicant pipelines, shortlist stages, and feedback loops from one control layer."
  }
];

export const whyChoose = [
  "Role-based dashboards that keep intern growth paths and company hiring pipelines aligned",
  "Verification-first company trust layer that improves internship quality and candidate safety",
  "AI insights that continuously improve recommendations, resume strength, and application progress"
];

export const stats = [
  { label: "Students", value: "12K+" },
  { label: "Companies", value: "850+" },
  { label: "Internships", value: "4.2K+" },
  { label: "Placements", value: "38%" }
];

export const featuredInternships = [
  {
    id: "1",
    role: "AI Engineering Intern",
    company: "NovaTech",
    location: "Bengaluru",
    mode: "Hybrid",
    summary: "Work on ML pipelines, model evaluation, and deployment workflows with a senior mentor team."
  },
  {
    id: "2",
    role: "Product Design Intern",
    company: "PixelForge",
    location: "Remote",
    mode: "Remote",
    summary: "Contribute to design systems, user research, and high-fidelity prototypes for SaaS products."
  },
  {
    id: "3",
    role: "Full-Stack Developer Intern",
    company: "CloudNest",
    location: "Pune",
    mode: "On-site",
    summary: "Build internship hiring features using React, Node.js, and cloud-native deployment practices."
  }
];

export const learningPaths = [
  {
    id: "1",
    title: "Full-Stack Foundations",
    category: "Development",
    duration: "6 weeks",
    level: "Intermediate",
    summary: "React, Node.js, and API design patterns for internship-ready portfolios."
  },
  {
    id: "2",
    title: "Data Structures & Algorithms",
    category: "DSA",
    duration: "8 weeks",
    level: "All levels",
    summary: "Structured problem-solving tracks aligned with technical interview rounds."
  },
  {
    id: "3",
    title: "AI & ML Essentials",
    category: "AI / ML",
    duration: "5 weeks",
    level: "Advanced",
    summary: "Model basics, evaluation workflows, and deployment literacy for AI roles."
  },
  {
    id: "4",
    title: "Professional Certification Prep",
    category: "Certifications",
    duration: "4 weeks",
    level: "Beginner",
    summary: "Guided prep paths with skill checkpoints and recruiter-visible credentials."
  }
];

export const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Computer Science Intern",
    org: "IIT Delhi",
    quote: "Resume scoring and skill-gap insights helped me target the right internships and improve my interview readiness in two weeks."
  },
  {
    name: "Priya Nair",
    role: "Talent Lead",
    org: "NovaTech",
    quote: "We shortlist faster with transparent pipeline stages and AI-ranked candidates that match our role requirements."
  },
  {
    name: "Rohan Mehta",
    role: "HR Operations Manager",
    org: "OrbitWorks",
    quote: "InternAI gives our team one place to track applications, interviews, and feedback without losing context between recruiters."
  }
];
