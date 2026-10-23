const { structuredResumeParse } = require("../../src/modules/students/services/resume-structured-parser.service");

// Regression suite for two real bugs found via live demo-profile inspection
// (not hypothetical): (1) a resume's own contact-info header line
// ("email | phone | github | linkedin") was classified as a PROJECT, and
// (2) a second project's header line, when it carried a trailing
// "demo: <url>" annotation, failed the parser's generic short-title check
// and was silently concatenated onto the PREVIOUS project's description
// instead of starting its own entry. Both are reproduced here with
// representative (not hardcoded/copied) resume text shaped the same way.

function resumeText(lines) {
  return lines.join("\n");
}

describe("structuredResumeParse -- contact info is never classified as a project or experience entry", () => {
  test("the header contact line (email | phone | github | linkedin) never appears as a project", () => {
    const text = resumeText([
      "Priya Nair",
      "priya.nair@example.com | +91 91234 56789 | github.com/priyanair | linkedin.com/in/priyanair",
      "",
      "PROJECTS",
      "Inventory Tracker (github.com/priyanair/inventory-tracker)",
      "A stock management tool built with Django and PostgreSQL."
    ]);
    const parsed = structuredResumeParse(text);
    expect(parsed.projects).toHaveLength(1);
    expect(parsed.projects[0].title).toContain("Inventory Tracker");
    expect(parsed.email).toBe("priya.nair@example.com");
    expect(parsed.mobile).toBeTruthy();
    // The contact line must not leak into any project's text either.
    expect(parsed.projects.some((p) => `${p.title} ${p.description}`.includes("priya.nair@example.com"))).toBe(false);
  });

  test("a contact-info line inside the Experience section is never classified as a work-experience entry", () => {
    const text = resumeText([
      "Priya Nair",
      "priya.nair@example.com | +91 91234 56789",
      "",
      "EXPERIENCE",
      "priya.nair@example.com | +91 91234 56789 | github.com/priyanair",
      "Software Engineering Intern at Acme Corp (2025)",
      "Built internal tooling for the data platform team."
    ]);
    const parsed = structuredResumeParse(text);
    expect(parsed.experience.some((e) => `${e.role} ${e.company} ${e.description}`.includes("priya.nair@example.com"))).toBe(false);
  });

  test("a bare contact link with no descriptive text alongside it is not treated as a project", () => {
    const text = resumeText([
      "Priya Nair",
      "github.com/priyanair",
      "",
      "PROJECTS",
      "Inventory Tracker (github.com/priyanair/inventory-tracker)",
      "A stock management tool built with Django and PostgreSQL."
    ]);
    const parsed = structuredResumeParse(text);
    expect(parsed.projects).toHaveLength(1);
  });
});

describe("structuredResumeParse -- project boundary detection keeps separate projects separate", () => {
  test("a second project whose header carries a trailing 'demo: <url>' annotation starts its own entry instead of being concatenated onto the previous project", () => {
    const text = resumeText([
      "Priya Nair",
      "priya.nair@example.com | +91 91234 56789 | github.com/priyanair | linkedin.com/in/priyanair",
      "",
      "PROJECTS",
      "Campus Marketplace (github.com/priyanair/campus-marketplace)",
      "Full-stack web app for students to buy and sell used textbooks. Built with React, Node.js, Express and MongoDB.",
      "Expense Tracker (github.com/priyanair/expense-tracker, demo: expense-tracker-priya.vercel.app)",
      "Personal finance tracker with category-wise spending charts, built using React and Chart.js.",
      "Realtime Chat App (github.com/priyanair/realtime-chat)",
      "One-to-one and group chat application using Socket.io, Express and MongoDB."
    ]);
    const parsed = structuredResumeParse(text);

    expect(parsed.projects).toHaveLength(3);
    const titles = parsed.projects.map((p) => p.title);
    expect(titles.some((t) => t.includes("Campus Marketplace"))).toBe(true);
    expect(titles.some((t) => t.includes("Expense Tracker"))).toBe(true);
    expect(titles.some((t) => t.includes("Realtime Chat App"))).toBe(true);

    // The real bug: Expense Tracker's own text must not be glued onto
    // Campus Marketplace's description.
    const campusProject = parsed.projects.find((p) => p.title.includes("Campus Marketplace"));
    expect(campusProject.description).not.toContain("Expense Tracker");
    expect(campusProject.description).not.toContain("spending charts");
  });

  test("three cleanly-separated short-title projects (no embedded links) are still parsed as three distinct entries (no regression)", () => {
    const text = resumeText([
      "Priya Nair",
      "priya.nair@example.com",
      "",
      "PROJECTS",
      "Weather Dashboard",
      "Built a weather dashboard using the OpenWeather API and Chart.js.",
      "Recipe Finder",
      "Developed a recipe search app using the Spoonacular API and React.",
      "Budget Planner",
      "Designed a personal budgeting tool using Python and Flask."
    ]);
    const parsed = structuredResumeParse(text);
    expect(parsed.projects).toHaveLength(3);
  });
});

