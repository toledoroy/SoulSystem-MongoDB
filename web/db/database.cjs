const { collections } = require("./collections.cjs");

function createDatabase(db) {
  return {
    accounts: createCollectionRepository(db, collections.accounts),
    souls: createCollectionRepository(db, collections.souls),
    games: createCollectionRepository(db, collections.games),
    claims: createCollectionRepository(db, collections.claims),
    gameRoles: createCollectionRepository(db, collections.gameRoles),
    gameParticipants: createCollectionRepository(db, collections.gameParticipants),
    gameNominations: createCollectionRepository(db, collections.gameNominations),
    gamePosts: createCollectionRepository(db, collections.gamePosts),
    soulAttributes: createCollectionRepository(db, collections.soulAttributes),
    soulAssociations: createCollectionRepository(db, collections.soulAssociations),
  };
}

function createCollectionRepository(db, collectionName) {
  return {
    async get(id) {
      return db.collection(collectionName).findOne({ _id: id });
    },
    async upsert(id, patch) {
      await db.collection(collectionName).updateOne(
        { _id: id },
        {
          $set: patch,
          $setOnInsert: { _id: id },
        },
        { upsert: true },
      );
    },
    async delete(id) {
      await db.collection(collectionName).deleteOne({ _id: id });
    },
  };
}

module.exports = {
  createDatabase,
};
