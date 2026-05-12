const assert = require("node:assert/strict");
const test = require("node:test");

const { createDatabase } = require("../../web/db/database.cjs");

test("database abstraction exposes collection-scoped repositories", async () => {
  const db = createDbRecorder();
  const database = createDatabase(db);

  await database.souls.upsert("42", { owner: "0xabc" });
  await database.accounts.upsert("0xabc", { soulId: "42" });
  await database.souls.delete("42");

  assert.deepEqual(db.calls, [
    {
      collection: "souls",
      method: "updateOne",
      filter: { _id: "42" },
      update: { $set: { owner: "0xabc" }, $setOnInsert: { _id: "42" } },
      options: { upsert: true },
    },
    {
      collection: "accounts",
      method: "updateOne",
      filter: { _id: "0xabc" },
      update: { $set: { soulId: "42" }, $setOnInsert: { _id: "0xabc" } },
      options: { upsert: true },
    },
    {
      collection: "souls",
      method: "deleteOne",
      filter: { _id: "42" },
    },
  ]);
});

function createDbRecorder() {
  const calls = [];
  return {
    calls,
    collection(name) {
      return {
        async updateOne(filter, update, options) {
          calls.push({ collection: name, method: "updateOne", filter, update, options });
        },
        async deleteOne(filter) {
          calls.push({ collection: name, method: "deleteOne", filter });
        },
      };
    },
  };
}
