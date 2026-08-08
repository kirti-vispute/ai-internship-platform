# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Theme initialization: no console errors or hydration warnings >> switching theme and appearance repeatedly produces no console errors
- Location: tests\e2e\theme\theme.spec.ts:582:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 76

- Array []
+ Array [
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4053}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4053}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4053}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 3991}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "[JavaScript Error: \"Content-Security-Policy: The page’s settings blocked a JavaScript eval (script-src) from being executed because it violates the following directive: “script-src 'self' 'nonce-NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk' 'strict-dynamic'” (Missing 'unsafe-eval')\" {file: \"http://localhost:3000/_next/static/chunks/131a3_next_dist_compiled_abc6abbb._.js\" line: 4324}]",
+   "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:
+
+ - A server/client branch `if (typeof window !== 'undefined')`.
+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
+ - Date formatting in a user's locale which doesn't match the server.
+ - External changing data without sending a snapshot of it along with the HTML.
+ - Invalid HTML tag nesting.
+
+ It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.
+
+ https://react.dev/link/hydration-mismatch
+
+   ...
+     <HotReload assetPrefix=\"\" globalError={[...]}>
+       <AppDevOverlayErrorBoundary globalError={[...]}>
+         <ReplaySsrOnlyErrors>
+         <DevRootHTTPAccessFallbackBoundary>
+           <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
+             <HTTPAccessFallbackErrorBoundary pathname=\"/dashboard...\" notFound={<NotAllowedRootHTTPFallbackError>} ...>
+               <RedirectBoundary>
+                 <RedirectErrorBoundary router={{...}}>
+                   <Head>
+                   <__next_root_layout_boundary__>
+                     <SegmentViewNode type=\"layout\" pagePath=\"/Major Pro...\">
+                       <SegmentTrieNode>
+                       <link>
+                       <script>
+                       <script>
+                       <script>
+                       <script>
+                       <RootLayout>
+                         <html lang=\"en\" className=\"dark\" data-scroll-behavior=\"smooth\" suppressHydrationWarning={true}>
+                           <head>
+                             <ThemeInitScript>
+                               <Script id=\"theme-init\" strategy=\"beforeInte...\" nonce=\"NmE1ZGVlMj...\">
+                                 <script
+ +                                 nonce=\"NmE1ZGVlMjItMGEzNy00NjRmLThmNjktYjQ0NzIxNzNhNjBk\"
+ -                                 nonce=\"\"
+                                   dangerouslySetInnerHTML={{__html:\"(self.__ne...\"}}
+                                 >
+                             ...
+                           ...
+                   ...
+ ",
+   "[JavaScript Error: \"Firefox can’t establish a connection to the server at ws://localhost:5000/socket.io/?EIO=4&transport=websocket.\" {file: \"http://localhost:3000/_next/static/chunks/131a3_ed1574bd._.js\" line: 4721}]",
+   "[JavaScript Error: \"The connection to ws://localhost:5000/socket.io/?EIO=4&transport=websocket was interrupted while the page was loading.\" {file: \"http://localhost:3000/_next/static/chunks/131a3_ed1574bd._.js\" line: 4721}]",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e7]:
    - complementary [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e13]:
          - paragraph [ref=e14]: Intern Portal
          - heading "InternAI" [level=2] [ref=e15]
        - button "Collapse Sidebar" [ref=e19] [cursor=pointer]
      - navigation "Primary" [ref=e25]:
        - generic [ref=e26]:
          - paragraph [ref=e27]: Main
          - list [ref=e28]:
            - listitem [ref=e29]:
              - link "Dashboard Overview" [ref=e30] [cursor=pointer]:
                - /url: /dashboard/intern
            - listitem [ref=e39]:
              - link "Placement Hub" [ref=e40] [cursor=pointer]:
                - /url: /dashboard/intern/placement-hub
        - generic [ref=e49]:
          - button "My Profile" [expanded] [ref=e50] [cursor=pointer]
          - list [ref=e62]:
            - listitem [ref=e63]:
              - link "Profile" [ref=e64] [cursor=pointer]:
                - /url: /dashboard/intern/profile
            - listitem [ref=e74]:
              - link "Edit Profile" [ref=e75] [cursor=pointer]:
                - /url: /dashboard/intern/profile/edit
            - listitem [ref=e83]:
              - link "Resume" [ref=e84] [cursor=pointer]:
                - /url: /dashboard/intern/resume
            - listitem [ref=e94]:
              - link "Resume Score" [ref=e95] [cursor=pointer]:
                - /url: /dashboard/intern/resume/score
            - listitem [ref=e104]:
              - link "3D Portfolio" [ref=e105] [cursor=pointer]:
                - /url: /dashboard/intern/portfolio
            - listitem [ref=e114]:
              - link "Skill Gap Analysis" [ref=e115] [cursor=pointer]:
                - /url: /dashboard/intern/skill-gap
        - generic [ref=e124]:
          - paragraph [ref=e125]: Internships
          - list [ref=e126]:
            - listitem [ref=e127]:
              - link "Recommended Internships" [ref=e128] [cursor=pointer]:
                - /url: /dashboard/intern/internships/recommended
            - listitem [ref=e137]:
              - link "Search Internships" [ref=e138] [cursor=pointer]:
                - /url: /dashboard/intern/internships/search
            - listitem [ref=e145]:
              - link "Saved Internships" [ref=e146] [cursor=pointer]:
                - /url: /dashboard/intern/internships/saved
            - listitem [ref=e152]:
              - link "My Applications" [ref=e153] [cursor=pointer]:
                - /url: /dashboard/intern/applications
            - listitem [ref=e164]:
              - link "Scheduled Interviews" [ref=e165] [cursor=pointer]:
                - /url: /dashboard/intern/interviews
            - listitem [ref=e174]:
              - link "Analytics Center" [ref=e175] [cursor=pointer]:
                - /url: /dashboard/intern/track-progress
        - generic [ref=e182]:
          - paragraph [ref=e183]: My Calendar
          - list [ref=e184]:
            - listitem [ref=e185]:
              - link "Personal Calendar" [ref=e186] [cursor=pointer]:
                - /url: /dashboard/intern/calendar
        - generic [ref=e195]:
          - paragraph [ref=e196]: Learning
          - list [ref=e197]:
            - listitem [ref=e198]:
              - link "Courses" [ref=e199] [cursor=pointer]:
                - /url: /dashboard/intern/learning/courses
            - listitem [ref=e206]:
              - link "Certifications" [ref=e207] [cursor=pointer]:
                - /url: /dashboard/intern/learning/certifications
            - listitem [ref=e216]:
              - link "Mock Aptitude Test" [ref=e217] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-aptitude
            - listitem [ref=e228]:
              - link "Mock Technical Test" [ref=e229] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-technical
            - listitem [ref=e240]:
              - link "Mock Interview" [ref=e241] [cursor=pointer]:
                - /url: /dashboard/intern/learning/mock-interview
        - generic [ref=e247]:
          - paragraph [ref=e248]: Feedback & Support
          - list [ref=e249]:
            - listitem [ref=e250]:
              - link "Notifications" [ref=e251] [cursor=pointer]:
                - /url: /dashboard/intern/notifications
            - listitem [ref=e258]:
              - link "Messages" [ref=e259] [cursor=pointer]:
                - /url: /dashboard/intern/chat
            - listitem [ref=e265]:
              - link "HR Feedback" [ref=e266] [cursor=pointer]:
                - /url: /dashboard/intern/feedback/hr
            - listitem [ref=e272]:
              - link "Suggestions" [ref=e273] [cursor=pointer]:
                - /url: /dashboard/intern/feedback/suggestions
            - listitem [ref=e281]:
              - link "Help / Support" [ref=e282] [cursor=pointer]:
                - /url: /dashboard/intern/support
    - generic [ref=e290]:
      - banner [ref=e291]:
        - generic [ref=e292]:
          - generic [ref=e294]:
            - paragraph [ref=e295]: Intern Portal
            - heading "Welcome back. Let's accelerate your career." [level=1] [ref=e296]
            - paragraph [ref=e297]: Hi, E2E Test Intern
          - generic [ref=e298]:
            - button "4 unread notifications" [ref=e300] [cursor=pointer]:
              - generic [ref=e305]: "4"
            - button "Logout" [ref=e306] [cursor=pointer]
      - main [ref=e312]:
        - generic [ref=e313]:
          - generic [ref=e315]:
            - button "Overview" [ref=e316] [cursor=pointer]
            - button "Skills" [ref=e321] [cursor=pointer]
            - button "Education" [ref=e325] [cursor=pointer]
            - button "Projects" [ref=e331] [cursor=pointer]
            - button "Achievements" [ref=e338] [cursor=pointer]
            - button "Learning" [ref=e343] [cursor=pointer]
            - button "Theme" [ref=e348] [cursor=pointer]
          - generic [ref=e356]:
            - generic [ref=e357]:
              - generic [ref=e358]:
                - heading "Theme" [level=2] [ref=e359]
                - paragraph [ref=e360]: Pick a color theme and an appearance mode. Changes apply instantly across the whole platform.
              - generic [ref=e361]:
                - button [ref=e362] [cursor=pointer]
                - button [active] [pressed] [ref=e375] [cursor=pointer]
            - generic [ref=e381]:
              - button "Ocean Blue" [pressed] [ref=e382] [cursor=pointer]:
                - generic [ref=e383]: Button
                - generic [ref=e407]:
                  - generic [ref=e408]: 🌊
                  - generic [ref=e409]: Ocean Blue
              - button "Olive Green" [ref=e410] [cursor=pointer]:
                - generic [ref=e411]: Button
                - generic [ref=e431]:
                  - generic [ref=e432]: 🌿
                  - generic [ref=e433]: Olive Green
              - button "Crimson Red" [ref=e434] [cursor=pointer]:
                - generic [ref=e435]: Button
                - generic [ref=e455]:
                  - generic [ref=e456]: ❤️
                  - generic [ref=e457]: Crimson Red
              - button "Golden Yellow" [ref=e458] [cursor=pointer]:
                - generic [ref=e459]: Button
                - generic [ref=e479]:
                  - generic [ref=e480]: ☀️
                  - generic [ref=e481]: Golden Yellow
              - button "Sunset Orange" [ref=e482] [cursor=pointer]:
                - generic [ref=e483]: Button
                - generic [ref=e503]:
                  - generic [ref=e504]: 🍊
                  - generic [ref=e505]: Sunset Orange
              - button "Royal Purple" [ref=e506] [cursor=pointer]:
                - generic [ref=e507]: Button
                - generic [ref=e527]:
                  - generic [ref=e528]: 💜
                  - generic [ref=e529]: Royal Purple
              - button "Rose Pink" [ref=e530] [cursor=pointer]:
                - generic [ref=e531]: Button
                - generic [ref=e551]:
                  - generic [ref=e552]: 🌸
                  - generic [ref=e553]: Rose Pink
              - button "Modern White" [ref=e554] [cursor=pointer]:
                - generic [ref=e555]: Button
                - generic [ref=e575]:
                  - generic [ref=e576]: 🤍
                  - generic [ref=e577]: Modern White
              - button "Midnight Black" [ref=e578] [cursor=pointer]:
                - generic [ref=e579]: Button
                - generic [ref=e599]:
                  - generic [ref=e600]: ⚫
                  - generic [ref=e601]: Midnight Black
              - button "Earth Brown" [ref=e602] [cursor=pointer]:
                - generic [ref=e603]: Button
                - generic [ref=e623]:
                  - generic [ref=e624]: 🤎
                  - generic [ref=e625]: Earth Brown
  - generic [ref=e631] [cursor=pointer]:
    - button "Open issues overlay" [ref=e632]:
      - generic [ref=e636]:
        - generic [ref=e637]: "0"
        - generic [ref=e638]: "1"
      - generic [ref=e639]: Issue
    - button "Collapse issues badge" [ref=e640]
  - alert [ref=e643]
```

# Test source

```ts
  498 |     }
  499 |   });
  500 | });
  501 | 
  502 | test.describe("Theme persistence: login pulls the saved server theme when no local cache exists", () => {
  503 |   test("logging in through the real form applies the account's saved theme immediately, without a reload", async ({ page, request }) => {
  504 |     const creds = FIXTURE_CREDENTIALS.adminVerification;
  505 |     const loginRes = await request.post(`${BACKEND_URL}/api/auth/admin/login`, {
  506 |       data: { email: creds.email, password: creds.password }
  507 |     });
  508 |     expect(loginRes.ok()).toBeTruthy();
  509 |     const loginBody = await loginRes.json();
  510 |     const token = loginBody.data.accessToken || loginBody.data.token;
  511 | 
  512 |     // Pin the account's SERVER-side preference to something distinctly
  513 |     // non-default, so "still the hardcoded default after login" and
  514 |     // "correctly pulled the saved preference" are unambiguous outcomes.
  515 |     const patchRes = await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  516 |       headers: { Authorization: `Bearer ${token}` },
  517 |       data: { theme: "crimson", appearance: "light" }
  518 |     });
  519 |     expect(patchRes.ok()).toBeTruthy();
  520 | 
  521 |     // A brand-new, unauthenticated page -- no localStorage theme cache, and
  522 |     // no injected session (loginAsRoleViaApi's addInitScript is deliberately
  523 |     // not used here) -- so this is a genuine first-ever login in this
  524 |     // browser context, the exact scenario the server round-trip exists for.
  525 |     await page.goto("/auth/admin");
  526 |     await waitForAuthFormHydration(page);
  527 |     await page.getByLabel("Admin Email", { exact: true }).fill(creds.email);
  528 |     await page.getByLabel("Password", { exact: true }).fill(creds.password);
  529 |     await page.locator('button[type="submit"]').click();
  530 |     await page.waitForURL(/\/dashboard\/admin/, { timeout: 15000 });
  531 | 
  532 |     await expect.poll(async () => (await readAppliedTheme(page)).theme).toBe("crimson");
  533 |     const applied = await readAppliedTheme(page);
  534 |     expect(applied.appearance).toBe("light");
  535 |     expect(applied.storedTheme).toBe("crimson");
  536 |     expect(applied.storedAppearance).toBe("light");
  537 | 
  538 |     // Restore this fixture account to the suite-wide default so any other
  539 |     // spec that later authenticates as it isn't left on a surprise palette.
  540 |     await request.patch(`${BACKEND_URL}/api/auth/theme`, {
  541 |       headers: { Authorization: `Bearer ${token}` },
  542 |       data: { theme: "ocean", appearance: "dark" }
  543 |     });
  544 |   });
  545 | });
  546 | 
  547 | test.describe("Theme persistence: logout does not reset the active theme", () => {
  548 |   test("the active theme survives logout and remains applied on the login page", async ({ adminSuperPage }) => {
  549 |     const shell = new DashboardShellPage(adminSuperPage);
  550 |     await adminSuperPage.goto("/dashboard/admin/settings");
  551 |     await adminSuperPage.getByRole("button", { name: "Golden Yellow", exact: true }).click();
  552 |     await adminSuperPage.getByRole("button", { name: "Light", exact: true }).click();
  553 |     await expect.poll(async () => (await readAppliedTheme(adminSuperPage)).storedTheme).toBe("golden");
  554 | 
  555 |     await shell.logout();
  556 |     await expect(adminSuperPage).toHaveURL(/\/auth\/admin/);
  557 | 
  558 |     const applied = await readAppliedTheme(adminSuperPage);
  559 |     expect(applied.theme).toBe("golden");
  560 |     expect(applied.appearance).toBe("light");
  561 |   });
  562 | });
  563 | 
  564 | test.describe("Theme initialization: no console errors or hydration warnings", () => {
  565 |   test("reloading with a saved non-default theme produces no console errors", async ({ internPage }) => {
  566 |     const errors: string[] = [];
  567 |     internPage.on("console", (msg) => {
  568 |       if (msg.type() === "error") errors.push(msg.text());
  569 |     });
  570 |     internPage.on("pageerror", (err) => errors.push(err.message));
  571 | 
  572 |     await internPage.goto("/dashboard/intern/profile");
  573 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  574 |     await internPage.getByRole("button", { name: "Earth Brown", exact: true }).click();
  575 |     await internPage.getByRole("button", { name: "Dark", exact: true }).click();
  576 |     await internPage.reload();
  577 |     await expect(internPage.getByRole("button", { name: "Theme", exact: true })).toBeVisible();
  578 | 
  579 |     expect(errors).toEqual([]);
  580 |   });
  581 | 
  582 |   test("switching theme and appearance repeatedly produces no console errors", async ({ internPage }) => {
  583 |     const errors: string[] = [];
  584 |     internPage.on("console", (msg) => {
  585 |       if (msg.type() === "error") errors.push(msg.text());
  586 |     });
  587 |     internPage.on("pageerror", (err) => errors.push(err.message));
  588 | 
  589 |     await internPage.goto("/dashboard/intern/profile");
  590 |     await internPage.getByRole("button", { name: "Theme", exact: true }).click();
  591 |     for (const palette of ["Olive Green", "Sunset Orange", "Royal Purple", "Ocean Blue"]) {
  592 |       await internPage.getByRole("button", { name: palette, exact: true }).click();
  593 |     }
  594 |     for (const label of ["Light", "Dark", "Light", "Dark"]) {
  595 |       await internPage.getByRole("button", { name: label, exact: true }).click();
  596 |     }
  597 | 
> 598 |     expect(errors).toEqual([]);
      |                    ^ Error: expect(received).toEqual(expected) // deep equality
  599 |   });
  600 | });
  601 | 
  602 | test.describe("Theme across responsive breakpoints: mobile", () => {
  603 |   test.use({ viewport: { width: 375, height: 812 } });
  604 | 
  605 |   test("admin Users page renders correctly in both themes at mobile width", async ({ adminSuperPage }) => {
  606 |     for (const appearance of APPEARANCES) {
  607 |       await adminSuperPage.goto("/dashboard/admin/settings");
  608 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  609 | 
  610 |       await adminSuperPage.goto("/dashboard/admin/users");
  611 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  612 |       await expect(adminSuperPage.getByRole("heading", { level: 1, name: "User Management" })).toBeVisible();
  613 |       const applied = await readAppliedTheme(adminSuperPage);
  614 |       expect(applied.appearance).toBe(appearance);
  615 |     }
  616 |   });
  617 | });
  618 | 
  619 | test.describe("Theme across responsive breakpoints: tablet", () => {
  620 |   test.use({ viewport: { width: 768, height: 1024 } });
  621 | 
  622 |   test("admin Users page renders correctly in both themes at tablet width", async ({ adminSuperPage }) => {
  623 |     for (const appearance of APPEARANCES) {
  624 |       await adminSuperPage.goto("/dashboard/admin/settings");
  625 |       await adminSuperPage.getByRole("button", { name: appearance === "light" ? "Light" : "Dark", exact: true }).click();
  626 | 
  627 |       await adminSuperPage.goto("/dashboard/admin/users");
  628 |       await expect(adminSuperPage.locator("body")).not.toContainText(/something went wrong/i);
  629 |       await expect(adminSuperPage.getByRole("heading", { level: 1, name: "User Management" })).toBeVisible();
  630 |       const applied = await readAppliedTheme(adminSuperPage);
  631 |       expect(applied.appearance).toBe(appearance);
  632 |     }
  633 |   });
  634 | });
  635 | 
```