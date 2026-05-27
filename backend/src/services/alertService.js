const { ApiError } = require('../utils/errors');
const { assertCanAccessPatient } = require('./accessControl');

function listAlerts(store, actor, patientId) {
  const patient = assertCanAccessPatient(store, actor, patientId);

  return {
    patientId: patient.id,
    alerts: store.listAlerts(patient.id).map(toAlertResponse),
  };
}

function markAlertRead(store, actor, alertId) {
  const alert = store.findAlertById(alertId);
  if (!alert) throw ApiError.notFound('Alert not found');

  assertCanAccessPatient(store, actor, alert.patientId);
  return { alert: toAlertResponse(store.markAlertRead(alert.id)) };
}

function toAlertResponse(alert) {
  return {
    id: alert.id,
    patientId: alert.patientId,
    type: alert.type,
    tipo: alert.severity === 'success' ? 'ok' : 'alerta',
    severity: alert.severity,
    title: alert.title,
    titulo: alert.title,
    description: alert.description,
    desc: alert.description,
    detail: alert.detail,
    detalhe: alert.detail,
    status: alert.status,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}

module.exports = { listAlerts, markAlertRead, toAlertResponse };
