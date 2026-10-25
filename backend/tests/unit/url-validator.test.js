const { isSafeHttpUrl, sanitizeHttpUrl } = require("../../src/shared/utils/url-validator");

describe("url-validator utility", () => {
  test("allows valid http and https URLs", () => {
    expect(isSafeHttpUrl("https://remotive.com/jobs/123")).toBe(true);
    expect(isSafeHttpUrl("http://jobs.lever.co/company/abc-123")).toBe(true);
    expect(isSafeHttpUrl("https://developer.adzuna.com/search?q=intern")).toBe(true);
  });

  test("rejects dangerous or disallowed schemes", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("javascript://alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
  });

  test("rejects non-strings, empty strings, and malformed inputs", () => {
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl("   ")).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl(12345)).toBe(false);
    expect(isSafeHttpUrl({})).toBe(false);
    expect(isSafeHttpUrl("not-a-valid-url")).toBe(false);
  });

  test("sanitizeHttpUrl returns URL when safe, fallback when unsafe", () => {
    expect(sanitizeHttpUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeHttpUrl("javascript:alert(1)", "https://default.com")).toBe("https://default.com");
  });
});
