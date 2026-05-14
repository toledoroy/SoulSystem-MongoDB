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
      collection: "gameRoles",
      indexes: [
        { keys: { ctx: 1, roleId: 1 }, options: { name: "gameRoles_ctx_roleId" } },
      ],
    },
    {
      collection: "gameParticipants",
      indexes: [
        { keys: { entity: 1 }, options: { name: "gameParticipants_entity" } },
        { keys: { sbt: 1 }, options: { name: "gameParticipants_sbt" } },
      ],
    },
    {
      collection: "gameNominations",
      indexes: [
        { keys: { game: 1, createdDate: -1 }, options: { name: "gameNominations_game_createdDate" } },
        { keys: { nominator: 1 }, options: { name: "gameNominations_nominator" } },
        { keys: { nominated: 1 }, options: { name: "gameNominations_nominated" } },
      ],
    },
    {
      collection: "gamePosts",
      indexes: [
        { keys: { entity: 1, createdDate: -1 }, options: { name: "gamePosts_entity_createdDate" } },
        { keys: { author: 1 }, options: { name: "gamePosts_author" } },
      ],
    },
    {
      collection: "claimRoles",
      indexes: [
        { keys: { ctx: 1, roleId: 1 }, options: { name: "claimRoles_ctx_roleId" } },
      ],
    },
    {
      collection: "claimParticipants",
      indexes: [
        { keys: { entity: 1 }, options: { name: "claimParticipants_entity" } },
        { keys: { sbt: 1 }, options: { name: "claimParticipants_sbt" } },
      ],
    },
    {
      collection: "claimNominations",
      indexes: [
        { keys: { claim: 1, createdDate: -1 }, options: { name: "claimNominations_claim_createdDate" } },
        { keys: { nominator: 1 }, options: { name: "claimNominations_nominator" } },
        { keys: { nominated: 1 }, options: { name: "claimNominations_nominated" } },
        { keys: { status: 1 }, options: { name: "claimNominations_status", sparse: true } },
      ],
    },
    {
      collection: "claimPosts",
      indexes: [
        { keys: { entity: 1, createdDate: -1 }, options: { name: "claimPosts_entity_createdDate" } },
        { keys: { author: 1 }, options: { name: "claimPosts_author" } },
      ],
    },
    {
      collection: "soulAttributes",
      indexes: [
        { keys: { aEnd: 1, role: 1 }, options: { name: "soulAttributes_aEnd_role" } },
        { keys: { bEnd: 1, role: 1 }, options: { name: "soulAttributes_bEnd_role" } },
      ],
    },
    {
      collection: "soulAssociations",
      indexes: [
        { keys: { aEnd: 1, role: 1 }, options: { name: "soulAssociations_aEnd_role" } },
        { keys: { bEnd: 1, role: 1 }, options: { name: "soulAssociations_bEnd_role" } },
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
