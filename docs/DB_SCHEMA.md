# SoulSystem MongoDB Schema

**Last updated:** 2026-05-14

This schema documents the Web2 MongoDB collections used by the migration service. Documents preserve graph-shaped entity names and deterministic `_id` values from the legacy subgraph where practical.

## Core Identity

### `accounts`

```js
{
  _id: "0xabc",        // account address
  soulId: "42"
}
```

Indexes:

- `accounts_soulId`: `{ soulId: 1 }`, sparse

### `souls`

```js
{
  _id: "42",           // soul token id
  owner: "0xabc",
  type: "human",
  role: "",
  stage: 0,
  name: "Ada Lovelace",
  handle: "ada",
  image: "https://...",
  tags: ["builder"],
  searchField: "ada lovelace0xabc"
}
```

Indexes:

- `souls_owner`: `{ owner: 1 }`
- `souls_handle`: `{ handle: 1 }`, sparse
- `souls_search_text`: `{ searchField: "text" }`

## Contexts

### `games`

```js
{
  _id: "0xgame",       // game address or deterministic app id
  hub: "0xhub",
  name: "Guild",
  type: "game",
  role: "guild"
}
```

Indexes:

- `games_hub`: `{ hub: 1 }`

### `claims`

```js
{
  _id: "0xclaim",      // claim/process address or deterministic app id
  hub: "0xhub",
  game: "0xgame",
  name: "Quest",
  type: "claim",
  role: "",
  stage: 0,
  createdDate: 123,
  updatedDate: 456
}
```

Indexes:

- `claims_hub`: `{ hub: 1 }`
- `claims_game`: `{ game: 1 }`, sparse

## Game Workflow

### `gameRoles`

`_id` format: `{gameId}_{roleId}`

```js
{
  _id: "0xgame_1",
  ctx: "0xgame",
  roleId: "1",
  name: "Admin",
  uri: "ipfs://...",
  souls: ["42"],
  soulsCount: 1
}
```

Indexes:

- `gameRoles_ctx_roleId`: `{ ctx: 1, roleId: 1 }`

### `gameParticipants`

`_id` format: `{gameId}_{soulId}`

```js
{
  _id: "0xgame_42",
  entity: "0xgame",
  sbt: "42",
  roles: ["1"]
}
```

Indexes:

- `gameParticipants_entity`: `{ entity: 1 }`
- `gameParticipants_sbt`: `{ sbt: 1 }`

### `gameNominations`

`_id` format: `{gameId}_{nominationId}`

```js
{
  _id: "0xgame_tx-1",
  game: "0xgame",
  createdDate: 123,
  nominator: "42",
  nominated: "77"
}
```

Indexes:

- `gameNominations_game_createdDate`: `{ game: 1, createdDate: -1 }`
- `gameNominations_nominator`: `{ nominator: 1 }`
- `gameNominations_nominated`: `{ nominated: 1 }`

### `gamePosts`

`_id` format: `{gameId}_{postId}`

```js
{
  _id: "0xgame_tx-1",
  entity: "0xgame",
  createdDate: 123,
  author: "42",
  entityRole: "1",
  uri: "ipfs://...",
  metadata: "<optional raw metadata>"
}
```

Indexes:

- `gamePosts_entity_createdDate`: `{ entity: 1, createdDate: -1 }`
- `gamePosts_author`: `{ author: 1 }`

## Claim Workflow

### `claimRoles`

`_id` format: `{claimId}_{roleId}`

```js
{
  _id: "0xclaim_1",
  ctx: "0xclaim",
  name: "Member",
  uri: "ipfs://...",
  role: "member",
  roleId: "1",
  souls: ["42"],
  soulsCount: 1
}
```

Indexes:

- `claimRoles_ctx_roleId`: `{ ctx: 1, roleId: 1 }`

### `claimParticipants`

`_id` format: `{claimId}_{soulId}`

```js
{
  _id: "0xclaim_42",
  entity: "0xclaim",
  sbt: "42",
  roles: ["1"]
}
```

Indexes:

- `claimParticipants_entity`: `{ entity: 1 }`
- `claimParticipants_sbt`: `{ sbt: 1 }`

### `claimNominations`

`_id` format: `{claimId}_{nominatedSoulId}`

```js
{
  _id: "0xclaim_77",
  claim: "0xclaim",
  createdDate: 123,
  nominated: "77",
  nominator: ["42"],
  uri: ["ipfs://..."],
  status: "pending"
}
```

Indexes:

- `claimNominations_claim_createdDate`: `{ claim: 1, createdDate: -1 }`
- `claimNominations_nominator`: `{ nominator: 1 }`
- `claimNominations_nominated`: `{ nominated: 1 }`
- `claimNominations_status`: `{ status: 1 }`, sparse

### `claimPosts`

`_id` format: `{claimId}_{postId}`

```js
{
  _id: "0xclaim_tx-1",
  entity: "0xclaim",
  createdDate: 123,
  author: "42",
  entityRole: "1",
  uri: "ipfs://...",
  metadata: "<optional raw metadata>"
}
```

Indexes:

- `claimPosts_entity_createdDate`: `{ entity: 1, createdDate: -1 }`
- `claimPosts_author`: `{ author: 1 }`

## Soul Relations

### `soulAttributes`

`_id` format: `ATTR_{soulId}_{role}_{value}`

```js
{
  _id: "ATTR_42_role_builder",
  aEnd: "42",
  bEnd: "builder",
  role: "role"
}
```

Indexes:

- `soulAttributes_aEnd_role`: `{ aEnd: 1, role: 1 }`
- `soulAttributes_bEnd_role`: `{ bEnd: 1, role: 1 }`

### `soulAssociations`

`_id` format: `ASSOC_{fromSoulId}_{role}_{toSoulId}`

```js
{
  _id: "ASSOC_42_mentor_77",
  aEnd: "42",
  bEnd: "77",
  role: "mentor",
  qty: 2
}
```

Indexes:

- `soulAssociations_aEnd_role`: `{ aEnd: 1, role: 1 }`
- `soulAssociations_bEnd_role`: `{ bEnd: 1, role: 1 }`

## Planned Collections

These collections are still planned and should follow the same mapper and repository boundary before use:

- `paymentEvents`
- `paymentTotals`
- `actions`
- `soulOpinions`
- `soulOpinionChanges`
- `soulPosts`
