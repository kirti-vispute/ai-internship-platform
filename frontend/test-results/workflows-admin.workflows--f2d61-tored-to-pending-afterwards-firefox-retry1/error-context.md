# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflows\admin.workflows.spec.ts >> Admin workflow: verification queue and rejection/suspension UI >> Reject actually persists a rejection reason, and CloudNest is restored to pending afterwards
- Location: tests\e2e\workflows\admin.workflows.spec.ts:399:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Reject', exact: true })
Expected: visible
Error: strict mode violation: getByRole('button', { name: 'Reject', exact: true }) resolved to 2 elements:
    1) <button data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-soft hover:border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-raised)] h-9 px-4 text-sm">Reject</button> aka getByRole('button', { name: 'Reject' }).first()
    2) <button data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-soft hover:border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-raised)] h-9 px-4 text-sm">Reject</button> aka getByRole('button', { name: 'Reject' }).nth(1)

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: 'Reject', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - link "Skip to main content" [ref=f2e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=f2e7]:
    - complementary [ref=f2e8]:
      - generic [ref=f2e9]:
        - generic [ref=f2e13]:
          - paragraph [ref=f2e14]: Admin Portal
          - heading "InternAI" [level=2] [ref=f2e15]
        - button "Collapse Sidebar" [ref=f2e19] [cursor=pointer]
      - navigation "Primary" [ref=f2e25]:
        - generic [ref=f2e26]:
          - paragraph [ref=f2e27]: Main
          - list [ref=f2e28]:
            - listitem [ref=f2e29]:
              - link "Dashboard Overview" [ref=f2e30] [cursor=pointer]:
                - /url: /dashboard/admin
        - generic [ref=f2e39]:
          - paragraph [ref=f2e40]: Management
          - list [ref=f2e41]:
            - listitem [ref=f2e42]:
              - link "Users" [ref=f2e43] [cursor=pointer]:
                - /url: /dashboard/admin/users
            - listitem [ref=f2e52]:
              - link "Companies" [ref=f2e53] [cursor=pointer]:
                - /url: /dashboard/admin/companies
            - listitem [ref=f2e63]:
              - link "Verification Queue" [ref=f2e64] [cursor=pointer]:
                - /url: /dashboard/admin/verification
            - listitem [ref=f2e71]:
              - link "Internships" [ref=f2e72] [cursor=pointer]:
                - /url: /dashboard/admin/internships
            - listitem [ref=f2e83]:
              - link "Certification Review" [ref=f2e84] [cursor=pointer]:
                - /url: /dashboard/admin/certification-review
        - generic [ref=f2e91]:
          - paragraph [ref=f2e92]: Moderation
          - list [ref=f2e93]:
            - listitem [ref=f2e94]:
              - link "Reported Companies" [ref=f2e95] [cursor=pointer]:
                - /url: /dashboard/admin/reports
            - listitem [ref=f2e101]:
              - link "Activity Logs" [ref=f2e102] [cursor=pointer]:
                - /url: /dashboard/admin/activity-logs
        - generic [ref=f2e108]:
          - paragraph [ref=f2e109]: Secondary
          - list [ref=f2e110]:
            - listitem [ref=f2e111]:
              - link "Platform Statistics" [ref=f2e112] [cursor=pointer]:
                - /url: /dashboard/admin/analytics
            - listitem [ref=f2e121]:
              - link "Notifications" [ref=f2e122] [cursor=pointer]:
                - /url: /dashboard/admin/notifications
            - listitem [ref=f2e129]:
              - link "AI Hiring Scoring" [ref=f2e130] [cursor=pointer]:
                - /url: /dashboard/admin/hiring-scoring
            - listitem [ref=f2e139]:
              - link "Settings" [ref=f2e140] [cursor=pointer]:
                - /url: /dashboard/admin/settings
    - generic [ref=f2e147]:
      - banner [ref=f2e148]:
        - generic [ref=f2e149]:
          - generic [ref=f2e151]:
            - paragraph [ref=f2e152]: Admin Portal
            - heading "Platform management center." [level=1] [ref=f2e153]
            - paragraph [ref=f2e154]: Hi, admin@internai.com
            - paragraph [ref=f2e155]: super admin
          - button "Logout" [ref=f2e157] [cursor=pointer]
      - main [ref=f2e163]:
        - generic [ref=f2e164]:
          - generic [ref=f2e165]:
            - heading "Verification Queue" [level=1] [ref=f2e166]
            - paragraph [ref=f2e167]: Review and approve or reject pending company accounts.
          - button "Refresh" [ref=f2e168] [cursor=pointer]
        - generic [ref=f2e169]:
          - generic [ref=f2e170]:
            - generic [ref=f2e171]:
              - textbox "Search companies..." [ref=f2e172]: CloudNest
              - button "Clear search" [ref=f2e173] [cursor=pointer]
            - button "Search" [active] [ref=f2e178] [cursor=pointer]
          - generic [ref=f2e181]:
            - generic [ref=f2e182]:
              - generic [ref=f2e183]:
                - heading "CloudNest" [level=3] [ref=f2e184]
                - generic [ref=f2e185]: pending
              - paragraph [ref=f2e190]: company2@example.com
              - generic [ref=f2e191]:
                - generic [ref=f2e192]: "GSTIN: 33BBBBB1111B1Z6"
                - generic [ref=f2e193]: "Contact: Nisha Rao"
                - generic [ref=f2e194]: "Phone: 9234567890"
                - generic [ref=f2e195]: "Registered: Jun 6, 2026"
              - paragraph [ref=f2e196]: Cloud analytics company
            - generic [ref=f2e197]:
              - button "Verification PDF" [ref=f2e198] [cursor=pointer]
              - button "Verify" [ref=f2e204] [cursor=pointer]
              - button "Reject" [ref=f2e205] [cursor=pointer]
              - button "Suspend" [ref=f2e206] [cursor=pointer]
          - generic [ref=f2e207]: Page 1 of 1 · 1 company
  - generic [ref=f2e214] [cursor=pointer]:
    - button "Open issues overlay" [ref=f2e215]:
      - generic [ref=f2e219]:
        - generic [ref=f2e220]: "0"
        - generic [ref=f2e221]: "1"
      - generic [ref=f2e222]: Issue
    - button "Collapse issues badge" [ref=f2e223]
  - alert [ref=f2e226]
