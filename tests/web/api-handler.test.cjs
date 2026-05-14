const assert = require("node:assert/strict");
const test = require("node:test");

const { createApiHandler } = require("../../web/api-handler.cjs");

test("exports an API request handler factory", () => {
  assert.equal(typeof createApiHandler, "function");
  assert.equal(typeof createApiHandler({ repository: {} }), "function");
});
