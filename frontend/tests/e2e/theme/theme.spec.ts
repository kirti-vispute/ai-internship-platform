import { test, expect } from "../fixtures/roles.fixture";
import { APPEARANCES, PALETTES, readAppliedTheme } from "../helpers/theme";

// Theme mount points, verified against source: intern profile's "Theme"
// section button (components/icons/section-tab-button.tsx renders a plain
// <button>, not an ARIA tabs widget -- no role="tab" anywhere), company
// personal-profile page, admin settings page.
// applyToDocument() (theme-provider.tsx) is one shared code path for every
// page -- these 3 reachability checks plus the palette/appearance mechanism
// test below cover the mechanism; a small representative-page visual smoke
// pass (not all ~60 routes) covers the "doesn't break rendering" concern,
// since palette swapping is a CSS-variable change, not per-page logic.

test.describe("Theme mechanism: palettes", () => {
  for (const palette of PALETTES) {
    test(`selecting "${palette.label}" applies data-theme="${palette.id}"`, async ({ internPage }) => {
      await internPage.goto("/dashboard/intern/profile");
      await internPage.getByRole("button", { name: "Theme", exact: true }).click();
      const button = internPage.getByRole("button", { name: palette.label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      const applied = await readAppliedTheme(internPage);
      expect(applied.theme).toBe(palette.id);
      expect(applied.storedTheme).toBe(palette.id);
    });
  }
});

test.describe("Theme mechanism: appearance + persistence", () => {
  for (const appearance of APPEARANCES) {
    test(`switching to "${appearance}" applies and persists across reload`, async ({ internPage }) => {
      await internPage.goto("/dashboard/intern/profile");
      await internPage.getByRole("button", { name: "Theme", exact: true }).click();
      const label = appearance === "light" ? "Light" : "Dark";
      await internPage.getByRole("button", { name: label, exact: true }).click();
      const applied = await readAppliedTheme(internPage);
      expect(applied.appearance).toBe(appearance);
      expect(applied.isDarkClass).toBe(appearance === "dark");

      await internPage.reload();
      const afterReload = await readAppliedTheme(internPage);
      expect(afterReload.appearance).toBe(appearance);
      expect(afterReload.storedAppearance).toBe(appearance);
    });
  }
});

test.describe("Theme mount points are reachable", () => {
  test("intern profile Theme tab", async ({ internPage }) => {
    await internPage.goto("/dashboard/intern/profile");
    await internPage.getByRole("button", { name: "Theme", exact: true }).click();
    await expect(internPage.getByRole("button", { name: "Ocean Blue", exact: true })).toBeVisible();
  });

  test("company personal-profile page", async ({ companyOwnerPage }) => {
    await companyOwnerPage.goto("/dashboard/companyCEO/profile/personal");
    await expect(companyOwnerPage.getByRole("button", { name: "Ocean Blue", exact: true })).toBeVisible();
  });

  test("admin settings page", async ({ adminSuperPage }) => {
    await adminSuperPage.goto("/dashboard/admin/settings");
    await expect(adminSuperPage.getByRole("button", { name: "Ocean Blue", exact: true })).toBeVisible();
  });
});

test.describe("Theme visual smoke: representative pages across all 20 combinations", () => {
  const REPRESENTATIVE_PAGES = [
    { name: "intern overview", path: "/dashboard/intern" },
    { name: "intern applications (table)", path: "/dashboard/intern/applications" },
    { name: "intern profile (form)", path: "/dashboard/intern/profile/edit" },
    { name: "intern analytics (chart)", path: "/dashboard/intern/track-progress" }
  ];

  for (const palette of PALETTES) {
    for (const appearance of APPEARANCES) {
      test(`${palette.label} / ${appearance}: key elements stay visible`, async ({ internPage }) => {
        await internPage.goto("/dashboard/intern/profile");
        await internPage.getByRole("button", { name: "Theme", exact: true }).click();
        await internPage.getByRole("button", { name: palette.label, exact: true }).click();
        await internPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();

        for (const page of REPRESENTATIVE_PAGES) {
          await internPage.goto(page.path);
          await expect(internPage.locator("body")).not.toContainText(/something went wrong/i);
          await expect(internPage.locator("h1, h2").first()).toBeVisible();
        }
      });
    }
  }
});
