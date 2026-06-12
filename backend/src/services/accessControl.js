const { ApiError } = require('../utils/errors');

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    initials: user.initials,
  };
}

function publicPatient(patient) {
  return {
    id: patient.id,
    userId: patient.userId,
    fullName: patient.fullName,
    accessCode: patient.accessCode,
    locationSharingEnabled: patient.locationSharingEnabled,
    compartilhamentoLocalizacao: patient.locationSharingEnabled,
    active: patient.active,
  };
}

function getDefaultPatientForActor(store, actor) {
  if (actor.role === 'patient') {
    const patient = store.findPatientByUserId(actor.id);
    if (!patient) throw ApiError.notFound('Patient profile not found');
    return patient;
  }

  const [link] = store.listCaregiverLinksForUser(actor.id);
  if (!link) throw ApiError.notFound('No linked patient found');

  const patient = store.findPatientById(link.patientId);
  if (!patient) throw ApiError.notFound('Linked patient not found');
  return patient;
}

function resolvePatientId(store, actor, patientId) {
  if (!patientId || patientId === 'me') {
    return getDefaultPatientForActor(store, actor).id;
  }

  return patientId;
}

function assertCanAccessPatient(store, actor, patientId) {
  const resolvedPatientId = resolvePatientId(store, actor, patientId);
  const patient = store.findPatientById(resolvedPatientId);
  if (!patient) throw ApiError.notFound('Patient not found');

  if (actor.role === 'patient' && patient.userId === actor.id) {
    return patient;
  }

  if (actor.role === 'caregiver' && store.findCaregiverLink(patient.id, actor.id)) {
    return patient;
  }

  throw ApiError.forbidden();
}

module.exports = {
  assertCanAccessPatient,
  getDefaultPatientForActor,
  publicPatient,
  publicUser,
  resolvePatientId,
};
