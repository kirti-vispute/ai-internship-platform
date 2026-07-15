# Zero-Cost Scalable Architecture

This platform uses a **serverless modular single-backend** design optimized for free-tier services and ~500 concurrent users.

## Design Principles

1. **One backend process** — modular domains, not microservices
2. **Peer-to-peer realtime** — WebRTC for interviews (no media servers)
3. **Cache-first AI** — Redis + deterministic fallbacks before paid LLM calls
4. **Pagination everywhere** — protect DB and API limits
5. **Graceful degradation** — every external service has a local fallback

---

## Free-Tier Stack

| Layer | Service | Free limit (typical) | Usage |
|-------|---------|----------------------|-------|
| Frontend | **Vercel** | 100GB bandwidth | React/Next.js app |
| Backend | **Render Free** | 750 hrs/mo, sleeps on idle | Express + Socket.io |
| Primary DB | **MongoDB Atlas M0** | 512MB storage | Users, apps, chat, interviews |
| Analytics DB | **Neon Postgres** (optional) | 0.5GB | Event analytics only |
| Cache | **Upstash Redis** | 10K commands/day | AI cache, rate limits |
| AI | **Groq** + **HuggingFace** | Free API tiers | Optional LLM enhancement |
| Storage | **Cloudinary** | 25 credits/mo | Resumes, certificates |
| Video | **WebRTC** | $0 | Interview A/V (P2P) |
| Signaling | **Socket.io** | On same Render instance | Chat + interview signaling |

> **Note:** Operational data stays on MongoDB (existing Mongoose models). Neon Postgres is optional for analytics events only — no full migration required for free-tier launch.

---

## Modular Backend (Single Deploy)

```
backend/src/modules/
├── auth        → /auth
├── users       → /intern, /company, /applications, ...
├── ai          → /ai
├── tests       → frontend lazy-loaded mock engines
├── interviews  → /interview
├── messaging   → /chat
└── analytics   → company dashboards + Neon events
```

Mounted via `mountModularApi()` in `src/app.js`.

---

## Infrastructure Layer

```
backend/src/infrastructure/
├── bootstrap.js           # Startup: Redis + optional Postgres
├── cache/                 # Upstash Redis + memory fallback
├── ai/                    # Groq → HuggingFace → local heuristics
├── storage/               # Cloudinary + local disk fallback
└── db/postgres.client.js  # Optional Neon analytics
```

### AI Cost Control

Route: `ai-provider.router.js`

1. Check **Redis cache** (24h default TTL)
2. Enforce **per-user rate limit** (default 10/min)
3. Try **local heuristics** (default, zero cost)
4. Fallback **Groq** → **HuggingFace**
5. Cache successful responses

Gateway: `services/ai-gateway.service.js` wraps all `/api/ai/*` endpoints.

---

## Scalability for 500 Users

| Feature | Strategy |
|---------|----------|
| Mock tests (500 users) | Questions lazy-loaded client-side; progress in localStorage |
| AI hiring | Cached rankings + batched LLM calls (`AI_BATCH_SIZE=5`) |
| Interviews | WebRTC P2P; Socket.io signaling only |
| Messaging | Socket.io rooms; REST fallback |
| Analytics | Redis aggregates + optional Neon events |
| API | Rate limit 400 req/15min; pagination on list endpoints |

---

## Real-Time Interview Architecture

```
Candidate ←──WebRTC (P2P)──→ HR
     ↓                           ↓
     └── Socket.io signaling ──────┘
              (offer/answer/ICE)
```

No video storage. No TURN server in free tier (works for most same-network NAT cases; add free TURN later if needed).

---

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set `NEXT_PUBLIC_API_BASE_URL` to Render backend URL.

### Backend (Render Free)

Use `render.yaml` at repo root:

```bash
# Connect repo to Render → Blueprint deploy
```

Required secrets: `MONGO_URI`, `JWT_SECRET`, `UPSTASH_*`, optional `GROQ_API_KEY`, `CLOUDINARY_*`.

### Health Check

`GET /health` returns module manifest + platform status:

```json
{
  "architecture": "serverless-modular-single-deploy",
  "platform": { "cache": "upstash", "postgres": true, "storage": "cloudinary" }
}
```

---

## Environment Variables

See `.env.example` at repo root.

---

## What We Avoid (Zero-Cost Rule)

- ❌ AWS EC2, S3, Lambda at scale
- ❌ Paid video servers (Daily, Agora, Twilio Video)
- ❌ Multiple backend deployments
- ❌ Uncached repeated AI calls
- ❌ Heavy Python scorer in production (disabled by default)

---

## Phase 2 (Optional)

- Full Postgres migration via Prisma/Drizzle
- Socket.io Redis adapter for multi-instance Render
- Free TURN server for strict NAT interview cases
- BullMQ on Upstash for email queue persistence
