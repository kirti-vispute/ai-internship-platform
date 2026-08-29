# InternAI

An AI-assisted internship hiring platform that connects **students**, **companies**, and **platform administrators** through a single system covering resume intelligence, skill-gap analysis, internship matching, an applicant-tracking pipeline, live interviews, and real-time messaging.

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Docs:** see [docs/](docs/) for the full project bible, brand guidelines, and zero-cost architecture notes

## Project Structure

```
Major Project - 0001/
├── frontend/                      # Next.js 15 App Router client
│   ├── app/                       # Routes (file-based routing)
│   │   ├── auth/                  # Intern / Company / Admin login & signup
│   │   ├── dashboard/
│   │   │   ├── intern/            # Intern dashboard, placement hub, applications
│   │   │   ├── company/           # Company/HR/CEO dashboard, hiring pipeline
│   │   │   └── admin/[...view]/   # Admin dashboard (catch-all view router)
│   │   ├── internships/           # Public internship listing + detail pages
│   │   ├── interview/             # Live interview room
│   │   ├── portfolio/             # Public intern portfolio pages
│   │   └── company/                # Public company profile pages
│   ├── components/
│   │   ├── dashboard/              # Role-specific dashboard UI (intern/company/admin/shared)
│   │   ├── brand/                  # Logo, theme-aware brand marks
│   │   ├── auth/                   # Auth forms & headers
│   │   ├── ui/                     # Base design-system primitives (button, card, table, modal…)
│   │   ├── theme/                  # Theme provider + light/dark toggle
│   │   ├── calendar/, chat/, interview/, portfolio/, reports/, navigation/, layout/
│   ├── lib/                        # API clients, hooks, helpers (flat, prefix-grouped: interview-*, use-*, admin-*…)
│   ├── constants/                  # Enums, role permissions, static config
│   ├── data/                       # Static datasets (skills, courses, etc.)
│   ├── public/                     # Static assets (brand images, service worker, manifest)
│   └── tests/                      # Playwright / Vitest test suites
│
├── backend/                        # Express REST API
│   ├── src/
│   │   ├── app.js                  # Express app setup (middleware, routes)
│   │   ├── server.js               # HTTP server entry point
│   │   ├── modules/                # Domain-driven feature modules (each with its own models/routes/controllers/services)
│   │   │   ├── authentication/     # Login, signup, OTP, JWT
│   │   │   ├── students/           # Intern profiles
│   │   │   ├── companies/          # Company profiles & verification
│   │   │   ├── internships/        # Internship postings
│   │   │   ├── applications/       # Applications & hiring pipeline
│   │   │   ├── candidates/         # AI candidate matching (fully migrated module)
│   │   │   ├── interviews/         # Live interview scheduling & WebRTC signaling
│   │   │   ├── chat/                # Real-time messaging
│   │   │   ├── calendar/            # Scheduling
│   │   │   ├── notifications/       # In-app notifications
│   │   │   ├── reports/             # PDF/Excel report & export generation
│   │   │   ├── admin/               # Admin moderation & platform management
│   │   │   ├── ats-scoring/         # AI hiring/scoring configuration
│   │   │   ├── analytics/           # Platform analytics
│   │   │   ├── portfolio/           # Public intern portfolios
│   │   │   ├── skills/              # Skill taxonomy
│   │   │   ├── ai/                  # AI service integrations
│   │   │   ├── email/               # Transactional email
│   │   │   └── uploads/             # File upload handling
│   │   ├── shared/                  # Cross-cutting infrastructure
│   │   │   ├── config/, constants/, database/, logger/, middleware/, socket/, services/, utils/, infrastructure/
│   │   ├── controllers/, models/, services/, constants/, data/, validators/
│   │   │                            # Legacy re-export shims → point into modules/<domain>/
│   │   │                            # (kept for backward compatibility with older imports)
│   │   └── registry/                # Central module route registry
│   ├── scripts/                     # One-off seed / maintenance scripts
│   ├── scorer/                      # Python resume-scoring microservice (sieve.ai model)
│   ├── assets/                      # Server-side assets (e.g. PDF report logo)
│   └── tests/                       # Backend test suites
│
├── docs/                            # Project documentation
│   ├── PROJECT_doc.md               # Full project bible / viva defence guide
│   ├── INTERNAI_HANDBOOK.md
│   ├── INTERNAI_BRAND.md
│   ├── ZERO_COST_ARCHITECTURE.md
│   └── scraped-internships-engineering.md
│
├── deployment-guard/                 # Pre-deploy validation checks
├── netlify.toml, render.yaml         # Deployment configs (frontend → Netlify, backend → Render)
└── package.json                      # Root scripts (deploy guard, build/start orchestration)
```

## Getting Started

See [backend/README.md](backend/README.md) for API setup and [docs/PROJECT_doc.md](docs/PROJECT_doc.md) for full architecture and product context.

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```
