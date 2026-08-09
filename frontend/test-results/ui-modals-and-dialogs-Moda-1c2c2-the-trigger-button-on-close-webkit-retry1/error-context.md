# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\modals-and-dialogs.spec.ts >> Modal mechanics: Review Certification dialog >> focus enters the dialog on open and returns to the trigger button on close
- Location: tests\e2e\ui\modals-and-dialogs.spec.ts:75:7

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('row', { name: /E2E Modal Cert 1786177394079/ }).getByRole('button', { name: 'Review', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" with timeout 5000ms
  - waiting for getByRole('row', { name: /E2E Modal Cert 1786177394079/ }).getByRole('button', { name: 'Review', exact: true })
    13 × locator resolved to <button type="button" data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] bg-[linear-gradient(135deg,var(--ds-gradient-from,#1f6fff),var(--ds-gradient-to,#22d3ee))] text-[var(--ds-on-primary,#fff)] shadow-glow hover:brightness-110 hover:-translate…>Review</button>
       - unexpected value "inactive"

```

```yaml
- button "Review"
```

# Test source

```ts
  1   | import { test, expect } from "../fixtures/roles.fixture";
  2   | import { FIXTURE_CREDENTIALS } from "../fixtures/roles.fixture";
  3   | 
  4   | const BACKEND_URL = "http://localhost:5000";
  5   | 
  6   | // Memoized across every call in this file -- workers:1/fullyParallel:false
  7   | // means tests run serially in one process, so a module-level cache is safe
  8   | // (same pattern loginAsRoleViaApi uses per-worker in session.ts) and cuts
  9   | // repeated login-fixture-request pressure against authLimiter (30 req/15min
  10  | // per IP, shared by every login/signup/refresh in the suite).
  11  | let cachedInternHeaders: Record<string, string> | null = null;
  12  | async function getInternHeaders(request: import("@playwright/test").APIRequestContext) {
  13  |   if (cachedInternHeaders) return cachedInternHeaders;
  14  |   const loginRes = await request.post(`${BACKEND_URL}/api/auth/intern/login`, {
  15  |     data: { email: FIXTURE_CREDENTIALS.intern.email, password: FIXTURE_CREDENTIALS.intern.password }
  16  |   });
  17  |   // Same check session.ts's own fetchSession makes -- without it, a 429 here
  18  |   // (authLimiter) surfaces 15s later as a confusing "row not found" timeout
  19  |   // in whichever test happens to seed first, instead of a clear cause.
  20  |   if (!loginRes.ok()) {
  21  |     throw new Error(`Intern login fixture failed: ${loginRes.status()} ${await loginRes.text()}`);
  22  |   }
  23  |   const loginBody = await loginRes.json();
  24  |   cachedInternHeaders = { Authorization: `Bearer ${loginBody.data.accessToken || loginBody.data.token}` };
  25  |   return cachedInternHeaders;
  26  | }
  27  | 
  28  | async function seedPendingCertification(request: import("@playwright/test").APIRequestContext) {
  29  |   const headers = await getInternHeaders(request);
  30  |   const courseName = `E2E Modal Cert ${Date.now()}`;
  31  |   await request.post(`${BACKEND_URL}/api/intern/certifications`, {
  32  |     headers,
  33  |     multipart: {
  34  |       // Buffer embeds courseName -- certification.service.js dedupes by file
  35  |       // content hash separately from courseName/provider/date, so a fixed
  36  |       // buffer would collide across repeated runs.
  37  |       certificateFile: { name: "e2e-cert.pdf", mimeType: "application/pdf", buffer: Buffer.from(`%PDF-1.4\n${courseName}\n%%EOF`) },
  38  |       courseName,
  39  |       skillCategory: "Web Development",
  40  |       provider: "E2E Test Provider",
  41  |       completionDate: new Date().toISOString().slice(0, 10)
  42  |     }
  43  |   });
  44  |   return courseName;
  45  | }
  46  | 
  47  | // Both Modal (variant="dialog"/"drawer") and ConfirmDialog render
  48  | // role="dialog" aria-modal="true" (verified directly against
  49  | // components/ui/modal.tsx and confirm-dialog.tsx) -- this exercises the
  50  | // "Review Certification" Modal (admin-certification-review.tsx), which also
  51  | // gives Escape-to-close and Cancel-to-close for free.
  52  | test.describe("Modal mechanics: Review Certification dialog", () => {
  53  |   test("opens via Escape and Cancel, and leaves state untouched when cancelled", async ({ request, adminSuperPage }) => {
  54  |     const courseName = await seedPendingCertification(request);
  55  |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  56  |     const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
  57  |     await expect(row).toBeVisible({ timeout: 15000 });
  58  | 
  59  |     await row.getByRole("button", { name: "Review", exact: true }).click();
  60  |     const dialog = adminSuperPage.getByRole("dialog");
  61  |     await expect(dialog).toBeVisible();
  62  |     await expect(dialog).toContainText("Review Certification");
  63  | 
  64  |     await adminSuperPage.keyboard.press("Escape");
  65  |     await expect(dialog).toBeHidden();
  66  |     // Row is unchanged -- still pending, still reviewable.
  67  |     await expect(row.getByRole("button", { name: "Review", exact: true })).toBeVisible();
  68  | 
  69  |     await row.getByRole("button", { name: "Review", exact: true }).click();
  70  |     await adminSuperPage.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  71  |     await expect(adminSuperPage.getByRole("dialog")).toBeHidden();
  72  |     await expect(row.getByRole("button", { name: "Review", exact: true })).toBeVisible();
  73  |   });
  74  | 
  75  |   test("focus enters the dialog on open and returns to the trigger button on close", async ({ request, adminSuperPage }) => {
  76  |     const courseName = await seedPendingCertification(request);
  77  |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  78  |     const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
  79  |     await expect(row).toBeVisible({ timeout: 15000 });
  80  | 
  81  |     const reviewButton = row.getByRole("button", { name: "Review", exact: true });
  82  |     await reviewButton.click();
  83  |     const dialog = adminSuperPage.getByRole("dialog");
  84  |     await expect(dialog).toBeVisible();
  85  |     // Focus must land somewhere inside the dialog, not stay on the page body.
  86  |     await expect(dialog.locator(":focus")).toHaveCount(1);
  87  | 
  88  |     await adminSuperPage.keyboard.press("Escape");
  89  |     await expect(dialog).toBeHidden();
> 90  |     await expect(reviewButton).toBeFocused();
      |                                ^ Error: expect(locator).toBeFocused() failed
  91  |   });
  92  | });
  93  | 
  94  | test.describe("Modal mechanics: Certificate Preview dialog", () => {
  95  |   test("opens the certificate preview and closes via Escape", async ({ request, adminSuperPage }) => {
  96  |     const courseName = await seedPendingCertification(request);
  97  |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  98  |     const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
  99  |     await expect(row).toBeVisible({ timeout: 15000 });
  100 | 
  101 |     await row.getByRole("button", { name: `Preview ${courseName}` }).click();
  102 |     const dialog = adminSuperPage.getByRole("dialog");
  103 |     await expect(dialog).toBeVisible();
  104 |     await expect(dialog).toContainText("Certificate Preview");
  105 | 
  106 |     await adminSuperPage.keyboard.press("Escape");
  107 |     await expect(dialog).toBeHidden();
  108 |     // Previewing is read-only -- row is still pending and reviewable.
  109 |     await expect(row.getByRole("button", { name: "Review", exact: true })).toBeVisible();
  110 |   });
  111 | 
  112 |   test("a preview request that fails surfaces an error and does not open the preview dialog", async ({ request, adminSuperPage }) => {
  113 |     const courseName = await seedPendingCertification(request);
  114 |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  115 |     const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
  116 |     await expect(row).toBeVisible({ timeout: 15000 });
  117 | 
  118 |     await adminSuperPage.route("**/api/admin/certifications/*/file*", (route) =>
  119 |       route.fulfill({ status: 404, json: { message: "Certificate file not found" } })
  120 |     );
  121 |     await row.getByRole("button", { name: `Preview ${courseName}` }).click();
  122 |     // preview() catches the fetch failure and sets the page-level error
  123 |     // state without ever calling setPreviewUrl, so the Modal's `open` stays
  124 |     // false -- scoped to <main> to avoid Next.js's own role="alert" route-
  125 |     // announcer div.
  126 |     await expect(adminSuperPage.locator("main").getByRole("alert")).toContainText("Certificate file not found");
  127 |     await expect(adminSuperPage.getByRole("dialog")).toHaveCount(0);
  128 | 
  129 |     // Clean up.
  130 |     await row.getByRole("button", { name: "Review", exact: true }).click();
  131 |     await adminSuperPage.getByRole("dialog").getByLabel("Review remarks").fill("E2E test cleanup rejection.");
  132 |     await adminSuperPage.getByRole("dialog").getByRole("button", { name: "Reject", exact: true }).click();
  133 |     await expect(adminSuperPage.getByRole("row", { name: new RegExp(courseName) })).not.toBeVisible();
  134 |   });
  135 | 
  136 |   test("previewing a second certificate after closing the first shows fresh content, not stale state", async ({ request, adminSuperPage }) => {
  137 |     const courseNameA = await seedPendingCertification(request);
  138 |     const courseNameB = await seedPendingCertification(request);
  139 |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  140 |     const rowA = adminSuperPage.getByRole("row", { name: new RegExp(courseNameA) });
  141 |     const rowB = adminSuperPage.getByRole("row", { name: new RegExp(courseNameB) });
  142 |     await expect(rowA).toBeVisible({ timeout: 15000 });
  143 |     await expect(rowB).toBeVisible({ timeout: 15000 });
  144 | 
  145 |     // Note: the two previews can't be opened back-to-back without closing
  146 |     // the first -- the Modal's full-viewport backdrop (role="presentation",
  147 |     // inset-0, z-[90]) genuinely blocks clicks on anything behind it, same
  148 |     // as a real user would be blocked. So this exercises close-then-reopen.
  149 |     const dialog = adminSuperPage.getByRole("dialog");
  150 |     await rowA.getByRole("button", { name: `Preview ${courseNameA}` }).click();
  151 |     await expect(dialog).toBeVisible();
  152 |     const firstSrc = await dialog.locator("iframe, img").getAttribute("src");
  153 |     await adminSuperPage.keyboard.press("Escape");
  154 |     await expect(dialog).toBeHidden();
  155 | 
  156 |     await rowB.getByRole("button", { name: `Preview ${courseNameB}` }).click();
  157 |     await expect(dialog).toBeVisible();
  158 |     const secondSrc = await dialog.locator("iframe, img").getAttribute("src");
  159 |     expect(secondSrc).toBeTruthy();
  160 |     // A fresh object URL for the second file, not the first preview's
  161 |     // (revoked) one -- proves preview() isn't leaking stale blob state.
  162 |     expect(secondSrc).not.toBe(firstSrc);
  163 |     await adminSuperPage.keyboard.press("Escape");
  164 |     await expect(dialog).toBeHidden();
  165 | 
  166 |     // Clean up both.
  167 |     for (const [row, name] of [[rowA, courseNameA], [rowB, courseNameB]] as const) {
  168 |       await row.getByRole("button", { name: "Review", exact: true }).click();
  169 |       await adminSuperPage.getByRole("dialog").getByLabel("Review remarks").fill("E2E test cleanup rejection.");
  170 |       await adminSuperPage.getByRole("dialog").getByRole("button", { name: "Reject", exact: true }).click();
  171 |       await expect(adminSuperPage.getByRole("row", { name: new RegExp(name) })).not.toBeVisible();
  172 |     }
  173 |   });
  174 | 
  175 |   test("certificate preview dialog stays usable on a mobile viewport", async ({ request, adminSuperPage }) => {
  176 |     const courseName = await seedPendingCertification(request);
  177 |     await adminSuperPage.setViewportSize({ width: 375, height: 812 });
  178 |     await adminSuperPage.goto("/dashboard/admin/certification-review");
  179 |     const row = adminSuperPage.getByRole("row", { name: new RegExp(courseName) });
  180 |     await expect(row).toBeVisible({ timeout: 15000 });
  181 | 
  182 |     await row.getByRole("button", { name: `Preview ${courseName}` }).click();
  183 |     const dialog = adminSuperPage.getByRole("dialog");
  184 |     await expect(dialog).toBeVisible();
  185 |     const box = await dialog.boundingBox();
  186 |     expect(box?.width).toBeLessThanOrEqual(375);
  187 |     await adminSuperPage.keyboard.press("Escape");
  188 |     await expect(dialog).toBeHidden();
  189 | 
  190 |     // Clean up.
```