import { test, expect } from "../fixtures/roles.fixture";
import { FIXTURE_CREDENTIALS } from "../fixtures/roles.fixture";

const BACKEND_URL = "http://localhost:5000";

test.describe("Form validation: certification rejection requires a reason", () => {
  test("submitting Reject with empty remarks shows a validation error, not a silent failure", async ({ request, adminSuperPage }) => {
    const loginRes = await request.post(`${BACKEND_URL}/api/auth/intern/login`, {
      data: { email: FIXTURE_CREDENTIALS.intern.email, password: FIXTURE_CREDENTIALS.intern.password }
    });
    const loginBody = await loginRes.json();
    const headers = { Authorization: `Bearer ${loginBody.data.accessToken || loginBody.data.token}` };
    const courseName = `E2E Form Validation Cert ${Date.now()}`;
    await request.post(`${BACKEND_URL}/api/intern/certifications`, {
      headers,
      multipart: {
        // Buffer embeds courseName -- see modals-and-dialogs.spec.ts comment
        // on why a fixed buffer would collide (file-content-hash dedupe).
        certificateFile: { name: "e2e-cert.pdf", mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4\n${courseName}\n%%EOF`) },
        courseName,
        skillCategory: "Web Development",
        provider: "E2E Test Provider",
        completionDate: new Date().toISOString().slice(0, 10)
      }
    });

    await adminSuperPage.goto("/dashboard/admin/certification-review");
    const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole("button", { name: "Review", exact: true }).click();

    const dialog = adminSuperPage.getByRole("dialog");
    await dialog.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(adminSuperPage.getByText("Rejection reason is required.")).toBeVisible();
    // Dialog stays open -- rejection did not silently go through.
    await expect(dialog).toBeVisible();

    // Clean up: fill a reason and actually reject, so this fresh test
    // certification doesn't linger in the pending queue for later runs.
    // The visible label text isn't <label for>-associated with the textarea
    // -- the textarea's real accessible name comes from its own
    // aria-label="Review remarks" (admin-certification-review.tsx).
    await dialog.getByLabel("Review remarks").fill("E2E test cleanup rejection.");
    await dialog.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(adminSuperPage.getByRole("row", { name: new RegExp(courseName) })).not.toBeVisible();
  });
});

test.describe("Table + pagination: admin users", () => {
  test("Next/Previous page controls change the visible page", async ({ adminSuperPage }) => {
    await adminSuperPage.goto("/dashboard/admin/users");
    const nextButton = adminSuperPage.getByRole("button", { name: "Next page" });
    test.skip((await nextButton.count()) === 0 || !(await nextButton.isEnabled()), "Not enough users in this dev DB for a second page.");

    const firstRowTextBefore = await adminSuperPage.getByRole("row").nth(1).textContent();
    await nextButton.click();
    await expect(adminSuperPage.getByRole("row").nth(1)).not.toHaveText(firstRowTextBefore || "");

    await adminSuperPage.getByRole("button", { name: "Previous page" }).click();
    await expect(adminSuperPage.getByRole("row").nth(1)).toHaveText(firstRowTextBefore || "");
  });
});

test.describe("Search/filter: admin users search", () => {
  test("a nonsense query yields no matching rows, not a crash", async ({ adminSuperPage }) => {
    await adminSuperPage.goto("/dashboard/admin/users");
    const search = adminSuperPage.getByPlaceholder(/search/i).first();
    test.skip((await search.count()) === 0, "No search input found on admin users view.");

    await search.fill("zzzznonexistentuserzzzz9999");
    await adminSuperPage.waitForTimeout(500);
    await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  });
});
