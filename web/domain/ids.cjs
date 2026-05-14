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

function claimId(address) {
  return normalizeId(address);
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
  claimId,
  relationId,
  soulAssociationId,
  soulAttributeId,
};
