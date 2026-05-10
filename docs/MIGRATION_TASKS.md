# MongoDB Migration Task Tracker

**Last updated:** 2026-05-10

## Current Baseline

- [x] Create PRD for the Web3-to-Web2 MongoDB migration.
- [x] Add a homepage indicator for MongoDB availability.
- [x] Add a `/health/mongo` JSON health endpoint.
- [x] Add `mongodb+srv://` support for MongoDB Atlas-style connection strings.
- [x] Verify the live MongoDB Atlas endpoint is reachable from this environment.
- [x] Add environment template for MongoDB connection settings.
- [x] Remove the missing pinned Yarn release path so package commands can use the configured package manager.

## Preliminary Tasks

- [ ] Resolve legacy dependency install blockers and commit the generated lockfile.
- [x] Confirm `yarn test:web` passes through the package script.
- [ ] Confirm `yarn codegen` still works for the legacy subgraph.
- [ ] Confirm `yarn build` still works for the legacy subgraph.
- [x] Decide the initial backend stack for the migration API: plain Node HTTP while the data layer is being established.
- [ ] Decide whether MongoDB access should use the native driver directly or a model layer after the first projection slice.
- [x] Add MongoDB collection/index initialization specs.
- [x] Add raw event and checkpoint collection index specs.
- [ ] Port the first projection slice:
  - `Soul.Transfer`
  - `Soul.URI`
  - `Soul.SoulType`
  - `Soul.SoulHandle`
  - `Hub.ContractCreated`

## Verification Commands

```bash
yarn test:web
yarn codegen
yarn build
yarn start:web
```

With `MONGODB_URI` configured, open `http://localhost:3000` and confirm the MongoDB badge says `Available`.

## Dependency Install Blocker

`yarn install --ignore-scripts` is currently blocked by legacy Graph CLI transitive dependencies that reference missing repositories:

- `https://github.com/edgeandnode/gluegun.git`
- `ssh://git@github.com/hugomrdias/concat-stream.git`

Until this is resolved, use `yarn test:web` for the new Web2 starter tests and avoid relying on a clean dependency install for the legacy subgraph.
