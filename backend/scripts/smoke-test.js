const { createApp } = require('../src/app');
const { createSqliteStore } = require('../src/data/sqliteStore');

async function main() {
  const server = createApp({ store: createSqliteStore(':memory:') });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    const patientLogin = await request(baseUrl, 'POST', '/auth/patient/login', null, {
      emailOrName: 'maria@email.com',
      password: '123456',
    });

    const patientToken = patientLogin.token;
    await request(baseUrl, 'GET', '/patients/me/dashboard', patientToken);

    const medications = await request(baseUrl, 'GET', '/patients/me/medications', patientToken);
    if (!Array.isArray(medications.medications) || medications.medications.length === 0) {
      throw new Error('Expected seeded medications');
    }

    const checklist = await request(baseUrl, 'GET', '/patients/me/checklist', patientToken);
    const pending = checklist.items.find((item) => !item.taken);
    if (pending) {
      await request(baseUrl, 'PATCH', `/checklist/${encodeURIComponent(pending.id)}/taken`, patientToken, {
        taken: true,
      });
    }

    const patientCode = patientLogin.patient.accessCode;
    const caregiverLogin = await request(baseUrl, 'POST', '/auth/family/login', null, {
      email: 'carlos@email.com',
      password: '123456',
      patientCode,
    });

    await request(baseUrl, 'GET', '/family/dashboard', caregiverLogin.token);
    console.log('Smoke test passed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function request(baseUrl, method, path, token, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${JSON.stringify(payload)}`);
  }

  return payload;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
