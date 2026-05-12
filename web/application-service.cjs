const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapClaim,
} = require("./domain/mappers.cjs");

async function createSoul(repo, input) {
  const soul = mapSoul(input);
  const account = mapAccount(input);

  await repo.upsertSoul(soul._id, withoutId(soul));
  await repo.upsertAccount(account._id, withoutId(account));
}

async function updateSoulProfile(repo, input) {
  const existing = await repo.getSoul(input.soulId);
  if (!existing) {
    throw new Error("Soul not found");
  }

  await repo.upsertSoul(input.soulId, mapSoulPatch(existing, input));
}

async function createGame(repo, input) {
  const game = mapGame(input);
  await repo.upsertGame(game._id, withoutId(game));
}

async function createClaim(repo, input) {
  const claim = mapClaim(input);
  await repo.upsertClaim(claim._id, withoutId(claim));
}

function withoutId(record) {
  const { _id, ...rest } = record;
  return rest;
}

module.exports = {
  createSoul,
  updateSoulProfile,
  createGame,
  createClaim,
};
