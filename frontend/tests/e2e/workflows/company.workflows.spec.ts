import { test, expect } from "../fixtures/roles.fixture";
import { COMPANY_CEO_BASE } from "../helpers/routes";

test.describe("Company workflow: hiring pipeline stage move", () => {
  test("moving a candidate to a new stage via the per-card selector updates it", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/hiring/pipeline`);
    // Each kanban card renders its own <select aria-label="Move {name} to
    // stage"> (kanban-candidate-card.tsx) -- a reliable non-drag-and-drop way
    // to change stage. Skips gracefully if this dev DB's E2E Test Company
    // currently has no applications in a movable (non-terminal) stage.
    const moveSelects = companyOwnerPage.locator('select[aria-label^="Move "]');
    const count = await moveSelects.count();
    test.skip(count === 0, "No movable pipeline cards for E2E Test Company in this dev DB run.");

    const select = moveSelects.first();
    const before = await select.inputValue();
    const target = before === "shortlisted" ? "interview_scheduled" : "shortlisted";
    await select.selectOption(target);
    await expect(select).toHaveValue(target);
  });
});

test.describe("Company workflow: candidate search", () => {
  test("a nonsense query returns an empty result set, not a crash", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto(`${COMPANY_CEO_BASE}/matching/search`);
    const searchBox = companyOwnerPage.locator('input[type="search"], input[placeholder*="earch" i]').first();
    test.skip((await searchBox.count()) === 0, "Candidate search input not present for this account/module state.");

    await searchBox.fill("zzzznonexistentcandidatequery9999");
    await companyOwnerPage.waitForTimeout(600); // debounce (350ms in company-dashboard-page.tsx) + settle
    await expect(companyOwnerPage.locator("body")).not.toContainText(/something went wrong/i);
  });
});
