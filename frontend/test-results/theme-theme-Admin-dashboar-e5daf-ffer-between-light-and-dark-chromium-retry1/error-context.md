# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme\theme.spec.ts >> Admin dashboard: tables, cards, and status badges repaint with appearance >> computed background color for a table and a card differ between light and dark
- Location: tests\e2e\theme\theme.spec.ts:405:7

# Error details

```
Error: page.evaluate: Error: readComputedStyle: no element matched ".ds-card"
    at eval (eval at evaluate (:311:30), <anonymous>:6:20)
    at UtilityScript.evaluate (<anonymous>:313:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - link "Skip to main content" [ref=f2e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=f2e7]:
    - complementary [ref=f2e8]:
      - generic [ref=f2e9]:
        - generic [ref=f2e13]:
          - paragraph [ref=f2e14]: Admin Portal
          - heading "InternAI" [level=2] [ref=f2e15]
        - button "Collapse Sidebar" [ref=f2e19] [cursor=pointer]
      - navigation "Primary" [ref=f2e22]:
        - generic [ref=f2e23]:
          - paragraph [ref=f2e24]: Main
          - list [ref=f2e25]:
            - listitem [ref=f2e26]:
              - link "Dashboard Overview" [ref=f2e27] [cursor=pointer]:
                - /url: /dashboard/admin
        - generic [ref=f2e36]:
          - paragraph [ref=f2e37]: Management
          - list [ref=f2e38]:
            - listitem [ref=f2e39]:
              - link "Users" [ref=f2e40] [cursor=pointer]:
                - /url: /dashboard/admin/users
            - listitem [ref=f2e49]:
              - link "Companies" [ref=f2e50] [cursor=pointer]:
                - /url: /dashboard/admin/companies
            - listitem [ref=f2e58]:
              - link "Verification Queue" [ref=f2e59] [cursor=pointer]:
                - /url: /dashboard/admin/verification
            - listitem [ref=f2e66]:
              - link "Internships" [ref=f2e67] [cursor=pointer]:
                - /url: /dashboard/admin/internships
            - listitem [ref=f2e74]:
              - link "Certification Review" [ref=f2e75] [cursor=pointer]:
                - /url: /dashboard/admin/certification-review
        - generic [ref=f2e82]:
          - paragraph [ref=f2e83]: Moderation
          - list [ref=f2e84]:
            - listitem [ref=f2e85]:
              - link "Reported Companies" [ref=f2e86] [cursor=pointer]:
                - /url: /dashboard/admin/reports
            - listitem [ref=f2e92]:
              - link "Activity Logs" [ref=f2e93] [cursor=pointer]:
                - /url: /dashboard/admin/activity-logs
        - generic [ref=f2e99]:
          - paragraph [ref=f2e100]: Secondary
          - list [ref=f2e101]:
            - listitem [ref=f2e102]:
              - link "Platform Statistics" [ref=f2e103] [cursor=pointer]:
                - /url: /dashboard/admin/analytics
            - listitem [ref=f2e109]:
              - link "Notifications" [ref=f2e110] [cursor=pointer]:
                - /url: /dashboard/admin/notifications
            - listitem [ref=f2e117]:
              - link "AI Hiring Scoring" [ref=f2e118] [cursor=pointer]:
                - /url: /dashboard/admin/hiring-scoring
            - listitem [ref=f2e124]:
              - link "Settings" [ref=f2e125] [cursor=pointer]:
                - /url: /dashboard/admin/settings
    - generic [ref=f2e132]:
      - banner [ref=f2e133]:
        - generic [ref=f2e134]:
          - generic [ref=f2e136]:
            - paragraph [ref=f2e137]: Admin Portal
            - heading "Platform management center." [level=1] [ref=f2e138]
            - paragraph [ref=f2e139]: Hi, admin@internai.com
            - paragraph [ref=f2e140]: super admin
          - button "Logout" [ref=f2e142] [cursor=pointer]
      - main [ref=f2e147]:
        - generic [ref=f2e148]:
          - generic [ref=f2e149]:
            - heading "Verification Queue" [level=1] [ref=f2e150]
            - paragraph [ref=f2e151]: Review and approve or reject pending company accounts.
          - button "Refresh" [ref=f2e152] [cursor=pointer]
        - generic [ref=f2e153]:
          - generic [ref=f2e154]:
            - textbox "Search companies..." [ref=f2e156]
            - button "Search" [ref=f2e157] [cursor=pointer]
          - generic [ref=f2e160]:
            - generic [ref=f2e161]:
              - generic [ref=f2e162]:
                - heading "CloudNest" [level=3] [ref=f2e163]
                - generic [ref=f2e164]: pending
              - paragraph [ref=f2e169]: company2@example.com
              - generic [ref=f2e170]:
                - generic [ref=f2e171]: "GSTIN: 33BBBBB1111B1Z6"
                - generic [ref=f2e172]: "Contact: Nisha Rao"
                - generic [ref=f2e173]: "Phone: 9234567890"
                - generic [ref=f2e174]: "Registered: Jun 12, 2026"
              - paragraph [ref=f2e175]: Cloud analytics company
            - generic [ref=f2e176]:
              - button "Verification PDF" [ref=f2e177] [cursor=pointer]
              - button "Verify" [ref=f2e182] [cursor=pointer]
              - button "Reject" [ref=f2e183] [cursor=pointer]
              - button "Suspend" [ref=f2e184] [cursor=pointer]
          - generic [ref=f2e185]: Page 1 of 1 · 1 company
  - generic [ref=f2e192] [cursor=pointer]:
    - button "Open issues overlay" [ref=f2e193]:
      - generic [ref=f2e197]:
        - generic [ref=f2e198]: "0"
        - generic [ref=f2e199]: "1"
      - generic [ref=f2e200]: Issue
    - button "Collapse issues badge" [ref=f2e201]
  - alert [ref=f2e204]
```