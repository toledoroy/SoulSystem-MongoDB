const assert = require("node:assert/strict");
const test = require("node:test");

const { checkMongoHealth } = require("../../web/health.cjs");

test("reports MongoDB unavailable when no URI is configured", async () => {
  const result = await checkMongoHealth({ uri: "" });

  assert.deepEqual(result, {
    available: false,
    status: "not_configured",
    message: "MONGODB_URI is not configured",
  });
});

test("reports MongoDB available when the client ping succeeds", async () => {
  const calls = [];
  const result = await checkMongoHealth({
    uri: "mongodb://localhost:27017/soulsystem",
    createClient: () => ({
      db: () => ({
        command: async (command) => {
          calls.push(command);
          return { ok: 1 };
        },
      }),
      close: async () => {
        calls.push("closed");
      },
    }),
  });

  assert.equal(result.available, true);
  assert.equal(result.status, "available");
  assert.equal(result.message, "MongoDB connection verified");
  assert.deepEqual(calls, [{ ping: 1 }, "closed"]);
});

test("reports MongoDB available when a probe connects successfully", async () => {
  const result = await checkMongoHealth({
    uri: "mongodb://localhost:27017/soulsystem",
    connectToMongo: async ({ host, port }) => {
      assert.equal(host, "localhost");
      assert.equal(port, 27017);
    },
  });

  assert.deepEqual(result, {
    available: true,
    status: "available",
    message: "MongoDB endpoint is reachable",
  });
});

test("reports MongoDB available for an SRV connection string when a resolved host connects", async () => {
  const result = await checkMongoHealth({
    uri: "mongodb+srv://admin:secret@example.mongodb.net/soulsystem",
    resolveSrvRecords: async (hostname) => {
      assert.equal(hostname, "_mongodb._tcp.example.mongodb.net");
      return [{ name: "cluster-shard-00-00.example.mongodb.net", port: 27017 }];
    },
    connectToMongo: async ({ host, port }) => {
      assert.equal(host, "cluster-shard-00-00.example.mongodb.net");
      assert.equal(port, 27017);
    },
  });

  assert.deepEqual(result, {
    available: true,
    status: "available",
    message: "MongoDB endpoint is reachable",
  });
});

test("reports MongoDB unavailable when ping fails", async () => {
  const result = await checkMongoHealth({
    uri: "mongodb://localhost:27017/soulsystem",
    createClient: () => ({
      db: () => ({
        command: async () => {
          throw new Error("connection refused");
        },
      }),
      close: async () => {},
    }),
  });

  assert.equal(result.available, false);
  assert.equal(result.status, "unavailable");
  assert.equal(result.message, "connection refused");
});

test("rejects unsupported MongoDB URI protocols", async () => {
  const result = await checkMongoHealth({
    uri: "http://localhost:27017",
  });

  assert.equal(result.available, false);
  assert.equal(result.status, "unavailable");
  assert.equal(result.message, "Unsupported MongoDB URI protocol");
});

test("reports MongoDB unavailable when the probe fails", async () => {
  const result = await checkMongoHealth({
    uri: "mongodb://localhost:27017/soulsystem",
    connectToMongo: async () => {
      throw new Error("connection refused");
    },
  });

  assert.equal(result.available, false);
  assert.equal(result.status, "unavailable");
  assert.equal(result.message, "connection refused");
});
