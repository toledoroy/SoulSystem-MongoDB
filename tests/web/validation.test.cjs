const assert = require("node:assert/strict");
const test = require("node:test");

const {
  validateClaimPatch,
  validateGameCreate,
  validateSoulCreate,
  validateSoulPatch,
} = require("../../web/validation.cjs");

test("validates required string fields for creates", () => {
  assert.doesNotThrow(() => validateSoulCreate({
    soulId: "42",
    owner: "0xabc",
    tags: ["builder"],
  }));
  assert.doesNotThrow(() => validateGameCreate({ gameId: "0xgame" }));

  assertValidationError(
    () => validateSoulCreate({ soulId: "42", owner: " " }),
    "owner must be a non-empty string",
  );
  assertValidationError(
    () => validateGameCreate({ gameId: "" }),
    "gameId must be a non-empty string",
  );
});

test("validates optional array and numeric patch fields", () => {
  assert.doesNotThrow(() => validateSoulPatch({ tags: ["math"] }));
  assert.doesNotThrow(() => validateClaimPatch({ stage: 0 }));

  assertValidationError(
    () => validateSoulPatch({ tags: "math" }),
    "tags must be an array of strings",
  );
  assertValidationError(
    () => validateClaimPatch({ stage: "1" }),
    "stage must be a number",
  );
});

test("requires JSON bodies to be objects", () => {
  assertValidationError(
    () => validateSoulCreate(null),
    "Request body must be a JSON object",
  );
  assertValidationError(
    () => validateSoulCreate(["not", "object"]),
    "Request body must be a JSON object",
  );
});

function assertValidationError(fn, message) {
  assert.throws(fn, (error) => {
    assert.equal(error.statusCode, 400);
    assert.equal(error.code, "validation_error");
    assert.equal(error.message, message);
    return true;
  });
}
