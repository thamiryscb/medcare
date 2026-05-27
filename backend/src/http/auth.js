const { ApiError } = require('../utils/errors');

function authenticateRequest(store, headers) {
  const authorization = headers.authorization || '';
  const [scheme, token] = authorization.split(/\s+/);

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  const sessionInfo = store.findSession(token);
  if (!sessionInfo) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  return sessionInfo;
}

module.exports = { authenticateRequest };
