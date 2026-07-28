import { test, expect } from "../fixtures/roles.fixture";
import { FIXTURE_CREDENTIALS } from "../fixtures/roles.fixture";

const BACKEND_URL = "http://localhost:5000";

async function internAuthHeader(request: import("@playwright/test").APIRequestContext) {
  const res = await request.post(`${BACKEND_URL}/api/auth/intern/login`, {
    data: { email: FIXTURE_CREDENTIALS.intern.email, password: FIXTURE_CREDENTIALS.intern.password }
  });
  const body = await res.json();
  return { Authorization: `Bearer ${body.data.accessToken || body.data.token}` };
}

test.describe("Student workflow: apply to an internship", () => {
  test("applying requires (and, once set, uses) a resume + professional summary", async ({ request, internPage }) => {
    // Idempotent setup: applyToInternship (intern.controller.js) requires a
    // non-empty resume.filePath and profile.summary before it'll accept an
    // application. Both are safe to (re-)submit -- PUT /profile overwrites
    // summary, POST /resume/upload always accepts a fresh file -- so this
    // test stays repeatable across multiple suite runs rather than depending
    // on the fixture's one-time-only "nothing set yet" state.
    const headers = await internAuthHeader(request);
    await request.put(`${BACKEND_URL}/api/intern/profile`, {
      headers,
      data: { summary: "Aspiring software engineer skilled in React and Node.js, eager to contribute to real-world products." }
    });
    const uploadRes = await request.post(`${BACKEND_URL}/api/intern/resume/upload`, {
      headers,
      multipart: {
        resume: {
          name: "e2e-test-resume.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(
            "Aarav Sharma\nAspiring Software Engineer\n\nSkills: React, Node.js, TypeScript, MongoDB\n\nEducation: B.Tech Computer Science\n"
          )
        }
      }
    });
    expect(uploadRes.ok()).toBeTruthy();

    await internPage.goto("/dashboard/intern/internships/search");
    const applyButtons = internPage.getByRole("button", { name: /^(Apply|Applied)$/ });
    const count = await applyButtons.count();
    test.skip(count === 0, "No internship listings visible in this dev DB run -- nothing to apply to.");

    const first = applyButtons.first();
    const label = await first.textContent();
    if (label?.trim() === "Applied") {
      // Already applied in a previous run of this same repeatable test --
      // confirm the persisted end-state instead of re-submitting (the real
      // API already rejects a duplicate application with a 409).
      await expect(first).toBeDisabled();
    } else {
      await first.click();
      await expect(internPage.getByRole("button", { name: "Apply Now" })).toBeVisible();
      await internPage.getByRole("button", { name: "Apply Now" }).click();
      await expect(internPage.getByText(/application submitted/i)).toBeVisible();
    }

    await internPage.goto("/dashboard/intern/applications");
    await expect(internPage.locator("body")).not.toContainText(/something went wrong/i);
  });
});

test.describe("Student workflow: save/unsave an internship", () => {
  test("toggling save on an internship updates the button and reverts cleanly", async ({ internPage }) => {
    await internPage.goto("/dashboard/intern/internships/search");
    const saveButtons = internPage.getByRole("button", { name: /^(Save|Unsave)$/ });
    const count = await saveButtons.count();
    test.skip(count === 0, "No internship listings visible in this dev DB run -- nothing to save.");

    const first = saveButtons.first();
    const initialLabel = (await first.textContent())?.trim();
    await first.click();
    await expect(first).toHaveText(initialLabel === "Save" ? "Unsave" : "Save");
    // Revert -- leave the shared fixture's saved-internships state as found.
    await first.click();
    await expect(first).toHaveText(initialLabel === "Save" ? "Save" : "Unsave");
  });
});
