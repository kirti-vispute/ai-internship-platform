require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDB();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});
