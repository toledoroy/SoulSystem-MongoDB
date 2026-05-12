function createMongoRepository(db) {
  return {
    async getSoul(id) {
      return db.collection("souls").findOne({ _id: id });
    },
    async upsertSoul(id, patch) {
      await upsertById(db, "souls", id, patch);
    },
    async deleteSoul(id) {
      await db.collection("souls").deleteOne({ _id: id });
    },
    async upsertAccount(address, patch) {
      await upsertById(db, "accounts", address, patch);
    },
    async upsertGame(address, patch) {
      await upsertById(db, "games", address, patch);
    },
    async upsertClaim(address, patch) {
      await upsertById(db, "claims", address, patch);
    },
  };
}

async function upsertById(db, collectionName, id, patch) {
  await db.collection(collectionName).updateOne(
    { _id: id },
    {
      $set: patch,
      $setOnInsert: { _id: id },
    },
    { upsert: true },
  );
}

module.exports = {
  createMongoRepository,
};
