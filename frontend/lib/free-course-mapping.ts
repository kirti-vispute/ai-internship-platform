import { normalizeSkillValue, toDisplaySkill } from "@/lib/skill-normalizer";

export type FreeCoursePlatform = "NPTEL" | "SWAYAM";

export type FreeCourse = {
  title: string;
  platform: FreeCoursePlatform;
  url: string;
};

export type SkillCourseTile = {
  targetSkill: string;
  title: string;
  platform: FreeCoursePlatform;
  url: string;
};

const FREE_SKILL_COURSE_MAP: Record<string, FreeCourse[]> = {
  python: [
    {
      title: "Python for Data Science",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs80/preview"
    },
    {
      title: "Programming, Data Structures and Algorithms using Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs78/preview"
    }
  ],
  "machine learning": [
    {
      title: "Introduction to Machine Learning - IITKGP",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc21_cs85/preview"
    },
    {
      title: "Machine Learning",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs60/preview"
    }
  ],
  "artificial intelligence": [
    {
      title: "Artificial Intelligence: Concepts and Techniques",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc25_cs159/preview"
    }
  ],
  sql: [
    {
      title: "Data Base Management System",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview"
    },
    {
      title: "Fundamentals Of Database Systems",
      platform: "NPTEL",
      url: "https://onlinecourses-archive.nptel.ac.in/noc17_cs33/course"
    }
  ],
  mongodb: [
    {
      title: "Data Base Management System",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc26_cs39/preview"
    },
    {
      title: "Find NoSQL/Database courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=nosql"
    }
  ],
  javascript: [
    {
      title: "Find JavaScript courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=javascript"
    }
  ],
  html: [
    {
      title: "Find Web Technology courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=web+technology"
    }
  ],
  css: [
    {
      title: "Find Web Design/CSS courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=css"
    }
  ],
  react: [
    {
      title: "Find React courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=react"
    }
  ],
  nodejs: [
    {
      title: "Find Node.js courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=node+js"
    }
  ],
  azure: [
    {
      title: "Cloud Computing",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc24_cs118/preview"
    }
  ],
  excel: [
    {
      title: "Find Excel/Data Analysis courses",
      platform: "SWAYAM",
      url: "https://swayam.gov.in/explorer?searchText=excel"
    }
  ],
  pandas: [
    {
      title: "Data Analytics with Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc20_cs46/preview"
    }
  ],
  numpy: [
    {
      title: "Data Analytics with Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc20_cs46/preview"
    }
  ],
  matplotlib: [
    {
      title: "Data Analytics with Python",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc20_cs46/preview"
    }
  ],
  "scikit-learn": [
    {
      title: "Machine Learning for Core Engineering Disciplines",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc25_ge77/preview"
    }
  ],
  oops: [
    {
      title: "Fundamentals of Object Oriented Programming",
      platform: "NPTEL",
      url: "https://onlinecourses.nptel.ac.in/noc25_cs34/preview"
    }
  ]
};

export function getFreeCoursesForMissingSkills(missingSkills: string[]) {
  const tiles: SkillCourseTile[] = [];
  const unmappedSkills: string[] = [];
  const seen = new Set<string>();

  for (const skill of missingSkills) {
    const canonical = normalizeSkillValue(skill);
    const displaySkill = toDisplaySkill(canonical || skill);
    const mapped = canonical ? FREE_SKILL_COURSE_MAP[canonical] : undefined;

    if (!mapped || mapped.length === 0) {
      unmappedSkills.push(displaySkill);
      continue;
    }

    for (const course of mapped.slice(0, 3)) {
      const key = `${canonical}:${course.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tiles.push({
        targetSkill: displaySkill,
        title: course.title,
        platform: course.platform,
        url: course.url
      });
    }
  }

  return {
    courseTiles: tiles,
    unmappedSkills
  };
}

export { FREE_SKILL_COURSE_MAP };
