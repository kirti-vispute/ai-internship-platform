# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflows\admin.workflows.spec.ts >> Admin workflow: verification queue and rejection/suspension UI >> Reject actually persists a rejection reason, and CloudNest is restored to pending afterwards
- Location: tests\e2e\workflows\admin.workflows.spec.ts:399:7

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Reject', exact: true }) resolved to 2 elements:
    1) <button data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-soft hover:border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-raised)] h-9 px-4 text-sm">Reject</button> aka getByRole('button', { name: 'Reject' }).first()
    2) <button data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-soft hover:border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-raised)] h-9 px-4 text-sm">Reject</button> aka getByRole('button', { name: 'Reject' }).nth(1)

Call log:
  - waiting for getByRole('button', { name: 'Reject', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e7]:
    - complementary [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e13]:
          - paragraph [ref=e14]: Admin Portal
          - heading "InternAI" [level=2] [ref=e15]
        - button "Collapse Sidebar" [ref=e19] [cursor=pointer]
      - navigation "Primary" [ref=e25]:
        - generic [ref=e26]:
          - paragraph [ref=e27]: Main
          - list [ref=e28]:
            - listitem [ref=e29]:
              - link "Dashboard Overview" [ref=e30] [cursor=pointer]:
                - /url: /dashboard/admin
        - generic [ref=e39]:
          - paragraph [ref=e40]: Management
          - list [ref=e41]:
            - listitem [ref=e42]:
              - link "Users" [ref=e43] [cursor=pointer]:
                - /url: /dashboard/admin/users
            - listitem [ref=e52]:
              - link "Companies" [ref=e53] [cursor=pointer]:
                - /url: /dashboard/admin/companies
            - listitem [ref=e63]:
              - link "Verification Queue" [ref=e64] [cursor=pointer]:
                - /url: /dashboard/admin/verification
            - listitem [ref=e71]:
              - link "Internships" [ref=e72] [cursor=pointer]:
                - /url: /dashboard/admin/internships
            - listitem [ref=e83]:
              - link "Certification Review" [ref=e84] [cursor=pointer]:
                - /url: /dashboard/admin/certification-review
        - generic [ref=e91]:
          - paragraph [ref=e92]: Moderation
          - list [ref=e93]:
            - listitem [ref=e94]:
              - link "Reported Companies" [ref=e95] [cursor=pointer]:
                - /url: /dashboard/admin/reports
            - listitem [ref=e101]:
              - link "Activity Logs" [ref=e102] [cursor=pointer]:
                - /url: /dashboard/admin/activity-logs
        - generic [ref=e108]:
          - paragraph [ref=e109]: Secondary
          - list [ref=e110]:
            - listitem [ref=e111]:
              - link "Platform Statistics" [ref=e112] [cursor=pointer]:
                - /url: /dashboard/admin/analytics
            - listitem [ref=e121]:
              - link "Notifications" [ref=e122] [cursor=pointer]:
                - /url: /dashboard/admin/notifications
            - listitem [ref=e129]:
              - link "AI Hiring Scoring" [ref=e130] [cursor=pointer]:
                - /url: /dashboard/admin/hiring-scoring
            - listitem [ref=e139]:
              - link "Settings" [ref=e140] [cursor=pointer]:
                - /url: /dashboard/admin/settings
    - generic [ref=e147]:
      - banner [ref=e148]:
        - generic [ref=e149]:
          - generic [ref=e151]:
            - paragraph [ref=e152]: Admin Portal
            - heading "Platform management center." [level=1] [ref=e153]
            - paragraph [ref=e154]: Hi, admin@internai.com
            - paragraph [ref=e155]: super admin
          - button "Logout" [ref=e157] [cursor=pointer]
      - main [ref=e163]:
        - generic [ref=e164]:
          - generic [ref=e165]:
            - heading "Verification Queue" [level=1] [ref=e166]
            - paragraph [ref=e167]: Review and approve or reject pending company accounts.
          - button "Refresh" [ref=e168] [cursor=pointer]
        - generic [ref=e169]:
          - generic [ref=e170]:
            - generic [ref=e171]:
              - textbox "Search companies..." [ref=e172]: CloudNest
              - button "Clear search" [ref=e173] [cursor=pointer]
            - button "Search" [active] [ref=e178] [cursor=pointer]
          - generic [ref=e181]:
            - generic [ref=e182]:
              - generic [ref=e183]:
                - heading "CloudNest" [level=3] [ref=e184]
                - generic [ref=e185]: pending
              - paragraph [ref=e190]: company2@example.com
              - generic [ref=e191]:
                - generic [ref=e192]: "GSTIN: 33BBBBB1111B1Z6"
                - generic [ref=e193]: "Contact: Nisha Rao"
                - generic [ref=e194]: "Phone: 9234567890"
                - generic [ref=e195]: "Registered: Jun 6, 2026"
              - paragraph [ref=e196]: Cloud analytics company
            - generic [ref=e197]:
              - button "Verification PDF" [ref=e198] [cursor=pointer]
              - button "Verify" [ref=e204] [cursor=pointer]
              - button "Reject" [ref=e205] [cursor=pointer]
              - button "Suspend" [ref=e206] [cursor=pointer]
          - generic [ref=e207]: Page 1 of 1 · 1 company
  - generic [ref=e214] [cursor=pointer]:
    - button "Open issues overlay" [ref=e215]:
      - generic [ref=e219]:
        - generic [ref=e220]: "0"
        - generic [ref=e221]: "1"
      - generic [ref=e222]: Issue
    - button "Collapse issues badge" [ref=e223]
  - alert [ref=e226]
```

# Test source

```ts
  309 |       await adminSuperPage.getByRole("button", { name: "Verify", exact: true }).first().click();
  310 |       await expect(adminSuperPage.getByRole("button", { name: "Unverify", exact: true }).first()).toBeVisible();
  311 |     }
  312 |   });
  313 | 
  314 |   test("search matches by contact name (recruiter), not just company name", async ({ adminSuperPage }) => {
  315 |     // CloudNest's seeded contactName is "Nisha Rao" (backend $or includes
  316 |     // contactName, admin.controller.js getCompanies) -- searching a fragment
  317 |     // of it should surface the company even though the query never appears
  318 |     // in companyName/companyEmail. Read-only, no state mutation.
  319 |     await adminSuperPage.goto("/dashboard/admin/verification");
  320 |     await adminSuperPage.getByPlaceholder(/search companies/i).fill("Nisha");
  321 |     await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  322 |     await expect(adminSuperPage.getByText("CloudNest")).toBeVisible({ timeout: 15000 });
  323 |   });
  324 | });
  325 | 
  326 | test.describe("Admin workflow: verification queue and rejection/suspension UI", () => {
  327 |   test("Verification Queue lists only pending companies, not verified ones", async ({ adminSuperPage }) => {
  328 |     await adminSuperPage.goto("/dashboard/admin/verification");
  329 |     await expect(adminSuperPage.getByText("pending", { exact: true }).first()).toBeVisible();
  330 |     await expect(adminSuperPage.getByText("Verified", { exact: true })).toHaveCount(0);
  331 |   });
  332 | 
  333 |   // CloudNest is a seeded pending fixture, distinct from "E2E Test Company"
  334 |   // (used by the verify/unverify round-trip test above) -- keeps this test's
  335 |   // blast radius isolated from that one. Searching first narrows the queue
  336 |   // to a single card, so page-level role locators are unambiguous --
  337 |   // matches the existing pattern in the verify/unverify test above.
  338 |   test("Reject reveals an inline reason field and can be collapsed without submitting", async ({ adminSuperPage }) => {
  339 |     await adminSuperPage.goto("/dashboard/admin/verification");
  340 |     await adminSuperPage.getByPlaceholder(/search companies/i).fill("CloudNest");
  341 |     await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  342 |     // Wait for the filter to actually resolve (the list briefly shows a
  343 |     // loading skeleton with no company text at all) before deciding whether
  344 |     // to skip -- an immediate .count() here can misfire as "not found"
  345 |     // while still mid-request. Once "E2E Test Co" (the OTHER seeded pending
  346 |     // fixture -- distinct from the normally-verified "E2E Test Company") is
  347 |     // gone, the filter has settled and its Reject button can no longer make
  348 |     // the role locator below ambiguous.
  349 |     await expect(adminSuperPage.getByText("E2E Test Co")).toBeHidden({ timeout: 15000 });
  350 |     const card = adminSuperPage.locator("text=CloudNest").first();
  351 |     test.skip((await card.count()) === 0, "CloudNest fixture company not visible in verification queue.");
  352 | 
  353 |     await adminSuperPage.getByRole("button", { name: "Reject", exact: true }).click();
  354 |     const reasonField = adminSuperPage.getByLabel("Rejection reason");
  355 |     await expect(reasonField).toBeVisible();
  356 | 
  357 |     // Re-clicking Reject toggles the inline panel closed -- there is no
  358 |     // separate Cancel button (confirmed in admin-companies-view.tsx).
  359 |     await adminSuperPage.getByRole("button", { name: "Reject", exact: true }).click();
  360 |     await expect(reasonField).toBeHidden();
  361 |     // Company is untouched -- still pending, Verify button still present.
  362 |     await expect(adminSuperPage.getByRole("button", { name: "Verify", exact: true })).toBeVisible();
  363 |   });
  364 | 
  365 |   test("Suspend opens a confirmation dialog that can be cancelled", async ({ adminSuperPage }) => {
  366 |     await adminSuperPage.goto("/dashboard/admin/verification");
  367 |     await adminSuperPage.getByPlaceholder(/search companies/i).fill("CloudNest");
  368 |     await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  369 |     // See the comment in the Reject test above -- wait for the filter to
  370 |     // resolve before deciding whether to skip, not an instant .count().
  371 |     await expect(adminSuperPage.getByText("E2E Test Co")).toBeHidden({ timeout: 15000 });
  372 |     const card = adminSuperPage.locator("text=CloudNest").first();
  373 |     test.skip((await card.count()) === 0, "CloudNest fixture company not visible in verification queue.");
  374 | 
  375 |     await adminSuperPage.getByRole("button", { name: "Suspend", exact: true }).click();
  376 |     const dialog = adminSuperPage.getByRole("dialog");
  377 |     await expect(dialog).toContainText("Suspend CloudNest?");
  378 |     await dialog.getByRole("button", { name: "Cancel" }).click();
  379 |     await expect(dialog).toBeHidden();
  380 |     // Still pending, not suspended -- Suspend button (not Reactivate) still present.
  381 |     await expect(adminSuperPage.getByRole("button", { name: "Suspend", exact: true })).toBeVisible();
  382 |   });
  383 | 
  384 |   test("search narrows the verification queue", async ({ adminSuperPage }) => {
  385 |     await adminSuperPage.goto("/dashboard/admin/verification");
  386 |     await adminSuperPage.getByPlaceholder(/search companies/i).fill("zzzznonexistentzzzz9999");
  387 |     await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  388 |     await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  389 |     await expect(adminSuperPage.getByText("CloudNest")).toBeHidden();
  390 |   });
  391 | 
  392 |   // Full real round trip: reject CloudNest for real (persists status +
  393 |   // reason to the DB), confirm it, then restore it to "pending" via
  394 |   // Verify -> Unverify so every other test in this file keeps finding it in
  395 |   // its expected starting state. There is no direct "rejected -> pending"
  396 |   // button, so the restore path deliberately goes through "verified" first
  397 |   // (Unverify is the only control that sets status back to "pending" --
  398 |   // admin-dashboard-page.tsx handleVerify(company, "pending", ...)).
  399 |   test("Reject actually persists a rejection reason, and CloudNest is restored to pending afterwards", async ({ adminSuperPage }) => {
  400 |     await adminSuperPage.goto("/dashboard/admin/verification");
  401 |     await adminSuperPage.getByPlaceholder(/search companies/i).fill("CloudNest");
  402 |     await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  403 |     await expect(adminSuperPage.getByText("E2E Test Co")).toBeHidden({ timeout: 15000 });
  404 |     const card = adminSuperPage.locator("text=CloudNest").first();
  405 |     test.skip((await card.count()) === 0, "CloudNest fixture company not visible in verification queue.");
  406 | 
  407 |     try {
  408 |       const reason = "E2E automated rejection check -- restored to pending by the same test.";
> 409 |       await adminSuperPage.getByRole("button", { name: "Reject", exact: true }).click();
      |                                                                                 ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Reject', exact: true }) resolved to 2 elements:
  410 |       await adminSuperPage.getByLabel("Rejection reason").fill(reason);
  411 |       await adminSuperPage.getByRole("button", { name: "Confirm Rejection", exact: true }).click();
  412 |       // Rejected is no longer pending -- it leaves the verification queue.
  413 |       await expect(adminSuperPage.getByText("CloudNest")).toBeHidden({ timeout: 15000 });
  414 | 
  415 |       // Confirm the rejection actually persisted (status + reason) on the
  416 |       // general Companies view, which shows every status.
  417 |       await adminSuperPage.goto("/dashboard/admin/companies");
  418 |       await adminSuperPage.getByPlaceholder(/search companies/i).fill("CloudNest");
  419 |       await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  420 |       // Lowercase -- StatusBadge's "capitalize" is a CSS text-transform only,
  421 |       // the DOM text node is the raw lowercase status value.
  422 |       await expect(adminSuperPage.getByText("rejected", { exact: true }).first()).toBeVisible({ timeout: 15000 });
  423 |       await expect(adminSuperPage.getByText(`Reason: ${reason}`)).toBeVisible();
  424 | 
  425 |       // Restore -- rejected isn't verified, so Verify is offered; then Unverify
  426 |       // (confirmed) sets it back to "pending", its original state. This is the
  427 |       // 4th and 5th real backend round trip inside one test, so give each a
  428 |       // generous timeout rather than the 5s default.
  429 |       await adminSuperPage.getByRole("button", { name: "Verify", exact: true }).first().click();
  430 |       await expect(adminSuperPage.getByRole("button", { name: "Unverify", exact: true }).first()).toBeVisible({ timeout: 15000 });
  431 |       await adminSuperPage.getByRole("button", { name: "Unverify", exact: true }).first().click();
  432 |       const dialog = adminSuperPage.getByRole("dialog");
  433 |       await expect(dialog).toContainText("Unverify CloudNest?", { timeout: 15000 });
  434 |       await dialog.getByRole("button", { name: "Unverify", exact: true }).click();
  435 |       await expect(dialog).toBeHidden({ timeout: 15000 });
  436 | 
  437 |       // Full circle -- back in the pending queue.
  438 |       await adminSuperPage.goto("/dashboard/admin/verification");
  439 |       await adminSuperPage.getByPlaceholder(/search companies/i).fill("CloudNest");
  440 |       await adminSuperPage.getByRole("button", { name: "Search", exact: true }).click();
  441 |       // Wait for the filter to settle (see the comment on the same pattern
  442 |       // earlier in this file) before asserting on "Reject" -- otherwise the
  443 |       // still-unfiltered list can transiently show both CloudNest's AND
  444 |       // "E2E Test Co"'s Reject button, making the role locator ambiguous.
  445 |       await expect(adminSuperPage.getByText("E2E Test Co")).toBeHidden({ timeout: 15000 });
  446 |       await expect(adminSuperPage.getByRole("button", { name: "Reject", exact: true })).toBeVisible({ timeout: 15000 });
  447 |     } finally {
  448 |       // If any step above died mid-flight, CloudNest must not stay rejected:
  449 |       // two other specs (search-by-recruiter, pending-only queue) require it
  450 |       // pending. Restore through the API rather than the UI so the cleanup
  451 |       // cannot itself fail on whatever UI state the failure left behind.
  452 |       const token = await adminSuperPage.evaluate(() => window.localStorage.getItem("internai.auth.token"));
  453 |       const companiesRes = await adminSuperPage.request.get(`${BACKEND_URL}/api/admin/companies`, {
  454 |         headers: { Authorization: `Bearer ${token}` }
  455 |       });
  456 |       const body = await companiesRes.json().catch(() => ({}));
  457 |       const list = body.companies || body.data?.companies || [];
  458 |       const cloudNest = list.find((c: { companyName?: string }) => c.companyName === "CloudNest");
  459 |       if (cloudNest && cloudNest.verificationStatus !== "pending") {
  460 |         await adminSuperPage.request.patch(`${BACKEND_URL}/api/admin/companies/${cloudNest._id}/verification`, {
  461 |           headers: { Authorization: `Bearer ${token}` },
  462 |           data: { status: "pending", rejectionReason: "" }
  463 |         });
  464 |       }
  465 |     }
  466 |   });
  467 | });
  468 | 
  469 | test.describe("Admin workflow: user management actions", () => {
  470 |   test("changing an admin sub-role applies immediately and round-trips back", async ({ adminSuperPage }) => {
  471 |     await adminSuperPage.goto("/dashboard/admin/users");
  472 |     // No search field for admin rows specifically -- the role-change select's
  473 |     // accessible name is the user's CURRENT admin role (admin-dashboard-page.tsx),
  474 |     // so this only works while the fixture starts as Support Admin.
  475 |     const roleSelect = adminSuperPage.getByRole("combobox", { name: "Support Admin" });
  476 |     test.skip((await roleSelect.count()) === 0, "e2e.admin.support fixture row not visible (unexpected role or not seeded).");
  477 | 
  478 |     await roleSelect.selectOption("verification_admin");
  479 |     await expect(adminSuperPage.getByRole("combobox", { name: "Verification Admin" })).toBeVisible();
  480 |     await expect(adminSuperPage.getByText("Admin role updated")).toBeVisible();
  481 | 
  482 |     // Revert -- leave the shared fixture's admin role as found.
  483 |     await adminSuperPage.getByRole("combobox", { name: "Verification Admin" }).selectOption("support_admin");
  484 |     await expect(adminSuperPage.getByRole("combobox", { name: "Support Admin" })).toBeVisible();
  485 |   });
  486 | 
  487 |   // Deactivate/Activate is immediate (no ConfirmDialog) and toggles by
  488 |   // re-clicking the same button with a flipped label -- safe to round-trip,
  489 |   // but only on a generic seeded intern, never on an e2e.* login fixture
  490 |   // that other specs depend on being able to authenticate as.
  491 |   test("Deactivate/Activate toggles a non-fixture user's status, shows a success toast, and survives a reload", async ({ adminSuperPage }) => {
  492 |     await adminSuperPage.goto("/dashboard/admin/users");
  493 |     const search = adminSuperPage.getByPlaceholder(/search by email/i);
  494 |     await search.fill("studentmail.example");
  495 |     const row = adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first();
  496 |     test.skip((await row.count()) === 0, "No non-fixture seeded student found to safely toggle.");
  497 | 
  498 |     await row.getByRole("button", { name: "Deactivate", exact: true }).click();
  499 |     await expect(row.getByRole("button", { name: "Activate", exact: true })).toBeVisible();
  500 |     await expect(adminSuperPage.getByText("User deactivated")).toBeVisible();
  501 | 
  502 |     // Reload -- the flip must be a real DB write, not just client-side state.
  503 |     await adminSuperPage.reload();
  504 |     await search.fill("studentmail.example");
  505 |     await expect(adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first().getByRole("button", { name: "Activate", exact: true })).toBeVisible();
  506 | 
  507 |     // Revert -- leave the seeded account active as found.
  508 |     await adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first().getByRole("button", { name: "Activate", exact: true }).click();
  509 |     await expect(adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first().getByRole("button", { name: "Deactivate", exact: true })).toBeVisible();
```