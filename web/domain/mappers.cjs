const {
  accountId,
  soulId,
  gameId,
  claimId,
  soulAssociationId,
  soulAttributeId,
} = require("./ids.cjs");

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

function mapSoulAttribute(input) {
  const mappedSoulId = soulId(input.soulId);
  const role = String(input.role || "").trim();
  const value = String(input.value || "").trim();

  return {
    _id: soulAttributeId(mappedSoulId, role, value),
    aEnd: mappedSoulId,
    bEnd: value,
    role,
  };
}

function mapSoulAssociation(input) {
  const fromSoulId = soulId(input.fromSoulId);
  const toSoulId = soulId(input.toSoulId);
  const role = String(input.role || "").trim();

  return pickDefined({
    _id: soulAssociationId(fromSoulId, role, toSoulId),
    aEnd: fromSoulId,
    bEnd: toSoulId,
    role,
    qty: input.qty,
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
  mapSoulAssociation,
  mapSoulAttribute,
};
