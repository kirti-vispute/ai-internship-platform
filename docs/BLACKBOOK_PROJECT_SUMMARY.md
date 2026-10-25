# CareerSetu (InternAI) — Project Summary

**An AI-Assisted Internship Hiring and Career-Acceleration Platform**

---

## 1. Abstract

CareerSetu is a full-stack, AI-assisted internship hiring platform that connects three stakeholders — students, companies, and platform administrators — through a single system covering resume intelligence, skill-gap analysis, AI-driven job discovery and matching, an applicant-tracking pipeline, live WebRTC interviews, and real-time messaging. The platform is built to make the resume — the interface between a student and a recruiter — transparent and explainable on both sides: a student sees exactly why their resume scored the way it did and what to learn next; a recruiter gets a configurable, auditable, weighted ranking instead of a pile of unstructured PDFs. The entire system, including its AI features, is engineered to run at zero infrastructure cost on free-tier cloud services.

## 2. Problem Statement

Internship hiring fails on both sides of the market simultaneously. Students apply blindly with no feedback loop telling them why a resume was rejected or how far their skills are from a target role. Companies receive hundreds of unstructured resumes per posting and are forced into manual, subjective, and inconsistent screening. Both sides lose context because scheduling, interviewing, and feedback happen outside any single system — in email and chat threads with no audit trail. CareerSetu's core premise is that the resume itself is an opaque interface, and closing that gap — making the scoring and matching logic visible and explainable to both the candidate and the recruiter — is the central design problem the platform solves.

## 3. Objectives

1. Convert an unstructured resume (PDF/DOCX/TXT) into structured, machine-comparable data.
2. Score that data against a specific job or internship posting — not a generic ideal — and explain every point gained or lost.
3. Turn an identified skill gap into a concrete, phased learning roadmap.
4. Continuously and automatically discover relevant external job/internship listings from multiple real job boards, rank them by genuine fit to the candidate's profile, and let the candidate track and apply to them from one place.
5. Give recruiters a configurable, weighted, auditable ranking of applicants instead of an unordered resume pile.
6. Run the entire hiring lifecycle — discover/apply → screen → interview → decide — inside one system.
7. Achieve all of the above at zero infrastructure cost, on free-tier services, for realistic concurrent usage.

## 4. Target Users

| Role | Sub-roles | Primary goals |
|---|---|---|
| **Student / Intern** | — | Build a profile, upload and score a resume, close skill gaps, discover and apply to internships/jobs, track applications, attend interviews, track progress |
| **Company** | Owner, CEO, HR | Post internships, review a ranked applicant list, run a hiring pipeline, schedule and conduct interviews, view analytics |
| **Admin** | Super admin, Verification admin, Moderation admin, Support admin | Verify companies, moderate reports, review certifications, audit platform activity |

## 5. Core Modules and Features

### 5.1 Resume Intelligence
Structured parsing of an uploaded resume into sections (contact info, skills, projects, experience, education), an explainable multi-dimension resume score against a target role, and a PDF resume-analysis report.

### 5.2 Skill Gap Analysis & Career Roadmap
A three-pass evidence-matching engine compares a candidate's demonstrated skills against a role's requirements and produces a phased, actionable learning roadmap to close the gap.

