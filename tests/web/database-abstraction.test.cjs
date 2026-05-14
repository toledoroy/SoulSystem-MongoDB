const assert = require("node:assert/strict");
const test = require("node:test");

const { createDatabase } = require("../../web/db/database.cjs");

test("database abstraction exposes collection-scoped repositories", async () => {
  const db = createDbRecorder();
  const database = createDatabase(db);

  await database.souls.upsert("42", { owner: "0xabc" });
  await database.accounts.upsert("0xabc", { soulId: "42" });
  await database.gameRoles.upsert("0xgame_1", { ctx: "0xgame", roleId: "1" });
  await database.gameParticipants.upsert("0xgame_42", { entity: "0xgame", sbt: "42", roles: ["1"] });
  await database.gameNominations.upsert("0xgame_tx-1", { game: "0xgame", nominator: "42", nominated: "77" });
  await database.gamePosts.upsert("0xgame_tx-1", { entity: "0xgame", author: "42", uri: "ipfs://post" });
  await database.claimRoles.upsert("0xclaim_1", { ctx: "0xclaim", roleId: "1" });
  await database.claimParticipants.upsert("0xclaim_42", { entity: "0xclaim", sbt: "42", roles: ["1"] });
  await database.claimNominations.upsert("0xclaim_77", { claim: "0xclaim", nominated: "77" });
  await database.claimPosts.upsert("0xclaim_tx-1", { entity: "0xclaim", author: "42", uri: "ipfs://post" });
  await database.soulAttributes.upsert("ATTR_42_role_builder", {
    aEnd: "42",
    bEnd: "builder",
    role: "role",
  });
  await database.soulAssociations.upsert("ASSOC_42_mentor_77", {
    aEnd: "42",
    bEnd: "77",
    role: "mentor",
  });
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
      collection: "gameRoles",
      method: "updateOne",
      filter: { _id: "0xgame_1" },
      update: { $set: { ctx: "0xgame", roleId: "1" }, $setOnInsert: { _id: "0xgame_1" } },
      options: { upsert: true },
    },
    {
      collection: "gameParticipants",
      method: "updateOne",
      filter: { _id: "0xgame_42" },
      update: {
        $set: { entity: "0xgame", sbt: "42", roles: ["1"] },
        $setOnInsert: { _id: "0xgame_42" },
      },
      options: { upsert: true },
    },
    {
      collection: "gameNominations",
      method: "updateOne",
      filter: { _id: "0xgame_tx-1" },
      update: {
        $set: { game: "0xgame", nominator: "42", nominated: "77" },
        $setOnInsert: { _id: "0xgame_tx-1" },
      },
      options: { upsert: true },
    },
    {
      collection: "gamePosts",
      method: "updateOne",
      filter: { _id: "0xgame_tx-1" },
      update: {
        $set: { entity: "0xgame", author: "42", uri: "ipfs://post" },
        $setOnInsert: { _id: "0xgame_tx-1" },
      },
      options: { upsert: true },
    },
    {
      collection: "claimRoles",
      method: "updateOne",
      filter: { _id: "0xclaim_1" },
      update: { $set: { ctx: "0xclaim", roleId: "1" }, $setOnInsert: { _id: "0xclaim_1" } },
      options: { upsert: true },
    },
    {
      collection: "claimParticipants",
      method: "updateOne",
      filter: { _id: "0xclaim_42" },
      update: {
        $set: { entity: "0xclaim", sbt: "42", roles: ["1"] },
        $setOnInsert: { _id: "0xclaim_42" },
      },
      options: { upsert: true },
    },
    {
      collection: "claimNominations",
      method: "updateOne",
      filter: { _id: "0xclaim_77" },
      update: { $set: { claim: "0xclaim", nominated: "77" }, $setOnInsert: { _id: "0xclaim_77" } },
      options: { upsert: true },
    },
    {
      collection: "claimPosts",
      method: "updateOne",
      filter: { _id: "0xclaim_tx-1" },
      update: {
        $set: { entity: "0xclaim", author: "42", uri: "ipfs://post" },
        $setOnInsert: { _id: "0xclaim_tx-1" },
      },
      options: { upsert: true },
    },
    {
      collection: "soulAttributes",
      method: "updateOne",
      filter: { _id: "ATTR_42_role_builder" },
      update: {
        $set: { aEnd: "42", bEnd: "builder", role: "role" },
        $setOnInsert: { _id: "ATTR_42_role_builder" },
      },
      options: { upsert: true },
    },
    {
      collection: "soulAssociations",
      method: "updateOne",
      filter: { _id: "ASSOC_42_mentor_77" },
      update: {
        $set: { aEnd: "42", bEnd: "77", role: "mentor" },
        $setOnInsert: { _id: "ASSOC_42_mentor_77" },
      },
      options: { upsert: true },
    },
    {
      collection: "souls",
      method: "deleteOne",
      filter: { _id: "42" },
    },
  ]);
});

test("database abstraction fetches documents by deterministic id", async () => {
  const db = createDbRecorder({
    games: new Map([["0xgame", { _id: "0xgame", name: "Guild" }]]),
  });
  const database = createDatabase(db);

  assert.deepEqual(await database.games.get("0xgame"), {
    _id: "0xgame",
    name: "Guild",
  });
  assert.deepEqual(db.calls, [
    { collection: "games", method: "findOne", filter: { _id: "0xgame" } },
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
