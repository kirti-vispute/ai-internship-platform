# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\forms-tables-search.spec.ts >> Validation: certification review remarks length and character handling >> a rejection reason longer than 500 characters is truncated to exactly 500 on save
- Location: tests\e2e\ui\forms-tables-search.spec.ts:216:7

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