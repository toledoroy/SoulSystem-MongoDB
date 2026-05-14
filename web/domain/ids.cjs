function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function accountId(address) {
  return normalizeId(address);
}

function soulId(id) {
  return String(id || "").trim();
}

function gameId(address) {
  return normalizeId(address);
}

function gameRoleId(game, role) {
  return `${gameId(game)}_${String(role || "").trim()}`;
}

function gameNominationId(game, nomination) {
  return `${gameId(game)}_${String(nomination || "").trim()}`;
}

function gameParticipantId(game, soul) {
  return `${gameId(game)}_${soulId(soul)}`;
}

function gamePostId(game, post) {
  return `${gameId(game)}_${String(post || "").trim()}`;
}

function claimId(address) {
  return normalizeId(address);
}

function claimRoleId(claim, role) {
  return `${claimId(claim)}_${String(role || "").trim()}`;
}

function claimParticipantId(claim, soul) {
  return `${claimId(claim)}_${soulId(soul)}`;
}

function claimNominationId(claim, nomination) {
  return `${claimId(claim)}_${String(nomination || "").trim()}`;
}

function claimPostId(claim, post) {
  return `${claimId(claim)}_${String(post || "").trim()}`;
}

function relationId(...parts) {
  return parts.map((part) => String(part || "").trim()).join(":");
}

function soulAttributeId(soul, role, value) {
  return `ATTR_${soulId(soul)}_${String(role || "").trim()}_${String(value || "").trim()}`;
}

function soulAssociationId(fromSoul, role, toSoul) {
  return `ASSOC_${soulId(fromSoul)}_${String(role || "").trim()}_${soulId(toSoul)}`;
}

module.exports = {
  accountId,
  soulId,
  gameId,
  gameNominationId,
  gameParticipantId,
  gamePostId,
  gameRoleId,
  claimId,
  claimNominationId,
  claimParticipantId,
  claimPostId,
  claimRoleId,
  relationId,
  soulAssociationId,
  soulAttributeId,
};
