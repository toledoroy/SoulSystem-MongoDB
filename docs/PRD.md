# SoulSystem MongoDB Migration PRD

**Last updated:** 2026-05-14

## Summary

SoulSystem is being migrated from a Web3-first indexing model into a Web2, off-chain MongoDB application. MongoDB is the application database and source of truth for new app data. The current repository still contains the original subgraph implementation as legacy reference material: contract ABIs, `subgraph.yaml`, GraphQL schema entities, and AssemblyScript event handlers.

The next milestone is not chain ingestion. It is a backend application foundation: define a database abstraction layer, map graph-shaped domain records into MongoDB collections, expose HTTP APIs, and move product behavior to MongoDB-backed off-chain records.

## Current Progress Review

### Completed / Existing

- Contract event coverage exists for the core protocol contracts:
  - `Soul`
  - `Hub`
  - `OpenRepo`
  - `ActionRepo`
  - dynamic `Game` templates
  - dynamic `Claim` templates
- The legacy GraphQL schema captures the important domain entities used as migration reference:
  - accounts and souls
  - games and claims/processes
  - roles, participants, nominations, posts, rules, actions, opinions, relations, attributes, and legacy payment events
- Legacy event handlers encode much of the business logic used as reference material:
  - soul mint/transfer/burn handling
  - account-to-soul ownership mapping
  - metadata extraction from IPFS URIs
  - game and claim creation from hub events
  - game and claim roles from ERC1155-style role token events
  - nominations, posts, stage changes, and legacy payments
  - OpenRepo attributes and associations
  - Soul opinions and opinion history
- Web2 migration scaffolding has started:
  - homepage MongoDB availability indicator
  - `/health/mongo` health endpoint
  - MongoDB index specifications for first-slice collections
  - MongoDB repository adapter for core app-owned records
  - off-chain application service for creating/updating souls, games, and claims
  - HTTP JSON API routes and validation for app-owned soul, game, and claim CRUD
  - MongoDB-backed service writes for soul attributes and soul associations
  - MongoDB-backed service writes for game roles, participants, and posts
  - MongoDB-backed service writes for game nominations
  - MongoDB-backed service writes for claim stages, roles, participants, nominations, and posts
  - MongoDB collection schema documented in `docs/DB_SCHEMA.md`
- Web2 payment migration is skipped for now because payments are not part of the Web2 product scope.

### Not Started / Missing

- HTTP JSON API routes for soul attributes and associations are not exposed yet.
- Remaining domain services are still pending: actions/activity records, opinions, and announcements.
- HTTP JSON API routes are still needed for the newer service-layer domain writes: soul relations, game workflow, claim workflow, and later activity/opinion flows.
- Tests exist for the new Web2 scaffolding, HTTP CRUD slice, and first relation service slice, but not for the full application workflow surface.

### Local Verification

Local package installation, code generation, and legacy subgraph build now run after upgrading the old Graph packages and updating schema entity directives for modern Graph tooling.

Verified commands:

- `yarn install`
- `yarn test:web`
- `yarn codegen`
- `yarn build`
- `yarn mongo:indexes`

## Migration Goal

Replace The Graph/Web3 indexing as the product data layer with a MongoDB-backed Web2 service.

The migrated system should:

- create and update application records directly in MongoDB,
- persist query-ready MongoDB documents for souls, games, claims, posts, relationships, and activity,
- expose application-friendly APIs,
- support normal Web2 validation, authorization, and audit fields.

## Non-Goals

- Rewriting smart contracts.
- Changing protocol event semantics.
- Building a new frontend before the data layer is reliable.
- Reading chain data, decoding logs, replaying blocks, or relying on RPCs for application state.
- Migrating payment events or payment totals until Web2 product requirements include payments.

## Target Architecture

### Boundary Direction

The migration should introduce a stable database abstraction before adding more product APIs. The application service layer should depend on domain repositories and mapper APIs, not direct MongoDB driver calls or legacy ABI calls.

- **Contracts become collections:** every legacy contract-centered concept should be represented as one or more MongoDB collections with deterministic `_id` values that preserve graph lookup behavior.
- **ABI calls become mapper API calls:** places that formerly called contract bindings or event-derived helpers should call mappers that normalize API input into graph-shaped domain documents.
- **Graph schema remains the shape reference:** collection documents should preserve the important entity names, relationship keys, and deterministic IDs from `schema.graphql`, while adapting fields for Web2 validation and application writes.
- **Web3 stays isolated:** `abis/`, `subgraph.yaml`, `generated/`, and `src/handlers/` should remain legacy reference and verification material until retired. New Web2 modules should not import generated subgraph bindings.

### Proposed Components

- **Application Service Layer**
  - Creates and updates MongoDB records from app/API requests.
  - Encapsulates business rules that were formerly implied by contract/subgraph behavior.
  - Keeps persistence operations idempotent where useful for retries.

- **Database Abstraction Layer**
  - Owns collection names, deterministic ID helpers, common read/write methods, and transaction/session hooks when needed.
  - Exposes graph-shaped repository interfaces such as `souls`, `accounts`, `games`, `claims`, and relation collections.
  - Keeps MongoDB driver details out of mappers, HTTP handlers, and application services.

