const { MongoMemoryServer } = require("mongodb-memory-server");

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27117, dbName: "internai" },
  });
  const uri = mongod.getUri();
  console.log("MONGO_URI_READY:" + uri);

  process.on("SIGTERM", async () => {
    await mongod.stop();
    process.exit(0);
  });
})();
