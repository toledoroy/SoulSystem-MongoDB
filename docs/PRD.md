# SoulSystem MongoDB Migration PRD

**Last updated:** 2026-05-10

## Summary

SoulSystem is being migrated from a Web3-first indexing model, based on The Graph subgraph mappings, into a Web2-style MongoDB-backed application data layer. The current repository still represents the original subgraph implementation: contract ABIs, `subgraph.yaml`, GraphQL schema entities, and AssemblyScript event handlers that persist to The Graph store.

The next milestone is not a UI or product feature. It is a backend migration foundation: define MongoDB collections, convert the existing event-derived entities into MongoDB documents, and choose how blockchain event ingestion will run outside The Graph.

## Current Progress Review

### Completed / Existing

- Contract event coverage exists for the core protocol contracts:
  - `Soul`
  - `Hub`
  - `OpenRepo`
  - `ActionRepo`
  - dynamic `Game` templates
  - dynamic `Claim` templates
- The current GraphQL schema captures the important domain entities:
  - accounts and souls
  - games and claims/processes
  - roles, participants, nominations, posts, rules, actions, opinions, relations, attributes, and payment events
- Event handlers already encode much of the business logic needed for the migration:
  - soul mint/transfer/burn handling
  - account-to-soul ownership mapping
  - metadata extraction from IPFS URIs
  - game and claim creation from hub events
  - game and claim roles from ERC1155-style role token events
  - nominations, posts, stage changes, and payments
  - OpenRepo attributes and associations
  - Soul opinions and opinion history

### Not Started / Missing

- No MongoDB connection code exists.
- No MongoDB schemas, models, migrations, or indexes exist.
- No backend API layer exists.
- No event ingestion worker exists outside The Graph.
- No replay/checkpoint mechanism exists for indexing historical chain events into MongoDB.
- No tests exist for the current mapping behavior or the intended MongoDB behavior.
- No PRD existed before this document.

### Local Verification

`yarn build` could not run because the project references a missing Yarn release file:

```text
.yarn/releases/yarn-3.6.0.cjs
```

This should be fixed before relying on local build validation.

## Migration Goal

Replace The Graph as the primary application query layer with a MongoDB-backed Web2 service while preserving the domain state currently produced by subgraph indexing.

The migrated system should:

- ingest blockchain events from configured contracts,
- transform those events using equivalent business rules,
- persist query-ready documents in MongoDB,
- expose application-friendly APIs,
- support deterministic historical replay,
- keep enough raw event history for auditing and reprocessing.

## Non-Goals

- Rewriting smart contracts.
- Changing protocol event semantics.
- Building a new frontend before the data layer is reliable.
- Removing all Web3 support; the migration is from Web3-indexed persistence to Web2 application persistence, not from blockchain data to manually entered data.

## Target Architecture

### Proposed Components

- **Event Ingestion Worker**
  - Uses an EVM client such as `viem` or `ethers`.
  - Reads logs from configured contracts and block ranges.
  - Stores raw events before applying projections.
  - Tracks checkpoints per chain, contract, and event source.

- **Projection Layer**
  - Converts decoded events into MongoDB updates.
  - Ports logic from `src/handlers/*.ts`.
  - Uses idempotent upserts so replay is safe.

- **MongoDB**
  - Stores query-ready documents and raw event history.
  - Uses indexes for owner lookups, soul lookups, context membership, posts, and payment totals.

- **API Layer**
  - Provides application queries currently handled through GraphQL subgraph queries.
  - Can be REST, GraphQL, or tRPC depending on the consuming app.

## Proposed MongoDB Collections

### Core Identity

- `accounts`
  - `_id`: account address
  - `soulId`: current soul token id
  - `updatedAtBlock`

- `souls`
  - `_id`: soul token id
  - `owner`
  - `type`
  - `role`
  - `stage`
  - `uri`
  - `metadata`
  - `handle`
  - `image`
  - `name`
  - `tags`
  - `searchField`
  - `updatedAtBlock`

### Contexts

- `games`
  - `_id`: game contract address
  - `hub`
  - `name`
  - `type`
  - `role`
  - `createdDate`
  - `updatedAtBlock`

- `claims`
  - `_id`: claim/process contract address
  - `hub`
  - `game`
  - `name`
  - `type`
  - `role`
  - `stage`
  - `createdDate`
  - `updatedDate`
  - `updatedAtBlock`

### Roles And Membership

- `gameRoles`
- `claimRoles`
- `gameParticipants`
- `claimParticipants`
- `soulParts`

These should preserve token quantities and role names. The existing code has both newer `SoulPart` logic and older association-style participant logic; the migration should choose `soulParts` as the canonical relationship model and keep participant collections as read-optimized projections if needed.

