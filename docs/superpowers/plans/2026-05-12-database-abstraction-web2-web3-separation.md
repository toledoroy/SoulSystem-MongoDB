# Database Abstraction And Web2/Web3 Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Web2 database abstraction and mapper boundary so MongoDB collections replace contract-backed records while legacy Web3 code remains isolated reference material.

**Architecture:** Add a small database layer above MongoDB that owns collection names and graph-shaped repository APIs. Add mappers that convert HTTP/API payloads into graph-shaped records, replacing future ABI-style reads with explicit API data, service lookups, and deterministic defaults.

**Tech Stack:** Node.js CommonJS, native MongoDB driver, `node:test`, existing `web/*.cjs` modules.

---

## File Structure

- Create `web/domain/ids.cjs`: deterministic ID helpers copied from graph entity conventions.
- Create `web/domain/mappers.cjs`: API payload to graph-shaped document mappers for accounts, souls, games, and claims.
- Create `web/db/collections.cjs`: canonical collection names for MongoDB repositories.
- Create `web/db/database.cjs`: database abstraction that exposes collection-scoped repositories.
- Modify `web/mongo-repository.cjs`: delegate collection names and common upsert/delete behavior to the database abstraction.
- Modify `web/application-service.cjs`: call mappers before repository writes.
- Test `tests/web/domain-mappers.test.cjs`: mapper defaults, ID fields, search field composition.
- Test `tests/web/database-abstraction.test.cjs`: collection-scoped repository operations avoid raw collection names in services.
- Modify `tests/web/application-service.test.cjs`: assert services write mapped records instead of inline ad hoc objects.
- Documentation stays in `docs/PRD.md` and `docs/MIGRATION_TASKS.md`.

### Task 1: Domain ID Helpers

**Files:**
- Create: `web/domain/ids.cjs`
- Test: `tests/web/domain-ids.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
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
  assert.equal(accountId("0xABC"), "0xabc");
  assert.equal(soulId("42"), "42");
  assert.equal(gameId("0xGAME"), "0xgame");
  assert.equal(claimId("0xCLAIM"), "0xclaim");
  assert.equal(relationId("soul-1", "admin", "game-1"), "soul-1:admin:game-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:web`

Expected: FAIL with `Cannot find module '../../web/domain/ids.cjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function accountId(address) {
  return normalizeId(address);
}

function soulId(id) {
  return String(id || "").trim();
}

function gameId(address) {
  return normalizeId(address);
}

function claimId(address) {
  return normalizeId(address);
}

function relationId(...parts) {
  return parts.map((part) => String(part || "").trim()).join(":");
}

module.exports = {
  accountId,
  soulId,
  gameId,
  claimId,
  relationId,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test:web`

Expected: PASS.

### Task 2: Graph-Shaped Mappers

**Files:**
- Create: `web/domain/mappers.cjs`
- Test: `tests/web/domain-mappers.test.cjs`
- Modify: `web/application-service.cjs`

- [ ] **Step 1: Write the failing test**

```js
const assert = require("node:assert/strict");
const test = require("node:test");

const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapClaim,
} = require("../../web/domain/mappers.cjs");

test("maps API payloads into graph-shaped records", () => {
  assert.deepEqual(mapAccount({ owner: "0xABC", soulId: "42" }), {
    _id: "0xabc",
    soulId: "42",
  });

  assert.deepEqual(mapSoul({
    soulId: "42",
    owner: "0xABC",
    name: "Ada Lovelace",
    handle: "ada",
    tags: ["builder"],
  }), {
    _id: "42",
    owner: "0xabc",
    type: "human",
    role: "",
    stage: 0,
    name: "Ada Lovelace",
    handle: "ada",
    tags: ["builder"],
    searchField: "ada lovelace0xabc",
  });

  assert.deepEqual(mapSoulPatch(
    { _id: "42", owner: "0xabc", name: "Ada" },
    { name: "Ada Lovelace", tags: ["math"] },
  ), {
    name: "Ada Lovelace",
    tags: ["math"],
    searchField: "ada lovelace0xabc",
  });

  assert.deepEqual(mapGame({ gameId: "0xGAME", name: "Guild", role: "guild" }), {
    _id: "0xgame",
    name: "Guild",
    type: "game",
    role: "guild",
  });

  assert.deepEqual(mapClaim({ claimId: "0xCLAIM", gameId: "0xGAME", name: "Quest" }), {
    _id: "0xclaim",
    game: "0xgame",
    name: "Quest",
    type: "claim",
    role: "",
    stage: 0,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:web`

