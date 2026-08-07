# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-workflows.spec.ts >> Admin User Management module >> status filter narrows to inactive users only (or the empty state when none exist)
- Location: tests\e2e\dashboard-workflows.spec.ts:1760:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\kirti\AppData\Local\ms-playwright\webkit-2336\Playwright.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```