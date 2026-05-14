const { createDatabase } = require("./db/database.cjs");

function createMongoRepository(db) {
  const database = createDatabase(db);

  return {
    async getSoul(id) {
      return database.souls.get(id);
    },
    async getGame(id) {
      return database.games.get(id);
    },
    async getClaim(id) {
      return database.claims.get(id);
    },
    async getGameRole(id) {
      return database.gameRoles.get(id);
    },
    async getGameParticipant(id) {
      return database.gameParticipants.get(id);
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
    async deleteGame(id) {
      await database.games.delete(id);
    },
    async upsertGameRole(id, patch) {
      await database.gameRoles.upsert(id, patch);
    },
    async upsertGameParticipant(id, patch) {
      await database.gameParticipants.upsert(id, patch);
    },
    async upsertGamePost(id, patch) {
      await database.gamePosts.upsert(id, patch);
    },
    async upsertClaim(address, patch) {
      await database.claims.upsert(address, patch);
    },
    async deleteClaim(id) {
      await database.claims.delete(id);
    },
    async upsertSoulAttribute(id, patch) {
      await database.soulAttributes.upsert(id, patch);
    },
    async upsertSoulAssociation(id, patch) {
      await database.soulAssociations.upsert(id, patch);
    },
  };
}

module.exports = {
  createMongoRepository,
};
