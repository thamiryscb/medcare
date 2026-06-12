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

    const createdMedication = await request(baseUrl, 'POST', '/patients/me/medications', patientToken, {
      name: 'Vitamina D 2000UI',
      dose: '1 capsula',
      boxColor: 'Caixa laranja',
      uiColor: '#fff0d6',
      instructions: 'Tomar apos o almoco.',
      imageUri: 'file:///vitamina-d.jpg',
      scheduleTimes: ['13:00'],
      confirmationLimitMinutes: 45,
    });

    if (!createdMedication.medication.imageUri || !createdMedication.medication.instructions) {
      throw new Error('Expected medication visual fields');
    }

    const checklist = await request(baseUrl, 'GET', '/patients/me/checklist', patientToken);
    const pending = checklist.items.find((item) => !item.taken);
    if (pending) {
      await request(baseUrl, 'PATCH', `/checklist/${encodeURIComponent(pending.id)}/taken`, patientToken, {
        taken: true,
      });
    }

    await request(baseUrl, 'PATCH', '/patients/me/location-sharing', patientToken, {
      enabled: true,
    });

    await request(baseUrl, 'POST', '/patients/me/locations', patientToken, {
      latitude: -5.7945,
      longitude: -35.211,
      accuracyMeters: 25,
    });

    const locations = await request(baseUrl, 'GET', '/patients/me/locations', patientToken);
    if (!Array.isArray(locations.locations) || locations.locations.length === 0) {
      throw new Error('Expected saved patient location');
    }

    const alerts = await request(baseUrl, 'GET', '/patients/me/alerts', patientToken);
    if (!Array.isArray(alerts.alerts)) {
      throw new Error('Expected patient alerts');
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
