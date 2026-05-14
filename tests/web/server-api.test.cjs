const assert = require("node:assert/strict");
const test = require("node:test");

const { createServer } = require("../../web/server.cjs");

test("creates a soul through the HTTP API", async () => {
  const repo = createRecordingRepo();
  const server = createServer({
    repository: repo,
    checkMongoHealth: async () => ({ available: true }),
  });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/souls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        soulId: "42",
        owner: "0xABC",
        name: "Ada Lovelace",
        handle: "ada",
      }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: "42" });
  });

  assert.deepEqual(repo.calls, [
    ["upsertSoul", "42", {
      owner: "0xabc",
      type: "human",
      role: "",
      stage: 0,
      name: "Ada Lovelace",
      handle: "ada",
      tags: [],
      searchField: "ada lovelace0xabc",
    }],
    ["upsertAccount", "0xabc", { soulId: "42" }],
  ]);
});

test("updates a soul profile through the HTTP API", async () => {
  const repo = createRecordingRepo({
    souls: new Map([["42", { _id: "42", owner: "0xabc", name: "Ada" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/souls/42`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada Lovelace", tags: ["math"] }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: "42" });
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["upsertSoul", "42", {
      name: "Ada Lovelace",
      tags: ["math"],
      searchField: "ada lovelace0xabc",
    }],
  ]);
});

test("deletes a soul through the HTTP API", async () => {
  const repo = createRecordingRepo({
    souls: new Map([["42", { _id: "42", owner: "0xabc", name: "Ada" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/souls/42`, {
      method: "DELETE",
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: "42", deleted: true });
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["deleteSoul", "42"],
    ["upsertAccount", "0xabc", { soulId: "" }],
  ]);
});

test("reads souls, games, and claims through the HTTP API", async () => {
  const repo = createRecordingRepo({
    souls: new Map([["42", { _id: "42", owner: "0xabc", name: "Ada" }]]),
    games: new Map([["0xgame", { _id: "0xgame", name: "Guild" }]]),
    claims: new Map([["0xclaim", { _id: "0xclaim", name: "Quest" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const soulResponse = await fetch(`${baseUrl}/api/souls/42`);
    const gameResponse = await fetch(`${baseUrl}/api/games/0xgame`);
    const claimResponse = await fetch(`${baseUrl}/api/claims/0xclaim`);

    assert.equal(soulResponse.status, 200);
    assert.deepEqual(await soulResponse.json(), {
      soul: { _id: "42", owner: "0xabc", name: "Ada" },
    });
    assert.equal(gameResponse.status, 200);
    assert.deepEqual(await gameResponse.json(), {
      game: { _id: "0xgame", name: "Guild" },
    });
    assert.equal(claimResponse.status, 200);
    assert.deepEqual(await claimResponse.json(), {
      claim: { _id: "0xclaim", name: "Quest" },
    });
  });

  assert.deepEqual(repo.calls, [
    ["getSoul", "42"],
    ["getGame", "0xgame"],
    ["getClaim", "0xclaim"],
  ]);
});

test("returns JSON not found errors for missing API documents", async () => {
  const repo = createRecordingRepo();
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/souls/missing`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: { code: "not_found", message: "Soul not found" },
    });
  });
});

test("creates games and claims through the HTTP API", async () => {
  const repo = createRecordingRepo();
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const gameResponse = await fetch(`${baseUrl}/api/games`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gameId: "0xGAME", name: "Guild", role: "guild" }),
    });
    const claimResponse = await fetch(`${baseUrl}/api/claims`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ claimId: "0xCLAIM", gameId: "0xGAME", name: "Quest" }),
    });

    assert.equal(gameResponse.status, 201);
    assert.deepEqual(await gameResponse.json(), { id: "0xgame" });
    assert.equal(claimResponse.status, 201);
    assert.deepEqual(await claimResponse.json(), { id: "0xclaim" });
  });

  assert.deepEqual(repo.calls, [
    ["upsertGame", "0xgame", { name: "Guild", type: "game", role: "guild" }],
    ["upsertClaim", "0xclaim", {
      game: "0xgame",
      name: "Quest",
      type: "claim",
      role: "",
      stage: 0,
    }],
  ]);
});

test("updates games and claims through the HTTP API", async () => {
  const repo = createRecordingRepo({
    games: new Map([["0xgame", { _id: "0xgame", name: "Guild" }]]),
    claims: new Map([["0xclaim", { _id: "0xclaim", name: "Quest" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const gameResponse = await fetch(`${baseUrl}/api/games/0xGAME`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Guild 2" }),
    });
    const claimResponse = await fetch(`${baseUrl}/api/claims/0xCLAIM`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gameId: "0xGAME", stage: 1 }),
    });

    assert.equal(gameResponse.status, 200);
    assert.deepEqual(await gameResponse.json(), { id: "0xgame" });
    assert.equal(claimResponse.status, 200);
    assert.deepEqual(await claimResponse.json(), { id: "0xclaim" });
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["upsertGame", "0xgame", { name: "Guild 2" }],
    ["getClaim", "0xclaim"],
    ["upsertClaim", "0xclaim", { game: "0xgame", stage: 1 }],
  ]);
});

test("deletes games and claims through the HTTP API", async () => {
  const repo = createRecordingRepo({
    games: new Map([["0xgame", { _id: "0xgame", name: "Guild" }]]),
    claims: new Map([["0xclaim", { _id: "0xclaim", name: "Quest" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const gameResponse = await fetch(`${baseUrl}/api/games/0xGAME`, {
      method: "DELETE",
    });
    const claimResponse = await fetch(`${baseUrl}/api/claims/0xCLAIM`, {
      method: "DELETE",
    });

    assert.equal(gameResponse.status, 200);
    assert.deepEqual(await gameResponse.json(), { id: "0xgame", deleted: true });
    assert.equal(claimResponse.status, 200);
    assert.deepEqual(await claimResponse.json(), { id: "0xclaim", deleted: true });
  });

  assert.deepEqual(repo.calls, [
    ["getGame", "0xgame"],
    ["deleteGame", "0xgame"],
    ["getClaim", "0xclaim"],
    ["deleteClaim", "0xclaim"],
  ]);
});

test("returns consistent JSON errors for bad API requests", async () => {
  const repo = createRecordingRepo();
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const invalidJson = await fetch(`${baseUrl}/api/souls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const missingField = await fetch(`${baseUrl}/api/souls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ soulId: "42" }),
    });

    assert.equal(invalidJson.status, 400);
    assert.deepEqual(await invalidJson.json(), {
      error: { code: "invalid_json", message: "Request body must be valid JSON" },
    });
    assert.equal(missingField.status, 400);
    assert.deepEqual(await missingField.json(), {
      error: { code: "validation_error", message: "owner must be a non-empty string" },
    });
  });

  assert.deepEqual(repo.calls, []);
});

test("rejects invalid API field types before repository access", async () => {
  const repo = createRecordingRepo({
    souls: new Map([["42", { _id: "42", owner: "0xabc", name: "Ada" }]]),
    claims: new Map([["0xclaim", { _id: "0xclaim", name: "Quest" }]]),
  });
  const server = createServer({ repository: repo });

  await withServer(server, async (baseUrl) => {
    const emptyOwner = await fetch(`${baseUrl}/api/souls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ soulId: "42", owner: " " }),
    });
    const badTags = await fetch(`${baseUrl}/api/souls/42`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tags: "math" }),
    });
    const badStage = await fetch(`${baseUrl}/api/claims/0xclaim`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage: "1" }),
    });
    const nonObjectBody = await fetch(`${baseUrl}/api/games`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(["0xgame"]),
    });

    assert.equal(emptyOwner.status, 400);
    assert.deepEqual(await emptyOwner.json(), {
      error: { code: "validation_error", message: "owner must be a non-empty string" },
    });
    assert.equal(badTags.status, 400);
    assert.deepEqual(await badTags.json(), {
      error: { code: "validation_error", message: "tags must be an array of strings" },
    });
    assert.equal(badStage.status, 400);
    assert.deepEqual(await badStage.json(), {
      error: { code: "validation_error", message: "stage must be a number" },
    });
    assert.equal(nonObjectBody.status, 400);
    assert.deepEqual(await nonObjectBody.json(), {
      error: { code: "validation_error", message: "Request body must be a JSON object" },
    });
  });

  assert.deepEqual(repo.calls, []);
});

function createRecordingRepo(seed = {}) {
  return {
    calls: [],
    async getSoul(id) {
      this.calls.push(["getSoul", id]);
      return seed.souls ? seed.souls.get(id) || null : null;
    },
    async getGame(id) {
      this.calls.push(["getGame", id]);
      return seed.games ? seed.games.get(id) || null : null;
    },
    async getClaim(id) {
      this.calls.push(["getClaim", id]);
      return seed.claims ? seed.claims.get(id) || null : null;
    },
    async upsertSoul(id, patch) {
      this.calls.push(["upsertSoul", id, patch]);
    },
    async deleteSoul(id) {
      this.calls.push(["deleteSoul", id]);
    },
    async upsertAccount(id, patch) {
      this.calls.push(["upsertAccount", id, patch]);
    },
    async upsertGame(id, patch) {
      this.calls.push(["upsertGame", id, patch]);
    },
    async deleteGame(id) {
      this.calls.push(["deleteGame", id]);
    },
    async upsertClaim(id, patch) {
      this.calls.push(["upsertClaim", id, patch]);
    },
    async deleteClaim(id) {
      this.calls.push(["deleteClaim", id]);
    },
  };
}

async function withServer(server, run) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
