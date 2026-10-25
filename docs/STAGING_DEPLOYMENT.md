# Staging deployment guide

CareerSetu is two separately-deployed services, matching the repo's existing
config (`render.yaml`, `netlify.toml`, `frontend/vercel.json`) and the
[Zero-Cost Architecture](./ZERO_COST_ARCHITECTURE.md) doc. Do not try to host
both on one service — the frontend is a Next.js app (Vercel/Netlify build
target) and the backend is a long-running Express + Socket.io process (needs
a persistent Node host, not a serverless function) with background
schedulers that must keep running between requests.

| Service | Platform | Config file |
|---|---|---|
| Backend API | Render (Node web service) | `render.yaml` |
| Frontend | Vercel (primary) or Netlify | `frontend/vercel.json` / `netlify.toml` |

Pick **one** frontend host for a given environment — don't deploy the same
staging frontend to both Vercel and Netlify, since only one `CLIENT_URL`
value can be whitelisted in the backend's CORS config without also setting
`ALLOW_VERCEL_PREVIEW`/adding the Netlify domain to `CLIENT_URL`.

## 1. Backend (Render)

1. Create a new Render Web Service from this repo, root directory `backend`
   (already set in `render.yaml` via `rootDir`). Render auto-detects
   `render.yaml` if you use "Blueprint" deploy; otherwise set build command
   `npm install` and start command `npm start` manually.
2. In Render's dashboard, set every env var marked `sync: false` in
   `render.yaml` (Render deliberately excludes secrets from the blueprint —
   they must be entered by hand):
   - `MONGO_URI` — MongoDB Atlas connection string (staging cluster, not prod)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — generate with
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
     (use **different** values than production)
   - `CLIENT_URL` — the staging frontend's exact origin, e.g.
     `https://careersetu-staging.vercel.app` (no trailing slash)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis
     (optional — AI caching falls back to in-memory without it)
   - `GROQ_API_KEY`, `HUGGINGFACE_API_KEY` — optional; AI features fall back
     to deterministic local heuristics without these
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` —
     **required in practice**: Render's filesystem is ephemeral, so
     `STORAGE_PROVIDER=local` (the default) loses every uploaded
     resume/certificate/logo on every redeploy or restart. `render.yaml`
     already sets `STORAGE_PROVIDER=cloudinary`; these three keys must be
     filled in for uploads to work at all on Render.
   - `NEON_DATABASE_URL` — optional, only used for analytics events
3. Deploy. Watch the boot log for `[startup] Server running on port 5000`
   and confirm no `Missing required environment variable(s)` fatal error.
4. Render's health check path is `/health` (already set in `render.yaml`) —
   confirm it returns 200 before routing traffic to it.

### Render plan and scheduler note

The in-process schedulers (`interview-scheduler.service.js`,
`job-agent-scheduler.service.js`) now take a MongoDB-backed lock
(`shared/infrastructure/scheduler-lock.js`) before each sweep, so if this
service is ever scaled to multiple Render instances sharing one Mongo
cluster, only one instance's timer actually executes a given sweep tick —
the rest see the lock held and skip. Render's **free** and **starter** plans
run a single instance by default, so this only matters once autoscaling or
multiple instances is turned on; nothing further needs to change if that
happens later.

## 2. Frontend (Vercel — selected host)

**Vercel is the active/selected frontend host for staging.** Both
`frontend/vercel.json` and `netlify.toml` exist in the repo, but Vercel is
the better default: it's the framework author's own platform (zero-config
Next.js feature support — image optimization, middleware, ISR all work
out of the box), and `frontend/vercel.json` is the more complete of the two
configs. Netlify's `@netlify/plugin-nextjs` works but is a third-party
adapter with occasional lag behind new Next.js features. Keep Netlify as a
documented fallback (below), not a second active deployment — running both
for the same environment doubles the `CLIENT_URL`/CORS values Render has to
trust for no benefit.

1. Import the repo into Vercel, set **Root Directory** to `frontend`
   (`frontend/vercel.json` already declares `"framework": "nextjs"`).
2. Set environment variables (Project Settings → Environment Variables),
   scoped to the staging environment — see `frontend/.env.example` for the
   full list. At minimum:
   - `NEXT_PUBLIC_API_BASE_URL` — the Render staging backend's URL, e.g.
     `https://internai-api-staging.onrender.com` (no trailing slash)
   - `NEXT_PUBLIC_SITE_URL` — this Vercel deployment's own URL
