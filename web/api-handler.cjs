const {
  createSoul,
  updateSoulProfile,
  deleteSoul,
  createGame,
  updateGame,
  deleteGame,
  createClaim,
  updateClaim,
  deleteClaim,
} = require("./application-service.cjs");
const { soulId, gameId, claimId } = require("./domain/ids.cjs");
const { createMongoConnection } = require("./mongo-client.cjs");
const {
  validateClaimCreate,
  validateClaimPatch,
  validateGameCreate,
  validateGamePatch,
  validateSoulCreate,
  validateSoulPatch,
} = require("./validation.cjs");

function createApiHandler(options = {}) {
  const createConnection = options.createMongoConnection || createMongoConnection;

  return async function handleApiRequest(request, response) {
    const url = new URL(request.url, "http://localhost");
    const route = `${request.method} ${url.pathname}`;

    try {
      if (route === "POST /api/souls") {
        const body = await readJsonBody(request);
        validateSoulCreate(body);
        const id = await withRepository({ ...options, createConnection }, (repo) => createSoul(repo, body), body.soulId);
        writeJson(response, 201, { id });
        return;
      }

      const soulMatch = url.pathname.match(/^\/api\/souls\/([^/]+)$/);
      if (request.method === "GET" && soulMatch) {
        const id = soulId(decodeURIComponent(soulMatch[1]));
        const soul = await withRepository({ ...options, createConnection }, (repo) => repo.getSoul(id));
        if (!soul) {
          writeJson(response, 404, {
            error: { code: "not_found", message: "Soul not found" },
          });
          return;
        }
        writeJson(response, 200, { soul });
        return;
      }

      if (request.method === "PATCH" && soulMatch) {
        const body = await readJsonBody(request);
        validateSoulPatch(body);
        const soulId = decodeURIComponent(soulMatch[1]);
        await withRepository({ ...options, createConnection }, (repo) => updateSoulProfile(repo, { ...body, soulId }));
        writeJson(response, 200, { id: soulId.trim() });
        return;
      }

      if (request.method === "DELETE" && soulMatch) {
        const id = soulId(decodeURIComponent(soulMatch[1]));
        await withRepository({ ...options, createConnection }, (repo) => deleteSoul(repo, { soulId: id }));
        writeJson(response, 200, { id, deleted: true });
        return;
      }

      if (route === "POST /api/games") {
        const body = await readJsonBody(request);
        validateGameCreate(body);
        const id = await withRepository({ ...options, createConnection }, (repo) => createGame(repo, body), body.gameId);
        writeJson(response, 201, { id });
        return;
      }

      const gameMatch = url.pathname.match(/^\/api\/games\/([^/]+)$/);
      if (request.method === "GET" && gameMatch) {
        const id = gameId(decodeURIComponent(gameMatch[1]));
        const game = await withRepository({ ...options, createConnection }, (repo) => repo.getGame(id));
        if (!game) {
          writeJson(response, 404, {
            error: { code: "not_found", message: "Game not found" },
          });
          return;
        }
        writeJson(response, 200, { game });
        return;
      }

      if (request.method === "PATCH" && gameMatch) {
        const body = await readJsonBody(request);
        validateGamePatch(body);
        const id = gameId(decodeURIComponent(gameMatch[1]));
        await withRepository({ ...options, createConnection }, (repo) => updateGame(repo, { ...body, gameId: id }));
        writeJson(response, 200, { id });
        return;
      }

      if (request.method === "DELETE" && gameMatch) {
        const id = gameId(decodeURIComponent(gameMatch[1]));
        await withRepository({ ...options, createConnection }, (repo) => deleteGame(repo, { gameId: id }));
        writeJson(response, 200, { id, deleted: true });
        return;
      }

      if (route === "POST /api/claims") {
        const body = await readJsonBody(request);
        validateClaimCreate(body);
        const id = await withRepository({ ...options, createConnection }, (repo) => createClaim(repo, body), body.claimId);
        writeJson(response, 201, { id });
        return;
      }

      const claimMatch = url.pathname.match(/^\/api\/claims\/([^/]+)$/);
      if (request.method === "GET" && claimMatch) {
        const id = claimId(decodeURIComponent(claimMatch[1]));
        const claim = await withRepository({ ...options, createConnection }, (repo) => repo.getClaim(id));
        if (!claim) {
          writeJson(response, 404, {
            error: { code: "not_found", message: "Claim not found" },
          });
          return;
        }
        writeJson(response, 200, { claim });
        return;
      }

      if (request.method === "PATCH" && claimMatch) {
        const body = await readJsonBody(request);
        validateClaimPatch(body);
        const id = claimId(decodeURIComponent(claimMatch[1]));
        await withRepository({ ...options, createConnection }, (repo) => updateClaim(repo, { ...body, claimId: id }));
        writeJson(response, 200, { id });
        return;
      }

      if (request.method === "DELETE" && claimMatch) {
        const id = claimId(decodeURIComponent(claimMatch[1]));
        await withRepository({ ...options, createConnection }, (repo) => deleteClaim(repo, { claimId: id }));
        writeJson(response, 200, { id, deleted: true });
        return;
      }

      writeJson(response, 404, { error: { code: "not_found", message: "Not found" } });
    } catch (error) {
      if (error.statusCode) {
        writeJson(response, error.statusCode, {
          error: { code: error.code, message: error.message },
        });
        return;
      }

      writeJson(response, 500, {
        error: { code: "internal_error", message: error.message },
      });
    }
  };
}

async function withRepository(options, run, rawId) {
  if (options.repository) {
    const result = await run(options.repository);
    return rawId === undefined ? result : normalizeResponseId(rawId);
  }

  const connection = await options.createConnection();
  try {
    const result = await run(connection.repository);
    return rawId === undefined ? result : normalizeResponseId(rawId);
  } finally {
    await connection.close();
  }
}

function normalizeResponseId(id) {
  return String(id || "").trim().toLowerCase();
}

async function readJsonBody(request) {
  let raw = "";

  for await (const chunk of request) {
    raw += chunk;
  }

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw httpError(400, "invalid_json", "Request body must be valid JSON");
  }
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function httpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

module.exports = {
  createApiHandler,
};
