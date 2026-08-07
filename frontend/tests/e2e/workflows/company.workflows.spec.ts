import { test, expect } from "../fixtures/roles.fixture";
import { COMPANY_CEO_BASE } from "../helpers/routes";

test.describe("Company workflow: hiring pipeline stage move", () => {
  test("moving a candidate to a new stage via the per-card selector updates it", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/hiring/pipeline`);
    // Each kanban card renders its own <select aria-label="Move {name} to
    // stage"> (kanban-candidate-card.tsx) -- a reliable non-drag-and-drop way
    // to change stage. Skips gracefully if this dev DB's E2E Test Company
    // currently has no applications in a movable (non-terminal) stage.
    // The pipeline data itself loads via a client-side fetch after
    // navigation, so .count() checked immediately after goto() would race
    // that fetch and always read 0 -- wait for the first card (or a real
    // timeout) before deciding whether to skip.
    const moveSelects = companyOwnerPage.locator('select[aria-label^="Move "]');
    await moveSelects.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const count = await moveSelects.count();

    // The select's option values are the kanban COLUMN keys
    // (HIRING_PIPELINE_STAGES in hiring-utils.ts), and the backend transition
    // graph (applications/services/pipeline.service.js) is strictly one-way:
    // backward moves are rejected (the optimistic UI update reverts), and
    // everything past the Interview column is terminal -- moving there would
    // permanently close the fixture application out for every later run. So
    // pick a card still in a column with a legal, non-terminal forward move,
    // and skip when the shared dev DB currently has none (re-running
    // backend/scripts/seed-e2e-fixtures.js resets the fixture to "applied").
    const FORWARD_TARGET: Record<string, string> = {
      applied: "shortlisted",
      reviewed: "shortlisted",
      shortlisted: "interview"
    };
    let select: ReturnType<typeof moveSelects.nth> | null = null;
    let target: string | null = null;
    for (let i = 0; i < count; i++) {
      const candidate = moveSelects.nth(i);
      const value = await candidate.inputValue();
      if (FORWARD_TARGET[value]) {
        select = candidate;
        target = FORWARD_TARGET[value];
        break;
      }
    }
    test.skip(!select, "No candidate in a forward-movable (non-terminal) stage for E2E Test Company in this dev DB run.");

    await select!.selectOption(target!);
    await expect(select!).toHaveValue(target!);
  });
});

test.describe("Company workflow: candidate search", () => {
  test("a nonsense query returns an empty result set, not a crash", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/search`);
    const searchBox = companyOwnerPage.locator('input[type="search"], input[placeholder*="earch" i]').first();
    await searchBox.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    test.skip((await searchBox.count()) === 0, "Candidate search input not present for this account/module state.");

    await searchBox.fill("zzzznonexistentcandidatequery9999");
    await companyOwnerPage.waitForTimeout(600); // debounce (350ms in company-dashboard-page.tsx) + settle
    await expect(companyOwnerPage.locator("body")).not.toContainText(/something went wrong/i);
  });
});

test.describe("Company workflow: AI Insight modal", () => {
  test("opens with either real analysis or the insufficient-data notice, and closes via the Close button", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/ai`);
    // Matched candidates load via a client-side fetch after navigation, so
    // checking .count() immediately after goto() races that fetch and always
    // reads 0 -- wait for the first button (or a real timeout) first.
    const insightButtons = companyOwnerPage.getByRole("button", { name: "AI Insight" });
    await insightButtons.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    test.skip((await insightButtons.count()) === 0, "No matched candidates available for E2E Test Company in this dev DB run.");

    await insightButtons.first().click();
    const dialog = companyOwnerPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "AI Insight" })).toBeVisible();
    // explainMatch() is synchronous (no fetch) -- it either has enough data to
    // explain the ranking, or it doesn't. Both are valid, non-crash outcomes.
    const hasAnalysis = await dialog.getByText("Why This Candidate Was Ranked").isVisible().catch(() => false);
    const hasEmptyState = await dialog.getByRole("status").filter({ hasText: "Insufficient data for AI analysis." }).isVisible().catch(() => false);
    expect(hasAnalysis || hasEmptyState).toBe(true);

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });

  test("closes on Escape", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/ai`);
    // Matched candidates load via a client-side fetch after navigation, so
    // checking .count() immediately after goto() races that fetch and always
    // reads 0 -- wait for the first button (or a real timeout) first.
    const insightButtons = companyOwnerPage.getByRole("button", { name: "AI Insight" });
    await insightButtons.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    test.skip((await insightButtons.count()) === 0, "No matched candidates available for E2E Test Company in this dev DB run.");

    await insightButtons.first().click();
    const dialog = companyOwnerPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await companyOwnerPage.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("renders correctly in light and dark appearance", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/ai`);
    // Matched candidates load via a client-side fetch after navigation, so
    // checking .count() immediately after goto() races that fetch and always
    // reads 0 -- wait for the first button (or a real timeout) first.
    const insightButtons = companyOwnerPage.getByRole("button", { name: "AI Insight" });
    await insightButtons.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    test.skip((await insightButtons.count()) === 0, "No matched candidates available for E2E Test Company in this dev DB run.");

    await insightButtons.first().click();
    const dialog = companyOwnerPage.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await companyOwnerPage.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(dialog).toBeVisible();
    await expect(companyOwnerPage.locator("body")).not.toContainText(/something went wrong/i);

    await companyOwnerPage.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect(dialog).toBeVisible();
  });
});

test.describe("Company workflow: duplicate heading regression", () => {
  // Both pages used to render their title twice: once as the page intro <h1>
  // (CompanyDashboardPageIntro) and once as a nested section/panel heading
  // with the exact same text (CompanyDashboardSection / SectionPanel).
  test("the AI Matched Candidates page renders its heading exactly once", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/ai`);
    await expect(companyOwnerPage.getByRole("heading", { name: "AI Matched Candidates", exact: true })).toHaveCount(1);
  });

  test("the Calendar page renders its heading exactly once", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/hiring/calendar`);
    await expect(companyOwnerPage.getByRole("heading", { name: "Calendar", exact: true })).toHaveCount(1);
  });
});
