const { ApiError } = require('../utils/errors');
const { assertCanAccessPatient, publicUser } = require('./accessControl');

function listFamily(store, actor, patientId) {
  const patient = assertCanAccessPatient(store, actor, patientId);

  const caregivers = store.listCaregiverLinksForPatient(patient.id).map((link) => {
    const user = store.findUserById(link.caregiverUserId);
    return user ? toCaregiverResponse(user, link) : null;
  }).filter(Boolean);

  return { patientId: patient.id, caregivers, cuidadores: caregivers };
}

function createFamilyInvite(store, actor, patientId, payload) {
  const patient = assertCanAccessPatient(store, actor, patientId);
  const email = payload.email;
  const name = payload.name || payload.nome;

  if (!email && !name) {
    throw ApiError.badRequest('Caregiver name or email is required');
  }

  const existingUser = email ? store.findUserByEmail(email) : null;
  if (existingUser && existingUser.role !== 'caregiver') {
    throw ApiError.conflict('Email belongs to a non-caregiver user');
  }

  if (existingUser) {
    const link = store.upsertCaregiverLink({
      patientId: patient.id,
      caregiverUserId: existingUser.id,
      relationship: payload.relationship || payload.relacao || 'Familiar',
    });

    return {
      linked: true,
      caregiver: toCaregiverResponse(existingUser, link),
    };
  }

  const invite = store.createCaregiverInvite({
    patientId: patient.id,
    name: name || email,
    email,
    phone: payload.phone || payload.telefone,
    relationship: payload.relationship || payload.relacao || 'Familiar',
  });

  return { linked: false, invite };
}

function toCaregiverResponse(user, link) {
  return {
    id: user.id,
    linkId: link.id,
    user: publicUser(user),
    name: `${user.name} (${link.relationship})`,
    nome: `${user.name} (${link.relationship})`,
    phone: user.phone,
    telefone: user.phone,
    initials: user.initials,
    iniciais: user.initials,
    relationship: link.relationship,
    status: link.status,
    notifyOnMissedDose: link.notifyOnMissedDose,
    avisaDoseNaoConfirmada: link.notifyOnMissedDose,
    notifyOnLocation: link.notifyOnLocation,
    avisaLocalizacao: link.notifyOnLocation,
  };
}

module.exports = { createFamilyInvite, listFamily, toCaregiverResponse };
