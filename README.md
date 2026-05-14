# Solidify Protocol Subgraph

## Commands

- Install Graph CLI: `yarn global add @graphprotocol/graph-cli` or `npm install -g @graphprotocol/graph-cli`
- Install dependencies: `yarn install`
- Set deployment key: `graph auth`
- Update generated code: `yarn codegen`
- Build: `graph build`
- Deploy subgraph: `yarn deploy --product hosted-service [SUBGRAPH]`
- Deploy to development subgraph: `yarn deploy-dev`

###NPM

 - npx graph build
 - npx graph deploy

## Subgraph
### Deployments
- Mumbai - https://thegraph.com/hosted-service/subgraph/toledoroy/bountyprotocol
- Aurora - https://thegraph.com/hosted-service/subgraph/toledoroy/soulsystem_aurora

## Runtime Boundaries

New Web2 runtime code lives under `web/` and should depend on HTTP handlers, application services, mappers, and the MongoDB database abstraction.

Legacy Web3 reference code lives in `abis/`, `generated/`, `subgraph.yaml`, `schema.graphql`, and `src/handlers/`. These files document contract and graph behavior during the migration, but new Web2 modules should not import generated subgraph bindings or ABI JSON directly.

The MongoDB collection schema for the Web2 service is documented in `docs/DB_SCHEMA.md`.

## MongoDB Smoke Test

A smoke test is a quick live check that proves the main database path works end to end. Run the opt-in MongoDB smoke test only with a cleanup-safe test database configured:

```bash
yarn test:web:live
```

Set `MONGODB_URI` and preferably `MONGODB_TEST_DB` before running it. The test creates, reads, updates, deletes, and cleans up smoke-prefixed account, soul, game, and claim records.
