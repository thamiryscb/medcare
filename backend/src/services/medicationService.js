const { ApiError } = require('../utils/errors');
const { todayLocalDate } = require('../utils/dates');
const { assertCanAccessPatient } = require('./accessControl');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function listMedications(store, actor, patientId) {
  const patient = assertCanAccessPatient(store, actor, patientId);
  const todayCheckins = store.listCheckins(patient.id, todayLocalDate());

  return {
    patientId: patient.id,
    medications: store.listMedications(patient.id).map((medication) => {
      const schedules = store.listSchedulesForMedication(medication.id);
      return toMedicationResponse(medication, schedules, todayCheckins);
    }),
  };
}

function createMedication(store, actor, patientId, payload) {
  const patient = assertCanAccessPatient(store, actor, patientId);
  const normalized = normalizeMedicationPayload(payload, true);
  const medication = store.createMedication(patient.id, normalized);

  return {
    medication: toMedicationResponse(medication, store.listSchedulesForMedication(medication.id), []),
  };
}

function updateMedication(store, actor, medicationId, payload) {
  const medication = store.findMedicationById(medicationId);
  if (!medication) throw ApiError.notFound('Medication not found');

  assertCanAccessPatient(store, actor, medication.patientId);
  const normalized = normalizeMedicationPayload(payload, false);
  const updated = store.updateMedication(medication.id, normalized);

  return {
    medication: toMedicationResponse(updated, store.listSchedulesForMedication(updated.id), []),
  };
}

function deleteMedication(store, actor, medicationId) {
  const medication = store.findMedicationById(medicationId);
  if (!medication) throw ApiError.notFound('Medication not found');

  assertCanAccessPatient(store, actor, medication.patientId);
  store.deleteMedication(medication.id);

  return { deleted: true, medicationId: medication.id };
}

function normalizeMedicationPayload(payload, requireName) {
  const name = payload.name || payload.nome || payload.novoNome;
  const dose = payload.dose || payload.novaDose;
  const boxColor = payload.boxColor || payload.corBox;
  const uiColor = payload.uiColor || payload.cor;
  const rawTimes = payload.scheduleTimes || payload.horarios || payload.times || payload.horarioPrincipal || payload.novoHorario;
  const scheduleTimes = normalizeTimes(rawTimes);

  if (requireName && !name) {
    throw ApiError.badRequest('Medication name is required');
  }

  if (requireName && scheduleTimes.length === 0) {
    scheduleTimes.push('08:00');
  }

  return {
    name,
    dose,
    boxColor,
    uiColor,
    scheduleTimes,
  };
}

function normalizeTimes(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];

  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].map((time) => {
    if (!TIME_PATTERN.test(time)) {
      throw ApiError.badRequest(`Invalid time: ${time}. Use HH:MM.`);
    }

    return time;
  });
}

function toMedicationResponse(medication, schedules, checkins) {
  const scheduleTimes = schedules.map((schedule) => schedule.time).sort();
  const takenToday = schedules.some((schedule) => checkins.some((checkin) => (
    checkin.medicationId === medication.id &&
    checkin.scheduleId === schedule.id &&
    checkin.status === 'taken'
  )));

  return {
    id: medication.id,
    patientId: medication.patientId,
    name: medication.name,
    nome: medication.name,
    dose: medication.dose,
    boxColor: medication.boxColor,
    corBox: medication.boxColor,
    uiColor: medication.uiColor,
    cor: medication.uiColor,
    scheduleTimes,
    schedules: scheduleTimes,
    horarios: scheduleTimes,
    takenToday,
    tomado: takenToday,
    createdAt: medication.createdAt,
    updatedAt: medication.updatedAt,
  };
}

module.exports = {
  createMedication,
  deleteMedication,
  listMedications,
  toMedicationResponse,
  updateMedication,
};
