const {
  buildAiCacheKey,
  getCachedAiResponse,
  setCachedAiResponse
} = require("../cache/cache.service");

module.exports = {
  buildCacheKey: buildAiCacheKey,
  getCachedAiResponse,
  setCachedAiResponse
};
