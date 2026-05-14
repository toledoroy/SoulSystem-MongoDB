const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSoul,
  updateSoulProfile,
  deleteSoul,
  createGame,
  createGameNomination,
  createGamePost,
  createGameRole,
  updateGame,
  deleteGame,
  createClaim,
  updateClaim,
  deleteClaim,
  setSoulAssociation,
  setSoulAttribute,
  grantGameRole,
} = require("../../web/application-service.cjs");

test("creates an off-chain soul and account mapping", async () => {
  const repo = createRecordingRepo();

  await createSoul(repo, {
    soulId: "soul-1",
    owner: "user-1",
    name: "Ada Lovelace",
    handle: "ada",
    tags: ["builder"],
  });

  assert.deepEqual(repo.calls, [
    ["upsertSoul", "soul-1", {
      owner: "user-1",
      type: "human",
      role: "",
      stage: 0,
      name: "Ada Lovelace",
      handle: "ada",
      tags: ["builder"],
      searchField: "ada lovelaceuser-1",
    }],
    ["upsertAccount", "user-1", { soulId: "soul-1" }],
  ]);
});

test("updates an existing soul profile", async () => {
  const repo = createRecordingRepo({
    soul: { _id: "soul-1", owner: "user-1", name: "Ada" },
  });

  await updateSoulProfile(repo, {
    soulId: "soul-1",
    name: "Ada Lovelace",
    image: "https://example.test/ada.png",
    tags: ["math"],
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "soul-1"],
    ["upsertSoul", "soul-1", {
      name: "Ada Lovelace",
      image: "https://example.test/ada.png",
      tags: ["math"],
      searchField: "ada lovelaceuser-1",
    }],
  ]);
});

test("normalizes soul ids before updating an existing profile", async () => {
  const repo = createRecordingRepo({
    soul: { _id: "42", owner: "0xabc", name: "Ada" },
  });

  await updateSoulProfile(repo, {
    soulId: " 42 ",
    name: "Ada Lovelace",
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["upsertSoul", "42", {
      name: "Ada Lovelace",
      searchField: "ada lovelace0xabc",
    }],
  ]);
});

test("requires an existing soul before profile update", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => updateSoulProfile(repo, { soulId: "missing", name: "Nobody" }),
    /Soul not found/,
  );
});

test("deletes an existing soul and clears its account mapping", async () => {
  const repo = createRecordingRepo({
    soul: { _id: "42", owner: "0xabc", name: "Ada" },
  });

  await deleteSoul(repo, { soulId: " 42 " });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["deleteSoul", "42"],
    ["upsertAccount", "0xabc", { soulId: "" }],
  ]);
});

test("requires an existing soul before delete", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => deleteSoul(repo, { soulId: "missing" }),
    /Soul not found/,
  );
});

test("creates off-chain game and claim records", async () => {
  const repo = createRecordingRepo();

  await createGame(repo, {
    gameId: "game-1",
    name: "Guild Game",
    type: "game",
    role: "guild",
  });
  await createClaim(repo, {
    claimId: "claim-1",
    gameId: "game-1",
    name: "First Claim",
    type: "claim",
  });

  assert.deepEqual(repo.calls, [
    ["upsertGame", "game-1", {
      name: "Guild Game",
      type: "game",
      role: "guild",
    }],
    ["upsertClaim", "claim-1", {
      game: "game-1",
      name: "First Claim",
      type: "claim",
      role: "",
      stage: 0,
    }],
  ]);
});

test("creates game roles with graph-shaped defaults", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
  });

  await createGameRole(repo, {
    gameId: " 0xGAME ",
    roleId: "1",
    name: "Admin",
    uri: "ipfs://role",
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["upsertGameRole", "0xgame_1", {
      ctx: "0xgame",
      roleId: "1",
      name: "Admin",
      uri: "ipfs://role",
      souls: [],
      soulsCount: 0,
    }],
  ]);
});