### Social And Activity Data

- `soulPosts`
- `gamePosts`
- `claimPosts`
- `gameNominations`
- `claimNominations`
- `actions`
- `soulOpinions`
- `soulOpinionChanges`
- `soulAssociations`
- `soulAttributes`

### Payments

- `paymentEvents`
- `paymentTotals`

The ERC20 payment handler currently records individual events but does not update aggregate totals. The MongoDB implementation should make native and ERC20 payment aggregation consistent.

### Indexing Infrastructure

- `rawEvents`
  - chain id, contract address, event name, block number, transaction hash, log index, decoded args, ingestion timestamp

- `indexerCheckpoints`
  - chain id, source name, contract address, last processed block, last processed log cursor

## Important Porting Notes

- The Graph `store.remove` behavior must become explicit MongoDB deletes or soft deletes.
- Graph entity IDs should become deterministic Mongo `_id` values to preserve current lookup behavior.
- Dynamic templates for games and claims must become runtime contract registration in the ingestion worker.
- IPFS metadata loading should be moved behind a reusable metadata service with retry, timeout, and cache behavior.
- Existing event handlers often skip records when referenced souls/accounts are missing. The MongoDB version should decide whether to keep this strict behavior or create pending references for later reconciliation.
- Array updates must be idempotent. Current handler logic can push duplicate role IDs or nominators if the same event is replayed without safeguards.

## Risks And Open Questions

- Which runtime should own the Web2 service: Node/Express, Next.js API routes, NestJS, or another existing app?
- Which MongoDB library should be used: native driver, Mongoose, Prisma MongoDB, or another ODM?
- Will the system continue indexing Aurora only, or should the migration support multiple chains from the start?
- Should raw blockchain events be the only source of truth, or will Web2-only mutations be introduced?
- What API compatibility is required for existing frontend consumers?
- How much historical data must be backfilled before launch?
- Should IPFS metadata be stored as raw bytes, normalized JSON, or both?

## Recommended Next Steps

### 1. Restore Local Tooling

- Add the missing Yarn release file or switch the project to a supported package-manager setup.
- Confirm `yarn install`, `yarn codegen`, and `yarn build` work for the current subgraph before porting behavior.

### 2. Decide Backend Stack

- Pick the service runtime and MongoDB library.
- Add environment configuration for MongoDB URI, chain RPC URL, chain id, contract addresses, and start blocks.

### 3. Define MongoDB Schemas And Indexes

- Start with `accounts`, `souls`, `games`, `claims`, `rawEvents`, and `indexerCheckpoints`.
- Add indexes for:
  - `souls.owner`
  - `souls.handle`
  - `souls.searchField`
  - `games.hub`
  - `claims.hub`
  - `claims.game`
  - `rawEvents.blockNumber`
  - `rawEvents.transactionHash + rawEvents.logIndex`

### 4. Port The First Projection Slice

Start with the smallest useful vertical slice:

- `Soul.Transfer`
- `Soul.URI`
- `Soul.SoulType`
- `Soul.SoulHandle`
- `Hub.ContractCreated`

This creates the identity and context foundation required by most later handlers.

### 5. Add Replay-Safe Tests

For each ported event handler:

- applying the same event twice should not duplicate arrays or inflate totals,
- applying burn/remove events should remove or decrement the right records,
- missing references should produce the chosen pending/skip behavior,
- checkpoint updates should happen only after successful projection.

### 6. Port Remaining Domain Events

Recommended order:

1. `OpenRepo.StringSet`, `AddressAdd`, `AddressSet`
2. `Game.RoleCreated`, `TransferByToken`, `Nominate`, `Post`, `URI`
3. `Claim.Stage`, `RoleCreated`, `TransferByToken`, `Nominate`, `Post`, `URI`
4. `Claim.PaymentReleased`, `ERC20PaymentReleased`
5. `ActionRepo.ActionAdded`, `ActionURI`
6. `Soul.Announcement`, `OpinionChange`

### 7. Build Read APIs

Create API endpoints around actual app workflows, not one endpoint per collection. First candidates:

- get soul profile by id, owner, or handle
- search souls
- get game overview with roles and participants
- get claim/process overview with stage, roles, participants, nominations, and posts
- get posts for a soul, game, or claim
- get payment totals by sender/recipient/token

## Acceptance Criteria For Migration Foundation

- MongoDB can be populated from a clean database by replaying events from configured start blocks.
- Re-running the indexer over the same block range produces the same MongoDB state.
- Core identity data, game creation, and claim creation match the current subgraph semantics.
- Raw events and checkpoints make failures recoverable.
- Automated tests cover at least the first projection slice.
- The README documents how to configure, run, and verify the MongoDB indexer.

