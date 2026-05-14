const http = require("node:http");

const { createApiHandler } = require("./api-handler.cjs");
const { checkMongoHealth } = require("./health.cjs");
const { renderHomepage } = require("./homepage.cjs");
const { createMongoConnection } = require("./mongo-client.cjs");

function createServer(options = {}) {
  const healthCheck = options.checkMongoHealth || checkMongoHealth;
  const createConnection = options.createMongoConnection || createMongoConnection;
  const handleApiRequest = createApiHandler({
    repository: options.repository,
    createMongoConnection: createConnection,
  });

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (url.pathname === "/health/mongo") {
      const mongo = await healthCheck();
      response.writeHead(mongo.available ? 200 : 503, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ mongo }));
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApiRequest(request, response);
      return;
    }

    if (url.pathname !== "/" && url.pathname !== "/index.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const mongo = await healthCheck();
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderHomepage({ mongo }));
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();

  server.listen(port, () => {
    console.log(`SoulSystem migration homepage: http://localhost:${port}`);
  });
}

module.exports = {
  createServer,
};
