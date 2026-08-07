# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Admin dashboard charts respect the active theme >> growth chart line color reflects the active palette, or the empty state renders cleanly
- Location: tests\e2e\theme\theme.spec.ts:456:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Not enough activity yet')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Not enough activity yet')

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- complementary:
  - paragraph: Admin Portal
  - heading "InternAI" [level=2]
  - button "Collapse Sidebar"
  - navigation "Primary":
    - paragraph: Main
    - list:
      - listitem:
        - link "Dashboard Overview":
          - /url: /dashboard/admin
    - paragraph: Management
    - list:
      - listitem:
        - link "Users":
          - /url: /dashboard/admin/users
      - listitem:
        - link "Companies":
          - /url: /dashboard/admin/companies
      - listitem:
        - link "Verification Queue":
          - /url: /dashboard/admin/verification
      - listitem:
        - link "Internships":
          - /url: /dashboard/admin/internships
      - listitem:
        - link "Certification Review":
          - /url: /dashboard/admin/certification-review
    - paragraph: Moderation
    - list:
      - listitem:
        - link "Reported Companies":
          - /url: /dashboard/admin/reports
      - listitem:
        - link "Activity Logs":
          - /url: /dashboard/admin/activity-logs
    - paragraph: Secondary
    - list:
      - listitem:
        - link "Platform Statistics":
          - /url: /dashboard/admin/analytics
      - listitem:
        - link "Notifications":
          - /url: /dashboard/admin/notifications
      - listitem:
        - link "AI Hiring Scoring":
          - /url: /dashboard/admin/hiring-scoring
      - listitem:
        - link "Settings":
          - /url: /dashboard/admin/settings
- banner:
  - paragraph: Admin Portal
  - heading "Platform management center." [level=1]
  - paragraph: Hi, admin@internai.com
  - paragraph: super admin
  - button "Logout"
- main:
  - heading "Platform Analytics" [level=1]
  - paragraph: Real-time KPIs and operational trends.
  - button "Refresh"
  - paragraph: Total Students
  - paragraph: "106"
  - paragraph: Registered intern accounts
  - paragraph: Total Companies
  - paragraph: "9"
  - paragraph: Company organizations onboarded
  - paragraph: Total Hires
  - paragraph: "12"
  - paragraph: Applications marked selected/offered
  - paragraph: Active Interviews
  - paragraph: "21"
  - paragraph: Ongoing interview pipeline
  - heading "Student Growth" [level=3]
  - paragraph: 93 new students total · latest period 0
  - img "Trend of new students over time. Total 93, most recent period 0.": 0 47 93 Mar 26 Apr 26 May 26 Jun 26 Jul 26 Aug 26
  - table "new students by period":
    - caption: new students by period
    - rowgroup:
      - row "Period Value":
        - columnheader "Period"
        - columnheader "Value"
    - rowgroup:
      - row "Mar 26 0":
        - cell "Mar 26"
        - cell "0"
      - row "Apr 26 0":
        - cell "Apr 26"
        - cell "0"
      - row "May 26 0":
        - cell "May 26"
        - cell "0"
      - row "Jun 26 0":
        - cell "Jun 26"
        - cell "0"
      - row "Jul 26 93":
        - cell "Jul 26"
        - cell "93"
      - row "Aug 26 0":
        - cell "Aug 26"
        - cell "0"
  - heading "Company Registrations" [level=3]
  - paragraph: 9 new companies total · latest period 0
  - img "Trend of new companies over time. Total 9, most recent period 0.": 0 4 7 Mar 26 Apr 26 May 26 Jun 26 Jul 26 Aug 26
  - table "new companies by period":
    - caption: new companies by period
    - rowgroup:
      - row "Period Value":
        - columnheader "Period"
        - columnheader "Value"
    - rowgroup:
      - row "Mar 26 0":
        - cell "Mar 26"
        - cell "0"
      - row "Apr 26 0":
        - cell "Apr 26"
        - cell "0"
      - row "May 26 0":
        - cell "May 26"
        - cell "0"
      - row "Jun 26 2":
        - cell "Jun 26"
        - cell "2"
      - row "Jul 26 7":
        - cell "Jul 26"
        - cell "7"
      - row "Aug 26 0":
        - cell "Aug 26"
        - cell "0"
  - heading "Internship Growth" [level=3]
  - paragraph: 24 new postings total · latest period 1
  - img "Trend of new postings over time. Total 24, most recent period 1.": 0 11 21 Mar 26 Apr 26 May 26 Jun 26 Jul 26 Aug 26
  - table "new postings by period":
    - caption: new postings by period
    - rowgroup:
      - row "Period Value":
        - columnheader "Period"
        - columnheader "Value"
    - rowgroup:
      - row "Mar 26 0":
        - cell "Mar 26"
        - cell "0"
      - row "Apr 26 0":
        - cell "Apr 26"
        - cell "0"
      - row "May 26 0":
        - cell "May 26"
        - cell "0"
      - row "Jun 26 2":
        - cell "Jun 26"
        - cell "2"
      - row "Jul 26 21":
        - cell "Jul 26"
        - cell "21"
      - row "Aug 26 1":
        - cell "Aug 26"
        - cell "1"
  - heading "Operational Mix" [level=3]
  - paragraph: Current platform workload distribution
  - paragraph: Pending Company Approvals
  - paragraph: "1"
  - paragraph: Open Reports
  - paragraph: "0"