Expected: FAIL with `Cannot find module '../../web/domain/mappers.cjs'`.

- [ ] **Step 3: Implement mapper module**

```js
const { accountId, soulId, gameId, claimId } = require("./ids.cjs");

function mapAccount(input) {
  return {
    _id: accountId(input.owner),
    soulId: soulId(input.soulId),
  };
}

function mapSoul(input) {
  const soul = {
    _id: soulId(input.soulId),
    owner: accountId(input.owner),
    type: input.type || "human",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
    name: input.name || "",
    handle: input.handle || "",
    tags: input.tags || [],
  };
  soul.searchField = makeSearchField(soul);
  return soul;
}

function mapSoulPatch(existing, input) {
  const patch = pickDefined({
    name: input.name,
    handle: input.handle,
    image: input.image,
    tags: input.tags,
    role: input.role,
    stage: input.stage,
  });
  patch.searchField = makeSearchField({ ...existing, ...patch });
  return patch;
}

function mapGame(input) {
  return {
    _id: gameId(input.gameId),
    name: input.name || "",
    type: input.type || "game",
    role: input.role || "",
  };
}

function mapClaim(input) {
  return {
    _id: claimId(input.claimId),
    game: input.gameId ? gameId(input.gameId) : "",
    name: input.name || "",
    type: input.type || "claim",
    role: input.role || "",
    stage: numberOrDefault(input.stage, 0),
  };
}

function makeSearchField(entity) {
  const fields = [];
  if (entity.name) fields.push(entity.name);
  if (entity.owner) fields.push(entity.owner);
  return fields.join("").toLowerCase();
}

function pickDefined(input) {
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function numberOrDefault(value, fallback) {
  return typeof value === "number" ? value : fallback;
}

module.exports = {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapClaim,
};
```

- [ ] **Step 4: Refactor services to use mappers**

```js
const {
  mapAccount,
  mapSoul,
  mapSoulPatch,
  mapGame,
  mapClaim,
} = require("./domain/mappers.cjs");

async function createSoul(repo, input) {
  const soul = mapSoul(input);
  const account = mapAccount(input);
  await repo.upsertSoul(soul._id, withoutId(soul));
  await repo.upsertAccount(account._id, withoutId(account));
}

async function updateSoulProfile(repo, input) {
  const existing = await repo.getSoul(input.soulId);
  if (!existing) {
    throw new Error("Soul not found");
  }
  await repo.upsertSoul(input.soulId, mapSoulPatch(existing, input));
}

async function createGame(repo, input) {
  const game = mapGame(input);
  await repo.upsertGame(game._id, withoutId(game));
}

async function createClaim(repo, input) {
  const claim = mapClaim(input);
  await repo.upsertClaim(claim._id, withoutId(claim));
}

function withoutId(record) {
  const { _id, ...rest } = record;
  return rest;
}

module.exports = {
  createSoul,
  updateSoulProfile,
  createGame,
  createClaim,
};
```

- [ ] **Step 5: Run tests**

Run: `yarn test:web`

Expected: PASS.

### Task 3: Database Abstraction

