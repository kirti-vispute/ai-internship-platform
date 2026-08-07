# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-workflows.spec.ts >> Admin User Management module >> a failed status-update PATCH surfaces the error banner and leaves the row unchanged
- Location: tests\e2e\dashboard-workflows.spec.ts:1770:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\kirti\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```