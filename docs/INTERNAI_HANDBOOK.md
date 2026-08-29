# InternAI Technical Architecture & AI Handbook

**A Software Engineering + AI Knowledge Book**

> Prepared for: Final Year Major Project Viva · Technical Presentations · Project Demonstration · Placement Interviews · Future Maintenance.
>
> This is not API documentation and not code documentation. It explains **why** the system is built the way it is. Every claim below is verified against the actual repository — nothing is invented. Where a technique (embeddings, vector databases, model training) is **not** used, that is stated explicitly rather than assumed.
>
> **Reading order for maximum viva return:** Sections 1, 2, 8, 9, 10, 11, 12 carry the majority of technical marks. Section 19 is your rapid-fire drill. Section 20 is your opening narrative. Markers: **[VIVA]** = high-probability question. **[HONEST]** = a real limitation to volunteer, always paired with its fix — admitting a known gap scores higher than being caught defending one.

---

## Table of Contents

1. Project Overview
2. Complete System Architecture
3. Technology Stack
4. UI/UX Design System
5. Frontend Architecture
6. Backend Architecture
7. Database Design
8. Complete AI Architecture
9. Resume Score Engine
10. AI Job Matching Engine
11. AI Models & Algorithms
12. Datasets & Knowledge Sources
13. External APIs
14. Security
15. Performance
16. Deployment
17. Engineering Decisions (40)
18. Limitations & Future Improvements
19. Viva Preparation (150 Questions)
20. Project Defense
Final Revision Sheet

---

# SECTION 1 — PROJECT OVERVIEW

## 1.1 What this is

**InternAI** is an internship hiring platform connecting students, companies, and platform administrators, built around one idea: the resume is the interface between a student and a recruiter, and today that interface is opaque to both sides. The system makes it transparent — a student sees exactly why a resume scored what it scored; a recruiter sees an explainable, configurable ranking instead of a subjective pile of PDFs.

## 1.2 Problem statement

| Stakeholder | Real pain | Consequence |
|---|---|---|
| Student | No feedback on why a resume is rejected | Repeats the same mistakes blindly |
| Student | Can't see the gap between what they have and what a role needs | No actionable learning direction |
| Company/HR | Hundreds of unstructured PDFs per posting | Manual screening, slow hiring |
| Company/HR | Screening is subjective, inconsistent between recruiters | Unfair, unrepeatable decisions |
| Both | Scheduling/interviews/feedback live in email and WhatsApp | Lost context, no audit trail |

## 1.3 Solution

Convert an unstructured resume into structured, comparable data → score it against a **specific posting's actual requirements**, not a generic ideal → explain every point lost → turn the gap into a phased learning plan → give recruiters a configurable, auditable ranking → run the full hiring lifecycle (apply → screen → interview → decide) inside one system. All on free-tier infrastructure.

## 1.4 Target users

| Role | Sub-roles | Core need |
|---|---|---|
| Student/Intern | — | Understand score, close skill gaps, find + apply, interview, track |
| Company | owner, ceo, hr | Post roles, get ranked applicants, run pipeline, interview |
| Admin | super_admin, verification_admin, moderation_admin, support_admin | Verify companies, moderate, audit |

## 1.5 Business workflow

```
STUDENT                                    COMPANY
Signup (OTP) → build profile               Signup (OTP) → await admin verification
→ upload resume → parse → score            → post internship (skills, CGPA, experience)
→ see 7-dimension breakdown                → receive applications
→ skill-gap vs target role/posting         → ranked applicant list (explainable)
→ roadmap → apply                          → Kanban pipeline
→ interview scheduled ─────────────────────→ schedule round
        └──────── WebRTC interview room ────────┘
                        │
              feedback + decision → notifications, chat, calendar
```

## 1.6 Core features (by portal)

**Student:** resume upload/parsing, 7-dimension explainable score, 3-pass skill-gap analysis, phased career roadmap, internship search/recommended/saved, application tracking, aptitude + DSA practice engines, certification management, 3D public portfolio, calendar, notifications, chat, PDF report export.

**Company:** internship CRUD, configurable applicant ranking, candidate comparison workspace, hiring Kanban, HR sub-accounts with scoped permissions, interview scheduling with automated reminders, funnel analytics, candidate search.

**Admin:** company verification, abuse-report moderation, certification review, soft-delete user management, activity audit log.

**Platform-wide:** WebRTC mesh interview rooms, Socket.io chat/signalling, Redis-cached AI, PDF generation, PWA, light/dark theming with 10 selectable palettes.

## 1.7 Unique selling points **[VIVA — memorise these]**

1. **Deterministic-first scoring** — the number is computed by a rule engine, not an LLM. Same resume + same posting → same score, always.
2. **Explainable, not just accurate** — every point lost traces to a dimension, its weight, and a plain-language reason, arithmetically derived from `weight × score`.
3. **Context-scoped** — the same resume scores differently against different postings, because the required-skill set changes.
4. **Fairness-by-design** — experience/education dimensions deduct only when a posting states a requirement and the candidate genuinely misses it. A fresher is never penalised for being a fresher.
5. **Zero-cost, fully-degradable architecture** — every optional external service (Redis, Cloudinary, Groq, HuggingFace, Postgres) has a working local fallback.

## 1.8 Real-world use case

