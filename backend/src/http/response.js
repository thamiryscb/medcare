const { ApiError } = require('../utils/errors');

const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(res, status, payload, corsOrigin) {
  const body = JSON.stringify(payload);

  res.writeHead(status, {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendEmpty(res, status, corsOrigin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  res.end();
}

function sendError(res, error, corsOrigin) {
  const status = error instanceof ApiError ? error.status : 500;
  const payload = {
    error: {
      message: error instanceof ApiError ? error.message : 'Internal server error',
      details: error instanceof ApiError ? error.details : undefined,
    },
  };

  sendJson(res, status, payload, corsOrigin);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(ApiError.badRequest('Request body is too large'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(ApiError.badRequest('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

module.exports = { readJson, sendEmpty, sendError, sendJson };
