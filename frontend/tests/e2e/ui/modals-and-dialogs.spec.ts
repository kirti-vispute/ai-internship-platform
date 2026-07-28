import { test, expect } from "../fixtures/roles.fixture";
import { FIXTURE_CREDENTIALS } from "../fixtures/roles.fixture";

const BACKEND_URL = "http://localhost:5000";

async function seedPendingCertification(request: import("@playwright/test").APIRequestContext) {
  const loginRes = await request.post(`${BACKEND_URL}/api/auth/intern/login`, {
    data: { email: FIXTURE_CREDENTIALS.intern.email, password: FIXTURE_CREDENTIALS.intern.password }
  });
  const loginBody = await loginRes.json();
  const headers = { Authorization: `Bearer ${loginBody.data.accessToken || loginBody.data.token}` };
  const courseName = `E2E Modal Cert ${Date.now()}`;
  await request.post(`${BACKEND_URL}/api/intern/certifications`, {
    headers,
    multipart: {
      // Buffer embeds courseName -- certification.service.js dedupes by file
      // content hash separately from courseName/provider/date, so a fixed
      // buffer would collide across repeated runs.
      certificateFile: { name: "e2e-cert.pdf", mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4\n${courseName}\n%%EOF`) },
      courseName,
      skillCategory: "Web Development",
      provider: "E2E Test Provider",
      completionDate: new Date().toISOString().slice(0, 10)
    }
  });
  return courseName;
}

// Both Modal (variant="dialog"/"drawer") and ConfirmDialog render
// role="dialog" aria-modal="true" (verified directly against
// components/ui/modal.tsx and confirm-dialog.tsx) -- this exercises the
// "Review Certification" Modal (admin-certification-review.tsx), which also
// gives Escape-to-close and Cancel-to-close for free.
test.describe("Modal mechanics: Review Certification dialog", () => {
  test("opens via Escape and Cancel, and leaves state untouched when cancelled", async ({ request, adminSuperPage }) => {
    const courseName = await seedPendingCertification(request);
    await adminSuperPage.goto("/dashboard/admin/certification-review");
    const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
    await expect(row).toBeVisible({ timeout: 15000 });

    await row.getByRole("button", { name: "Review", exact: true }).click();
    const dialog = adminSuperPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Review Certification");

    await adminSuperPage.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // Row is unchanged -- still pending, still reviewable.
    await expect(row.getByRole("button", { name: "Review", exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Review", exact: true }).click();
    await adminSuperPage.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await expect(adminSuperPage.getByRole("dialog")).toBeHidden();
    await expect(row.getByRole("button", { name: "Review", exact: true })).toBeVisible();
  });
});
