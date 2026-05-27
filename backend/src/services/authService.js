const { ApiError } = require('../utils/errors');
const { verifyPassword } = require('../utils/passwords');
const { getDefaultPatientForActor, publicPatient, publicUser } = require('./accessControl');

function loginPatient(store, payload, options) {
  const emailOrName = payload.emailOrName || payload.email || payload.nome || payload.name;
  const password = payload.password || payload.senha;

  if (!emailOrName || !password) {
    throw ApiError.badRequest('Email/name and password are required');
  }

  const user = store.findUserByEmailOrName(emailOrName, 'patient');
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw ApiError.unauthorized('Invalid patient credentials');
  }

  const patient = store.findPatientByUserId(user.id);
  if (!patient) throw ApiError.notFound('Patient profile not found');

  return issueSession(store, user, options.sessionTtlHours, { patient: publicPatient(patient) });
}

function loginCaregiver(store, payload, options) {
  const email = payload.email;
  const password = payload.password || payload.senha;
  const patientCode = payload.patientCode || payload.codigo;

  if (!email || !password || !patientCode) {
    throw ApiError.badRequest('Email, password, and patient code are required');
  }

  const user = store.findUserByEmail(email);
  if (!user || user.role !== 'caregiver' || !verifyPassword(password, user.passwordHash)) {
    throw ApiError.unauthorized('Invalid caregiver credentials');
  }

  const patient = store.findPatientByAccessCode(patientCode);
  if (!patient) throw ApiError.notFound('Patient code not found');

  store.upsertCaregiverLink({
    patientId: patient.id,
    caregiverUserId: user.id,
    relationship: payload.relationship || 'Familiar',
  });

  return issueSession(store, user, options.sessionTtlHours, { linkedPatient: publicPatient(patient) });
}

function registerPatient(store, payload, options) {
  const name = payload.name || payload.nome;
  const email = payload.email;
  const password = payload.password || payload.senha;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email, and password are required');
  }

  if (store.findUserByEmail(email)) {
    throw ApiError.conflict('Email already registered');
  }

  const user = store.createUser({
    role: 'patient',
    name,
    email,
    password,
    phone: payload.phone || payload.telefone,
  });
  const patient = store.createPatient({ userId: user.id, fullName: name });

  return issueSession(store, user, options.sessionTtlHours, { patient: publicPatient(patient) });
}

function registerCaregiver(store, payload, options) {
  const name = payload.name || payload.nome;
  const email = payload.email;
  const password = payload.password || payload.senha;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email, and password are required');
  }

  if (store.findUserByEmail(email)) {
    throw ApiError.conflict('Email already registered');
  }

  const user = store.createUser({
    role: 'caregiver',
    name,
    email,
    password,
    phone: payload.phone || payload.telefone,
  });

  let linkedPatient = null;
  const patientCode = payload.patientCode || payload.codigo;

  if (patientCode) {
    const patient = store.findPatientByAccessCode(patientCode);
    if (!patient) throw ApiError.notFound('Patient code not found');

    store.upsertCaregiverLink({
      patientId: patient.id,
      caregiverUserId: user.id,
      relationship: payload.relationship || 'Familiar',
    });

    linkedPatient = publicPatient(patient);
  }

  return issueSession(store, user, options.sessionTtlHours, { linkedPatient });
}

function currentProfile(store, actor) {
  const profile = { user: publicUser(actor) };

  if (actor.role === 'patient') {
    profile.patient = publicPatient(getDefaultPatientForActor(store, actor));
  } else {
    profile.linkedPatients = store.listCaregiverLinksForUser(actor.id).map((link) => {
      const patient = store.findPatientById(link.patientId);
      return {
        linkId: link.id,
        relationship: link.relationship,
        patient: patient ? publicPatient(patient) : null,
      };
    }).filter((item) => item.patient);
  }

  return profile;
}

function issueSession(store, user, ttlHours, extra = {}) {
  const session = store.createSession(user.id, ttlHours);

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: publicUser(user),
    ...extra,
  };
}

module.exports = {
  currentProfile,
  loginCaregiver,
  loginPatient,
  registerCaregiver,
  registerPatient,
};
