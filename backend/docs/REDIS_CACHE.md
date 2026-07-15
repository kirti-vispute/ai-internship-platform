# Redis Cache Infrastructure

Shared, reusable caching layer for the InternAI backend, built on
[`ioredis`](https://github.com/redis/ioredis). It is **infrastructure only** — no
business module caches anything yet. It is designed to **degrade gracefully**:
if `ioredis` is missing, `CACHE_ENABLED` is off, or Redis is unreachable, the
server logs a warning and continues serving from MongoDB. It never crashes.

> This is a **separate** layer from the legacy Upstash REST cache
> (`redis.client.js`) used by AI response caching. That layer is untouched.

Location: `src/shared/infrastructure/cache/`

---

## Files

| File | Responsibility |
|------|----------------|
| `cache.config.js` | Reads cache env vars into a frozen config object. |
| `redis.connection.js` | Connection manager: client lifecycle, reconnect strategy, PING/INFO, ready-state. |
| `cache.helper.js` | Core helpers: `getCache`, `setCache`, `deleteCache`, `deleteByPattern`, `cacheOrFetch`. |
| `cache.invalidation.js` | `invalidateKey`, `invalidateKeys`, `invalidatePattern`, `invalidatePrefix`. |
| `cache.middleware.js` | `cacheResponse()` Express middleware factory (provided, **not** mounted). |
| `cache.health.js` | `getCacheHealth()` snapshot (connected, ping, memory, version). |
| `cache.health.route.js` | Router for `GET /health/cache`. |
| `index.js` | Public barrel — import from here. |

---

## Configuration

All variables are optional; sensible defaults apply. Caching stays **disabled**
until `CACHE_ENABLED=true`.

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_ENABLED` | `false` | Master switch. Must be `true` to activate Redis. |
| `REDIS_URL` | — | Full connection string (`redis://:pass@host:6379/0`). Takes precedence over host/port. |
| `REDIS_HOST` | `127.0.0.1` | Redis host (used when `REDIS_URL` is unset). |
| `REDIS_PORT` | `6379` | Redis port. |
| `REDIS_PASSWORD` | — | Auth password. |
| `REDIS_USERNAME` | — | Auth username (Redis ≥ 6 ACLs). |
| `REDIS_DB` | `0` | Logical database index. |
| `REDIS_KEY_PREFIX` | `internai:` | Prefix applied to every key. |
| `CACHE_DEFAULT_TTL_SECONDS` | `3600` | Default TTL when none is passed to `setCache`. |
| `REDIS_MAX_RECONNECT_ATTEMPTS` | `10` | Reconnect attempts before giving up (then falls back). |
| `REDIS_RECONNECT_BASE_DELAY_MS` | `200` | Backoff step per attempt. |
| `REDIS_RECONNECT_MAX_DELAY_MS` | `5000` | Backoff ceiling. |
| `REDIS_CONNECT_TIMEOUT_MS` | `10000` | Initial connection timeout. |

Example `.env`:

```env
CACHE_ENABLED=true
REDIS_URL=redis://127.0.0.1:6379
# or discrete fields:
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379
# REDIS_PASSWORD=your-password
```

---

## Reconnect strategy

`retryStrategy(times)` returns a capped backoff:
`min(times * REDIS_RECONNECT_BASE_DELAY_MS, REDIS_RECONNECT_MAX_DELAY_MS)`.
After `REDIS_MAX_RECONNECT_ATTEMPTS` it returns `null`, stopping retries and
falling back to MongoDB. Commands fail fast (`maxRetriesPerRequest: 1`,
`enableOfflineQueue: false`) so callers are never blocked while Redis is down.

---

## Usage

```js
const {
  getCache, setCache, deleteCache, deleteByPattern, cacheOrFetch,
  invalidatePrefix, cacheResponse,
} = require("../../shared/infrastructure/cache");

// Cache-aside (recommended)
const jobs = await cacheOrFetch("jobs:list:page:1", () => JobModel.find().lean(), 60);

// Manual
await setCache("user:42:profile", profile, 300);
const cached = await getCache("user:42:profile"); // null on miss/unavailable

// Invalidate
await deleteCache("user:42:profile");
await deleteByPattern("jobs:list:*");
await invalidatePrefix("user:42"); // deletes user:42:*

// Optional route middleware (not mounted anywhere yet)
router.get("/jobs", cacheResponse({ ttl: 60 }), listJobs);
```

**Behaviour when the cache is unavailable:** reads return `null` (miss), writes
and deletes are no-ops, and `cacheOrFetch` still runs the factory — so callers
always get correct data straight from MongoDB.

---

## Health check

`GET /health/cache`

```json
{
  "success": true,
  "message": "Redis cache healthy",
  "data": {
    "enabled": true,
    "connected": true,
    "ping": "PONG",
    "memory": "1.02M",
    "redisVersion": "7.2.4",
    "fallback": "mongodb"
  },
  "error": null
}
```

When disabled or unreachable, `connected` is `false`, `ping`/`memory`/
`redisVersion` are `null`, and `message` explains why. The endpoint always
returns `200` and never throws.

---

## Setup

```bash
npm install            # installs ioredis (added to package.json)
# start Redis locally, e.g.
docker run -p 6379:6379 redis:7
# enable it
CACHE_ENABLED=true npm run dev
```

If `ioredis` is not installed, the connection manager logs a warning and the app
runs cache-disabled — nothing breaks.

---

## Cache keys (`cache.keys.js`)

Use the centralized `CacheKeys` / `CacheTTL` helpers — never hardcode keys.
All student keys are scoped by `studentId` (the user `_id`).

| Read model | Key builder | TTL |
|------------|-------------|-----|
| Student Profile | `studentProfile(id)` | 10 min |
| Resume Score | `studentResume(id)` | 30 min |
| ATS Score | `studentATS(id)` | 30 min |
| AI Recommendation | `studentRecommendation(id)` | 30 min |
| Skill Gap (per internship) | `studentSkillGap(id, internshipId)` | 30 min |
| Applications (per page) | `studentApplications(id, page, limit)` | 5 min |
| Calendar (per range) | `studentCalendar(id, from, to)` | 5 min |

> Dashboard Summary / Statistics are composed by the frontend from the reads
> above; there is no separate endpoint, so no separate key.

## Student Dashboard integration

Only **read** endpoints are cached, via `cacheOrFetch`. On a cache miss the
original DB logic (including any lazy recompute/save) runs unchanged, so behavior
is identical whether the cache is on, off, or unavailable.

**Invalidation (only affected keys):**

| Event | Invalidates |
|-------|-------------|
| Profile updated / Resume uploaded, updated, deleted / Score recalculated | profile, resume, ATS, recommendation, skill-gap*, applications* |
| Application submitted / withdrawn | applications* |
| Calendar entry created / updated / deleted | calendar* |

`*` = pattern (`:*`) invalidation over that per-student namespace.

The AI module (`modules/ai`) keeps its own gateway-level cache and is **not**
double-cached here.

## Notes & scope

- Key prefixing is handled in `cache.helper` (not via ioredis `keyPrefix`) to keep
  `deleteByPattern` (SCAN + DEL) correct and avoid double-prefixing.
- Values are JSON-serialized on write and parsed on read.
- `cacheOrFetch` logs `HIT`/`MISS` at debug level; invalidation logs at info;
  Redis errors log at warn.