**Files:**
- Create: `web/db/collections.cjs`
- Create: `web/db/database.cjs`
- Modify: `web/mongo-repository.cjs`
- Test: `tests/web/database-abstraction.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
const assert = require("node:assert/strict");
const test = require("node:test");

const { createDatabase } = require("../../web/db/database.cjs");

test("database abstraction exposes collection-scoped repositories", async () => {
  const db = createDbRecorder();
  const database = createDatabase(db);

  await database.souls.upsert("42", { owner: "0xabc" });
  await database.accounts.upsert("0xabc", { soulId: "42" });
  await database.souls.delete("42");

  assert.deepEqual(db.calls, [
    {
      collection: "souls",
      method: "updateOne",
      filter: { _id: "42" },
      update: { $set: { owner: "0xabc" }, $setOnInsert: { _id: "42" } },
      options: { upsert: true },
    },
    {
      collection: "accounts",
      method: "updateOne",
      filter: { _id: "0xabc" },
      update: { $set: { soulId: "42" }, $setOnInsert: { _id: "0xabc" } },
      options: { upsert: true },
    },
    {
      collection: "souls",
      method: "deleteOne",
      filter: { _id: "42" },
    },
  ]);
});

function createDbRecorder() {
  const calls = [];
  return {
    calls,
    collection(name) {
      return {
        async updateOne(filter, update, options) {
          calls.push({ collection: name, method: "updateOne", filter, update, options });
        },
        async deleteOne(filter) {
          calls.push({ collection: name, method: "deleteOne", filter });
        },
      };
    },
  };
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:web`

Expected: FAIL with `Cannot find module '../../web/db/database.cjs'`.

- [ ] **Step 3: Implement collection constants**

```js
const collections = {
  accounts: "accounts",
  souls: "souls",
  games: "games",
  claims: "claims",
};

module.exports = {
  collections,
};
```

- [ ] **Step 4: Implement database abstraction**

```js
const { collections } = require("./collections.cjs");

function createDatabase(db) {
  return {
    accounts: createCollectionRepository(db, collections.accounts),
    souls: createCollectionRepository(db, collections.souls),
    games: createCollectionRepository(db, collections.games),
    claims: createCollectionRepository(db, collections.claims),
  };
}

function createCollectionRepository(db, collectionName) {
  return {
    async get(id) {
      return db.collection(collectionName).findOne({ _id: id });
    },
    async upsert(id, patch) {
      await db.collection(collectionName).updateOne(
        { _id: id },
        {
          $set: patch,
          $setOnInsert: { _id: id },
        },
        { upsert: true },
      );
    },
    async delete(id) {
      await db.collection(collectionName).deleteOne({ _id: id });
    },
  };
}

module.exports = {
  createDatabase,
};
```

- [ ] **Step 5: Adapt Mongo repository to the abstraction**

```js
const { createDatabase } = require("./db/database.cjs");

function createMongoRepository(db) {
  const database = createDatabase(db);

  return {
    async getSoul(id) {
      return database.souls.get(id);
    },
    async upsertSoul(id, patch) {
      await database.souls.upsert(id, patch);
    },
    async deleteSoul(id) {
      await database.souls.delete(id);
    },
    async upsertAccount(address, patch) {
      await database.accounts.upsert(address, patch);
    },
    async upsertGame(address, patch) {
      await database.games.upsert(address, patch);
    },
    async upsertClaim(address, patch) {
      await database.claims.upsert(address, patch);
    },
  };
}

module.exports = {
  createMongoRepository,
};
```

- [ ] **Step 6: Run tests**

Run: `yarn test:web`

Expected: PASS.

### Task 4: Module Boundary Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/MIGRATION_TASKS.md`

- [ ] **Step 1: Add a runtime boundary section to README**

```md
## Runtime Boundaries

New Web2 runtime code lives under `web/` and should depend on HTTP handlers, application services, mappers, and the MongoDB database abstraction.

Legacy Web3 reference code lives in `abis/`, `generated/`, `subgraph.yaml`, `schema.graphql`, and `src/handlers/`. These files document contract and graph behavior during the migration, but new Web2 modules should not import generated subgraph bindings or ABI JSON directly.
```

- [ ] **Step 2: Mark the implementation task complete as each code task lands**

Update `docs/MIGRATION_TASKS.md` checkboxes only after the related tests pass.

- [ ] **Step 3: Run verification**

Run: `yarn test:web`

Expected: PASS.

## Self-Review

- Spec coverage: covers database abstraction, contracts-as-collections, ABI-call replacement through mapper APIs, graph-shaped records, and Web2/Web3 module separation.
- Placeholder scan: no task uses TBD, TODO, or unspecified implementation.
- Type consistency: mapper names, repository methods, and file paths match across tasks.
