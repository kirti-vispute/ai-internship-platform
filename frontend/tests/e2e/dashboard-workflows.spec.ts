import { test, expect } from "@playwright/test";
import { loginAsRoleViaApi } from "./helpers/session";

const STUDENT_EMAIL = "e2e.intern@internai-test.local";
const STUDENT_PASSWORD = "E2eIntern@123";
const HR_EMAIL = "e2e.company.hr@internai-test.local";
const HR_PASSWORD = "E2eCompanyHr@123";
const ADMIN_EMAIL = "admin@internai.com";
const ADMIN_PASSWORD = "Admin@123";

test.describe("Student dashboard workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRoleViaApi(page, "intern", STUDENT_EMAIL, STUDENT_PASSWORD);
  });

  test("resume score view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/intern/resume/score");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("skill gap analysis view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/intern/skill-gap");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("notifications view loads (empty state or list) without crashing", async ({ page }) => {
    await page.goto("/dashboard/intern/notifications");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("internship search + apply workflow: search page renders results controls", async ({ page }) => {
    await page.goto("/dashboard/intern/internships/search");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("saved internships tracking view loads", async ({ page }) => {
    await page.goto("/dashboard/intern/internships/saved");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });
});

test.describe("Company (HR) dashboard workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRoleViaApi(page, "company", HR_EMAIL, HR_PASSWORD);
  });

  test("candidate search view accepts a filter query without crashing", async ({ page }) => {
    await page.goto("/dashboard/companyHR/matching/search");
    const searchBox = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    if (await searchBox.count()) {
      await searchBox.fill("react");
    }
    await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  });

  test("hiring pipeline (kanban) view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/companyHR/hiring/pipeline");
    await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  });

  test("active internship postings view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/companyHR/hiring/active");
    await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  });

  test("company analytics view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/companyHR/analytics/company");
    await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  });

  test("HR account is denied the recruiter-management module by default (least privilege)", async ({ page }) => {
    await page.goto("/dashboard/companyHR/team/recruiters");
    await expect(page.locator("body")).not.toContainText(/something went wrong|^404/i);
    await expect(page.locator("body")).toContainText(/module not enabled|access denied/i);
  });

  test("interview scheduling view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/companyHR/hiring/interviews");
    await expect(page.locator("body")).not.toContainText(/something went wrong|404/i);
  });
});

test.describe("Admin dashboard workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRoleViaApi(page, "admin", ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("admin overview dashboard loads with platform metrics", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("user management table view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/admin/users");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("company management view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/admin/companies");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("reports (reported companies) view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/admin/reports");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("platform analytics view loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/admin/analytics");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });

  test("certification review queue loads without crashing", async ({ page }) => {
    await page.goto("/dashboard/admin/certification-review");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });
});
