# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive\responsive.spec.ts >> Laptop/Desktop (1366x768, 1920x1080): collapsible rail >> 1366x768 >> company and admin dashboards render without horizontal overflow
- Location: tests\e2e\responsive\responsive.spec.ts:55:11

# Error details

```
Error: page.goto: NS_BINDING_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard/admin/users", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e11] [cursor=pointer]:
    - button "Open issues overlay" [ref=e12]:
      - generic [ref=e16]:
        - generic [ref=e17]: "4"
        - generic [ref=e18]: "5"
      - generic [ref=e19]:
        - text: Issue
        - generic [ref=e20]: s
    - button "Collapse issues badge" [ref=e21]
  - alert [ref=e24]
```

# Test source

```ts
  1  | import { test, expect } from "../fixtures/roles.fixture";
  2  | 
  3  | // Sidebar layout (drawer vs collapsible rail) is one shared mechanism across
  4  | // every dashboard shell (InternShell/CompanyShell/AdminShell all wire the
  5  | // same useSidebarCollapsed/useIsDesktopViewport hooks) -- covering it here
  6  | // on representative pages, not the full ~60-route matrix per breakpoint,
  7  | // mirrors the theme spec's sampling reasoning.
  8  | 
  9  | test.describe("Mobile (375x812): off-canvas drawer", () => {
  10 |   test.use({ viewport: { width: 375, height: 812 } });
  11 | 
  12 |   test("sidebar is hidden by default and opens via the header menu button with full labels", async ({ internPage }) => {
  13 |     await internPage.goto("/dashboard/intern");
  14 |     // Desktop-only collapse toggle must not render on mobile.
  15 |     await expect(internPage.getByRole("button", { name: /collapse sidebar|expand sidebar/i })).toBeHidden();
  16 | 
  17 |     await internPage.getByRole("button", { name: /open menu/i }).click();
  18 |     await expect(internPage.getByRole("link", { name: /dashboard overview/i })).toBeVisible();
  19 |   });
  20 | });
  21 | 
  22 | test.describe("Tablet (768x1024)", () => {
  23 |   test.use({ viewport: { width: 768, height: 1024 } });
  24 | 
  25 |   test("intern dashboard renders without layout overflow", async ({ internPage }) => {
  26 |     await internPage.goto("/dashboard/intern/applications");
  27 |     await expect(internPage.locator("body")).not.toContainText(/something went wrong/i);
  28 |     const scrollWidth = await internPage.evaluate(() => document.documentElement.scrollWidth);
  29 |     const clientWidth = await internPage.evaluate(() => document.documentElement.clientWidth);
  30 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  31 |   });
  32 | });
  33 | 
  34 | test.describe("Laptop/Desktop (1366x768, 1920x1080): collapsible rail", () => {
  35 |   for (const size of [
  36 |     { width: 1366, height: 768 },
  37 |     { width: 1920, height: 1080 }
  38 |   ]) {
  39 |     test.describe(`${size.width}x${size.height}`, () => {
  40 |       test.use({ viewport: size });
  41 | 
  42 |       test("collapse toggle shrinks the sidebar to an icon rail and back", async ({ internPage }) => {
  43 |         await internPage.goto("/dashboard/intern");
  44 |         const toggle = internPage.getByRole("button", { name: /collapse sidebar/i });
  45 |         await expect(toggle).toBeVisible();
  46 |         await toggle.click();
  47 |         await expect(internPage.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
  48 |         // Active nav item stays reachable/highlighted in the collapsed rail.
  49 |         await expect(internPage.getByRole("link", { name: /dashboard overview/i })).toBeVisible();
  50 |         // Revert -- leave the shared localStorage preference as found.
  51 |         await internPage.getByRole("button", { name: /expand sidebar/i }).click();
  52 |         await expect(internPage.getByRole("button", { name: /collapse sidebar/i })).toBeVisible();
  53 |       });
  54 | 
  55 |       test("company and admin dashboards render without horizontal overflow", async ({ companyOwnerPage, adminSuperPage }) => {
  56 |         for (const [page, path] of [
  57 |           [companyOwnerPage, "/dashboard/companyCEO/hiring/pipeline"],
  58 |           [adminSuperPage, "/dashboard/admin/users"]
  59 |         ] as const) {
> 60 |           await page.goto(path);
     |                      ^ Error: page.goto: NS_BINDING_ABORTED; maybe frame was detached?
  61 |           await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  62 |           const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  63 |           const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  64 |           expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  65 |         }
  66 |       });
  67 | 
  68 |       // Admin's sidebar has its own grouped-heading content (Main/Management/
  69 |       // Moderation/Secondary) that intern's doesn't -- the collapse mechanism
  70 |       // itself is shared and already covered above via internPage, but that
  71 |       // extra grouping is admin-specific and worth its own confirmation.
  72 |       test("admin sidebar collapse toggle shrinks to an icon rail and back", async ({ adminSuperPage }) => {
  73 |         await adminSuperPage.goto("/dashboard/admin");
  74 |         const toggle = adminSuperPage.getByRole("button", { name: /collapse sidebar/i });
  75 |         await expect(toggle).toBeVisible();
  76 |         await toggle.click();
  77 |         await expect(adminSuperPage.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
  78 |         await expect(adminSuperPage.getByRole("link", { name: /dashboard overview/i })).toBeVisible();
  79 |         // Revert -- leave the shared localStorage preference as found.
  80 |         await adminSuperPage.getByRole("button", { name: /expand sidebar/i }).click();
  81 |         await expect(adminSuperPage.getByRole("button", { name: /collapse sidebar/i })).toBeVisible();
  82 |       });
  83 |     });
  84 |   }
  85 | });
  86 | 
  87 | test.describe("Mobile (375x812): admin off-canvas drawer", () => {
  88 |   test.use({ viewport: { width: 375, height: 812 } });
  89 | 
  90 |   test("admin sidebar is hidden by default and opens via the header menu button", async ({ adminSuperPage }) => {
  91 |     await adminSuperPage.goto("/dashboard/admin");
  92 |     await expect(adminSuperPage.getByRole("button", { name: /collapse sidebar|expand sidebar/i })).toBeHidden();
  93 |     await adminSuperPage.getByRole("button", { name: /open menu/i }).click();
  94 |     await expect(adminSuperPage.getByRole("link", { name: /dashboard overview/i })).toBeVisible();
  95 |   });
  96 | });
  97 | 
```