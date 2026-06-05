const { initRedisClient, getCacheBackendLabel } = require("./cache/redis.client");
const { initPostgresPool, ensureAnalyticsSchema, isPostgresEnabled } = require("./db/postgres.client");
const { PLATFORM_CONFIG } = require("../config/platform.config");

async function bootstrapPlatformServices() {
  await initRedisClient();

  const postgres = await initPostgresPool();
  if (postgres) {
    try {
      await ensureAnalyticsSchema();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[postgres] analytics schema setup skipped:", error.message);
    }
  }

  return {
    cache: getCacheBackendLabel(),
    postgres: isPostgresEnabled(),
    ai: {
      enabled: PLATFORM_CONFIG.ai.enabled,
      groq: Boolean(PLATFORM_CONFIG.ai.groqApiKey),
      huggingFace: Boolean(PLATFORM_CONFIG.ai.huggingFaceApiKey),
      preferLocal: PLATFORM_CONFIG.ai.preferLocalHeuristics
    },
    storage: PLATFORM_CONFIG.storage.provider,
    deployment: PLATFORM_CONFIG.deployment.target
  };
}

module.exports = { bootstrapPlatformServices };
