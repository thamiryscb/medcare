const crypto = require('crypto');
const { seedData } = require('./seed');
const { nowIso } = require('../utils/dates');
const { hashPassword } = require('../utils/passwords');
const { firstNameCode, initialsFromName, normalizeText } = require('../utils/strings');

function createMemoryStore(initialData = seedData()) {
  const data = JSON.parse(JSON.stringify(initialData));

  function createId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  function touch(record) {
    record.updatedAt = nowIso();
    return record;
  }

  function createAccessCode(fullName) {
    const base = `${firstNameCode(fullName)}-${new Date().getFullYear()}`;
    let code = base;
    let suffix = 2;

    while (data.patients.some((patient) => patient.accessCode === code)) {
      code = `${base}-${suffix}`;
      suffix += 1;
    }

    return code;
  }

  return {
    data,

    createId,

    findUserById(userId) {
      return data.users.find((user) => user.id === userId) || null;
    },

    findUserByEmail(email) {
      const normalizedEmail = normalizeText(email);
      return data.users.find((user) => normalizeText(user.email) === normalizedEmail) || null;
    },

    findUserByEmailOrName(value, role) {
      const normalizedValue = normalizeText(value);
      return data.users.find((user) => {
        if (role && user.role !== role) return false;
        return normalizeText(user.email) === normalizedValue || normalizeText(user.name) === normalizedValue;
      }) || null;
    },

    createUser(payload) {
      const now = nowIso();
      const user = {
        id: createId('user'),
        role: payload.role,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        initials: initialsFromName(payload.name),
        passwordHash: hashPassword(payload.password),
        createdAt: now,
        updatedAt: now,
      };

      data.users.push(user);
      return user;
    },

    findPatientById(patientId) {
      return data.patients.find((patient) => patient.id === patientId && patient.active) || null;
    },

    findPatientByUserId(userId) {
      return data.patients.find((patient) => patient.userId === userId && patient.active) || null;
    },

    findPatientByAccessCode(accessCode) {
      const normalizedCode = String(accessCode || '').trim().toUpperCase();
      return data.patients.find((patient) => patient.accessCode.toUpperCase() === normalizedCode && patient.active) || null;
    },

    createPatient(payload) {
      const now = nowIso();
      const patient = {
        id: createId('patient'),
        userId: payload.userId,
        fullName: payload.fullName,
        accessCode: createAccessCode(payload.fullName),
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      data.patients.push(patient);
      return patient;
    },

    listCaregiverLinksForPatient(patientId) {
      return data.caregiverLinks.filter((link) => link.patientId === patientId && link.status === 'active');
    },

    listCaregiverLinksForUser(userId) {
      return data.caregiverLinks.filter((link) => link.caregiverUserId === userId && link.status === 'active');
    },

    findCaregiverLink(patientId, caregiverUserId) {
      return data.caregiverLinks.find((link) => (
        link.patientId === patientId &&
        link.caregiverUserId === caregiverUserId &&
        link.status === 'active'
      )) || null;
    },

    upsertCaregiverLink(payload) {
      const existing = data.caregiverLinks.find((link) => (
        link.patientId === payload.patientId &&
        link.caregiverUserId === payload.caregiverUserId
      ));

      if (existing) {
        existing.relationship = payload.relationship || existing.relationship;
        existing.status = 'active';
        return touch(existing);
      }

      const now = nowIso();
      const link = {
        id: createId('link'),
        patientId: payload.patientId,
        caregiverUserId: payload.caregiverUserId,
        relationship: payload.relationship || 'Familiar',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      data.caregiverLinks.push(link);
      return link;
    },

    createCaregiverInvite(payload) {
      const now = nowIso();
      const invite = {
        id: createId('invite'),
        patientId: payload.patientId,
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone || null,
        relationship: payload.relationship || 'Familiar',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      data.caregiverInvites.push(invite);
      return invite;
    },

    listMedications(patientId) {
      return data.medications.filter((medication) => medication.patientId === patientId && medication.active);
    },

    findMedicationById(medicationId) {
      return data.medications.find((medication) => medication.id === medicationId && medication.active) || null;
    },

    listSchedulesForMedication(medicationId) {
      return data.medicationSchedules.filter((schedule) => schedule.medicationId === medicationId && schedule.active);
    },

    createMedication(patientId, payload) {
      const now = nowIso();
      const medication = {
        id: createId('med'),
        patientId,
        name: payload.name,
        dose: payload.dose || '1 comprimido',
        boxColor: payload.boxColor || 'Caixa azul',
        uiColor: payload.uiColor || '#e6f0ff',
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      data.medications.push(medication);

      payload.scheduleTimes.forEach((time) => {
        data.medicationSchedules.push({
          id: createId('sched'),
          medicationId: medication.id,
          time,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      });

      return medication;
    },

    updateMedication(medicationId, payload) {
      const medication = this.findMedicationById(medicationId);
      if (!medication) return null;

      if (payload.name) medication.name = payload.name;
      if (payload.dose) medication.dose = payload.dose;
      if (payload.boxColor) medication.boxColor = payload.boxColor;
      if (payload.uiColor) medication.uiColor = payload.uiColor;
      touch(medication);

      if (Array.isArray(payload.scheduleTimes)) {
        data.medicationSchedules
          .filter((schedule) => schedule.medicationId === medication.id)
          .forEach((schedule) => {
            schedule.active = false;
            touch(schedule);
          });

        payload.scheduleTimes.forEach((time) => {
          const now = nowIso();
          data.medicationSchedules.push({
            id: createId('sched'),
            medicationId: medication.id,
            time,
            active: true,
            createdAt: now,
            updatedAt: now,
          });
        });
      }

      return medication;
    },

    deleteMedication(medicationId) {
      const medication = this.findMedicationById(medicationId);
      if (!medication) return null;

      medication.active = false;
      touch(medication);
      return medication;
    },

    listCheckins(patientId, date) {
      return data.medicationCheckins.filter((checkin) => checkin.patientId === patientId && checkin.date === date);
    },

    findCheckin(patientId, medicationId, scheduleId, date) {
      return data.medicationCheckins.find((checkin) => (
        checkin.patientId === patientId &&
        checkin.medicationId === medicationId &&
        checkin.scheduleId === scheduleId &&
        checkin.date === date
      )) || null;
    },

    upsertCheckin(payload) {
      const existing = this.findCheckin(payload.patientId, payload.medicationId, payload.scheduleId, payload.date);
      const now = nowIso();

      if (existing) {
        existing.status = payload.status;
        existing.confirmedAt = payload.confirmedAt || null;
        existing.confirmedByUserId = payload.confirmedByUserId || null;
        return touch(existing);
      }

      const checkin = {
        id: createId('checkin'),
        patientId: payload.patientId,
        medicationId: payload.medicationId,
        scheduleId: payload.scheduleId,
        date: payload.date,
        status: payload.status,
        confirmedAt: payload.confirmedAt || null,
        confirmedByUserId: payload.confirmedByUserId || null,
        createdAt: now,
        updatedAt: now,
      };

      data.medicationCheckins.push(checkin);
      return checkin;
    },

    listAlerts(patientId) {
      return data.alerts
        .filter((alert) => alert.patientId === patientId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    findAlertById(alertId) {
      return data.alerts.find((alert) => alert.id === alertId) || null;
    },

    markAlertRead(alertId) {
      const alert = this.findAlertById(alertId);
      if (!alert) return null;
      alert.status = 'read';
      return touch(alert);
    },

    createSession(userId, ttlHours) {
      const now = Date.now();
      const expiresAt = new Date(now + ttlHours * 60 * 60 * 1000).toISOString();
      const session = {
        token: crypto.randomBytes(32).toString('hex'),
        userId,
        expiresAt,
        createdAt: nowIso(),
      };

      data.sessions = data.sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
      data.sessions.push(session);
      return session;
    },

    findSession(token) {
      const session = data.sessions.find((item) => item.token === token);
      if (!session) return null;
      if (new Date(session.expiresAt).getTime() <= Date.now()) return null;

      const user = this.findUserById(session.userId);
      if (!user) return null;

      return { session, user };
    },

    destroySession(token) {
      const originalLength = data.sessions.length;
      data.sessions = data.sessions.filter((session) => session.token !== token);
      return data.sessions.length !== originalLength;
    },
  };
}

module.exports = { createMemoryStore };
