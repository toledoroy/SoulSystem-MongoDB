const assert = require("node:assert/strict");
const test = require("node:test");

const {
  accountId,
  soulId,
  gameId,
  gameNominationId,
  gameParticipantId,
  gamePostId,
  gameRoleId,
  claimId,
  relationId,
  soulAssociationId,
  soulAttributeId,
} = require("../../web/domain/ids.cjs");

test("builds deterministic graph-shaped ids", () => {
  assert.equal(accountId(" 0xABC "), "0xabc");
  assert.equal(soulId(" 42 "), "42");
  assert.equal(gameId(" 0xGAME "), "0xgame");
  assert.equal(gameNominationId("0xGAME", "tx-1"), "0xgame_tx-1");
  assert.equal(gameRoleId("0xGAME", "1"), "0xgame_1");
  assert.equal(gameParticipantId("0xGAME", "42"), "0xgame_42");
  assert.equal(gamePostId("0xGAME", "tx-1"), "0xgame_tx-1");
  assert.equal(claimId(" 0xCLAIM "), "0xclaim");
  assert.equal(relationId("soul-1", "admin", "game-1"), "soul-1:admin:game-1");
  assert.equal(soulAttributeId("42", "role", "builder"), "ATTR_42_role_builder");
  assert.equal(soulAssociationId("42", "mentor", "77"), "ASSOC_42_mentor_77");
});

test("keeps relation ids explicit when optional parts are absent", () => {
  assert.equal(relationId("soul-1", "", "game-1"), "soul-1::game-1");
});
