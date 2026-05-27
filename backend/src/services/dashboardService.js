const { getChecklistForDate } = require('./checklistService');
const { listAlerts } = require('./alertService');
const { listFamily } = require('./familyService');
const { assertCanAccessPatient, getDefaultPatientForActor, publicPatient, publicUser } = require('./accessControl');
const { todayLocalDate } = require('../utils/dates');

function getPatientDashboard(store, actor) {
  const patient = getDefaultPatientForActor(store, actor);
  const checklist = getChecklistForDate(store, actor, patient.id, todayLocalDate());
  const family = listFamily(store, actor, patient.id);
  const alerts = listAlerts(store, actor, patient.id).alerts;

  return buildDashboard({
    actor,
    patient,
    checklist,
    family,
    alerts,
    mode: 'patient',
  });
}

function getCaregiverDashboard(store, actor, patientId) {
  const patient = patientId
    ? assertCanAccessPatient(store, actor, patientId)
    : getDefaultPatientForActor(store, actor);
  const checklist = getChecklistForDate(store, actor, patient.id, todayLocalDate());
  const family = listFamily(store, actor, patient.id);
  const alerts = listAlerts(store, actor, patient.id).alerts;

  return buildDashboard({
    actor,
    patient,
    checklist,
    family,
    alerts,
    mode: 'caregiver',
  });
}

function buildDashboard({ actor, patient, checklist, family, alerts, mode }) {
  const pendingItems = checklist.items.filter((item) => !item.taken);
  const nextReminder = pendingItems[0] ? {
    medicationId: pendingItems[0].medicationId,
    scheduleId: pendingItems[0].scheduleId,
    name: pendingItems[0].name,
    nome: pendingItems[0].name,
    time: pendingItems[0].time,
    horario: pendingItems[0].time,
    label: `Hoje as ${pendingItems[0].time}`,
  } : null;

  const activeAlerts = alerts.filter((alert) => alert.status === 'open');

  return {
    mode,
    user: publicUser(actor),
    patient: publicPatient(patient),
    nextReminder,
    proximoLembrete: nextReminder,
    todaySummary: {
      taken: checklist.taken,
      tomados: checklist.taken,
      pending: checklist.pending,
      pendentes: checklist.pending,
      total: checklist.total,
      progress: checklist.progress,
    },
    menuSummary: {
      medicationsLabel: 'Ver e cadastrar remedios',
      checklistLabel: `${checklist.taken} de ${checklist.total} tomados`,
      caregiversLabel: `${family.caregivers.length} cuidadores`,
      alertsLabel: `${activeAlerts.length} alerta ativo`,
    },
    caregivers: family.caregivers,
    cuidadores: family.caregivers,
    alerts,
    alertas: alerts,
  };
}

module.exports = { getCaregiverDashboard, getPatientDashboard };
