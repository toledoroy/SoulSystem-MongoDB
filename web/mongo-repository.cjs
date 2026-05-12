const { createDatabase } = require("./db/database.cjs");

function createMongoRepository(db) {
  const database = createDatabase(db);

  return {
    async getSoul(id) {
      return database.souls.get(id);
    },
    async upsertSoul(id, patch) {
      await database.souls.upsert(id, patch);
    },
    async deleteSoul(id) {
      await database.souls.delete(id);
    },
    async upsertAccount(address, patch) {
      await database.accounts.upsert(address, patch);
    },
    async upsertGame(address, patch) {
      await database.games.upsert(address, patch);
    },
    async upsertClaim(address, patch) {
      await database.claims.upsert(address, patch);
    },
  };
}

module.exports = {
  createMongoRepository,
};
