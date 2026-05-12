const assert = require("node:assert/strict");
const test = require("node:test");

const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapClaim,
} = require("../../web/domain/mappers.cjs");

test("maps API payloads into graph-shaped records", () => {
  assert.deepEqual(mapAccount({ owner: "0xABC", soulId: "42" }), {
    _id: "0xabc",
    soulId: "42",
  });

  assert.deepEqual(mapSoul({
    soulId: "42",
    owner: "0xABC",
    name: "Ada Lovelace",
    handle: "ada",
    tags: ["builder"],
  }), {
    _id: "42",
    owner: "0xabc",
    type: "human",
    role: "",
    stage: 0,
    name: "Ada Lovelace",
    handle: "ada",
    tags: ["builder"],
    searchField: "ada lovelace0xabc",
  });

  assert.deepEqual(mapSoulPatch(
    { _id: "42", owner: "0xabc", name: "Ada" },
    { name: "Ada Lovelace", tags: ["math"] },
  ), {
    name: "Ada Lovelace",
    tags: ["math"],
    searchField: "ada lovelace0xabc",
  });

  assert.deepEqual(mapGame({ gameId: "0xGAME", name: "Guild", role: "guild" }), {
    _id: "0xgame",
    name: "Guild",
    type: "game",
    role: "guild",
  });

  assert.deepEqual(mapClaim({ claimId: "0xCLAIM", gameId: "0xGAME", name: "Quest" }), {
    _id: "0xclaim",
    game: "0xgame",
    name: "Quest",
    type: "claim",
    role: "",
    stage: 0,
  });
});