test("grants game roles idempotently to participants and role membership", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
    soul: { _id: "42", owner: "0xabc" },
    gameRole: { _id: "0xgame_1", ctx: "0xgame", roleId: "1", name: "Admin", souls: ["42"], soulsCount: 1 },
    gameParticipant: { _id: "0xgame_42", entity: "0xgame", sbt: "42", roles: ["1"] },
  });

  await grantGameRole(repo, {
    gameId: "0xGAME",
    soulId: "42",
    roleId: "1",
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["getSoul", "42"],
    ["getGameRole", "0xgame_1"],
    ["getGameParticipant", "0xgame_42"],
    ["upsertGameParticipant", "0xgame_42", {
      entity: "0xgame",
      sbt: "42",
      roles: ["1"],
    }],
    ["upsertGameRole", "0xgame_1", {
      ctx: "0xgame",
      roleId: "1",
      name: "Admin",
      souls: ["42"],
      soulsCount: 1,
    }],
  ]);
});

test("creates game posts for existing game and author soul", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
    soul: { _id: "42", owner: "0xabc" },
  });

  await createGamePost(repo, {
    gameId: "0xGAME",
    postId: "tx-1",
    authorSoulId: "42",
    entityRole: "1",
    uri: "ipfs://post",
    createdDate: 123,
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["getSoul", "42"],
    ["upsertGamePost", "0xgame_tx-1", {
      entity: "0xgame",
      createdDate: 123,
      author: "42",
      entityRole: "1",
      uri: "ipfs://post",
    }],
  ]);
});

test("creates game nominations for existing game and souls", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
    souls: new Map([
      ["42", { _id: "42", owner: "0xabc" }],
      ["77", { _id: "77", owner: "0xdef" }],
    ]),
  });

  await createGameNomination(repo, {
    gameId: "0xGAME",
    nominationId: "tx-1",
    nominatorSoulId: "42",
    nominatedSoulId: "77",
    createdDate: 123,
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["getSoul", "42"],
    ["getSoul", "77"],
    ["upsertGameNomination", "0xgame_tx-1", {
      game: "0xgame",
      createdDate: 123,
      nominator: "42",
      nominated: "77",
    }],
  ]);
});

test("requires existing game domain records before game role writes", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => createGameRole(repo, { gameId: "0xmissing", roleId: "1", name: "Admin" }),
    /Game not found/,
  );
  await assert.rejects(
    () => grantGameRole(repo, { gameId: "0xmissing", soulId: "42", roleId: "1" }),
    /Game not found/,
  );
  await assert.rejects(
    () => createGamePost(repo, { gameId: "0xmissing", postId: "tx", authorSoulId: "42", uri: "ipfs:\/\/post" }),
    /Game not found/,
  );
  await assert.rejects(
    () => createGameNomination(repo, {
      gameId: "0xmissing",
      nominationId: "tx",
      nominatorSoulId: "42",
      nominatedSoulId: "77",
    }),
    /Game not found/,
  );
});

test("updates existing game and claim records", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
    claim: { _id: "0xclaim", name: "Quest" },
  });

  await updateGame(repo, { gameId: " 0xGAME ", name: "Guild 2" });
  await updateClaim(repo, { claimId: " 0xCLAIM ", gameId: "0xGAME", stage: 1 });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["upsertGame", "0xgame", { name: "Guild 2" }],
    ["getClaim", "0xclaim"],
    ["upsertClaim", "0xclaim", { game: "0xgame", stage: 1 }],
  ]);
});

test("requires existing game and claim records before update", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => updateGame(repo, { gameId: "0xmissing", name: "Missing" }),
    /Game not found/,
  );
  await assert.rejects(
    () => updateClaim(repo, { claimId: "0xmissing", name: "Missing" }),
    /Claim not found/,
  );
});

test("deletes existing game and claim records", async () => {
  const repo = createRecordingRepo({
    game: { _id: "0xgame", name: "Guild" },
    claim: { _id: "0xclaim", name: "Quest" },
  });

  await deleteGame(repo, { gameId: " 0xGAME " });
  await deleteClaim(repo, { claimId: " 0xCLAIM " });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["deleteGame", "0xgame"],
    ["getClaim", "0xclaim"],
    ["deleteClaim", "0xclaim"],
  ]);
});