### 5.3 AI Job Agent (multi-source job discovery and matching)
An autonomous agent that continuously aggregates listings from multiple real external job-board providers (Arbeitnow, The Muse, Remote OK, Greenhouse, Lever, Jooble, alongside the platform's own internal internship postings), each behind a fault-tolerant provider adapter with independent health tracking — a provider outage is reported honestly to the user (a "needs setup" or "unavailable" status) rather than silently hidden or faked. Every listing is scored on two axes: a skill-match score against the candidate's verified profile skills, and a role-relevance classifier that distinguishes genuinely related software/tech roles from adjacent or unrelated professions, so that an irrelevant listing (e.g. a sales or non-technical role) is reliably scored low even when its text incidentally mentions a technical term. Matches are paginated, filterable (work mode, location, category, source), and explainable — each card states exactly which required skills matched, which were missing, and why a relevance tag was assigned.

### 5.4 Application Tracker and AI-Generated Materials
A candidate can save any discovered listing to a personal tracker, move it through a status workflow (saved → interested → applied → interview → rejected), and generate a tailored resume-highlights document and cover letter for that specific listing, built only from verified facts already present in the candidate's profile — the system never invents experience, skills, or achievements. Generated materials are editable, auto-saved, and persist across sessions; regenerating a document after manual edits requires explicit confirmation so in-progress edits are never silently discarded. Generation can use a local deterministic template or an LLM (Groq) polishing pass, with the content's actual source always disclosed to the user.

### 5.5 Applicant Ranking and Hiring Pipeline (Company side)
Internship CRUD, configurable role-scoring templates, a candidate-comparison workspace, a Kanban-style hiring pipeline (applied → shortlisted → interview → selected), HR sub-account management with per-account permissions, interview scheduling with reminder automation, and funnel analytics.

### 5.6 Live Interviews, Chat, Calendar, Notifications
Peer-to-peer WebRTC interview rooms (media never transits the server), real-time chat between candidates and recruiters via Socket.io, a personal calendar, and in-app plus email notifications.

### 5.7 Public Portfolio
A public, shareable portfolio page per student (`/portfolio/[username]`) surfacing verified skills, projects, and certifications.

### 5.8 Admin Platform Management
Company verification workflow, abuse-report moderation, certification review, soft-delete user management, and an activity-log audit trail.

## 6. System Architecture

The system is a modular monolith with a clean client-server split:

- **Frontend:** Next.js 15 (App Router) with TypeScript and Tailwind CSS, organized as role-segregated dashboards (intern / company / admin) under file-system routing, with a shared design-system component library.
- **Backend:** Node.js with Express 4, organized as domain-driven feature modules (authentication, students, companies, internships, applications, job-agent, interviews, chat, calendar, notifications, reports, admin, and others), each owning its own models, routes, controllers, and services, composed through a central route registry.
- **Database:** MongoDB (Mongoose) as the primary operational datastore — chosen because parsed-resume output and candidate profiles are naturally nested, schema-evolving documents.
- **Real-time layer:** Socket.io for chat and interview signaling; WebRTC for peer-to-peer interview media.
- **Authentication:** Stateless JWT (access + refresh token split) with bcrypt password hashing.
- **AI layer:** A graceful-degradation provider ladder — deterministic local heuristics as the always-available baseline, with Groq (and a Hugging Face fallback) used for natural-language polishing passes, never as a single point of failure for correctness.

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS 3, Framer Motion |
| Backend runtime | Node.js 20, Express 4 |
| Database / ODM | MongoDB, Mongoose 8 |
| Real-time | Socket.io 4, WebRTC |
| Auth | JWT (jsonwebtoken), bcryptjs |
| AI / LLM | Groq (LLaMA 3.1 8B Instant), Hugging Face (Mistral-7B) fallback |
| Document parsing | pdf-parse, mammoth |
| PDF generation | pdfkit |
| Security middleware | Helmet, CORS, express-rate-limit, express-mongo-sanitize |
| File storage | Cloudinary (CDN), local-disk fallback |
| Cache / rate limiting | Upstash Redis |
| Testing | Jest (backend, 26 suites / 300 tests), Vitest + Testing Library (frontend, 12 files / 153 tests) |
| Deployment | Frontend → Netlify/Vercel, Backend → Render (all free-tier) |

## 8. Testing and Quality Assurance

The platform is validated with an automated backend Jest suite (unit, integration, and regression projects) and a frontend Vitest + Testing Library suite covering component and hook behavior, alongside ESLint, TypeScript strict-mode type checking, and a production build gate. Beyond automated tests, the AI Job Agent module specifically was validated through live end-to-end acceptance testing against a running instance of the platform: the full candidate journey (login → discovery → scoring → save → status change → material generation → edit → regenerate), cross-user data-isolation (verifying one account cannot read or modify another's tracked applications or preferences), duplicate-listing prevention, provider-failure safety (a failed external source never deletes previously saved data), and responsive-layout behavior across desktop, tablet, and mobile were all exercised against real data rather than only mocked fixtures. This process surfaced and fixed two real defects during this project's final hardening pass: a role-relevance classification ordering bug that could let a non-technical listing outrank its actual relevance, and a client/server rendering-mismatch bug in the navigation bar's authentication state.

## 9. Unique Selling Points

1. **Explainability over opacity** — every score, match, and relevance verdict the system produces states its own reasoning, rather than being a black-box number.
2. **Honesty under failure** — provider outages, missing credentials, and unscored listings are reported as what they are, never masked with fabricated or default-positive data.
3. **Zero-invention AI** — generated application materials are traceable to verified profile facts only; nothing is fabricated to make a candidate look better.
4. **Multi-source aggregation with graceful degradation** — the job-discovery layer keeps functioning (and says so honestly) even when individual external providers are down or unconfigured.
5. **Zero-cost-shaped architecture** — every infrastructure choice (Mongo Atlas free tier, Upstash Redis, Cloudinary, Groq's free inference tier, Render/Netlify free hosting) was made to keep the platform runnable at no cost while remaining production-shaped.

## 10. Future Scope

- Expand the Job Agent's live (non-stub) provider coverage to the remaining job boards (Naukri, LinkedIn, Indeed, Wellfound), each currently implemented as a fault-tolerant stub pending API access.
- Extend the role-relevance classifier's profession vocabulary beyond English and German to additional languages as the candidate base internationalizes.
- Add a recommendation feedback loop where a candidate's save/apply/reject actions retrain or re-weight the matching signal over time.
- Introduce CI-based automated regression testing on every change, beyond the current local verification workflow.

---

*This summary reflects the platform's state as of the AI Job Agent module's final end-to-end acceptance pass. For the complete architectural reference, viva-preparation notes, and section-by-section technical deep dive, see [docs/PROJECT_doc.md](PROJECT_doc.md).*
