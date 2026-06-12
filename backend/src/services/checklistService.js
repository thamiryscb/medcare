const { ApiError } = require('../utils/errors');
const {
  buildChecklistItemId,
  compareTime,
  normalizeDate,
  nowIso,
  parseChecklistItemId,
} = require('../utils/dates');
const { assertCanAccessPatient } = require('./accessControl');

function getChecklistForDate(store, actor, patientId, dateValue) {
  let date;

  try {
    date = normalizeDate(dateValue);
  } catch (error) {
    throw ApiError.badRequest(error.message);
  }

  const patient = assertCanAccessPatient(store, actor, patientId);
  const checkins = store.listCheckins(patient.id, date);
  const items = store.listMedications(patient.id)
    .flatMap((medication) => {
      return store.listSchedulesForMedication(medication.id).map((schedule) => {
        const checkin = checkins.find((item) => (
          item.medicationId === medication.id &&
          item.scheduleId === schedule.id &&
          item.status === 'taken'
        ));

        const taken = Boolean(checkin);

        return {
          id: buildChecklistItemId(date, medication.id, schedule.id),
          medicationId: medication.id,
          scheduleId: schedule.id,
          name: medication.name,
          nome: medication.name,
          time: schedule.time,
          horario: schedule.time,
          dose: medication.dose,
          uiColor: medication.uiColor,
          cor: medication.uiColor,
          confirmationLimitMinutes: schedule.confirmationLimitMinutes || 30,
          taken,
          tomado: taken,
          status: taken ? 'taken' : doseStatus(date, schedule.time, schedule.confirmationLimitMinutes),
          confirmedAt: checkin ? checkin.confirmedAt : null,
          confirmedByUserId: checkin ? checkin.confirmedByUserId : null,
        };
      });
    })
    .sort((left, right) => compareTime(left.time, right.time) || left.name.localeCompare(right.name));

  ensureMissedDoseAlerts(store, patient.id, date, items);

  const taken = items.filter((item) => item.taken).length;
  const total = items.length;

  return {
    date,
    total,
    taken,
    tomados: taken,
    pending: total - taken,
    pendentes: total - taken,
    progress: total === 0 ? 0 : Math.round((taken / total) * 100),
    items,
    itens: items,
  };
}

function doseStatus(date, time, confirmationLimitMinutes = 30) {
  return isDoseLate(date, time, confirmationLimitMinutes) ? 'missed' : 'pending';
}

function isDoseLate(date, time, confirmationLimitMinutes = 30) {
  const scheduledAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(scheduledAt.getTime())) return false;

  const limitAt = scheduledAt.getTime() + Number(confirmationLimitMinutes || 30) * 60 * 1000;
  return limitAt < Date.now();
}

function ensureMissedDoseAlerts(store, patientId, date, items) {
  items
    .filter((item) => !item.taken && item.status === 'missed')
    .forEach((item) => {
      const detail = `${date}:${item.medicationId}:${item.scheduleId}`;
      if (store.findOpenAlertByTypeAndDetail(patientId, 'missed_medication', detail)) return;

      store.createAlert({
        patientId,
        type: 'missed_medication',
        severity: 'warning',
        title: 'Lembrete nao confirmado',
        description: `${item.name} - previsto para ${item.time} em ${date}`,
        detail,
        status: 'open',
      });
    });
}

function markChecklistItemTaken(store, actor, itemId, payload = {}) {
  let parsed;

  try {
    parsed = parseChecklistItemId(itemId);
  } catch (error) {
    throw ApiError.badRequest(error.message);
  }

  const medication = store.findMedicationById(parsed.medicationId);
  if (!medication) throw ApiError.notFound('Medication not found');

  const patient = assertCanAccessPatient(store, actor, medication.patientId);
  const schedule = store
    .listSchedulesForMedication(medication.id)
    .find((item) => item.id === parsed.scheduleId);

  if (!schedule) throw ApiError.notFound('Schedule not found');

  const taken = payload.taken !== false && payload.tomado !== false;
  const checkin = store.upsertCheckin({
    patientId: patient.id,
    medicationId: medication.id,
    scheduleId: schedule.id,
    date: parsed.date,
    status: taken ? 'taken' : 'pending',
    confirmedAt: taken ? nowIso() : null,
    confirmedByUserId: taken ? actor.id : null,
  });

  return {
    itemId,
    medicationId: medication.id,
    scheduleId: schedule.id,
    date: parsed.date,
    taken,
    tomado: taken,
    checkin,
  };
}

module.exports = { getChecklistForDate, markChecklistItemTaken };
