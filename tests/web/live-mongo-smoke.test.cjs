const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createClaim,
  createGame,
  createSoul,
  deleteClaim,
  deleteGame,
  deleteSoul,
  updateClaim,
  updateGame,
  updateSoulProfile,
} = require("../../web/application-service.cjs");
const { createMongoConnection } = require("../../web/mongo-client.cjs");

const liveMongoEnabled = process.env.RUN_LIVE_MONGO_TESTS === "1";

test("live Mongo repository can create, read, update, and delete core records", {
  skip: liveMongoEnabled ? false : "Set RUN_LIVE_MONGO_TESTS=1 to run live Mongo smoke tests",
}, async () => {
  const connection = await createMongoConnection({
    dbName: process.env.MONGODB_TEST_DB || process.env.MONGODB_DB || "soulsystem_test",
  });
  const { db, repository } = connection;
  const prefix = `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ids = {
    account: `0x${prefix}`,
    soul: `${prefix}-soul`,
    game: `0x${prefix}-game`,
    claim: `0x${prefix}-claim`,
  };

  try {
    await createSoul(repository, {
      soulId: ids.soul,
      owner: ids.account,
      name: "Smoke Soul",
      handle: "smoke",
    });
    await updateSoulProfile(repository, {
      soulId: ids.soul,
      name: "Smoke Soul Updated",
      tags: ["smoke"],
    });
    await createGame(repository, {
      gameId: ids.game,
      name: "Smoke Game",
    });
    await updateGame(repository, {
      gameId: ids.game,
      role: "test-game",
    });
    await createClaim(repository, {
      claimId: ids.claim,
      gameId: ids.game,
      name: "Smoke Claim",
    });
    await updateClaim(repository, {
      claimId: ids.claim,
      stage: 1,
    });

    assert.deepEqual(await repository.getSoul(ids.soul), {
      _id: ids.soul,
      owner: ids.account,
      type: "human",
      role: "",
      stage: 0,
      name: "Smoke Soul Updated",
      handle: "smoke",
      tags: ["smoke"],
      searchField: `smoke soul updated${ids.account}`,
    });
    assert.equal((await db.collection("accounts").findOne({ _id: ids.account })).soulId, ids.soul);
    assert.deepEqual(await repository.getGame(ids.game), {
      _id: ids.game,
      name: "Smoke Game",
      type: "game",
      role: "test-game",
    });
    assert.deepEqual(await repository.getClaim(ids.claim), {
      _id: ids.claim,
      game: ids.game,
      name: "Smoke Claim",
      type: "claim",
      role: "",
      stage: 1,
    });

    await deleteClaim(repository, { claimId: ids.claim });
    await deleteGame(repository, { gameId: ids.game });
    await deleteSoul(repository, { soulId: ids.soul });

    assert.equal(await repository.getClaim(ids.claim), null);
    assert.equal(await repository.getGame(ids.game), null);
    assert.equal(await repository.getSoul(ids.soul), null);
    assert.equal((await db.collection("accounts").findOne({ _id: ids.account })).soulId, "");
  } finally {
    await cleanupSmokeRecords(db, ids);
    await connection.close();
  }
});

async function cleanupSmokeRecords(db, ids) {
  await Promise.all([
    db.collection("claims").deleteOne({ _id: ids.claim }),
    db.collection("games").deleteOne({ _id: ids.game }),
    db.collection("souls").deleteOne({ _id: ids.soul }),
    db.collection("accounts").deleteOne({ _id: ids.account }),
  ]);
}
