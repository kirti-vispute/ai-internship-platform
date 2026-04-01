import { normalizeSkillList, normalizeSkillValue, toDisplaySkill } from "@/lib/skill-normalizer";

export type CoursePlatform = "NPTEL" | "SWAYAM";

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
const SWAYAM_HOSTS = new Set(["swayam.gov.in"]);

// NOTE:
// For skills where a direct verified course page is unavailable right now, we use SWAYAM explorer links.
// Replace with a direct course page when available.
const SKILL_COURSE_MAP: Record<string, SkillCourseEntry[]> = {
  html: [
    {
      skillKey: "html",
      title: "Web Technology (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=web+technology",
      description: "Find free SWAYAM courses covering HTML/web fundamentals."
    }
  ],
  css: [
    {
      skillKey: "css",
      title: "CSS and Web Design (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=css",
      description: "Find free SWAYAM courses focused on CSS and web design."
    }
  ],
  javascript: [
    {
      skillKey: "javascript",
      title: "JavaScript (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=javascript",
      description: "Find free SWAYAM JavaScript courses."
    }
  ],
  react: [
    {
      skillKey: "react",
      title: "React (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=react",
      description: "Find free SWAYAM courses relevant to React and modern frontend."
    }
  ],
  nodejs: [
    {
      skillKey: "nodejs",
      title: "Node.js (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=node+js",
      description: "Find free SWAYAM courses related to Node.js and backend development."
    }
  ],
  mongodb: [
    {
      skillKey: "mongodb",
      title: "Data Base Management Systems",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
      description: "Covers DBMS foundations relevant before NoSQL specialization."
    },
    {
      skillKey: "mongodb",
      title: "NoSQL / MongoDB (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=nosql",
      description: "Find free SWAYAM NoSQL courses relevant to MongoDB."
    }
  ],
  python: [
    {
      skillKey: "python",
      title: "Python for Data Science",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs80/preview",
      description: "Hands-on Python for analytics and engineering use-cases."
    },
    {
      skillKey: "python",
      title: "Programming, Data Structures and Algorithms using Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
      description: "Core Python + DSA foundations."
    }
  ],
  sql: [
    {
      skillKey: "sql",
      title: "Data Base Management System",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview",
      description: "SQL and DBMS fundamentals."
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
      description: "ML fundamentals and supervised learning basics."
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
      title: "Data Structures and Algorithms using Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview",
      description: "Data structures and algorithmic problem solving."
    }
  ],
  aptitude: [
    {
      skillKey: "aptitude",
      title: "Aptitude and Reasoning (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=aptitude",
      description: "Find free SWAYAM quantitative aptitude and reasoning courses."
    }
  ],
  communication: [
    {
      skillKey: "communication",
      title: "Communication Skills (search on SWAYAM)",
      platform: "SWAYAM",
      // VERIFIED_SWAYAM_URL_NEEDED: replace explorer link with direct course URL when finalized.
      url: "https://swayam.gov.in/explorer?searchText=communication+skills",
      description: "Find free SWAYAM communication and professional skills courses."
    }
  ]
};

function isValidFreeCourseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return NPTEL_HOSTS.has(parsed.hostname) || SWAYAM_HOSTS.has(parsed.hostname);
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
    if (!isValidFreeCourseUrl(entry.url)) continue;
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
