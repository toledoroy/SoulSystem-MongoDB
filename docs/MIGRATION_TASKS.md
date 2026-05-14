# MongoDB Migration Task Tracker

**Last updated:** 2026-05-12

## Current Baseline

- [x] Create PRD for the Web3-to-Web2 MongoDB migration.
- [x] Correct target architecture: off-chain MongoDB application with no chain/RPC ingestion.
- [x] Add a homepage indicator for MongoDB availability.
- [x] Add a `/health/mongo` JSON health endpoint.
- [x] Add `mongodb+srv://` support for MongoDB Atlas-style connection strings.
- [x] Verify the live MongoDB Atlas endpoint is reachable from this environment.
- [x] Add environment template for MongoDB connection settings.
- [x] Remove the missing pinned Yarn release path so package commands can use the configured package manager.

## Preliminary Tasks

- [x] Resolve legacy dependency install blockers and generate a trackable lockfile.
- [x] Confirm `yarn test:web` passes through the package script.
- [x] Confirm `yarn codegen` still works for the legacy subgraph.
- [x] Confirm `yarn build` still works for the legacy subgraph.
- [x] Decide the initial backend stack for the migration API: plain Node HTTP while the data layer is being established.
- [x] Decide MongoDB access pattern for the first slice: native-driver-shaped repository adapter with projection code kept driver-independent.
- [x] Add MongoDB collection/index initialization specs.
- [x] Add Mongo repository adapter for application-owned records.
- [x] Add off-chain application service for creating/updating souls, games, and claims.

## Next Implementation Slice

- [x] Add a real MongoDB driver connection factory around the repository adapter.
- [x] Apply index specs to the live MongoDB database.
- [x] Create a database abstraction layer that owns collection names, deterministic ID helpers, and collection-scoped repository methods.
- [x] Add graph-shaped mapper APIs for account, soul, game, and claim records.
- [x] Replace planned ABI-derived reads with API payload fields, service lookups, or mapper defaults.
- [x] Split Web2 runtime modules from Web3 legacy reference modules so new app code does not import `abis/`, `generated/`, `subgraph.yaml`, or `src/handlers/`.
- [x] Add HTTP JSON API routes for off-chain soul CRUD.
- [x] Add HTTP JSON API routes for off-chain game and claim CRUD.
- [x] Add request validation and consistent error responses.
- [x] Add read endpoints for homepage/application views.
- [x] Add live Mongo smoke tests for create/read/update using a test namespace or cleanup-safe records.

## Remaining Domain Services

- [x] Add soul attribute and soul association mappers, deterministic IDs, collections, indexes, and service writes.
- [ ] Add HTTP JSON API routes for soul attributes and associations.
- [x] Add game role, participant, and post mappers, deterministic IDs, collections, indexes, and service writes.
- [x] Add game nomination mappers, deterministic IDs, collections, indexes, and service writes.
- [x] Add claim stage, role, participant, nomination, and post mappers, deterministic IDs, collections, indexes, and service writes.
- [x] Document the MongoDB collection schema.
- [ ] Add payment events and aggregate payment totals.
- [ ] Add actions/activity records.
- [ ] Add opinions and announcements.

## Architecture Adjustments

- Contracts should be modeled as MongoDB collections and graph-shaped documents, not live contract handles.
- ABI calls should be replaced by mapper API calls that normalize Web2 request payloads into deterministic records.
- The Graph schema should remain the source reference for entity shape, relationship names, and deterministic IDs during migration.
- The tile/module structure should separate Web2 runtime code from Web3 legacy code:
  - Web2 runtime: HTTP routes, validation, application services, mappers, database abstraction, Mongo repository adapters.
  - Web3 legacy reference: ABIs, subgraph manifest, generated bindings, AssemblyScript handlers.
  - Shared references: documented schema conventions and deterministic ID rules only.

## Verification Commands

```bash
yarn test:web
yarn codegen
yarn build
yarn start:web
yarn mongo:indexes
```

With `MONGODB_URI` configured, open `http://localhost:3000` and confirm the MongoDB badge says `Available`.

## Dependency Install Resolution

The old dependency blocker was caused by `@graphprotocol/graph-cli@0.28.0` resolving transitive GitHub repositories that no longer exist:

- `https://github.com/edgeandnode/gluegun.git`
- `ssh://git@github.com/hugomrdias/concat-stream.git`

This was resolved by upgrading Graph packages:

- `@graphprotocol/graph-cli` to `^0.98.1`
- `@graphprotocol/graph-ts` to `^0.38.2`

Modern Graph tooling also required all GraphQL `@entity` directives to include `immutable`; the legacy schema is mutable, so entities are marked `immutable: false`.
