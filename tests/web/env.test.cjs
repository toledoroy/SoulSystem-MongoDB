const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadLocalEnv, parseEnvFile } = require("../../web/env.cjs");

test("parses dotenv-style values used by local MongoDB configuration", () => {
  const values = parseEnvFile(`
    # local settings
    MONGODB_URI=mongodb+srv://user:password@example.mongodb.net/
    MONGODB_DB="soulsystem"
    export MONGODB_TIMEOUT_MS=5000 # milliseconds
  `);

  assert.deepEqual(values, {
    MONGODB_URI: "mongodb+srv://user:password@example.mongodb.net/",
    MONGODB_DB: "soulsystem",
    MONGODB_TIMEOUT_MS: "5000",
  });
});

test("loads .env.local without replacing values already provided by the shell", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "soulsystem-env-"));
  const oldMongoUri = process.env.MONGODB_URI;
  const oldMongoDb = process.env.MONGODB_DB;

  try {
    fs.writeFileSync(
      path.join(tempDir, ".env.local"),
      "MONGODB_URI=mongodb://from-file:27017\nMONGODB_DB=soulsystem\n",
    );
    process.env.MONGODB_URI = "mongodb://from-shell:27017";
    delete process.env.MONGODB_DB;

    const loaded = loadLocalEnv({ cwd: tempDir, files: [".env.local"] });

    assert.deepEqual(loaded, [path.join(tempDir, ".env.local")]);
    assert.equal(process.env.MONGODB_URI, "mongodb://from-shell:27017");
    assert.equal(process.env.MONGODB_DB, "soulsystem");
  } finally {
    restoreEnv("MONGODB_URI", oldMongoUri);
    restoreEnv("MONGODB_DB", oldMongoDb);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function restoreEnv(key, value) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
