const http = require('http');
const { URL } = require('url');
const { readEnv } = require('./config/env');
const { createMemoryStore } = require('./data/memoryStore');
const { createRouter } = require('./http/router');
const { readJson, sendEmpty, sendError, sendJson } = require('./http/response');
const { registerRoutes } = require('./routes');

function createApp(options = {}) {
  const env = options.env || readEnv();
  const store = options.store || createMemoryStore();
  const router = createRouter();

  registerRoutes(router);

  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        sendEmpty(res, 204, env.corsOrigin);
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const body = shouldReadBody(req.method) ? await readJson(req) : {};
      const query = Object.fromEntries(url.searchParams.entries());

      const result = await router.handle({
        req,
        res,
        url,
        query,
        body,
        store,
        env,
        params: {},
        actor: null,
        session: null,
      });

      sendJson(res, result.status, result.body, env.corsOrigin);
    } catch (error) {
      sendError(res, error, env.corsOrigin);
    }
  });
}

function shouldReadBody(method) {
  return ['POST', 'PATCH', 'PUT'].includes(method);
}

module.exports = { createApp };
