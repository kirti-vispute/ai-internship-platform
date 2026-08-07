# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Theme persistence: shared across browser tabs >> a theme set in one tab is already applied when a second tab in the same session loads
- Location: tests\e2e\theme\theme.spec.ts:153:7

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