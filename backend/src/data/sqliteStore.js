const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { seedData } = require('./seed');
const { nowIso } = require('../utils/dates');
const { hashPassword } = require('../utils/passwords');
const { firstNameCode, initialsFromName, normalizeText } = require('../utils/strings');

function createSqliteStore(databaseUrl) {
  const databasePath = resolveDatabasePath(databaseUrl);

  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(path.resolve(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8'));
  migrateExistingDatabase(db);
  seedIfEmpty(db);

  function createId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  function createAccessCode(fullName) {
    const base = `${firstNameCode(fullName)}-${new Date().getFullYear()}`;
    let code = base;
    let suffix = 2;

    while (db.prepare('SELECT id FROM patients WHERE UPPER(access_code) = ?').get(code.toUpperCase())) {
      code = `${base}-${suffix}`;
      suffix += 1;
    }

    return code;
  }

  const store = {
    db,
    databasePath,

    createId,

    close() {
      db.close();
    },

    findUserById(userId) {
      return mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
    },

    findUserByEmail(email) {
      const normalizedEmail = normalizeText(email);
      return db.prepare('SELECT * FROM users').all()
        .map(mapUser)
        .find((user) => normalizeText(user.email) === normalizedEmail) || null;
    },

    findUserByEmailOrName(value, role) {
      const normalizedValue = normalizeText(value);
      return db.prepare('SELECT * FROM users').all()
        .map(mapUser)
        .find((user) => {
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

      db.prepare(`
        INSERT INTO users (id, role, name, email, phone, password_hash, initials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.role,
        user.name,
        user.email,
        user.phone,
        user.passwordHash,
        user.initials,
        user.createdAt,
        user.updatedAt,
      );

      return user;
    },

    findPatientById(patientId) {
      return mapPatient(db.prepare('SELECT * FROM patients WHERE id = ? AND active = 1').get(patientId));
    },

    findPatientByUserId(userId) {
      return mapPatient(db.prepare('SELECT * FROM patients WHERE user_id = ? AND active = 1').get(userId));
    },

    findPatientByAccessCode(accessCode) {
      const normalizedCode = String(accessCode || '').trim().toUpperCase();
      return mapPatient(db.prepare('SELECT * FROM patients WHERE UPPER(access_code) = ? AND active = 1').get(normalizedCode));
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

      db.prepare(`
        INSERT INTO patients (id, user_id, full_name, access_code, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        patient.id,
        patient.userId,
        patient.fullName,
        patient.accessCode,
        1,
        patient.createdAt,
        patient.updatedAt,
      );

      return patient;
    },

    listCaregiverLinksForPatient(patientId) {
      return db.prepare(`
        SELECT * FROM caregiver_links
        WHERE patient_id = ? AND status = 'active'
        ORDER BY created_at
      `).all(patientId).map(mapCaregiverLink);
    },

    listCaregiverLinksForUser(userId) {
      return db.prepare(`
        SELECT * FROM caregiver_links
        WHERE caregiver_user_id = ? AND status = 'active'
        ORDER BY created_at
      `).all(userId).map(mapCaregiverLink);
    },

    findCaregiverLink(patientId, caregiverUserId) {
      return mapCaregiverLink(db.prepare(`
        SELECT * FROM caregiver_links
        WHERE patient_id = ? AND caregiver_user_id = ? AND status = 'active'
      `).get(patientId, caregiverUserId));
    },

    upsertCaregiverLink(payload) {
      const existing = mapCaregiverLink(db.prepare(`
        SELECT * FROM caregiver_links
        WHERE patient_id = ? AND caregiver_user_id = ?
      `).get(payload.patientId, payload.caregiverUserId));
      const now = nowIso();

      if (existing) {
        const relationship = payload.relationship || existing.relationship;
        db.prepare(`
          UPDATE caregiver_links
          SET relationship = ?, status = 'active', updated_at = ?
          WHERE id = ?
        `).run(relationship, now, existing.id);

        return { ...existing, relationship, status: 'active', updatedAt: now };
      }

      const link = {
        id: createId('link'),
        patientId: payload.patientId,
        caregiverUserId: payload.caregiverUserId,
        relationship: payload.relationship || 'Familiar',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      db.prepare(`
        INSERT INTO caregiver_links
          (id, patient_id, caregiver_user_id, relationship, status, notify_on_missed_dose, notify_on_location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        link.id,
        link.patientId,
        link.caregiverUserId,
        link.relationship,
        link.status,
        link.notifyOnMissedDose === false ? 0 : 1,
        link.notifyOnLocation ? 1 : 0,
        link.createdAt,
        link.updatedAt,
      );

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

      db.prepare(`
        INSERT INTO caregiver_invites
          (id, patient_id, name, email, phone, relationship, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invite.id,
        invite.patientId,
        invite.name,
        invite.email,
        invite.phone,
        invite.relationship,
        invite.status,
        invite.createdAt,
        invite.updatedAt,
      );

      return invite;
    },

    listMedications(patientId) {
      return db.prepare(`
        SELECT * FROM medications
        WHERE patient_id = ? AND active = 1
        ORDER BY created_at
      `).all(patientId).map(mapMedication);
    },

    findMedicationById(medicationId) {
      return mapMedication(db.prepare('SELECT * FROM medications WHERE id = ? AND active = 1').get(medicationId));
    },

    listSchedulesForMedication(medicationId) {
      return db.prepare(`
        SELECT * FROM medication_schedules
        WHERE medication_id = ? AND active = 1
        ORDER BY time
      `).all(medicationId).map(mapMedicationSchedule);
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
        instructions: payload.instructions || null,
        imageUri: payload.imageUri || null,
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      transaction(db, () => {
        db.prepare(`
          INSERT INTO medications
            (id, patient_id, name, dose, box_color, ui_color, instructions, image_uri, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          medication.id,
          medication.patientId,
          medication.name,
          medication.dose,
          medication.boxColor,
          medication.uiColor,
          medication.instructions,
          medication.imageUri,
          1,
          medication.createdAt,
          medication.updatedAt,
        );

        (payload.scheduleTimes || ['08:00']).forEach((time) => {
          db.prepare(`
            INSERT INTO medication_schedules
              (id, medication_id, time, confirmation_limit_minutes, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(createId('sched'), medication.id, time, payload.confirmationLimitMinutes || 30, 1, now, now);
        });
      });

      return medication;
    },

    updateMedication(medicationId, payload) {
      const medication = store.findMedicationById(medicationId);
      if (!medication) return null;

      const updated = {
        ...medication,
        name: payload.name || medication.name,
        dose: payload.dose || medication.dose,
        boxColor: payload.boxColor || medication.boxColor,
        uiColor: payload.uiColor || medication.uiColor,
        instructions: payload.instructions !== undefined ? payload.instructions : medication.instructions,
        imageUri: payload.imageUri !== undefined ? payload.imageUri : medication.imageUri,
        updatedAt: nowIso(),
      };

      transaction(db, () => {
        db.prepare(`
          UPDATE medications
          SET name = ?, dose = ?, box_color = ?, ui_color = ?, instructions = ?, image_uri = ?, updated_at = ?
          WHERE id = ?
        `).run(
          updated.name,
          updated.dose,
          updated.boxColor,
          updated.uiColor,
          updated.instructions,
          updated.imageUri,
          updated.updatedAt,
          updated.id,
        );

        if (Array.isArray(payload.scheduleTimes)) {
          db.prepare(`
            UPDATE medication_schedules
            SET active = 0, updated_at = ?
            WHERE medication_id = ?
          `).run(updated.updatedAt, updated.id);

          payload.scheduleTimes.forEach((time) => {
            const now = nowIso();
            db.prepare(`
            INSERT INTO medication_schedules
                (id, medication_id, time, confirmation_limit_minutes, active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(createId('sched'), updated.id, time, payload.confirmationLimitMinutes || 30, 1, now, now);
          });
        }
      });

      return updated;
    },

    deleteMedication(medicationId) {
      const medication = store.findMedicationById(medicationId);
      if (!medication) return null;

      const now = nowIso();
      db.prepare('UPDATE medications SET active = 0, updated_at = ? WHERE id = ?').run(now, medication.id);
      return { ...medication, active: false, updatedAt: now };
    },

    listCheckins(patientId, date) {
      return db.prepare(`
        SELECT * FROM medication_checkins
        WHERE patient_id = ? AND date = ?
      `).all(patientId, date).map(mapMedicationCheckin);
    },

    findCheckin(patientId, medicationId, scheduleId, date) {
      return mapMedicationCheckin(db.prepare(`
        SELECT * FROM medication_checkins
        WHERE patient_id = ? AND medication_id = ? AND schedule_id = ? AND date = ?
      `).get(patientId, medicationId, scheduleId, date));
    },

    upsertCheckin(payload) {
      const existing = store.findCheckin(payload.patientId, payload.medicationId, payload.scheduleId, payload.date);
      const now = nowIso();

      if (existing) {
        db.prepare(`
          UPDATE medication_checkins
          SET status = ?, confirmed_at = ?, confirmed_by_user_id = ?, updated_at = ?
          WHERE id = ?
        `).run(
          payload.status,
          payload.confirmedAt || null,
          payload.confirmedByUserId || null,
          now,
          existing.id,
        );

        return {
          ...existing,
          status: payload.status,
          confirmedAt: payload.confirmedAt || null,
          confirmedByUserId: payload.confirmedByUserId || null,
          updatedAt: now,
        };
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

      db.prepare(`
        INSERT INTO medication_checkins
          (id, patient_id, medication_id, schedule_id, date, status, confirmed_at, confirmed_by_user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        checkin.id,
        checkin.patientId,
        checkin.medicationId,
        checkin.scheduleId,
        checkin.date,
        checkin.status,
        checkin.confirmedAt,
        checkin.confirmedByUserId,
        checkin.createdAt,
        checkin.updatedAt,
      );

      return checkin;
    },

    listAlerts(patientId) {
      return db.prepare(`
        SELECT * FROM alerts
        WHERE patient_id = ?
        ORDER BY created_at DESC
      `).all(patientId).map(mapAlert);
    },

    findAlertById(alertId) {
      return mapAlert(db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId));
    },

    markAlertRead(alertId) {
      const alert = store.findAlertById(alertId);
      if (!alert) return null;

      const now = nowIso();
      db.prepare('UPDATE alerts SET status = ?, updated_at = ? WHERE id = ?').run('read', now, alert.id);
      return { ...alert, status: 'read', updatedAt: now };
    },

    createAlert(payload) {
      const now = nowIso();
      const alert = {
        id: createId('alert'),
        patientId: payload.patientId,
        type: payload.type,
        severity: payload.severity || 'warning',
        title: payload.title,
        description: payload.description,
        detail: payload.detail || null,
        status: payload.status || 'open',
        createdAt: now,
        updatedAt: now,
      };

      db.prepare(`
        INSERT INTO alerts
          (id, patient_id, type, severity, title, description, detail, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alert.id,
        alert.patientId,
        alert.type,
        alert.severity,
        alert.title,
        alert.description,
        alert.detail,
        alert.status,
        alert.createdAt,
        alert.updatedAt,
      );

      return alert;
    },

    findOpenAlertByTypeAndDetail(patientId, type, detail) {
      return mapAlert(db.prepare(`
        SELECT * FROM alerts
        WHERE patient_id = ? AND type = ? AND detail = ? AND status = 'open'
      `).get(patientId, type, detail));
    },

    setPatientLocationSharing(patientId, enabled) {
      const patient = store.findPatientById(patientId);
      if (!patient) return null;

      const now = nowIso();
      db.prepare(`
        UPDATE patients
        SET location_sharing_enabled = ?, updated_at = ?
        WHERE id = ?
      `).run(enabled ? 1 : 0, now, patient.id);

      return { ...patient, locationSharingEnabled: Boolean(enabled), updatedAt: now };
    },

    createLocationEvent(patientId, payload) {
      const now = nowIso();
      const event = {
        id: createId('loc'),
        patientId,
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        accuracyMeters: payload.accuracyMeters ?? payload.accuracy_meters ?? null,
        capturedAt: payload.capturedAt || payload.captured_at || now,
        sentToCaregiver: false,
        createdAt: now,
      };

      db.prepare(`
        INSERT INTO location_events
          (id, patient_id, latitude, longitude, accuracy_meters, captured_at, sent_to_caregiver, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id,
        event.patientId,
        event.latitude,
        event.longitude,
        event.accuracyMeters,
        event.capturedAt,
        event.sentToCaregiver ? 1 : 0,
        event.createdAt,
      );

      return event;
    },

    listLocationEvents(patientId, limit = 20) {
      return db.prepare(`
        SELECT * FROM location_events
        WHERE patient_id = ?
        ORDER BY captured_at DESC
        LIMIT ?
      `).all(patientId, limit).map(mapLocationEvent);
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

      db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
      db.prepare(`
        INSERT INTO sessions (token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `).run(session.token, session.userId, session.expiresAt, session.createdAt);

      return session;
    },

    findSession(token) {
      const session = mapSession(db.prepare('SELECT * FROM sessions WHERE token = ?').get(token));
      if (!session) return null;

      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        store.destroySession(token);
        return null;
      }

      const user = store.findUserById(session.userId);
      if (!user) return null;

      return { session, user };
    },

    destroySession(token) {
      const result = db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return result.changes > 0;
    },
  };

  return store;
}

function resolveDatabasePath(databaseUrl) {
  if (!databaseUrl) {
    return path.resolve(__dirname, '..', '..', 'database', 'medcare.sqlite');
  }

  if (databaseUrl === ':memory:') return databaseUrl;

  if (databaseUrl.startsWith('sqlite://')) {
    return path.resolve(databaseUrl.replace(/^sqlite:\/\//, ''));
  }

  return path.resolve(databaseUrl);
}

function seedIfEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (row.count > 0) return;

  const seed = seedData();

  transaction(db, () => {
    seed.users.forEach((user) => {
      db.prepare(`
        INSERT INTO users (id, role, name, email, phone, password_hash, initials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.role,
        user.name,
        user.email,
        user.phone,
        user.passwordHash,
        user.initials,
        user.createdAt,
        user.updatedAt,
      );
    });

    seed.patients.forEach((patient) => {
      db.prepare(`
        INSERT INTO patients (id, user_id, full_name, access_code, location_sharing_enabled, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patient.id,
        patient.userId,
        patient.fullName,
        patient.accessCode,
        patient.locationSharingEnabled ? 1 : 0,
        patient.active ? 1 : 0,
        patient.createdAt,
        patient.updatedAt,
      );
    });

    seed.caregiverLinks.forEach((link) => {
      db.prepare(`
        INSERT INTO caregiver_links
          (id, patient_id, caregiver_user_id, relationship, status, notify_on_missed_dose, notify_on_location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        link.id,
        link.patientId,
        link.caregiverUserId,
        link.relationship,
        link.status,
        link.notifyOnMissedDose === false ? 0 : 1,
        link.notifyOnLocation ? 1 : 0,
        link.createdAt,
        link.updatedAt,
      );
    });

    seed.caregiverInvites.forEach((invite) => {
      db.prepare(`
        INSERT INTO caregiver_invites
          (id, patient_id, name, email, phone, relationship, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invite.id,
        invite.patientId,
        invite.name,
        invite.email,
        invite.phone,
        invite.relationship,
        invite.status,
        invite.createdAt,
        invite.updatedAt,
      );
    });

    seed.medications.forEach((medication) => {
      db.prepare(`
        INSERT INTO medications
          (id, patient_id, name, dose, box_color, ui_color, instructions, image_uri, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        medication.id,
        medication.patientId,
        medication.name,
        medication.dose,
        medication.boxColor,
        medication.uiColor,
        medication.instructions || null,
        medication.imageUri || null,
        medication.active ? 1 : 0,
        medication.createdAt,
        medication.updatedAt,
      );
    });

    seed.medicationSchedules.forEach((schedule) => {
      db.prepare(`
        INSERT INTO medication_schedules
          (id, medication_id, time, confirmation_limit_minutes, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        schedule.id,
        schedule.medicationId,
        schedule.time,
        schedule.confirmationLimitMinutes || 30,
        schedule.active ? 1 : 0,
        schedule.createdAt,
        schedule.updatedAt,
      );
    });

    seed.medicationCheckins.forEach((checkin) => {
      db.prepare(`
        INSERT INTO medication_checkins
          (id, patient_id, medication_id, schedule_id, date, status, confirmed_at, confirmed_by_user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        checkin.id,
        checkin.patientId,
        checkin.medicationId,
        checkin.scheduleId,
        checkin.date,
        checkin.status,
        checkin.confirmedAt,
        checkin.confirmedByUserId,
        checkin.createdAt,
        checkin.updatedAt,
      );
    });

    seed.alerts.forEach((alert) => {
      db.prepare(`
        INSERT INTO alerts
          (id, patient_id, type, severity, title, description, detail, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alert.id,
        alert.patientId,
        alert.type,
        alert.severity,
        alert.title,
        alert.description,
        alert.detail,
        alert.status,
        alert.createdAt,
        alert.updatedAt,
      );
    });
  });
}

function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE;');

  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

function migrateExistingDatabase(db) {
  ensureColumn(db, 'patients', 'location_sharing_enabled', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'caregiver_links', 'notify_on_missed_dose', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(db, 'caregiver_links', 'notify_on_location', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'medications', 'instructions', 'TEXT');
  ensureColumn(db, 'medications', 'image_uri', 'TEXT');
  ensureColumn(db, 'medication_schedules', 'confirmation_limit_minutes', 'INTEGER NOT NULL DEFAULT 30');
}

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((item) => item.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    initials: row.initials,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPatient(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    accessCode: row.access_code,
    locationSharingEnabled: Boolean(row.location_sharing_enabled),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCaregiverLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    caregiverUserId: row.caregiver_user_id,
    relationship: row.relationship,
    status: row.status,
    notifyOnMissedDose: row.notify_on_missed_dose !== 0,
    notifyOnLocation: Boolean(row.notify_on_location),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedication(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    dose: row.dose,
    boxColor: row.box_color,
    uiColor: row.ui_color,
    instructions: row.instructions,
    imageUri: row.image_uri,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedicationSchedule(row) {
  if (!row) return null;
  return {
    id: row.id,
    medicationId: row.medication_id,
    time: row.time,
    confirmationLimitMinutes: row.confirmation_limit_minutes,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedicationCheckin(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    date: row.date,
    status: row.status,
    confirmedAt: row.confirmed_at,
    confirmedByUserId: row.confirmed_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAlert(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    description: row.description,
    detail: row.detail,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row) {
  if (!row) return null;
  return {
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function mapLocationEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyMeters: row.accuracy_meters,
    capturedAt: row.captured_at,
    sentToCaregiver: Boolean(row.sent_to_caregiver),
    createdAt: row.created_at,
  };
}

module.exports = { createSqliteStore };
