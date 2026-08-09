# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Theme initialization: no console errors or hydration warnings >> reloading with a saved non-default theme produces no console errors
- Location: tests\e2e\theme\theme.spec.ts:565:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 92

- Array []
+ Array [
+   "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:
+
+ - A server/client branch `if (typeof window !== 'undefined')`.
+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
+ - Date formatting in a user's locale which doesn't match the server.
+ - External changing data without sending a snapshot of it along with the HTML.
+ - Invalid HTML tag nesting.
+
+ It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.
+
+ %s%s https://react.dev/link/hydration-mismatch 
+
+   ...
+     <HotReload assetPrefix=\"\" globalError={[...]}>
+       <AppDevOverlayErrorBoundary globalError={[...]}>
+         <ReplaySsrOnlyErrors>
+         <DevRootHTTPAccessFallbackBoundary>
+           <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
+             <HTTPAccessFallbackErrorBoundary pathname=\"/dashboard...\" notFound={<NotAllowedRootHTTPFallbackError>} ...>
+               <RedirectBoundary>
+                 <RedirectErrorBoundary router={{...}}>
+                   <Head>
+                   <__next_root_layout_boundary__>
+                     <SegmentViewNode type=\"layout\" pagePath=\"/Major Pro...\">
+                       <SegmentTrieNode>
+                       <link>
+                       <script>
+                       <script>
+                       <script>
+                       <script>
+                       <RootLayout>
+                         <html lang=\"en\" className=\"dark\" data-scroll-behavior=\"smooth\" suppressHydrationWarning={true}>
+                           <head>
+                             <ThemeInitScript>
+                               <Script id=\"theme-init\" strategy=\"beforeInte...\" nonce=\"OWRlNWZlMW...\">
+                                 <script
+ +                                 nonce=\"OWRlNWZlMWEtZWExNC00Y2M0LWIwNGItZjFmNTM0ZGIzZDA3\"
+ -                                 nonce=\"\"
+                                   dangerouslySetInnerHTML={{__html:\"(self.__ne...\"}}
+                                 >
+                             ...
+                           ...
+                   ...
+ ",
+   "WebSocket connection to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' failed: WebSocket is closed before the connection is established.",
+   "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:
+
+ - A server/client branch `if (typeof window !== 'undefined')`.
+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
+ - Date formatting in a user's locale which doesn't match the server.
+ - External changing data without sending a snapshot of it along with the HTML.
+ - Invalid HTML tag nesting.
+
+ It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.
+
+ %s%s https://react.dev/link/hydration-mismatch 
+
+   ...
+     <HotReload assetPrefix=\"\" globalError={[...]}>
+       <AppDevOverlayErrorBoundary globalError={[...]}>
+         <ReplaySsrOnlyErrors>
+         <DevRootHTTPAccessFallbackBoundary>
+           <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
+             <HTTPAccessFallbackErrorBoundary pathname=\"/dashboard...\" notFound={<NotAllowedRootHTTPFallbackError>} ...>
+               <RedirectBoundary>
+                 <RedirectErrorBoundary router={{...}}>
+                   <Head>
+                   <__next_root_layout_boundary__>
+                     <SegmentViewNode type=\"layout\" pagePath=\"/Major Pro...\">
+                       <SegmentTrieNode>
+                       <link>
+                       <script>
+                       <script>
+                       <script>
+                       <script>
+                       <RootLayout>
+                         <html lang=\"en\" className=\"dark\" data-scroll-behavior=\"smooth\" suppressHydrationWarning={true}>
+                           <head>
+                             <ThemeInitScript>
+                               <Script id=\"theme-init\" strategy=\"beforeInte...\" nonce=\"ZDExMDlmYj...\">
+                                 <script
+ +                                 nonce=\"ZDExMDlmYjAtODZiMi00MWIzLWJjYzktMWNmYTBhZDU4YWI0\"
+ -                                 nonce=\"\"
+                                   dangerouslySetInnerHTML={{__html:\"(self.__ne...\"}}
+                                 >
+                             ...
+                           ...
+                   ...
+ ",
+   "WebSocket connection to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' failed: WebSocket is closed before the connection is established.",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - link "Skip to main content" [ref=f1e2]:
    - /url: "#main-content"
  - generic [ref=f1e7]:
    - complementary [ref=f1e8]:
      - generic [ref=f1e9]:
        - generic [ref=f1e13]:
          - paragraph [ref=f1e14]: Intern Portal
          - heading "InternAI" [level=2] [ref=f1e15]
        - button "Collapse Sidebar" [ref=f1e19] [cursor=pointer]
      - navigation "Primary" [ref=f1e22]:
        - generic [ref=f1e23]:
          - paragraph [ref=f1e24]: Main
          - list [ref=f1e25]:
            - listitem [ref=f1e26]:
              - link "Dashboard Overview" [ref=f1e27]:
                - /url: /dashboard/intern
            - listitem [ref=f1e36]:
              - link "Placement Hub" [ref=f1e37]:
                - /url: /dashboard/intern/placement-hub
        - generic [ref=f1e46]:
          - button "My Profile" [expanded] [ref=f1e47] [cursor=pointer]
          - list [ref=f1e59]:
            - listitem [ref=f1e60]:
              - link "Profile" [ref=f1e61]:
                - /url: /dashboard/intern/profile
            - listitem [ref=f1e69]:
              - link "Edit Profile" [ref=f1e70]:
                - /url: /dashboard/intern/profile/edit
            - listitem [ref=f1e78]:
              - link "Resume" [ref=f1e79]:
                - /url: /dashboard/intern/resume
            - listitem [ref=f1e86]:
              - link "Resume Score" [ref=f1e87]:
                - /url: /dashboard/intern/resume/score
            - listitem [ref=f1e94]:
              - link "3D Portfolio" [ref=f1e95]:
                - /url: /dashboard/intern/portfolio
            - listitem [ref=f1e102]:
              - link "Skill Gap Analysis" [ref=f1e103]:
                - /url: /dashboard/intern/skill-gap
        - generic [ref=f1e109]:
          - paragraph [ref=f1e110]: Internships
          - list [ref=f1e111]:
            - listitem [ref=f1e112]:
              - link "Recommended Internships" [ref=f1e113]:
                - /url: /dashboard/intern/internships/recommended
            - listitem [ref=f1e120]:
              - link "Search Internships" [ref=f1e121]:
                - /url: /dashboard/intern/internships/search
            - listitem [ref=f1e128]:
              - link "Saved Internships" [ref=f1e129]:
                - /url: /dashboard/intern/internships/saved
            - listitem [ref=f1e135]:
              - link "My Applications" [ref=f1e136]:
                - /url: /dashboard/intern/applications
            - listitem [ref=f1e143]:
              - link "Scheduled Interviews" [ref=f1e144]:
                - /url: /dashboard/intern/interviews
            - listitem [ref=f1e150]:
              - link "Analytics Center" [ref=f1e151]:
                - /url: /dashboard/intern/track-progress
        - generic [ref=f1e158]:
          - paragraph [ref=f1e159]: My Calendar
          - list [ref=f1e160]:
            - listitem [ref=f1e161]:
              - link "Personal Calendar" [ref=f1e162]:
                - /url: /dashboard/intern/calendar
        - generic [ref=f1e168]:
          - paragraph [ref=f1e169]: Learning
          - list [ref=f1e170]:
            - listitem [ref=f1e171]:
              - link "Courses" [ref=f1e172]:
                - /url: /dashboard/intern/learning/courses
            - listitem [ref=f1e178]:
              - link "Certifications" [ref=f1e179]:
                - /url: /dashboard/intern/learning/certifications
            - listitem [ref=f1e186]:
              - link "Mock Aptitude Test" [ref=f1e187]:
                - /url: /dashboard/intern/learning/mock-aptitude
            - listitem [ref=f1e194]:
              - link "Mock Technical Test" [ref=f1e195]:
                - /url: /dashboard/intern/learning/mock-technical
            - listitem [ref=f1e202]:
              - link "Mock Interview" [ref=f1e203]:
                - /url: /dashboard/intern/learning/mock-interview
        - generic [ref=f1e209]:
          - paragraph [ref=f1e210]: Feedback & Support
          - list [ref=f1e211]:
            - listitem [ref=f1e212]:
              - link "Notifications" [ref=f1e213]:
                - /url: /dashboard/intern/notifications
            - listitem [ref=f1e220]:
              - link "Messages" [ref=f1e221]:
                - /url: /dashboard/intern/chat
            - listitem [ref=f1e227]:
              - link "HR Feedback" [ref=f1e228]:
                - /url: /dashboard/intern/feedback/hr
            - listitem [ref=f1e234]:
              - link "Suggestions" [ref=f1e235]:
                - /url: /dashboard/intern/feedback/suggestions
            - listitem [ref=f1e241]:
              - link "Help / Support" [ref=f1e242]:
                - /url: /dashboard/intern/support
    - generic [ref=f1e249]:
      - banner [ref=f1e250]:
        - generic [ref=f1e251]:
          - generic [ref=f1e253]:
            - paragraph [ref=f1e254]: Intern Portal
            - heading "Welcome back. Let's accelerate your career." [level=1] [ref=f1e255]
            - paragraph [ref=f1e256]: Hi, E2E Test Intern
          - generic [ref=f1e257]:
            - button "4 unread notifications" [ref=f1e259] [cursor=pointer]:
              - generic [ref=f1e264]: "4"
            - button "Logout" [ref=f1e265] [cursor=pointer]
      - main [ref=f1e270]:
        - generic [ref=f1e271]:
          - generic [ref=f1e273]:
            - button "Overview" [ref=f1e274] [cursor=pointer]
            - button "Skills" [ref=f1e279] [cursor=pointer]
            - button "Education" [ref=f1e283] [cursor=pointer]
            - button "Projects" [ref=f1e288] [cursor=pointer]
            - button "Achievements" [ref=f1e292] [cursor=pointer]
            - button "Learning" [ref=f1e297] [cursor=pointer]
            - button "Theme" [ref=f1e301] [cursor=pointer]
          - generic [ref=f1e310]:
            - generic [ref=f1e311]:
              - heading "Overview" [level=3] [ref=f1e312]
              - paragraph [ref=f1e314]: Personal information, professional summary, and social links.
            - generic [ref=f1e316]:
              - generic [ref=f1e317]:
                - paragraph [ref=f1e318]: Personal Information
                - generic [ref=f1e320]:
                  - generic [ref=f1e321]: ET
                  - generic [ref=f1e322]:
                    - paragraph [ref=f1e323]: E2E Test Intern
                    - paragraph [ref=f1e324]: e2e.intern@internai-test.local
                    - paragraph [ref=f1e325]: "9999900001"
              - generic [ref=f1e326]:
                - paragraph [ref=f1e327]: Professional Summary
                - paragraph [ref=f1e328]: Aspiring software engineer skilled in React and Node.js, eager to contribute to real-world products.
              - generic [ref=f1e329]:
                - paragraph [ref=f1e330]: Social Links
                - generic [ref=f1e331]:
                  - link "LinkedIn (opens in new tab)" [ref=f1e332]:
                    - /url: https://linkedin.com/in/john-carter-dev
                    - generic [ref=f1e333]: LinkedIn
                    - generic [ref=f1e334]: (opens in new tab)
                  - link "GitHub (opens in new tab)" [ref=f1e340]:
                    - /url: https://github.com/john-carter-dev
                    - generic [ref=f1e341]: GitHub
                    - generic [ref=f1e342]: (opens in new tab)
                  - link "https://linkedin.com/in/john-carter-dev (opens in new tab)" [ref=f1e348]:
                    - /url: https://linkedin.com/in/john-carter-dev
                    - generic [ref=f1e349]: https://linkedin.com/in/john-carter-dev
                    - generic [ref=f1e350]: (opens in new tab)
  - generic [ref=f1e361] [cursor=pointer]:
    - button "Open issues overlay" [ref=f1e362]:
      - generic [ref=f1e366]:
        - generic [ref=f1e367]: "0"
        - generic [ref=f1e368]: "1"
      - generic [ref=f1e369]: Issue
    - button "Collapse issues badge" [ref=f1e370]
  - alert [ref=f1e373]
```

# Test source

```ts
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
  574 |     await internPage.getByRole("button", { name: "Earth Brown", exact: true }).click();
  575 |     await internPage.getByRole("button", { name: "Dark", exact: true }).click();
  576 |     await internPage.reload();
  577 |     await expect(internPage.getByRole("button", { name: "Theme", exact: true })).toBeVisible();
  578 | 
> 579 |     expect(errors).toEqual([]);
      |                    ^ Error: expect(received).toEqual(expected) // deep equality
  580 |   });
  581 | 
  582 |   test("switching theme and appearance repeatedly produces no console errors", async ({ internPage }) => {
  583 |     const errors: string[] = [];
  584 |     internPage.on("console", (msg) => {
  585 |       if (msg.type() === "error") errors.push(msg.text());
  586 |     });
  587 |     internPage.on("pageerror", (err) => errors.push(err.message));
  588 | 
  589 |     await internPage.goto("/dashboard/intern/profile");
  590 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  591 |     for (const palette of ["Olive Green", "Sunset Orange", "Royal Purple", "Ocean Blue"]) {
  592 |       await internPage.getByRole("button", { name: palette, exact: true }).click();
  593 |     }
  594 |     for (const label of ["Light", "Dark", "Light", "Dark"]) {
  595 |       await internPage.getByRole("button", { name: label, exact: true }).click();
  596 |     }
  597 | 
  598 |     expect(errors).toEqual([]);
  599 |   });
  600 | });
  601 | 
  602 | test.describe("Theme across responsive breakpoints: mobile", () => {
  603 |   test.use({ viewport: { width: 375, height: 812 } });
  604 | 
  605 |   test("admin Users page renders correctly in both themes at mobile width", async ({ adminSuperPage }) => {
  606 |     for (const appearance of APPEARANCES) {
  607 |       await adminSuperPage.goto("/dashboard/admin/settings");
  608 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  609 | 
  610 |       await adminSuperPage.goto("/dashboard/admin/users");
  611 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  612 |       await expect(adminSuperPage.getByRole("heading", { level: 1, name: "User Management" })).toBeVisible();
  613 |       const applied = await readAppliedTheme(adminSuperPage);
  614 |       expect(applied.appearance).toBe(appearance);
  615 |     }
  616 |   });
  617 | });
  618 | 
  619 | test.describe("Theme across responsive breakpoints: tablet", () => {
  620 |   test.use({ viewport: { width: 768, height: 1024 } });
  621 | 
  622 |   test("admin Users page renders correctly in both themes at tablet width", async ({ adminSuperPage }) => {
  623 |     for (const appearance of APPEARANCES) {
  624 |       await adminSuperPage.goto("/dashboard/admin/settings");
  625 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  626 | 
  627 |       await adminSuperPage.goto("/dashboard/admin/users");
  628 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  629 |       await expect(adminSuperPage.getByRole("heading", { level: 1, name: "User Management" })).toBeVisible();
  630 |       const applied = await readAppliedTheme(adminSuperPage);
  631 |       expect(applied.appearance).toBe(appearance);
  632 |     }
  633 |   });
  634 | });
  635 | 
```