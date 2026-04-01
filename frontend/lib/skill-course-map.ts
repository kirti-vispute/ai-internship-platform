import { normalizeSkillList, normalizeSkillValue, toDisplaySkill } from "@/lib/skill-normalizer";

export type CoursePlatform = "NPTEL" | "Coursera";

export type SkillCourseEntry = {
  skillKey: string;
  title: string;
  platform: CoursePlatform;
  url: string;
  description?: string;
};

export type CourseSuggestion = {
  title: string;
  platform: CoursePlatform;
  url: string;
  description?: string;
  targetSkills: string[];
};

const NPTEL_HOSTS = new Set(["onlinecourses.nptel.ac.in", "onlinecourses-archive.nptel.ac.in"]);
const COURSERA_HOSTS = new Set(["www.coursera.org", "coursera.org"]);

// Single source of truth for direct course mappings used by Suggested Courses.
// If a skill has no verified direct Coursera/NPTEL course, leave it unmapped and the UI shows fallback.
const SKILL_COURSE_MAP: Record<string, SkillCourseEntry[]> = {
  html: [
    {
      skillKey: "html",
      title: "HTML, CSS, and Javascript for Web Developers",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/html-css-javascript-for-web-developers",
      description: "Web fundamentals for frontend development."
    }
  ],
  css: [
    {
      skillKey: "css",
      title: "HTML, CSS, and Javascript for Web Developers",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/html-css-javascript-for-web-developers",
      description: "Web styling and responsive layout fundamentals."
    }
  ],
  javascript: [
    {
      skillKey: "javascript",
      title: "HTML, CSS, and Javascript for Web Developers",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/html-css-javascript-for-web-developers",
      description: "JavaScript programming for modern frontend apps."
    }
  ],
  react: [
    {
      skillKey: "react",
      title: "Front-End Web Development with React",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/front-end-react",
      description: "Component-driven UI development with React."
    }
  ],
  nodejs: [
    {
      skillKey: "nodejs",
      title: "Server-side Development with NodeJS, Express and MongoDB",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/server-side-nodejs",
      description: "Backend APIs with Node.js and Express."
    }
  ],
  mongodb: [
    {
      skillKey: "mongodb",
      title: "Server-side Development with NodeJS, Express and MongoDB",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/server-side-nodejs",
      description: "MongoDB integration in full-stack backend workflows."
    },
    {
      skillKey: "mongodb",
      title: "Data Base Management System",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
      description: "Core database concepts useful before advanced NoSQL design."
    }
  ],
  python: [
    {
      skillKey: "python",
      title: "Python for Data Science",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs80/preview",
      description: "Hands-on Python for data and engineering workflows."
    },
    {
      skillKey: "python",
      title: "Programming, Data Structures and Algorithms using Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
      description: "Python + DSA fundamentals."
    }
  ],
  sql: [
    {
      skillKey: "sql",
      title: "Data Base Management System",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
      description: "SQL and relational database fundamentals."
    },
    {
      skillKey: "sql",
      title: "Fundamentals of Database Systems",
      platform: "NPTEL",
      url: "https://onlinecourses-archive.nptel.ac.in/noc17_cs33/course",
      description: "Database design and query fundamentals."
    }
  ],
  "machine learning": [
    {
      skillKey: "machine learning",
      title: "Introduction to Machine Learning - IIT Kharagpur",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc21_cs85/preview",
      description: "ML foundations and supervised learning basics."
    },
    {
      skillKey: "machine learning",
      title: "Machine Learning",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs60/preview",
      description: "Broader machine learning concepts and methods."
    }
  ],
  "data structures": [
    {
      skillKey: "data structures",
      title: "Programming, Data Structures and Algorithms using Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
      description: "Data structures and algorithmic problem solving."
    }
  ]
};

function isValidCourseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return NPTEL_HOSTS.has(parsed.hostname) || COURSERA_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function getCoursesForSkill(skill: string): SkillCourseEntry[] {
  const canonical = normalizeSkillValue(skill);
  if (!canonical) return [];

  const entries = SKILL_COURSE_MAP[canonical] || [];
  const dedup = new Map<string, SkillCourseEntry>();

  for (const entry of entries) {
    if (!isValidCourseUrl(entry.url)) continue;
    const key = `${entry.platform}:${entry.url}`;
    if (!dedup.has(key)) dedup.set(key, entry);
  }

  return [...dedup.values()];
}

export function getSuggestedCoursesForSkills(missingSkills: string[]) {
  const normalizedSkills = normalizeSkillList(missingSkills);
  const courseByUrl = new Map<string, CourseSuggestion>();
  const unmappedSkills: string[] = [];

  for (const skillKey of normalizedSkills) {
    const displaySkill = toDisplaySkill(skillKey);
    const courses = getCoursesForSkill(skillKey);

    if (courses.length === 0) {
      unmappedSkills.push(displaySkill);
      continue;
    }

    for (const course of courses) {
      const existing = courseByUrl.get(course.url);
      if (existing) {
        if (!existing.targetSkills.includes(displaySkill)) {
          existing.targetSkills.push(displaySkill);
        }
      } else {
        courseByUrl.set(course.url, {
          title: course.title,
          platform: course.platform,
          url: course.url,
          description: course.description,
          targetSkills: [displaySkill]
        });
      }
    }
  }

  return {
    suggestions: [...courseByUrl.values()],
    unmappedSkills
  };
}

export { SKILL_COURSE_MAP };
