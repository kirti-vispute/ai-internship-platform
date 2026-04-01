export type CoursePlatform = "NPTEL" | "Coursera";

export type VerifiedCourse = {
  id: string;
  title: string;
  platform: CoursePlatform;
  url: string;
  tags: string[];
  description: string;
  verified: true;
};

// Verified direct course links only. This dataset is the single source for course recommendation.
export const VERIFIED_COURSES: VerifiedCourse[] = [
  {
    id: "c-html-css-js-web-dev",
    title: "HTML, CSS, and Javascript for Web Developers",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/html-css-javascript-for-web-developers",
    tags: ["html", "css", "javascript", "frontend"],
    description: "Build responsive websites with core web technologies and browser-side JavaScript.",
    verified: true
  },
  {
    id: "c-react-frontend",
    title: "Front-End Web Development with React",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/front-end-react",
    tags: ["react", "javascript", "frontend"],
    description: "Develop component-based interfaces and single-page apps with React.",
    verified: true
  },
  {
    id: "c-node-express-mongo",
    title: "Server-side Development with NodeJS, Express and MongoDB",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/server-side-nodejs",
    tags: ["nodejs", "express", "mongodb", "backend", "api"],
    description: "Build REST APIs with Node.js and Express, integrated with MongoDB.",
    verified: true
  },
  {
    id: "nptel-dbms",
    title: "Data Base Management System",
    platform: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
    tags: ["sql", "dbms", "database", "mongodb"],
    description: "Database modeling, relational algebra, SQL, transactions, and indexing fundamentals.",
    verified: true
  },
  {
    id: "nptel-db-fundamentals",
    title: "Fundamentals of Database Systems",
    platform: "NPTEL",
    url: "https://onlinecourses-archive.nptel.ac.in/noc17_cs33/course",
    tags: ["sql", "database", "dbms"],
    description: "Core database architecture, schema design, and query processing fundamentals.",
    verified: true
  },
  {
    id: "nptel-python-ds",
    title: "Programming, Data Structures and Algorithms using Python",
    platform: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
    tags: ["python", "data structures", "algorithms"],
    description: "Python fundamentals with data structures and algorithmic problem solving.",
    verified: true
  },
  {
    id: "nptel-python-data-science",
    title: "Python for Data Science",
    platform: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc26_cs80/preview",
    tags: ["python", "data science", "numpy", "pandas"],
    description: "Applied Python workflows for data preparation, analysis, and modeling.",
    verified: true
  },
  {
    id: "nptel-intro-ml",
    title: "Introduction to Machine Learning - IIT Kharagpur",
    platform: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc21_cs85/preview",
    tags: ["machine learning", "ml", "python"],
    description: "Supervised and unsupervised learning foundations and model evaluation.",
    verified: true
  },
  {
    id: "nptel-machine-learning",
    title: "Machine Learning",
    platform: "NPTEL",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs60/preview",
    tags: ["machine learning", "ml", "statistics"],
    description: "Machine learning methods and practical model-building principles.",
    verified: true
  }
];
