const { spawnSync } = require("node:child_process");

process.env.RUN_LIVE_MONGO_TESTS = "1";

const result = spawnSync(process.execPath, [
  "--test",
  "tests/web/live-mongo-smoke.test.cjs",
], {
  env: process.env,
  stdio: "inherit",
});

process.exitCode = result.status || 0;
