export type NptelCourse = {
  id: string;
  title: string;
  provider: "NPTEL";
  url: string;
  tags: string[];
  description: string;
  skillCoverage: string[];
  relevanceGroup: string[];
  verified: true;
};

// Single source of truth for course recommendation: verified direct NPTEL links only.
export const VERIFIED_NPTEL_COURSES: NptelCourse[] = [
  {
    id: "nptel-modern-app-dev",
    title: "Modern Application Development",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc20_cs52/preview",
    tags: ["web development", "frontend", "backend", "application development"],
    description:
      "Build distributed web applications with front-end and back-end architecture, website setup, and web services.",
    skillCoverage: ["html", "css", "javascript", "web development"],
    relevanceGroup: ["frontend", "full stack", "web technologies"],
    verified: true
  },
  {
    id: "nptel-dbms",
    title: "Data Base Management System",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
    tags: ["sql", "dbms", "database systems", "relational databases"],
    description: "Database modeling, relational algebra, SQL, transactions, and indexing fundamentals.",
    skillCoverage: ["sql", "dbms", "database management systems"],
    relevanceGroup: ["database", "backend data layer"],
    verified: true
  },
  {
    id: "nptel-db-fundamentals",
    title: "Fundamentals of Database Systems",
    provider: "NPTEL",
    url: "https://onlinecourses-archive.nptel.ac.in/noc17_cs33/course",
    tags: ["sql", "database", "dbms"],
    description: "Core database architecture, schema design, and query processing fundamentals.",
    skillCoverage: ["sql", "database", "dbms", "database management systems"],
    relevanceGroup: ["database", "query processing"],
    verified: true
  },
  {
    id: "nptel-python-ds",
    title: "Programming, Data Structures and Algorithms using Python",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
    tags: ["python", "data structures", "algorithms"],
    description: "Python fundamentals with data structures and algorithmic problem solving.",
    skillCoverage: ["python", "data structures", "algorithms"],
    relevanceGroup: ["programming fundamentals"],
    verified: true
  },
  {
    id: "nptel-python-data-science",
    title: "Python for Data Science",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc26_cs80/preview",
    tags: ["python", "data science", "numpy", "pandas"],
    description: "Applied Python workflows for data preparation, analysis, and modeling.",
    skillCoverage: ["python", "numpy", "pandas", "data science"],
    relevanceGroup: ["data analytics", "data workflows"],
    verified: true
  },
  {
    id: "nptel-intro-ml",
    title: "Introduction to Machine Learning - IIT Kharagpur",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc21_cs85/preview",
    tags: ["machine learning", "ml", "python"],
    description: "Supervised and unsupervised learning foundations and model evaluation.",
    skillCoverage: ["machine learning", "python", "ml"],
    relevanceGroup: ["ai", "modeling"],
    verified: true
  },
  {
    id: "nptel-machine-learning",
    title: "Machine Learning",
    provider: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs60/preview",
    tags: ["machine learning", "ml", "statistics"],
    description: "Machine learning methods and practical model-building principles.",
    skillCoverage: ["machine learning", "ml"],
    relevanceGroup: ["ai", "predictive modeling"],
    verified: true
  }
];