- **Mapper Layer**
  - Replaces direct ABI-style reads with explicit API-to-domain mapping functions.
  - Converts request payloads into graph-shaped records and projections.
  - Centralizes normalization for addresses, IDs, metadata fields, role references, participant relationships, and search fields.

- **MongoDB**
  - Stores query-ready application documents.
  - Uses indexes for owner lookups, soul lookups, context membership, nominations, posts, and relation lookups.

- **API Layer**
  - Provides application queries currently handled through GraphQL subgraph queries.
  - Can be REST, GraphQL, or tRPC depending on the consuming app.

## Proposed MongoDB Collections

The collection layout should resemble the graph schema rather than the ABI layout. Contract addresses and token IDs remain useful deterministic identifiers, but the application should treat them as record IDs, not live contract handles.

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

Payment collections are intentionally out of scope for the current Web2 migration because the app does not use Web2 payments. Legacy payment handlers remain reference-only Web3 code.

## Important Porting Notes

- The Graph `store.remove` behavior must become explicit MongoDB deletes or soft deletes.
- Graph entity IDs should become deterministic Mongo `_id` values to preserve current lookup behavior.
- Repository methods should accept already-mapped domain records. Mapper functions should own field defaults, ID composition, and graph-shaped projections.
- Contract ABI helper calls in legacy handlers should be ported as mapper/API calls only when the related workflow is rebuilt for Web2.
- IPFS metadata loading should be moved behind a reusable metadata service with retry, timeout, and cache behavior.
- Existing event handlers often skipped records when referenced souls/accounts were missing. The MongoDB app should use explicit validation and return clear errors instead.
- Array updates must be idempotent where API retries may occur.

## Risks And Open Questions

- Which runtime should own the Web2 service: Node/Express, Next.js API routes, NestJS, or another existing app?
- Which MongoDB library should be used: native driver, Mongoose, Prisma MongoDB, or another ODM?
- What authentication/authorization model should guard writes?
- What API compatibility is required for existing frontend consumers?
- Should IPFS metadata be stored as raw bytes, normalized JSON, or both?
- Which service-layer workflow writes should be exposed first as HTTP routes after core CRUD?

## Recommended Next Steps

### 1. Restore Local Tooling

- Completed: package installation, Web2 tests, Graph code generation, and Graph build now run locally.
- Continue tracking the generated `yarn.lock` so the upgraded dependency tree remains reproducible.

### 2. Decide Backend Stack

- Completed: use plain Node HTTP plus the native MongoDB driver while the data layer is being established.
- Completed: environment configuration exists for MongoDB URI and database name.

### 3. Define The Database Abstraction

- Completed: database module exposes collection-scoped repositories instead of raw MongoDB driver calls.
- Completed: collection names and deterministic `_id` composition live in shared helpers.
- Completed: repository interface is graph-shaped for accounts, souls, games, claims, relations, game workflow records, and claim workflow records.

### 4. Add API Mappers For Graph-Shaped Records

- Completed: mapper functions transform Web2 API payloads into domain records resembling the Graph schema.
- Completed: planned ABI-derived field reads have been replaced with explicit mapper inputs or service lookups for completed service slices.
- Completed foundation mappers:
  - account to soul mapping
  - soul profile document
  - game context document
  - claim/process context document
- Completed workflow mappers:
  - soul attributes and associations
  - game roles, participants, nominations, and posts
  - claim stages, roles, participants, nominations, and posts

### 5. Define MongoDB Schemas And Indexes

- Completed schema documentation: `docs/DB_SCHEMA.md`.
- Completed indexes for:
  - `souls.owner`
  - `souls.handle`
  - `souls.searchField`
  - `games.hub`
  - `claims.hub`
  - `claims.game`
  - game and claim workflow records
  - soul relation records

### 6. Build The First Application Service Slice

Completed first vertical slice:

- create soul
- update soul profile
- create game
- create claim

This creates the identity and context foundation required by most later app workflows.

### 7. Add Replay-Safe Tests

In progress. Current tests cover required fields, missing references, idempotent role membership, deterministic IDs, mapper defaults, repository writes, and HTTP CRUD errors.

Continue to verify for each new application write flow:

- validate required fields,
- avoid duplicate array entries on retries,
- return clear errors for missing references,
- persist consistent search/index fields.

### 8. Build Remaining Domain Services

Progress:

1. Completed: soul attributes and associations
2. Completed: game roles, participants, nominations, and posts
3. Completed: claim stages, roles, participants, nominations, and posts
4. Skipped: payments and payment totals, because Web2 has no payment scope
5. Pending: actions/activity records
6. Pending: opinions and announcements

### 9. Build Workflow APIs

Core HTTP CRUD exists for souls, games, and claims. Next API work should expose actual app workflows, not one endpoint per collection. First candidates:

- get soul profile by id, owner, or handle
- search souls
- get game overview with roles and participants
- get claim/process overview with stage, roles, participants, nominations, and posts
- get posts for a soul, game, or claim
- create/update soul relations, game workflow records, claim workflow records, actions/activity records, and opinion/announcement records

## Acceptance Criteria For Migration Foundation

- MongoDB can be populated and queried through off-chain application APIs.
- Core identity data, game creation, and claim creation are stored directly in MongoDB.
- Automated tests cover at least the first application service slice.
- The README documents how to configure, run, and verify the MongoDB-backed app service.
