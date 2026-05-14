const { accountId, soulId, gameId, claimId } = require("./ids.cjs");

function mapAccount(input) {
  return {
    _id: accountId(input.owner),
    soulId: soulId(input.soulId),
  };
}

function mapSoul(input) {
  const soul = {
    _id: soulId(input.soulId),
    owner: accountId(input.owner),
    type: input.type || "human",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
    name: input.name || "",
    handle: input.handle || "",
    tags: input.tags || [],
  };

  soul.searchField = makeSearchField(soul);
  return soul;
}

function mapSoulPatch(existing, input) {
  const patch = pickDefined({
    name: input.name,
    handle: input.handle,
    image: input.image,
    tags: input.tags,
    role: input.role,
    stage: input.stage,
  });

  patch.searchField = makeSearchField({ ...existing, ...patch });
  return patch;
}

function mapGame(input) {
  return {
    _id: gameId(input.gameId),
    name: input.name || "",
    type: input.type || "game",
    role: input.role || "",
  };
}

function mapGamePatch(input) {
  return pickDefined({
    name: input.name,
    type: input.type,
    role: input.role,
  });
}

function mapClaim(input) {
  return {
    _id: claimId(input.claimId),
    game: input.gameId ? gameId(input.gameId) : "",
    name: input.name || "",
    type: input.type || "claim",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
  };
}

function mapClaimPatch(input) {
  return pickDefined({
    game: input.gameId ? gameId(input.gameId) : undefined,
    name: input.name,
    type: input.type,
    role: input.role,
    stage: input.stage,
  });
}

function makeSearchField(entity) {
  const fields = [];
  if (entity.name) fields.push(entity.name);
  if (entity.owner) fields.push(entity.owner);
  return fields.join("").toLowerCase();
}

function pickDefined(input) {
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function numberOrDefault(value, fallback) {
  return typeof value === "number" ? value : fallback;
}

module.exports = {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapGamePatch,
  mapClaim,
  mapClaimPatch,
};