A 3rd-year CSE student scores 61/100 against a "Backend Developer Intern" posting. Breakdown: Keyword Match 55/100 (missing Docker, PostgreSQL, API design), Projects 48/100 (no project uses this posting's stack), Experience 100/100 (posting states "freshers welcome" — not penalised). The roadmap lists 3 high-priority skills with concrete project suggestions. Six weeks later, keyword match rises to 82; the student moves from rank 31 to rank 4 in the recruiter's shortlist.

## 1.9 Future scope

**Near-term:** automated test suite + CI, JWT off `localStorage` into httpOnly cookies + CSRF, complete the mock-interview module, TURN server for interviews.
**Medium-term:** embedding-based semantic skill matching, outcome-trained ranking model, extract the AI module into its own service, event-driven notifications.
**Long-term:** multi-tenant company workspaces, recruiter ATS integrations, college placement-cell dashboards, mobile app on the same API.

---

# SECTION 2 — COMPLETE SYSTEM ARCHITECTURE

## 2.1 Style: modular monolith with a shared kernel

Not microservices, not a layered mud-ball. **18 feature modules**, each owning routes/controllers/services/models/validators/constants, plus a **shared kernel** (`src/shared/`) holding only cross-cutting infrastructure. Deployed as one Node process.

**Why not microservices? [VIVA — near-certain]**

| Criterion | Microservices | Modular monolith (chosen) |
|---|---|---|
| Deployment cost | N services × hosting | 1 free Render instance |
| Operational complexity | Service discovery, distributed tracing | One process, one log stream |
| Team size | Needs multiple teams | Solo/small student team |
| Transactions | Distributed/saga | Single MongoDB session |
| Future migration | — | Module boundaries are already the seams |

The design is explicitly microservice-*ready*: a single registry mounts all modules, modules avoid reaching into each other's internals, and the architecture doc names extraction targets (`ai`, `notifications+email`, `reports`).

## 2.2 Full architecture diagram

```
┌─────────────────────────── CLIENT TIER ───────────────────────────┐
│  Next.js 15 (App Router) · React 19 · TypeScript · Tailwind        │
│  app/ (40 routes, role-segregated) · components/ (~200, domain-    │
│  grouped) · lib/ (portals, engines, hooks, session)                │
│  Vercel/Netlify · SSR + static · PWA service worker                │
└──────────┬─────────────────────────────────────────┬───────────────┘
           │ HTTPS REST (Bearer JWT)                 │ WebSocket
┌──────────▼─────────────────────────────────────────▼───────────────┐
│                   APPLICATION TIER (Render, Node 20)                │
│  compression → helmet → cors → json → mongoSanitize → cookieParser  │
│  → requestId → static /uploads → morgan → rateLimit(/api)           │
│  registry/index.js mounts 14 routers at /api AND /api/v1            │
│  MODULES(18): authentication·students·companies·internships·        │
│  applications·ats-scoring·ai·interviews·notifications·email·        │
│  reports·calendar·analytics·admin·chat·portfolio·skills·candidates  │
│  SHARED KERNEL: config·database·middleware·utils·logger·constants   │
│  infrastructure/ ai(Groq→HF→local)·cache(Redis→memory)·             │
│  storage(Cloudinary→local)·db(optional Postgres)                    │
│  socket/ chat.socket.js · interview.socket.js (WebRTC signalling)    │
└──────┬─────────────┬──────────────┬───────────────┬─────────────────┘
┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌──────▼────────┐
│ MongoDB    │ │ Upstash    │ │ Cloudinary │ │ Groq/         │
│ Atlas M0   │ │ Redis      │ │ (files)    │ │ HuggingFace   │
│ 18 colls.  │ │ cache+rate │ │            │ │ (optional)    │
│ PRIMARY    │ │ limit      │ │            │ │               │
└────────────┘ └────────────┘ └────────────┘ └───────────────┘
       │
┌──────▼───────────────┐   ┌──────────────────────────────┐
│ Neon Postgres         │   │ Python Flask scorer (opt.)   │
│ optional, analytics    │   │ TF-IDF + sklearn classifier  │
│ events only            │   │ OFF by default in production │
└───────────────────────┘   └──────────────────────────────┘
```

## 2.3 Layer responsibilities

| Layer | Responsibility | Must never |
|---|---|---|
| Route | Path, verb, middleware chain | Contain business logic |
| Controller | Parse request, call service, shape envelope | Compute domain rules |
| Service | Business logic, orchestration | Know about `req`/`res` |
| Model | Schema, indexes, invariants | Contain cross-domain logic |
| Shared kernel | Auth, errors, cache, storage, AI routing | Import a feature module |

## 2.4 Diagram — request lifecycle **[VIVA — narrate end-to-end]**

`POST /api/intern/resume/upload`:

```
1  Browser → apiRequest() attaches Bearer token, FormData body
2  compression      → skipped (multipart)
3  helmet           → security headers set
4  cors             → origin checked against allowlist
5  express.json     → skipped (multer handles multipart)
6  mongoSanitize    → strips $ / . keys — MUST run after body parsing
7  requestId        → UUID attached, echoed in response meta
8  morgan           → access log
9  rateLimit        → 400 req/15min/IP on /api
10 router           → /api/intern → students module
11 authMiddleware   → verify Bearer JWT → load user → recompute permissions
12 multer           → dual MIME+extension check, 5MB cap, randomised filename
13 controller       → uploadResume()
14 service          → parseResumeFile() → structuredResumeParse() →
                       storeUploadedFile() (Cloudinary→local) →
                       mergeParsedResumeIntoProfile() → refreshProfileScore()
15 persistence      → profile.save() → activity log → cache invalidation
16 response         → sendSuccess() envelope
17 errors           → any throw → asyncHandler → errorMiddleware → sendError()
```

## 2.5 Diagram — authentication flow

```
SIGNUP                                    LOGIN
POST /auth/intern/send-otp                POST /auth/login
  → generate OTP → email via nodemailer     → comparePassword (bcrypt)
POST /auth/intern/verify-otp                 → issueSession()
  → mark OtpVerification verified               accessToken  = JWT{userId,role,adminRole}
POST /auth/intern/signup                       refreshToken = JWT{same}, diff secret
  → assertVerifiedOtpForSignup                 user.refreshTokenHash = sha256(refreshToken)
  → User.create (bcrypt hash)                  set httpOnly cookies (not used for auth)
  → InternProfile.create                       activity log written

EVERY AUTHENTICATED REQUEST
Authorization: Bearer <accessToken>
  → verifyAccessToken → User.findById (12-field projection)
  → recompute permissions from role/adminRole/companyAccountType
  → req.user attached → next()

REFRESH (on 401)                          LOGOUT
POST /auth/refresh {refreshToken}         POST /auth/logout
  → verifyRefreshToken                      → clear refreshTokenHash
  → compare sha256(token) vs stored hash    → clear cookies
  → reissue both tokens
```

## 2.6 Diagram — resume upload & scoring flow

```
PDF/DOCX/TXT (≤5MB)
   │ multer: MIME+ext whitelist, randomised filename
   ▼
pdf-parse / mammoth / utf8 → normalizeExtractedText()
   ▼
structuredResumeParse(): heading detection → section split →
   14 field extractors (name, email, skills, projects, education, ...)
   ▼
sanitizeParsed() → qualityReport() → confidence 0.55–0.95
   ▼
analyzeResumeText(): ATS/verbs/numbers/sections rule layer
   ▼
computeResumeIntelligenceV2(): 7 weighted dimensions (Section 9)
   ▼
overallScore, compositeScores, scoreExplanation, skillIntelligence
   ▼
validateResumeExtraction(): cross-validated confidence tier
   ▼
persist on InternProfile.resume{} → invalidate cache → portfolio sync
   ▼
UI renders score + breakdown + fixes
```

## 2.7 Diagram — job matching flow

```
Student's parsed+profile skills            Internship posting
(normalised, canonicalised)                (requiredSkills, prioritySkills)
        │                                          │
        └──────────────► computeSkillMatch() ◄─────┘
                              │
              matchedRequired / totalRequired × 100
              matchedPreferred / totalPreferred × 100
                              │
        overallScore = required×0.8 + preferred×0.2
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                            ▼
STUDENT SIDE: rank all postings              COMPANY SIDE: rank all applicants
for this student, sort by score,             for this posting —
descending, tie-break alphabetical           requiredMatch×0.55 + resumeScore×0.20
                                              + projectScore×0.25 (backend)
                                              OR configurable weighted template
                                              (frontend recruiter engine)
```

## 2.8 Diagram — interview flow

```
HR schedules round → InterviewRoom + Application.rounds[] created
   → notification + email queued → reminder scheduler arms 24h/1h/15m timers
Both parties navigate to /interview/[roomId]
   → Socket.io: join-room → roster broadcast
   → WebRTC offer/answer/ICE exchanged over Socket.io (signalling only)
   → DIRECT peer-to-peer audio/video/screen-share (never touches the server)
   → HR submits feedback → Application status updated → notification fired
```

## 2.9 Diagram — AI pipeline (applies across all AI features)

```
┌─────────── LAYER 1: GROUNDING ───────────┐
│ Collect real signals only. Decide        │
│ sufficient / missingFields / signalCount │
│ Insufficient → low confidence, no guess  │
└─────────────────┬─────────────────────────┘
                  ▼
┌─────────── LAYER 2: PRIMARY ─────────────┐
│ Deterministic engines compute the number │
│ (resume score, skill match, project      │
│  evaluation, roadmap, candidate rank)    │
│ Optional: LLM generates prose for the    │
│ same facts (never a number)              │
└─────────────────┬─────────────────────────┘
                  ▼
┌─────────── LAYER 3: VALIDATION ──────────┐
│ Cross-validate independent estimates.    │
│ Agreement → confidence up. Disagreement  │
│ → confidence down / conflict_detected.   │
│ Emits: confidenceScore, tier, trace       │
└────────────────────────────────────────────┘
```

## 2.10 Communication summary

| Channel | Protocol | Used for | Auth |
|---|---|---|---|
| REST | HTTPS/JSON | CRUD, scoring, reports | `Authorization: Bearer <JWT>` |
| WebSocket | Socket.io | Chat, presence, interview roster, WebRTC signalling | JWT handshake |
| P2P | WebRTC (SRTP/DTLS) | Interview audio/video/screen | DTLS session-scoped |
| Server→user | SMTP (nodemailer) | OTP, interview notices | — |

---

# SECTION 3 — TECHNOLOGY STACK

| Technology | Purpose | Why chosen | Alternative | Advantages | Limitations | Where used | Production consideration |
|---|---|---|---|---|---|---|---|
| **Next.js 15** | Frontend framework | File-system routing maps onto 3 role-segregated portals; per-route code splitting; free CDN hosting | Vite+React Router | SSR/SSG where useful, image optim, PWA support | App Router learning curve; SSR adds server cost if overused | `frontend/app/**` | Static export where possible to cut function invocations |
| **React 19** | UI runtime | Component composition for ~200 components | Vue, Svelte | Huge ecosystem, hooks | Re-render discipline required | everywhere | — |
| **TypeScript** | Frontend type safety | Scoring/skill-gap engines carry structured types where a runtime error would be silent and wrong | Plain JS | Compile-time safety, refactor confidence | Build step, learning curve | `frontend/**` | `tsc --noEmit` in deployment guard |
| **Tailwind CSS 3** | Styling | Utility-first keeps styling local; no cascade conflicts across 200 components | CSS Modules | Fast iteration, consistent tokens | Verbose className strings | `frontend/**` | Purge unused classes at build (automatic) |
| **framer-motion** | Animation | Declarative, interruptible transitions | CSS transitions | Rich gesture/orchestration API | Bundle size if unmanaged | dashboards, landing | `optimizePackageImports` tree-shakes it |
| **Node.js 20 + Express 4** | Backend runtime | Same language as frontend; explicit middleware chain for security pipeline | NestJS, Fastify, Django | Huge ecosystem, simple mental model | No built-in DI, less opinionated | `backend/src` | Pin Node version (`engines`) |
| **MongoDB + Mongoose 8** | Primary datastore | `resume.parsed`/`analysis` genuinely schema-volatile; profiles read as whole documents | PostgreSQL | Flexible schema, natural arrays, free tier | No multi-document integrity by default | all models | Atlas M0 free tier; upgrade path exists |
| **Socket.io 4** | Realtime transport | Rooms + auto-reconnect + transport fallback (needed on free-tier hosts that drop idle sockets) | Raw `ws` | Reliability features built-in | In-process state — needs Redis adapter to scale out | chat, interviews | Add Redis adapter before scaling beyond 1 instance |
| **WebRTC** | P2P audio/video | Media never touches the server → zero bandwidth cost | Agora/Twilio/Daily (paid) | Free, lowest latency | Fails behind symmetric NAT without TURN; O(n²) mesh | `use-webrtc.ts` | Add TURN server for production reliability |
| **JWT** | Stateless auth | No server-side session store to host | Server sessions + Redis | Scales without shared session state | Cannot be revoked instantly unless tracked (mitigated via refresh-hash) | `shared/utils/jwt.js` | Short access-token expiry recommended |
| **bcryptjs** | Password hashing | Adaptive cost, pure JS (no native build on Render) | argon2 | Battle-tested, salted | Slightly slower than native bcrypt | `password.js` | Tune cost factor per hardware |
| **Upstash Redis** | Cache + rate limiting | REST-based → works from PaaS without persistent TCP pool | Self-hosted Redis | Free tier, no connection pooling issues | 10K commands/day free cap | `infrastructure/cache` | Monitor command usage; upgrade tier if exceeded |
| **Cloudinary** | File storage + CDN | Free tier, handles resumes/certs/logos, falls back to local disk | AWS S3 (paid) | CDN delivery, image transforms | 25 credits/mo free cap | `storage.adapter.js` | Monitor usage; local fallback always available |
| **Groq (llama-3.1-8b-instant)** | Primary optional LLM | Fastest free inference tier | OpenAI/Gemini (paid) | Very low latency | Smaller model, prose-only use | `groq.provider.js` | Rate-limited, cached, never authoritative |
| **HuggingFace Inference** | Fallback LLM | Free inference API, second rung | — | Redundancy | Slower, variable availability | `huggingface.provider.js` | Fallback only |
| **pdf-parse / mammoth** | Document extraction | Page-boundary preservation (pdf-parse) reduces line shuffling; clean DOCX raw text (mammoth) | pdfjs, textract | Lightweight, no native deps | No OCR for scanned/image PDFs | `resume-parser.service.js` | — |
| **pdfkit** | PDF report generation | Streaming, server-side, no headless browser | Puppeteer | Low memory footprint | Manual layout code | `report-pdf.service.js` | — |
| **helmet/cors/express-rate-limit/express-mongo-sanitize** | Security middleware | Each closes an OWASP-mapped hole | Hand-rolled | Battle-tested defaults | Must be configured correctly (order matters) | `app.js` | Explicit config, not defaults, to survive version bumps |
| **Python Flask + scikit-learn** | Optional ML resume classifier | Demonstrates a real trained-model path without production depending on it | — | Real supervised learning artifact | Off by default; not integrated into the authoritative score | `backend/scorer/` | `SCORER_ENABLED=false` in production |
| **Neon Postgres** | Optional analytics store | Analytics events are relational/aggregate-heavy | Mongo collection | SQL aggregation | Optional — nothing breaks if absent | `postgres.client.js` | Silent no-op if unconfigured |

**Polyglot persistence note [VIVA]:** MongoDB holds all operational data; Postgres is optional and holds only analytics events — a partial CQRS split. If Postgres is absent, `recordAnalyticsEvent` silently no-ops.

---

# SECTION 4 — UI/UX DESIGN SYSTEM

## 4.1 Theme architecture

Two independent axes: **palette** (10 named color schemes) and **appearance** (light/dark). Both persist on the `User` document (`themePreference`, `appearanceMode`) — the choice follows the *account*, not the device or browser.

```
lib/theme/theme-config.ts   → THEME registry, storage keys, validators
lib/theme/palettes.json     → 10 palettes: {id, label, emoji, primary, neutral, surface, text, accent}
lib/theme/theme-api.ts      → apply/read theme against DOM + persistence
```

**Default:** palette `ocean`, appearance `dark`.

## 4.2 Color system

Two parallel color systems coexist deliberately:

**1. Tailwind static tokens** (`tailwind.config.ts`) — used for the core dark-mode product shell:

```
primary   50→950   blue ramp (#eef4ff → #061b42)
internai  bg #05060A · surface #0B1220 · elevated #111827
          blue #3B82F6 · cyan #22D3EE · orange #F97316
          pink #FB7185 · purple #A78BFA · text #E5E7EB · muted #B0B8C5
slateDeep #0f172a · ink #0a1020
```

**2. User-selectable palettes** (`palettes.json`) — 10 complete schemes (Ocean Blue, Olive Green, Crimson Red, Golden Yellow, Sunset Orange, Royal Purple, Rose Pink, Modern White, Midnight Black, Earth Brown), each with `{primary, neutral, surface, text, accent}` — applied on top of the base shell for the user-facing chrome.

**Why two systems? [VIVA]** The Tailwind tokens are the *structural* dark theme (backgrounds, elevation, borders) — they rarely change and are baked into components. The palette system is the *personalisation* layer (accent colors, brand feel) that a student or company can switch per-account without touching component code. Separating "structure" from "identity" means adding an 11th palette is a one-line JSON addition, not a component rewrite.

## 4.3 Typography & spacing

Typography and spacing scale through Tailwind's default type scale and spacing units, kept consistent by **not** overriding them in `tailwind.config.ts` — the config only extends colors, shadows and background images, deliberately leaving type/spacing at Tailwind's battle-tested defaults rather than inventing a custom scale that would need independent justification.

## 4.4 Component library & Tailwind strategy

**Utility-first, not a component-class abstraction layer.** Styling lives directly on the JSX element via Tailwind classes; there is no separate CSS file per component and no CSS-in-JS runtime. Shared visual primitives (`components/ui/**`) wrap common utility combinations (card, button, modal, tab list) so the classes aren't repeated by hand everywhere, but the underlying styling mechanism is still plain Tailwind.

**Why utility-first over a component library (e.g. MUI/Chakra)?** A pre-built component library brings its own design language that then has to be fought or overridden to match a custom brand. Tailwind gives full control with zero fighting, at the cost of writing more classes per element — a trade-off that favours a project with a genuinely custom visual identity (10 palettes, dark-first, gradient/glass surfaces) over one that wants a generic look fast.

## 4.5 Responsive design

Standard Tailwind breakpoint system (`sm/md/lg/xl/2xl`), mobile-first class ordering throughout. Dashboards collapse from multi-column grids to stacked single-column layouts; navigation collapses to a drawer/bottom-bar pattern below `md`. No separate mobile codebase or component tree — the same components respond via Tailwind's responsive variants.

## 4.6 Accessibility

| Concern | Implementation |
|---|---|
| Focus management in modals | `use-focus-trap` hook — traps Tab cycling inside open dialogs |
| Keyboard-navigable tabs | `use-tablist-keyboard` — roving tabindex + arrow-key navigation on tab widgets |
| Screen-reader navigation state | `aria-current` on the active sidebar/nav item |
| Color contrast | Muted text tokens (`internai.muted`, palette `text`/`neutral` pairs) checked for contrast rather than picked arbitrarily |

**[HONEST]** There is no automated accessibility audit (axe-core, Lighthouse CI) wired into the build. Manual keyboard/contrast attention exists; automated regression coverage does not — a fair gap to name if asked.

## 4.7 Glassmorphism & gradients

`backdrop-blur` (Tailwind's frosted-glass utility) appears in **17 components** — primarily modals and overlay panels (calendar day detail, chat details, applicant details, interview scheduling, resume preview) where a translucent surface over dashboard content signals "this is a temporary layer above the page" without a full opaque takeover. Gradients are used sparingly and specifically: the landing hero background (`backgroundImage.hero` in `tailwind.config.ts`) is a multi-stop radial+linear gradient; elsewhere flat elevation colors (`surface`/`elevated`) are preferred over gradients for dashboard chrome, to keep data-dense screens calm rather than decorative.

**Design decision [VIVA]:** glassmorphism is reserved for **overlays**, not base layouts. A dashboard full of translucent panels reduces text-contrast and readability at exactly the density this product needs (tables, kanban cards, score breakdowns). Restricting the effect to modals keeps the "special" visual language special.

## 4.8 Animation philosophy & Framer Motion usage

Animation exists in two deliberately different registers:

1. **Marketing/landing surfaces** (`components/animations/ParallaxSection.tsx`, `ScrollReveal.tsx`) — scroll-triggered parallax and reveal-on-scroll, used to make the public-facing landing page feel crafted.
2. **Dashboard interactions** — framer-motion drives interruptible micro-transitions (panel enter/exit, kanban card drag feedback, modal open/close), never a decorative flourish on data itself. A score number does not animate for effect; a modal opening does.

**Why this split? [VIVA]** Marketing pages are read once and should impress; dashboards are used repeatedly and should be *fast and calm* — animating every state change on a page a recruiter opens fifty times a day would become friction, not delight. `optimizePackageImports: ["framer-motion"]` also ensures only the animation primitives actually imported ship in the bundle.

## 4.9 Dashboard layout patterns

Three route patterns power the dashboards (detailed in Section 5.2): explicit segments for stable, individually-prefetchable student pages; a `[...view]` catch-all for company/admin view-switching shells (avoids route explosion for what is really one shell with many internal views); dynamic params for public resource pages (`[roomId]`, `[username]`, `[companyId]`).

Within a dashboard page, the layout is consistently: a `dashboard-page-header` (eyebrow/title/subtitle) at the top, then one or more feature panels below. This consistency means a user learns the page grammar once and it applies everywhere.

## 4.10 Reusable UI patterns

Skeleton loaders (perceived-latency reduction, paired with `instant-load.ts`), empty states with actionable next steps (not just "no data"), toast/notification surfaces, tab lists with keyboard support, kanban cards, comparison bars, modals built on the shared focus-trap hook.

## 4.11 Design decisions summary

| Decision | Why |
|---|---|
| Dark-mode-first default | Reduces eye strain for a dashboard-heavy product used in long sessions; 10 selectable palettes still let users opt into a lighter feel |
| Utility-first Tailwind, no component-library dependency | Full control of a custom, multi-palette brand without fighting a library's opinions |
| Theme preference stored server-side on `User` | Follows the account across devices, not just the browser |
| Glassmorphism restricted to overlays | Keeps dense data screens legible; keeps the effect meaningful |
| Animation split: expressive on marketing, restrained on dashboards | Repeated-use screens optimise for speed and calm, not delight |
| No custom typography/spacing scale | Tailwind's defaults are already well-reasoned; inventing a scale would need independent justification this project doesn't have |

---

# SECTION 5 — FRONTEND ARCHITECTURE

## 5.1 Folder organization

```
frontend/
├── app/                    Next.js App Router — routes only, thin pages
│   ├── auth/{intern,company,admin}/
│   ├── dashboard/{intern (~22 routes), company, admin}
│   ├── interview/[roomId]   portfolio/[username]   company/[companyId]
├── components/             ~200 components, grouped by DOMAIN not type
│   ├── dashboard/{intern,company,admin,hiring,shared}
│   ├── interview/ auth/ portfolio/ calendar/ reports/ layout/ ui/ animations/
├── lib/                    ALL non-visual logic
│   ├── *-portal.ts         API facades per domain
│   ├── api-client.ts       single fetch wrapper
│   ├── session.ts          auth session storage + change events
│   ├── skill-gap-engine.ts 1257-line 3-pass skill matcher
│   ├── ai-hiring/          recruiter-side scoring engines
│   ├── ai-platform/        grounding/validation/orchestration (client)
│   ├── data/               static datasets (aptitude, DSA, roles, courses)
│   ├── theme/              palettes + theme API
│   └── use-*.ts            custom hooks
└── constants/  public/  scripts/
```

**Engineering decision — domain grouping, not type grouping. [VIVA]** No top-level `hooks/`, `containers/`, `pages/`. Everything a feature needs sits together; `lib/` holds logic, `components/` holds rendering, `app/` holds routing only.

## 5.2 Routing

| Pattern | Example | Why |
|---|---|---|
| Explicit segment | `dashboard/intern/resume/score` | Stable, individually prefetchable |
| Catch-all | `dashboard/company/[...view]` | One view-switching shell, no route explosion |
| Dynamic param | `interview/[roomId]`, `portfolio/[username]` | Public, resource-keyed |

`next.config.ts` rewrites legacy URLs (`/dashboard/companyHR`, `/dashboard/companyCEO`) to `/dashboard/company` — backward compatibility with zero duplicated pages.

## 5.3 Protected routes

Three-layer client guard: `use-auth-session` exposes `{loggedIn, role, permissions}`; dashboard layouts redirect to `/auth/<role>` on role mismatch and `/access-denied` on missing permission; `/session-expired` catches a failed refresh.

**[HONEST]** These are UX guards, not the security boundary. Real enforcement is server-side (`authMiddleware` → `allowRoles` → `permission.middleware` → `company-access.middleware`). A user editing `localStorage` renders a shell but every API call still 401s/403s.

## 5.4 Layouts

App Router nested layouts give each portal (`intern`, `company`, `admin`) its own persistent chrome (sidebar, header, notification bell) without re-mounting on every navigation within that portal.

## 5.5 State management **[VIVA — "why no Redux?"]**

No Redux/Zustand/global store. State is stratified:

| State kind | Mechanism | Why |
|---|---|---|
| Server data | `useState`+`useEffect` in the owning panel via portals | Panels are mostly independent resource views |
| Auth session | `localStorage` + custom `window` event `internai-auth-change` | Survives reload; reactive without a provider |
| Realtime | Socket manager singletons | One connection per app, shared via hooks |
| Ephemeral UI | Local component state | Never lifted further than needed |
| Practice progress | `localStorage` | Zero server cost for 500 concurrent test-takers |

**[HONEST]** Trade-off: two panels showing the same resource can briefly disagree. Prefetch schedulers and cache invalidation mitigate but don't eliminate this. A server-state library (TanStack Query/SWR) is the correct next step — not Redux, because the actual gap is request deduplication/cache coherence, not shared mutable state.

## 5.6 Component hierarchy

```
Page shell (app/**/page.tsx)      < 30 lines, header + one panel, no logic
   ↓
Feature panel (components/dashboard/**)   owns data + local state + layout
   ↓
Primitive (components/ui, layout)         no domain knowledge
```

Largest components (`interview-room-shell.tsx` 1034L, `company-dashboard-page.tsx` 1352L) are deliberate exceptions coordinating tightly-coupled state that splitting would only scatter across files.

## 5.7 Custom hooks (most important)

`use-auth-session` (session contract), `use-webrtc` (mesh peer connections, ICE, quality polling), `use-interview-socket`/`use-chat-socket` (realtime), `use-focus-trap`/`use-tablist-keyboard` (accessibility), `use-debounced-value`, `use-pagination`, `use-notification-unread`/`use-messaging-unread`.

## 5.8 API communication

`component → domain portal (lib/*-portal.ts) → apiRequest() in api-client.ts`. The client resolves the base URL (rewriting `localhost` to the browsing host for LAN access), normalises paths, attaches the Bearer token, sets JSON content-type only for non-`FormData` bodies, and **auto-refreshes on 401** with one retry (auth paths excluded to prevent a refresh storm). Failures become a typed `ApiRequestError{status, details}`.

## 5.9 Performance optimisations

Route-level code splitting (automatic), `optimizePackageImports` for icon/animation libraries, router `staleTimes` tuning, predictive prefetch schedulers, instant-paint skeletons, lazy-loaded 14,000+-line datasets, AVIF/WebP images, debounced inputs, pagination, versioned PWA service worker.

## 5.10 Most important reusable components

`dashboard-page-header`, tab lists (`use-tablist-keyboard`-driven), modals (focus-trapped), skeleton loaders, empty-state panels, kanban card, candidate comparison bar, notification toast surface.

## 5.11 Most important hooks

`use-auth-session`, `use-webrtc`, `use-interview-socket`, `use-focus-trap`, `use-pagination`.

## 5.12 Most important pages

`dashboard/intern/resume/score` (the deepest data view), `dashboard/intern/skill-gap`, `dashboard/company/[...view]` (recruiter shell), `interview/[roomId]`, `portfolio/[username]` (public).

## 5.13 Engineering decisions (frontend-specific)

Domain-grouped folders over type-grouped; portal-facade over direct `fetch`; no global store, server-state library is the acknowledged gap; lazy-loaded static datasets to protect the initial bundle; client-side practice engines to protect the free-tier database from 500 simultaneous test-takers.

---

# SECTION 6 — BACKEND ARCHITECTURE

## 6.1 Folder structure

```
backend/src/
├── app.js                  Express app: middleware chain, health, module mount
├── server.js               HTTP server, DB connect, sockets, scheduler, shutdown
├── seed.js                 Seed CLI
├── registry/index.js       MODULE_REGISTRY + mountModularApi()
├── shared/                 SHARED KERNEL
│   ├── config/ database/ middleware/ utils/ infrastructure/ socket/ logger/ constants/ data/
├── modules/<18 modules>/   routes · controllers · services · models · validators · constants · data
└── services/, controllers/, models/, constants/   ← LEGACY SHIM LAYER (strangler-fig migration)
```

**The shim layer [HONEST + VIVA]:** files like `src/services/roadmap.service.js` are single-line re-exports of the real module file. They exist because the codebase migrated to the modular structure incrementally via a script, keeping ~250 existing import paths alive without a big-bang rewrite — a textbook strangler-fig migration. It is also genuine debt: some newer code still imports through the shim. Correct end state: delete the shim layer once nothing depends on it.

## 6.2 Server lifecycle

```
BOOT  dotenv → assertRequiredEnv(MONGO_URI, JWT_SECRET) → resolvePort
      → connectDB → [dev only] auto-seed → bootstrapPlatformServices
      (Redis + optional Postgres, never fatal) → http.createServer
      → initChatSocket → initInterviewSocket → interviewScheduler.start → listen
HEALTH  /health (liveness) · /health/ready (Mongo + bootstrap) ·
        /health/detailed (module manifest) · /health/cache
SHUTDOWN  SIGTERM/SIGINT → scheduler.stop → io.close → server.close (drain)
          → mongoose.close → postgres pool close → exit(0), 10s force-exit timer
CRASH   unhandledRejection/uncaughtException → log with stack → exit(1)
```

**Liveness vs readiness [VIVA]:** liveness = "is the process alive"; readiness = "can it serve traffic". The distinction lets Render/Kubernetes hold traffic back during startup instead of routing into a half-initialised server.

## 6.3 Routes

`registry/index.js` holds a frozen `MODULE_REGISTRY` array; each entry has a **lazy router getter**, so routers are only required when mounted (cheaper startup, avoids circular-require surprises). `mountModularApi()` is called for both `/api` and `/api/v1` — versioning cost one line today instead of a migration later.

| Mount | Module | Mount | Module |
|---|---|---|---|
| `/auth` | authentication | `/interview` | interviews |
| `/intern` | students | `/calendar` | calendar |
| `/company`, `/companies` | companies | `/admin` | admin |
| `/internships` | internships | `/chat` | chat |
| `/applications` | applications | `/portfolios` | portfolio |
| `/ai` | ai | `/skills` | skills |
| | | `/candidates` | candidates |

**139 REST endpoints** (63 GET, 45 POST, 21 PATCH, 6 DELETE, 4 PUT).

## 6.4 Controllers

Thin, wrapped in `asyncHandler` (Express 4 doesn't catch rejected promises — without this a failing async handler hangs the request). Object-level authorisation lives here: a student may only score their own profile; only company/admin may pass an arbitrary `internId`. **[VIVA — OWASP A01 defence, Broken Object Level Authorization]**

## 6.5 Services

| Service | Responsibility |
|---|---|
| `resume-structured-parser` (925L) | Section detection + field extraction |
| `resume-intelligence-v2` (833L) | The 7-dimension scoring engine |
| `resume-quality` | Parse sanitisation + confidence |
| `scorer.service` | Rule signals + score assembly + optional ML call |
| `ai-orchestrator` | Grounding, cross-validation, confidence |
| `ai-gateway` | Cache + LLM-routing facade for `/api/ai/*` |
| `project-evaluation` | Verification, relevance, portfolio aggregate |
| `roadmap` | Missing-skill → phased plan |
| `interview-workflow` (520L) | Round lifecycle, notifications, reminders |
| `interview-room-service` (468L) | Room creation, join tokens, roster |
| `company-access` (204L) | HR scoping to assigned candidates |
| `portfolio` (576L) | Profile → public portfolio projection |
| `report-pdf` (660L) | PDFKit report composition |

## 6.6 Middleware

`auth.middleware` (Bearer verify + permission recompute), `role.middleware` (coarse role gate), `permission.middleware` (fine-grained key gate), `company-access.middleware` (139L, HR scoping), `validate.middleware`/`validate-object-id.middleware`, 5 configured upload variants (resume/certificate/logo/photo), `ai-rate-limit.middleware`, `request-id.middleware`, `error.middleware`.

## 6.7 Validation

Schema-level via Mongoose (enums, `required`), request-level via `validate.middleware` + `VALIDATION_RULES` constants (e.g. password ≥8 chars), and format-level via `validate-object-id.middleware` before any query reaches Mongo.

## 6.8 Error handling — the `AppError`-only contract

Services throw `new AppError(message, statusCode, details, {code, errors})`; `asyncHandler` forwards; one `errorMiddleware` translates everything (including Multer errors) into the uniform response envelope. No controller hand-writes an error response.

## 6.9 Response envelope **[VIVA]**

```json
{ "success": true, "message": "...", "data": {...}, "error": null,
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601", "pagination": {...} } }
```

Same shape for success and failure — one client parsing path, and `requestId` correlates a user complaint to one log line.

## 6.10 Authentication (backend) — see Section 2.5 diagram

Refresh tokens stored **SHA-256 hashed**, never plaintext. Authentication accepts **only** the Bearer header, never the cookie — structurally CSRF-immune because a cross-site page can't attach a custom header without passing CORS. Permissions recomputed server-side every request, never trusted from the JWT claim.

## 6.11 Authorization

```
role (intern|company|admin)
 └ admin   → adminRole → permission set (27 keys)
 └ company → companyAccountType (owner|ceo|hr) → owner/ceo full set, hr scoped 6 keys
             + company-access.middleware narrows hr to assigned candidates
```

`User.pre("save")` re-derives `permissions` on every write from role+sub-role — a client-supplied permission array can never persist. Fail-closed: an admin with no `adminRole` gets zero permissions.

## 6.12 Logging

Structured `logger` + `morgan` access logs, `requestId` on every response and error log line, `ActivityLog` collection for audit-relevant events (login, resume upload, verification decisions) with actor/entity/action/IP.

## 6.13 Caching — see Section 15 for full detail

Two-tier Redis→memory, read-through `remember()` helper, payload-hash cache keys for AI results, prefix-scoped invalidation.

## 6.14 Background jobs **[HONEST]**

There is **no job queue** (no BullMQ/Bull/Agenda). The only scheduled background work is the **interview reminder scheduler** (`interview-scheduler.service.js`), a simple in-process interval-based scheduler firing 24h/1h/15m reminders — not a durable queue with retries. Resume parsing and PDF generation run synchronously inline in the request. A real job queue is the correct fix for both and is on the roadmap (Section 18).

## 6.15 Backend engineering decisions

Fail-fast startup (`assertRequiredEnv`); graceful shutdown with a force-exit timer; `app.set("trust proxy", 1)` (required behind Render's TLS-terminating proxy or rate-limiting keys on the wrong IP); auto-seed gated to non-production; feature flags (`ENABLE_AI`, `ENABLE_CHAT`, `ENABLE_INTERVIEW_ROOMS`, `ENABLE_RECORDINGS`, `ENABLE_3D_PORTFOLIO`) to disable subsystems per environment without a code change.

---

# SECTION 7 — DATABASE DESIGN

## 7.1 Database architecture: MongoDB primary + optional Postgres

| Reason for MongoDB | Detail |
|---|---|
| Schema volatility where it matters | `resume.parsed`/`analysis` are `Mixed` — shape changes per parser/scorer version |
| Document-shaped access | `InternProfile` read as one unit replaces 6–8 SQL joins |
| Natural arrays | `skills[]`, `rounds[]`, `statusHistory[]` map directly |
| Free tier | Atlas M0, 512 MB |

**[HONEST]** The User↔Application↔Internship↔Company core is genuinely relational and gets no referential integrity or multi-document transactions from MongoDB. Compensated with compound unique indexes and application-level invariants. A Postgres core with a JSONB column for `parsed` would have been a defensible alternative — the deciding factor was AI-output schema volatility and free-tier familiarity.

## 7.2 Collections (18)

| Collection | Module | Purpose | Key fields |
|---|---|---|---|
| `User` | authentication | Credentials, role, permissions | `email`(unique), `passwordHash`, `role`, `adminRole`, `permissions[]`, `refreshTokenHash`, `isDeleted` |
| `OtpVerification` | authentication | Signup/reset OTPs | `email`+`purpose`(unique), `expiresAt`(**TTL**) |
| `InternProfile` | students | Student profile + resume | `user`(unique ref), `skills[]`, `resume{filePath,text,score,analysis,parsed}` |
| `Certification` | students | Certificates + verification | `intern`, `status`, `certificateUrl` |
| `CompanyProfile` | companies | Company record | `companyName`, `verificationStatus`, `isDeleted` |
| `Internship` | internships | Posting | `company`, `skillsRequired[]`, `prioritySkills[]`, `experienceRequirement`, `minimumCgpa`, `isActive` |
| `Application` | applications | Application + pipeline | `internId`, `internshipId`, `status`, `statusHistory[]`, `rounds[]`, `relevanceScore` |
| `HiringScoringTemplate` | ats-scoring | Per-role recruiter weights | `roleKey`, `weights{}`, `enabled{}` |
| `InterviewRoom` | interviews | Room + round | `applicationId`+`roundId`(unique) |
| `Notification` | notifications | In-app notifications | `user`, `type`, `metadata.reminderKey` |
| `ChatConversation`/`ChatMessage` | chat | Messaging | `internProfile`+`company`(unique) / `conversation`+`createdAt` |
| `CalendarDayEntry` | calendar | Personal calendar | `user`,`dateKey`,`entryType` |
| `InternPortfolio` | portfolio | Public portfolio | `status`, `username` |
| `Skill` | skills | Skill taxonomy | `name`,`normalizedName`(**text index**) |
| `ActivityLog` | analytics | Audit trail | actor, entity, action, ip |
| `ReportedCompany` | admin | Abuse reports | `status`,`createdAt` |
| `ReportSequence` | reports | Report numbering | `code`+`year`(unique) |

## 7.3 Relationships

```
User 1──1 InternProfile          User 1──1 CompanyProfile
CompanyProfile 1──N Internship
Internship 1──N Application ──N──1 InternProfile   (unique internId+internshipId)
Application 1──N rounds ──1──1 InterviewRoom        (unique applicationId+roundId)
InternProfile 1──N Certification    InternProfile 1──1 InternPortfolio
(InternProfile,CompanyProfile) 1──1 ChatConversation 1──N ChatMessage
User 1──N Notification | CalendarDayEntry | ActivityLog
```

**Embed vs reference rule [VIVA — near-certain]:** reference wherever a child is queried independently or grows unbounded (applications, messages, notifications); embed wherever a child is bounded and only ever read with its parent (`statusHistory`, `rounds`, `educationDetails`, `profileSections`).

## 7.4 Indexes (21) and the query each serves

| Index | Query served |
|---|---|
| `User.email` unique | Login, one account per email |
| `User{role,isDeleted,createdAt:-1}` | Admin lists, newest-first, excluding soft-deleted |
| `OtpVerification{email,purpose}` unique | One live OTP per purpose |
| `OtpVerification{expiresAt}` TTL 0 | **Automatic deletion of expired OTPs** — no cron |
| `Application{internId,internshipId}` unique | Duplicate-application prevention at the DB level |
| `Application{companyId,status,createdAt:-1}` | Recruiter pipeline board — hottest query in the app |
| `Internship{createdAt:-1,isActive,isDeleted}` | Public listing feed |
| `ChatConversation{internProfile,company}` unique | One thread per pair |
| `ChatMessage{conversation,createdAt:-1}` | Message pagination |
| `InterviewRoom{applicationId,roundId}` unique | One room per round |
| `Skill{name,normalizedName}` text | Skill autocomplete/search |
| `Notification{user,type,"metadata.reminderKey"}` | Reminder de-duplication |

**ESR principle [VIVA]:** Equality, Sort, Range field ordering in compound indexes. `{companyId, status, createdAt:-1}` puts equality first and sort last, so one index serves both the filter and the ordering with no in-memory sort.

## 7.5 Important fields

`InternProfile.resume{score, analysis, parsed}` (the scoring output), `Application.statusHistory[]`/`rounds[]` (append-only pipeline audit), `User.permissions[]` (always server-derived, never client-writable in practice due to the pre-save hook).

## 7.6 Data lifecycle

Soft delete (`isDeleted`/`deletedAt`/`deletedBy`) on users/companies — every list query filters it, audit trail preserved. TTL is the only automatic deletion in the system (OTPs). Optimistic concurrency retry (`with-version-retry.js`) handles concurrent profile updates instead of pessimistic locking.

## 7.7 CRUD flow (representative — Application)

```
CREATE  POST /applications        → unique-index-protected insert → notification fan-out
READ    GET /applications?status  → paginated, index-served, `.lean()` where read-only
UPDATE  PATCH /applications/:id/status → statusHistory[] append → notification → activity log
DELETE  (soft) — no hard delete path for applications; withdrawn is a status, not a removal
```

## 7.8 Schema design decisions

`Mixed` type for `resume.parsed`/`analysis` (schema-volatile AI output, normalised in application code via `sanitizeParsed()`); compound unique constraints as real invariants rather than only application checks; embedding bounded, always-together data; `profileSections{}` structured object for the richer profile-builder UI alongside the simpler flat `skills[]`/`education[]` arrays used by the original parser — two representations of similar data kept deliberately, because the profile-builder and the resume parser were built at different times and reconciling them fully was judged lower priority than shipping.

## 7.9 Scalability

Vertical first (Atlas tier upgrade), then read replicas for analytics/listing queries, then sharding on `companyId` for applications if write volume grows. `resume.text` (large, rarely queried directly) is a candidate to move out of the hot document into object storage at scale.

---

# SECTION 8 — COMPLETE AI ARCHITECTURE

## 8.1 The central AI philosophy **[VIVA — the answer to "how does your AI work?"]**

> **Scoring logic is deterministic and rule-based. Language models are an optional enhancement layer that never owns a number.**

| Requirement | Why an LLM alone fails | What we do instead |
|---|---|---|
| Reproducibility | Same resume, different score each run — indefensible | Pure functions over structured data |
| Explainability | "The model said 68" is not feedback | Every point traced to `weight × dimension score` |
| Fairness/auditability | Model bias is invisible and unappealable | Weights are a frozen, inspectable constant table |
| Cost | Per-call billing on a free-tier project | Local computation; LLM calls cached + rate-limited |
| Availability | External API outage breaks the core feature | Local heuristics are the *default* path in production |

LLMs are used for what they're actually good at: turning structured facts into readable prose. A wrong sentence is recoverable; a wrong score is not.

## 8.2 Three-layer architecture (see Section 2.9 diagram)

Exists on **both sides**: backend `ai-orchestrator.service.js`, frontend `ai-platform/{grounding-engine,validation-engine,orchestrator}.ts`. Client-side gives instant feedback; server-side is authoritative.

### Cross-validation mathematics

```
delta      = |primary − secondary|
conflict   = delta > 2 × tolerance
confidence = base − min(35, delta×2)   if conflict   → conflict_detected(<50) or partial
           = base + 10                if delta ≤ 3   → validated
           = base − delta             if delta > tol  → partial
final confidence = mean(all validations), clamped 0–100
tier: ≥85 high · ≥60 medium · else low
```

**Why cross-validate? [VIVA]** Two independent estimates agreeing is evidence; one estimate alone is an assertion. The system reports its own uncertainty instead of projecting false precision.

## 8.3 AI provider ladder (graceful degradation)

```
1. ENABLE_AI off?             → localFallback() immediately
2. Per-user rate limit        → 429 if exceeded (default 10/min)
3. Redis cache lookup         → hit? return (24h TTL)
4. AI_PREFER_LOCAL_HEURISTICS (true in production) → local heuristics FIRST
   else → try Groq → try HuggingFace
5. All fail                   → localFallback() {fallbackUsed:true}
6. No fallback available      → 503 AppError
```

`batchRouteCompletions(items, handler, batchSize=5)` — bounded-concurrency batching so a 60-applicant ranking never fires 60 simultaneous calls.

## 8.4 AI feature catalogue — full template per feature

### 8.4.1 Resume Parsing & Extraction

| | |
|---|---|
| Purpose | Convert unstructured document into structured, comparable fields |
| Input | PDF/DOCX/TXT ≤5MB |
| Output | `{name,email,mobile,links,location,summary,skills[],projects[],education[],certifications[],experience[],achievements[],languages[],skillCategories{}}` |
| Workflow | text extraction → normalisation → heading detection (strong classifier on explicit headings, then weak heuristic classifier) → 14 per-section extractors → sanitise → quality report |
| Prompt strategy (optional LLM path) | Strict-JSON system prompt: exactly 4 keys, `[]` for absent sections, "No prose, no markdown, no extra keys", input truncated to 4000 chars |
| Reasoning strategy | Deterministic rule/regex classification is primary; LLM path is a parallel, optional enhancement whose output is JSON-validated |
| Post-processing | `sanitizeParsed()` — type coercion, dedupe, length caps, skill canonicalisation |
| Error handling | `JSON.parse` failure on the LLM path silently falls back to the deterministic parse; empty extraction → 400 to the user |
| Caching | LLM path cached 24h by payload hash |
| Fallback | Deterministic parser is both the default *and* the fallback |
| Limitations [HONEST] | Multi-column/graphics-heavy PDFs still interleave lines; skill dictionary is curated so rare technologies are missed; no OCR for image-based resumes |

### 8.4.2 Resume Score — see Section 9 in full

### 8.4.3 Skill Gap Analysis

| | |
|---|---|
| Purpose | Show exactly which required skills are present, partial, or missing — with evidence |
| Input | Parsed resume + profile + target (role preset or specific posting) |
| Output | Per-skill `{status, proficiency, tier, confidence, confidenceTier, matchLayer, verified, explanation, evidence[]}` + category summary + overall match% |
| Workflow | **3-pass matching**: Pass 1 exact/canonical match on declared skills; Pass 2 semantic equivalents + evidence from projects/experience/certifications; Pass 3 contextual/implicit inference |
| Reasoning strategy | Rule-based tiered evidence weighting, not a learned model |
| Post-processing | Category summary bars, progress-bar visual mapping |
| Error handling | Missing resume/target → `insufficient data` grounding result, not a guessed percentage |
| Caching | Deterministic result cached 30 min |
| Fallback | Pure computation; no external dependency to fail |
| Limitations [HONEST] | Semantic equivalence is a hand-maintained dictionary, not embeddings — an unlisted synonym reads as missing |

Guardrails: a posting with zero required skills scores 100% (vacuous truth); if no required skills are missing, the percentage is forced to exactly 100 (rounding-proof).

### 8.4.4 Career Roadmap

| | |
|---|---|
| Purpose | Convert the gap into an ordered, actionable learning plan |
| Input | `targetRole` + `currentSkills[]` |
| Output | `{targetRole, requiredSkills[], missingSkills[], matchPercent, roadmap:[{skill,priority,phase,suggestions[3]}]}` |
| Workflow | Normalise role key → look up `ROLE_SKILL_TEMPLATES` → diff → order missing set → assign priority (first 3 high, next 3 medium, rest low) + phase (beginner/intermediate/advanced) → 3 phase-appropriate actions per skill |
| Reasoning strategy | Template lookup + positional ordering — no learned ranking |
| Fallback | N/A — pure computation |
| Limitations [HONEST] | Ordering is template position, not market demand or a learning-dependency graph; no time estimates |

### 8.4.5 Internship Recommendation / Job Matching — full treatment in Section 10

### 8.4.6 Candidate Matching / Applicant Ranking (recruiter side) — full treatment in Section 10

### 8.4.7 Project Evaluation

| | |
|---|---|
| Purpose | Judge whether claimed projects are real, substantial, relevant |
| Input | Projects from parsed resume + profile sections + free-text lines, deduplicated by normalised title |
| Output | Per-project verification (`complete`/`incomplete`/`title_only`), detected stack, scope tags, aggregate quality/confidence/role-relevance |
| Workflow | base 35 pts → +20 (≥2 technologies) → +15 (description>80 chars) → +15 (GitHub link) → +15 (demo link), capped 100 → × role-relevance multiplier `0.4+0.6×overlapRatio` → +8 portfolio bonus if any GitHub link |
| Also used for | Verifying claimed skills — distinguishing a skill *listed* from a skill *demonstrated* in a project |
| Limitations [HONEST] | Links are not fetched or validated; a fabricated GitHub URL still earns its points |

### 8.4.8 Aptitude/DSA Practice Engine

| | |
|---|---|
| Purpose | Offline-capable practice with proctoring |
| Input | Curated question banks (14,000+ lines aptitude, 2,900+ lines DSA) |
| Workflow | Client-side test loop, `localStorage` progress, fullscreen + tab-switch proctoring, result validation through the same grounding/validation pipeline |
| Why client-side [VIVA] | 500 simultaneous test-takers writing to a 512MB free-tier cluster would overwhelm it; moving the loop entirely into the browser costs zero server resources |
| Limitations [HONEST] | Answers are client-inspectable — a practice tool, not a graded/proctored exam |

### 8.4.9 Interview AI **[HONEST — do not oversell]**

Interview *infrastructure* is complete: WebRTC mesh rooms, scheduling with a reminder scheduler, roster, screen share, quality polling, structured feedback, pipeline integration. The **AI mock-interview module is a placeholder** — the page renders an empty-state panel; no automated interview simulation runs yet. Question banks and evaluation pipelines exist for DSA/aptitude but are not wired into a live mock-interview flow. Recovery framing: *"the surrounding contract — question source, scoring pipeline, feedback storage — is already built for the DSA engine, so mock-interview is an integration task, not a new subsystem."*

### 8.4.10 Optional ML Resume Classifier (Python)

| | |
|---|---|
| Purpose | Predict a job category from resume text as a supplementary signal |
| Input | Raw resume text |
| Output | `{resumeScore, predictedCategory (1 of 20 categories), confidence, scoreSource}` |
| Workflow | Flask endpoint → `clean_resume()` regex normalisation → TF-IDF vectorise → pickled sklearn classifier `.predict()` → quality score = `confidence×0.75 + lengthScore×0.2 + sectionBonus×0.05` |
| Error handling | 5s `AbortController` timeout, 2 retries; failure → warning string attached to the response, never an error thrown to the user |
| Caching | Not separately cached (disabled by default) |
| Fallback | Attached as `mlScorerSignal`, **explicitly never blended into `resumeScore`** — toggling the flag cannot change a student's score |
| Limitations [HONEST] | Disabled by default (`SCORER_ENABLED=false`); advisory only |

## 8.5 AI cost & abuse controls

| Control | Value |
|---|---|
| Response cache | 24h TTL, `sha256(payload)` key |
| Deterministic result cache | 30 min |
| Per-user AI rate limit | 10 req/min |
| Batch size | 5 concurrent |
| Local-first flag | `AI_PREFER_LOCAL_HEURISTICS=true` in production |
| Prompt truncation | 4000 chars |
| Global API limit | 400 req/15min/IP |

---

# SECTION 9 — RESUME SCORE ENGINE (deepest section)

## 9.1 What it is

A deterministic, explainable, context-aware ATS scoring engine. Given a resume and (optionally) a specific internship posting, it returns a 0–100 score, a 7-dimension breakdown, itemised deductions/bonuses, 6 composite scores, and ranked improvements.

**Entry point:** `scorer.service.js → computeResumeScore()`. **Core engine:** `resume-intelligence-v2.service.js → computeResumeIntelligenceV2()`. **Weights:** `constants/resume-intelligence-v2.js`.

## 9.2 Step-by-step workflow

```
1  UPLOAD          multer: mime+ext check, ≤5MB, randomised filename
2  TEXT EXTRACT    pdf-parse (page boundaries) | mammoth | utf8 → normalize
3  PARSE           structuredResumeParse(text) → headings → sections → 14 extractors
4  SANITISE        sanitizeParsed() — coerce types, dedupe, cap lengths, canonicalise skills
5  QUALITY         qualityReport() — 6 checks → confidence, isReliable
6  TEXT SIGNALS    analyzeResumeText(text, targetSkills) — ATS/verbs/numbers/sections
7  DIMENSIONS      computeResumeIntelligenceV2() — 7 dimensions, 0–100 each
8  COMPOSITE       overall = Σ(score × weight) + 6 derived composites
9  CONFIDENCE      if !quality.isReliable → overall ×= quality.confidence
10 EXPLAIN         buildScoreExplanation() → deductions[] + bonuses[]
11 VALIDATE        validateResumeExtraction() → cross-validated confidence
12 PERSIST         InternProfile.resume{} → activity log → cache invalidation → portfolio sync
13 RENDER          /dashboard/intern/resume/score
```

## 9.3 The scoring formula & the rule engine that underlies it **[VIVA]**

```
overallScore = Σ(dimensionScore_i × weight_i)  for i=1..7
if quality.confidence < 0.75: overallScore ×= quality.confidence
overallScore = clamp(round(overallScore), 0, 100)
```

| # | Dimension | Weight | Max points |
|---|---|---|---|
| 1 | Keyword Match | **0.35** | 35 |
| 2 | Technical Skills Match | 0.15 | 15 |
| 3 | Projects & Achievements | 0.15 | 15 |
| 4 | Experience Match | 0.10 | 10 |
| 5 | Education Match | 0.10 | 10 |
| 6 | Structure & Formatting | 0.10 | 10 |
| 7 | Certifications | 0.05 | 5 |
| | **Total** | **1.00** | **100** |

**"This is a rule engine, not a trained model" — say this explicitly.** Every dimension is a deterministic function of parsed fields and (optionally) posting requirements. There is no ML classifier deciding these scores; the only ML component in the whole scoring pipeline is the optional, off-by-default, purely-advisory Python classifier (Section 8.4.10, Section 11).

**Why these weights [VIVA]:** rebalanced for a student/internship platform — keyword+skill matching dominates because that's what an ATS/first-pass recruiter keys on; projects tripled because projects are the primary signal a student actually has; experience roughly halved because internships must not be scored like senior hiring; certifications are a small bonus, never a gate.

**⚠ Known inconsistency [HONEST]:** several JSDoc comments still describe pre-rebalance weights (e.g. "Keyword Match (45%)"). `DIMENSION_WEIGHTS` is authoritative and is what actually executes.

## 9.4 PDF/document extraction

`pdf-parse` preserves per-page boundaries and joins with double newlines (reduces line-shuffle artefacts vs a flat text dump); `mammoth` extracts clean raw text from DOCX; plain `.txt` is read directly. All three funnel through `normalizeExtractedText()` — collapses whitespace, strips page-number markers, trims lines.

## 9.5 Text preprocessing

`cleanResumeText()`: strips URLs, RT/cc noise, hashtags, mentions, punctuation, non-ASCII characters, collapses whitespace, lowercases. `preprocessText()` further tokenises, keeps only alphabetic tokens, and removes a ~40-word stop-word list — this feeds the legacy v1 cosine-similarity scorer specifically (see Section 11 for why two paths exist).

## 9.6 Entity extraction

`structuredResumeParse()`: line splitting → heading detection (`isLikelyHeading`) → section classification (a **strong classifier** on explicit headings like "PROJECTS", "EDUCATION", falling back to a **weak heuristic classifier** on line content) → `splitSections()`. Then 14 dedicated extractors: name, email, mobile, links, location, summary, skills, projects (with techStack/github/demo sub-extraction), education, certifications, experience, achievements, languages.

## 9.7 Skill extraction & keyword normalization

Skills are extracted from the declared skills section **and** cross-referenced against project tech stacks. Every skill is passed through `canonicalSkill()`/`displaySkill()` — a normalisation layer so `Node.js`, `Node`, `NodeJS`, `node js` all collapse to one canonical form before any matching happens. Without this, a naive substring/exact check would miss real matches and produce unfair deductions. `textMentionsSkill()` performs the same normalisation when checking whether a skill is *mentioned* in free text (used across keyword matching, certifications relevance, and ATS scoring).

## 9.8 ATS compatibility checking (the rule layer)

`analyzeResumeText()` runs independently of the 7 dimensions and feeds several of them:

| Check | Method | Signal |
|---|---|---|
| Email/phone/LinkedIn | Regex | Contact-completeness score |
| Section coverage | 6 hint keywords present in text | `sectionScore` |
| Length | Word-count bands (350–900 ideal) | `lengthScore` |
| Quantified achievements | Regex for `%`, `$`, `N+`, `Nx`, `Nk`, number+noun patterns | `quantScore = min(100, count×18)` |
| Action verbs | 34-verb dictionary, word-boundary matched | `verbScore = min(100, count×15)` |
| Keyword alignment | `textMentionsSkill` against target skills | `skillsScore` |

```
atsScore = (email?30)+(phone?25)+(linkedin?15)+sectionScore×0.3
ruleScore = ats×0.2 + content×0.25 + impact×0.2 + skills×0.2 + structure×0.15   ← diagnostic only, NOT the headline score
```

## 9.9 Project evaluation — see Section 8.4.7 for the full formula

Feeds Dimension 3 (Projects & Achievements) directly.

## 9.10 Education evaluation (Dimension 5, 10%)

Only evaluated against a posting's **stated** requirements. Degree matching uses a synonym table (B.Tech ≡ btech ≡ Bachelor of Technology ≡ B.E ≡ BE, and 9 similar groups) plus bidirectional substring containment — an exact string comparison would unjustly fail an equivalent qualification.

```
if posting states education requirement:
  no education data on file → 40
  else start at 100, deduct: −40 degree mismatch, −30 branch mismatch,
       −20 CGPA below minimum, −10 CGPA required but absent
else: education present → 100, absent → 60 (never penalised)
```

## 9.11 Experience evaluation (Dimension 4, 10%) — the fairness rule

```
posting states "0 months / fresher / entry-level"  → score 100, no penalty possible
posting states N months AND candidate has experience → 100
posting states N months AND candidate has NONE       → 40 (the ONLY deduction case)
no posting selected: 0 entries → 60+bonus (never penalised) · n entries → 70+bonus (rewarded)
```

**Design rule: never penalise a student for being a student.** A deduction only occurs when the posting *states* a requirement **and** the candidate genuinely lacks any experience entry.

## 9.12 Certification evaluation (Dimension 7, 5% — bonus-only)

```
no certifications           → 0
scoped, 0 relevant          → 10
scoped, n relevant          → 50 + min(50, n×20)
unscoped                    → 40 + min(60, n×18)
```

Relevance is decided by scanning `"<name> <issuer>"` for any target skill — irrelevant certifications are still *listed* to the student but don't inflate the score.

## 9.13 Formatting evaluation (Dimension 6, 10%)

```
sectionCoverage = presentSections/7 × 100
lengthFit = 100 if 280≤words≤950, 75 if ≥200, else 45
score = sectionCoverage×0.45 + formattingQuality×0.30 + readability×0.15 + lengthFit×0.10
```

## 9.14 Composite scores

```
overall             = Σ(dimension × weight)                          [headline]
ats                 = keyword×0.5 + structure×0.25 + completeness×0.25
technicalStrength   = technicalSkills×0.6 + keyword×0.4
projectStrength     = projectsAchievements
recruiterReadiness  = overall×0.35 + projectStrength×0.25 + technicalStrength×0.2 + ats×0.2
```

`recruiterReadiness` weights demonstrable work more heavily than raw keyword coverage — a different question from `overall`.

## 9.15 Recommendation generation

Four sources, deduplicated: (1) per-dimension suggestions when a dimension underperforms; (2) category-templated skill-gap recommendations (Web Dev → "build a small project using X"; Cloud → "deploy an existing project to X"; DevOps → "set up X for one of your projects"); (3) rule-layer improvements (missing contact info, weak verbs, few quantified achievements); (4) composite triggers (gaps containing `docker|kubernetes|aws|deployment` → "add a cloud deployment project"). Category lookup is **exact-match only**, not substring — a substring check would classify `mongodb` under *Go* (because "mongodb" contains "go").

## 9.16 The explanation engine — arithmetic derivation

```
maxPoints    = round(weight×100)
earnedPoints = round(weight×score)
delta        = earnedPoints − maxPoints
delta<0      → deduction {points, dimension, reason}
score≥85     → bonus {points, dimension, reason}
```

**Every number shown to the user derives from `weight × score`. Nothing is separately invented.** This is the strongest defensible property of the engine. **[VIVA]**

## 9.17 AI's contribution to this engine — stated precisely

The score itself is **100% rule-based**. The only AI/ML touchpoint in the resume-score path is: (a) an *optional* LLM-assisted parse pass that can supplement the deterministic parser (never overriding it on failure — falls back silently), and (b) the *optional, disabled-by-default* Python ML classifier attached as an advisory `mlScorerSignal` that is never blended into `resumeScore`. **If asked "how much AI is in the resume score" — the honest answer is "none, by design; AI is only in an optional prose/extraction layer around it."**

## 9.18 Worked example

**Input:** 3rd-year CSE student, 420-word resume, 8 skills, 3 projects (2 GitHub-linked), B.Tech CGPA 8.1, 2 certifications (1 relevant), no work experience.
**Target:** "Backend Developer Intern" — required `[node.js, express.js, mongodb, postgresql, sql, git, docker, api design]`, preferred `[redis, aws, kubernetes]`, "Freshers welcome", B.Tech required, min CGPA 7.0.

| Dimension | Score | Weight | Points |
|---|---|---|---|
| Keyword Match | 57 (5/8 required, 1/3 preferred) | 0.35 | 19.95 |
| Technical Skills | 63 | 0.15 | 9.45 |
| Projects & Achievements | 77 | 0.15 | 11.55 |
| Experience | 100 (no requirement stated) | 0.10 | 10.00 |
| Education | 100 (matches, CGPA ≥ min) | 0.10 | 10.00 |
| Structure | 82 | 0.10 | 8.20 |
| Certifications | 70 (1 of 2 relevant) | 0.05 | 3.50 |
| | | | **72.65** |

Parse quality confidence 0.82 (≥0.75, reliable) → **no scaling** → **final score 73/100**.

**Deductions shown:** −15 Keyword Match ("mention PostgreSQL, Docker, API design"), −6 Technical Skills ("add evidence for PostgreSQL, Docker, SQL"), −3 Projects ("add deployment links, quantify impact"), −2 Structure, −2 Certifications.
**Bonuses:** +10 Experience, +10 Education, +8 Structure.
**Roadmap:** high priority → PostgreSQL, Docker, API design (beginner phase).

## 9.19 Flowchart

```
Resume file → extract text (empty? → 400 error) → structuredResumeParse
   → sanitize + quality → analyzeResumeText (ATS/verbs/numbers)
   → internshipContext provided?
        yes → score vs posting's actual required/preferred skills, experience, degree, CGPA
        no  → score vs TARGET_ROLE_PROFILES core/emerging skills (no penalty for unstated reqs)
   → 7 DIMENSIONS scored independently
   → overall = Σ(score×weight)
   → quality.isReliable==false? → overall ×= confidence
   → composites + scoreExplanation + skillIntelligence
   → validateResumeExtraction (3 cross-validations → confidence tier)
   → optional ML scorer attached as mlScorerSignal (never blended)
   → persist → invalidate cache → UI: score + breakdown + fixes
```

## 9.20 Known weaknesses **[HONEST]**

1. Keyword matching is lexical, not semantic — "Built REST services in Fastify" doesn't match a required "API design" keyword.
2. **Two scoring paths coexist**: `/api/intern/resume/score` uses v2; the legacy `/api/ai/resume-score` gateway still calls v1 cosine-similarity `calculateResumeScore()` — can report a different number for the same profile.
3. Doc-comment drift on dimension weights.
4. No ground truth — weights are reasoned, not learned from labelled hire outcomes.
5. Gameable by keyword-stuffing (blunted, not eliminated, by evidence verification and relevance multipliers).
6. Layout fragility on multi-column/graphics-heavy PDFs.

---

# SECTION 10 — AI JOB MATCHING ENGINE

## 10.1 How resumes are compared with jobs — state this precisely **[VIVA]**

**No embeddings, no vector database, and no semantic-similarity model are used for job matching.** Matching is **deterministic keyword/taxonomy matching** over normalised, canonicalised skill lists. The single source of truth is `computeSkillMatch(internSkills, requiredSkills, preferredSkills)` in `shared/utils/compute-skill-match.js` — used by the resume score, the standalone skill-gap page, internship recommendations, and applicant ranking, so all four surfaces can never disagree with each other.

```
requiredMatchPercent  = matchedRequired.length / requiredSkills.length × 100
preferredMatchPercent = matchedPreferred.length / preferredSkills.length × 100  (null if none)
overallScore = preferredMatchPercent===null ? requiredMatchPercent
                                             : requiredMatchPercent×0.8 + preferredMatchPercent×0.2
```

Guardrails: zero required skills → 100% (vacuous truth, not 0%); zero missing required skills → percentage forced to exactly 100 (rounding-proof).

## 10.2 How skills are matched

Both the intern's skill list and the posting's required/preferred lists are run through `normalizeSkillList()` (canonicalisation: `Node.js`/`Node`/`NodeJS` → one form) before comparison — **exact match on the canonical form**, not fuzzy/semantic similarity. `textMentionsSkill()` additionally checks whether a canonical skill is *mentioned in free text* (used for keyword-match scoring against resume text, distinct from the structured skill list check).

## 10.3 How missing skills are detected

`missingRequiredSkills = normalizedRequired.filter(skill => !internSkillSet.has(skill))` — a plain set-difference. The frontend skill-gap engine additionally attempts to find **evidence** for a nominally-missing skill (in project tech stacks, experience descriptions, certifications) via its 3-pass matching before finalising it as `missing` rather than `partial`.

## 10.4 How strengths and weaknesses are generated

**Strengths:** template-triggered ("Strong programming language foundation" if ≥2 languages present; "Good project diversity" if ≥2 projects), plus whatever the rule-based text analyser (`analyzeResumeText`) independently flags (contact completeness, quantified achievements, action-verb usage).
**Weaknesses:** any scoring dimension below 55 contributes its top suggestion as a weakness; missing required skills are listed explicitly.

## 10.5 How recommendations are generated

Category-templated per missing skill (Section 9.15) — a lookup table mapping a skill's category (Web Development, Cloud, DevOps, AI/ML, etc.) to a specific actionable sentence, **not** a generatively-written recommendation. Composite triggers add broader suggestions (e.g. any gap matching `docker|kubernetes|aws|deployment` → "add a cloud deployment project").

## 10.6 How ranking works

**Student-side (internship recommendations):** `recommendInternships()` computes `overallRecommendationScore` per posting via `computeSkillMatch`, then sorts descending by score, tie-breaking on `requiredSkillMatchPercent`, then alphabetically on role name — a fully deterministic, stable sort (unstable ordering would shuffle the list on every refresh with no underlying data change).

**Company-side (applicant ranking), backend formula:**
```
finalScore = requiredSkillMatch×0.55 + resumeScore×0.20 + projectScore×0.25
```

**Company-side, frontend recruiter engine** (`lib/ai-hiring/master-evaluation-engine.ts`) — richer and **configurable per role**:
```
weightedContribution = rawScore × weight / Σ(enabled weights)
```
across 5 factors (skills, tests, projects, experience, resume), with per-role default templates (Section 11 has the full weight table) that a company can override and persist as a `HiringScoringTemplate`.

## 10.7 How candidate comparison works

The candidate comparison workspace (`candidate-comparison-workspace.tsx`) renders multiple candidates' `ScoreBreakdownItem[]` (factor, label, rawScore, weight, weightedContribution) side by side — it is a **presentation layer over the same deterministic evaluation engine**, not a separate comparison algorithm.

## 10.8 Are embeddings used? Is cosine similarity used? **[VIVA — answer precisely]**

**Embeddings: no.** No embedding model (OpenAI embeddings, sentence-transformers, or any vector representation) is used anywhere in job/skill matching.

**Vector database: no.** No Pinecone, Weaviate, FAISS, pgvector, or any vector store exists in this codebase.

**Cosine similarity: yes, but only in one place, and not for job matching.** `lib/course-recommendation.ts` implements a classic **TF-IDF + cosine similarity** algorithm (term-frequency vectors over course descriptions vs. a query built from missing skills) to rank NPTEL course recommendations. This is client-side, deterministic, and does not involve any trained model or external embedding API — it is textbook Information Retrieval (TF-IDF), not a "semantic" or neural technique. The legacy v1 resume scorer (Section 9.20, weakness #2) also uses a similar cosine-similarity-over-term-frequency approach, inspired by an open-source resume-scoring technique (sieve.ai), for its single similarity number — again TF-IDF, not embeddings.

**So: job/skill matching = deterministic keyword/taxonomy matching. Course recommendation = TF-IDF cosine similarity. Prose generation = optional LLM. No component uses embeddings, a vector database, or a trained semantic-matching model.** State this exactly if asked — it is the correct, complete answer and should not be hedged.

## 10.9 Job matching flowchart

```
Student skills (normalised, canonicalised)      Posting required/preferred skills
              │                                              │
              └───────────► computeSkillMatch() ◄────────────┘
                                    │
                    matched / missing (exact canonical-form match)
                                    │
                    requiredMatch×0.8 + preferredMatch×0.2
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                        ▼
  STUDENT: rank postings                              COMPANY: rank applicants
  by score, stable sort                                weighted 5-factor formula,
                                                        configurable per role
```

---

# SECTION 11 — AI MODELS & ALGORITHMS

## 11.1 Foundation models used

**This project uses pre-trained foundation models via API for optional prose generation. It does not train, fine-tune, or host any custom deep-learning model.** The one exception — a small supervised scikit-learn classifier — is trained offline outside this codebase's runtime and shipped as a static artifact; it is not trained or retrained by the application itself.

| Model/Component | Provider | Purpose | Where used | Strengths | Limitations |
|---|---|---|---|---|---|
| `llama-3.1-8b-instant` | Groq (hosted inference) | Prose: resume-field extraction assist, match explanations | `ai-provider.router.js` primary | Very low latency, free tier | Smaller model; used for text only, never a score |
| `Mistral-7B-Instruct-v0.2` | HuggingFace Inference API (hosted) | Same as above, fallback | `huggingface.provider.js` | Redundancy when Groq unavailable | Slower, variable availability |
| TF-IDF vectoriser + classifier (joblib/pickle) | Self-hosted (this repo, `backend/scorer/`) | Predict 1-of-20 job categories from resume text as an advisory signal | Optional Python Flask service | A genuine trained supervised-learning artifact | Disabled by default; advisory only, never blended into the score |

**No other AI model exists in the system.** No embedding model, no vector database client, no image-generation model, no speech-to-text model, no custom-trained deep learning model of any kind.

## 11.2 Prompt engineering

Used only for the two optional LLM calls (resume-field extraction, match explanation). Both use a **constrained, strict-output system prompt** pattern: exact output schema stated, explicit "no prose/no markdown/no extra keys" instruction, input length capped (4000 chars), output parsed with `JSON.parse` inside a try/catch that falls back to the deterministic result on any deviation. This is prompt engineering for **reliability and containment**, not for creativity — the prompts are designed to make the LLM's output as close to deterministic as an LLM output can be.

## 11.3 Rule engine

The dominant "AI" component in this system, by computation volume: the resume-score dimension engine, the skill-match set-difference/canonicalisation logic, the project-evaluation point system, the roadmap template lookup, and the ATS text-analysis regex layer are all **hand-authored rule engines** operating over structured/extracted data — not statistical or learned models. This is a deliberate architecture choice (Section 8.1), not a shortcut.

## 11.4 Similarity algorithms

| Algorithm | Where | What it computes |
|---|---|---|
| Exact/canonical set matching | `computeSkillMatch` | Skill presence via normalisation, not similarity scoring |
| TF-IDF cosine similarity | `course-recommendation.ts` | Course-description relevance to a missing-skill query |
| TF-IDF cosine similarity (legacy) | `ai.service.js` (v1 resume scorer) | Resume-text vs. benchmark-job-description similarity, `sieve.ai`-inspired |
| Cross-validation delta comparison | `ai-orchestrator.service.js` | Agreement between two independently-computed numeric estimates (not a similarity metric — a confidence mechanism) |

**No semantic/embedding-based similarity exists anywhere in the codebase.**

## 11.5 Embedding models — explicitly not used

Restated for clarity because this is a common faculty question: **this project does not use any embedding model** (not OpenAI `text-embedding-*`, not `sentence-transformers`, not any other). Anywhere the word "semantic" appears in code comments, it describes a **hand-maintained synonym dictionary** (e.g. `SEMANTIC_EQUIVALENTS` in `skill-gap-dictionary.ts` mapping known skill aliases), not a learned vector representation.

## 11.6 Ranking algorithms

Deterministic weighted-sum ranking (Section 10.6) with stable, explicit tie-breaking — never a learned-to-rank model.

## 11.7 Scoring algorithms

Weighted multi-criteria decision analysis (the 7-dimension resume score, the 5-factor candidate evaluation) — a classical decision-theory technique, not a machine-learned scoring function.

## 11.8 Normalization

Skill canonicalisation (`canonicalSkill`/`displaySkill`/`normalizeSkillList`) collapses spelling/casing/punctuation variants of the same skill to one form before any comparison. Score normalisation (`clampScore`) enforces every output stays within 0–100 regardless of intermediate arithmetic.

## 11.9 Feature extraction

Entity extraction from resume text (Section 9.6) is the feature-extraction step feeding every downstream dimension — structural (section headings), lexical (skills, verbs, quantifiers), and relational (project↔skill overlap) features are all extracted by rule-based parsers, not a learned feature extractor.

## 11.10 NLP techniques actually implemented

| Technique | Implementation |
|---|---|
| Text cleaning/normalisation | Regex-based (URLs, punctuation, non-ASCII, casing) |
| Tokenisation | Whitespace split + alphabetic filter + stop-word removal |
| Term frequency (TF) | `termFrequency()` map-building, used by both TF-IDF instances |
| TF-IDF | `course-recommendation.ts`, legacy v1 scorer |
| Cosine similarity | Same two locations |
| Named-entity-style extraction | Rule-based regex/heading extraction (email, phone, links, degree, skills) — not a trained NER model |
| Synonym/alias resolution | Hand-maintained dictionaries (degree synonyms, skill aliases, semantic-equivalent skill terms) |

**No tokenizer library, no NER model, no part-of-speech tagger, and no language model is used for the extraction pipeline itself** — it is regex and heuristic classification.

## 11.11 Summary statement for the viva **[VIVA]**

> "This project uses pre-trained foundation models via hosted APIs (Groq, HuggingFace) strictly for optional prose generation — never for scoring. It also includes one genuinely trained supervised-learning artifact, a scikit-learn classifier over resume categories, which is disabled by default and never blended into the authoritative score. Every scoring, matching, and ranking decision in the system is a deterministic rule engine or a classical TF-IDF/cosine-similarity calculation — no embeddings, no vector database, and no custom-trained deep learning model exist in this system."

---

# SECTION 12 — DATASETS & KNOWLEDGE SOURCES

## 12.1 "What dataset did you train your AI on?" — the honest answer **[VIVA — expect this exact question]**

> **"We do not train any machine learning model as part of this application. The one trained model that exists — the optional Python resume-category classifier — was trained offline, outside this project's runtime, on a public labelled resume dataset (the standard ~20-category resume-classification dataset used in several open Kaggle/GitHub resume-scoring projects), and is shipped as a static `.joblib`/`.pickle` artifact. This project does not perform any training, fine-tuning, or retraining at runtime. All other 'knowledge' in the system comes from hand-curated reference data — skill taxonomies, role profiles, degree synonym tables, and static question banks — not from a trained corpus."**

## 12.2 Custom knowledge sources (hand-curated, not learned)

| Source | File | Size/shape | Used for |
|---|---|---|---|
| Skill category taxonomy | `constants/resume-intelligence-v2.js` (`SKILL_CATEGORY_TAXONOMY`) | 12 categories × curated skill lists | Categorising a resume's skills for display and recommendation templates |
| Target role profiles | Same file (`TARGET_ROLE_PROFILES`) | 10 roles × `{coreSkills, emergingSkills}` | Role-scoped keyword match and skill-gap targeting when no specific posting is selected |
| Role-skill templates (roadmap) | `data/role-skill-templates.js` | Per-role required-skill list | Career roadmap generation |
| Skill-gap dictionary | `lib/skill-gap-dictionary.ts` | 313 lines: canonical map, semantic equivalents, category map, effort hints, quick-win actions | Frontend 3-pass skill-gap matching |
| Industry↔academic skill map | `lib/industry-academic-skill-map.ts` | Keyword bridge table | Mapping college-course terminology to industry skill names for course recommendations |
| Degree synonym groups | `resume-intelligence-v2.service.js` | 10 groups (B.Tech/M.Tech/BCA/MCA/etc.) | Education-dimension matching |
| Action-verb dictionary | `scorer.service.js` | 34 verbs | Impact/experience-quality signal |
| Section-heading hints | `resume-structured-parser.service.js` | Heading pattern rules | Resume section detection |

## 12.3 Public/reference datasets used as-is (not trained on)

| Dataset | Size | Used for | Nature |
|---|---|---|---|
| Aptitude question bank | `lib/data/aptitude-tests.ts`, 14,295 lines | Client-side aptitude practice engine | Hand-authored/curated static question set, not scraped or ML-generated |
| DSA interview questions | `lib/data/dsa-interview-questions.ts`, 2,906 lines | Client-side DSA practice engine | Same — static curated content |
| NPTEL course catalogue | `lib/courses-dataset.ts` + `data/courseRecommendations.json` | Course recommendation engine | Verified NPTEL course metadata (title, platform, URL, target skills) |
| Resume classification categories | `backend/scorer/app.py` `labeldict` | 20 job categories (Data Science, DevOps Engineer, Java Developer, …) | The label set the offline-trained classifier predicts against — this is metadata *about* the trained model's label space, not a dataset used at runtime by this application |

## 12.4 Is there a resume corpus this project trained on?

**No.** This application does not collect or train on a corpus of real user resumes. The only place a "resume dataset" concept appears is the **offline-trained** Python classifier's original training data (a standard public resume-category dataset), which this project consumes as a finished artifact — it did not curate, clean, or train on that dataset itself.

## 12.5 Where does the resume score's "knowledge" actually come from?

Entirely from the **hand-curated reference tables in 12.2** plus the **weighted rule formulas in Section 9** — not from any dataset, corpus, or trained model. This is the same point made in Section 9.17 from a different angle: the scoring engine's "intelligence" is domain modelling (degree synonyms, skill taxonomies, fairness rules) encoded directly as code, not statistical pattern-matching learned from examples.

## 12.6 Summary table

| Question | Answer |
|---|---|
| Custom dataset collected by this project? | No |
| Model trained by this project at runtime? | No |
| Any offline-trained model included? | Yes — one scikit-learn classifier, disabled by default, advisory only |
| Public dataset the offline model was trained on? | A standard ~20-category public resume-classification dataset (external, not distributed with this repo) |
| Knowledge source for scoring rules? | Hand-curated taxonomies, role profiles, synonym tables — not learned |
| Knowledge source for practice engines? | Hand-authored/curated static question banks |
| Knowledge source for course recommendations? | Verified NPTEL course metadata + TF-IDF matching against it |

---

# SECTION 13 — EXTERNAL APIs

| API | Purpose | Authentication | Used in | Fallback | Limitations | Cost |
|---|---|---|---|---|---|---|
| **MongoDB Atlas** | Primary datastore | TLS connection-string credentials | All models | **None — hard dependency** | 512MB free-tier cap | Free (M0) |
| **Upstash Redis** | Cache + rate-limit counters | REST URL + bearer token | `infrastructure/cache` | In-process Map store | 10,000 commands/day free cap | Free tier |
| **Cloudinary** | File storage + CDN | Cloud name + API key/secret | `storage.adapter.js` | Local disk under `/uploads` | 25 credits/mo free cap | Free tier |
| **Groq** | Primary optional LLM | `GROQ_API_KEY` bearer | `ai-provider.router` | HuggingFace → local heuristics | Smaller model; rate-limited | Free tier |
| **HuggingFace Inference** | Fallback LLM | `HUGGINGFACE_API_KEY` bearer | `ai-provider.router` | Local heuristics | Slower, variable availability | Free tier |
| **Neon Postgres** | Analytics event store | Connection string | `postgres.client.js` | Silent no-op | Optional; 0.5GB free cap | Free tier |
| **SMTP (nodemailer)** | OTP + notification email | SMTP user/password | `mailer.js`, `otp.service` | Dev-mode console echo | Deliverability depends on provider | Provider-dependent (often free tier) |
| **Google STUN** | NAT traversal for WebRTC | None (public) | `use-webrtc.ts` | None — direct connection only | Fails behind symmetric NAT (no TURN) | Free |
| **Python scorer** (self-hosted) | ML resume classification | None (internal HTTP) | `scorer.service.js` | Disabled by default; failure → warning | Off in production | Self-hosted, free |
| **Render** | Backend hosting | Dashboard/Blueprint | — | — | Free tier sleeps on idle | Free tier |
| **Vercel/Netlify** | Frontend hosting | — | — | — | Bandwidth cap on free tier | Free tier |

**The pattern to state [VIVA]:** every service except the two databases and the two hosts has a working fallback — the platform can lose Redis, Cloudinary, both LLM providers, and Postgres simultaneously and still serve every core feature, only slower and without cloud file delivery.

**No TURN server [HONEST]:** only public STUN is configured. WebRTC fails behind symmetric NAT (some corporate/mobile networks). A free TURN tier or self-hosted `coturn` is the fix, excluded to keep cost at zero.

---

# SECTION 14 — SECURITY

## 14.1 Authentication

Password: bcrypt, salted, adaptive cost. Email verified via OTP (TTL-indexed, resend cooldown) *before* account creation. Access JWT `{userId,role,adminRole}` + refresh JWT (different secret), refresh stored **SHA-256 hashed** with explicit expiry. Session metadata (`lastLoginAt`, `lastLoginIp`) + activity log on login. Logout clears the stored refresh hash — genuine server-side revocation.

## 14.2 JWT

Symmetric HS256, two separate secrets. Token carries no permission list — permissions recomputed server-side every request. **[HONEST]** Default `JWT_EXPIRES_IN` is 7 days, long for an access token; 15 minutes with the existing refresh flow is the correct production value.

## 14.3 RBAC

```
authMiddleware → allowRoles(...) → requirePermission(key) → company-access scoping
                                                             + object-level checks in controllers
```
Fail-closed everywhere: admin with no `adminRole` gets zero permissions; `COMPANY_FEEDBACK_VIEW_ALL` granted to no role at all (privacy-by-design).

## 14.4 Validation

`express-mongo-sanitize` (after body parsing — critical ordering), ObjectId format validation, Mongoose schema constraints, centralised `VALIDATION_RULES`, `pre("save")` re-derivation of permissions (mass-assignment defence).

## 14.5 Helmet

```
CSP: defaultSrc 'self', scriptSrc 'none', objectSrc 'none', frameAncestors 'none'
crossOriginResourcePolicy: cross-origin  (documented exception — frontend embeds uploaded files)
hsts 1yr · frameguard deny · referrerPolicy no-referrer · noSniff · COOP same-origin
```
`scriptSrc:'none'` is correct precisely because this origin is a pure JSON API and never serves executable HTML.

## 14.6 CORS

Production: `CLIENT_URL` allowlist + optional `*.vercel.app` preview flag. Development: all origins allowed (mitigated by `NODE_ENV=production` pinned in `render.yaml`).

## 14.7 Rate limiting

400 req/15min/IP global; 10 req/min/user on AI; OTP resend cooldown. **[HONEST]** No dedicated login-endpoint limiter or account lockout — the top security fix on the list.

## 14.8 File upload security

Dual MIME+extension whitelist, 5MB cap enforced before full buffering, server-regenerated filenames (path-traversal-proof), whitelisted storage directories, `dotfiles:deny`/`index:false` static serving. **[HONEST]** No magic-byte/file-header sniffing yet.

## 14.9 Environment variables & secrets

Nothing secret committed; `render.yaml` marks every secret `sync:false`; `env.schema.js` documents all variables; `platform.config.js` is the single read point; startup fails loudly on missing `MONGO_URI`/`JWT_SECRET`; dev-only OTP echo gated on `NODE_ENV`.

## 14.10 OWASP Top 10 mapping

| OWASP 2021 | Status |
|---|---|
| A01 Broken Access Control | **Strong** — 4 layers + object-level checks + fail-closed |
| A02 Cryptographic Failures | Good — bcrypt, SHA-256 hashed refresh, HSTS |
| A03 Injection | **Strong** — sanitize, ObjectId validation, typed queries |
| A04 Insecure Design | Good — threat-aware defaults, documented degradation |
| A05 Security Misconfiguration | Good — explicit helmet config, env schema, fail-fast |
| A06 Vulnerable Components | **Weak [HONEST]** — no dependency scanning |
| A07 Auth Failures | Moderate [HONEST] — no login rate limit/lockout |
| A08 Data Integrity Failures | Moderate — no package-integrity CI check |
| A09 Logging Failures | Good — request IDs, activity log; no alerting |
| A10 SSRF | Low risk — outbound calls only to fixed provider URLs |

## 14.11 Prompt-injection protection

Structural: **the score is deterministic, so no resume text can change it — there is no LLM in the scoring path.** For optional LLM paths: constrained system prompts, input truncation, `JSON.parse` try/catch fallback, output used only as display text.

## 14.12 Security scorecard

| Area | Score |
|---|---|
| Authentication design | 8.5/10 |
| Authorization | 9.0/10 |
| Injection defence | 8.5/10 |
| Transport/headers | 8.5/10 |
| Upload security | 7.5/10 |
| Rate limiting | 6.5/10 |
| Token storage (client) | 5.0/10 |
| Dependency hygiene | 5.0/10 |
| Monitoring/alerting | 5.0/10 |

> ### **Overall security rating: 7.5/10.** Strong for a student project, genuinely above typical for the authorization model. Three gaps to a 9/10: httpOnly cookies + CSRF, auth-endpoint rate limiting, dependency scanning in CI.

## 14.13 Production readiness (security)

Ready: TLS at edge, externalised secrets, fail-fast startup, graceful shutdown, structured logs with correlation IDs, audit trail, soft deletes, health/readiness probes. Not ready: no WAF, no automated dependency/secret scanning, no penetration test, no incident alerting, no key-rotation procedure, no backup/restore drill.

---

# SECTION 15 — PERFORMANCE

## 15.1 Caching

Two-tier: Upstash Redis (REST) → in-process Map fallback, identical interface, `initCache()` never throws. LLM responses 24h TTL keyed by `sha256(payload)`; deterministic results 30 min; domain reads via `cache.keys.js` namespaces. Invalidation is prefix-scoped, fired after mutations. **[HONEST]** Not tag-based — a change touching several scopes must remember to invalidate each.

## 15.2 Lazy loading

14,000+-line aptitude bank and 2,900+-line DSA bank never enter the initial bundle — loaded on demand by dedicated loader modules.

## 15.3 Memoization

Used selectively (`useMemo`/`useCallback` around expensive derived data — skill-gap results, ranked candidate lists), **not** applied blanketly — blanket memoisation adds allocation/comparison cost and often makes things slower.

## 15.4 Code splitting

Automatic per App Router route segment; `optimizePackageImports` tree-shakes icon/animation libraries to only what's imported.

## 15.5 Bundle optimisation

`optimizePackageImports`, lazy dataset loading, AVIF/WebP image formats, versioned service worker (busts non-hashed assets every deploy).

## 15.6 Database optimisation

21 purpose-built indexes with ESR ordering; `.select()` projections on hot reads (auth middleware fetches 12 fields, not the whole user, on every request); `.lean()` on read-only lists; pagination everywhere; TTL cleanup with zero application code; optimistic-concurrency retry instead of pessimistic locking.

## 15.7 Image optimisation

AVIF/WebP negotiated automatically by `next.config.ts`; Cloudinary provides on-the-fly transforms for uploaded images when enabled.

## 15.8 API optimisation

Bounded batch concurrency (`AI_BATCH_SIZE=5`); fire-and-forget analytics/telemetry (never blocks a user request); Cloudinary failure falls back to the already-written local path instead of failing the request; composed dashboard payloads to avoid client-side fan-out.

## 15.9 Current bottlenecks **[HONEST — know these cold]**

1. **Render free-tier cold starts** — 30–50s first request after ~15min idle. Hosting-tier property, not a code defect.
2. **Synchronous, CPU-bound resume parsing** blocks the Node event loop.
3. **Single instance, in-process Socket.io state** — no horizontal scaling as-is.
4. **MongoDB M0 shared cluster** — limited IOPS/connections.
5. **Upstash 10,000 commands/day** — reachable under sustained load; memory fallback absorbs overflow but loses cross-instance sharing.
6. **WebRTC mesh** — O(n²) connections; fine for small groups, needs an SFU beyond ~5 participants.
7. **No CDN in front of the API** — only the frontend host provides edge caching.

## 15.10 Future performance work

Short: uptime pinger, `.lean()` audit, tag-based cache invalidation, TanStack Query. Medium: BullMQ + worker for parsing/PDF generation, Socket.io Redis adapter, read replicas. Long: extract AI module to its own service, SFU for interviews, edge caching for public pages.

## 15.11 Performance scorecard

| Area | Score |
|---|---|
| Frontend loading strategy | 8.5/10 |
| Caching architecture | 8.0/10 |
| Database indexing | 8.5/10 |
| API efficiency | 7.5/10 |
| Scalability headroom | 5.0/10 |
| Cold-start behaviour | 4.0/10 |
| Observability of performance | 5.0/10 |

> ### **Overall performance rating: 7/10.** Excellent per-request engineering; limited by a deliberately free-tier deployment. The needed scaling changes are additive, not rewrites.

---

# SECTION 16 — DEPLOYMENT

## 16.1 Hosting topology

```
Users → Vercel/Netlify (Next.js, global CDN) ─HTTPS/WSS→ Render (Node web service)
                                                              │      │      │
                                             MongoDB Atlas M0 │  Upstash │ Cloudinary
                                                              │  Redis   │
                                                    (+ optional Neon Postgres)
```

## 16.2 Frontend build pipeline

`netlify.toml`: base `frontend`, command `npm run build`, publish `.next`, `@netlify/plugin-nextjs`; `vercel.json` for the Vercel path. `prebuild` runs the **deployment guard** — the build fails before publishing if any gate fails. Required env: `NEXT_PUBLIC_API_BASE_URL`.

## 16.3 Backend deployment (Infrastructure as Code)

`render.yaml` Blueprint — declared in version control, not clicked together:
```yaml
type: web · rootDir: backend · plan: free
buildCommand: node ../deployment-guard/run.mjs --target=backend && npm install
startCommand: npm start · healthCheckPath: /health
envVars: NODE_ENV=production · AI_PREFER_LOCAL_HEURISTICS=true · REDIS_ENABLED=true
         STORAGE_PROVIDER=cloudinary · MONGO_URI/JWT_SECRET/... (all sync:false)
```
`healthCheckPath: /health` — Render won't route to an instance that isn't answering, and restarts one that stops.

## 16.4 The Deployment Guard **[VIVA — a distinguishing feature]**

Wired into `prestart`/`prebuild`/`predeploy` so it **cannot be skipped**. Seven check suites: Functionality (incl. TypeScript compilation), AI consistency (scoring fixtures + weight-sum assertion), Test-engine dataset integrity, Interview-system wiring, Performance, UI stability, Security config. Persists a JSON report; supports `--target`, `--json`, `--skip-tsc`.

**Say this exactly:** *"With no test framework in place, we built a deterministic pre-deploy gate that asserts the invariants that actually matter, wired into the package scripts so it cannot be bypassed. It is not a substitute for unit tests — that's the next step."*

## 16.5 Environment variables

Grouped by concern in `env.schema.js`: server, database, auth, email, AI, storage, cache, feature flags. All secrets `sync:false` in `render.yaml`.

## 16.6 Production architecture recap

Single backend instance (stateless apart from Socket.io's in-process connection map), single frontend deployment on the edge, managed MongoDB/Redis/Cloudinary, optional Postgres, optional LLM providers — every optional piece has a fallback (Section 13).

## 16.7 CI/CD reality **[HONEST]**

No GitHub Actions, no automated test suite. CD is git-push-triggered on both hosts; the deployment guard is the quality gate at build time, not a separate CI service. *"Our gate runs at build time rather than pre-merge, so we get enforcement but not pre-merge feedback. Adding a workflow that runs the same guard plus a test suite on every pull request is the top process improvement."*

---

# SECTION 17 — THE 40 MOST IMPORTANT ENGINEERING DECISIONS

Format: **Decision → Why → Advantage → Trade-off → Alternative.**

**1. Modular monolith over microservices.** One team, free-tier budget, no independent-scaling need. Advantage: single deploy, in-process calls, seams preserved for later extraction. Trade-off: everything scales together. Alternative: microservices (premature).

**2. Deterministic scoring, LLM as optional enhancement.** Reproducibility, explainability, cost, availability. Advantage: same input→same score always. Trade-off: no semantic understanding. Alternative: LLM-native scoring (non-reproducible).

**3. Shared kernel with strict module boundaries.** Cross-cutting concerns must not duplicate per module. Advantage: one auth/cache/envelope implementation. Trade-off: kernel changes touch everything. Alternative: duplicate per module.

**4. Mount modules at both `/api` and `/api/v1`.** Version the contract without breaking the current client. Advantage: `/api/v2` addable with no migration. Trade-off: two live paths to the same handlers. Alternative: no versioning.

**5. Uniform response envelope for success and error.** One client parsing path; correlation IDs. Advantage: predictable, traceable. Trade-off: slight payload overhead. Alternative: raw JSON, JSON:API.

**6. `AppError` + `asyncHandler` + one error middleware.** No controller hand-writes error responses. Advantage: consistent codes, no unhandled rejections. Trade-off: requires discipline. Alternative: try/catch everywhere.

**7. Bearer-only authentication (cookies set but not accepted).** An ambient cookie is what makes an endpoint CSRF-exploitable. Advantage: structurally CSRF-immune. Trade-off: token must be JS-readable → `localStorage` XSS exposure. Alternative: httpOnly cookies + CSRF (the correct end state).

**8. Access + refresh tokens, refresh hash stored server-side.** Revocability + short-lived credential. Advantage: logout genuinely invalidates. Trade-off: one DB read per refresh. Alternative: single long-lived JWT.

**9. Permissions recomputed server-side every request; never in the JWT.** A token claim is a stale/forgeable snapshot. Advantage: permission changes take effect immediately. Trade-off: one user lookup per request (mitigated by a 12-field projection). Alternative: permissions in the token.

**10. Fail-closed permission defaults.** A misconfiguration must reduce access, never grant it. Advantage: an admin with no `adminRole` gets zero permissions. Trade-off: misconfiguration reads as "denied" not "error". Alternative: default-allow (unacceptable).

**11. `mongoSanitize` mounted after body parsing.** Before parsing, `req.body` is undefined — sanitising nothing is a silent no-op. Advantage: NoSQL injection actually blocked. Trade-off: none, ordering is simply correct.

**12. MongoDB primary + optional Postgres for analytics.** AI outputs are schema-volatile; analytics events are relational/aggregate-heavy. Advantage: right tool per workload. Trade-off: two data models, no cross-store joins.

**13. Referencing for unbounded children, embedding for bounded ones.** Mongo's document-size limit + independent query patterns. Advantage: cheap reads either way. Trade-off: references need populate/lookup.

**14. Compound unique index on `(internId, internshipId)`.** Duplicate applications must be impossible under a race. Advantage: database-enforced invariant. Trade-off: duplicate-key error needs translation.

**15. TTL index on OTPs.** Expired OTPs must not linger. Advantage: automatic cleanup, zero cron. Trade-off: deletion timing is approximate.

**16. Two-tier cache with automatic in-memory fallback.** Free-tier Redis outage must not take down the platform. Advantage: identical interface, never throws. Trade-off: fallback is per-process, cross-instance cache consistency is lost.

**17. Cache key = `sha256(payload)`.** Output depends on input, not identity. Advantage: automatic invalidation on input change. Trade-off: no partial invalidation.

**18. Local-heuristics-first AI in production.** Cost, latency, availability, determinism. Advantage: $0 and instant. Trade-off: less nuanced prose than a good LLM.

**19. Provider ladder Groq → HuggingFace → local.** No single free tier is reliable enough alone. Advantage: three independent failure domains. Trade-off: three output shapes to reconcile.

**20. Grounding → primary → validation orchestration.** An AI system must know when it doesn't know. Advantage: explicit "insufficient data" instead of a confident guess. Trade-off: more computation/state to explain.

**21. External ML scorer never blended into the score.** Toggling a flag must not change a student's score. Advantage: determinism preserved. Trade-off: the model's potential accuracy is not exploited.

**22. Dimension weights in a frozen constants file.** Scoring policy is business logic, not code. Advantage: auditable, one-line rebalance, guard-checked to sum to 1. Trade-off: still requires a deploy to change.

**23. Never penalise unstated requirements.** A fresher platform must not punish students for being freshers. Advantage: fair, defensible scores. Trade-off: less separation between candidates.

**24. Role-relevance multiplier `0.4+0.6×ratio` on projects.** Irrelevant work still shows initiative but mustn't inflate a role-specific score. Advantage: role-sensitive without erasing breadth. Trade-off: constants are judgement calls, not fitted.

**25. Score explanation derived arithmetically from `weight×score`.** An explanation that can disagree with the score is worse than none. Advantage: provably reconciles. Trade-off: templated, not conversational.

**26. WebRTC mesh with Socket.io signalling, no media server.** Media servers cost money. Advantage: zero bandwidth cost, lowest latency. Trade-off: O(n²) connections, fails behind symmetric NAT.

**27. Client-side aptitude/DSA engines with `localStorage` progress.** 500 simultaneous test-takers would overwhelm a 512MB cluster. Advantage: zero server cost, offline-capable. Trade-off: answers client-inspectable — practice, not assessment.

**28. Domain-grouped frontend with portal facades, no global store.** Dashboards are mostly independent resource views. Advantage: self-contained features, no store boilerplate. Trade-off: possible momentary inter-panel inconsistency.

**29. Strangler-fig migration with legacy re-export shims.** Moving ~250 import paths at once was high-risk. Advantage: incremental, always-shippable. Trade-off: two import styles coexist as debt.

**30. Custom deployment guard as the release gate.** No test suite existed but invariants still needed protection. Advantage: unbypassable, asserts what actually breaks. Trade-off: not a substitute for unit tests.

**31. No embeddings/vector database for skill or job matching.** A vector database and embedding-API calls add cost, latency, and non-determinism to a task (exact-skill matching) that doesn't need semantic fuzziness — it needs *consistency*. Advantage: zero-cost, instant, deterministic, explainable. Trade-off: genuine synonyms outside the hand-maintained dictionary read as missing. Alternative: embedding-based semantic matching (the stated future-scope item once labelled data or budget exists).

**32. TF-IDF + cosine similarity only for course recommendation, not for scoring.** Course relevance is a genuinely fuzzy text-matching problem (course descriptions are free text) where classical IR is appropriate; resume scoring needs auditable, reproducible numbers where TF-IDF's continuous similarity score would be harder to explain per-point. Advantage: the right technique matched to the right sub-problem. Trade-off: two different matching philosophies coexist in the codebase and must be explained as such, not conflated.

**33. Disabled-by-default, advisory-only trained ML classifier.** A genuine supervised model exists (proves ML capability) without making the authoritative score depend on an external model's accuracy or availability. Advantage: demonstrates real ML integration while preserving the determinism guarantee. Trade-off: the model's potential predictive value is unused in production.

**34. Utility-first Tailwind over a component library.** Full control over a custom, 10-palette, dark-first brand without fighting a library's own design opinions. Advantage: no visual compromise, no override fights. Trade-off: more classes per element, more discipline needed to stay consistent.

**35. Theme preference stored server-side on the `User` document.** A device-local theme choice would reset on every new device/browser. Advantage: preference follows the account. Trade-off: one extra field on the user schema, one extra write on preference change.

**36. Glassmorphism restricted to overlay surfaces (modals), not base dashboard layout.** Dense data screens (tables, kanban, score breakdowns) need maximum legibility; translucency reduces contrast. Advantage: the "special" visual language stays special and readable surfaces stay readable. Trade-off: a more uniformly "glassy" aesthetic (arguably more visually striking) was deliberately not pursued.

**37. Animation split — expressive on marketing pages, restrained on dashboards.** A screen opened fifty times a day should optimise for speed and calm, not delight. Advantage: repeated-use screens stay fast; first-impression pages still feel crafted. Trade-off: the dashboard is visually "quieter" than the landing page by design, which could read as inconsistent if not explained.

**38. `computeSkillMatch` as the single source of truth across resume score, skill-gap, recommendations, and applicant ranking.** If each feature computed its own percentage, the same user could see different numbers on different screens with no way to say which is correct. Advantage: guaranteed cross-feature consistency. Trade-off: any change to the matching formula has a wide blast radius and must be tested against all four consumers.

**39. Exact-match category lookup for skill-to-recommendation mapping (not substring).** A substring check would misclassify `mongodb` under `Go` (contains "go") or similarly-named collisions. Advantage: correct categorisation. Trade-off: a skill not present verbatim in the taxonomy gets a generic fallback recommendation instead of a categorised one.

**40. Curated static datasets (aptitude/DSA/courses/skill taxonomy) instead of scraped or generated content.** Hand-authored content can be verified correct and legally clean; scraped or LLM-generated question banks would need a separate correctness/plagiarism review pass this project couldn't run at scale. Advantage: content the team can vouch for. Trade-off: growing the question bank is manual labour, not automatic.

---

# SECTION 18 — LIMITATIONS & FUTURE IMPROVEMENTS

## 18.1 Current limitations, stated honestly

| Area | Limitation |
|---|---|
| Testing | Zero automated unit/integration/e2e tests; the deployment guard mitigates but does not replace them |
| CI | No GitHub Actions pipeline; no pre-merge feedback |
| Security | JWT in `localStorage` (XSS-readable); no auth-endpoint rate limit/lockout; no magic-byte upload check; no dependency scanning |
| Scoring | Two resume-scoring code paths (v1 legacy cosine-similarity vs v2 dimension engine) can disagree; keyword matching is lexical, gameable by stuffing; weights are reasoned, not empirically validated |
| AI | Mock-interview module is a placeholder; no semantic/embedding-based matching; no outcome-trained ranking |
| Infrastructure | Single instance, in-process Socket.io (no horizontal scaling as-is); synchronous CPU-bound resume parsing; no job queue; no TURN server |
| Observability | Good structured logs, but no metrics dashboard and no alerting |
| Code | Legacy shim layer still imported by some new code; doc-comment drift on scoring weights |

## 18.2 Technical debt register

| Debt | Severity | Effort | Fix |
|---|---|---|---|
| No test suite | High | High | Vitest/Jest, starting with the pure scoring engines |
| Dual scoring paths | High | Low | Point the legacy gateway at the v2 engine |
| `localStorage` tokens | High | Medium | httpOnly cookies + CSRF; single change point in `api-client.ts` |
| No CI | High | Low | GitHub Actions running the existing deployment guard + tests |
| Legacy shims | Medium | Medium | Rewrite remaining imports, delete the shim layer |
| No auth rate limit | Medium | Low | Dedicated login limiter + lockout |
| No magic-byte file check | Medium | Low | `file-type` sniffing in upload middleware |
| Prefix-only cache invalidation | Medium | Medium | Tag-based invalidation |
| Comment/weight drift | Low | Trivial | Update JSDoc to match `DIMENSION_WEIGHTS` |

## 18.3 Scalability limitations

| Users | Verdict | Required change |
|---|---|---|
| ~500 concurrent | Works as designed | None — this is the stated design target |
| ~5,000 | Needs work | Paid instance (no sleep), Socket.io Redis adapter, job queue, Mongo tier upgrade |
| ~50,000 | Architectural change | Multiple instances + load balancer, extract AI module, SFU for interviews, read replicas, CDN |

**The key claim [VIVA]:** the application layer is almost entirely stateless — the only in-process state is Socket.io's connection map, which has an official Redis adapter. Horizontal scaling is a configuration change plus a queue, not a rewrite.

## 18.4 AI limitations

No embeddings/semantic matching (lexical only); no outcome-trained ranking model (weights are reasoned, not fitted to real hiring data); mock-interview AI unimplemented; the offline-trained classifier is disabled by default and not integrated into the authoritative flow.

## 18.5 Security limitations

Client token storage, no auth-specific rate limiting, no dependency/secret scanning, no penetration test performed, no WAF, no incident alerting.

## 18.6 Future roadmap

**Phase 1 (weeks 1–3):** unit tests for scoring engines · CI running tests + deployment guard · unify dual scoring paths · fix weight documentation drift · auth-endpoint rate limiting.
**Phase 2 (weeks 4–6):** httpOnly cookies + CSRF · magic-byte upload validation · dependency scanning · error monitoring (Sentry free tier) · remove legacy shims.
**Phase 3 (weeks 7–12):** BullMQ + worker for parsing/PDF generation · Socket.io Redis adapter · TanStack Query · tag-based cache invalidation · TURN server.
**Phase 4 (quarter 2):** embedding-based semantic skill matching · complete mock-interview module · outcome-data collection to calibrate weights · ML re-ranking as an advisory signal alongside the deterministic score.

## 18.7 Production readiness assessment

| Dimension | Rating |
|---|---|
| Functional completeness | 8.5/10 |
| Architecture | 8.5/10 |
| Security | 7.5/10 |
| Performance | 7.0/10 |
| Reliability | 6.5/10 |
| Testing | 3.0/10 |
| Observability | 5.0/10 |
| Documentation | 8.0/10 |
| Deployability | 8.5/10 |

> ### **Overall production readiness: 7/10 — "production-shaped, pre-production hardened."** Honest verdict: *"It is deployable and it is deployed. What separates it from something I'd put in front of paying customers is a test suite, a CI pipeline, monitoring with alerting, and moving tokens out of `localStorage`. Four known, scoped pieces of work — not architectural problems."*

---

# SECTION 19 — VIVA PREPARATION: 150 QUESTIONS

Format: **Q → Ideal answer → Why it is correct → Possible follow-up.**

## A. ARCHITECTURE (15)

**A1. Explain your project in two minutes.**
→ An AI-assisted internship platform with student/company/admin portals. Resumes are parsed, scored on 7 explainable dimensions against a specific posting, and turned into a learning roadmap. Companies get a configurable ranked shortlist and run the full hiring pipeline including WebRTC interviews. Backend: modular monolith, Node/Express/MongoDB. Frontend: Next.js/TypeScript. Runs entirely on free-tier infrastructure with a fallback for every optional dependency.
*Why correct:* Covers problem, solution, both portals, and the architecture in one breath without listing features.
↪ "Which part was hardest to build?"

**A2. Why a modular monolith, not microservices?**
→ One team, free-tier budget, no independent-scaling requirement, single-database transactions. Module boundaries are enforced anyway so extraction is mechanical later.
*Why correct:* Names concrete costs microservices would add rather than a vague "complexity" objection.
↪ "Which module would you extract first?" → AI — already behind a gateway facade.

**A3. What is the shared kernel?**
→ `src/shared/` — cross-cutting infrastructure only (auth, errors, cache, storage, AI routing, logging). Rule: kernel never imports a feature module.
*Why correct:* Defines the one-directional dependency rule that keeps it from becoming a dumping ground.
↪ "How do you stop it becoming a god-object?"

**A4. Walk me through one API request end to end.**
→ Narrate Section 2.4: middleware chain → registry route → auth → object-level authz → controller → service → model → envelope → error middleware.
*Why correct:* Demonstrates you understand the full pipeline, not just "controller calls service."
↪ "Why must sanitize run after body parsing?"

**A5. How do frontend and backend communicate?**
→ Component → domain portal → `apiRequest()` (attaches Bearer, normalises path, auto-refreshes on 401). Wire protocols: HTTPS/JSON, Socket.io, WebRTC P2P.
*Why correct:* Names the three concrete layers, not just "with fetch."
↪ "What happens if the token expires mid-request?"

**A6. Why mount at both `/api` and `/api/v1`?**
→ `/api/v1` is the versioned contract; `/api` is today's alias. Future `/api/v2` needs no client migration.
*Why correct:* Shows deliberate API-evolution planning.
↪ "How would you introduce v2?"

**A7. What is the module registry pattern?**
→ A frozen array of `{module, path, description, get router()}`. Lazy getters avoid unnecessary requires and circular-import risk.
*Why correct:* Explains both the "what" and the specific engineering reason (lazy require).
↪ "Why a lazy getter specifically?"

**A8. Is this monolithic or distributed?**
→ The application is a monolith; the system is distributed — separate frontend/backend hosts, database, cache, object store, optional analytics DB — each with a planned failure mode.
*Why correct:* Distinguishes application architecture from deployment topology, a distinction many students miss.

**A9. How does realtime work?**
→ Socket.io for chat/presence/roster/signalling; WebRTC media is peer-to-peer and never touches the server.
*Why correct:* Correctly separates signalling (server-mediated) from media (not).
↪ "What is signalling, precisely?"

**A10. What design patterns did you use?**
→ Modular monolith+shared kernel, registry, adapter (storage), strategy/chain-of-responsibility (AI provider ladder), facade (portals, ai-gateway), middleware chain, read-through cache, strangler fig (shim migration).
*Why correct:* Every pattern named is locatable in a specific file.
↪ "Show me the adapter." → `storage.adapter.js`.

**A11. How is frontend code organisation different from backend?**
→ Backend groups by module (full domain slice). Frontend groups by domain too but separates rendering (`components/`) from logic (`lib/`) from routing (`app/`).
*Why correct:* Correctly identifies the shared principle (feature cohesion) despite surface difference.

**A12. What happens if MongoDB goes down?**
→ The platform goes down — the one hard dependency. `/health/ready` reports it honestly and returns 503 so the host stops routing traffic.
*Why correct:* Doesn't overclaim universal fallback coverage.
↪ "How would you make it survivable?" → Replica set, read replicas, degraded read-only mode.

**A13. Liveness vs readiness — what's the difference?**
→ Liveness: is the process alive. Readiness: can it serve traffic (`/health/ready` checks Mongo connection state AND bootstrap completion, returns 503 otherwise).
*Why correct:* Explains the orchestration purpose, not just the endpoint names.

**A14. If you rebuilt this today, what would you change architecturally?**
→ TypeScript on the backend too; a job queue from day one; a server-state library instead of per-panel fetching. Keep the modular monolith, deterministic core, and degradation ladder — those held up.
*Why correct:* Distinguishes what worked from what didn't rather than claiming perfection.

**A15. What is the deployment guard, architecturally speaking?**
→ A custom pre-deploy release gate, not a test suite — asserts invariants (weights sum to 1, datasets parse, TypeScript compiles) and is wired into package scripts so it can't be bypassed.
*Why correct:* Correctly scopes what it is and isn't.

## B. FRONTEND (15)

**B1. Why Next.js over plain React?**
→ File-system routing maps onto role-segregated dashboards; per-route code splitting; SSR where useful (public pages); free deployment target.
*Why correct:* Ties the framework choice to a concrete structural need, not generic praise.

**B2. App Router or Pages Router?**
→ App Router — nested layouts, per-segment loading/error boundaries, route groups matching the 3-portal structure.
*Why correct:* Names the specific App Router features actually used.

**B3. Why no Redux?**
→ Little shared mutable state across distant components — dashboards are mostly independent resource views. Session via `localStorage`+event; realtime via socket singletons. TanStack Query would be the real next step (request dedup/cache coherence), not a global store.
*Why correct:* Identifies the *actual* gap (server-state caching) rather than dismissing state libraries generally.
↪ "How do two components learn about a login?" → custom `window` event.

**B4. How do you protect routes on the frontend?**
→ `use-auth-session` + layout redirects — but these are UX guards, not the security boundary; every API call is independently authorised server-side.
*Why correct:* Correctly refuses to claim client guards as security. **[most-tested trap in this section]**

**B5. How does your API client handle expired tokens?**
→ 401 on a non-auth path → refresh call → session rewrite → replay once (guarded by a `retry` flag against loops).
*Why correct:* Names the loop-prevention mechanism specifically.

**B6. How is state shared between components?**
→ Stratified deliberately: server data local to owning panel, auth via storage+event, realtime via singletons, ephemeral UI local, practice progress in `localStorage`.
*Why correct:* Shows a considered taxonomy, not an accident of not using a store.

**B7. What are your most important custom hooks?**
→ `use-auth-session`, `use-webrtc`, `use-interview-socket`/`use-chat-socket`, `use-focus-trap`, `use-tablist-keyboard`, `use-pagination`.
*Why correct:* Custom hooks only, not built-ins.

**B8. How did you optimise frontend performance?**
→ Code splitting, `optimizePackageImports`, lazy 14K-line datasets, router `staleTimes`, prefetch scheduling, skeletons, debounced inputs, pagination, AVIF/WebP, versioned service worker.
*Why correct:* Multiple concrete named techniques, each traceable to a file.

**B9. Why not memoise everything?**
→ Memoisation costs allocation/comparison; applied blindly it can make rendering slower. Memoise measured hot paths only (skill-gap results, ranked lists).
*Why correct:* Shows understanding memoisation isn't free.

**B10. What is your design system built on?**
→ Tailwind utility classes over centralised tokens (`tailwind.config.ts`), 10 user-selectable palettes (`palettes.json`), theme preference persisted server-side on the account.
*Why correct:* Distinguishes the structural (Tailwind tokens) from the personalisation (palettes) layer.

**B11. What accessibility work exists?**
→ Focus trapping (`use-focus-trap`), keyboard tab navigation (`use-tablist-keyboard`), `aria-current` on active nav, contrast-checked muted tokens.
*Why correct:* Specific mechanisms, not "it's responsive."

**B12. Why is your interview room component 1000+ lines?**
→ Coordinates tightly-coupled state — media streams, per-peer connections, roster, controls. Splitting would scatter that coupling across files without reducing it; the genuinely reusable parts (audio utils, the WebRTC hook) are already extracted.
*Why correct:* Defends the size with a specific coupling argument instead of apologising.

**B13. Why is glassmorphism only on modals, not the whole dashboard?**
→ Dense data screens need maximum legibility; translucency reduces contrast exactly where readability matters most.
*Why correct:* Ties a visual choice to a usability reason.

**B14. Why does the dashboard animate less than the landing page?**
→ A screen opened dozens of times a day should optimise for speed and calm; a first-impression page should feel crafted once.
*Why correct:* Frames it as a frequency-of-use decision, not inconsistency.

**B15. What would you add to the frontend first?**
→ A server-state library (TanStack Query) to fix request dedup/cache coherence between panels — the one real gap left by not using a global store.
*Why correct:* Names the correct next step rather than "add Redux."

## C. BACKEND (16)

**C1. Why Node/Express over Django/Spring?**
→ One language across the stack (mirrored scoring logic), Express's explicit middleware chain suits a security pipeline, async I/O suits a mostly network/DB-bound app.
*Why correct:* Gives a technical reason beyond familiarity.

**C2. Controller vs service — what's the boundary?**
→ Controllers are thin HTTP adapters; services hold business logic and never touch `req`/`res` — making them pure, testable functions.
*Why correct:* Names the testability payoff of the separation.

**C3. What is `asyncHandler` for?**
→ Express 4 doesn't catch rejected async promises — without wrapping, a failing handler hangs the request instead of erroring.
*Why correct:* Explains the actual Express limitation being solved.

**C4. Describe end-to-end error handling.**
→ `AppError` thrown in a service → `asyncHandler` forwards → one `errorMiddleware` builds the uniform envelope, logs with request ID, includes stack only in development.
*Why correct:* Complete chain, not just "try/catch."

**C5. Describe your response envelope.**
→ `{success, message, data, error, meta{requestId, timestamp, pagination?}}` for both success and failure.
*Why correct:* Exact shape known, not approximated.
↪ "Why is `requestId` useful?"

**C6. How does authentication work on the backend?**
→ OTP-verified signup → bcrypt password → login issues access+refresh JWTs (different secrets) → refresh SHA-256-hashed and stored → `authMiddleware` verifies Bearer, loads user (projected fields), recomputes permissions → refresh compares hash and reissues → logout clears hash.
*Why correct:* Full lifecycle, not just "JWT."

**C7. Why Bearer-only, with cookies set but unused for auth?**
→ CSRF defence — a cross-site page can attach a cookie automatically but can't set a custom header without passing CORS. Cookies are set in preparation for a future httpOnly migration.
*Why correct:* States the exact CSRF mechanism being defeated.
↪ "What's the downside?" → token must be JS-readable → XSS exposure.

**C8. Explain your authorization model.**
→ Authenticate → `allowRoles` (coarse) → `requirePermission` (27 keys) → `company-access` (resource ownership) → object-level checks in controllers. Permissions re-derived every request/save, never trusted from the client.
*Why correct:* All four layers named with their specific function.
↪ "What if an admin has no `adminRole`?" → zero permissions.

**C9. What is Broken Object Level Authorization and where do you prevent it?**
→ Checking role but not that *this* record belongs to the requester. Prevented in `computeResumeScore` (a student can't pass an arbitrary `internId`; only company/admin can).
*Why correct:* Names the OWASP category and a concrete code location.

**C10. Why does `mongoSanitize` need to run after `express.json`?**
→ Before body parsing `req.body` is undefined; sanitising it earlier is a silent no-op that gives false confidence.
*Why correct:* Identifies exactly why the wrong order fails silently rather than loudly.

**C11. What is `trust proxy` and why set it?**
→ Render terminates TLS at a proxy; without it, `express-rate-limit` throws on `X-Forwarded-For` and `req.ip` resolves to the proxy, breaking per-client rate limiting.
*Why correct:* Names the specific failure avoided.

**C12. How does backend caching work?**
→ Redis (REST) → in-memory Map fallback, identical interface, `remember(key,ttl,factory)` read-through helper, AI keys hashed by payload.
*Why correct:* Names the fallback mechanism and the specific helper function.

**C13. How do you log and trace requests?**
→ Structured logger + morgan + a `requestId` UUID echoed in every response and error log line; audit-relevant actions also write to `ActivityLog`.
*Why correct:* Explains the correlation mechanism, not just "we log things."

**C14. What happens on deploy — do in-flight requests survive?**
→ Graceful shutdown: stop scheduler → close sockets → drain HTTP → close DB connections → exit, with a 10s force-exit timer.
*Why correct:* Names the specific ordered sequence, not "it restarts."

**C15. Do you have a background job queue?**
→ No. The only scheduled work is an in-process interval-based interview-reminder scheduler — not a durable queue with retries. Resume parsing and PDF generation run synchronously inline.
*Why correct:* Honest — doesn't overclaim a queue that doesn't exist.
↪ "What would you use instead?" → BullMQ + a worker process.

**C16. What is a legacy shim, and why does your codebase have them?**
→ Single-line re-export files preserving ~250 old import paths during an incremental migration to the modular structure — a strangler-fig pattern, and genuine remaining debt.
*Why correct:* Names the pattern and admits the debt in the same breath.

## D. DATABASE (15)

**D1. Why MongoDB?**
→ AI outputs (`resume.parsed`/`analysis`) are schema-volatile; profiles are read as whole documents (one read replaces 6–8 joins); arrays map directly; free Atlas tier.
*Why correct:* Ties the choice to a concrete workload property, not general preference.
↪ "Was it the right call?" → Honest counterpoint: the User/Application/Internship/Company core is relational and gets no referential integrity from Mongo.

**D2. How do you model relationships without joins?**
→ References + `populate` for unbounded/independently-queried children; embedding for bounded, always-together children.
*Why correct:* States the actual rule, not "Mongo can't do relationships."

**D3. Embed vs reference — what's the rule?**
→ Embed when bounded and always read with the parent; reference when unbounded, independently queried, or shared. The 16MB document limit is the hard constraint behind it.
*Why correct:* Gives the underlying constraint, not just a rule of thumb.

**D4. Walk me through your indexes.**
→ Pick 2–3 and explain the query each serves — e.g. `Application{companyId,status,createdAt:-1}` for the pipeline board; unique `(internId,internshipId)` to make duplicate applications impossible at the DB level; TTL on `OtpVerification.expiresAt` for automatic cleanup.
*Why correct:* Ties each index to its actual query, not a list of field names.

**D5. What is ESR and did you follow it?**
→ Equality-Sort-Range compound-index ordering. `{companyId,status,createdAt:-1}` puts equality first, sort last — one index serves both filter and order with no in-memory sort.
*Why correct:* Explains the mechanism the ordering enables.

**D6. What is a TTL index?**
→ An index with `expireAfterSeconds` that lets MongoDB auto-delete documents past a date field — used on OTPs, no cron job needed.
*Why correct:* Correct mechanism, correct use case.

**D7. How do you prevent duplicate applications?**
→ A compound unique index — a database-enforced invariant, not just an application-level check (which is race-prone under concurrent submits).
*Why correct:* Explains why app-level checking alone is insufficient.

**D8. Do you use multi-document transactions?**
→ Not currently. Most writes are single-document (atomic by default); secondary writes (notification, activity log) are non-critical and idempotent.
*Why correct:* Honest, and explains why it's tolerable today.
↪ "Where would you add them?" → the application-status-change flow.

**D9. What is soft delete and why?**
→ `isDeleted`/`deletedAt`/`deletedBy` flags instead of removal; preserves audit trail and recovery; every list query must filter on it.
*Why correct:* Names the query-filtering requirement, which is where soft-delete bugs actually come from.

**D10. Why is `resume.parsed` typed `Mixed`?**
→ Its shape changes with every parser/scorer version; a strict schema would need a migration each iteration. Cost: no built-in validation — compensated by `sanitizeParsed()` in application code.
*Why correct:* States both the reason and the compensating control.

**D11. How would you scale the database?**
→ Vertical first (Atlas tier), then read replicas for analytics/listing queries, then sharding on `companyId` if write volume grows; move `resume.text` to object storage if it becomes hot-document bloat.
*Why correct:* Ordered, concrete scaling path.

**D12. Why two databases (Mongo + optional Postgres)?**
→ Polyglot persistence — Mongo for schema-volatile operational data, Postgres (optional) for relational/aggregate-heavy analytics events only.
*Why correct:* Correctly scopes what each store holds.

**D13. What happens if Postgres is absent?**
→ `recordAnalyticsEvent` silently no-ops — nothing else in the system depends on it.
*Why correct:* Confirms it's genuinely optional, not a hidden dependency.

**D14. How is data integrity enforced without foreign keys?**
→ Compound unique indexes as real invariants (duplicate application, one room per round, one conversation per pair) plus application-level checks before writes.
*Why correct:* Names the concrete substitute for FK constraints.

**D15. What is `.lean()` and why use it?**
→ Returns plain JS objects instead of full Mongoose documents for read-only queries — skips hydration overhead where document methods aren't needed.
*Why correct:* Correct mechanism and correct use case (read paths).

## E. AI SYSTEM (17)

**E1. How does your AI actually work?**
→ Lead with the philosophy: scoring is deterministic and rule-based; LLMs are an optional enhancement layer that never owns a number. Then the 3 layers: grounding, primary computation, validation.
*Why correct:* Answers the intent behind the question, not just "we call an API."

**E2. Which AI models do you use?**
→ Groq `llama-3.1-8b-instant` primary, HuggingFace `Mistral-7B-Instruct-v0.2` fallback — both prose-only. Optional, disabled-by-default scikit-learn classifier for resume categorisation.
*Why correct:* Names exact models and their exact role (never scoring).

**E3. Why not use an LLM for scoring?**
→ Reproducibility, explainability, cost, availability. A wrong sentence is recoverable; a wrong score is not.
*Why correct:* Four distinct, specific reasons, not one vague objection.

**E4. Isn't calling this "AI" a stretch if it's mostly rules?**
→ It's a knowledge-based/expert-system approach plus information extraction, weighted multi-criteria decision analysis, an optional supervised classifier, and LLM integration behind a router — a deliberate choice of *where* to place learned components, keeping them out of the authoritative score.
*Why correct:* Reframes rather than concedes — the placement of AI is the actual engineering decision.
↪ "What would make it more 'AI'?" → embedding-based matching + outcome-trained ranking, both blocked on labelled data.

**E5. Explain the AI provider ladder.**
→ AI disabled→local fallback; else rate-limit check→cache check→(local-first in production) or Groq→HuggingFace→local; cache every success; 503 if nothing works and there's no fallback.
*Why correct:* Full ordered sequence, not "try Groq else error."

**E6. What is grounding, and why does it matter?**
→ Collect only real signals, decide `sufficient`/`missingFields`/`signalCount` before computing anything; insufficient data returns explicit low confidence, never a guess.
*Why correct:* States the mechanism by which the system "knows when it doesn't know."

**E7. What is cross-validation here, and how is it different from ML cross-validation?**
→ Comparing two independent *estimates* of the same quantity for agreement — not k-fold model-training validation. Agreement raises confidence; disagreement lowers it or flags conflict.
*Why correct:* Explicitly disambiguates the term — a common confusion trap.

**E8. How do you control AI cost?**
→ Local-first in production, 24h cache by payload hash, 10 req/min per user, batch size 5, 4000-char prompt truncation, 400 req/15min global.
*Why correct:* Lists every actual control mechanism.

**E9. How do you prevent prompt injection?**
→ Structurally: the score is deterministic, so injected text in a resume cannot change it — there's no LLM in the scoring path. For optional LLM paths: strict-JSON prompts, truncation, `JSON.parse` try/catch fallback.
*Why correct:* Leads with the structural defence, which is the strongest and most defensible one.

**E10. What is your skill-gap algorithm?**
→ 3-pass evidence matching: exact/canonical match → semantic equivalents + project/experience/certification evidence → contextual inference. Every skill carries status, confidence, and an evidence trail.
*Why correct:* Names all 3 passes and what each contributes.

**E11. Why is `computeSkillMatch` in one shared file?**
→ Single source of truth feeding resume score, skill-gap page, recommendations, and applicant ranking — without it, the same user could see different percentages on different screens.
*Why correct:* States the specific failure avoided (cross-feature disagreement).

**E12. What happens if a posting lists zero required skills?**
→ Scores 100%, not 0% — vacuous truth, nothing to fail against. Also: zero missing required skills forces the percentage to exactly 100 as a rounding guardrail.
*Why correct:* Names both guardrails, showing edge-case awareness.

**E13. How does the career roadmap work?**
→ Diff target role's required skills against normalised current skills; order by position (first 3 high-priority, phase by position); 3 phase-appropriate actions per skill.
*Why correct:* Concrete algorithm, not "AI suggests skills."
↪ "How do you decide the order?" → template position, honestly not market demand — a stated limitation.

**E14. Tell me about the ML component.**
→ Flask + TF-IDF + a joblib scikit-learn classifier over 20 categories, disabled by default, attached as an advisory `mlScorerSignal`, never blended into the score, with a 5s timeout and 2 retries.
*Why correct:* Complete, precise, and honest about its (non-)role in production.

**E15. Are embeddings used anywhere in the AI system?**
→ No. No embedding model, no vector database. The only vector-like computation is TF-IDF term-frequency vectors for course recommendation, which is classical IR, not a learned semantic representation.
*Why correct:* Direct, unhedged, and distinguishes TF-IDF from embeddings correctly.

**E16. What would you add to make the AI more sophisticated?**
→ Embedding-based semantic skill matching (to catch genuine synonyms outside the hand-maintained dictionary) and an outcome-trained ranking model calibrated on real hire data — both currently blocked on the absence of labelled data/budget, not on architecture.
*Why correct:* Names the two real next steps and their actual blocker.

**E17. Explain the AI pipeline diagram in one pass.**
→ Grounding (collect+assess sufficiency) → Primary (deterministic engines, optional LLM prose) → Validation (cross-check independent estimates into a confidence tier and trace).
*Why correct:* Matches the actual 3-layer implementation exactly.

## F. RESUME SCORE ENGINE (16)

**F1. Explain the resume score end to end.**
→ 13-step pipeline (extract→parse→sanitise→quality→text-signals→7 dimensions→composite→confidence-scale→explain→validate→persist), formula `Σ(score×weight)`.
*Why correct:* Full pipeline plus the formula, not one or the other.

**F2. What are the 7 dimensions and weights?**
→ Keyword 35, Technical Skills 15, Projects 15, Experience 10, Education 10, Structure 10, Certifications 5 — sum to 1, asserted by the deployment guard.
*Why correct:* Exact numbers. Memorise this — highest-probability factual question.

**F3. Why these specific weights?**
→ Rebalanced for a student platform: keyword/skill matching dominates (what ATS/recruiters key on), projects tripled (the primary signal students actually have), experience halved (internships ≠ senior hiring), certifications a small bonus only.
*Why correct:* Ties every number to a stated rationale, not "it felt right."
↪ "How would you validate them?" → Honestly can't yet — no labelled outcome dataset; reasoned, not fitted.

**F4. Keyword Match vs Technical Skills Match — what's the difference?**
→ Keyword Match asks "does the term appear in the text?"; Technical Skills Match asks "is there evidence the person has it?" (via the shared skill-intelligence pipeline, weighting project/experience-backed skills above merely-listed ones).
*Why correct:* Clearly distinguishes presence from evidence.

**F5. How does the score change per internship selected?**
→ Substantially — required/preferred keywords, project relevance, experience requirement, and education preference are all recomputed against that specific posting.
*Why correct:* States *why* context-scoping is the actual point of the feature.

**F6. What happens with no internship selected?**
→ Falls back to role-scoped mode using the selected target role's `coreSkills`/`emergingSkills` — a fix for an earlier bug where it scored against the student's own declared skills (always ~100%, role-blind).
*Why correct:* Volunteers a real design flaw that was found and fixed — strong signal of genuine engineering.

**F7. How is ATS compatibility checked?**
→ A separate rule layer: regex for contact info, section-hint keyword coverage, word-count bands, quantified-achievement regex, a 34-verb action-verb dictionary.
*Why correct:* Names the actual mechanisms, not "we check ATS compatibility."

**F8. How do projects affect the score, and how is irrelevance handled?**
→ Points for tech-stack breadth, description depth, GitHub/demo links (capped 100), then multiplied by `0.4+0.6×relevanceRatio` against the target skill set — an off-stack project keeps 40% value but can't inflate a role-specific score like a relevant one.
*Why correct:* States the exact formula and its intent.

**F9. Does a student with no work experience get penalised?**
→ No — deduction only occurs when a posting *states* a requirement and the candidate has zero experience entries; unstated or "freshers welcome" is never penalised.
*Why correct:* States the fairness rule precisely, the opposite of the intuitive-but-wrong "yes."

**F10. How is education compared?**
→ Only against stated requirements, using a 10-group degree-synonym table (B.Tech≡btech≡Bachelor of Technology≡B.E, etc.) plus substring containment — exact-string comparison would unjustly fail equivalent qualifications.
*Why correct:* Names the specific failure mode avoided.

**F11. What does the parse-confidence multiplier do, and why?**
→ 6 checks produce confidence 0.55–0.95; below 0.75 the score is multiplied by that confidence, because a high score on a poorly-parsed resume would be a false claim about text the system never really read.
*Why correct:* Explains the rationale, not just the mechanism.

**F12. Prove the score explanation is trustworthy.**
→ Every deduction/bonus = `round(weight×score) − round(weight×100)` — arithmetically guaranteed to reconcile with the total; nothing is separately invented.
*Why correct:* States the actual guarantee and why it's meaningful (an LLM-generated explanation could contradict the math; this can't).
↪ "Can it be gamed?" → Yes, via keyword stuffing — blunted but not eliminated by evidence verification.

**F13. How much AI/ML is actually in the resume score?**
→ None in the score itself — 100% rule-based. AI touches only an optional LLM-assisted parse pass (falls back silently) and an optional, disabled-by-default advisory ML classifier that's never blended in.
*Why correct:* Precise and unhedged — matches the actual codebase exactly.

**F14. What is the biggest known flaw in the scoring engine?**
→ Two coexisting scoring paths — the legacy `/api/ai/resume-score` still calls v1 cosine-similarity, while `/api/intern/resume/score` uses the v2 dimension engine — meaning the same profile can show two different numbers.
*Why correct:* Names a real, specific, checkable bug rather than a generic "it could be better."

**F15. How are recommendations generated — is that AI-written?**
→ No — category-templated: a lookup table maps a skill's category to a specific hand-written sentence template. Composite triggers add broader suggestions for gaps matching patterns like `docker|kubernetes|aws`.
*Why correct:* Correctly denies LLM generation where it isn't used.

**F16. Walk through a worked example.**
→ Recite Section 9.18: 5/8 required skills → 57 Keyword Match; 3 relevant projects → 77; no experience requirement stated → 100; degree matches, CGPA above minimum → 100; final weighted score 73/100 with named deductions and bonuses.
*Why correct:* A concrete, arithmetically consistent example proves you understand the formula, not just recite it.

## G. AI JOB MATCHING (10)

**G1. How are resumes compared with jobs?**
→ Deterministic keyword/taxonomy matching via `computeSkillMatch` — canonicalised skill lists, exact set-difference — no embeddings, no vector database, no semantic-similarity model.
*Why correct:* States the exact technique and explicitly rules out what isn't used.

**G2. Are embeddings or a vector database used for matching?**
→ No, neither exists anywhere in the codebase. Matching is exact canonical-form comparison.
*Why correct:* Direct, checkable, correct.

**G3. Is cosine similarity used for job matching?**
→ No — cosine similarity (with TF-IDF) exists only for course recommendation and the legacy v1 resume scorer, not for skill/job matching, which is exact-match based.
*Why correct:* Correctly scopes where cosine similarity does and doesn't apply.

**G4. How are missing skills detected?**
→ A plain set-difference after normalisation; the frontend additionally tries to find *evidence* for a nominally-missing skill (in projects/experience/certifications) before finalising it as missing vs. partial.
*Why correct:* Distinguishes the simple backend check from the richer frontend evidence search.

**G5. How are strengths/weaknesses generated?**
→ Template-triggered strengths (e.g. "≥2 languages" → language-foundation strength) plus rule-based text-analysis flags; weaknesses are any dimension scoring <55 surfacing its top suggestion.
*Why correct:* Names the deterministic trigger conditions, not "AI figures it out."

**G6. How does applicant ranking work for recruiters?**
→ Backend: `requiredMatch×0.55 + resumeScore×0.20 + projectScore×0.25`. Frontend: configurable 5-factor weighted formula per role template, normalised by the sum of *enabled* weights.
*Why correct:* Gives both formulas and notes the frontend one is configurable.

**G7. Why is applicant-ranking weight configurable per role?**
→ Hiring criteria are a business decision, not an engineering constant — hard-coding them would need a deploy every time a company changed its philosophy.
*Why correct:* Explains the business reason, not just "flexibility is good."

**G8. How does candidate comparison work?**
→ It's a presentation layer rendering multiple candidates' score breakdowns side by side — not a separate comparison algorithm.
*Why correct:* Correctly denies a nonexistent separate algorithm.

**G9. How does internship recommendation ranking stay stable across refreshes?**
→ A fully deterministic, explicitly tie-broken sort (score → required-match% → alphabetical role name) — an unstable sort would reshuffle the list with no underlying data change.
*Why correct:* Names the specific failure (visual instability) the tie-break avoids.

**G10. If not embeddings, how do you catch skill synonyms (e.g. "JS" = "JavaScript")?**
→ A hand-maintained canonicalisation/alias dictionary (`skill-normalizer`, `SEMANTIC_EQUIVALENTS`) — not a learned representation.
*Why correct:* Correct mechanism, correctly not overclaimed as "semantic AI."

## H. AI MODELS & ALGORITHMS (10)

**H1. What AI models does the project use?**
→ Groq `llama-3.1-8b-instant` and HuggingFace `Mistral-7B-Instruct-v0.2` (hosted, prose-only), plus one offline-trained scikit-learn classifier (disabled by default, advisory).
*Why correct:* Exact model names, exact roles.

**H2. Did you train any model yourself?**
→ No model is trained or fine-tuned at runtime by this application. The scikit-learn classifier was trained offline (outside this codebase) and shipped as a static artifact.
*Why correct:* Precisely answers what training did/didn't happen.

**H3. What NLP techniques are actually implemented?**
→ Regex-based text cleaning, whitespace tokenisation + stop-word removal, term-frequency counting, TF-IDF, cosine similarity — no tokenizer library, NER model, POS tagger, or language model in the extraction pipeline itself (that's rule/regex-based).
*Why correct:* Complete and precisely scoped list.

**H4. What similarity/ranking algorithms are used?**
→ Exact/canonical set matching (skills), TF-IDF cosine similarity (courses, legacy v1 scorer), weighted-sum deterministic ranking with explicit tie-breaking (applicant/internship ranking) — no learned-to-rank model.
*Why correct:* Names each algorithm and where it applies specifically.

**H5. What is prompt engineering used for here?**
→ Only the two optional LLM calls — strict-JSON system prompts, explicit schema, truncated input, `JSON.parse` fallback on any deviation. Engineered for reliability/containment, not creativity.
*Why correct:* Correctly frames the goal as containment, not creative prompting.

**H6. What is a rule engine, and why is it the dominant AI component here?**
→ A hand-authored set of deterministic functions over structured data — used for scoring, matching, project evaluation, roadmap generation. Deliberate architecture choice to guarantee reproducibility and explainability.
*Why correct:* States both what it is and why it was chosen over a learned alternative.

**H7. What does "normalization" mean in this codebase?**
→ Two distinct things: skill canonicalisation (collapsing spelling/casing variants to one form) and score normalisation (`clampScore` enforcing 0–100 bounds) — not statistical data normalisation.
*Why correct:* Disambiguates a term that could be confused with ML preprocessing.

**H8. What feature extraction happens, and is it learned?**
→ Structural (headings), lexical (skills/verbs/quantifiers), and relational (project↔skill overlap) features extracted by rule-based parsers — not a learned feature extractor.
*Why correct:* Correct and specific.

**H9. Summarise, in one sentence, what "AI" means in this project.**
→ "Deterministic rule engines and classical IR techniques (TF-IDF/cosine) do the scoring and matching; pre-trained foundation models are used only for optional prose; one offline-trained classifier exists as a disabled, advisory signal — no embeddings, no vector database, no custom-trained deep learning model."
*Why correct:* This is the single most load-bearing sentence in the whole viva — memorise it verbatim.

**H10. Why didn't you fine-tune or train your own LLM?**
→ No labelled dataset of resume→hiring-outcome exists to fine-tune against; a free-tier project also can't afford training compute. The chosen alternative — a rule engine calibrated by domain reasoning — gets determinism and explainability without needing that data at all.
*Why correct:* Explains the real constraint (data + cost) and why the alternative wasn't a compromise but a fit.

## I. DATASETS (6)

**I1. What dataset did you train your AI on?**
→ None, at runtime, by this project. The one offline-trained classifier used a standard public ~20-category resume dataset, external to this repo, consumed as a finished artifact.
*Why correct:* The single correct, complete answer to this exact common question.

**I2. Where does the resume score's "intelligence" come from if not training data?**
→ Hand-curated reference tables (skill taxonomy, role profiles, degree synonyms, action-verb lists) plus weighted rule formulas — domain modelling encoded as code, not statistical pattern-matching.
*Why correct:* Correctly locates the "knowledge" in code, not data.

**I3. What datasets power the practice engines?**
→ Hand-authored/curated static question banks — 14,295 lines of aptitude questions, 2,906 lines of DSA questions — not scraped or ML-generated.
*Why correct:* Gives real sizes and states provenance honestly.

**I4. What powers course recommendations?**
→ A verified NPTEL course-metadata catalogue matched via TF-IDF/cosine similarity against missing-skill queries.
*Why correct:* Names both the data source and the matching technique correctly.

**I5. Do you collect and train on real user resumes?**
→ No — no resume corpus is collected or trained on by this application.
*Why correct:* Direct and correct — also a privacy-relevant answer worth knowing precisely.

**I6. Why use hand-curated datasets instead of scraping or LLM-generating content?**
→ Hand-authored content can be verified correct and legally clean; scraped/generated content would need a correctness and plagiarism review this project can't run at scale.
*Why correct:* States the actual trade-off (verifiability vs. volume).

## J. SECURITY (14)

**J1. Rate your security. Why?**
→ ~7.5/10 — the authorization model is genuinely strong (4 layers, fail-closed), the 3 known gaps are `localStorage` tokens, no auth rate limiting, no dependency scanning.
*Why correct:* Specific number with specific justification, not "very secure."

**J2. Where is the JWT stored, and what's wrong with that?**
→ `localStorage` — readable by any script, so XSS could steal it. Mitigated the *related* CSRF risk via Bearer-only auth; httpOnly cookies are already set in preparation for the correct fix.
*Why correct:* States the exact risk and the exact mitigating/complementary facts.

**J3. How do you prevent NoSQL injection?**
→ `express-mongo-sanitize` after body parsing, ObjectId format validation, Mongoose typing, no string-concatenated queries.
*Why correct:* Names the middleware and the critical ordering detail.

**J4. How do you prevent XSS?**
→ React escapes rendered content by default, no `dangerouslySetInnerHTML` on user data, a strict CSP (`scriptSrc:'none'`) on the API.
*Why correct:* Covers both the render layer and the transport-layer header defence.

**J5. Explain your CORS configuration.**
→ Production: `CLIENT_URL` allowlist + optional `*.vercel.app` preview flag; malformed origins deny; server-to-server (no Origin) allowed; development allows all (mitigated by `NODE_ENV=production` pinned in deployment config).
*Why correct:* Complete and precise, including the dev-mode caveat.

**J6. Why `scriptSrc:'none'` in your CSP — isn't that extreme?**
→ Correct precisely because this origin is a pure JSON API that never serves HTML expecting to run script — free defence in depth.
*Why correct:* Justifies an aggressive-looking setting with the actual reason it's safe.

**J7. How do you secure file uploads?**
→ Dual MIME+extension whitelist, 5MB cap before full buffering, server-regenerated filenames (path-traversal-proof), whitelisted directories, `dotfiles:deny`.
*Why correct:* Lists every layer; also correctly admits no magic-byte check exists yet.

**J8. What is rate limiting here, and what's missing?**
→ 400/15min/IP global, 10/min/user on AI, OTP cooldown. Missing: a dedicated login-endpoint limiter and account lockout.
*Why correct:* Names both what exists and the honest gap.

**J9. How are passwords stored?**
→ bcrypt — salted, adaptive cost; plaintext never stored/logged. Refresh tokens: SHA-256 hash only.
*Why correct:* Correct algorithm and correct reasoning for why (slow-by-design, unlike SHA-256 for passwords).
↪ "Why not SHA-256 for passwords?" → it's fast, which is wrong for password hashing.

**J10. How do you manage secrets?**
→ Nothing committed; `render.yaml` marks every secret `sync:false`; `env.schema.js` documents variables; one config file is the sole `process.env` read point; startup fails loudly on missing critical vars.
*Why correct:* Names the concrete mechanism, not ".env file."

**J11. What OWASP category is your strongest defence, and why?**
→ A01 Broken Access Control — 4 enforcement layers, fail-closed defaults, explicit object-level checks, a permission granted to no role by default.
*Why correct:* Names the category correctly and backs it with specifics.

**J12. What OWASP category is your weakest, and why?**
→ A06 Vulnerable Components — no automated dependency scanning exists yet.
*Why correct:* Honest, specific, paired with the fix (Dependabot/`npm audit` in CI).

**J13. How do you defend against prompt injection?**
→ Structurally — no LLM in the scoring path, so injected resume text can't move the score. For optional LLM paths: constrained prompts, truncation, JSON-parse fallback.
*Why correct:* Leads with the strongest (structural) defence first.

**J14. Is this production-ready from a security standpoint?**
→ Mostly — strong auth/authz, correct middleware ordering, explicit security headers. Not fully — `localStorage` tokens, no auth rate limiting, no scanning are the specific remaining gaps.
*Why correct:* Balanced, specific, not a flat yes/no.

## K. DEPLOYMENT (10)

**K1. How is your project deployed?**
→ Frontend on Vercel/Netlify from `frontend/`; backend on Render as a Node service declared in `render.yaml` (IaC), `healthCheckPath:/health`, all secrets `sync:false`; managed MongoDB/Redis/Cloudinary.
*Why correct:* Names the concrete hosts and the IaC mechanism.

**K2. What is your deployment guard?**
→ A pre-deploy release gate wired into `prestart`/`prebuild`/`predeploy` — 7 check suites (functionality incl. TS compile, AI consistency incl. weight-sum assertion, dataset integrity, interview wiring, performance, UI stability, security config) — cannot be bypassed.
*Why correct:* Names all 7 suites and the "cannot be bypassed" mechanism.

**K3. Do you have CI/CD?**
→ CD yes (git-push triggered on both hosts, gated by the deployment guard). CI no — no GitHub Actions, no automated test suite, no pre-merge feedback.
*Why correct:* Correctly separates CD (have) from CI (don't).

**K4. How do you manage environments?**
→ `NODE_ENV` drives CORS strictness, log format, error verbosity, auto-seeding, cookie flags, dev-only OTP echo — centralised in one config file.
*Why correct:* Names the specific behaviours gated by environment.

**K5. What happens on a Render cold start?**
→ The free instance sleeps after ~15min idle; first request afterward takes 30–50s — a hosting-tier property, not a code defect.
*Why correct:* Correctly attributes the cause; doesn't pretend it doesn't happen.

**K6. How would you monitor this in production?**
→ Currently structured logs + request IDs + 4 health endpoints, no metrics/alerting yet — plan: Sentry, an uptime monitor on `/health/ready`, exported request-duration/cache-hit metrics.
*Why correct:* Honest current state + concrete plan.

**K7. What's in your `render.yaml`?**
→ Web service type, `rootDir: backend`, build command running the deployment guard then `npm install`, `healthCheckPath`, and every secret marked `sync:false`.
*Why correct:* Specific, checkable detail.

**K8. Why declare infrastructure as code instead of clicking through a dashboard?**
→ Reviewable, versioned, reproducible — the deployment configuration is a diffable file, not tribal knowledge in someone's dashboard session.
*Why correct:* Names the actual IaC benefit.

**K9. What is the difference between your build-time gate and a CI pipeline?**
→ The gate runs on the hosting provider at build time and blocks a bad deploy; a CI pipeline would run on every pull request before merge, giving feedback earlier. We have the former, not the latter.
*Why correct:* Precisely distinguishes the two, which many students conflate.

**K10. How would you add real CI?**
→ A GitHub Actions workflow triggered on pull request, running the existing deployment guard plus a new test suite (Vitest/Jest), blocking merge on failure.
*Why correct:* Concrete, buildable plan using existing assets.

## L. PERFORMANCE (10)

**L1. How did you optimise performance overall?**
→ Frontend (code splitting, lazy datasets, prefetch, skeletons, image formats, service worker), backend (compression, projections, `.lean()`, pagination, bounded batching), data (21 indexes, TTL), and a two-tier cache.
*Why correct:* One technique named per layer, not a single trick.

**L2. What is your biggest bottleneck?**
→ Render free-tier cold starts (30–50s) — dominates every other latency concern; after that, synchronous CPU-bound resume parsing.
*Why correct:* Ranks the bottlenecks rather than listing them flatly.

**L3. How would you scale to 50,000 users?**
→ Multiple instances behind a load balancer (feasible because the app layer is stateless apart from Socket.io, which has an official Redis adapter), a job queue, AI-module extraction, read replicas, an SFU, edge caching.
*Why correct:* Explains *why* it's feasible (statelessness), not just what to add.

**L4. Why cache AI responses by payload hash?**
→ Output depends on input, not identity — identical requests share a cache entry, and a changed input naturally misses with no manual invalidation needed.
*Why correct:* States the causal reasoning, not just "we hash it."

**L5. How do you handle a slow/failing external service?**
→ Every optional dependency has a fallback (Redis→memory, Cloudinary→local, Groq→HF→local, Postgres→no-op, ML scorer→timeout+retry+warning); telemetry is fire-and-forget so it never slows a user request.
*Why correct:* Names the fallback for each specific service.

**L6. What database performance techniques did you use?**
→ 21 purpose-built compound indexes (ESR-ordered), field projections on hot reads, `.lean()` on read-only lists, pagination everywhere, TTL cleanup, optimistic-concurrency retry.
*Why correct:* Concrete list, each traceable to a file/query.

**L7. Why not memoise or cache everything?**
→ Both cost something (allocation/comparison for memoisation, staleness risk for caching) — applied indiscriminately they can slow things down or serve wrong data. Both are applied to measured hot paths only.
*Why correct:* Shows understanding that optimisation isn't free.

**L8. What's the WebRTC mesh's performance limitation?**
→ O(n²) peer connections — fine for 1:1/small panels, needs an SFU beyond ~5 participants.
*Why correct:* Names the specific complexity class and its practical ceiling.

**L9. How do you keep the AI cost-bounded under load?**
→ Per-user rate limit (10/min), bounded batch concurrency (5), 24h response caching, local-heuristics-first default — a burst of requests hits the cache/local path, not the paid/free-tier LLM quota.
*Why correct:* Ties each control to what it specifically bounds.

**L10. If you had one week purely for performance, what would you fix first?**
→ A job queue for resume parsing/PDF generation — it's the one synchronous, CPU-bound path blocking the event loop, and it's additive (doesn't require a rewrite).
*Why correct:* Prioritises correctly and gives a scoped, buildable answer.

---

# SECTION 20 — PROJECT DEFENSE: HOW TO PRESENT THIS FROM SCRATCH

## 20.1 The opening (90 seconds — memorise the shape, not the words)

> "Internship hiring fails on both sides. Students get rejected without knowing why; recruiters get hundreds of unstructured PDFs they have to screen manually and inconsistently. I built a platform where the resume — the interface between those two sides — becomes transparent.
>
> A student uploads a resume. It gets parsed into structured data and scored against a *specific* internship on seven weighted, explainable dimensions — not just a number, but every point lost, with the reason and the fix. A company posts an internship, gets a ranked shortlist with configurable weights and a visible breakdown, runs the pipeline, and interviews the candidate over WebRTC inside the platform.
>
> The engineering decision I'd most like to defend: the scoring is deterministic. I use language models, but never for the score, because a score has to be reproducible, explainable, and available even when an external API is down. Everything runs on free-tier infrastructure with a documented fallback for every optional dependency."

Then stop. Let them ask.

## 20.2 Project planning

> "I started from the workflow, not the technology. I wrote out the three user journeys end to end — student, company, admin — and identified the state transitions an application actually goes through. That produced the domain model first: users, profiles, internships, applications with a status history, interview rounds. Only then did I choose the stack, against two constraints — zero infrastructure cost, and one language across the stack so scoring logic could be mirrored consistently on both sides.
>
> I sequenced the build in phases: authentication and roles first, since everything else depends on the permission model; the student profile and resume pipeline next; then the company portal and applications; then interviews and realtime; and the AI scoring layer last, deliberately, because you can't score data you haven't modelled yet."

## 20.3 Architecture decisions

> "I chose a modular monolith with a shared kernel — eighteen feature modules, each owning its own routes, controllers, services and models, plus a shared kernel for cross-cutting infrastructure, with a one-directional dependency rule: modules import the kernel, never the other way round.
>
> I rejected microservices deliberately — one team, no independent-scaling requirement, free-tier budget — but didn't want to close the door either, so a single registry file is the only place that knows how modules mount, and modules never reach into each other's internals. Extracting the AI module later is mechanical because its callers already go through a gateway facade.
>
> I also designed the failure modes explicitly: every external service has a fallback — Redis to an in-process cache, Cloudinary to local disk, the language-model providers to local heuristics. MongoDB is the one hard dependency, and the readiness endpoint reports that honestly rather than pretending otherwise."

## 20.4 Frontend implementation

> "Next.js App Router, because file-system routing maps naturally onto three role-segregated portals with per-route code splitting for free.
>
> Three tiers: thin route files, feature panels that own their data and layout, and primitives that know nothing about the domain. All non-visual logic lives in `lib`, and every network call goes through a domain-specific portal wrapping one API-client function — so no component calls `fetch` directly. That one function handles the Bearer token, path normalisation, transparent refresh on 401, and typed errors.
>
> On design: I built a utility-first Tailwind system with ten user-selectable color palettes, persisted server-side on the account so it follows the user across devices, and restricted glassmorphism to overlay surfaces only, since dense data screens need contrast more than they need visual flourish.
>
> I chose not to use a global store, because the dashboards are largely independent resource views and a store would have added indirection without removing a real problem. If I extended this, the correct addition is a server-state library, because the actual gap is request deduplication and cache coherence, not global state."

## 20.5 Backend implementation

> "Express with a strict layer contract — thin controllers, services that hold logic and never touch the request or response objects (which is what makes the scoring engines pure, testable functions), and models that own their schema and invariants.
>
> Two details I'd point at specifically. First, error handling is centralised — services throw a typed error, an async wrapper forwards it, and one middleware turns everything into the same response envelope as a success, with a request ID in every response so a user-reported failure maps to exactly one log line. Second, the middleware order is deliberate, not accidental — the input sanitiser has to run *after* body parsing or it silently does nothing, and a proxy-trust setting has to be correct or rate limiting keys on the wrong IP entirely. Those are the kinds of details that decide whether a security control actually works, not just whether it exists."

## 20.6 Database design

> "MongoDB as primary, because the parser and scorer outputs are genuinely schema-volatile and profiles are read as whole documents — one read replaces six to eight joins. An optional Postgres store holds only analytics events, which are relational and aggregate-heavy.
>
> The rule I applied consistently: embed bounded children only ever read with their parent — status history, interview rounds, education details — and reference unbounded, independently-queried ones like applications and messages. I designed twenty-one indexes, each traceable to a specific query, with compound indexes ordered equality-then-sort. Two I'd highlight: a compound unique index on intern-plus-internship so duplicate applications are impossible at the database level, not just in application code; and a TTL index on OTPs so expired codes are deleted automatically with no scheduled job.
>
> If I'm critical of my own choice: the User-Application-Internship-Company core is genuinely relational and gets no referential integrity from MongoDB. A relational core with a flexible column for the volatile AI output would have been a defensible alternative."

## 20.7 AI implementation

> "The central decision is that scoring is deterministic and language models are an optional enhancement that never owns a number — for reproducibility, explainability, cost, and availability. The system runs in three layers: grounding collects only real signals and decides sufficiency; the primary layer is deterministic engines — seven weighted dimensions for the resume score, three-pass evidence matching for skill gaps, relevance-weighted project evaluation; the validation layer cross-checks independent estimates of the same quantity into a confidence score with a readable trace.
>
> Where models are used at all, they're behind a router with a full fallback ladder, used only to turn structured facts into readable prose — never to produce a number. There's also a genuinely trained supervised classifier for resume categorisation, deliberately kept off by default and attached only as an advisory signal, because toggling a feature flag must never change a student's result.
>
> I want to be precise about what isn't here: there are no embeddings, no vector database, and no custom-trained deep learning model anywhere in the matching or scoring path — that was a deliberate choice, because exact-skill matching needs consistency more than it needs semantic fuzziness, and I didn't have labelled outcome data to justify a learned ranking model anyway."

## 20.8 Security implementation

> "Layered. Authentication is a short-lived access token plus a refresh token signed with a different secret, and only the *hash* of the refresh token is stored, so logout genuinely revokes and a database leak doesn't hand over live sessions. Authorization has four enforcement layers — authenticate, role, permission key, resource ownership — plus object-level checks in controllers, and permissions are recomputed server-side on every request rather than trusted from the token, with fail-closed defaults everywhere.
>
> One decision I'd particularly defend: authentication accepts only the Authorization header, never the cookie, even though cookies are set. That makes the API structurally immune to CSRF, because a cross-site page can attach a cookie automatically but can't set a custom header without passing a cross-origin check first.
>
> The gap I'd name before being asked: the token lives in `localStorage`, so a successful XSS could read it. The correct end state is httpOnly cookies plus a CSRF token, and it's a contained change because exactly one file attaches the token to outgoing requests."

## 20.9 Performance implementation

> "Four fronts. On the client: route-level code splitting, lazy-loading a fourteen-thousand-line question dataset so it never enters the initial bundle, predictive prefetching during idle time, and skeleton shells so the page paints before data arrives. On the API: compression, field projections — the auth check fetches twelve fields, not the whole user document, on every single authenticated request — pagination, and bounded batch concurrency for AI calls. On the data layer: purpose-built compound indexes and automatic TTL cleanup. And a two-tier cache keyed by a hash of the request payload, so identical requests share an entry and a changed input naturally misses with no manual invalidation.
>
> My biggest bottleneck is honest and external: the free-tier host sleeps after fifteen minutes idle, so a cold start can take thirty to fifty seconds. After that, resume parsing is synchronous and CPU-bound — the correct fix is a job queue with a worker, which is on my roadmap, not yet built."

## 20.10 Deployment

> "Infrastructure as code. The backend is declared in a version-controlled configuration file — a web service with a health-check path and every secret marked as non-synced, so it's prompted for and never committed. The frontend builds from its own directory on a separate host. Deploys are triggered by a git push.
>
> The piece I'd point to specifically is a custom pre-deploy release gate wired directly into the package scripts, so it can't be skipped — seven check suites covering compilation, scoring-engine consistency (including an assertion that the dimension weights sum to exactly one), dataset integrity, interview-system wiring, performance, UI stability, and security configuration. If any check fails, the build fails.
>
> I'll be precise about what that is and isn't: it's a release gate, not a test suite. There's no CI pipeline and no automated tests yet — that's the very first thing I'd add."

## 20.11 Challenges & trade-offs

> "The hardest trade-off was the resume-scoring weights themselves — there's no labelled dataset of resume-to-hiring-outcome I could fit them against, so every weight is a reasoned judgement call, not an empirically validated number, and I say that plainly rather than claim more precision than exists. The second hardest was choosing not to use embeddings for skill matching — it would catch more genuine synonyms, but it would also introduce cost, latency, and non-determinism into a task that specifically needs to be exact and explainable. I chose consistency over recall, and documented that as a stated limitation rather than hiding it."

## 20.12 Future scope

> "Near-term: automated tests starting with the pure scoring engines, a CI pipeline, and moving tokens into httpOnly cookies. Medium-term: embedding-based semantic skill matching once I have the budget or data to justify it, and an outcome-trained ranking model if I can collect real hiring-outcome data. Longer-term: extracting the AI module into its own service — which the existing gateway facade already makes straightforward — and scaling the realtime layer with a Socket.io Redis adapter."

## 20.13 Presentation rules

**Do:** lead with the problem, not the stack · give exact numbers when you have them (7 dimensions, 18 modules, 139 endpoints, 21 indexes) · say "I chose X because Y, and the trade-off was Z" · admit limitations before being asked, always paired with a fix · draw the architecture while you talk · say "I don't know, but here's how I'd find out" when true.

**Don't:** claim tests, CI, monitoring, embeddings, or a TURN server you don't have · say "very secure" or "fully scalable" · read from slides · use a buzzword you can't define · get defensive about the rule-based AI — it's your strongest decision, present it as one · panic on an unknown; convert it into a design discussion.

**If stuck:** "That's not something I handled explicitly. My instinct would be [approach], because [reason]. Is that the direction you'd take?" Converts a gap into a conversation.

---

# FINAL REVISION SHEET

## Top 100 concepts to revise

**Architecture (1–12):** modular monolith · shared kernel · module registry with lazy routers · dual API versioning (`/api`, `/api/v1`) · middleware chain ordering · uniform response envelope · `AppError`+`asyncHandler`+central error middleware · liveness vs readiness · graceful shutdown · graceful degradation/fallback ladder · strangler-fig migration · deployment guard as a release gate (not a test suite).

**Frontend (13–24):** App Router segment routing · thin-page/feature-panel/primitive tiering · portal facade over a single API client · client route guards as UX not security · why no global store · lazy dataset loading · predictive prefetch · dark-mode-first theming with 10 palettes · server-side-persisted theme preference · glassmorphism restricted to overlays · animation-register split (marketing vs dashboard) · accessibility hooks (focus trap, roving tabindex).

**Backend (25–36):** controller-vs-service separation · Bearer-only auth defeating CSRF · access+refresh token split · server-side permission recomputation · fail-closed authorization defaults · Broken Object Level Authorization (OWASP A01) defence · `trust proxy` behind a TLS-terminating proxy · feature flags · no job queue (honest gap) · legacy shim layer · request-ID correlation · uniform envelope contract.

**Database (37–48):** embed-vs-reference decision rule · compound indexes + ESR ordering · TTL indexes · compound unique constraints as invariants · soft delete + query filtering · `Mixed` type for schema-volatile data · polyglot persistence (Mongo+optional Postgres) · optimistic concurrency with version retry · `.lean()` for read-only queries · no multi-document transactions (honest gap) · document-size-limit rationale for embedding · analytics-only Postgres role.

**AI System (49–62):** deterministic-first design and its 4 justifications · 3-layer grounding→primary→validation · grounding's "insufficient data" path · cross-validation of independent estimators (≠ k-fold CV) · confidence tiers + explanation trace · provider ladder with local-first preference · payload-hash cache keys · per-user AI rate limiting + batch bounding · advisory-only ML signal, never blended · structural prompt-injection immunity · no embeddings/vector database anywhere · TF-IDF+cosine used only for course recommendation · rule engine as the dominant "AI" component · foundation models used strictly for prose.

**Resume Score (63–75):** the 7 dimensions and exact weights · weighted-sum formula · context scoping (posting/role/profile) · skill canonicalisation · project role-relevance multiplier · never-penalise-unstated-requirements rule · parse-confidence scaling · arithmetic derivation of explanation from `weight×score` · degree-synonym matching · exact-match category lookup (not substring) · two coexisting scoring paths (honest debt) · zero AI in the score itself · worked-example fluency.

**Job Matching (76–83):** `computeSkillMatch` as single source of truth · exact canonical-form matching (no fuzzy/semantic) · vacuous-truth guardrail (0 required = 100%) · rounding-proof 100%-match guardrail · deterministic stable-sort ranking with tie-breaks · configurable per-role weighted candidate scoring · evidence-based missing-vs-partial distinction · candidate comparison as presentation, not a separate algorithm.

**Datasets & Models (84–92):** no training performed by this application · offline-trained scikit-learn classifier as the one exception · hand-curated skill/role/degree taxonomies as the real knowledge source · static curated question banks (aptitude/DSA) · verified NPTEL course metadata · no resume-corpus collection · TF-IDF mechanics · cosine similarity mechanics · why hand-curated over scraped/generated content.

**Security & Deployment (93–100):** OWASP Top 10 mapping with specific strong/weak areas · `localStorage` token trade-off · dual MIME+extension upload validation · CSP `scriptSrc:'none'` rationale for a pure API · IaC via a version-controlled deployment config · 7-suite deployment guard contents · CD-without-CI distinction · free-tier cold-start behaviour.

## Top 30 engineering decisions (see Section 17 for full list)
Modular monolith · deterministic scoring · shared kernel · dual API versioning · uniform envelope · centralised error handling · Bearer-only auth · access+refresh split · server-side permission recomputation · fail-closed defaults · sanitize-after-parse ordering · Mongo+optional Postgres · embed-vs-reference rule · unique compound indexes · TTL indexes · two-tier cache · payload-hash cache keys · local-first AI · provider ladder · grounding→validation orchestration · advisory-only ML scorer · frozen weight constants · never-penalise-unstated-requirements · project role-relevance multiplier · arithmetic score explanation · WebRTC mesh, no media server · client-side practice engines · no global store · strangler-fig migration · custom deployment guard.

## Top 25 files to understand

| # | File |
|---|---|
| 1 | `backend/.../resume-intelligence-v2.service.js` |
| 2 | `backend/.../constants/resume-intelligence-v2.js` |
| 3 | `backend/.../scorer.service.js` |
| 4 | `backend/src/app.js` |
| 5 | `backend/src/server.js` |
| 6 | `backend/src/registry/index.js` |
| 7 | `backend/.../auth.middleware.js` |
| 8 | `backend/.../auth.controller.js` |
| 9 | `backend/.../ai-provider.router.js` |
| 10 | `backend/.../ai-orchestrator.service.js` |
| 11 | `backend/.../compute-skill-match.js` |
| 12 | `backend/.../api-response.js` |
| 13 | `backend/.../error.middleware.js` |
| 14 | `backend/.../platform.config.js` |
| 15 | `backend/.../resume-structured-parser.service.js` |
| 16 | `backend/.../resume-quality.service.js` |
| 17 | `backend/.../project-evaluation.service.js` |
| 18 | `backend/.../User.js` (model) |
| 19 | `backend/.../Application.js` (model) |
| 20 | `backend/.../roles.js` (permission keys) |
| 21 | `frontend/lib/api-client.ts` |
| 22 | `frontend/lib/skill-gap-engine.ts` |
| 23 | `frontend/lib/ai-hiring/master-evaluation-engine.ts` |
| 24 | `frontend/lib/course-recommendation.ts` (the TF-IDF implementation) |
| 25 | `deployment-guard/run.mjs` |

## Top 25 APIs to understand

`POST /auth/intern/send-otp` · `/verify-otp` · `/signup` · `POST /auth/login` · `/refresh` · `/logout` · `POST /intern/resume/upload` (core pipeline) · `GET /intern/resume/score` · `GET/PATCH /intern/profile` · `POST /ai/parse-resume` · `POST /ai/resume-score` (legacy v1 path — know this exists) · `POST /ai/skill-gap` · `/roadmap` · `/recommendations` · `/match-candidates` · `GET/POST /internships` · `POST /applications` · `PATCH /applications/:id/status` · `POST /interview/schedule` · `GET /interview/:roomId` · `GET /chat/conversations` · `POST /admin/companies/:id/verify` · `GET /health/detailed`.

## Top 20 frontend components

`interview-room-shell` · `skill-gap-analysis-panel` · `company-dashboard-page` · `admin-dashboard-page` · `role-auth-form` · `hiring-pipeline-kanban` · `interview-scheduling-panel` · `candidate-comparison-workspace` · `interview-calendar` · `placement-hub-sections` · `mock-aptitude-hub` · `career-coach-dashboard` · `dashboard-overview-extras` · `learning-assessment-panel` · `dashboard-page-header` · portfolio renderer · notification surface · chat thread view · reports download panel · theme provider.

## Top 20 backend services

`resume-intelligence-v2` · `scorer` · `resume-structured-parser` · `resume-parser` · `resume-quality` · `ai-orchestrator` · `ai-gateway` · legacy `ai.service` (v1 scoring) · `project-evaluation` · `roadmap` · `interview-workflow` · `interview-room` · `interview-scheduler` · `application-relevance` · `company-access` · `company-analytics` · `company-hr` · `notification-queue` · `report-pdf` · `portfolio`.

## Top 10 AI workflows

1. Resume structured parsing · 2. Resume Intelligence V2 (the score) · 3. Rule/text ATS analysis · 4. 3-pass skill-gap matching · 5. `computeSkillMatch` (shared matcher) · 6. Project evaluation & relevance weighting · 7. Career roadmap generation · 8. Internship recommendation ranking · 9. Configurable candidate evaluation (recruiter side) · 10. AI orchestrator (grounding + cross-validation), with the provider router and the optional offline-trained classifier as supporting infrastructure.

## Top 20 common viva mistakes

1. Saying "I used AI" without explaining the deterministic design. 2. Not knowing the seven dimension weights. 3. Presenting client-side route guards as the security model. 4. Claiming tests/CI that don't exist. 5. Confusing your cross-validation with k-fold ML cross-validation. 6. Claiming embeddings or a vector database exist. 7. Not knowing why `mongoSanitize` runs after body parsing. 8. Claiming `localStorage` token storage is safe. 9. Being unable to name a trade-off for any decision. 10. Saying "very secure" or "fully scalable." 11. Listing features when asked to explain architecture. 12. Not knowing what the deployment guard actually checks. 13. Claiming the mock-interview module is complete. 14. Overselling the Python ML scorer (off by default, advisory). 15. Not being able to draw the request lifecycle. 16. Claiming Redux or a library you didn't use. 17. Guessing an index instead of naming the query it serves. 18. Forgetting the score can be scaled down by parse confidence. 19. Claiming a TURN server, monitoring, or a trained deep-learning model you don't have. 20. Getting defensive instead of pairing each limitation with its fix.

## Top 25 faculty questions most likely to be asked

1. Explain your project in two minutes. 2. Why a monolith and not microservices? 3. How does your AI actually work — is it just API calls? 4. What dataset did you train your AI on? 5. Are embeddings or a vector database used? 6. Explain the resume score formula and its seven weights. 7. How does authentication work? 8. Why is the JWT in `localStorage`, and what's the risk? 9. How do you prevent NoSQL injection? 10. Why MongoDB and not SQL? 11. Walk me through one API request end to end. 12. How does the frontend talk to the backend? 13. Why no Redux? 14. How do you prevent duplicate applications? 15. What indexes did you create and why? 16. How does video interviewing work without a media server? 17. Where is it deployed and how? 18. Do you have tests? Do you have CI? 19. What is your biggest bottleneck? 20. How would you scale to 50,000 users? 21. Is cosine similarity used, and where exactly? 22. What is the difference between your cross-validation and ML cross-validation? 23. How does your UI theming system work? 24. What would you improve if you had one more month? 25. In one sentence, what does "AI" mean in this project?

---

## Final reminder

The four sentences that carry this viva:

> **1.** "The scoring is deterministic — same resume, same posting, same score, every time — because a score has to be reproducible and explainable, and language models are neither."
>
> **2.** "Every point the student loses is derived arithmetically from `weight × dimension score`, so the explanation is guaranteed to reconcile with the number."
>
> **3.** "There are no embeddings, no vector database, and no custom-trained deep learning model anywhere in the matching or scoring path — that was a deliberate choice, not an oversight."
>
> **4.** "Every external service has a fallback except the primary database, and the readiness endpoint reports that honestly instead of pretending."

Know your limitations better than the examiner does, and pair every one with the fix. That is what separates a student who *built* a project from a student who *engineered* one.







