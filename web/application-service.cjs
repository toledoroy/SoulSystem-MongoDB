const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapGamePatch,
  mapGameNomination,
  mapGameParticipant,
  mapGamePost,
  mapGameRole,
  mapClaim,
  mapClaimPatch,
  mapSoulAssociation,
  mapSoulAttribute,
} = require("./domain/mappers.cjs");
const { soulId, gameId, gameParticipantId, gameRoleId, claimId } = require("./domain/ids.cjs");

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

async function createGameRole(repo, input) {
  const role = mapGameRole(input);
  await requireGame(repo, role.ctx);
  await repo.upsertGameRole(role._id, withoutId(role));
}

async function grantGameRole(repo, input) {
  const game = gameId(input.gameId);
  const soul = soulId(input.soulId);
  const roleId = String(input.roleId || "").trim();
  await requireGame(repo, game);
  await requireSoul(repo, soul);

  const existingRole = await repo.getGameRole(gameRoleId(game, roleId));
  const role = existingRole || mapGameRole({ gameId: game, roleId });
  const roleSouls = addUnique(role.souls || [], soul);
  const existingParticipant = await repo.getGameParticipant(gameParticipantId(game, soul));
  const participant = mapGameParticipant({
    gameId: game,
    soulId: soul,
    roles: addUnique(existingParticipant?.roles || [], roleId),
  });

  await repo.upsertGameParticipant(participant._id, withoutId(participant));
  await repo.upsertGameRole(role._id, withoutId({
    ...role,
    souls: roleSouls,
    soulsCount: roleSouls.length,
  }));
}

async function createGamePost(repo, input) {
  const post = mapGamePost(input);
  await requireGame(repo, post.entity);
  await requireSoul(repo, post.author);
  await repo.upsertGamePost(post._id, withoutId(post));
}

async function createGameNomination(repo, input) {
  const nomination = mapGameNomination(input);
  await requireGame(repo, nomination.game);
  await requireSoul(repo, nomination.nominator);
  await requireSoul(repo, nomination.nominated);
  await repo.upsertGameNomination(nomination._id, withoutId(nomination));
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

async function requireGame(repo, id) {
  const existing = await repo.getGame(id);
  if (!existing) {
    throw new Error("Game not found");
  }
  return existing;
}

async function requireSoul(repo, id) {
  const existing = await repo.getSoul(id);
  if (!existing) {
    throw new Error("Soul not found");
  }
  return existing;
}

function addUnique(values, value) {
  return values.includes(value) ? values : [...values, value];
}

async function setSoulAttribute(repo, input) {
  const attribute = mapSoulAttribute(input);
  const existing = await repo.getSoul(attribute.aEnd);
  if (!existing) {
    throw new Error("Soul not found");
  }

  await repo.upsertSoulAttribute(attribute._id, withoutId(attribute));
  if (attribute.role === "role") {
    await repo.upsertSoul(attribute.aEnd, { role: attribute.bEnd });
  }
}

async function setSoulAssociation(repo, input) {
  const association = mapSoulAssociation(input);
  const source = await repo.getSoul(association.aEnd);
  if (!source) {
    throw new Error("Source soul not found");
  }

  const target = await repo.getSoul(association.bEnd);
  if (!target) {
    throw new Error("Target soul not found");
  }

  await repo.upsertSoulAssociation(association._id, withoutId(association));
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
  createGameNomination,
  createGamePost,
  createGameRole,
  grantGameRole,
  updateGame,
  deleteGame,
  createClaim,
  updateClaim,
  deleteClaim,
  setSoulAssociation,
  setSoulAttribute,
};
