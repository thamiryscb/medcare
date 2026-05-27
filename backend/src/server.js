const { createApp } = require('./app');
const { readEnv } = require('./config/env');

const env = readEnv();
const app = createApp({ env });

app.listen(env.port, () => {
  console.log(`MedCare backend running at http://localhost:${env.port}`);
});