```

# Test source

```ts
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
  409 |       await adminSuperPage.getByRole("button", { name: "Reject", exact: true }).click();
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
> 446 |       await expect(adminSuperPage.getByRole("button", { name: "Reject", exact: true })).toBeVisible({ timeout: 15000 });
      |                                                                                         ^ Error: expect(locator).toBeVisible() failed
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
  510 |     await expect(adminSuperPage.getByText("User activated")).toBeVisible();
  511 |   });
  512 | 
  513 |   test("Deactivate button is disabled for the row while its request is in flight (duplicate-action prevention)", async ({ adminSuperPage }) => {
  514 |     await adminSuperPage.goto("/dashboard/admin/users");
  515 |     await adminSuperPage.getByPlaceholder(/search by email/i).fill("studentmail.example");
  516 |     const row = adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first();
  517 |     test.skip((await row.count()) === 0, "No non-fixture seeded student found to safely toggle.");
  518 | 
  519 |     await adminSuperPage.route("**/api/admin/users/*", async (route) => {
  520 |       if (route.request().method() !== "PATCH") return route.continue();
  521 |       await new Promise((resolve) => setTimeout(resolve, 800));
  522 |       return route.continue();
  523 |     });
  524 | 
  525 |     const deactivateButton = row.getByRole("button", { name: "Deactivate", exact: true });
  526 |     await deactivateButton.click();
  527 |     await expect(deactivateButton).toBeDisabled();
  528 |     await expect(row.getByRole("button", { name: "Activate", exact: true })).toBeVisible({ timeout: 15000 });
  529 | 
  530 |     // Revert -- leave the seeded account active as found.
  531 |     await adminSuperPage.unroute("**/api/admin/users/*");
  532 |     await row.getByRole("button", { name: "Activate", exact: true }).click();
  533 |     await expect(row.getByRole("button", { name: "Deactivate", exact: true })).toBeVisible();
  534 |   });
  535 | 
  536 |   test("Soft Delete opens a confirmation dialog that can be cancelled", async ({ adminSuperPage }) => {
  537 |     await adminSuperPage.goto("/dashboard/admin/users");
  538 |     const search = adminSuperPage.getByPlaceholder(/search by email/i);
  539 |     await search.fill("studentmail.example");
  540 |     const row = adminSuperPage.getByRole("row", { name: /studentmail\.example/ }).first();
  541 |     test.skip((await row.count()) === 0, "No non-fixture seeded student found to safely target.");
  542 |     // The row's first cell is the select-checkbox, not the email -- read the
  543 |     // email from the checkbox's own "Select {email}" aria-label instead.
  544 |     const checkboxLabel = (await row.getByRole("checkbox").getAttribute("aria-label")) || "";
  545 |     const email = checkboxLabel.replace(/^Select /, "");
  546 | 
```