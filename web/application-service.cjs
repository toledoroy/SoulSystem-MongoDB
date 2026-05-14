const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapGamePatch,
  mapClaim,
  mapClaimPatch,
} = require("./domain/mappers.cjs");
const { soulId, gameId, claimId } = require("./domain/ids.cjs");

async function createSoul(repo, input) {
  const soul = mapSoul(input);
  const account = mapAccount(input);

  await repo.upsertSoul(soul._id, withoutId(soul));
  await repo.upsertAccount(account._id, withoutId(account));
}

async function updateSoulProfile(repo, input) {
  const id = soulId(input.soulId);
  const existing = await repo.getSoul(id);
  if (!existing) {
    throw new Error("Soul not found");
  }

  await repo.upsertSoul(id, mapSoulPatch(existing, input));
}

async function deleteSoul(repo, input) {
  const id = soulId(input.soulId);
  const existing = await repo.getSoul(id);
  if (!existing) {
    throw new Error("Soul not found");
  }

  await repo.deleteSoul(id);
  if (existing.owner) {
    await repo.upsertAccount(existing.owner, { soulId: "" });
  }
}

async function createGame(repo, input) {
  const game = mapGame(input);
  await repo.upsertGame(game._id, withoutId(game));
}

async function updateGame(repo, input) {
  const id = gameId(input.gameId);
  const existing = await repo.getGame(id);
  if (!existing) {
    throw new Error("Game not found");
  }

  await repo.upsertGame(id, mapGamePatch(input));
}

async function deleteGame(repo, input) {
  const id = gameId(input.gameId);
  const existing = await repo.getGame(id);
  if (!existing) {
    throw new Error("Game not found");
  }

  await repo.deleteGame(id);
}

async function createClaim(repo, input) {
  const claim = mapClaim(input);
  await repo.upsertClaim(claim._id, withoutId(claim));
}

async function updateClaim(repo, input) {
  const id = claimId(input.claimId);
  const existing = await repo.getClaim(id);
  if (!existing) {
    throw new Error("Claim not found");
  }

  await repo.upsertClaim(id, mapClaimPatch(input));
}

async function deleteClaim(repo, input) {
  const id = claimId(input.claimId);
  const existing = await repo.getClaim(id);
  if (!existing) {
    throw new Error("Claim not found");
  }

  await repo.deleteClaim(id);
}

function withoutId(record) {
  const { _id, ...rest } = record;
  return rest;
}

module.exports = {
  createSoul,
  updateSoulProfile,
  deleteSoul,
  createGame,
  updateGame,
  deleteGame,
  createClaim,
  updateClaim,
  deleteClaim,
};
