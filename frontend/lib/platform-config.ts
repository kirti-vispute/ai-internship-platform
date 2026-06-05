/**
 * Client-side free-tier platform constants.
 * Mirrors backend scalability defaults for UI behavior.
 */

export const PLATFORM_LIMITS = Object.freeze({
  aiRequestsPerMinute: 10,
  mockTestLazyBatchSize: 10,
  defaultPageSize: 20,
  maxPageSize: 50,
  interviewEarlyJoinMinutes: 15
});

export const FREE_TIER_SERVICES = Object.freeze({
  frontend: "Vercel",
  backend: "Render Free / Vercel Functions",
  database: "MongoDB Atlas M0 + optional Neon Postgres",
  cache: "Upstash Redis",
  storage: "Cloudinary Free",
  realtime: "WebRTC + Socket.io signaling"
});
