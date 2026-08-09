# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Theme initialization: no console errors or hydration warnings >> switching theme and appearance repeatedly produces no console errors
- Location: tests\e2e\theme\theme.spec.ts:582:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 47

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
+                               <Script id=\"theme-init\" strategy=\"beforeInte...\" nonce=\"ZTNmMWU5YW...\">
+                                 <script
+ +                                 nonce=\"ZTNmMWU5YWItM2E0NC00N2NhLTljZDktYjZhMjU5MDI4Njgz\"
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
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2]:
    - /url: "#main-content"
  - generic [ref=e7]:
    - complementary [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e13]:
          - paragraph [ref=e14]: Intern Portal
          - heading "InternAI" [level=2] [ref=e15]
        - button "Collapse Sidebar" [ref=e19] [cursor=pointer]
      - navigation "Primary" [ref=e22]:
        - generic [ref=e23]:
          - paragraph [ref=e24]: Main
          - list [ref=e25]:
            - listitem [ref=e26]:
              - link "Dashboard Overview" [ref=e27]:
                - /url: /dashboard/intern
            - listitem [ref=e36]:
              - link "Placement Hub" [ref=e37]:
                - /url: /dashboard/intern/placement-hub
        - generic [ref=e46]:
          - button "My Profile" [expanded] [ref=e47] [cursor=pointer]
          - list [ref=e59]:
            - listitem [ref=e60]:
              - link "Profile" [ref=e61]:
                - /url: /dashboard/intern/profile
            - listitem [ref=e69]:
              - link "Edit Profile" [ref=e70]:
                - /url: /dashboard/intern/profile/edit
            - listitem [ref=e78]:
              - link "Resume" [ref=e79]:
                - /url: /dashboard/intern/resume
            - listitem [ref=e86]:
              - link "Resume Score" [ref=e87]:
                - /url: /dashboard/intern/resume/score
            - listitem [ref=e94]:
              - link "3D Portfolio" [ref=e95]:
                - /url: /dashboard/intern/portfolio
            - listitem [ref=e102]:
              - link "Skill Gap Analysis" [ref=e103]:
                - /url: /dashboard/intern/skill-gap
        - generic [ref=e109]:
          - paragraph [ref=e110]: Internships
          - list [ref=e111]:
            - listitem [ref=e112]:
              - link "Recommended Internships" [ref=e113]:
                - /url: /dashboard/intern/internships/recommended
            - listitem [ref=e120]:
              - link "Search Internships" [ref=e121]:
                - /url: /dashboard/intern/internships/search
            - listitem [ref=e128]:
              - link "Saved Internships" [ref=e129]:
                - /url: /dashboard/intern/internships/saved
            - listitem [ref=e135]:
              - link "My Applications" [ref=e136]:
                - /url: /dashboard/intern/applications
            - listitem [ref=e143]:
              - link "Scheduled Interviews" [ref=e144]:
                - /url: /dashboard/intern/interviews
            - listitem [ref=e150]:
              - link "Analytics Center" [ref=e151]:
                - /url: /dashboard/intern/track-progress
        - generic [ref=e158]:
          - paragraph [ref=e159]: My Calendar
          - list [ref=e160]:
            - listitem [ref=e161]:
              - link "Personal Calendar" [ref=e162]:
                - /url: /dashboard/intern/calendar
        - generic [ref=e168]:
          - paragraph [ref=e169]: Learning
          - list [ref=e170]:
            - listitem [ref=e171]:
              - link "Courses" [ref=e172]:
                - /url: /dashboard/intern/learning/courses
            - listitem [ref=e178]:
              - link "Certifications" [ref=e179]:
                - /url: /dashboard/intern/learning/certifications
            - listitem [ref=e186]:
              - link "Mock Aptitude Test" [ref=e187]:
                - /url: /dashboard/intern/learning/mock-aptitude
            - listitem [ref=e194]:
              - link "Mock Technical Test" [ref=e195]:
                - /url: /dashboard/intern/learning/mock-technical
            - listitem [ref=e202]:
              - link "Mock Interview" [ref=e203]:
                - /url: /dashboard/intern/learning/mock-interview
        - generic [ref=e209]:
          - paragraph [ref=e210]: Feedback & Support
          - list [ref=e211]:
            - listitem [ref=e212]:
              - link "Notifications" [ref=e213]:
                - /url: /dashboard/intern/notifications
            - listitem [ref=e220]:
              - link "Messages" [ref=e221]:
                - /url: /dashboard/intern/chat
            - listitem [ref=e227]:
              - link "HR Feedback" [ref=e228]:
                - /url: /dashboard/intern/feedback/hr
            - listitem [ref=e234]:
              - link "Suggestions" [ref=e235]:
                - /url: /dashboard/intern/feedback/suggestions
            - listitem [ref=e241]:
              - link "Help / Support" [ref=e242]:
                - /url: /dashboard/intern/support
    - generic [ref=e249]:
      - banner [ref=e250]:
        - generic [ref=e251]:
          - generic [ref=e253]:
            - paragraph [ref=e254]: Intern Portal
            - heading "Welcome back. Let's accelerate your career." [level=1] [ref=e255]
            - paragraph [ref=e256]: Hi, E2E Test Intern
          - generic [ref=e257]:
            - button "4 unread notifications" [ref=e259] [cursor=pointer]:
              - generic [ref=e264]: "4"
            - button "Logout" [ref=e265] [cursor=pointer]
      - main [active] [ref=e270]:
        - generic [ref=e271]:
          - generic [ref=e273]:
            - button "Overview" [ref=e274] [cursor=pointer]
            - button "Skills" [ref=e279] [cursor=pointer]
            - button "Education" [ref=e283] [cursor=pointer]
            - button "Projects" [ref=e288] [cursor=pointer]
            - button "Achievements" [ref=e292] [cursor=pointer]
            - button "Learning" [ref=e297] [cursor=pointer]
            - button "Theme" [ref=e301] [cursor=pointer]
          - generic [ref=e309]:
            - generic [ref=e310]:
              - generic [ref=e311]:
                - heading "Theme" [level=2] [ref=e312]
                - paragraph [ref=e313]: Pick a color theme and an appearance mode. Changes apply instantly across the whole platform.
              - generic [ref=e314]:
                - button [ref=e315] [cursor=pointer]
                - button [pressed] [ref=e324] [cursor=pointer]
            - generic [ref=e330]:
              - button "Ocean Blue" [pressed] [ref=e331] [cursor=pointer]:
                - generic [ref=e332]: Button
                - generic [ref=e356]:
                  - generic [ref=e357]: 🌊
                  - generic [ref=e358]: Ocean Blue
              - button "Olive Green" [ref=e359] [cursor=pointer]:
                - generic [ref=e360]: Button
                - generic [ref=e380]:
                  - generic [ref=e381]: 🌿
                  - generic [ref=e382]: Olive Green
              - button "Crimson Red" [ref=e383] [cursor=pointer]:
                - generic [ref=e384]: Button
                - generic [ref=e404]:
                  - generic [ref=e405]: ❤️
                  - generic [ref=e406]: Crimson Red
              - button "Golden Yellow" [ref=e407] [cursor=pointer]:
                - generic [ref=e408]: Button
                - generic [ref=e428]:
                  - generic [ref=e429]: ☀️
                  - generic [ref=e430]: Golden Yellow
              - button "Sunset Orange" [ref=e431] [cursor=pointer]:
                - generic [ref=e432]: Button
                - generic [ref=e452]:
                  - generic [ref=e453]: 🍊
                  - generic [ref=e454]: Sunset Orange
              - button "Royal Purple" [ref=e455] [cursor=pointer]:
                - generic [ref=e456]: Button
                - generic [ref=e476]:
                  - generic [ref=e477]: 💜
                  - generic [ref=e478]: Royal Purple
              - button "Rose Pink" [ref=e479] [cursor=pointer]:
                - generic [ref=e480]: Button
                - generic [ref=e500]:
                  - generic [ref=e501]: 🌸
                  - generic [ref=e502]: Rose Pink
              - button "Modern White" [ref=e503] [cursor=pointer]:
                - generic [ref=e504]: Button
                - generic [ref=e524]:
                  - generic [ref=e525]: 🤍
                  - generic [ref=e526]: Modern White
              - button "Midnight Black" [ref=e527] [cursor=pointer]:
                - generic [ref=e528]: Button
                - generic [ref=e548]:
                  - generic [ref=e549]: ⚫
                  - generic [ref=e550]: Midnight Black
              - button "Earth Brown" [ref=e551] [cursor=pointer]:
                - generic [ref=e552]: Button
                - generic [ref=e572]:
                  - generic [ref=e573]: 🤎
                  - generic [ref=e574]: Earth Brown
  - generic [ref=e580] [cursor=pointer]:
    - button "Open issues overlay" [ref=e581]:
      - generic [ref=e585]:
        - generic [ref=e586]: "0"
        - generic [ref=e587]: "1"
      - generic [ref=e588]: Issue
    - button "Collapse issues badge" [ref=e589]
  - alert [ref=e592]
```

# Test source

```ts
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
  579 |     expect(errors).toEqual([]);
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
> 598 |     expect(errors).toEqual([]);
      |                    ^ Error: expect(received).toEqual(expected) // deep equality
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