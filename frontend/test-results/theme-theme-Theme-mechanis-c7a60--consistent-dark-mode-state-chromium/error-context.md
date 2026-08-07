# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Theme mechanism: invalid stored values are handled gracefully >> a corrupted appearance value in localStorage still resolves to a consistent dark-mode state
- Location: tests\e2e\theme\theme.spec.ts:201:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "dark"
Received: "not-a-real-mode"
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - link "Skip to main content" [ref=f1e2] [cursor=pointer]:
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
              - link "Dashboard Overview" [ref=f1e27] [cursor=pointer]:
                - /url: /dashboard/intern
            - listitem [ref=f1e36]:
              - link "Placement Hub" [ref=f1e37] [cursor=pointer]:
                - /url: /dashboard/intern/placement-hub
        - generic [ref=f1e46]:
          - button "My Profile" [expanded] [ref=f1e47] [cursor=pointer]
          - list [ref=f1e59]:
            - listitem [ref=f1e60]:
              - link "Profile" [ref=f1e61] [cursor=pointer]:
                - /url: /dashboard/intern/profile
            - listitem [ref=f1e69]:
              - link "Edit Profile" [ref=f1e70] [cursor=pointer]:
                - /url: /dashboard/intern/profile/edit
            - listitem [ref=f1e78]:
              - link "Resume" [ref=f1e79] [cursor=pointer]:
                - /url: /dashboard/intern/resume
            - listitem [ref=f1e86]:
              - link "Resume Score" [ref=f1e87] [cursor=pointer]:
                - /url: /dashboard/intern/resume/score
            - listitem [ref=f1e94]:
              - link "3D Portfolio" [ref=f1e95] [cursor=pointer]:
                - /url: /dashboard/intern/portfolio
            - listitem [ref=f1e102]:
              - link "Skill Gap Analysis" [ref=f1e103] [cursor=pointer]:
                - /url: /dashboard/intern/skill-gap
        - generic [ref=f1e109]:
          - paragraph [ref=f1e110]: Internships
          - list [ref=f1e111]:
            - listitem [ref=f1e112]:
              - link "Recommended Internships" [ref=f1e113] [cursor=pointer]:
                - /url: /dashboard/intern/internships/recommended
            - listitem [ref=f1e120]:
              - link "Search Internships" [ref=f1e121] [cursor=pointer]:
                - /url: /dashboard/intern/internships/search
            - listitem [ref=f1e128]:
              - link "Saved Internships" [ref=f1e129] [cursor=pointer]:
                - /url: /dashboard/intern/internships/saved
            - listitem [ref=f1e135]:
              - link "My Applications" [ref=f1e136] [cursor=pointer]:
                - /url: /dashboard/intern/applications
            - listitem [ref=f1e143]:
              - link "Scheduled Interviews" [ref=f1e144] [cursor=pointer]:
                - /url: /dashboard/intern/interviews
            - listitem [ref=f1e150]:
              - link "Analytics Center" [ref=f1e151] [cursor=pointer]:
                - /url: /dashboard/intern/track-progress
        - generic [ref=f1e158]:
          - paragraph [ref=f1e159]: My Calendar
          - list [ref=f1e160]:
            - listitem [ref=f1e161]:
              - link "Personal Calendar" [ref=f1e162] [cursor=pointer]:
                - /url: /dashboard/intern/calendar
        - generic [ref=f1e168]:
          - paragraph [ref=f1e169]: Learning
          - list [ref=f1e170]:
            - listitem [ref=f1e171]:
              - link "Courses" [ref=f1e172] [cursor=pointer]:
                - /url: /dashboard/intern/learning/courses
            - listitem [ref=f1e178]:
              - link "Certifications" [ref=f1e179] [cursor=pointer]:
                - /url: /dashboard/intern/learning/certifications
            - listitem [ref=f1e186]:
              - link "Mock Aptitude Test" [ref=f1e187] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-aptitude
            - listitem [ref=f1e194]:
              - link "Mock Technical Test" [ref=f1e195] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-technical
            - listitem [ref=f1e202]:
              - link "Mock Interview" [ref=f1e203] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-interview
        - generic [ref=f1e209]:
          - paragraph [ref=f1e210]: Feedback & Support
          - list [ref=f1e211]:
            - listitem [ref=f1e212]:
              - link "Notifications" [ref=f1e213] [cursor=pointer]:
                - /url: /dashboard/intern/notifications
            - listitem [ref=f1e220]:
              - link "Messages" [ref=f1e221] [cursor=pointer]:
                - /url: /dashboard/intern/chat
            - listitem [ref=f1e227]:
              - link "HR Feedback" [ref=f1e228] [cursor=pointer]:
                - /url: /dashboard/intern/feedback/hr
            - listitem [ref=f1e234]:
              - link "Suggestions" [ref=f1e235] [cursor=pointer]:
                - /url: /dashboard/intern/feedback/suggestions
            - listitem [ref=f1e241]:
              - link "Help / Support" [ref=f1e242] [cursor=pointer]:
                - /url: /dashboard/intern/support
    - generic [ref=f1e249]:
      - banner [ref=f1e250]:
        - generic [ref=f1e251]:
          - generic [ref=f1e253]:
            - paragraph [ref=f1e254]: Intern Portal
            - heading "Welcome back. Let's accelerate your career." [level=1] [ref=f1e255]
            - paragraph [ref=f1e256]: Hi, E2E Test Intern
          - generic [ref=f1e257]:
            - button "8 unread notifications" [ref=f1e259] [cursor=pointer]:
              - generic [ref=f1e264]: "8"
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
                  - link "LinkedIn (opens in new tab)" [ref=f1e332] [cursor=pointer]:
                    - /url: https://linkedin.com/in/john-carter-dev
                    - generic [ref=f1e333]: LinkedIn
                    - generic [ref=f1e334]: (opens in new tab)
                  - link "GitHub (opens in new tab)" [ref=f1e340] [cursor=pointer]:
                    - /url: https://github.com/john-carter-dev
                    - generic [ref=f1e341]: GitHub
                    - generic [ref=f1e342]: (opens in new tab)
                  - link "https://linkedin.com/in/john-carter-dev (opens in new tab)" [ref=f1e348] [cursor=pointer]:
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
  116 |   }) => {
  117 |     // This is the code path theme-provider.tsx's mount effect exists for: a
  118 |     // logged-in user opening the app on a device/browser with no local theme
  119 |     // cache yet (equivalent to a fresh logout/login or a new device) should
  120 |     // get their theme back from the DB via GET /auth/me, not the hardcoded
  121 |     // default.
  122 |     await internPage.goto("/dashboard/intern/profile");
  123 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  124 | 
  125 |     const [themeRes] = await Promise.all([
  126 |       internPage.waitForResponse((r) => r.url().includes("/api/auth/theme") && r.request().method() === "PATCH"),
  127 |       internPage.getByRole("button", { name: "Midnight Black", exact: true }).click()
  128 |     ]);
  129 |     expect(themeRes.ok()).toBeTruthy();
  130 |     const [appearanceRes] = await Promise.all([
  131 |       internPage.waitForResponse((r) => r.url().includes("/api/auth/theme") && r.request().method() === "PATCH"),
  132 |       internPage.getByRole("button", { name: "Light", exact: true }).click()
  133 |     ]);
  134 |     expect(appearanceRes.ok()).toBeTruthy();
  135 | 
  136 |     // Simulate a fresh device/session: same account, still authenticated (the
  137 |     // auth token is untouched), but no local theme cache.
  138 |     await internPage.evaluate(() => {
  139 |       window.localStorage.removeItem("internai.theme");
  140 |       window.localStorage.removeItem("internai.appearance");
  141 |     });
  142 |     await internPage.reload();
  143 | 
  144 |     await expect.poll(async () => (await readAppliedTheme(internPage)).theme).toBe("midnight");
  145 |     const applied = await readAppliedTheme(internPage);
  146 |     expect(applied.appearance).toBe("light");
  147 |     expect(applied.storedTheme).toBe("midnight");
  148 |     expect(applied.storedAppearance).toBe("light");
  149 |   });
  150 | });
  151 | 
  152 | test.describe("Theme persistence: shared across browser tabs", () => {
  153 |   test("a theme set in one tab is already applied when a second tab in the same session loads", async ({ internPage }) => {
  154 |     await internPage.goto("/dashboard/intern/profile");
  155 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  156 |     await internPage.getByRole("button", { name: "Sunset Orange", exact: true }).click();
  157 |     await internPage.getByRole("button", { name: "Light", exact: true }).click();
  158 |     await expect.poll(async () => (await readAppliedTheme(internPage)).storedTheme).toBe("sunset");
  159 | 
  160 |     const secondTab = await internPage.context().newPage();
  161 |     await secondTab.goto("/dashboard/intern");
  162 |     const secondApplied = await readAppliedTheme(secondTab);
  163 |     expect(secondApplied.theme).toBe("sunset");
  164 |     expect(secondApplied.appearance).toBe("light");
  165 |     await secondTab.close();
  166 |   });
  167 | });
  168 | 
  169 | test.describe("Theme mechanism: invalid stored values are handled gracefully", () => {
  170 |   // Earlier persistence tests in this file PATCH the intern fixture user's
  171 |   // SERVER-side theme (e.g. midnight/light, sunset/light). On the reload
  172 |   // below, theme-provider's mount effect restores that server value, which
  173 |   // would beat the hardcoded default these tests assert -- so pin the
  174 |   // server-side preference to the defaults first, making "fell back to the
  175 |   // default" and "recovered the server value" agree deterministically.
  176 |   async function pinServerThemeToDefaults(page: import("@playwright/test").Page) {
  177 |     const token = await page.evaluate(() => window.localStorage.getItem("internai.auth.token"));
  178 |     const res = await page.request.patch(`${BACKEND_URL}/api/auth/theme`, {
  179 |       headers: { Authorization: `Bearer ${token}` },
  180 |       data: { theme: "ocean", appearance: "dark" }
  181 |     });
  182 |     expect(res.ok()).toBeTruthy();
  183 |   }
  184 | 
  185 |   test("a corrupted theme id in localStorage falls back to the default palette, not a crash", async ({ internPage }) => {
  186 |     await internPage.goto("/dashboard/intern/profile");
  187 |     await pinServerThemeToDefaults(internPage);
  188 |     await internPage.evaluate(() => {
  189 |       window.localStorage.setItem("internai.theme", "totally-not-a-real-theme-id");
  190 |       window.localStorage.setItem("internai.appearance", "dark");
  191 |     });
  192 |     await internPage.reload();
  193 |     await expect(internPage.locator("body")).not.toContainText(/something went wrong/i);
  194 | 
  195 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  196 |     // React's in-memory state falls back to the default palette even though a
  197 |     // pre-hydration init script already wrote the raw (invalid) value to <html>.
  198 |     await expect(internPage.getByRole("button", { name: "Ocean Blue", exact: true })).toHaveAttribute("aria-pressed", "true");
  199 |   });
  200 | 
  201 |   test("a corrupted appearance value in localStorage still resolves to a consistent dark-mode state", async ({ internPage }) => {
  202 |     await internPage.goto("/dashboard/intern/profile");
  203 |     await pinServerThemeToDefaults(internPage);
  204 |     await internPage.evaluate(() => {
  205 |       window.localStorage.setItem("internai.theme", "ocean");
  206 |       window.localStorage.setItem("internai.appearance", "not-a-real-mode");
  207 |     });
  208 |     await internPage.reload();
  209 |     await expect(internPage.locator("body")).not.toContainText(/something went wrong/i);
  210 | 
  211 |     const applied = await readAppliedTheme(internPage);
  212 |     // DEFAULT_APPEARANCE is "dark" -- this must be reflected in the actual
  213 |     // <html> "dark" class, not just in React's in-memory state, since several
  214 |     // components style off Tailwind's `dark:` variant rather than the
  215 |     // CSS-variable tokens.
> 216 |     expect(applied.appearance).toBe("dark");
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  217 |     expect(applied.isDarkClass).toBe(true);
  218 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  219 |     await expect(internPage.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  220 |   });
  221 | });
  222 | 
  223 | test.describe("Theme mechanism: propagates into dialogs", () => {
  224 |   test("a confirm dialog's background token changes with the active theme", async ({ adminSuperPage }) => {
  225 |     async function openDeleteDialogAndReadBg() {
  226 |       await adminSuperPage.goto("/dashboard/admin/users");
  227 |       const deleteButton = adminSuperPage.getByRole("button", { name: "Soft Delete", exact: true }).first();
  228 |       await expect(deleteButton).toBeVisible({ timeout: 15000 });
  229 |       await deleteButton.click();
  230 |       const dialog = adminSuperPage.getByRole("dialog");
  231 |       await expect(dialog).toBeVisible();
  232 |       const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  233 |       // Escape cancels -- no user is actually soft-deleted.
  234 |       await adminSuperPage.keyboard.press("Escape");
  235 |       await expect(dialog).toBeHidden();
  236 |       return bg;
  237 |     }
  238 | 
  239 |     await adminSuperPage.goto("/dashboard/admin/settings");
  240 |     await adminSuperPage.getByRole("button", { name: "Ocean Blue", exact: true }).click();
  241 |     await adminSuperPage.getByRole("button", { name: "Dark", exact: true }).click();
  242 |     const oceanDarkBg = await openDeleteDialogAndReadBg();
  243 | 
  244 |     await adminSuperPage.goto("/dashboard/admin/settings");
  245 |     await adminSuperPage.getByRole("button", { name: "Midnight Black", exact: true }).click();
  246 |     const midnightDarkBg = await openDeleteDialogAndReadBg();
  247 | 
  248 |     expect(midnightDarkBg).not.toBe(oceanDarkBg);
  249 |   });
  250 | });
  251 | 
  252 | test.describe("Theme mechanism: keyboard operability", () => {
  253 |   test("palette and appearance controls are operable via keyboard alone", async ({ internPage }) => {
  254 |     await internPage.goto("/dashboard/intern/profile");
  255 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  256 | 
  257 |     const royalButton = internPage.getByRole("button", { name: "Royal Purple", exact: true });
  258 |     await royalButton.focus();
  259 |     await internPage.keyboard.press("Enter");
  260 |     await expect(royalButton).toHaveAttribute("aria-pressed", "true");
  261 | 
  262 |     const lightButton = internPage.getByRole("button", { name: "Light", exact: true });
  263 |     await lightButton.focus();
  264 |     await internPage.keyboard.press("Space");
  265 |     await expect(lightButton).toHaveAttribute("aria-pressed", "true");
  266 | 
  267 |     const applied = await readAppliedTheme(internPage);
  268 |     expect(applied.theme).toBe("royal");
  269 |     expect(applied.appearance).toBe("light");
  270 |   });
  271 | });
  272 | 
  273 | test.describe("Theme API validation (server-side)", () => {
  274 |   async function getInternToken(page: import("@playwright/test").Page) {
  275 |     // loginAsRoleViaApi only registers an addInitScript -- it never
  276 |     // navigates. A brand-new page fixture is still on about:blank at this
  277 |     // point, which has an opaque origin and throws a SecurityError on any
  278 |     // localStorage access, so navigate to the app first.
  279 |     if (!page.url().startsWith("http")) {
  280 |       await page.goto("/dashboard/intern");
  281 |     }
  282 |     return page.evaluate(() => window.localStorage.getItem("internai.auth.token"));
  283 |   }
  284 | 
  285 |   test("rejects an unknown theme id with 400", async ({ request, internPage }) => {
  286 |     const token = await getInternToken(internPage);
  287 |     const res = await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  288 |       headers: { Authorization: `Bearer ${token}` },
  289 |       data: { theme: "not-a-real-theme" }
  290 |     });
  291 |     expect(res.status()).toBe(400);
  292 |     const body = await res.json();
  293 |     expect(body.message).toMatch(/invalid theme id/i);
  294 |   });
  295 | 
  296 |   test("rejects an invalid appearance mode with 400", async ({ request, internPage }) => {
  297 |     const token = await getInternToken(internPage);
  298 |     const res = await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  299 |       headers: { Authorization: `Bearer ${token}` },
  300 |       data: { appearance: "twilight" }
  301 |     });
  302 |     expect(res.status()).toBe(400);
  303 |     const body = await res.json();
  304 |     expect(body.message).toMatch(/invalid appearance mode/i);
  305 |   });
  306 | 
  307 |   // Validation checklist folded in here -- theme/appearance are the only two
  308 |   // real input fields this module has (everything else is a static display or
  309 |   // a discrete button choice). There's no free-text field to sanitize: the
  310 |   // fixed server-side whitelist (VALID_THEME_IDS) is itself the injection
  311 |   // defense, so every one of these payloads must be rejected outright, not
  312 |   // stored or reflected anywhere.
  313 |   const MALFORMED_THEME_PAYLOADS: Array<[string, string]> = [
  314 |     ["script tag", "<script>alert(1)</script>"],
  315 |     ["NoSQL operator injection", '{"$ne": null}'],
  316 |     ["SQL-style injection", "'; DROP TABLE users; --"],
```