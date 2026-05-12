const assert = require("node:assert/strict");
const test = require("node:test");

const { applyMongoIndexes } = require("../../web/apply-indexes.cjs");

test("connects, initializes indexes, and closes the MongoDB connection", async () => {
  const calls = [];

  const result = await applyMongoIndexes({
    createConnection: async () => {
      calls.push("connect");
      return {
        db: { name: "soulsystem" },
        close: async () => calls.push("close"),
      };
    },
    initializeIndexes: async (db) => {
      calls.push(["indexes", db.name]);
      return 7;
    },
  });

  assert.deepEqual(result, { indexesApplied: 7 });
  assert.deepEqual(calls, ["connect", ["indexes", "soulsystem"], "close"]);
});

test("closes the MongoDB connection when index initialization fails", async () => {
  const calls = [];

  await assert.rejects(
    () => applyMongoIndexes({
      createConnection: async () => ({
        db: {},
        close: async () => calls.push("close"),
      }),
      initializeIndexes: async () => {
        throw new Error("index failed");
      },
    }),
    /index failed/,
  );

  assert.deepEqual(calls, ["close"]);
});
