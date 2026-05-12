function getMongoIndexSpecs() {
  return [
    {
      collection: "accounts",
      indexes: [
        { keys: { soulId: 1 }, options: { name: "accounts_soulId", sparse: true } },
      ],
    },
    {
      collection: "souls",
      indexes: [
        { keys: { owner: 1 }, options: { name: "souls_owner" } },
        { keys: { handle: 1 }, options: { name: "souls_handle", sparse: true } },
        { keys: { searchField: "text" }, options: { name: "souls_search_text" } },
      ],
    },
    {
      collection: "games",
      indexes: [
        { keys: { hub: 1 }, options: { name: "games_hub" } },
      ],
    },
    {
      collection: "claims",
      indexes: [
        { keys: { hub: 1 }, options: { name: "claims_hub" } },
        { keys: { game: 1 }, options: { name: "claims_game", sparse: true } },
      ],
    },
  ];
}

async function initializeMongoIndexes(db, specs = getMongoIndexSpecs()) {
  let applied = 0;

  for (const spec of specs) {
    const collection = db.collection(spec.collection);

    for (const index of spec.indexes) {
      await collection.createIndex(index.keys, index.options);
      applied += 1;
    }
  }

  return applied;
}

module.exports = {
  getMongoIndexSpecs,
  initializeMongoIndexes,
};
