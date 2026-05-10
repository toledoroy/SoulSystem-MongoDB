const assert = require("node:assert/strict");
const test = require("node:test");

const { renderHomepage } = require("../../web/homepage.cjs");

test("renders a positive MongoDB status indicator", () => {
  const html = renderHomepage({
    mongo: {
      available: true,
      status: "available",
      message: "MongoDB connection verified",
    },
  });

  assert.match(html, /MongoDB/);
  assert.match(html, /Available/);
  assert.match(html, /MongoDB connection verified/);
  assert.match(html, /status--available/);
});

test("renders an unavailable MongoDB status indicator", () => {
  const html = renderHomepage({
    mongo: {
      available: false,
      status: "not_configured",
      message: "MONGODB_URI is not configured",
    },
  });

  assert.match(html, /MongoDB/);
  assert.match(html, /Unavailable/);
  assert.match(html, /MONGODB_URI is not configured/);
  assert.match(html, /status--unavailable/);
});
