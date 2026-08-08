# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-workflows.spec.ts >> Admin Company Verification module >> Suspend confirmation dialog moves focus in and returns it to the trigger button on cancel
- Location: tests\e2e\dashboard-workflows.spec.ts:808:7

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Suspend', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Suspend', exact: true })
    13 × locator resolved to <button data-cursor="button" class="tilt-3d inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring,rgba(59,130,246,0.45))] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] border border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-soft hover:border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-raised)] h-9 px-4 text-sm">Suspend</button>
       - unexpected value "inactive"

```

```yaml
- button "Suspend"
```

# Test source

```ts
  722 |     await expect(page.getByText("Pending Mock Co")).toBeVisible();
  723 |     for (const name of ["Verified Mock Co", "Rejected Mock Co", "Suspended Mock Co"]) {
  724 |       await expect(page.getByText(name)).toBeHidden();
  725 |     }
  726 |   });
  727 | 
  728 |   // --- Pagination --------------------------------------------------------------
  729 | 
  730 |   test.describe("pagination", () => {
  731 |     function makeCompanies(n: number) {
  732 |       return Array.from({ length: n }, (_, i) => ({
  733 |         _id: `pg-${i + 1}`,
  734 |         companyName: `Pagination Co ${String(i + 1).padStart(2, "0")}`,
  735 |         companyEmail: `pg${i + 1}@x.com`,
  736 |         verificationStatus: "verified"
  737 |       }));
  738 |     }
  739 | 
  740 |     test("pages through more than one page of companies with correct record counts", async ({ page }) => {
  741 |       await page.route("**/api/admin/companies*", (route) => route.fulfill({ json: { companies: makeCompanies(25) } }));
  742 |       await page.goto("/dashboard/admin/companies");
  743 |       const nav = page.getByRole("navigation", { name: "Pagination" });
  744 | 
  745 |       await expect(page.getByText("Page 1 of 3 · 25 companies")).toBeVisible();
  746 |       await expect(page.getByText("Pagination Co 01")).toBeVisible();
  747 |       await expect(page.getByText("Pagination Co 10")).toBeVisible();
  748 |       await expect(page.getByText("Pagination Co 11")).toBeHidden();
  749 | 
  750 |       await nav.getByRole("button", { name: "Next page" }).click();
  751 |       await expect(page.getByText("Page 2 of 3 · 25 companies")).toBeVisible();
  752 |       await expect(page.getByText("Pagination Co 11")).toBeVisible();
  753 |       await expect(page.getByText("Pagination Co 20")).toBeVisible();
  754 |       await expect(page.getByText("Pagination Co 01")).toBeHidden();
  755 | 
  756 |       await nav.getByRole("button", { name: "3", exact: true }).click();
  757 |       await expect(page.getByText("Page 3 of 3 · 25 companies")).toBeVisible();
  758 |       await expect(page.getByText("Pagination Co 21")).toBeVisible();
  759 |       await expect(page.getByText("Pagination Co 25")).toBeVisible();
  760 |       await expect(nav.getByRole("button", { name: "Next page" })).toBeDisabled();
  761 | 
  762 |       await nav.getByRole("button", { name: "Previous page" }).click();
  763 |       await expect(page.getByText("Page 2 of 3 · 25 companies")).toBeVisible();
  764 | 
  765 |       await nav.getByRole("button", { name: "1", exact: true }).click();
  766 |       await expect(page.getByText("Page 1 of 3 · 25 companies")).toBeVisible();
  767 |       await expect(nav.getByRole("button", { name: "Previous page" })).toBeDisabled();
  768 |     });
  769 | 
  770 |     test("searching resets pagination back to page 1", async ({ page }) => {
  771 |       await page.route("**/api/admin/companies*", (route) => route.fulfill({ json: { companies: makeCompanies(25) } }));
  772 |       await page.goto("/dashboard/admin/companies");
  773 |       await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "3", exact: true }).click();
  774 |       await expect(page.getByText("Page 3 of 3 · 25 companies")).toBeVisible();
  775 | 
  776 |       await page.getByPlaceholder("Search companies...").fill("Pagination Co 0");
  777 |       await page.getByRole("button", { name: "Search", exact: true }).click();
  778 |       await expect(page.getByText("Page 1 of 3 · 25 companies")).toBeVisible();
  779 |     });
  780 |   });
  781 | 
  782 |   // --- Status updates / persistence --------------------------------------------
  783 | 
  784 |   test("a status change made in the verification queue is still reflected after a full page reload", async ({ page }) => {
  785 |     let verified = false;
  786 |     await page.route("**/api/admin/companies*", (route) => {
  787 |       const status = verified ? "verified" : "pending";
  788 |       return route.fulfill({ json: { companies: [{ _id: "c1", companyName: "Persisted Co", companyEmail: "p@x.com", verificationStatus: status }] } });
  789 |     });
  790 |     await page.route("**/api/admin/companies/*/verification", (route) => {
  791 |       verified = true;
  792 |       return route.fulfill({
  793 |         json: { company: { _id: "c1", companyName: "Persisted Co", companyEmail: "p@x.com", verificationStatus: "verified" }, message: "ok" }
  794 |       });
  795 |     });
  796 | 
  797 |     await page.goto("/dashboard/admin/companies");
  798 |     await page.getByRole("button", { name: "Verify", exact: true }).click();
  799 |     await expect(page.getByRole("button", { name: "Unverify", exact: true })).toBeVisible();
  800 | 
  801 |     await page.reload();
  802 |     await expect(page.getByRole("button", { name: "Unverify", exact: true })).toBeVisible();
  803 |     await expect(page.getByRole("button", { name: "Verify", exact: true })).toHaveCount(0);
  804 |   });
  805 | 
  806 |   // --- Accessibility -------------------------------------------------------------
  807 | 
  808 |   test("Suspend confirmation dialog moves focus in and returns it to the trigger button on cancel", async ({ page }) => {
  809 |     await page.route("**/api/admin/companies*", (route) =>
  810 |       route.fulfill({ json: { companies: [{ _id: "c1", companyName: "Focus Check Co", companyEmail: "f@x.com", verificationStatus: "pending" }] } })
  811 |     );
  812 |     await page.goto("/dashboard/admin/verification");
  813 |     const suspendButton = page.getByRole("button", { name: "Suspend", exact: true });
  814 |     await suspendButton.click();
  815 | 
  816 |     const dialog = page.getByRole("dialog");
  817 |     await expect(dialog).toBeVisible();
  818 |     await expect(dialog.locator(":focus")).toHaveCount(1);
  819 | 
  820 |     await page.keyboard.press("Escape");
  821 |     await expect(dialog).toBeHidden();
> 822 |     await expect(suspendButton).toBeFocused();
      |                                 ^ Error: expect(locator).toBeFocused() failed
  823 |   });
  824 | 
  825 |   test("verification queue's primary actions are reachable and operable by keyboard", async ({ page }) => {
  826 |     await page.route("**/api/admin/companies*", (route) =>
  827 |       route.fulfill({ json: { companies: [{ _id: "c1", companyName: "Keyboard Co", companyEmail: "k@x.com", verificationStatus: "pending" }] } })
  828 |     );
  829 |     await page.goto("/dashboard/admin/verification");
  830 | 
  831 |     await page.getByPlaceholder("Search companies...").focus();
  832 |     await page.keyboard.press("Tab");
  833 |     await expect(page.getByRole("button", { name: "Search", exact: true })).toBeFocused();
  834 | 
  835 |     const rejectButton = page.getByRole("button", { name: "Reject", exact: true });
  836 |     await rejectButton.focus();
  837 |     await page.keyboard.press("Enter");
  838 |     await expect(page.getByLabel("Rejection reason")).toBeVisible();
  839 |     await rejectButton.press("Enter");
  840 |     await expect(page.getByLabel("Rejection reason")).toBeHidden();
  841 |   });
  842 | 
  843 |   // --- Theme / responsive ---------------------------------------------------------
  844 | 
  845 |   test("verification queue renders correctly in light and dark appearance", async ({ page }) => {
  846 |     await page.route("**/api/admin/companies*", (route) =>
  847 |       route.fulfill({ json: { companies: [{ _id: "c1", companyName: "Theme Check Co", companyEmail: "t@x.com", verificationStatus: "pending" }] } })
  848 |     );
  849 |     await page.goto("/dashboard/admin/settings");
  850 |     await page.getByRole("button", { name: "Dark", exact: true }).click();
  851 |     await page.goto("/dashboard/admin/verification");
  852 |     await expect(page.locator("html")).toHaveClass(/dark/);
  853 |     await expect(page.getByText("Theme Check Co")).toBeVisible();
  854 |     await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  855 | 
  856 |     await page.goto("/dashboard/admin/settings");
  857 |     await page.getByRole("button", { name: "Light", exact: true }).click();
  858 |     await page.goto("/dashboard/admin/verification");
  859 |     await expect(page.locator("html")).not.toHaveClass(/dark/);
  860 |     await expect(page.getByText("Theme Check Co")).toBeVisible();
  861 |   });
  862 | 
  863 |   test("verification queue renders without horizontal overflow on tablet and mobile", async ({ page }) => {
  864 |     await page.route("**/api/admin/companies*", (route) =>
  865 |       route.fulfill({
  866 |         json: { companies: [{ _id: "c1", companyName: "Responsive Check Co", companyEmail: "r@x.com", verificationStatus: "pending" }] }
  867 |       })
  868 |     );
  869 |     for (const viewport of [{ width: 768, height: 1024 }, { width: 375, height: 812 }]) {
  870 |       await page.setViewportSize(viewport);
  871 |       await page.goto("/dashboard/admin/verification");
  872 |       await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  873 |       await expect(page.getByText("Responsive Check Co")).toBeVisible();
  874 |       const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  875 |       const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  876 |       expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  877 |     }
  878 |   });
  879 | });
  880 | 
  881 | // Mock-driven structural coverage for the Certification Review table (real
  882 | // backend round trips -- approve/reject payloads, duplicate-review
  883 | // prevention, search scope, unicode/length handling -- live in
  884 | // workflows/admin.workflows.spec.ts, ui/forms-tables-search.spec.ts, and
  885 | // ui/modals-and-dialogs.spec.ts, which self-seed via POST /api/intern/
  886 | // certifications). Unlike company verification, this list endpoint is real
  887 | // server-side pagination (page/limit/total/totalPages all backend-computed,
  888 | // certification.service.js listCertificationsForAdmin), so the mocks here
  889 | // echo the request's page/limit/status/q params back like a real backend
  890 | // would, rather than returning one static payload regardless of query.
  891 | test.describe("Admin Certification Review module", () => {
  892 |   test.beforeEach(async ({ page }) => {
  893 |     await loginAsRoleViaApi(page, "admin", ADMIN_EMAIL, ADMIN_PASSWORD);
  894 |   });
  895 | 
  896 |   // --- View certification submissions -------------------------------------
  897 | 
  898 |   test("certification queue renders every submission detail field accurately", async ({ page }) => {
  899 |     await page.route("**/api/admin/certifications*", (route) =>
  900 |       route.fulfill({
  901 |         json: {
  902 |           certifications: [
  903 |             {
  904 |               _id: "mock-cert1",
  905 |               courseName: "Mocked Cloud Architecture",
  906 |               skillCategory: "Cloud",
  907 |               provider: "Mocked Academy",
  908 |               completionDate: "2026-01-10T00:00:00.000Z",
  909 |               expiryDate: "2028-01-10T00:00:00.000Z",
  910 |               uploadTimestamp: "2026-01-15T00:00:00.000Z",
  911 |               verificationStatus: "pending_verification",
  912 |               internName: "Asha Verma",
  913 |               userEmail: "asha@example.com"
  914 |             }
  915 |           ],
  916 |           page: 1,
  917 |           limit: 10,
  918 |           total: 1,
  919 |           totalPages: 1
  920 |         }
  921 |       })
  922 |     );
```