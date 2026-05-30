require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

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

  const server = app.listen(port, () => {
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