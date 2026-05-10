const net = require("node:net");
const dns = require("node:dns").promises;

async function checkMongoHealth(options = {}) {
  const uri = options.uri || process.env.MONGODB_URI || "";

  if (!uri.trim()) {
    return {
      available: false,
      status: "not_configured",
      message: "MONGODB_URI is not configured",
    };
  }

  try {
    if (options.createClient) {
      await pingWithMongoClient(options.createClient, uri, options.database);
    } else {
      const endpoint = await parseMongoEndpoint(uri, options.resolveSrvRecords);
      const connectToMongo = options.connectToMongo || connectToMongoEndpoint;
      await connectToMongo(endpoint);
    }

    return {
      available: true,
      status: "available",
      message: options.createClient ? "MongoDB connection verified" : "MongoDB endpoint is reachable",
    };
  } catch (error) {
    return {
      available: false,
      status: "unavailable",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function pingWithMongoClient(createClient, uri, database) {
  const client = createClient(uri);

  try {
    await client.db(database || process.env.MONGODB_DB || undefined).command({ ping: 1 });
  } finally {
    if (client && typeof client.close === "function") {
      await client.close();
    }
  }
}

async function parseMongoEndpoint(uri, resolveSrvRecords = dns.resolveSrv) {
  const parsed = new URL(uri);

  if (parsed.protocol === "mongodb+srv:") {
    const records = await resolveSrvRecords(`_mongodb._tcp.${parsed.hostname}`);
    if (!records.length) {
      throw new Error("MongoDB SRV record did not return any hosts");
    }
    return { host: records[0].name, port: records[0].port || 27017 };
  }

  if (parsed.protocol !== "mongodb:") {
    throw new Error("Unsupported MongoDB URI protocol");
  }

  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 27017;

  if (!host) {
    throw new Error("MongoDB URI is missing a host");
  }

  return { host, port };
}

function connectToMongoEndpoint({ host, port }) {
  const timeout = Number(process.env.MONGODB_TIMEOUT_MS || 2000);

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    const finish = (error) => {
      socket.removeAllListeners();
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => finish());
    socket.once("timeout", () => finish(new Error("MongoDB connection timed out")));
    socket.once("error", (error) => finish(error));
  });
}

module.exports = {
  checkMongoHealth,
  parseMongoEndpoint,
};
