const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv(options = {}) {
  const cwd = options.cwd || process.cwd();
  const files = options.files || [".env", ".env.local"];
  const loaded = [];

  for (const file of files) {
    const filePath = path.resolve(cwd, file);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const values = parseEnvFile(fs.readFileSync(filePath, "utf8"));

    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    loaded.push(filePath);
  }

  return loaded;
}

function parseEnvFile(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    values[key] = normalizeEnvValue(rawValue);
  }

  return values;
}

function normalizeEnvValue(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return stripInlineComment(value).trim();
}

function stripInlineComment(value) {
  const commentIndex = value.search(/\s#/);
  return commentIndex === -1 ? value : value.slice(0, commentIndex);
}

module.exports = {
  loadLocalEnv,
  parseEnvFile,
};
