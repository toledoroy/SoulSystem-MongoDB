const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createSoul,
  updateSoulProfile,
  createGame,
  createClaim,
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

test("requires an existing soul before profile update", async () => {
  const repo = createRecordingRepo();

  await assert.rejects(
    () => updateSoulProfile(repo, { soulId: "missing", name: "Nobody" }),
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

function createRecordingRepo(seed = {}) {
  return {
    calls: [],
    async getSoul(id) {
      this.calls.push(["getSoul", id]);
      return seed.soul || null;
    },
    async upsertSoul(id, patch) {
      this.calls.push(["upsertSoul", id, patch]);
    },
    async upsertAccount(id, patch) {
      this.calls.push(["upsertAccount", id, patch]);
    },
    async upsertGame(id, patch) {
      this.calls.push(["upsertGame", id, patch]);
    },
    async upsertClaim(id, patch) {
      this.calls.push(["upsertClaim", id, patch]);
    },
  };
}
