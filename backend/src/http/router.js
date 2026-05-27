const { authenticateRequest } = require('./auth');
const { ApiError } = require('../utils/errors');

function createRouter() {
  const routes = [];

  function add(method, pattern, handler, options = {}) {
    const keys = [];
    const regex = new RegExp(`^${pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })}$`);

    routes.push({ method, pattern, regex, keys, handler, options });
  }

  async function handle(ctx) {
    for (const route of routes) {
      if (route.method !== ctx.req.method) continue;

      const match = ctx.url.pathname.match(route.regex);
      if (!match) continue;

      ctx.params = route.keys.reduce((params, key, index) => {
        params[key] = decodeURIComponent(match[index + 1]);
        return params;
      }, {});

      if (route.options.auth) {
        const sessionInfo = authenticateRequest(ctx.store, ctx.req.headers);
        ctx.actor = sessionInfo.user;
        ctx.session = sessionInfo.session;
      }

      const result = await route.handler(ctx);
      if (result && typeof result === 'object' && 'status' in result && 'body' in result) {
        return result;
      }

      return { status: 200, body: result ?? {} };
    }

    throw ApiError.notFound(`Route not found: ${ctx.req.method} ${ctx.url.pathname}`);
  }

  return {
    get: (pattern, handler, options) => add('GET', pattern, handler, options),
    post: (pattern, handler, options) => add('POST', pattern, handler, options),
    patch: (pattern, handler, options) => add('PATCH', pattern, handler, options),
    delete: (pattern, handler, options) => add('DELETE', pattern, handler, options),
    handle,
  };
}

module.exports = { createRouter };
