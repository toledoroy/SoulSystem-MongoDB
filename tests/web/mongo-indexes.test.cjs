const assert = require("node:assert/strict");
const test = require("node:test");

const { getMongoIndexSpecs, initializeMongoIndexes } = require("../../web/mongo-indexes.cjs");

test("defines indexes for the first MongoDB migration collections", () => {
  const specs = getMongoIndexSpecs();
  const collections = specs.map((spec) => spec.collection);

  assert.deepEqual(collections, [
    "accounts",
    "souls",
    "games",
    "claims",
    "soulAttributes",
    "soulAssociations",
  ]);

  assert.deepEqual(specs.find((spec) => spec.collection === "souls").indexes, [
    { keys: { owner: 1 }, options: { name: "souls_owner" } },
    { keys: { handle: 1 }, options: { name: "souls_handle", sparse: true } },
    { keys: { searchField: "text" }, options: { name: "souls_search_text" } },
  ]);
});

test("creates MongoDB indexes from the specs", async () => {
  const calls = [];
  const db = {
    collection: (name) => ({
      createIndex: async (keys, options) => {
        calls.push({ collection: name, keys, options });
      },
    }),
  };

  await initializeMongoIndexes(db);

  assert.ok(calls.length > 0);
  assert.deepEqual(calls[0], {
    collection: "accounts",
    keys: { soulId: 1 },
    options: { name: "accounts_soulId", sparse: true },
  });
  assert.ok(calls.some((call) => call.options.name === "claims_game"));
  assert.ok(calls.some((call) => call.options.name === "soulAttributes_aEnd_role"));
  assert.ok(calls.some((call) => call.options.name === "soulAssociations_aEnd_role"));
});
