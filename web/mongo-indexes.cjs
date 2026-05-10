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
    {
      collection: "rawEvents",
      indexes: [
        { keys: { blockNumber: 1 }, options: { name: "raw_events_blockNumber" } },
        {
          keys: { chainId: 1, transactionHash: 1, logIndex: 1 },
          options: { name: "raw_events_unique_log", unique: true },
        },
      ],
    },
    {
      collection: "indexerCheckpoints",
      indexes: [
        {
          keys: { chainId: 1, sourceName: 1, contractAddress: 1 },
          options: { name: "checkpoints_unique_source", unique: true },
        },
      ],
    },
  ];
}

async function initializeMongoIndexes(db, specs = getMongoIndexSpecs()) {
  for (const spec of specs) {
    const collection = db.collection(spec.collection);

    for (const index of spec.indexes) {
      await collection.createIndex(index.keys, index.options);
    }
  }
}

module.exports = {
  getMongoIndexSpecs,
  initializeMongoIndexes,
};
