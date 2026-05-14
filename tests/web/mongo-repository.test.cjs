const assert = require("node:assert/strict");
const test = require("node:test");

const { createMongoRepository } = require("../../web/mongo-repository.cjs");

test("Mongo repository upserts soul documents with deterministic ids", async () => {
  const db = createDbRecorder();
  const repo = createMongoRepository(db);

  await repo.upsertSoul("42", { owner: "0xabc", stage: 0 });

  assert.deepEqual(db.calls, [
    {
      collection: "souls",
      method: "updateOne",
      filter: { _id: "42" },
      update: { $set: { owner: "0xabc", stage: 0 }, $setOnInsert: { _id: "42" } },
      options: { upsert: true },
    },
  ]);
});

test("Mongo repository clears account soul mappings and deletes souls", async () => {
  const db = createDbRecorder();
  const repo = createMongoRepository(db);

  await repo.upsertAccount("0xabc", { soulId: "", updatedAtBlock: 10 });
  await repo.deleteSoul("42");

  assert.deepEqual(db.calls, [
    {
      collection: "accounts",
      method: "updateOne",
      filter: { _id: "0xabc" },
      update: { $set: { soulId: "", updatedAtBlock: 10 }, $setOnInsert: { _id: "0xabc" } },
      options: { upsert: true },
    },
    {
      collection: "souls",
      method: "deleteOne",
      filter: { _id: "42" },
    },
  ]);
});

test("Mongo repository fetches souls", async () => {
  const db = createDbRecorder({
    souls: new Map([["42", { _id: "42", owner: "0xabc" }]]),
  });
  const repo = createMongoRepository(db);

  assert.deepEqual(await repo.getSoul("42"), { _id: "42", owner: "0xabc" });
  assert.deepEqual(db.calls, [
    { collection: "souls", method: "findOne", filter: { _id: "42" } },
  ]);
});

test("Mongo repository fetches games and claims", async () => {
  const db = createDbRecorder({
    games: new Map([["0xgame", { _id: "0xgame", name: "Guild" }]]),
    claims: new Map([["0xclaim", { _id: "0xclaim", name: "Quest" }]]),
  });
  const repo = createMongoRepository(db);

  assert.deepEqual(await repo.getGame("0xgame"), { _id: "0xgame", name: "Guild" });
  assert.deepEqual(await repo.getClaim("0xclaim"), { _id: "0xclaim", name: "Quest" });
  assert.deepEqual(db.calls, [
    { collection: "games", method: "findOne", filter: { _id: "0xgame" } },
    { collection: "claims", method: "findOne", filter: { _id: "0xclaim" } },
  ]);
});

test("Mongo repository deletes games and claims", async () => {
  const db = createDbRecorder();
  const repo = createMongoRepository(db);

  await repo.deleteGame("0xgame");
  await repo.deleteClaim("0xclaim");

  assert.deepEqual(db.calls, [
    { collection: "games", method: "deleteOne", filter: { _id: "0xgame" } },
    { collection: "claims", method: "deleteOne", filter: { _id: "0xclaim" } },
  ]);
});

function createDbRecorder(seed = {}) {
  const calls = [];

  return {
    calls,
    collection(name) {
      return {
        async findOne(filter) {
          calls.push({ collection: name, method: "findOne", filter });
          return seed[name] ? seed[name].get(filter._id) || null : null;
        },
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
