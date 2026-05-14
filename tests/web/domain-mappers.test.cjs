const assert = require("node:assert/strict");
const test = require("node:test");

const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapGamePatch,
  mapClaim,
  mapClaimPatch,
  mapSoulAssociation,
  mapSoulAttribute,
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

test("preserves numeric stage zero and ignores undefined patch fields", () => {
  assert.deepEqual(mapSoul({
    soulId: "7",
    owner: "0xDEF",
    stage: 0,
    role: "artist",
  }), {
    _id: "7",
    owner: "0xdef",
    type: "human",
    role: "artist",
    stage: 0,
    name: "",
    handle: "",
    tags: [],
    searchField: "0xdef",
  });

  assert.deepEqual(mapSoulPatch(
    { _id: "7", owner: "0xdef", name: "Existing", handle: "old" },
    { name: undefined, handle: "new" },
  ), {
    handle: "new",
    searchField: "existing0xdef",
  });
});

test("maps game and claim patches without undefined fields", () => {
  assert.deepEqual(mapGamePatch({ name: "Guild 2", role: undefined }), {
    name: "Guild 2",
  });

  assert.deepEqual(mapClaimPatch({
    gameId: "0xGAME",
    name: "Quest 2",
    stage: 0,
    role: undefined,
  }), {
    game: "0xgame",
    name: "Quest 2",
    stage: 0,
  });
});

test("maps soul attributes and associations into graph-shaped records", () => {
  assert.deepEqual(mapSoulAttribute({
    soulId: " 42 ",
    role: "role",
    value: "builder",
  }), {
    _id: "ATTR_42_role_builder",
    aEnd: "42",
    bEnd: "builder",
    role: "role",
  });

  assert.deepEqual(mapSoulAssociation({
    fromSoulId: " 42 ",
    role: "mentor",
    toSoulId: " 77 ",
    qty: 2,
  }), {
    _id: "ASSOC_42_mentor_77",
    aEnd: "42",
    bEnd: "77",
    role: "mentor",
    qty: 2,
  });
});
