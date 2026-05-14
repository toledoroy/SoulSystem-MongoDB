const assert = require("node:assert/strict");
const test = require("node:test");

const {
  accountId,
  soulId,
  gameId,
  claimId,
  relationId,
} = require("../../web/domain/ids.cjs");

test("builds deterministic graph-shaped ids", () => {
  assert.equal(accountId(" 0xABC "), "0xabc");
  assert.equal(soulId(" 42 "), "42");
  assert.equal(gameId(" 0xGAME "), "0xgame");
  assert.equal(claimId(" 0xCLAIM "), "0xclaim");
  assert.equal(relationId("soul-1", "admin", "game-1"), "soul-1:admin:game-1");
});

test("keeps relation ids explicit when optional parts are absent", () => {
  assert.equal(relationId("soul-1", "", "game-1"), "soul-1::game-1");
});