describe("structuredResumeParse -- field normalization preserves legitimate technical content", () => {
  test("a well-formed resume extracts skills, education, and project tech stacks correctly", () => {
    const text = resumeText([
      "Priya Nair",
      "priya.nair@example.com | +91 91234 56789 | github.com/priyanair",
      "",
      "TECHNICAL SKILLS",
      "JavaScript, React, Node.js, MongoDB, Python, Django",
      "",
      "PROJECTS",
      "Campus Marketplace (github.com/priyanair/campus-marketplace)",
      "Full-stack web app built with React, Node.js and MongoDB.",
      "",
      "EDUCATION",
      "B.Tech Computer Science, ABC Institute of Technology",
      "CGPA: 8.2 | 2022 - 2026"
    ]);
    const parsed = structuredResumeParse(text);
    expect(parsed.skills).toEqual(expect.arrayContaining(["Javascript", "React", "Node.js", "MongoDB", "Python", "Django"]));
    expect(parsed.education.length).toBeGreaterThan(0);
    expect(parsed.education[0].degree.toLowerCase()).toContain("tech");
    expect(parsed.projects[0].techStack).toEqual(expect.arrayContaining(["React", "Node.js", "MongoDB"]));
  });

  test("never invents a skill, degree, or project that the resume text doesn't actually contain", () => {
    const text = resumeText(["Priya Nair", "priya.nair@example.com", "", "PROJECTS", "Weather Dashboard", "A simple weather app using HTML and CSS."]);
    const parsed = structuredResumeParse(text);
    expect(parsed.skills).not.toEqual(expect.arrayContaining(["Kubernetes", "Rust"]));
    expect(parsed.education).toEqual([]);
  });
});

describe("structuredResumeParse -- handles incomplete, poorly formatted, and differently structured resumes gracefully", () => {
  test("an empty resume never throws and returns empty/safe values", () => {
    expect(() => structuredResumeParse("")).not.toThrow();
    const parsed = structuredResumeParse("");
    expect(parsed.projects).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.email).toBe("");
  });

  test("a resume with no section headings at all (plain unstructured text) never throws", () => {
    const text = "Priya Nair\npriya.nair@example.com\nBuilt a weather dashboard using React and the OpenWeather API.\nStudied at ABC College, graduated 2026.";
    expect(() => structuredResumeParse(text)).not.toThrow();
  });

  test("an ALL CAPS or all-lowercase resume still extracts a name and projects", () => {
    const textUpper = resumeText(["PRIYA NAIR", "PRIYA.NAIR@EXAMPLE.COM", "", "PROJECTS", "CAMPUS MARKETPLACE", "FULL-STACK WEB APP BUILT WITH REACT."]);
    const parsedUpper = structuredResumeParse(textUpper);
    expect(parsedUpper.fullName).toBeTruthy();

    const textLower = resumeText(["priya nair", "priya.nair@example.com", "", "projects", "campus marketplace", "full-stack web app built with react."]);
    expect(() => structuredResumeParse(textLower)).not.toThrow();
  });

  test("a resume with only a header and no other sections never throws and returns empty lists, not fabricated ones", () => {
    const text = resumeText(["Priya Nair", "priya.nair@example.com | +91 91234 56789"]);
    const parsed = structuredResumeParse(text);
    expect(parsed.projects).toEqual([]);
    expect(parsed.experience).toEqual([]);
    expect(parsed.education).toEqual([]);
  });
});
