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

module.exports = {
  accountId,
  soulId,
  gameId,
  claimId,
  relationId,
};
