const { ApiError } = require('../utils/errors');
const { assertCanAccessPatient } = require('./accessControl');

function updateLocationSharing(store, actor, patientId, payload) {
  const patient = assertCanAccessPatient(store, actor, patientId);
  const enabled = payload.enabled ?? payload.ativo ?? payload.compartilhamentoLocalizacao;

  if (typeof enabled !== 'boolean') {
    throw ApiError.badRequest('Location sharing enabled flag is required');
  }

  return {
    patient: store.setPatientLocationSharing(patient.id, enabled),
  };
}

function createLocationEvent(store, actor, patientId, payload) {
  const patient = assertCanAccessPatient(store, actor, patientId);

  if (!patient.locationSharingEnabled) {
    throw ApiError.forbidden('Location sharing is disabled for this patient');
  }

  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw ApiError.badRequest('Latitude and longitude are required');
  }

  return {
    location: toLocationResponse(store.createLocationEvent(patient.id, {
      ...payload,
      latitude,
      longitude,
    })),
  };
}

function listLocationEvents(store, actor, patientId, payload = {}) {
  const patient = assertCanAccessPatient(store, actor, patientId);
  const limit = Math.min(Number(payload.limit || payload.limite || 20), 100);

  return {
    patientId: patient.id,
    locationSharingEnabled: patient.locationSharingEnabled,
    locations: store.listLocationEvents(patient.id, Number.isFinite(limit) ? limit : 20).map(toLocationResponse),
  };
}

function toLocationResponse(location) {
  return {
    id: location.id,
    patientId: location.patientId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: location.accuracyMeters,
    precisaoMetros: location.accuracyMeters,
    capturedAt: location.capturedAt,
    capturadoEm: location.capturedAt,
    sentToCaregiver: location.sentToCaregiver,
    enviadoAoCuidador: location.sentToCaregiver,
    createdAt: location.createdAt,
  };
}

module.exports = {
  createLocationEvent,
  listLocationEvents,
  updateLocationSharing,
};
