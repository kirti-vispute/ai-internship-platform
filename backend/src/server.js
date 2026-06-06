require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { seedDatabase } = require("./data/seedDatabase");
const { bootstrapPlatformServices } = require("./infrastructure/bootstrap");
const { initChatSocket } = require("./socket/chat.socket");
const { initInterviewSocket } = require("./socket/interview.socket");

function resolvePort() {
  const rawPort = process.env.PORT;
  const parsedPort = Number(rawPort || 5000);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return parsedPort;
}

async function startServer() {
  const port = resolvePort();

  // eslint-disable-next-line no-console
  console.log(`[startup] Starting server (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  // eslint-disable-next-line no-console
  console.log(`[startup] Using PORT=${port}`);

  await connectDB();

  if (process.env.NODE_ENV !== "production" && String(process.env.AUTO_SEED || "true").toLowerCase() !== "false") {
    try {
      const seedResult = await seedDatabase({ reset: false });
      if (seedResult.seeded) {
        // eslint-disable-next-line no-console
        console.log("[startup] Seeded demo accounts (database was empty).");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[startup] Auto-seed skipped:", error && error.message ? error.message : error);
    }
  }

  const platformStatus = await bootstrapPlatformServices();
  // eslint-disable-next-line no-console
  console.log("[startup] Platform services:", platformStatus);

  const server = http.createServer(app);
  initChatSocket(server);
  initInterviewSocket();

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[startup] Server running on port ${port}`);
  });

  server.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("[startup] HTTP server failed:", error && error.message ? error.message : error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[startup] Failed to start server:", error && error.stack ? error.stack : error);
  process.exit(1);
});
