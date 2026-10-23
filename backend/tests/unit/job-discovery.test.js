const { extractSkillsFromText } = require("../../src/modules/job-agent/services/job-discovery.service");

describe("extractSkillsFromText (approximate skill extraction for external postings)", () => {
  test("extracts known skills mentioned in free text", () => {
    const text = "We need a Node.js and React developer with MongoDB and AWS experience. Docker is a plus.";
    const skills = extractSkillsFromText(text);
    expect(skills).toEqual(expect.arrayContaining(["nodejs", "react", "mongodb", "aws", "docker"]));
  });

  test("does not invent skills that are not actually mentioned", () => {
    const text = "We need a Python developer.";
    const skills = extractSkillsFromText(text);
    expect(skills).not.toContain("react");
    expect(skills).not.toContain("java");
  });

  test("returns an empty array for empty or missing text instead of throwing", () => {
    expect(extractSkillsFromText("")).toEqual([]);
    expect(extractSkillsFromText(undefined)).toEqual([]);
  });

  test("is case-insensitive and punctuation-tolerant (Node.js vs node js vs NodeJS)", () => {
    expect(extractSkillsFromText("Experience with NODE.JS required")).toContain("nodejs");
    expect(extractSkillsFromText("experience with node js required")).toContain("nodejs");
  });
});