- alert
```

# Test source

```ts
  373 |   { name: "Company Verification", path: "/dashboard/admin/verification", heading: "Verification Queue" },
  374 |   { name: "Reports", path: "/dashboard/admin/reports", heading: "Reported Companies" },
  375 |   { name: "Certification Review", path: "/dashboard/admin/certification-review", heading: "Certification Review" },
  376 |   { name: "Settings", path: "/dashboard/admin/settings", heading: "Settings" }
  377 | ];
  378 | 
  379 | test.describe("Admin dashboard: every major page renders correctly in both themes", () => {
  380 |   for (const appearance of APPEARANCES) {
  381 |     test(`Dashboard, User Management, Company Verification, Reports, Certification Review, and Settings all render in ${appearance} mode`, async ({
  382 |       adminSuperPage
  383 |     }) => {
  384 |       await adminSuperPage.goto("/dashboard/admin/settings");
  385 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  386 |       await expect.poll(async () => (await readAppliedTheme(adminSuperPage)).appearance).toBe(appearance);
  387 | 
  388 |       for (const page of ADMIN_PAGES) {
  389 |         await adminSuperPage.goto(page.path);
  390 |         await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  391 |         // Two <h1>s exist on every admin view: AdminShell's own welcome
  392 |         // banner ("Platform management center.") and the view's own title
  393 |         // (admin-dashboard-page.tsx's meta.title) -- a bare level-1 role
  394 |         // query is ambiguous, so scope to the page-title heading specifically.
  395 |         await expect(adminSuperPage.getByRole("heading", { level: 1, name: page.heading })).toBeVisible();
  396 |         const applied = await readAppliedTheme(adminSuperPage);
  397 |         expect(applied.appearance).toBe(appearance);
  398 |         expect(applied.isDarkClass).toBe(appearance === "dark");
  399 |       }
  400 |     });
  401 |   }
  402 | });
  403 | 
  404 | test.describe("Admin dashboard: tables, cards, and status badges repaint with appearance", () => {
  405 |   test("computed background color for a table and a card differ between light and dark", async ({ adminSuperPage }) => {
  406 |     async function readSnapshot() {
  407 |       await adminSuperPage.goto("/dashboard/admin/users");
  408 |       await expect(adminSuperPage.getByRole("table")).toBeVisible({ timeout: 15000 });
  409 |       // The surface color lives on the table's wrapper div (.ds-table-wrap),
  410 |       // not <tr>/<td> -- confirmed against platform-design-system.css: table
  411 |       // rows/cells are transparent by default and only gain a background on
  412 |       // :hover, so asserting on <tr> itself would compare transparent to
  413 |       // transparent regardless of theme.
  414 |       const tableBg = await readComputedStyle(adminSuperPage, ".ds-table-wrap", "background-color");
  415 | 
  416 |       await adminSuperPage.goto("/dashboard/admin/verification");
  417 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  418 |       const cardBg = await readComputedStyle(adminSuperPage, ".ds-card", "background-color");
  419 | 
  420 |       return { tableBg, cardBg };
  421 |     }
  422 | 
  423 |     await adminSuperPage.goto("/dashboard/admin/settings");
  424 |     await adminSuperPage.getByRole("button", { name: "Dark", exact: true }).click();
  425 |     const dark = await readSnapshot();
  426 | 
  427 |     await adminSuperPage.goto("/dashboard/admin/settings");
  428 |     await adminSuperPage.getByRole("button", { name: "Light", exact: true }).click();
  429 |     const light = await readSnapshot();
  430 | 
  431 |     expect(dark.tableBg).not.toBe(light.tableBg);
  432 |     expect(dark.cardBg).not.toBe(light.cardBg);
  433 |   });
  434 | 
  435 |   for (const appearance of APPEARANCES) {
  436 |     test(`status badges render with a visible, non-transparent color in ${appearance} mode`, async ({ adminSuperPage }) => {
  437 |       await adminSuperPage.goto("/dashboard/admin/settings");
  438 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  439 | 
  440 |       await adminSuperPage.goto("/dashboard/admin/users");
  441 |       await expect(adminSuperPage.getByRole("table")).toBeVisible({ timeout: 15000 });
  442 |       // "intern" is the largest role bucket in this dev DB (every student
  443 |       // signup) -- guaranteed present. The Role cell's only child is the
  444 |       // StatusBadge span, so its accessible name IS the badge's text.
  445 |       const roleCell = adminSuperPage.getByRole("cell", { name: "intern", exact: true }).first();
  446 |       await expect(roleCell).toBeVisible();
  447 |       const badge = roleCell.locator("span").first();
  448 |       const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
  449 |       expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  450 |       expect(bg).not.toBe("transparent");
  451 |     });
  452 |   }
  453 | });
  454 | 
  455 | test.describe("Admin dashboard charts respect the active theme", () => {
  456 |   test("growth chart line color reflects the active palette, or the empty state renders cleanly", async ({ adminSuperPage }) => {
  457 |     async function readChartStroke(paletteLabel: string) {
  458 |       await adminSuperPage.goto("/dashboard/admin/settings");
  459 |       await adminSuperPage.getByRole("button", { name: paletteLabel, exact: true }).click();
  460 |       await adminSuperPage.getByRole("button", { name: "Dark", exact: true }).click();
  461 | 
  462 |       await adminSuperPage.goto("/dashboard/admin/analytics");
  463 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  464 |       const charts = adminSuperPage.getByRole("img", { name: /^Trend of/i });
  465 | 
  466 |       if ((await charts.count()) > 0) {
  467 |         return charts.first().locator("path").nth(1).evaluate((el) => getComputedStyle(el).stroke);
  468 |       }
  469 |       // No growth data lands in the current 6-month fixture window on some
  470 |       // runs -- AdminGrowthCharts falls back to an EmptyState instead of a
  471 |       // chart, which is the other valid rendering branch and must still not
  472 |       // crash the page.
> 473 |       await expect(adminSuperPage.getByText("Not enough activity yet")).toBeVisible();
      |                                                                         ^ Error: expect(locator).toBeVisible() failed
  474 |       return null;
  475 |     }
  476 | 
  477 |     const oceanStroke = await readChartStroke("Ocean Blue");
  478 |     const midnightStroke = await readChartStroke("Midnight Black");
  479 | 
  480 |     if (oceanStroke !== null && midnightStroke !== null) {
  481 |       expect(midnightStroke).not.toBe(oceanStroke);
  482 |     }
  483 |   });
  484 | });
  485 | 
  486 | test.describe("Theme persistence: navigating between admin pages keeps the theme active", () => {
  487 |   test("a non-default theme stays applied across Dashboard, Users, Reports, and Settings", async ({ adminSuperPage }) => {
  488 |     await adminSuperPage.goto("/dashboard/admin/settings");
  489 |     await adminSuperPage.getByRole("button", { name: "Rose Pink", exact: true }).click();
  490 |     await adminSuperPage.getByRole("button", { name: "Light", exact: true }).click();
  491 |     await expect.poll(async () => (await readAppliedTheme(adminSuperPage)).storedTheme).toBe("rose");
  492 | 
  493 |     for (const path of ["/dashboard/admin", "/dashboard/admin/users", "/dashboard/admin/reports", "/dashboard/admin/settings"]) {
  494 |       await adminSuperPage.goto(path);
  495 |       const applied = await readAppliedTheme(adminSuperPage);
  496 |       expect(applied.theme).toBe("rose");
  497 |       expect(applied.appearance).toBe("light");
  498 |     }
  499 |   });
  500 | });
  501 | 
  502 | test.describe("Theme persistence: login pulls the saved server theme when no local cache exists", () => {
  503 |   test("logging in through the real form applies the account's saved theme immediately, without a reload", async ({ page, request }) => {
  504 |     const creds = FIXTURE_CREDENTIALS.adminVerification;
  505 |     const loginRes = await request.post(`${BACKEND_URL}/api/auth/admin/login`, {
  506 |       data: { email: creds.email, password: creds.password }
  507 |     });
  508 |     expect(loginRes.ok()).toBeTruthy();
  509 |     const loginBody = await loginRes.json();
  510 |     const token = loginBody.data.accessToken || loginBody.data.token;
  511 | 
  512 |     // Pin the account's SERVER-side preference to something distinctly
  513 |     // non-default, so "still the hardcoded default after login" and
  514 |     // "correctly pulled the saved preference" are unambiguous outcomes.
  515 |     const patchRes = await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  516 |       headers: { Authorization: `Bearer ${token}` },
  517 |       data: { theme: "crimson", appearance: "light" }
  518 |     });
  519 |     expect(patchRes.ok()).toBeTruthy();
  520 | 
  521 |     // A brand-new, unauthenticated page -- no localStorage theme cache, and
  522 |     // no injected session (loginAsRoleViaApi's addInitScript is deliberately
  523 |     // not used here) -- so this is a genuine first-ever login in this
  524 |     // browser context, the exact scenario the server round-trip exists for.
  525 |     await page.goto("/auth/admin");
  526 |     await waitForAuthFormHydration(page);
  527 |     await page.getByLabel("Admin Email", { exact: true }).fill(creds.email);
  528 |     await page.getByLabel("Password", { exact: true }).fill(creds.password);
  529 |     await page.locator('button[type="submit"]').click();
  530 |     await page.waitForURL(/\/dashboard\/admin/, { timeout: 15000 });
  531 | 
  532 |     await expect.poll(async () => (await readAppliedTheme(page)).theme).toBe("crimson");
  533 |     const applied = await readAppliedTheme(page);
  534 |     expect(applied.appearance).toBe("light");
  535 |     expect(applied.storedTheme).toBe("crimson");
  536 |     expect(applied.storedAppearance).toBe("light");
  537 | 
  538 |     // Restore this fixture account to the suite-wide default so any other
  539 |     // spec that later authenticates as it isn't left on a surprise palette.
  540 |     await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  541 |       headers: { Authorization: `Bearer ${token}` },
  542 |       data: { theme: "ocean", appearance: "dark" }
  543 |     });
  544 |   });
  545 | });
  546 | 
  547 | test.describe("Theme persistence: logout does not reset the active theme", () => {
  548 |   test("the active theme survives logout and remains applied on the login page", async ({ adminSuperPage }) => {
  549 |     const shell = new DashboardShellPage(adminSuperPage);
  550 |     await adminSuperPage.goto("/dashboard/admin/settings");
  551 |     await adminSuperPage.getByRole("button", { name: "Golden Yellow", exact: true }).click();
  552 |     await adminSuperPage.getByRole("button", { name: "Light", exact: true }).click();
  553 |     await expect.poll(async () => (await readAppliedTheme(adminSuperPage)).storedTheme).toBe("golden");
  554 | 
  555 |     await shell.logout();
  556 |     await expect(adminSuperPage).toHaveURL(/\/auth\/admin/);
  557 | 
  558 |     const applied = await readAppliedTheme(adminSuperPage);
  559 |     expect(applied.theme).toBe("golden");
  560 |     expect(applied.appearance).toBe("light");
  561 |   });
  562 | });
  563 | 
  564 | test.describe("Theme initialization: no console errors or hydration warnings", () => {
  565 |   test("reloading with a saved non-default theme produces no console errors", async ({ internPage }) => {
  566 |     const errors: string[] = [];
  567 |     internPage.on("console", (msg) => {
  568 |       if (msg.type() === "error") errors.push(msg.text());
  569 |     });
  570 |     internPage.on("pageerror", (err) => errors.push(err.message));
  571 | 
  572 |     await internPage.goto("/dashboard/intern/profile");
  573 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
```