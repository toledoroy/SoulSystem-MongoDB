const http = require("node:http");

const { checkMongoHealth } = require("./health.cjs");
const { renderHomepage } = require("./homepage.cjs");

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.url === "/health/mongo") {
      const mongo = await checkMongoHealth();
      response.writeHead(mongo.available ? 200 : 503, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ mongo }));
      return;
    }

    if (request.url !== "/" && request.url !== "/index.html") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const mongo = await checkMongoHealth();
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
