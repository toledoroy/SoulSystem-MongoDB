function validateSoulCreate(body) {
  requireObject(body);
  requireString(body, "soulId");
  requireString(body, "owner");
  optionalString(body, "name");
  optionalString(body, "handle");
  optionalString(body, "type");
  optionalString(body, "role");
  optionalNumber(body, "stage");
  optionalStringArray(body, "tags");
}

function validateSoulPatch(body) {
  requireObject(body);
  optionalString(body, "name");
  optionalString(body, "handle");
  optionalString(body, "image");
  optionalString(body, "role");
  optionalNumber(body, "stage");
  optionalStringArray(body, "tags");
}

function validateGameCreate(body) {
  requireObject(body);
  requireString(body, "gameId");
  optionalString(body, "name");
  optionalString(body, "type");
  optionalString(body, "role");
}

function validateGamePatch(body) {
  requireObject(body);
  optionalString(body, "name");
  optionalString(body, "type");
  optionalString(body, "role");
}

function validateClaimCreate(body) {
  requireObject(body);
  requireString(body, "claimId");
  optionalString(body, "gameId");
  optionalString(body, "name");
  optionalString(body, "type");
  optionalString(body, "role");
  optionalNumber(body, "stage");
}

function validateClaimPatch(body) {
  requireObject(body);
  optionalString(body, "gameId");
  optionalString(body, "name");
  optionalString(body, "type");
  optionalString(body, "role");
  optionalNumber(body, "stage");
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw validationError("Request body must be a JSON object");
  }
}

function requireString(body, field) {
  if (typeof body[field] !== "string" || !body[field].trim()) {
    throw validationError(`${field} must be a non-empty string`);
  }
}

function optionalString(body, field) {
  if (body[field] !== undefined && typeof body[field] !== "string") {
    throw validationError(`${field} must be a string`);
  }
}

function optionalNumber(body, field) {
  if (body[field] !== undefined && typeof body[field] !== "number") {
    throw validationError(`${field} must be a number`);
  }
}

function optionalStringArray(body, field) {
  if (body[field] === undefined) return;

  if (!Array.isArray(body[field]) || body[field].some((value) => typeof value !== "string")) {
    throw validationError(`${field} must be an array of strings`);
  }
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "validation_error";
  return error;
}

module.exports = {
  validateClaimCreate,
  validateClaimPatch,
  validateGameCreate,
  validateGamePatch,
  validateSoulCreate,
  validateSoulPatch,
};
