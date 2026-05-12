const { createMongoConnection } = require("./mongo-client.cjs");
const { getMongoIndexSpecs, initializeMongoIndexes } = require("./mongo-indexes.cjs");

async function applyMongoIndexes(options = {}) {
  const createConnection = options.createConnection || createMongoConnection;
  const initializeIndexes = options.initializeIndexes || initializeMongoIndexes;
  const connection = await createConnection(options.connectionOptions || {});

  try {
    const indexesApplied = await initializeIndexes(connection.db);
    return { indexesApplied };
  } finally {
    await connection.close();
  }
}

if (require.main === module) {
  applyMongoIndexes()
    .then((result) => {
      const specs = getMongoIndexSpecs();
      console.log(`Applied ${result.indexesApplied} indexes across ${specs.length} collections.`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}

module.exports = {
  applyMongoIndexes,
};
