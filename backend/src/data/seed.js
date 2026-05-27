const { addDays, nowIso, todayLocalDate } = require('../utils/dates');
const { hashPassword } = require('../utils/passwords');

function seedData() {
  const now = nowIso();
  const today = todayLocalDate();
  const yesterday = addDays(today, -1);
  const patientCode = 'MARIA-2024';

  return {
    users: [
      {
        id: 'user-patient-maria',
        role: 'patient',
        name: 'Maria Aparecida',
        email: 'maria@email.com',
        phone: '(84) 9 9999-0000',
        initials: 'MA',
        passwordHash: hashPassword('123456', 'seed-patient-salt'),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-caregiver-carlos',
        role: 'caregiver',
        name: 'Carlos',
        email: 'carlos@email.com',
        phone: '(84) 9 9999-1234',
        initials: 'CA',
        passwordHash: hashPassword('123456', 'seed-caregiver-carlos-salt'),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-caregiver-lucia',
        role: 'caregiver',
        name: 'Lucia',
        email: 'lucia@email.com',
        phone: '(84) 9 9988-5678',
        initials: 'LM',
        passwordHash: hashPassword('123456', 'seed-caregiver-lucia-salt'),
        createdAt: now,
        updatedAt: now,
      },
    ],
    patients: [
      {
        id: 'patient-maria',
        userId: 'user-patient-maria',
        fullName: 'Maria Aparecida',
        accessCode: patientCode,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    caregiverLinks: [
      {
        id: 'link-carlos-maria',
        patientId: 'patient-maria',
        caregiverUserId: 'user-caregiver-carlos',
        relationship: 'Filho',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'link-lucia-maria',
        patientId: 'patient-maria',
        caregiverUserId: 'user-caregiver-lucia',
        relationship: 'Filha',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    caregiverInvites: [],
    medications: [
      {
        id: 'med-losartana',
        patientId: 'patient-maria',
        name: 'Losartana 50mg',
        dose: '1 comprimido',
        boxColor: 'Caixa branca',
        uiColor: '#e6f0ff',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med-metformina',
        patientId: 'patient-maria',
        name: 'Metformina 500mg',
        dose: '1 comprimido',
        boxColor: 'Caixa amarela',
        uiColor: '#fff3e0',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med-acido-folico',
        patientId: 'patient-maria',
        name: 'Acido Folico 5mg',
        dose: '1 comprimido',
        boxColor: 'Caixa verde',
        uiColor: '#e6f7ee',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med-sinvastatina',
        patientId: 'patient-maria',
        name: 'Sinvastatina 20mg',
        dose: '1 comprimido',
        boxColor: 'Caixa rosa',
        uiColor: '#fce4ec',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    medicationSchedules: [
      schedule('sched-losartana-0800', 'med-losartana', '08:00', now),
      schedule('sched-losartana-2000', 'med-losartana', '20:00', now),
      schedule('sched-metformina-0800', 'med-metformina', '08:00', now),
      schedule('sched-metformina-1200', 'med-metformina', '12:00', now),
      schedule('sched-acido-folico-0800', 'med-acido-folico', '08:00', now),
      schedule('sched-sinvastatina-2200', 'med-sinvastatina', '22:00', now),
    ],
    medicationCheckins: [
      checkin('patient-maria', 'med-losartana', 'sched-losartana-0800', today, 'user-patient-maria', now),
      checkin('patient-maria', 'med-metformina', 'sched-metformina-0800', today, 'user-patient-maria', now),
      checkin('patient-maria', 'med-acido-folico', 'sched-acido-folico-0800', today, 'user-patient-maria', now),
    ],
    alerts: [
      {
        id: 'alert-sinvastatina-missed',
        patientId: 'patient-maria',
        type: 'missed_medication',
        severity: 'warning',
        title: 'Lembrete nao confirmado',
        description: `Sinvastatina - previsto para 22:00 em ${yesterday}`,
        detail: 'Carlos foi notificado automaticamente.',
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'alert-all-taken-yesterday',
        patientId: 'patient-maria',
        type: 'daily_success',
        severity: 'success',
        title: 'Todos os remedios tomados',
        description: `${yesterday} - 20:05`,
        detail: null,
        status: 'read',
        createdAt: now,
        updatedAt: now,
      },
    ],
    sessions: [],
  };
}

function schedule(id, medicationId, time, now) {
  return {
    id,
    medicationId,
    time,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

function checkin(patientId, medicationId, scheduleId, date, confirmedByUserId, now) {
  return {
    id: `checkin-${date}-${medicationId}-${scheduleId}`,
    patientId,
    medicationId,
    scheduleId,
    date,
    status: 'taken',
    confirmedAt: now,
    confirmedByUserId,
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = { seedData };
