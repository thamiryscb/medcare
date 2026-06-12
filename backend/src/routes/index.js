const {
  currentProfile,
  loginCaregiver,
  loginPatient,
  registerCaregiver,
  registerPatient,
} = require('../services/authService');
const { getCaregiverDashboard, getPatientDashboard } = require('../services/dashboardService');
const {
  createMedication,
  deleteMedication,
  listMedications,
  updateMedication,
} = require('../services/medicationService');
const { getChecklistForDate, markChecklistItemTaken } = require('../services/checklistService');
const { createFamilyInvite, listFamily } = require('../services/familyService');
const { listAlerts, markAlertRead } = require('../services/alertService');
const {
  createLocationEvent,
  listLocationEvents,
  updateLocationSharing,
} = require('../services/locationService');

function registerRoutes(router) {
  router.get('/api/health', () => ({
    status: 'ok',
    service: 'medcare-backend',
    timestamp: new Date().toISOString(),
  }));

  router.post('/api/auth/patient/login', (ctx) => loginPatient(ctx.store, ctx.body, ctx.env));
  router.post('/api/auth/family/login', (ctx) => loginCaregiver(ctx.store, ctx.body, ctx.env));
  router.post('/api/auth/patient/register', (ctx) => registerPatient(ctx.store, ctx.body, ctx.env));
  router.post('/api/auth/family/register', (ctx) => registerCaregiver(ctx.store, ctx.body, ctx.env));

  router.post('/api/auth/logout', (ctx) => {
    ctx.store.destroySession(ctx.session.token);
    return { ok: true };
  }, { auth: true });

  router.get('/api/me', (ctx) => currentProfile(ctx.store, ctx.actor), { auth: true });

  router.get('/api/patients/me/dashboard', (ctx) => getPatientDashboard(ctx.store, ctx.actor), { auth: true });
  router.get('/api/family/dashboard', (ctx) => (
    getCaregiverDashboard(ctx.store, ctx.actor, ctx.query.patientId)
  ), { auth: true });

  router.get('/api/patients/:patientId/medications', (ctx) => (
    listMedications(ctx.store, ctx.actor, ctx.params.patientId)
  ), { auth: true });

  router.post('/api/patients/:patientId/medications', (ctx) => (
    { status: 201, body: createMedication(ctx.store, ctx.actor, ctx.params.patientId, ctx.body) }
  ), { auth: true });

  router.patch('/api/medications/:medicationId', (ctx) => (
    updateMedication(ctx.store, ctx.actor, ctx.params.medicationId, ctx.body)
  ), { auth: true });

  router.delete('/api/medications/:medicationId', (ctx) => (
    deleteMedication(ctx.store, ctx.actor, ctx.params.medicationId)
  ), { auth: true });

  router.get('/api/patients/:patientId/checklist', (ctx) => (
    getChecklistForDate(ctx.store, ctx.actor, ctx.params.patientId, ctx.query.date)
  ), { auth: true });

  router.patch('/api/checklist/:itemId/taken', (ctx) => (
    markChecklistItemTaken(ctx.store, ctx.actor, ctx.params.itemId, ctx.body)
  ), { auth: true });

  router.get('/api/patients/:patientId/family', (ctx) => (
    listFamily(ctx.store, ctx.actor, ctx.params.patientId)
  ), { auth: true });

  router.post('/api/patients/:patientId/family', (ctx) => (
    { status: 201, body: createFamilyInvite(ctx.store, ctx.actor, ctx.params.patientId, ctx.body) }
  ), { auth: true });

  router.get('/api/patients/:patientId/alerts', (ctx) => (
    listAlerts(ctx.store, ctx.actor, ctx.params.patientId)
  ), { auth: true });

  router.patch('/api/alerts/:alertId/read', (ctx) => (
    markAlertRead(ctx.store, ctx.actor, ctx.params.alertId)
  ), { auth: true });

  router.get('/api/patients/:patientId/locations', (ctx) => (
    listLocationEvents(ctx.store, ctx.actor, ctx.params.patientId, ctx.query)
  ), { auth: true });

  router.post('/api/patients/:patientId/locations', (ctx) => (
    { status: 201, body: createLocationEvent(ctx.store, ctx.actor, ctx.params.patientId, ctx.body) }
  ), { auth: true });

  router.patch('/api/patients/:patientId/location-sharing', (ctx) => (
    updateLocationSharing(ctx.store, ctx.actor, ctx.params.patientId, ctx.body)
  ), { auth: true });
}

module.exports = { registerRoutes };
