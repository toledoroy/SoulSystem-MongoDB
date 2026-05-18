const assert = require("node:assert/strict");
const test = require("node:test");

const { createServer } = require("../../web/server.cjs");

test("exports a web server without optional branch-only API modules", () => {
  const server = createServer({
    checkMongoHealth: async () => ({
      available: true,
      status: "available",
      message: "MongoDB endpoint is reachable",
    }),
  });

  assert.equal(typeof server.listen, "function");
  server.close();
});