test("requires existing game and claim records before delete", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => deleteGame(repo, { gameId: "0xmissing" }),
    /Game not found/,
  );
  await assert.rejects(
    () => deleteClaim(repo, { claimId: "0xmissing" }),
    /Claim not found/,
  );
});

test("sets soul attributes and caches role attributes on the soul", async () => {
  const repo = createRecordingRepo({
    soul: { _id: "42", owner: "0xabc", role: "" },
  });

  await setSoulAttribute(repo, {
    soulId: " 42 ",
    role: "role",
    value: "builder",
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["upsertSoulAttribute", "ATTR_42_role_builder", {
      aEnd: "42",
      bEnd: "builder",
      role: "role",
    }],
    ["upsertSoul", "42", { role: "builder" }],
  ]);
});

test("sets soul associations between existing souls", async () => {
  const repo = createRecordingRepo({
    souls: new Map([
      ["42", { _id: "42", owner: "0xabc" }],
      ["77", { _id: "77", owner: "0xdef" }],
    ]),
  });

  await setSoulAssociation(repo, {
    fromSoulId: "42",
    role: "mentor",
    toSoulId: "77",
    qty: 2,
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["getSoul", "77"],
    ["upsertSoulAssociation", "ASSOC_42_mentor_77", {
      aEnd: "42",
      bEnd: "77",
      role: "mentor",
      qty: 2,
    }],
  ]);
});

test("requires existing souls before writing soul relations", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => setSoulAttribute(repo, { soulId: "missing", role: "role", value: "builder" }),
    /Soul not found/,
  );
  await assert.rejects(
    () => setSoulAssociation(repo, { fromSoulId: "missing", role: "mentor", toSoulId: "77" }),
    /Source soul not found/,
  );
});

function createRecordingRepo(seed = {}) {
  return {
    calls: [],
    async getSoul(id) {
      this.calls.push(["getSoul", id]);
      if (seed.souls) return seed.souls.get(id) || null;
      return seed.soul || null;
    },
    async getGame(id) {
      this.calls.push(["getGame", id]);
      return seed.game || null;
    },
    async getClaim(id) {
      this.calls.push(["getClaim", id]);
      return seed.claim || null;
    },
    async getGameRole(id) {
      this.calls.push(["getGameRole", id]);
      return seed.gameRole || null;
    },
    async getGameParticipant(id) {
      this.calls.push(["getGameParticipant", id]);
      return seed.gameParticipant || null;
    },
    async upsertSoul(id, patch) {
      this.calls.push(["upsertSoul", id, patch]);
    },
    async deleteSoul(id) {
      this.calls.push(["deleteSoul", id]);
    },
    async upsertAccount(id, patch) {
      this.calls.push(["upsertAccount", id, patch]);
    },
    async upsertGame(id, patch) {
      this.calls.push(["upsertGame", id, patch]);
    },
    async deleteGame(id) {
      this.calls.push(["deleteGame", id]);
    },
    async upsertGameRole(id, patch) {
      this.calls.push(["upsertGameRole", id, patch]);
    },
    async upsertGameParticipant(id, patch) {
      this.calls.push(["upsertGameParticipant", id, patch]);
    },
    async upsertGamePost(id, patch) {
      this.calls.push(["upsertGamePost", id, patch]);
    },
    async upsertGameNomination(id, patch) {
      this.calls.push(["upsertGameNomination", id, patch]);
    },
    async upsertClaim(id, patch) {
      this.calls.push(["upsertClaim", id, patch]);
    },
    async deleteClaim(id) {
      this.calls.push(["deleteClaim", id]);
    },
    async upsertSoulAttribute(id, patch) {
      this.calls.push(["upsertSoulAttribute", id, patch]);
    },
    async upsertSoulAssociation(id, patch) {
      this.calls.push(["upsertSoulAssociation", id, patch]);
    },
  };
}