3. Deploy. Every `NEXT_PUBLIC_*` var is baked into the build at build time —
   changing one requires a redeploy, not just a restart.
4. Back in Render, set `CLIENT_URL` to this exact Vercel URL (step 1.2) and
   redeploy the backend so CORS allows it.

### Netlify alternative

If Netlify is used instead of Vercel for a given environment, `netlify.toml`
already points at `frontend` with `@netlify/plugin-nextjs`. Set the same
`NEXT_PUBLIC_*` variables in Netlify's site settings, and point the
backend's `CLIENT_URL` at the Netlify domain instead.

## 3. Database indexes

No manual index-creation step is required. Every Mongoose model declares its
indexes in code (20 models call `.index(...)`), and `mongoose.connect()`
runs with its default `autoIndex: true`, so indexes are (re)verified against
the existing-index set on every connection — missing indexes are created,
existing ones are left alone. This runs once per process on startup, not per
request, so it adds no steady-state query overhead; the brief delay only
happens right after a deploy connects to an empty/newer collection.

## 4. Deployment-guard UI warnings (resolved)

`deployment-guard/last-report.json` previously showed 3 non-blocking UI
warnings (`ui.chat-loading-states`, `ui.interview-responsive`,
`ui.dashboard-shells`). Investigation found the UI itself was already
correct in every case — the checks in `deployment-guard/checks/ui-stability.mjs`
were pointing at stale file paths left over from component refactors
(`chat-workspace.tsx`, `intern-shell.tsx`, `company-shell.tsx` no longer
exist at those paths; the real files moved into
`components/dashboard/chat/`, `components/dashboard/intern/`, etc.) and, for
the interview room, matching one specific Tailwind class
(`lg:grid-cols-2`) when the actual implementation uses an auto-fit CSS grid
that adapts to any participant count without a hardcoded breakpoint. The
checks were updated to point at the real files/patterns; `npm run
deploy:guard` now reports 41/41 checks passed, 0 warnings, UI Stability
100/100.

## 5. Distributed scheduler lock — operational notes

`backend/src/shared/infrastructure/scheduler-lock.js` adds a MongoDB-backed
lock (`scheduler_locks` collection) around both periodic sweeps so a
multi-instance deployment doesn't run the same sweep twice per tick:

- **Acquisition** is atomic (`findOneAndUpdate` with `upsert`) — concurrent
  callers racing for the same tick either win or hit a duplicate-key error,
  which is treated as "lost the race," not a failure.
- **Expiry**: each lock is held for `sweep interval − 5s`. If an instance
  crashes mid-sweep, the lock self-expires before the next tick and another
  instance can pick it up — no manual cleanup needed.
- **Known limitation**: this protects against duplicate *scheduled ticks*
  across instances, not a sweep that runs longer than its own interval. If a
  sweep's actual duration approaches `SWEEP_INTERVAL_MS`/`INTERVIEW_SWEEP_INTERVAL_MS`,
  a second instance could acquire the lock while the first is still
  running. Not a concern at current data volumes; revisit if sweep duration
  ever grows close to the interval.
- Render's free/starter plans run one instance, so none of this is
  exercised today — it only matters once autoscaling is turned on.

None of these affect data integrity, auth, or API correctness. Address them
opportunistically; they should not block a staging deploy.

## 6. Smoke-test checklist (after both services are live)

- [ ] `GET <backend>/health` → `200`
- [ ] Frontend home page loads with no CORS errors in the browser console
- [ ] Register + login as each role (intern / company / admin test accounts)
- [ ] Resume upload → confirm the file persists after a backend restart
      (proves Cloudinary, not ephemeral local disk, is actually wired up)
- [ ] Open a chat conversation — confirms Socket.io connects cross-origin
- [ ] Schedule/join a mock interview room — confirms WebRTC signaling works
- [ ] Trigger one AI feature (resume score, job match explanation) — confirms
      the AI gateway's fallback chain doesn't error even without live keys
- [ ] Check Render logs for `[scheduler-lock]` errors — none expected on a
      single instance
- [ ] Confirm `Set-Cookie` on login has `Secure` + cross-site cookie
      attributes needed for the separate-origin frontend (check browser
      devtools → Application → Cookies)
