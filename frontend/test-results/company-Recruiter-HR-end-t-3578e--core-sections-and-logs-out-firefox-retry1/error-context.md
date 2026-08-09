# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: company.spec.ts >> Recruiter/HR end-to-end journey >> logs in, lands on dashboard, navigates core sections, and logs out
- Location: tests\e2e\company.spec.ts:15:7

# Error details

```
Error: page.goto: NS_BINDING_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard/companyHR", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=f6e1]:
  - link "Skip to main content" [ref=f6e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=f6e7]:
    - complementary [ref=f6e8]:
      - generic [ref=f6e9]:
        - generic [ref=f6e13]:
          - paragraph [ref=f6e14]: Company Portal
          - heading "InternAI" [level=2] [ref=f6e15]
        - button "Collapse Sidebar" [ref=f6e19] [cursor=pointer]
      - navigation "Primary" [ref=f6e25]:
        - generic [ref=f6e26]:
          - paragraph [ref=f6e27]: Hiring
          - list [ref=f6e28]:
            - listitem [ref=f6e29]:
              - link "Post Internship" [ref=f6e30] [cursor=pointer]:
                - /url: /dashboard/companyCEO/hiring/post
            - listitem [ref=f6e39]:
              - link "Notifications" [ref=f6e40] [cursor=pointer]:
                - /url: /dashboard/companyCEO/notifications
    - generic [ref=f6e47]:
      - banner [ref=f6e48]:
        - generic [ref=f6e49]:
          - generic [ref=f6e51]:
            - paragraph [ref=f6e52]: Company Portal
            - heading "Find and hire the right talent." [level=1] [ref=f6e53]
            - paragraph [ref=f6e54]: Hi, Company
          - generic [ref=f6e55]:
            - button "Notifications" [ref=f6e57] [cursor=pointer]
            - button "Logout" [ref=f6e62] [cursor=pointer]
      - main [ref=f6e68]:
        - generic [ref=f6e70]:
          - complementary [ref=f6e72]:
            - generic [ref=f6e73]:
              - paragraph [ref=f6e75]: Conversations
              - button "New" [ref=f6e76] [cursor=pointer]
            - textbox "Search conversations" [ref=f6e79]:
              - /placeholder: Search conversations…
            - list [ref=f6e80]
          - status [ref=f6e115]:
            - paragraph [ref=f6e120]: Select a conversation
            - paragraph [ref=f6e121]: Choose a thread or start a new chat.
  - alert [ref=f6e122]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // Dedicated E2E fixture account (backend/scripts/seed-e2e-fixtures.js),
  4  | // companyAccountType "hr" — this dev database's real seed data doesn't match
  5  | // the hardcoded seedData.js presets, so tests use their own known-password account.
  6  | const HR_EMAIL = "e2e.company.hr@internai-test.local";
  7  | const HR_PASSWORD = "E2eCompanyHr@123";
  8  | 
  9  | // Company dashboard views live at slash-separated paths (e.g.
  10 | // /dashboard/company/hiring/pipeline), per the VIEW_MAP in
  11 | // app/dashboard/company/[...view]/page.tsx — unlike the admin dashboard,
  12 | // which uses single hyphenated segments. Any key not in that map calls
  13 | // notFound(), so getting this wrong silently 404s.
  14 | test.describe("Recruiter/HR end-to-end journey", () => {
  15 |   test("logs in, lands on dashboard, navigates core sections, and logs out", async ({ page }) => {
  16 |     await page.goto("/auth/company");
  17 |     await page.getByRole("button", { name: "Login", exact: true }).click();
  18 | 
  19 |     await page.getByLabel("Email", { exact: true }).fill(HR_EMAIL);
  20 |     await page.getByLabel("Password", { exact: true }).fill(HR_PASSWORD);
  21 |     await page.locator('button[type="submit"]').click();
  22 | 
  23 |     await page.waitForURL(/\/dashboard\/company/, { timeout: 15000 });
  24 |     await expect(page).toHaveURL(/\/dashboard\/company(HR|CEO)?/);
  25 | 
  26 |     // Candidate search
  27 |     await page.goto("/dashboard/companyHR/matching/search");
  28 |     await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  29 | 
  30 |     // Applications / hiring pipeline
  31 |     await page.goto("/dashboard/companyHR/hiring/pipeline");
  32 |     await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  33 | 
  34 |     // Interview scheduling
  35 |     await page.goto("/dashboard/companyHR/hiring/interviews");
  36 |     await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  37 | 
  38 |     // Reports
  39 |     await page.goto("/dashboard/companyHR/reports/feedback");
  40 |     await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  41 | 
  42 |     // Chat
  43 |     await page.goto("/dashboard/company/chat");
  44 |     await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  45 | 
  46 |     // Logout
> 47 |     await page.goto("/dashboard/companyHR");
     |                ^ Error: page.goto: NS_BINDING_ABORTED; maybe frame was detached?
  48 |     await page.getByRole("button", { name: /logout/i }).click();
  49 |     await page.waitForURL(/\/auth\/company/, { timeout: 10000 });
  50 |     await expect(page).toHaveURL(/\/auth\/company/);
  51 |   });
  52 | 
  53 |   test("rejects an incorrect password with an inline error", async ({ page }) => {
  54 |     await page.goto("/auth/company");
  55 |     await page.getByRole("button", { name: "Login", exact: true }).click();
  56 |     await page.getByLabel("Email", { exact: true }).fill(HR_EMAIL);
  57 |     await page.getByLabel("Password", { exact: true }).fill("WrongPassword!123");
  58 |     await page.locator('button[type="submit"]').click();
  59 | 
  60 |     await expect(page).toHaveURL(/\/auth\/company/);
  61 |     await expect(page.locator("body")).toContainText(/invalid credentials/i);
  62 |   });
  63 | 
  64 |   test("an HR account can navigate to the Team Management view without crashing (executive-only actions are gated inline)", async ({ page }) => {
  65 |     await page.goto("/auth/company");
  66 |     await page.getByRole("button", { name: "Login", exact: true }).click();
  67 |     await page.getByLabel("Email", { exact: true }).fill(HR_EMAIL);
  68 |     await page.getByLabel("Password", { exact: true }).fill(HR_PASSWORD);
  69 |     await page.locator('button[type="submit"]').click();
  70 |     await page.waitForURL(/\/dashboard\/company/, { timeout: 15000 });
  71 | 
  72 |     await page.goto("/dashboard/companyHR/team/recruiters");
  73 |     await expect(page.locator("body")).not.toContainText(/something went wrong|^404/i);
  74 |   });
  75 | });
  76 | 
```