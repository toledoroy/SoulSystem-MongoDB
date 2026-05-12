const { MongoClient: DefaultMongoClient } = require("mongodb");
const { createMongoRepository } = require("./mongo-repository.cjs");

async function createMongoConnection(options = {}) {
  const uri = options.uri || process.env.MONGODB_URI || "";
  const dbName = options.dbName || process.env.MONGODB_DB || "soulsystem";
  const MongoClient = options.MongoClient || DefaultMongoClient;

  if (!uri.trim()) {
    throw new Error("MONGODB_URI is required");
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 2000),
  });

  await client.connect();

  const db = client.db(dbName);

  return {
    client,
    db,
    repository: createMongoRepository(db),
    async close() {
      await client.close();
    },
  };
}

module.exports = {
  createMongoConnection,
};
