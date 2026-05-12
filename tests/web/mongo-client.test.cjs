const assert = require("node:assert/strict");
const test = require("node:test");

const { createMongoConnection } = require("../../web/mongo-client.cjs");

test("creates a MongoDB connection with db, repository, and close helper", async () => {
  const calls = [];

  class FakeMongoClient {
    constructor(uri, options) {
      calls.push(["constructor", uri, options]);
    }
    async connect() {
      calls.push(["connect"]);
      return this;
    }
    db(name) {
      calls.push(["db", name]);
      return { databaseName: name };
    }
    async close() {
      calls.push(["close"]);
    }
  }

  const connection = await createMongoConnection({
    uri: "mongodb://localhost:27017",
    dbName: "soulsystem",
    MongoClient: FakeMongoClient,
  });

  assert.deepEqual(connection.db, { databaseName: "soulsystem" });
  assert.equal(typeof connection.repository.upsertSoul, "function");

  await connection.close();

  assert.deepEqual(calls, [
    ["constructor", "mongodb://localhost:27017", { serverSelectionTimeoutMS: 2000 }],
    ["connect"],
    ["db", "soulsystem"],
    ["close"],
  ]);
});

test("requires a MongoDB URI", async () => {
  await assert.rejects(
    () => createMongoConnection({ uri: "", dbName: "soulsystem" }),
    /MONGODB_URI is required/,
  );
});

test("uses soulsystem as the default database name", async () => {
  const calls = [];

  class FakeMongoClient {
    async connect() {
      return this;
    }
    db(name) {
      calls.push(name);
      return {};
    }
    async close() {}
  }

  await createMongoConnection({
    uri: "mongodb://localhost:27017",
    MongoClient: FakeMongoClient,
  });

  assert.deepEqual(calls, ["soulsystem"]);
});
