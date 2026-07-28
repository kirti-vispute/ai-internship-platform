import { test, expect } from "../fixtures/roles.fixture";
import { FIXTURE_CREDENTIALS } from "../fixtures/roles.fixture";

const BACKEND_URL = "http://localhost:5000";

test.describe("Admin workflow: certification submit + review", () => {
  test("intern submits a certification, admin approves it", async ({ request, adminSuperPage }) => {
    const loginRes = await request.post(`${BACKEND_URL}/api/auth/intern/login`, {
      data: { email: FIXTURE_CREDENTIALS.intern.email, password: FIXTURE_CREDENTIALS.intern.password }
    });
    const loginBody = await loginRes.json();
    const internHeaders = { Authorization: `Bearer ${loginBody.data.accessToken || loginBody.data.token}` };

    const courseName = `E2E Workflow Cert ${Date.now()}`;
    const submitRes = await request.post(`${BACKEND_URL}/api/intern/certifications`, {
      headers: internHeaders,
      multipart: {
        certificateFile: {
          name: "e2e-cert.pdf",
          mimeType: "application/pdf",
          // Content embeds courseName so each submission's file hash is
          // unique (certification.service.js also dedupes by file content
          // hash, separately from the courseName/provider/date dedupe) --
          // a fixed buffer would collide with itself on a Playwright retry.
          buffer: Buffer.from(`%PDF-1.4\n${courseName}\n%%EOF`)
        },
        courseName,
        skillCategory: "Web Development",
        provider: "E2E Test Provider",
        completionDate: new Date().toISOString().slice(0, 10)
      }
    });
    expect(submitRes.ok()).toBeTruthy();

    await adminSuperPage.goto("/dashboard/admin/certification-review");
    const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
    await expect(row).toBeVisible({ timeout: 15000 });

    // exact:true matters here -- "Review" is a substring of the adjacent
    // "Preview {courseName}" button's accessible name, so Playwright's
    // default substring name-match would resolve to both.
    await row.getByRole("button", { name: "Review", exact: true }).click();
    await adminSuperPage.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(adminSuperPage.getByRole("row", { name: new RegExp(courseName) })).not.toBeVisible();
  });
});

test.describe("Admin workflow: company verify/unverify", () => {
  test("unverifying then re-verifying the E2E test company round-trips cleanly", async ({ adminSuperPage }) => {
    await adminSuperPage.goto("/dashboard/admin/companies");
    const search = adminSuperPage.getByPlaceholder(/search/i).first();
    if (await search.count()) {
      await search.fill("E2E Test Company");
      await adminSuperPage.getByRole("button", { name: "Search" }).click();
    }

    const card = adminSuperPage.locator("text=E2E Test Company").first();
    test.skip((await card.count()) === 0, "E2E Test Company not visible in admin companies view.");

    // exact:true throughout -- "Verify" is a substring of "Unverify", so a
    // non-exact name match would resolve to both buttons.
    const unverifyButton = adminSuperPage.getByRole("button", { name: "Unverify", exact: true }).first();
    if (await unverifyButton.count()) {
      await unverifyButton.click();
      // A ConfirmDialog is expected here (confirm destructive-ish action) --
      // confirm it if present, otherwise the click itself already applied.
      const confirmButton = adminSuperPage.getByRole("dialog").getByRole("button", { name: /confirm|unverify/i });
      if (await confirmButton.count()) await confirmButton.click();
      await expect(adminSuperPage.getByRole("button", { name: "Verify", exact: true }).first()).toBeVisible();

      // Revert -- leave the shared fixture company's verification status as found.
      await adminSuperPage.getByRole("button", { name: "Verify", exact: true }).first().click();
      await expect(adminSuperPage.getByRole("button", { name: "Unverify", exact: true }).first()).toBeVisible();
    }
  });
});
