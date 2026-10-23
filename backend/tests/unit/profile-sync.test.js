const { mergeParsedResumeIntoProfile } = require("../../src/modules/students/services/profile-sync.service");

describe("mergeParsedResumeIntoProfile -- defense-in-depth contact-info filtering", () => {
  test("a contact-info-shaped project in the parsed output is excluded from both the flat list and the structured profileSections.projects", () => {
    const profile = { profileSections: {} };
    const parsed = {
      projects: [
        { title: "priya.nair@example.com | +91 91234 56789 | github.com/priyanair | linkedin.com/in/priyanair", description: "priya.nair@example.com | +91 91234 56789 | github.com/priyanair | linkedin.com/in/priyanair", techStack: ["Github"], demoLink: "" },
        { title: "Campus Marketplace", description: "A full-stack marketplace app.", techStack: ["React"], demoLink: "" }
      ]
    };
    const merged = mergeParsedResumeIntoProfile(profile, parsed);
    expect(merged.profileSections.projects).toHaveLength(1);
    expect(merged.profileSections.projects[0].title).toBe("Campus Marketplace");
    expect(merged.projects).toHaveLength(1);
    expect(merged.projects[0]).toBe("Campus Marketplace");
  });

  test("a contact-info-shaped experience entry is excluded the same way", () => {
    const profile = { profileSections: {} };
    const parsed = {
      experience: [
        { role: "", company: "", description: "priya.nair@example.com | +91 91234 56789 | github.com/priyanair" },
        { role: "Intern", company: "Acme Corp", description: "Worked on internal tooling." }
      ]
    };
    const merged = mergeParsedResumeIntoProfile(profile, parsed);
    expect(merged.profileSections.experience).toHaveLength(1);
    expect(merged.profileSections.experience[0].company).toBe("Acme Corp");
  });

  test("a genuine project description that merely mentions an email or link in passing is never excluded", () => {
    const profile = { profileSections: {} };
    const parsed = {
      projects: [{ title: "Contact Form App", description: "Built a contact form that emails submissions to admin@example.com for review.", techStack: ["React"], demoLink: "" }]
    };
    const merged = mergeParsedResumeIntoProfile(profile, parsed);
    expect(merged.profileSections.projects).toHaveLength(1);
  });
});

describe("mergeParsedResumeIntoProfile -- existing data-integrity policy (unchanged)", () => {
  test("uploading a resume with zero projects clears the profile's previous projects (latest resume is authoritative)", () => {
    const profile = { projects: ["Old Project"], profileSections: { projects: [{ title: "Old Project", description: "", techStack: [], demoLink: "" }] } };
    const merged = mergeParsedResumeIntoProfile(profile, { projects: [] });
    expect(merged.projects).toEqual([]);
    expect(merged.profileSections.projects).toEqual([]);
  });

  test("a resume with no phone number never blanks out an existing phone number on file", () => {
    const profile = { mobile: "9999999999" };
    const merged = mergeParsedResumeIntoProfile(profile, { mobile: "" });
    expect(merged.mobile).toBe("9999999999");
  });

  test("a low-confidence name extraction never overwrites the existing name", () => {
    const profile = { fullName: "Real Name" };
    const merged = mergeParsedResumeIntoProfile(profile, { fullName: "Resume", fullNameConfidence: 0.9 });
    // "resume" is a blocked junk value regardless of confidence
    expect(merged.fullName).toBe("Real Name");

    const merged2 = mergeParsedResumeIntoProfile({ fullName: "Real Name" }, { fullName: "Some Guess", fullNameConfidence: 0.2 });
    expect(merged2.fullName).toBe("Real Name");
  });

  test("an empty profile and empty parse never throws", () => {
    expect(() => mergeParsedResumeIntoProfile({}, {})).not.toThrow();
    expect(() => mergeParsedResumeIntoProfile({}, undefined)).not.toThrow();
  });
});
