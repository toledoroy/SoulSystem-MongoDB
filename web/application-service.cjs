async function createSoul(repo, input) {
  const soul = {
    owner: input.owner,
    type: input.type || "human",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
    name: input.name || "",
    handle: input.handle || "",
    tags: input.tags || [],
  };

  soul.searchField = makeSearchField(soul);

  await repo.upsertSoul(input.soulId, soul);
  await repo.upsertAccount(input.owner, { soulId: input.soulId });
}

async function updateSoulProfile(repo, input) {
  const existing = await repo.getSoul(input.soulId);
  if (!existing) {
    throw new Error("Soul not found");
  }

  const patch = pickDefined({
    name: input.name,
    handle: input.handle,
    image: input.image,
    tags: input.tags,
    role: input.role,
    stage: input.stage,
  });

  patch.searchField = makeSearchField({ ...existing, ...patch });

  await repo.upsertSoul(input.soulId, patch);
}

async function createGame(repo, input) {
  await repo.upsertGame(input.gameId, {
    name: input.name || "",
    type: input.type || "game",
    role: input.role || "",
  });
}

async function createClaim(repo, input) {
  await repo.upsertClaim(input.claimId, {
    game: input.gameId || "",
    name: input.name || "",
    type: input.type || "claim",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
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
  createSoul,
  updateSoulProfile,
  createGame,
  createClaim,
};
